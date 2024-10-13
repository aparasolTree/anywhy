import { ComponentChild, JSX } from "preact";
import { useCallback, useEffect, useId, useState } from "preact/hooks";
import { useClickOutside } from "../hooks/useClickOutside.ts";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll.ts";
import { noop } from "../utils/common.ts";
import { AnyFuncion } from "../utils/type.ts";
import { createContextFactory } from "../utils/createContextFactory.ts";
import { useShortcutKey } from "../hooks/useShortcutKey.ts";
import { useMemoizeFn } from "../hooks/useMemoizeFn.ts";

export interface ModalProps extends JSX.HTMLAttributes<HTMLElement> {
    direction?: "top" | "center" | "bottom";
    show?: boolean;
    onClose?: () => void;
}

export function Modal(props: ModalProps) {
    const { show, onClose = noop, direction = "center", ...other } = props;
    if (!show) return null;
    return <ModalWrapper onClose={onClose} direction={direction} {...other} />;
}

export interface ModalWrapperProps extends Omit<ModalProps, "show"> {
    onClose: () => void;
    direction: "top" | "center" | "bottom";
}

const [useModal, ModalProvider] = createContextFactory<{ atTop: boolean }>();
export { useModal };

const directionStyle = { "top": "items-start", "center": "items-center", "bottom": "items-end" };
function ModalWrapper({ onClose, children, direction, ...otherProps }: ModalWrapperProps) {
    useLockBodyScroll();
    const id = useId();
    const ref = useClickOutside<HTMLDivElement>(onClose);
    const { modals, push } = useModalManager();
    const onCloseCached = useMemoizeFn(onClose);
    useEffect(() => push(id, onCloseCached), [push, id]);

    const index = modals.findIndex((modal) => modal.id === id);
    return (
        <ModalProvider value={{ atTop: index === modals.length - 1 }}>
            <div
                style={{ zIndex: modals.findIndex((modal) => modal.id === id) + 100 }}
                class={[
                    "fixed left-0 right-0 top-0 bottom-0 backdrop-blur-sm",
                    `flex justify-center ${directionStyle[direction]}`,
                    "bg-black bg-opacity-20 animate-modal-show opacity-0 cursor-default",
                ].join(" ")}
            >
                <main {...otherProps} ref={ref}>
                    {children}
                </main>
            </div>
        </ModalProvider>
    );
}

const [useModalManager, ModalManageProvider] = createContextFactory<
    {
        push: (id: string, onClose: AnyFuncion) => AnyFuncion;
        modals: { id: string; close: AnyFuncion }[];
    }
>();
export function ModalManager({ children }: { children?: ComponentChild }) {
    const [modalStack, setModalStack] = useState<{ id: string; close: AnyFuncion }[]>([]);
    useShortcutKey("Escape", () => setModalStack((prev) => (prev.pop()?.close(), [...prev])));
    const push = useCallback((id: string, onClose: AnyFuncion) => {
        setModalStack((prev) => {
            const exist = prev.find((modal) => modal.id === id);
            if (!exist) return [...prev, { id, close: onClose }];
            exist.close = onClose;
            return prev;
        });
        return () => {
            setModalStack((prev) => {
                const index = prev.findIndex((modal) => modal.close === onClose);
                if (index > -1) {
                    prev.splice(index, 1);
                    return [...prev];
                }
                return prev;
            });
        };
    }, []);
    return (
        <ModalManageProvider
            value={{
                modals: modalStack,
                push,
            }}
        >
            {children}
        </ModalManageProvider>
    );
}
