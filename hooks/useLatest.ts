import { useRef } from "preact/hooks";

export function useLatest<T>(value: T) {
    const ref = useRef<T>(value);
    ref.current = value;
    return ref;
}
