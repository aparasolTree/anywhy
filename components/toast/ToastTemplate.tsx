import { ComponentChild } from "preact";
import { SuccessIcon } from "./SuccessIcon.tsx";
import { ErrorIcon } from "./ErrorIcon.tsx";
import { WarnnningIcon } from "./WainningIcon.tsx";
import { LoadingIcon } from "./LoadingIcon.tsx";
import { toast as _toast } from "../../utils/toast/index.ts";
import { Toast } from "../../utils/type.ts";
import { CloseSVG } from "../svg/CloseSVG.tsx";

interface ToastTemplateProps {
    toast: Toast;
    children?: ComponentChild;
}

const buildInIcon = {
    error: ErrorIcon,
    success: SuccessIcon,
    warnning: WarnnningIcon,
    loading: LoadingIcon,
    icon: null,
    custom: null,
};

export function ToastTemplate({ toast, children }: ToastTemplateProps) {
    const Tip = toast.type in buildInIcon && buildInIcon[toast.type];
    return (
        <div
            style={{ animationDuration: `0.16s` }}
            class={`${toast.leave ? toast.leaveAnimation : toast.enterAnimation}`}
        >
            <div class="bg-white text-black px-3 py-1 flex items-center gap-2 rounded-md shadow-md ring-1 ring-gray-200">
                {toast.type === "icon" && toast.icon !== void 0 ? <IconWrapper icon={toast.icon} /> : (Tip && <Tip />)}
                <div class="whitespace-nowrap text-base">{children}</div>
                <button onClick={() => _toast.leave(toast.id)} class="text-xl">
                    <CloseSVG />
                </button>
            </div>
        </div>
    );
}

function IconWrapper({ icon }: { icon: string }) {
    return (
        <div class="min-w-[20px] animate-icon delay-[150ms] opacity-0 scale-50">
            {icon}
        </div>
    );
}
