import { JSX } from "preact";

export function Code({ children, class: _class, ...props }: JSX.HTMLAttributes<HTMLElement>) {
    return (
        <code
            {...props}
            style={{ padding: "2px 10px", textShadow: "none" }}
            class="bg-green-500 text-base rounded-md leading-5 text-white font-sans"
        >
            {children}
        </code>
    );
}
