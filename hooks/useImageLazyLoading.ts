import { useCallback } from "preact/hooks";
import { useIntersectionObserver } from "./useIntersectionObserver.ts";

const weakMap = new WeakMap<Element, string>();
export function useImageLazyLoading() {
    const { observer, unobserver } = useIntersectionObserver((entries, observer) => {
        for (const { isIntersecting, target } of entries) {
            if (!isIntersecting) continue;
            const src = weakMap.get(target);
            if (src) {
                target.setAttribute("src", src);
                observer.unobserve(target);
                weakMap.delete(target);
            }
        }
    });

    return useCallback((target: Element, src: string) => {
        observer(target);
        weakMap.set(target, src);
        return () => {
            unobserver(target);
            weakMap.delete(target);
        };
    }, [observer]);
}
