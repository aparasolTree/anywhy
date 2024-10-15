import { badRequest } from "./response.ts";

class AssertionError extends Error {
    override name: string = "AssertionError";
    constructor(message?: string) {
        super(message);
    }
}

export function assert(ok: boolean, message: string = ""): asserts ok {
    if (!ok) {
        throw new AssertionError(message);
    }
}

export function expiresWarn(expires?: Date) {
    if (expires) {
        console.warn(
            "I don't recommend that you pass expires in the options parameter of createCookieSession because there is a time difference between it and when you submit the session.",
        );
    }
}

export function getEnvVar(key: string, defVal: string = `${key}-default-val`) {
    const has = Deno.env.has(key);
    if (has) return Deno.env.get(key)!;
    else {
        if (Deno.env.get("DENO-ENV") === "production") {
            throw new Error(`${key}： 环境变量不存在`);
        }
    }
    return defVal;
}

export function getDomain(request: Request) {
    const host = request.headers.get("X-Forwarded-Host") ||
        request.headers.get("host");
    if (!host) {
        throw new Error("无法确定域名 URL.");
    }
    const protocol = host.includes("127.0.0.1") ||
            host.includes("localhost")
        ? "http"
        : "https";
    return `${protocol}://${host}`;
}

const toString = (value: unknown) => Object.prototype.toString.call(value);
const getRaw = (value: unknown) => toString(value).slice(8, -1).toLowerCase();

// deno-lint-ignore ban-types
export const isFunction = (val: unknown): val is Function => getRaw(val) === "function";
export const isString = (val: unknown): val is string => getRaw(val) === "string";
export const isNumber = (val: unknown): val is number => getRaw(val) === "number";
export const isBoolean = (val: unknown): val is number => getRaw(val) === "boolean";
export const isBigInt = (val: unknown): val is number => getRaw(val) === "bigint";
export const isSymbol = (val: unknown): val is number => getRaw(val) === "symbol";
export const isFile = (val: unknown): val is File => getRaw(val) === "file";
export const isArray = Array.isArray;
// deno-lint-ignore no-explicit-any
export const isObject = (val: unknown): val is Record<any, any> => typeof val === "object" && val !== null;
export const isResponse = (value: unknown): value is Response => {
    return getRaw(value) === "response" &&
        typeof value === "object" &&
        value !== null &&
        "ok" in value &&
        "status" in value &&
        typeof (value as Response).json === "function";
};

export const noop = () => {};

export type SizeUnit = "byte" | "kb" | "mb";
const units: SizeUnit[] = ["kb", "mb"];
export function bytesConversion(bytes: number) {
    for (let i = 0; i < units.length; i++) {
        if (bytes <= Math.pow(1024, i + 2)) {
            return Math.ceil(bytes / Math.pow(1024, i + 1)) + " " +
                units[i].toLowerCase();
        }
    }
    return bytes + " byte";
}

export function clamp(current: number, min: number, max: number) {
    return Math.max(min, Math.min(max, current));
}

export const validateNumber = (value: string, paramName: string) => {
    const num = Number(value);
    if (isNaN(num) || !Number.isSafeInteger(num)) {
        throw badRequest(`<${paramName}> 必须是一个数字`);
    }
    return num;
};

export function pick<T extends object, K extends (keyof T)>(obj: T, keys: K[]) {
    if (keys.length === 0) return obj;
    const errorKey = keys.find((k) => !Object.hasOwn(obj, k));
    if (errorKey) throw new Error(`${String(errorKey)} 不是传入对象的key`);
    return Object.fromEntries(
        Object.entries(obj).filter(([key]) => {
            return keys.includes(key as K);
        }),
    ) as Pick<T, K>;
}

export function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

export function pipeline<T>(val: T, fns: ((val: T) => T)[]) {
    return fns.reduce((acc, fn) => fn(acc), val);
}

export const filterCommandArgsReg = /^(\w+)\s*?(<|>|==|!=|>=|<=)\s*?(\w+)$/;
export const removeQuoteReg = /("|')([\s\S]+)(\1)/g;
export const allowClearCommands = ["all", "user", "image"];

export function createFetcherURL(url: string, searchParams: Record<string, string | number | string[] | undefined>) {
    const address = new URL(url, location.origin);
    for (const [key, val] of Object.entries(searchParams)) {
        if (typeof val === "undefined") continue;
        address.searchParams.append(key, Array.isArray(val) ? val.join(",") : String(val));
    }
    return address;
}
