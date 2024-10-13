import { useCallback } from "preact/hooks";
import { useLatest } from "./useLatest.ts";

import { AnyFuncion } from "../utils/type.ts";

export function useMemoizeFn<T extends AnyFuncion>(fn?: T) {
    const fnRef = useLatest(fn);
    return useCallback((...args: Parameters<T>) => {
        return fnRef.current?.(...args);
    }, []);
}
