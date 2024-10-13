import { useCallback, useEffect, useReducer } from "preact/hooks";
import { useLatest } from "./useLatest.ts";
import { DefaultToastOptions } from "../utils/type.ts";
import { ToastType } from "../utils/type.ts";
import { reducer } from "../utils/toast/reducer.ts";
import { Toast, ToastAction } from "../utils/type.ts";
import { toastEmit } from "../utils/toast/toastEmit.ts";

const defaultToastOptions: DefaultToastOptions = {
    position: "top center",
    enterAnimation: "toast-enter",
    leaveAnimation: "toast-leave",
};

const defaultTimeout: Record<ToastType, number> = {
    error: 4000,
    custom: 3000,
    icon: 2000,
    loading: Infinity,
    success: 2000,
    warnning: 3000,
};

export function useToasts(defaultOptions: DefaultToastOptions = {}) {
    const [toasts, dispatch] = useReducer<Toast[], ToastAction>(reducer, []);
    const toastRef = useLatest(toasts.map((toast) => {
        return {
            ...defaultToastOptions,
            ...defaultOptions,
            ...toast,
            timeout: toast.timeout || defaultOptions.timeout ||
                defaultTimeout[toast.type],
        };
    }));

    useEffect(() => {
        return toastEmit.add((action: ToastAction) => dispatch(action));
    }, []);

    const calcOffset = useCallback((toast: Toast, gap: number) => {
        const sameGroup = toastRef.current.filter(({ position }) => toast.position === position && toast.height);

        const index = sameGroup.findIndex(({ id }) => id === toast.id);
        const beforeToastIndex = sameGroup.filter((toast, i) => i < index && !toast.leave).length;
        const offset = sameGroup.filter((toast) => !toast.leave)
            .slice(0, beforeToastIndex)
            .reduce((acc, toast) => acc + toast.height + gap, 0);
        return offset;
    }, []);

    return {
        toasts: toastRef.current,
        calcOffset,
    };
}
