import { useToasts } from "../../hooks/useToasts.ts";
import { useToastConfig } from "./context.ts";
import { ToastItem } from "./ToastItem.tsx";

const TOAST_CONTAINER_OFFSET = 10;
const TOAST_GAP = 5;

export function ToastContainer() {
    const { gap = TOAST_GAP, ...toastOptions } = useToastConfig();
    const { toasts, calcOffset } = useToasts(toastOptions);
    return (
        <div
            class={`fixed pointer-events-none flex flex-col z-[1000]`}
            style={{
                top: TOAST_CONTAINER_OFFSET,
                right: TOAST_CONTAINER_OFFSET,
                left: TOAST_CONTAINER_OFFSET,
                bottom: TOAST_CONTAINER_OFFSET,
            }}
        >
            {toasts.map((toast) => {
                const offset = calcOffset(toast, gap);
                return (
                    <ToastItem
                        toast={toast}
                        offset={offset}
                        key={toast.id}
                    />
                );
            })}
        </div>
    );
}
