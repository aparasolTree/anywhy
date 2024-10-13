---
title: 自定义hook - useUpdate
date: 2024-09-24
meta:
    keywords:
        - preact hook
        - useUpdate
        - 自定义 hook
tags:
    - hooks
description: 返回一个函数，在函数调用时强制组件渲染。
bannerSrc: https://images.pexels.com/photos/28467432/pexels-photo-28467432.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load
bannerAuthor: https://www.pexels.com/@brett-sayles/
---

```ts useUpdate.ts
import { useCallback, useReducer } from "preact/hooks";

const updateReducer = (num: number): number => num + 1;
export function useUpdate() {
    const [, update] = useReducer(updateReducer, 0);
    return useCallback(() => update(0), []);
}
```
