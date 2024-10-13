import { useState } from "preact/hooks";

export function useHover<E extends HTMLElement>() {
    const [isHover, setIsHover] = useState(false);

    return [isHover, {
        onMouseEnter: () => setIsHover(true),
        onMouseLeave: () => setIsHover(false),
    }] as const;
}
