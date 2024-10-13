import { useEffect, useRef } from "preact/hooks";

export function useScrollToLastElementChild<T extends Element>() {
    const ref = useRef<T>(null);
    useEffect(() => {
        const element = ref.current;
        if (element) {
            const mutationObserver = new MutationObserver((entries) => {
                for (const { type } of entries) {
                    if (type === "childList" || type === "characterData") {
                        const lastChild = element.lastElementChild;
                        lastChild?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                }
            });
            mutationObserver.observe(element, { childList: true, subtree: true });
            return () => {
                mutationObserver.disconnect();
            };
        }
    }, []);
    return ref;
}
