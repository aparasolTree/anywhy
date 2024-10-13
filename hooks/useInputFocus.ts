import { useEffect, useRef } from "preact/hooks";

export function useInputFocus() {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
        }
    }, []);
    return ref;
}
