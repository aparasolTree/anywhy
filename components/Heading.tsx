import { createElement, JSX } from "preact";

type HeadingElement = `h${1 | 2 | 3 | 4 | 5 | 6}`;
const fontSizeArr = [34, 30, 26, 22, 18, 14];
export function Heading(
    { level, id, children, ...props }: JSX.HTMLAttributes<HTMLHeadingElement> & { level?: number },
) {
    return createElement(`h${level || 1}` as HeadingElement, {
        ...props,
        id,
        style: { fontSize: fontSizeArr[level || 1], "scroll-margin-top": 70 },
        class: "py-6 focus:outline-none focus:text-red-500 ",
        children: [
            createElement("a", { href: `#${id}` }, children),
        ],
    });
}
