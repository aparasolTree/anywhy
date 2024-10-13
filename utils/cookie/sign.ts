const encoder = new TextEncoder();

export async function sign(value: string, secret: string) {
    const data = encoder.encode(value);
    const key = await createKey(secret, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", key, data);
    return btoa(String.fromCodePoint(...new Uint8Array(signature)))
        .replace(/=+$/, "");
}

export async function unsign(value: string, hash: string, secrst: string) {
    hash = atob(hash);
    const data = encoder.encode(value);
    const key = await createKey(secrst, ["verify"]);
    const signature = new Uint8Array(hash.length).map((_, index) => hash[index].codePointAt(0)!);
    return crypto.subtle.verify("HMAC", key, signature, data);
}

function createKey(srcret: string, usages: CryptoKey["usages"]) {
    return crypto.subtle.importKey(
        "raw",
        encoder.encode(srcret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        usages,
    );
}
