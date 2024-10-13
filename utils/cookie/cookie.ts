import { assert, expiresWarn } from "../common.ts";
import { sign, unsign } from "./sign.ts";
import { escape, unescape } from "./escape.ts";

export interface CookieOptions {
    domain?: string;
    path?: string;
    sameSite?: "Strict" | "Lax" | "None";
    expires?: Date;
    maxAge?: number;
    secure?: boolean;
    httpOnly?: boolean;
    secret?: string;
    partitioned?: boolean;
}

export interface Cookie<T> {
    readonly name: string;
    readonly isSigined: boolean;
    readonly expires?: Date;
    parse(cookieString?: string | null): Promise<T | null>;
    commit(value?: T, options?: CookieOptions): Promise<string>;
}

const COOKIE_NAME_EXP = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const SAME_SITE: CookieOptions["sameSite"][] = ["Lax", "None", "Strict"];

function parseCookie(cookieString: string) {
    const result: Record<string, string> = {};
    for (const cookie of cookieString.split(";")) {
        const [key, ...value] = cookie.split("=");
        assert(key != null);
        result[key.trim()] = value.join("=");
    }
    return result;
}

function serializeCookie(
    name: string,
    value: string,
    options: Omit<CookieOptions, "secret">,
) {
    if (!name) return "";
    if (!COOKIE_NAME_EXP.test(name)) {
        throw new Error("invalid cookie name: " + name);
    }
    const output: string[] = [];
    output.push(`${name}=${value}`);

    if (options.partitioned) output.push("Partitioned");
    if (options.secure) output.push("Secure");
    if (options.httpOnly) output.push("HttpOnly");
    if (
        typeof options.maxAge === "number" && Number.isInteger(options.maxAge)
    ) {
        assert(
            options.maxAge >= 0,
            "Max-Age must bt an integer superior or equal to 0",
        );
        output.push(`Max-Age=${options.maxAge}`);
    }
    if (options.sameSite) {
        assert(
            SAME_SITE.includes(options.sameSite),
            "invalid options sameSite",
        );
        output.push(`SameSite=${options.sameSite}`);
    }
    if (options.path) output.push(`Path=${options.path}`);
    if (options.expires) {
        output.push(`Expires=${options.expires.toUTCString()}`);
    }
    return output.join(";");
}

export function createCookie<T>(
    name: string,
    cookieOptions: CookieOptions = {},
): Cookie<T> {
    const { secret = "", ...options } = Object.assign(
        {},
        { path: "/", sameSite: "Lax" },
        cookieOptions,
    );
    expiresWarn(options.expires);
    return {
        get name() {
            return name;
        },
        get isSigined() {
            return secret !== "";
        },
        get expires() {
            return options.maxAge ? new Date(Date.now() + options.maxAge * 1000) : options.expires;
        },

        async parse(cookieString) {
            if (!cookieString) return null;
            const parsedCoookieRecord = parseCookie(cookieString);
            return name in parsedCoookieRecord &&
                    parsedCoookieRecord[name] !== ""
                ? await unsignCookieValue(
                    parsedCoookieRecord[name],
                    secret,
                )
                : null;
        },
        async commit(value, opts) {
            return serializeCookie(
                name,
                value == void 0 ? "" : await signCookieValue<T>(value, secret),
                { ...options, ...opts },
            );
        },
    };
}

async function unsignCookieValue(cookie: string, secret: string) {
    if (secret.length > 0) {
        const value = cookie.slice(0, cookie.lastIndexOf("."));
        const hash = cookie.slice(cookie.lastIndexOf(".") + 1);
        const signature = await unsign(value, hash, secret);
        if (signature !== false) {
            return tryDecodeCookie(value);
        }
        return null;
    }
    return tryDecodeCookie(cookie);
}

export function tryDecodeCookie(value: string) {
    try {
        return JSON.parse(unescape(decodeURIComponent(atob(value))));
    } catch (_error) {
        return null;
    }
}

export function tryEncodeCookie(value: unknown) {
    try {
        return btoa(encodeURIComponent(escape(JSON.stringify(value))));
    } catch {
        return "";
    }
}

async function signCookieValue<T>(cookie: T, secret: string) {
    let encoded = tryEncodeCookie(cookie);
    const tempEncoded = encoded;
    if (secret.length > 0) {
        encoded = await sign(encoded, secret);
        encoded = tempEncoded + "." + encoded;
    }
    return encoded;
}
