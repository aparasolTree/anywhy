import { Inputs, useEffect } from "preact/hooks";
import { getErrorMessage } from "../utils/common.ts";
import { useSetState } from "./useSetState.ts";
import { useMemoizeFn } from "./useMemoizeFn.ts";

type PromiseState<T> = { status: "error" | "loading" | "idle"; data: T | null; msg?: string };
function resolvePromise<T>(promise: Promise<T> | (() => Promise<T> | T)) {
    if (typeof promise === "function") return promise();
    return promise;
}
export interface UsePromiseOptions {
    loadingAwait?: number;
}
export function usePromise<T>(
    promise: (() => Promise<T> | T) | Promise<T>,
    inputs: Inputs,
    options: UsePromiseOptions = {},
) {
    const { loadingAwait = 500 } = options;
    const [state, setState] = useSetState<PromiseState<T>>({ data: null, status: "idle" });
    const cachedPromsie = useMemoizeFn(() => resolvePromise(promise));
    useEffect(() => {
        let cancelFlag = false;
        const timeoutId = setTimeout(() => setState({ data: null, status: "loading" }), loadingAwait);
        (async () => {
            try {
                const data = await cachedPromsie();
                if (!cancelFlag) {
                    clearTimeout(timeoutId);
                    setState({ data, status: "idle" });
                }
            } catch (error) {
                clearTimeout(timeoutId);
                setState({ data: null, status: "error", msg: getErrorMessage(error) });
            }
        })();
        return () => {
            cancelFlag = true;
            clearTimeout(timeoutId);
        };
    }, inputs);

    return state;
}
