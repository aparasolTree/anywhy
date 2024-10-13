import { ComponentChild } from "preact";
import { createContextFactory } from "../utils/createContextFactory.ts";
import { useAnimationToggle } from "../hooks/useAnimationToggle.ts";
import { useUpdateEffect } from "../hooks/useUpdateEffect.ts";

const [useSwitch, SwitchProvider] = createContextFactory<{ when: unknown; keepAlive: boolean; animation: boolean }>();
export function Switch<T>(
    { when, keepAlive = false, animation = false, children }: {
        when: T;
        animation?: boolean;
        keepAlive?: boolean;
        children?: ComponentChild;
    },
) {
    return (
        <SwitchProvider value={{ when, keepAlive, animation }}>
            <div class="relative w-full h-full">
                {children}
            </div>
        </SwitchProvider>
    );
}

interface CaseProps<T> {
    enter?: string;
    leave?: string;
    keepAlive?: boolean;
    value: T;
    content: ComponentChild;
}

export function Case<T>(
    { value, content, keepAlive, enter = "animate-enter", leave = "animate-leave" }: CaseProps<T>,
) {
    const { when, keepAlive: pKeepAlive, animation } = useSwitch();
    const [state, toggle] = useAnimationToggle(when === value, { timeout: 1000 });
    const alive = typeof keepAlive === "boolean" ? keepAlive : pKeepAlive;
    useUpdateEffect(() => toggle(when === value), [when, value, toggle]);

    if (!animation && !state.enter) return null;
    if (state.remove && !alive) return null;
    return (
        <div
            class={[
                animation ? ["absolute w-full", state.enter ? enter : leave].join(" ") : "",
                keepAlive ? (state.remove ? "hidden" : "block") : "",
            ].join(" ")}
        >
            {content}
        </div>
    );
}
