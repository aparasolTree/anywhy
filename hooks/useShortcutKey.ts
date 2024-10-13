import { useEffect } from "preact/hooks";
import { isString } from "../utils/common.ts";
import { useMemoizeFn } from "./useMemoizeFn.ts";

export type Modifier = "ctrl" | "meta" | "shift" | "alt";
export type KeyboardEventHandle = (event: KeyboardEvent) => void;
export type Key = string | string[];
export interface KeyboardOptions {
    modifier?: Modifier | Modifier[];
    once?: boolean;
    passive?: boolean;
    eventName?: "keydown" | "keyup" | "keypress";
}

function guardModifier(event: KeyboardEvent, modifiers: Modifier[]) {
    if (modifiers.length === 0) return true;
    return modifiers.every((modifier) => event[`${modifier}Key`]);
}

export function useShortcutKey(
    key: Key,
    callback: KeyboardEventHandle,
    { modifier, once, passive, eventName = "keyup" }: KeyboardOptions = {},
) {
    const cachedFn = useMemoizeFn(callback);
    const k = typeof key === "string" ? [key] : key;
    const modifiers = Array.isArray(modifier) ? modifier : isString(modifier) ? [modifier] : [];

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.repeat) return;
            if (!guardModifier(event, modifiers)) return;
            if (k.includes(event.key)) {
                event.preventDefault();
                cachedFn(event);
            }
        };
        document.addEventListener(eventName, handler, { once, passive });
        return () => {
            document.removeEventListener(eventName, handler);
        };
    }, [...k, ...modifiers, once, passive, eventName, cachedFn]);
}
