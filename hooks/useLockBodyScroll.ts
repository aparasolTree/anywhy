import { useLayoutEffect, useRef } from "preact/hooks";

const ALREADY_SET_PADDING = "already-set-padding";
export function useLockBodyScroll() {
    const scrollBarWidthRef = useScrollBarWidthRef();
    const existsRef = useBodyScrollbarIsExists();
    useLayoutEffect(() => {
        const body = document.body;
        const originalStyle = body.style.overflow;
        const originPaddingRight = Number.parseInt(body.style.paddingRight || "0");
        const originAttr = body.hasAttribute(ALREADY_SET_PADDING);
        body.style.overflow = "hidden";
        if (existsRef.current && !originAttr) {
            body.setAttribute(ALREADY_SET_PADDING, "true");
            body.style.paddingRight = `${scrollBarWidthRef.current + originPaddingRight}px`;
        }
        return () => {
            body.style.overflow = originalStyle;
            body.style.paddingRight = `${originPaddingRight}px`;
            if (!originAttr) {
                body.removeAttribute(ALREADY_SET_PADDING);
            }
        };
    }, []);
}

export function useScrollBarWidthRef() {
    const scrollBarWidthRef = useRef(0);
    useLayoutEffect(() => {
        const element = document.createElement("div");
        element.style.position = "absolute";
        element.style.left = "-99999px";
        element.style.overflowY = "scroll"; // 强制显示纵向滚动条
        element.style.width = "100px";
        element.style.height = "100px";

        document.body.append(element);
        scrollBarWidthRef.current = element.offsetWidth - element.clientWidth;
        document.body.removeChild(element);
    }, []);

    return scrollBarWidthRef;
}

function useBodyScrollbarIsExists() {
    const exists = useRef(false);
    useLayoutEffect(() => {
        const html = document.documentElement;
        exists.current = html.scrollHeight > html.clientHeight;
    }, []);
    return exists;
}
