import { useEffect } from "preact/hooks";
import { useElementRectCallback } from "../../hooks/useElementRect.ts";
import { toastEmit } from "../../utils/toast/toastEmit.ts";
import { isFunction } from "../../utils/common.ts";
import { ToastTemplate } from "../../components/toast/ToastTemplate.tsx";
import { Toast, ToastActionEnum } from "../../utils/type.ts";
import { toast as _toast } from "../../utils/toast/index.ts";

const parsePosition = ({ position, leave }: Toast, offset: number) => {
    const isTop = position?.includes("top");
    return {
        justifyContent: position?.includes("left")
            ? "start"
            : position?.includes("right")
            ? "end"
            : position?.includes("center")
            ? "center"
            : "",
        ...(isTop ? { top: 0 } : { bottom: 0 }),
        transform: `translateY(${offset * (isTop ? 1 : -1)}px)`,
        zIndex: leave ? 0 : 1,
    };
};

const updateHeight = (toastId: string, height: number) => {
    return toastEmit.dispatch({
        type: ToastActionEnum.UPDATE,
        payload: {
            toast: { height },
            toastId,
        },
    });
};

export interface TaostItemProps {
    toast: Toast;
    offset: number;
}

export function ToastItem({ toast, offset }: TaostItemProps) {
    const ref = useElementRectCallback<HTMLDivElement>(({ height }) => updateHeight(toast.id, height));

    useEffect(() => {
        if (toast.pauseAt) return;
        if (toast.timeout === Infinity) return;
        const now = Date.now();
        const diff = toast.createAt + toast.timeout! - now +
            toast.pauseDuartion;
        if (diff <= 0) {
            if (!toast.leave) {
                _toast.leave(toast.id);
            }
            return;
        }
        const timeoutId = setTimeout(() => _toast.leave(toast.id), diff);
        return () => {
            clearTimeout(timeoutId);
        };
    }, [toast]);

    return (
        <div
            ref={ref}
            style={parsePosition(toast, offset)}
            class={`absolute left-0 right-0 transition-[transform] duration-[0.16s] ease-in-out flex`}
        >
            <div
                class="pointer-events-auto"
                onMouseEnter={() => pause(toast.id)}
                onMouseLeave={() => start(toast.id)}
            >
                {(isFunction(toast.content) && toast.type === "custom")
                    ? toast.content(toast)
                    : (
                        <ToastTemplate key={toast.id} toast={toast}>
                            {toast.content}
                        </ToastTemplate>
                    )}
            </div>
        </div>
    );
}

const pause = (id: string) =>
    toastEmit.dispatch({
        type: ToastActionEnum.PAUSE_LEAVE,
        payload: { toastId: id },
    });
const start = (id: string) =>
    toastEmit.dispatch({
        type: ToastActionEnum.START_LEAVE,
        payload: { toastId: id },
    });
