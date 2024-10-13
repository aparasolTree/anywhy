import { useEffect } from "preact/hooks";
import type { ToastOptions, ToastType } from "../utils/type.ts";
import { toast } from "../utils/toast/index.ts";

export interface ToastProps {
    type?: Exclude<ToastType, "icon" | "custom">;
    message?: string;
    options?: ToastOptions;
}

export function Toast({ type, message, options }: ToastProps) {
    useEffect(() => {
        if (type && message && !["icon", "custom"].includes(type)) {
            setTimeout(() => toast[type](message), 800);
        }
    }, [type, message, options]);
    return null;
}
