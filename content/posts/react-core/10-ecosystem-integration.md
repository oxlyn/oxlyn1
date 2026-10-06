---
title: "React 核心入门 · 第 10 章：生态与 Astro 集成"
description: "React 19 的方向、Server Components 导读、把 React 组件作为岛屿挂进 Astro。"
publishDate: 2026-08-10T09:00:00
tags: ["react", "教程"]
---

> 本文对应 [Astro React 集成指南](https://docs.astro.build/zh-cn/guides/integrations-guide/react/)与 react.dev 的 Server Components 导读。

**学习目标**：认识 React 19 的方向（Compiler/Actions/RSC），把 React 组件作为岛屿接进本站式 Astro 项目，形成框架选型判断。

## React 19 的三个方向

**1. React Compiler**（[第 9 章](/posts/react-core/09-performance.md)）：构建期自动记忆化——手工 memo/useMemo 逐步退役为可选优化。

**2. Actions 与表单现代化**：`<form action={fn}>` 直接把"提交"交给函数（自动 pending 状态、乐观更新、错误处理），`useActionState`/`useOptimistic` 配套——[第 6 章](/posts/react-core/06-forms-and-controlled.md)手写的提交/pending 样板开始框架化。

**3. Server Components（RSC）**：组件标记为在**服务器上执行**——不发它的 JS 到浏览器、可直接 await 数据、直接访问数据库/文件系统：

```jsx
// Server Component（框架内，如 Next.js）
async function PostList() {
  const posts = await db.posts.list()      // 服务器上直接查库
  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>
}
```

RSC 是"组件模型"从客户端向全栈扩张的一步：静态内容零客户端成本，交互部分（useState/useEffect 的组件）仍是客户端组件——这与 [Astro 的岛屿](/posts/astro-from-scratch/07-islands.md)、[Vue 第 9 章](/posts/vue-core/09-ssr-nuxt.md)的水合取舍完全同构：**静态的归静态，交互的归交互**。RSC 的深水区在 Next.js 等全栈框架——本系列不展开，概念对齐即可。

## 在 Astro 岛屿里用 React

本站 Astro 内核是 [Vite](/posts/vite-dev/06-astro-and-vite.md)，接 React 集成一行命令：

```bash
npx astro add react
```

```astro
---
// 页面里：静态部分用 Astro 组件，交互岛用 React
import ThemeSwitcher from '@/components/react/ThemeSwitcher'
import { getPosts } from '@/data/post'
const posts = await getPosts()
---

{posts.map((p) => <PostCard post={p} />)}        {/* Astro 组件：构建期渲染，零 JS */}

<ThemeSwitcher client:load />                     {/* React 岛屿：立即水合 */}
<HeavyChart client:idle />                        {/* 空闲时水合 */}
<CommentBox client:visible />                     {/* 滚进视口才水合 */}
```

四条 `client:*` 水合指令（load/idle/visible/media）与 [Vue 第 10 章](/posts/vue-core/10-production-integration.md)共用同一套——**交互密度决定水合策略**。要点复述：岛屿 props 必须可序列化；岛屿间不共享 React 运行时状态（跨岛通信走 localStorage 或合并大岛）；岛屿内是完整 React（hooks/context 全可用，Context 作用域仅限岛内）。

## 生态地图（按需探索）

- **路由**：React Router（客户端）或 Next.js/Remix（全栈 RSC）；
- **状态库**：Zustand（轻量派）/ Redux Toolkit（结构派）——[第 7 章](/posts/react-core/07-sharing-state-context.md)决策表里"全局高频"的格子；
- **数据请求**：TanStack Query（缓存/竞态/失效管理）——[第 5 章](/posts/react-core/05-lifecycle-and-effects.md)手写竞态守卫的工业化；
- **表单**：React Hook Form（非受控底座）+ zod 校验；
- **样式**：Tailwind（本站路线，[Tailwind 系列](/posts/tailwind-css/08-component-extraction.md)的组件抽取直接适用）。

## Vue 与 React 的选型复盘

[Vue 第 10 章](/posts/vue-core/10-production-integration.md)的结论换个视角依然成立：**React** 显式（重渲染可见、生态最宽、React 19 在把样板自动化）、**Vue** 隐式（响应式内建、单文件聚合、文档亲和）。本站选 Astro 的逻辑（内容优先、交互稀少）与选 React 还是 Vue 正交——Astro 的岛屿机制让你**按岛选框架**，甚至 React 与 Vue 岛并存。

## 踩坑提示

- RSC 组件里用 useState/useEffect 报错——它跑在服务器，交互组件加 `'use client'` 标记（全栈框架内）。
- Astro 岛屿传函数/类实例 props 失败——序列化边界（[Vue 第 10 章](/posts/vue-core/10-production-integration.md)同款）。
- 把"用上 RSC/Compiler"当升级目标而非手段——先有痛点，再上方案（[Rolldown 第 10 章](/posts/rolldown-guide/10-outlook.md)三因子公式的 React 版）。

## 练习

1. 在 Astro 项目接 React 集成，用 client:visible 挂一个计数器岛（对照 [Vue 第 10 章](/posts/vue-core/10-production-integration.md)同名作业）。
2. 把第 6 章的表单改写成 React 19 的 form Action 形态（框架内体验 pending/乐观更新）。
3. 写一段选型备忘：内容站 / 中后台 / 全栈产品三个场景，各选什么组合，为什么。
