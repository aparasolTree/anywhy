import { toastEmit } from "./toastEmit.ts";
import { createRemoveQueue } from "./createRemoveQueue.ts";
import { Toast, ToastAction, ToastActionEnum } from "../type.ts";

const REMOVE_TIMEOUT = 1000;
const { add, clear, has } = createRemoveQueue(REMOVE_TIMEOUT, (id) => {
    toastEmit.dispatch({
        type: ToastActionEnum.REMOVE,
        payload: { toastId: id },
    });
});

const pick = <T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[],
) => {
    return Object.fromEntries(
        Object.entries(obj).filter(([key, value]) => value !== void 0 ? keys.includes(key as K) ? true : false : false),
    ) as Pick<T, K>;
};

const MAX_TOASTS_LENGTH = 10;

export function reducer(toasts: Toast[], action: ToastAction): Toast[] {
    switch (action.type) {
        case ToastActionEnum.INSERT_UPDATE: {
            const { toast } = action.payload;
            return toasts.find(({ id }) => id === toast.id)
                ? reducer(toasts, {
                    type: ToastActionEnum.UPDATE,
                    payload: {
                        toastId: toast.id,
                        toast: pick(toast, ["content", "type", "timeout", "createAt"]),
                    },
                })
                : reducer(toasts, {
                    type: ToastActionEnum.ADD,
                    payload: { toast },
                });
        }
        case ToastActionEnum.ADD: {
            if (toasts.length >= MAX_TOASTS_LENGTH) return toasts;
            return [action.payload.toast, ...toasts];
        }
        case ToastActionEnum.UPDATE: {
            const { toast: newToast, toastId } = action.payload;
            if (has(toastId)) clear(toastId);
            return toasts.map((toast) => {
                if (toast.id === toastId) {
                    return { ...toast, ...newToast };
                }
                return toast;
            }) as Toast[];
        }
        case ToastActionEnum.LEAVE: {
            const { toastId } = action.payload;
            add(toastId);
            return toasts.map((toast) => {
                if (toast.id === toastId) {
                    return { ...toast, leave: true };
                }
                return toast;
            });
        }
        case ToastActionEnum.REMOVE: {
            const { toastId } = action.payload;
            if (toastId) {
                clear(toastId);
                return toasts.filter((toast) => toast.id !== toastId);
            }
            clear();
            return [];
        }
        case ToastActionEnum.PAUSE_LEAVE: {
            const { toastId } = action.payload;
            clear(toastId);
            return toasts.map((toast) => {
                return toast.id === toastId
                    ? {
                        ...toast,
                        pauseAt: Date.now(),
                        pauseDuartion: 0,
                    }
                    : toast;
            });
        }
        case ToastActionEnum.START_LEAVE: {
            const { toastId } = action.payload;
            return toasts.map((toast) => {
                return toast.id === toastId
                    ? {
                        ...toast,
                        pauseDuartion: Date.now() - toast.pauseAt!,
                        pauseAt: 0,
                    }
                    : toast;
            });
        }
        default:
            return toasts;
    }
}
