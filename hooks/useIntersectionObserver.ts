import { useLayoutEffect, useMemo, useRef } from "preact/hooks";
import { useLatest } from "./useLatest.ts";
import { useMemoizeFn } from "./useMemoizeFn.ts";

export function useIntersectionObserver(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    const cachedFn = useMemoizeFn(callback);
    const optionsRef = useLatest(options);
    const intersectionRef = useRef<IntersectionObserver | null>(null);
    useLayoutEffect(() => {
        const options = optionsRef.current;
        intersectionRef.current = new IntersectionObserver(cachedFn, options);
        return () => {
            intersectionRef.current?.disconnect();
        };
    }, [cachedFn]);

    return useMemo(() => {
        const observer = (target: Element) => intersectionRef.current?.observe(target);
        const unobserver = (target: Element) => intersectionRef.current?.unobserve(target);
        return {
            observer,
            unobserver,
        };
    }, []);
}
