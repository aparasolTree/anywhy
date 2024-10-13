import { useLayoutEffect, useState } from "preact/hooks";
import { Size } from "../utils/type.ts";
import { useMemoizeFn } from "./useMemoizeFn.ts";
import { defaultWindow } from "../utils/constant.ts";

export function useWindowSizeCallback(callback: (size: Size) => void) {
    const cachedFn = useMemoizeFn(callback);
    useLayoutEffect(() => {
        if (!defaultWindow) return;
        function updateSize() {
            const { innerWidth, innerHeight } = defaultWindow;
            cachedFn({
                width: innerWidth,
                height: innerHeight,
            });
        }
        updateSize();
        defaultWindow.addEventListener("resize", updateSize);
        return () => {
            defaultWindow.removeEventListener("resize", updateSize);
        };
    }, [cachedFn]);
}

export function useWindowSize() {
    const [size, setSize] = useState<Size>({ height: 0, width: 0 });
    useWindowSizeCallback(setSize);
    return size;
}
