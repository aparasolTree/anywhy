import { ComponentChild } from "preact";
import { isFunction } from "../common.ts";
import { toastEmit } from "./toastEmit.ts";
import { ToastContent, ToastType } from "../type.ts";
import { Toast, ToastActionEnum, ToastOptions, ToastPosition } from "../type.ts";

function createToast(
    type: ToastType,
    content: ToastContent | ComponentChild,
    options: ToastOptions & { icon?: string } = {},
): Toast {
    return {
        type,
        content,
        height: 0,
        createAt: Date.now(),
        id: options.id || crypto.randomUUID(),
        leave: false,
        pauseDuartion: 0,
        pauseAt: 0,
        ...options,
    } as Toast;
}

const defineToast = (
    type: ToastType,
    content: ToastContent | ComponentChild,
    options: ToastOptions = {},
) => {
    const toast = createToast(type, content, options);
    toastEmit.dispatch({
        type: ToastActionEnum.INSERT_UPDATE,
        payload: { toast },
    });
    return toast.id;
};

export const toast = (content: ToastContent, options: ToastOptions = {}) => defineToast("custom", content, options);

const createToastStateComponent = (type: ToastType) =>
(
    content: ComponentChild,
    options: ToastOptions = {},
) => {
    return defineToast(type, content, options);
};

toast.success = createToastStateComponent("success");
toast.error = createToastStateComponent("error");
toast.warnning = createToastStateComponent("warnning");
toast.loading = createToastStateComponent("loading");
toast.icon = (
    icon: string,
    content: ComponentChild,
    options: Omit<ToastOptions, "icon"> = {},
) => {
    return defineToast("icon", content, { ...options, icon });
};

toast.leave = (toastId: string) => toastEmit.dispatch({ type: ToastActionEnum.LEAVE, payload: { toastId } });

const resolveValue = <T>(
    state: ((value: T) => ComponentChild) | ComponentChild,
    value: T,
) => {
    return isFunction(state) ? state(value) : state;
};

toast.waiting = async <T>(
    promise: Promise<T>,
    content: ComponentChild,
    options: {
        position?: ToastPosition;
        success: ((value: T) => ComponentChild) | ComponentChild;
        error: ((message: string) => ComponentChild) | ComponentChild;
    },
) => {
    const { success, error, position = "top center" } = options;
    const id = toast.loading(content, { position });

    try {
        const value = await promise;
        toast.success(resolveValue(success, value), { id });
        return value;
    } catch (errorMessage) {
        toast.error(resolveValue(error, errorMessage), { id });
    }
};
