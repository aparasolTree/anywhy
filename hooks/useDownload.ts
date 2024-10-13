import { useCallback, useEffect, useRef } from "preact/hooks";
import { useSetState } from "./useSetState.ts";
import { noop } from "../utils/common.ts";
import { concat } from "@std/bytes/concat";
import { useMemoizeFn } from "./useMemoizeFn.ts";

export interface UseDownlaodOptions {
    immediately?: boolean;
    onDone?: (buffer: Uint8Array) => void;
}

const enter = new TextEncoder().encode("\n")[0];
export function useDownload(url: RequestInfo | URL, options: UseDownlaodOptions = {}) {
    const { immediately = true, onDone = noop } = options;
    const [state, setState] = useSetState({ total: 0.01, loaded: 0 });

    const cachedOnDone = useMemoizeFn(onDone);
    const cancelRef = useRef(noop);
    const download = useCallback(async () => {
        cancelRef.current();
        const abortController = new AbortController();
        cancelRef.current = () => abortController.abort();
        const response = await fetch(url, { signal: abortController.signal });
        const total = Number(response.headers.get("X-Rows")) || 0.01;
        setState({ total });
        const reader = response.body!.getReader();
        const result: Uint8Array[] = [];
        let surplus: Uint8Array = new Uint8Array();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            surplus = concat([surplus, value]);
            let lastIndex = 0;
            for (let i = 0; i < surplus.byteLength; i++) {
                if (surplus[i] === enter) {
                    result.push(surplus.slice(lastIndex, i + 1));
                    lastIndex = i + 1;
                    setState((prev) => ({ loaded: prev.loaded + 1 }));
                }
            }
            surplus = surplus.slice(lastIndex);
        }
        cachedOnDone(concat(result));
    }, [url]);

    useEffect(() => {
        if (immediately) download();
        return () => {
            cancelRef.current();
        };
    }, [immediately, download]);

    return [
        state,
        {
            download,
            cancel: useCallback(() => cancelRef.current(), []),
        },
    ] as const;
}
