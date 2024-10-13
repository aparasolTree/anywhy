import { useLayoutEffect, useRef } from "preact/hooks";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.ts";
import { AnyFuncion } from "../utils/type.ts";

interface LoadMoreProps {
    onFetchMore: (unobserver: AnyFuncion) => void;
}
export function LoadMore({ onFetchMore }: LoadMoreProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { observer, unobserver } = useIntersectionObserver((entries) => {
        for (const { target, isIntersecting } of entries) {
            if (target === ref.current && isIntersecting) {
                onFetchMore(() => unobserver(target));
            }
        }
    });
    useLayoutEffect(() => {
        const element = ref.current;
        if (element) {
            observer(element);
            return () => {
                unobserver(element);
            };
        }
    }, [observer, unobserver]);

    return (
        <div ref={ref} class="h-1 bg-transparent">
        </div>
    );
}