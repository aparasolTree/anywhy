import { ComponentChild, JSX } from "preact";
import { useState } from "preact/hooks";
import { useInputFocus } from "../hooks/useInputFocus.ts";
import { useShortcutKey } from "../hooks/useShortcutKey.ts";
import { Case, Switch } from "./Switch.tsx";
import { AnyFuncion } from "../utils/type.ts";

function ConfirmInput({ onSubmit }: { onSubmit: (val: "y" | "n") => void }) {
    const ref = useInputFocus();
    useShortcutKey("c", () => onSubmit("n"), { modifier: "ctrl" });
    const onKeyDown: JSX.KeyboardEventHandler<HTMLInputElement> = ({ key, currentTarget }) => {
        if (key === "Enter") {
            const value = currentTarget.value.toLowerCase();
            onSubmit(value === "y" ? "y" : "n");
        }
    };
    return (
        <input
            ref={ref}
            type="text"
            placeholder="y/n"
            onKeyDown={onKeyDown}
            class="ml-2 focus:outline-none bg-transparent"
        />
    );
}

export interface RequestConfirmProps {
    title: string;
    yes: ComponentChild;
    no: ComponentChild;
    onSubmit?: AnyFuncion;
}
export function RequestConfirm({ title, no, yes, onSubmit }: RequestConfirmProps) {
    const [action, setAction] = useState<"y" | "n" | null>(null);
    const submit = (val: "y" | "n") => {
        onSubmit?.();
        setAction(val);
    };
    return (
        <>
            <div>
                <span>{title}</span>
                {action ? <span class="ml-2">{action}</span> : <ConfirmInput onSubmit={submit} />}
            </div>
            <Switch when={action}>
                <Case value="y" content={yes} />
                <Case value="n" content={no} />
            </Switch>
        </>
    );
}
