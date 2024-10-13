import { AnyFuncion } from "./type.ts";

export function throttle<T extends AnyFuncion>(fn: T, interval: number) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let firstInvoke = true;
    return (...args: Parameters<T>) => {
        if (firstInvoke) {
            firstInvoke = false;
            fn.apply(null, args);
            return;
        }
        if (!timeoutId) {
            timeoutId = setTimeout(() => {
                fn.apply(null, args);
                timeoutId = null;
            }, interval);
        }
    };
}
