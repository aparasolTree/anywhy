import { unescape } from "@std/html";
import { cloneElement, ComponentChild, createElement, isValidElement, JSX } from "preact";
import { ElementNode, RootNode, TextNode } from "../utils/html.ts";

const headingReg = /h([1|2|3|4|5|6])/;
export function PreactMarkdown(
    { root, map = {} }: {
        root: RootNode;
        map?: Partial<Record<keyof JSX.IntrinsicElements | "heading", createElement.JSX.Element>>;
    },
) {
    function render(node: ElementNode | TextNode): ComponentChild {
        if (node.type === "element") {
            let mapComponent: createElement.JSX.Element | undefined;
            const res = headingReg.exec(node.tag);
            if (res && map.heading) {
                mapComponent = map.heading;
                node.props = { ...node.props, level: res[1] };
            } else {
                mapComponent = map[node.tag as keyof JSX.IntrinsicElements];
            }
            if (isValidElement(mapComponent)) {
                return cloneElement(
                    mapComponent,
                    { ...node.props },
                    ...node.children.map(render),
                );
            }
            return createElement(node.tag, node.props, ...node.children.map(render));
        } else {
            return unescape(node.content);
        }
    }
    return (
        <>
            {root.children.map(render)}
        </>
    );
}
