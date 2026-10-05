---
title: "Astro 建站实战 · 第 7 章：交互岛屿"
description: "群岛架构落地：client 指令五种水合策略、框架混用、slot 传内容，以及不用框架的第三条路。"
publishDate: 2026-09-13T09:00:00
tags: ["astro", "教程"]
---

# 第 7 章 · 交互岛屿

> 对应文档：[Framework components](https://docs.astro.build/en/guides/framework-components/) · [Client directives](https://docs.astro.build/en/reference/directives-reference/)

## 学习目标

- 理解岛屿 = 「服务端渲染的静态 HTML + 按需水合的交互孤岛」。
- 掌握五种 `client:*` 指令的取舍。
- 知道岛屿的三条边界：不能嵌 Astro 组件、props 要可序列化、Astro 组件本身不可水合。

## 概念

第 1 章说过：默认零 JS，交互的局部才是「岛」。落地分两步：

1. `npx astro add react`（或 svelte/vue/solid）——安装集成。
2. 在 `.astro` 模板里像用普通组件一样用框架组件，加 `client:*` 指令声明**何时**水合。

## 动手实践：五种 client 指令

```astro
---
import Like from "../components/Like.jsx";
import Comments from "../components/Comments.jsx";
import ThemePicker from "../components/ThemePicker.jsx";
---
<Like client:load />                       {/* 立即水合：首屏交互关键件 */}
<Comments client:idle />                   {/* 浏览器空闲再水合：次要交互 */}
<Comments client:visible />                {/* 滚进视口才水合：评论区标配 */}
<ThemePicker client:media="(max-width: 768px)" /> {/* 仅匹配媒体查询时：移动端专属件 */}
<MyWidget client:only="react" />           {/* 跳过服务端渲染，纯客户端 */}
```

默认（不加指令）框架组件也会**服务端渲染成静态 HTML**——没有 JS 但内容可见；`client:only` 是唯一跳过服务端渲染的。

三条边界，文档写得很直白：

- **岛屿里不能 import Astro 组件**。Astro 的静态内容想进岛屿，用 slot 从外面传：`<MySidebar><AstroThing slot="header" /></MySidebar>`。
- **props 必须可序列化**：函数传不过去（服务端/客户端两个世界），React 的 render-props 模式失效——用命名 slot 替代。
- **Astro 组件加 `client:*` 会报错**：它没有运行时，无水合可言。需要交互就用 `<script>`（作用域是全局的，每个组件只执行一次）。

## 踩坑提示

- 岛屿的 JS 成本按「框架运行时 + 组件代码」计，同一框架多个岛共享一份运行时——所以**同页尽量用同一框架**。
- `client:visible` 的组件若初始渲染依赖视口计算，注意水合前后的一帧闪烁。
- 大多数「我需要一点交互」的场景（主题切换、折叠面板、回到顶部）其实一个原生 `<script>` + 几行 DOM 操作就够，不需要整个岛屿——先问这问题值多少 KB。

## 对照本站

本站是「岛屿克制度」的极端样本：**全站零框架岛屿**，三个交互件全是手写的：

- [ThemeToggle.astro](/src/components/ThemeToggle.astro) / [ThemeProvider.astro](/src/components/ThemeProvider.astro)：`<theme-toggle>` 自定义元素 + 几十行 script，读写 `localStorage` 并切 `data-theme`。
- [Header.astro](/src/components/layout/Header.astro)：移动端菜单是一个 `<mobile-button>` 自定义元素，十行以内。
- [Search.astro](/src/components/Search.astro)：搜索是构建期的 Pagefind 索引 + 一个 `<pagefind-config>` 元素加载其 UI——**搜索这种重交互也可以不引入框架运行时**。

为什么这么抠？第 1 章的立场一以贯之：内容站的每个 KB 都该花在读者可感知的地方。什么时候该用真岛屿？看练习 3。

## 练习

1. `npx astro add react`，写一个 `<Like />` 组件（点击 +1），分别用默认、`client:load`、`client:visible` 渲染三次，对比网络面板里的 JS 数量。
2. 给岛屿通过命名 slot 传入一段 Astro 渲染的静态内容，并在 React 里用 `props.header` 接住。
3. 假设要做「文章打分」组件（五颗星、需要状态、需要动画），决策一下：原生 script 还是 React 岛屿？写出理由。

## 遗留问题

站点的骨架、内容、交互都齐了。但搜索引擎怎么找到你？订阅者怎么订阅你？分享到社交平台的卡片图从哪来？下一章：SEO 与分发。
