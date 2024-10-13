import { useCallback, useRef, useState } from "preact/hooks";
import { useLatest } from "./useLatest.ts";

export function useClipboardCopy(interval: number = 1000) {
    const [copied, setCopied] = useState(false);
    const isSupported = useRef(navigator && "clipboard" in navigator);
    const copiedRef = useLatest(copied);
    const copy = useCallback(async (text: string) => {
        if (copiedRef.current || !text) return;

        if (isSupported.current) await navigator.clipboard.writeText(text);
        else substitutionRead(text);

        setCopied(true);
        setTimeout(() => setCopied(false), interval);
    }, [interval]);
    return [copied, copy] as const;
}

function substitutionRead(text: string) {
    const ta = document.createElement("textarea");
    ta.value = text ?? "";
    ta.style.position = "absolute";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
}
