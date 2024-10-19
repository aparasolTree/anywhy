import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { ComponentChild, isValidElement, toChildArray } from "preact";
import { createContextFactory } from "../utils/createContextFactory.ts";
import { useAnimationToggle } from "../hooks/useAnimationToggle.ts";
import { useUpdateEffect } from "../hooks/useUpdateEffect.ts";
import { isFunction } from "../utils/common.ts";

const [useSwitch, SwitchProvider] = createContextFactory<{ when: unknown; keepAlive: boolean; animation: boolean; updateHeight: (height: number) => void }>();
export function Switch<T>(
    { when, keepAlive = false, animation = true, children }: {
        when: T;
        animation?: boolean;
        keepAlive?: boolean;
        children?: ComponentChild;
    },
) {
    const [height, setHeight] = useState(0);
    const childrens = toChildArray(children)
        .filter((child) => isValidElement(child) && isFunction(child.type) && child.type.displayName === "Case");
    return (
        <SwitchProvider value={{ when, keepAlive, animation, updateHeight: useCallback((height: number) => setHeight(height), []) }}>
            <div class="relative w-full h-full" style={{ height }}>
                {childrens}
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
    const { when, keepAlive: pKeepAlive, animation, updateHeight } = useSwitch();
    const [state, toggle] = useAnimationToggle(when === value, { timeout: 1000 });
    const alive = typeof keepAlive === "boolean" ? keepAlive : pKeepAlive;
    useUpdateEffect(() => toggle(when === value), [when, value, toggle]);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!animation) return;
        const element = ref.current;
        if (!element) return;
        const mutationObserver = new ResizeObserver(() => updateHeight(element.offsetHeight));
        mutationObserver.observe(element);
        return () => {
            mutationObserver.disconnect();
        };
    }, [animation]);

    if (!animation && !state.enter) return null;
    if (state.remove && !alive) return null;
    return (
        <div
            ref={ref}
            class={[
                animation ? ["absolute w-full", state.enter ? enter : leave].join(" ") : "",
                keepAlive ? (state.remove ? "hidden" : "block") : "",
            ].join(" ")}
        >
            {content}
        </div>
    );
}
Case.displayName = "Case";
