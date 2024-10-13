import { useState } from "preact/hooks";
import { useMemoizeFn } from "./useMemoizeFn.ts";
import { isFunction } from "../utils/common.ts";

// deno-lint-ignore no-explicit-any
export function useSetState<T extends Record<any, any>>(initState: T | (() => T)) {
    const [state, setState] = useState(initState);
    const newSetState = useMemoizeFn((state: Partial<T> | ((s: T) => Partial<T>)) => {
        setState((prevState) => {
            const newState = isFunction(state) ? state(prevState) : state;
            return {
                ...prevState,
                ...newState,
            };
        });
    });
    return [state, newSetState] as const;
}
