import { JSX } from "preact";

export function Anchor({ children, ...props }: JSX.HTMLAttributes<HTMLAnchorElement>) {
    return (
        <a
            {...props}
            target="_blank"
            class={[
                props.class,
                "text-red-500 underline hover:text-red-800 inline-flex items-center",
            ].join(" ")}
        >
            {children}
        </a>
    );
}
