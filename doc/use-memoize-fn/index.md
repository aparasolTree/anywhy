---
title: 自定义hook - useMemoizeFn
date: 2024-09-24
meta:
    keywords:
        - preact hooks
        - useMemoizeFn
        - 自定义 hook
tags:
    - hooks
description: 将一个函数进行记忆化，以确保在组件重新渲染时不创建新的函数实例。适用于性能敏感的场景，确保函数不会因每次渲染而重新创建，从而减少了组件的渲染次数。
bannerSrc: https://i0.hippopx.com/photos/479/54/326/forest-fog-nature-winter-preview.jpg
bannerSource: https://www.hippopx.com/zh/forest-fog-nature-winter-trees-winter-mood-atmospheric-34001
---

# 代码

```ts useMemoizeFn.ts
import { useCallback } from "preact/hooks";
import { useLatest } from "useLatest.ts";

type AnyFunction = (...args: any[]) => any;
export function useMemoizeFn<T extends AnyFunction>(fn: T) {
    const fnRef = useLatest(fn);
    return useCallback((...args: Parameters<T>) => {
        return fnRef.current(...args);
    }, []);
}
```
