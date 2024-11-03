import { ComponentChild } from "preact";
import { useClipboardCopy } from "../hooks/useClipboard.ts";
import { toast } from "../utils/toast/index.ts";

export interface CopyProps {
    text: string;
    content: ComponentChild;
    className?: string;
}

export function CopyButton({ text, content, className }: CopyProps) {
    const [copied, copy] = useClipboardCopy(3000);
    return (
        <button
            title={text}
            class={[
                copied ? "pointer-events-none opacity-60" : "",
                className || "",
            ].join(" ")}
            onClick={() => copy(text).then(() => toast.success("😊 复制成功，3s后再次操作"))}
        >
            {content}
        </button>
    );
}
