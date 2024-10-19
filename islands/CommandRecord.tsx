import { useEffect, useRef } from "preact/hooks";
import { ComponentChild } from "preact";
import { formatDate } from "../utils/formatDate.ts";
import { debounce } from "../utils/debounce.ts";

export function CommandRecord({ command, children }: { command: string; children?: ComponentChild }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const scrollIntoView = () => element?.scrollIntoView({ behavior: "smooth", block: "start" });
        const mutationObserver = new MutationObserver(debounce(scrollIntoView, 20));
        mutationObserver.observe(element, { childList: true, subtree: true, characterData: true, attributes: true });
        scrollIntoView();
        return () => {
            mutationObserver.disconnect();
        };
    }, []);
    return (
        <div class="w-full relative" ref={ref}>
            <p class="text-base text-start mb-2 flex justify-between py-1">
                <span>
                    <span class="text-lg mr-3 text-sky-500">{"$_>"}</span>
                    <span class="text-green-500">{command}</span>
                </span>
                <span class="text-sm text-gray-500">{formatDate(new Date(), "HH:mm:ss")}</span>
            </p>
            <div class="mt-2">
                {children}
            </div>
        </div>
    );
}
