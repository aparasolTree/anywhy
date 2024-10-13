import { useEffect, useRef } from "preact/hooks";
import { useMemoizeFn } from "./useMemoizeFn.ts";

export function useClickOutside<T extends HTMLElement>(callback: () => void) {
    const ref = useRef<T>(null);
    const cachedFn = useMemoizeFn(callback);
    useEffect(() => {
        const ele = ref.current;
        if (ele) {
            const handler = (event: MouseEvent) => {
                const target = event.target as HTMLElement;
                if (target && !ele.contains(target) && document.body.contains(target)) {
                    cachedFn();
                }
            };
            document.addEventListener("click", handler);
            return () => {
                document.removeEventListener("click", handler);
            };
        }
    }, [cachedFn]);
    return ref;
}
