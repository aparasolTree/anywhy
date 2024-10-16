import { isBigInt, isBoolean, isNumber, isString, isSymbol } from "./common.ts";
import { ImageEntry } from "./type.ts";

const kvCache = new Map<string, Map<Deno.KvKey, unknown>>();
export function createKvCache<T>(id: string) {
    let cachedMap = kvCache.get(id);
    if (!cachedMap) kvCache.set(id, cachedMap = new Map());
    return {
        clear: () => (cachedMap.clear(), kvCache.delete(id)),
        set: (key: Deno.KvKey, value: T) => (cachedMap.set(key, value), value),
        get: (key: Deno.KvKey) => {
            const keys = Array.from(cachedMap.keys());
            const keysLength = keys.length;
            for (let i = 0; i < keysLength; i++) {
                if (compareDenoKvKey(keys[i], key)) {
                    return cachedMap.get(keys[i]) as T;
                }
            }
            return null;
        },
    };
}

export const imageKvCache = createKvCache<ImageEntry[]>("image");

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
