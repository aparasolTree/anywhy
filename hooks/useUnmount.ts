import { useEffect } from "preact/hooks";
import { useMemoizeFn } from "./useMemoizeFn.ts";

export function useUnmount(effectClear: () => void) {
    const cachedEffectClear = useMemoizeFn(effectClear);
    useEffect(() => {
        return cachedEffectClear;
    }, []);
}
