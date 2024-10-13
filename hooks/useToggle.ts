import { useMemo, useState } from "preact/hooks";

export function useToggleState(initState: boolean = false) {
    const [state, setState] = useState(initState);
    return [
        state,
        useMemo(() => {
            const toggle = (state?: boolean) => setState((s) => typeof state !== "undefined" ? state : !s);
            return {
                toggle,
                close: () => toggle(false),
                open: () => toggle(true),
            };
        }, []),
    ] as const;
}
