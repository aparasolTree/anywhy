import { createElement, JSX } from "preact";

export type CardProps<K extends keyof JSX.IntrinsicElements, T extends HTMLElement> =
    & { to?: K }
    & JSX.HTMLAttributes<T>;
export function Card<T extends HTMLElement, K extends keyof JSX.IntrinsicElements>(
    { children, to, ...props }: CardProps<K, T>,
) {
    return (
        createElement<JSX.HTMLAttributes<T>, T>(to || "div", {
            ...props,
            className: [
                "px-4 py-2 bg-white rounded-lg shadow-md",
                props.class || props.className,
            ]
                .join(" "),
        }, children)
    );
}
