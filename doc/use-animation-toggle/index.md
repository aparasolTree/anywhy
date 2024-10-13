---
title: 自定义hook - useAnimationState
date: 2024-09-24
meta:
    keywords:
        - preact hook
        - useAnimationState
        - 自定义 hook
tags:
    - hooks
description: 功能主要是管理组件的动画状态，允许你在不同的状态之间切换，同时提供动画效果。开发者可以轻松地实现复杂的动画效果而不需要手动管理动画的状态和定时器。
bannerSrc: https://images.pexels.com/photos/19553534/pexels-photo-19553534.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load
bannerAuthor: https://www.pexels.com/@brett-sayles/
---

# 代码

```ts useAnimationToggle.ts
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
```

## 例子

[example: UseAnimationToggle]
