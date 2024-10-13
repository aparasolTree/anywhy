---
title: 自定义hook - useHover
date: 2024-09-20
meta:
    keywords:
        - preact hooks
        - useHover
        - 自定义 hook
tags:
    - hooks
description: 使用preact模拟CSS中的hover效果
bannerSrc: https://images.pexels.com/photos/28501949/pexels-photo-28501949.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load
bannerAuthor: https://www.pexels.com/@josh-hild-1270765/
---

# 代码

```ts useHover.ts
import { useMemo, useState } from "preact/hooks";

function useHover(initState: boolean = false) {
    const [isHover, setIsHover] = useState(initState);
    const eventMethods = useMemo(() => {
        return {
            onMouseEnter: () => setIsHover(true),
            onMouseLeave: () => setIsHover(false),
        };
    }, []);

    return [isHover, eventMethods] as const;
}
```

## 例子

[example: UseHover.tsx]
