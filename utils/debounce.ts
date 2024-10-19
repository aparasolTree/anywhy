import { AnyFuncion } from "./type.ts";

interface Options {
    signal?: AbortSignal;
}
export function debounce<F extends AnyFuncion>(func: F, delay: number, { signal }: Options = {}) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    function debounced(...args: Parameters<F>) {
        if (timeoutId !== null) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            if (signal?.aborted) return;
            func(...args);
            timeoutId = null;
        }, delay);
    }
    debounced.cancel = () => (timeoutId && clearTimeout(timeoutId), timeoutId = null);

    signal?.addEventListener("abort", () => debounced.cancel());
    return debounced;
}
