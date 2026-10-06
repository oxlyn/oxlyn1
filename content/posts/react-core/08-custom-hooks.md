---
title: "React 核心入门 · 第 8 章：自定义 Hook"
description: "逻辑复用的组件间形态：use 开头的函数、useRef/useMemo/useCallback 三副手、闭包陷阱。"
publishDate: 2026-08-08T09:00:00
tags: ["react", "教程"]
---

> 本文对应官方文档[用自定义 Hook 复用逻辑](https://zh-hans.react.dev/learn/reusing-logic-with-custom-hooks)与各 Hook 的 API 参考。

**学习目标**：掌握自定义 Hook 的形态与命名，用好 useRef/useMemo/useCallback 三副手，认清闭包陷阱。

## 自定义 Hook：use 开头的函数

自定义 Hook = **调用其他 Hook 的普通函数**，约定 `use` 开头（React 靠这个名字启用规则检查）：

```jsx
import { useState, useEffect } from 'react'

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {                          // 清理内建（第 5 章纪律）
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return online
}

// 任意组件：一行接入
const online = useOnline()
```

与 [Vue 组合式函数](/posts/vue-core/08-composables.md)形态几乎一致（use 前缀、闭包封状态、生命周期内闭环）；最大差异在运行时：**React 每次渲染都重新执行 Hook 函数体**（状态由 React 按调用顺序保管），Vue 的 setup 只跑一次——所以 React 侧多出"依赖数组"与"调用顺序稳定"两条独有纪律。

**Hook 规则**（eslint-plugin-react-hooks 强制）：只在顶层调用（不能放 if/循环/嵌套函数里——React 按调用顺序对号入座，顺序乱了状态串门）；只在组件或自定义 Hook 里调用。

## 三副手：useRef / useMemo / useCallback

**useRef：不触发渲染的盒子**。两种用途——拿 DOM 引用（[第 6 章](/posts/react-core/06-forms-and-controlled.md)非受控）与存"跨渲染的可变值"（定时器 id、上一次的值）：

```jsx
const timerRef = useRef(null)        // 改 .value 不会触发重渲染
timerRef.current = setInterval(tick, 1000)
// 清理：clearInterval(timerRef.current)（[第 5 章]）
```

**useMemo：缓存昂贵的计算**：

```jsx
const sorted = useMemo(
  () => [...posts].sort((a, b) => b.score - a.score),
  [posts],                            // posts 不变就直接复用上次结果
)
```

注意它是**优化不是语义保证**（缓存可能被丢弃）——派生值的正确性永远靠"渲染期重算也没错"兜底（[第 3 章](/posts/react-core/03-render-and-purity.md)）。**默认不包 useMemo**：先写纯计算，出现可测量的性能问题再包（React Compiler 上线后连这条都在自动化，[第 9 章](/posts/react-core/09-performance.md)）。

**useCallback：缓存函数引用**（等于 `useMemo(() => fn, deps)`）。动机是"函数作为 props 传给被 memo 的子组件"时不破坏其缓存——不是让函数更快：

```jsx
const handleSelect = useCallback((id) => setSelectedId(id), [])
<memoizedList onSelect={handleSelect} />
```

## 实战：useFetch 与闭包陷阱

[第 5 章](/posts/react-core/05-lifecycle-and-effects.md)的竞态请求封装成 Hook：

```jsx
export function useFetch(url) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })

  useEffect(() => {
    let ignore = false
    setState((s) => ({ ...s, loading: true }))
    fetch(url)
      .then((r) => r.json())
      .then((data) => { if (!ignore) setState({ data, loading: false, error: '' }) })
      .catch((e) => { if (!ignore) setState({ data: null, loading: false, error: e.message }) })
    return () => { ignore = true }
  }, [url])

  return state
}

// 组件里：三态直接渲染
const { data, loading, error } = useFetch(`/api/posts/${id}`)
```

**闭包陷阱**（stale closure）是 Hook 时代的头号坑：Effect/回调捕获的 state 是**当次渲染的快照**（[第 2 章](/posts/react-core/02-state-and-events.md)）——定时器里的 `count` 永远是创建时的值。解法三选：函数式 setter（`(c) => c + 1`）、把值进依赖数组、或用 useRef 存"最新值引用"。

## 踩坑提示

- Hook 放进条件分支报"渲染 Hook 数量不一致"——把条件挪进 Hook 内部（`if (enabled) { ... }` 包 effect 体，钩子调用本身留在顶层）。
- useMemo 依赖数组漏对象引用（每次新引用）——缓存永不命中，纯开销。
- 自定义 Hook 返回 reactive 式"魔法"——返回**普通值与稳定函数**，调用方自己解构（Vue 的 toRefs 顾虑在这里不存在，但返回对象也别在渲染期新造——用 useMemo 或直接展开返回）。

## 练习

1. 写 useLocalStorage(key, initial)：state 与 localStorage 双向同步（对照 [Vue 第 8 章](/posts/vue-core/08-composables.md)同名作业）。
2. 复现 stale closure：定时器里读 state 三秒后错，用函数式 setter 修复。
3. 用 React DevTools Profiler 验证 useCallback + memo 的"跳过重渲染"是否真的发生。
