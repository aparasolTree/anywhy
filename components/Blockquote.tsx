import { JSX } from "preact";
import { WarnSVG } from "./svg/WarnSVG.tsx";
import { NoticeSVG } from "./svg/NoticeSVG.tsx";

const tipStyle = {
    notice: "!border-blue-500 !bg-blue-300 text-white",
    warn: "!border-yellow-500 !bg-yellow-300 text-white",
};

export function Blockquote({ children, tip, ...props }: JSX.HTMLAttributes<HTMLQuoteElement> & { tip?: string }) {
    return (
        <blockquote
            {...props}
            style={{ textShadow: tip ? "-1px 1px 3px rgba(0,0,0)" : "" }}
            class={[
                props.className,
                props.class,
                "px-4 py-2 border-gray-500 border-l-4 bg-gray-300",
                tipStyle[tip as "notice" | "warn"],
            ].join(" ")}
        >
            <p class="text-2xl">
                <NoticeSVG />
            </p>
            {children}
        </blockquote>
    );
}
