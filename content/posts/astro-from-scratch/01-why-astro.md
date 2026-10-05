---
title: "Astro 建站实战 · 第 1 章：为什么是 Astro"
description: "内容优先网站的性能困境、群岛架构与零默认 JS，以及 Astro 组件长什么样。"
publishDate: 2026-09-07T09:00:00
tags: ["astro", "教程"]
---

# 第 1 章 · 为什么是 Astro

> 对应文档：[Why Astro](https://docs.astro.build/en/concepts/why-astro/) · Getting started

## 学习目标

- 理解「内容优先网站」和「应用优先网站」的差异，以及它如何决定技术选型。
- 理解 Astro 的两个核心卖点：**零默认 JS** 与 **群岛架构**。
- 写出第一个 `.astro` 组件，认识它的三段结构。

## 概念：两类网站，两种架构

博客、文档站、作品集、营销页——这类网站的主体是**内容**，交互只是点缀（切换主题、搜索、一个点赞按钮）。仪表盘、Figma、在线文档——主体是**交互**，内容是交互的产物。

对前者，SPA 框架（React/Vue 全家桶）的代价是：哪怕读者只想读一篇文章，浏览器也要下载、解析、执行整个框架运行时，然后才能渲染出本来可以是一段静态 HTML 的内容。数据从 Lighthouse 上的分数就是证据：交互得分被内容网站用不上的 JS 拖垮。

Astro 的回答是两条原则：

1. **默认零 JS**：页面在构建时渲染成纯 HTML，不给浏览器发送任何框架代码。
2. **群岛架构（Islands）**：页面中真正需要交互的局部，才是一个加载 JS 的「岛」，其余全是静态海水。第 7 章展开。

代价是什么？页面默认没有状态、没有浏览器里的重新渲染——如果你要做的是后者（重交互应用），Astro 不是好选择。

## 动手实践：第一个组件

`.astro` 文件分三段：**代码栅栏**（构建时运行，`---` 包裹）、**模板**、可选的 `<style>`/`<script>`：

```astro
---
// ① 代码栅栏：构建时执行，永远不会发给浏览器
const skills = ["HTML", "CSS", "JS"];
---
<!-- ② 模板：语法就是 JSX 的近亲，但没有运行时 -->
<h2>我的技能</h2>
<ul>
  {skills.map((skill) => <li>{skill}</li>)}
</ul>

<style>
  /* ③ 默认 scoped：只作用于本组件，第 4 章细讲 */
  li { color: teal; }
</style>
```

和 React 组件的三个关键差异：

- 栅栏里的代码在**构建时**跑一次，没有 `useState`、没有 `useEffect`，没有重新渲染这回事。
- 模板支持所有 HTML，包括 `<html>` 本身——所以 Astro 组件可以直接当**整个页面/布局**用。
- 事件写原生 `onclick`（小写、字符串）时要小心：它只是 HTML 属性，不绑定 Astro 逻辑；真正的交互用 `<script>`（第 7 章）。

创建项目并跑起来：

```sh
npm create astro@latest   # 选 Empty 模板
npm run dev               # http://localhost:4321
```

## 踩坑提示

- **Astro 不是 SSG 框架的代名词**：它也能 SSR（按需渲染），靠 adapter 切换，第 9 章讲。默认模式下你感受到的「像静态生成器」，只是渲染时机在构建而已。
- **栅栏代码里拿不到浏览器对象**：`document`、`window` 在构建时不存在。需要浏览器逻辑，放 `<script>` 或岛屿里。

## 对照本站

- 根目录 [astro.config.ts](/astro.config.ts) 就是第 1 章概念的实物：`integrations` 里挂了 mdx、sitemap、robotsTxt 等官方/社区集成——Astro 的功能靠这种「加集成」的方式组合，而不是往页面里塞运行时。
- 本站是一个纯内容站：全部页面在构建时生成，浏览器里没有 React/Vue 运行时。唯一的交互（主题切换、搜索、菜单）分别是原生 Web Component 和 Pagefind，见第 7 章的取舍讨论。
- `src/site.config.ts` 里的 `lang: "zh-CN"` 最终进入 `<html lang>`——内容站做 SEO，从这类细节开始。

## 练习

1. 用 `npm create astro@latest` 建一个空项目，把首页改成你的自我介绍（练习 `{array.map()}` 模板语法）。
2. 在代码栅栏里 `console.log("build time")`，然后分别跑 `dev` 和 `build`，观察它在哪里打印——确认「栅栏是构建时」这件事。
3. 故意在栅栏里写 `window.alert("hi")`，读一遍报错信息。

## 遗留问题

自我介绍写完了，但它现在只是 `/` 一个页面。文章列表、每篇文章自己的 URL、翻页——这些路由从哪来？下一章：文件路由。
