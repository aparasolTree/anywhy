import { Dispatch, StateUpdater, useCallback, useReducer, useRef } from "preact/hooks";
import { useLatest } from "./useLatest.ts";
import { useUnmount } from "./useUnmount.ts";

type AnimationState = { enter: boolean; remove: boolean };
interface UseAnimtionStateOption {
    timeout?: number;
}

export enum AnimationStateEnum {
    ENTER,
    LEAVE,
    DESTROY,
}

export type AnimationAcion =
    | { type: AnimationStateEnum.ENTER }
    | { type: AnimationStateEnum.LEAVE }
    | { type: AnimationStateEnum.DESTROY };

function action(state: AnimationState, action: AnimationAcion) {
    switch (action.type) {
        case AnimationStateEnum.ENTER:
            return { enter: true, remove: false };
        case AnimationStateEnum.LEAVE:
            return { enter: false, remove: false };
        case AnimationStateEnum.DESTROY:
            return { enter: false, remove: true };
        default:
            return state;
    }
}

export function useAnimationToggle(
    initState: boolean,
    opions?: UseAnimtionStateOption,
) {
    const { timeout = 100 } = opions || {};
    const [state, dispatch] = useReducer(action, { enter: initState, remove: !initState });
    const prevState = useLatest(state.enter);

    const timeIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clear = useCallback(() => timeIdRef.current && clearTimeout(timeIdRef.current), []);
    useUnmount(() => clear());

    const setState = useCallback<Dispatch<StateUpdater<boolean>>>((value) => {
        if (value === prevState.current) return;
        clear();
        const newValue = typeof value === "function" ? value(prevState.current) : value;
        if (newValue) return dispatch({ type: AnimationStateEnum.ENTER });
        dispatch({ type: AnimationStateEnum.LEAVE });
        timeIdRef.current = setTimeout(() => {
            dispatch({ type: AnimationStateEnum.DESTROY });
            timeIdRef.current = null;
        }, timeout);
    }, [timeout, clear]);

    return [
        state,
        setState,
    ] as const;
}
