---
title: "React 核心入门 · 第 9 章：性能优化"
description: "重渲染的定位与治理、memo 的正确用法、React Compiler 的自动化未来。"
publishDate: 2026-08-09T09:00:00
tags: ["react", "教程"]
---

> 本文对应官方文档[渲染与提交](https://zh-hans.react.dev/learn/render-and-commit)与 React DevTools 文档。

**学习目标**：建立"先测量再优化"的工作流，掌握 memo 家族的正确开合，理解 React Compiler 改变了什么。

## 重渲染：React 的成本模型

React 性能问题的唯一来源是**过多/过重的重渲染**：状态变化 → 沿组件树向下重渲染（调函数）→ diff → 提交。多数"慢"是三件事：渲染了不该渲染的（状态放太高、Context 太宽）、渲染了太重的（单棵子树计算量大）、渲染了太多次的（每 keystroke 全页重算）。

**先测量**：React DevTools Profiler 记录一次交互——哪个组件渲染了几次、耗时多少、"为什么渲染"（props/state 变化明细）一目了然。没有 Profiler 数据的优化都是猜（[鸿蒙第 9 章](/posts/harmonyos-app-dev/09-performance-debug.md)三段式纪律同源）。

## 状态下放：最便宜的一招

把状态放到**真正需要它的最低层**——Context 里放输入框逐字值，全树跟着打字重渲染；挪进输入框组件，只有它自己渲染：

```jsx
// ❌ 逐字输入打爆整棵树
<ThemeProvider value={{ query, setQuery }}>   {/* query 在顶层 */}
  <HugeTree />

// ✅ 高频状态就近放，跨层只传"低频壳"
<QueryInput />        {/* query 只活在这里，用回调通知需要者 */}
<HugeTree />
```

配对动作：**内容当 children 传递**——`<Provider>{children}</Provider>` 里 children 是父组件创建的元素，Provider 自己重渲染时 children 引用不变，整棵子树被跳过。这就是为什么第 7 章的 Provider 写法天然高效。

## memo：显式的缓存边界

`memo` 包裹的组件在 props 浅比较不变时**跳过重渲染**：

```jsx
import { memo } from 'react'

const PostList = memo(function PostList({ posts, onSelect }) {
  /* 昂贵的列表渲染 */
})

// 父组件里：稳定引用是前提
const handleSelect = useCallback((id) => setSelectedId(id), [])
const visible = useMemo(() => posts.filter(p => p.public), [posts])

<PostList posts={visible} onSelect={handleSelect} />
```

**memo 生效的三件套**：组件被 memo、所有 props 引用稳定（对象 useMemo、函数 useCallback）、父组件不滥发重渲染——缺一环就白包。所以纪律是：**先修数据流（状态下放、引用稳定），memo 是最后一道封条**，不是默认配置。React 19 的 Compiler（见下）正在把这一整套自动化。

## 虚拟化与结构治理

- **超长列表**：一次渲染一千个节点谁也救不了——虚拟滚动（react-window/react-virtual 类）只渲染视口内的行，原理同[生成器的惰性](/posts/javascript-core/05-iterators-and-generators.md)"只处理可见"；
- **重组件异步化**：图表/编辑器 `lazy(() => import(...))` + Suspense 占位——首屏不带（[Vite 第 9 章](/posts/vite-dev/09-optimization.md)分割策略的 React 侧）；
- **key 治理**：错误的 key 让 diff 全量重建（[第 4 章](/posts/react-core/04-lists-keys-conditional.md)）——性能与正确性在此合流。

## React Compiler：自动 memo 化

React 19 配套的 **React Compiler**（构建期编译器）自动分析组件，插入等价于 useMemo/useCallback/memo 的记忆化——"依赖数组写对了吗"这一代人的痛正在被工具消化。影响：

- 新项目值得开启（编译器自动跳过"纯组件"的重渲染，符合[第 3 章](/posts/react-core/03-render-and-purity.md)纪律的代码收益最大）；
- **不改变心智模型**：纯组件、稳定引用、"能算出来的别存"——这些纪律仍然是正确性的来源，Compiler 只是替你执行性能部分；
- 存量项目的手工 memo 不必急拆——先开 Compiler 再逐步清理。

## 性能清单（按性价比）

1. Profiler 抓真凶（别猜）；
2. 状态下放 + children 传递；
3. 修 key、拆重组件（lazy + Suspense）；
4. 长列表虚拟化；
5. memo/useMemo/useCallback 三件套收尾（或交给 Compiler）；
6. 每次优化存前后基线。

## 踩坑提示

- 全部组件套 memo：比较成本 + 依赖维护成本可能超过收益——只 memo"确认昂贵"的。
- Context value 每次新对象（[第 7 章](/posts/react-core/07-sharing-state-context.md)首坑）——memo 的子组件照样全渲染。
- 优化后没存基线——两周后没人说得清那次优化到底有没有用。

## 练习

1. 用 Profiler 抓一次输入卡顿，定位到"状态放太高"，下放后对比渲染次数。
2. 给列表组件配齐 memo + useCallback + useMemo 三件套，用 Profiler 验证跳过。
3. 找一个千行列表做虚拟化改造，记录滚动帧率变化。
