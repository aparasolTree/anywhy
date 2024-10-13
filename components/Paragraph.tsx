import { createElement, JSX } from "preact";
import { ExampleComponents } from "../doc/islands.ts";

export function Paragraph({
    code,
    children,
    ...props
}: JSX.HTMLAttributes<HTMLParagraphElement> & { code?: string }) {
    if (code) {
        return (
            <div class="bg-gray-100 rounded-md flex justify-center items-center h-[40vh] overflow-y-auto relative">
                {createElement(ExampleComponents[code], {})}
            </div>
        );
    }
    return <p {...props}>{children}</p>;
}
