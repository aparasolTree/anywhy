import { useEffect, useRef } from "preact/hooks";

export function useMountedClick<E extends HTMLElement>() {
    const ref = useRef<E>(null);
    useEffect(() => {
        if (ref.current) ref.current.click();
    }, []);
    return ref;
}
