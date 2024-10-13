import { ComponentChild } from "preact";

// BlackList
export enum BlacklistEnum {
    ADD = "add",
    REMOVE = "remove",
}

// toast
export interface DefaultToastOptions {
    timeout?: number;
    position?: ToastPosition;
    enterAnimation?: string;
    leaveAnimation?: string;
}

export type Horizontal = "left" | "center" | "right";
export type Vertical = "top" | "bottom";
export type ToastType =
    | "success"
    | "error"
    | "loading"
    | "warnning"
    | "icon"
    | "custom";
export type ToastPosition = `${Vertical} ${Horizontal}`;
export type ToastOptions = {
    enterAnimate?: string;
    leaveAnimate?: string;
    timeout?: number;
    position?: ToastPosition;
    icon?: string;
    id?: string;
};

export type Toast = IconTypeToast | CustomTypeToast | OtherTypeToast;

export enum ToastActionEnum {
    ADD,
    LEAVE,
    REMOVE,
    UPDATE,
    INSERT_UPDATE,
    PAUSE_LEAVE,
    START_LEAVE,
}
export type ToastAction =
    | { type: ToastActionEnum.INSERT_UPDATE; payload: { toast: Toast } }
    | { type: ToastActionEnum.ADD; payload: { toast: Toast } }
    | { type: ToastActionEnum.LEAVE; payload: { toastId: string } }
    | { type: ToastActionEnum.REMOVE; payload: { toastId: string } }
    | {
        type: ToastActionEnum.UPDATE;
        payload: {
            toastId: string;
            toast: Partial<
                Pick<Toast, "content" | "type" | "timeout" | "height">
            >;
        };
    }
    | { type: ToastActionEnum.PAUSE_LEAVE; payload: { toastId: string } }
    | { type: ToastActionEnum.START_LEAVE; payload: { toastId: string } };

export type ToastContent = (toast: Toast) => ComponentChild;

type CommonToast = {
    id: string;
    height: number;
    leave: boolean;
    createAt: number;
    pauseDuartion: number;
    pauseAt: number;
    enterAnimation?: string;
    leaveAnimation?: string;
    timeout?: number;
    position?: ToastPosition;
};

type IconTypeToast = CommonToast & {
    type: "icon";
    icon: string;
    content: ComponentChild;
};
type CustomTypeToast = CommonToast & { type: "custom"; content: ToastContent };
type OtherTypeToast = CommonToast & {
    type: Exclude<ToastType, "custom" | "icon">;
    content: ComponentChild;
};

// image
export interface ExifInfo {
    ISOSpeedRatings?: number;
    ExposureTime?: number;
    FNumber?: number;
    DateTimeOriginal?: number;
    Model?: string;
    FocalLength?: number;
    Software?: string;
}

export interface ImageEntry {
    id: string;
    name: string;
    createAt: number;
    width: number;
    height: number;
    size: number;
    exif?: ExifInfo;

    views: number;
    downloads: number;
}

// other
export type Size = { width: number; height: number };
// deno-lint-ignore no-explicit-any
export type AnyFuncion = (...args: any[]) => any | Promise<any>;
