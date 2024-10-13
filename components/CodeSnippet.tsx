import { JSX } from "preact";

export function CodeSnippet({ children, title, ...props }: JSX.HTMLAttributes<HTMLPreElement>) {
    return (
        <div class="rounded-md shadow-md overflow-hidden mb-5">
            {title && (
                <div class="bg-[#2d2d2d] text-white">
                    <span class="!px-5 py-1 text-xs">{title}</span>
                </div>
            )}
            <div class="relative group px-4 py-3 bg-[#222]">
                <pre {...props} class={["text-lg text-slate-300 rounded-md", props.class].join(" ")}>
                    {children}
                </pre>
            </div>
        </div>
    );
}
