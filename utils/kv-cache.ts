import { isBigInt, isBoolean, isNumber, isString, isSymbol } from "./common.ts";

const kvCache: Map<Deno.KvKey, unknown> = new Map();

export const clearCache = () => kvCache.clear();
export function getCacheByKvKey<T>(key: Deno.KvKey) {
    const keys = Array.from(kvCache.keys());
    const keysLength = keys.length;
    for (let i = 0; i < keysLength; i++) {
        if (compareDenoKvKey(keys[i], key)) {
            return kvCache.get(keys[i]) as T;
        }
    }
    return null;
}

export function setCacheByKvKey<T>(key: Deno.KvKey, value: T) {
    kvCache.set(key, value);
    return value;
}

function compareDenoKvKey(key1: Deno.KvKey, key2: Deno.KvKey) {
    if (key1.length !== key2.length) return false;
    const key1Length = key1.length;
    for (let i = 0; i < key1Length; i++) {
        const value1 = key1[i], value2 = key2[i];
        if (isString(value1) || isNumber(value1) || isBoolean(value1) || isBigInt(value1) || isSymbol(value1)) {
            if (value1 !== value2) return false;
        } else if (value1 instanceof Uint8Array && value2 instanceof Uint8Array) {
            if (value1.length !== value2.length) return false;
            const value1Length = value1.length;
            for (let j = 0; j < value1Length; j++) {
                if (value1[j] !== value2[j]) return false;
            }
        } else {
            return false;
        }
    }
    return true;
}
