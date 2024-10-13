import { RefObject } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { useSetRef } from "./useSetRef.ts";
import { defaultWindow } from "../utils/constant.ts";

export interface UseMouseOptions {
    target?: RefObject<HTMLElement>;
    percentage?: boolean;
}

type MaybeElement = HTMLElement | (typeof globalThis);
function getCoordinates({ event, percentage, element }: {
    event: Event;
    element: MaybeElement;
    percentage: boolean;
}) {
    const { clientX, clientY } = getClientCoordinates(event);
    const { top, left, width, height } = getBoundingClientRect(element);
    return !percentage
        ? { x: clientX - left, y: clientY - top }
        : { x: (clientX - left) / width * 100, y: (clientY - top) / height * 100 };
}

export function useMouse(start: boolean = true, options?: UseMouseOptions) {
    const { percentage = false, target } = options || {};
    const [markRef, setMarkRef] = useSetRef({ start, coord: { x: 0, y: 0 } });
    const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const element = target?.current || defaultWindow;
        const move = (event: Event) => {
            event.preventDefault();
            setMarkRef({ coord: getCoordinates({ event, element, percentage }) });
            if (markRef.current.start) {
                setCoordinates(markRef.current.coord);
            }
        };
        element.addEventListener("touchmove", move);
        element.addEventListener("mousemove", move);
        return () => {
            element.removeEventListener("touchmove", move);
            element.removeEventListener("mousemove", move);
        };
    }, [percentage]);

    return [
        coordinates,
        useMemo(() => ({
            start: () => (setMarkRef({ start: true }), setCoordinates(markRef.current.coord)),
            cancel: () => setMarkRef({ start: false }),
        }), []),
    ] as const;
}

function getClientCoordinates(event: Event) {
    if (event.type === "touchmove") {
        const { touches: [touch] } = event as TouchEvent;
        return { clientX: touch.clientX, clientY: touch.clientY };
    } else if (event.type === "mousemove") {
        const { clientX, clientY } = event as MouseEvent;
        return { clientX, clientY };
    }
    return { clientY: 0, clientX: 0 };
}

function getBoundingClientRect(target: typeof globalThis | HTMLElement) {
    if (target === defaultWindow) {
        const { innerHeight, innerWidth } = target;
        return { width: innerWidth, height: innerHeight, left: 0, top: 0 };
    } else {
        const { top, left, width, height } = (target as HTMLElement).getBoundingClientRect();
        return { top, left, width, height };
    }
}
