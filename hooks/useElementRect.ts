import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { useMemoizeFn } from "./useMemoizeFn.ts";

export type Rect = { width: number; height: number; x: number; y: number };
export function useElementRectCallback<T extends Element>(callback: (size: Rect) => void) {
    const ref = useRef<T>(null);
    const cachedFn = useMemoizeFn(callback);
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;
        function updateRect() {
            const { width, height, x, y } = element!.getBoundingClientRect();
            cachedFn({
                width,
                height,
                x,
                y,
            });
        }
        updateRect();
        const resizeObserver = new ResizeObserver(updateRect);
        resizeObserver.observe(element);
        return () => {
            resizeObserver.disconnect();
        };
    }, [cachedFn]);

    return ref;
}

export function useElementRect<E extends Element>() {
    const [size, setSize] = useState<Rect>({ width: 0, height: 0, x: 0, y: 0 });
    const ref = useElementRectCallback<E>(setSize);
    return [size, ref] as const;
}
