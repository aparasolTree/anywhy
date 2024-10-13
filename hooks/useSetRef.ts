import { useCallback, useRef } from "preact/hooks";

export function useSetRef<T extends Record<string, unknown>>(initState: T) {
    const ref = useRef<T>(initState);
    const setRef = useCallback((state: Partial<T>) => {
        ref.current = { ...ref.current, ...state };
    }, []);
    return [ref, setRef] as const;
}
