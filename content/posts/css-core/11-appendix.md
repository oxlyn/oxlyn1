---
title: "CSS 核心入门 · 附录：属性速查与资源"
description: "CSS 高频属性与函数一页速查，附现代特性清单、官方资源与站内对照索引。"
publishDate: 2026-08-11T09:00:00
tags: ["css", "教程"]
---

## 布局速查

```css
/* Flex（第 3 章） */
display: flex; flex-direction: column;
justify-content: space-between;  /* 主轴 */
align-items: center;             /* 交叉轴 */
gap: 1rem; flex: 1; flex: none; flex-wrap: wrap; align-self: end;

/* Grid（第 4 章） */
display: grid;
grid-template-columns: 15rem 1fr;                /* 显式列 */
grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
grid-template-areas: "head head" "side main";    /* 命名图纸 */
grid-column: 1 / -1; grid-row: span 2;
place-items: center;                              /* 完美居中 */

/* 定位（第 5 章） */
position: relative;      /* 锚点制造者 */
position: absolute; top: -0.5rem; inset-inline-end: 0;
position: sticky; top: 0;
position: fixed; inset-block-start: 0;
z-index: 40; isolation: isolate;   /* 层级与隔离 */
```

## 盒模型与单位（第 1 章）

```css
box-sizing: border-box;
margin-block: 1.5rem; padding-inline: 1rem;   /* 逻辑属性（第 9 章） */
width: min(100% - 2rem, 72rem); margin-inline: auto;
max-width: 65ch;        /* 行长 */
```

## 层叠与响应式（第 2、6 章）

```css
@layer reset, base, components, utilities;
@media (min-width: 48rem) { /* ... */ }
@container (min-width: 20rem) { /* ... */ }   /* container-type 先声明 */
@media (prefers-color-scheme: dark) { /* ... */ }
@media (prefers-reduced-motion: reduce) { /* ... */ }
html { scrollbar-gutter: stable; accent-color: var(--brand); }
```

## 排版与颜色（第 7 章）

```css
font-family: system-ui, "PingFang SC", sans-serif;
font-size: clamp(1.8rem, 1.2rem + 2.5vw, 3rem);   /* 流体排版（第 9 章） */
line-height: 1.75; letter-spacing: -0.01em;
color: oklch(62% 0.19 258 / 0.8);
color-mix(in oklch, var(--brand) 80%, white);
```

## 变量与动效（第 8、9 章）

```css
:root { --bg: oklch(98% 0 0); }
[data-theme="dark"] { --bg: oklch(23.6% 0.005 248); }
color: var(--bg, black);   /* 带回退 */

transition: background-color 0.2s ease-out, transform 0.15s ease-out;
transform: translateY(-2px) scale(1.02);
@keyframes spin { to { transform: rotate(360deg); } }
animation: spin 1s linear infinite;
```

## 现代特性清单

`clamp()/min()/max()` · `:has()` · `:user-valid/:user-invalid` · `@property`（变量可过渡）· 逻辑属性全套 · `dvh/svh` · 容器查询 · `color-mix()` · `@layer` · `text-wrap: balance/pretty` · `overscroll-behavior` · `scroll-behavior: smooth` · `scroll-margin-block`

## 十章一图

| 主线 | 章节 | 一句话 |
| --- | --- | --- |
| 模型 | [1](/posts/css-core/01-box-model/) [2](/posts/css-core/02-selectors-cascade/) | 一切皆盒子；层叠定胜负 |
| 布局 | [3](/posts/css-core/03-flexbox/) [4](/posts/css-core/04-grid/) [5](/posts/css-core/05-positioning/) | Flex 一维、Grid 二维、定位离流 |
| 现代化 | [6](/posts/css-core/06-responsive/) [7](/posts/css-core/07-typography-color/) [8](/posts/css-core/08-transitions-transforms/) [9](/posts/css-core/09-variables-modern.md) | 三层响应式、oklch、GPU 动效、变量与 :has() |
| 工程 | [10](/posts/css-core/10-architecture.md) | token 先行、覆盖留窄道、五模型定位问题 |

## 资源

- [MDN CSS 指南](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides)——本系列依据
- [MDN 属性参考](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference)——逐属性手册与兼容性表
- [web.dev Learn CSS](https://web.dev/learn/css)——Google 视角的配套教程
- [Can I use](https://caniuse.com/)——特性兼容查询

## 站内对照索引

- 原子类视角的同一套机制：[《Tailwind CSS 实战入门》](/posts/tailwind-css/)（层叠 ↔ [第 10 章](/posts/tailwind-css/10-production.md)、断点 ↔ [第 3 章](/posts/tailwind-css/03-responsive.md)、变量 ↔ [第 5、6 章](/posts/tailwind-css/05-dark-mode.md)）
- 本站真例：`global.css` 的 oklch 暗色表、`scrollbar-gutter`、`:target` 余量、unlayered 覆盖通道
- 前置：[《JavaScript 核心入门》](/posts/javascript-core/)第 10 章（DOM 操作与 CSSOM 的交界）
