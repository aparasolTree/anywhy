import { ComponentType, createElement, JSX } from "preact";
import { walk } from "@std/fs";

export const ExampleComponents = {} as Record<string, ComponentType>;
const ExamplePath = new URL("../islands/example", import.meta.url);
for await (const { name } of walk(ExamplePath)) {
    if (!/.(ts|tsx|js|jsx)$/g.test(name)) continue;
    const Component = await import(`../islands/example/${name}`);
    ExampleComponents[name] = Component.default;
}

console.log(ExampleComponents);
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
