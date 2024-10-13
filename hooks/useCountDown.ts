import { useCallback, useRef, useState } from "preact/hooks";
import { useLatest } from "./useLatest.ts";
import { useUnmount } from "./useUnmount.ts";

export function useCountDown(start: number, end: number = 0) {
    const [count, setCount] = useState(start);
    const countRef = useLatest(count);
    const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

    const clear = useCallback(() => intervalId.current && clearInterval(intervalId.current), []);
    const startInterval = useCallback((onEnd?: () => void) => {
        intervalId.current = setInterval(() => {
            if (countRef.current <= end) {
                clear();
                onEnd?.();
                return;
            }
            setCount((count) => count - 1);
        }, 1000);
    }, [end, clear]);

    useUnmount(clear);

    return [
        count,
        {
            start: startInterval,
            clear,
        },
    ] as const;
}
