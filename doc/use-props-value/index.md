---
title: 自定义hook - usePropsValue
date: 2024-09-24
meta:
    keywords:
        - preact hooks
        - usePropsValue
        - 自定义 hook
tags:
    - hooks
description: 处理组件的值和状态同步，同时允许外部控制和内部管理状态。适用于需要控制输入组件或可控组件状态的场景，确保内部状态和外部状态的一致性，并提供良好的性能。
bannerSrc: https://images.pexels.com/photos/27520010/pexels-photo-27520010.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load
bannerAuthor: https://www.pexels.com/@brett-sayles/
---

# 代码

```ts usePropsValue.ts
import { StateUpdater, useCallback, useReducer, useRef } from "preact/hooks";
import { useMemoizeFn } from "useMemoizeFn.ts";
import { isFunction } from "isFunction.ts";

interface UsePropsValueOptions<T> {
    defaultValue: T;
    value?: T;
    onChange: (state: T) => void;
}

export function usePropsValue<T>({ defaultValue, value, onChange }: UsePropsValueOptions<T>) {
    const stateRef = useRef(typeof value === "undefined" ? defaultValue : value);
    if (value !== void 0) stateRef.current = value;

    const update = useUpdate();

    const setState = useMemoizeFn((updater: StateUpdater<T>, forceTrigger: boolean = false) => {
        const newState = isFunction(updater) ? updater(stateRef.current) : updater;
        if (!forceTrigger && newState === stateRef.current) return;
        stateRef.current = newState;
        update();
        return onChange?.(newState);
    });

    return [stateRef.current, setState] as const;
}

function useUpdate() {
    const [, update] = useReducer((s) => s + 1, 0);
    return useCallback(() => update(0), []);
}
```

## 例子

[example: UsePropsValue.tsx]
