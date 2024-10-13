import { getEnvVar } from "./common.ts";

const algorithm = "AES-GCM";
const UTF8 = "utf-8";

function hexToBytes(hex: string) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes: Uint8Array) {
    return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const uuid = () => crypto.randomUUID();

function textToArrayBuffer(text: string) {
    return new TextEncoder().encode(text);
}

function arrayBufferToText(buffer: ArrayBuffer) {
    return new TextDecoder(UTF8).decode(buffer);
}

async function getEncryptionKey(secret: string) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "PBKDF2" },
        false,
        ["deriveKey"],
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("salt"),
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        {
            name: algorithm,
            length: 256,
        },
        false,
        ["encrypt", "decrypt"],
    );
}

export async function encrypt(text: string) {
    const secret = getEnvVar("VERIFY_LINK_SECRET");
    const key = await getEncryptionKey(secret);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedText = textToArrayBuffer(text);

    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: algorithm,
            iv: iv,
        },
        key,
        encodedText,
    );

    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const authTag = encryptedBytes.slice(-16);
    const ciphertext = encryptedBytes.slice(0, -16);

    return `${bytesToHex(iv)}:${bytesToHex(authTag)}:${bytesToHex(ciphertext)}`;
}

export async function decrypt(encryptedText: string) {
    const secret = getEnvVar("VERIFY_LINK_SECRET");
    const key = await getEncryptionKey(secret);

    const [ivHex, authTagHex, ciphertextHex] = encryptedText.split(":");
    if (!ivHex || !authTagHex || !ciphertextHex) {
        throw new Error("Invalid text.");
    }

    const iv = hexToBytes(ivHex);
    const authTag = hexToBytes(authTagHex);
    const ciphertext = hexToBytes(ciphertextHex);

    const encryptedData = new Uint8Array([...ciphertext, ...authTag]);

    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: algorithm,
            iv: iv,
        },
        key,
        encryptedData,
    );

    return arrayBufferToText(decryptedBuffer);
}
