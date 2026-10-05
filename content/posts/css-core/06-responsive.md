---
title: "CSS 核心入门 · 第 6 章：响应式与容器查询"
description: "媒体查询的正确姿势、现代视口单位、容器查询——三层自适应体系一次讲清。"
publishDate: 2026-08-06T09:00:00
tags: ["css", "教程"]
---

> 本文对应 MDN 指南[媒体查询](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Media_queries)与[容器查询](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Containment/Container_queries)。

**学习目标**：掌握媒体查询的语法与移动优先写法，认识现代视口单位，学会用容器查询做组件级自适应。

## 媒体查询：按条件分层交付

```css
/* 基础样式：移动优先（无查询，所有设备） */
.layout { display: flex; flex-direction: column; }

@media (min-width: 48rem) {        /* 768px 起：加桌面能力 */
  .layout { flex-direction: row; }
}

@media (min-width: 64rem) {        /* 1024px 起：再加 */
  .layout { grid-template-columns: 15rem 1fr; }
}
```

与 Tailwind 的 `md:` 前缀（[Tailwind 第 3 章](/posts/tailwind-css/03-responsive.md)）对照着看：`md:flex` 的编译产物就是这条 `@media (min-width: 48rem)`——**原子类的响应式前缀只是媒体查询的语法糖**。

常用媒体特征：`min-width/max-width`（宽度）、`prefers-color-scheme`（暗色，[Tailwind 第 5 章](/posts/tailwind-css/05-dark-mode.md) media 流派的底层）、`prefers-reduced-motion`（用户要求减少动画——无障碍必配）、`hover: none`（触屏设备）。逻辑组合用 `and / or / not`。

## 视口单位：svh/dvh 时代

`100vh` 在移动端被地址栏反复横跳坑了十年。现代修正：

- `svh`：最小视口（地址栏展开时）——保证完全可见的高度用它；
- `dvh`：动态视口（跟随地址栏收放）——全屏沉浸区用它；
- `lvh`：最大视口。

规则一句话：**全屏布局用 dvh/svh，别再裸写 vh**。

## 容器查询：组件的自适应

媒体查询看**视口**，有个先天盲区：同一个组件放进窄侧栏和宽主区，媒体查询无法区分。容器查询让组件**看自己的容器**：

```css
.widget-wrap { container-type: inline-size; }        /* 声明为查询容器 */

@container (min-width: 20rem) {                       /* 容器 ≥ 320px 时 */
  .widget { display: grid; grid-template-columns: 1fr 2fr; }
}
```

判定口诀（[Tailwind 第 3 章](/posts/tailwind-css/03-responsive.md)同款结论）：**页面级布局看视口（媒体查询），可复用组件看容器（容器查询）**。Tailwind 的 `@container`/`@sm:` 变体就是它的语法糖。

## 一个被低估的配角：scrollbar-gutter

滚动条出现/消失导致的页面横向抖动，一行治理：

```css
html { scrollbar-gutter: stable; }   /* 常驻滚动条槽位——本站 global.css 在用 */
```

同族的无障碍三件套也值得抄进每个项目：

```css
html { accent-color: var(--brand); }             /* 表单控件跟主题色（本站在用） */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

## 响应式的完整栈

把三层能力拼成决策树：**布局骨架**（单栏/双栏）→ 视口媒体查询；**可复用组件**（卡片/侧边小部件）→ 容器查询；**连续微调**（标题随宽度缩放）→ `clamp()`（第 9 章）。三者配合后，媒体查询的断点数量通常比三年前少一半——大量"断点"其实是 clamp 和容器的活。

## 踩坑提示

- 断点值用 rem（`min-width: 48rem`）：用户缩放浏览器字号时断点同步平移，行为更一致。
- 容器查询忘了 `container-type` 声明，@container 永远不命中——它是开关。
- `prefers-reduced-motion` 全局禁动画时别一刀切掉"功能性反馈"（如加载转圈），用更缓的替代。

## 练习

1. 把一个双栏布局用移动优先媒体查询实现，数一数你用了几条 min-width。
2. 做一个卡片：放进 240px 侧栏是单行、放进 600px 主区是双栏（容器查询实现）。
3. 在真机浏览器验证 100vh 与 dvh 的地址栏差异。
