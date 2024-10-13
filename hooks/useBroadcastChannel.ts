import { useCallback, useEffect, useRef } from "preact/hooks";
import { useMemoizeFn } from "./useMemoizeFn.ts";

export function useBroadcastChannel<T>(
    name: string,
    callback: (e: MessageEvent<T>) => void,
) {
    const cachedFn = useMemoizeFn(callback);
    const channelRef = useRef<BroadcastChannel>();
    useEffect(() => {
        channelRef.current = new BroadcastChannel(name);
        const onmessage = (event: MessageEvent<T>) => cachedFn(event);
        channelRef.current.addEventListener("message", onmessage);
        return () => {
            channelRef.current?.removeEventListener(
                "message",
                onmessage,
            );
        };
    }, [name, cachedFn]);

    return useCallback(
        (message?: T) => channelRef.current?.postMessage(message),
        [],
    );
}
