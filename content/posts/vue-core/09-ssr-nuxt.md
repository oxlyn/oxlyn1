---
title: "Vue 核心入门 · 第 9 章：SSR 与 Nuxt"
description: "服务端渲染解决什么问题、水合的代价、Nuxt 的约定式开发与本站 Astro 的选型对照。"
publishDate: 2026-08-21T09:00:00
tags: ["vue", "教程"]
---

> 本文对应官方文档[服务端渲染](https://cn.vuejs.org/guide/scaling-up/ssr.html)。

**学习目标**：理解 CSR/SSR/SSG 三种渲染模式的收益与代价，认识 Nuxt 的约定，能对本站式项目做出选型判断。

## 渲染模式的三国志

前几章的 Vue 应用都是 **CSR**（客户端渲染）：服务器发一个空壳 HTML，全靠浏览器里执行 JS 画出界面。代价两条：**首屏慢**（要等 JS 下载执行完）、**SEO 弱**（爬虫看到的空壳）。两种补救：

- **SSR**（服务端渲染）：服务器执行 Vue 组件、吐出**填好内容的 HTML**，浏览器立即显示；随后 JS 接管，绑事件、挂响应式——这步叫**水合（hydration）**。首屏快、SEO 好，代价是服务器要跑组件代码、写法有约束（[第 5 章](/posts/vue-core/05-lifecycle-watchers.md)的伏笔：onMounted 只在客户端跑）；
- **SSG**（静态生成）：构建时把页面渲染成 HTML 文件，部署即 CDN——**本站 Astro 就是 SSG**（[建站第 1 章](/posts/astro-from-scratch/01-why-astro.md)的"默认零 JS"）。

| 模式 | 首屏 | SEO | 服务器成本 | 交互密度 |
| --- | --- | --- | --- | --- |
| CSR | 慢 | 弱 | 低 | 高 |
| SSR | 快 | 好 | 中 | 高 |
| SSG | 最快 | 好 | 最低 | 看水合策略 |

判断主线一句话：**内容优先（博客/文档/电商详情）→ SSG/SSR；应用优先（后台/编辑器）→ CSR**。

## 水合的代价与混合渲染的动机

SSR 页面"看起来成了"但还**不能点**——事件绑定要等水合完成，JS 包越大"可交互时间"越晚。这催生了混合思路：**静态部分不水合，交互部分才水合**。

这正是 [Astro 岛屿架构](/posts/astro-from-scratch/07-islands.md)的立意：页面默认是零 JS 的静态 HTML，只有交互组件（岛屿）各自水合。SSR 派框架（Nuxt/Next）也在同方向演进（岛屿/服务器组件），殊途同归。

## Nuxt：Vue 的全栈框架

[Nuxt](https://nuxt.com/) 是 Vue 官方生态的服务端框架，类比 React 世界的 Next.js：

- **文件式路由**：`pages/` 目录即路由表（[Astro 第 2 章](/posts/astro-from-scratch/02-routing.md)同款约定）；
- **混合渲染**：每条路由可选 SSG/SSR/CSR（`routeRules` 按路径配置）；
- **数据获取**：`useFetch`/`useAsyncData` 处理"服务端取数 → 客户端水合"的数据一致性（普通 onMounted 取数在 SSR 下会闪空白，这组 API 就是解药）；
- **自动导入**：components/composables 目录免 import。

上手成本主要在水合心智：**组件在服务器和客户端各执行一次**——代码里不能依赖"只有浏览器"的 API（window/document 进 onMounted 或 client-only 包裹），随机值（时间戳/uuid）会在两端不一致导致水合警告。

## 本站的选型复盘

为什么本站选 Astro 而不是 Nuxt：内容型博客、交互稀少（主题切换/搜索/移动菜单），Astro 的"默认零 JS + 按需岛屿"收益最大化；如果做的是"评论/后台/实时协作"这类重交互产品，Nuxt/Next 的全栈能力（服务端 API、会话、数据库直连）才是主场。**框架选型跟交互密度走，不跟流行度走**。

## 踩坑提示

- SSR 下直接用 `window`/`localStorage` 报 ReferenceError——统一收进 onMounted 或 `import.meta.client` 分支。
- 水合不匹配（服务端与客户端渲染结果不一致）是 SSR 头号坑：随机数、Date.now、用户时区都是嫌疑犯。
- SSR 的"服务端成本"被低估：每请求一次渲染，缓存策略（CDN 缓存 HTML）从可选项变成必选项。

## 练习

1. 用 Vite 建一个纯 CSR 应用，禁用 JS 刷新页面，体会"空壳"的含义。
2. 在 Nuxt 里建两页：一页 SSG、一页 SSR（routeRules 配置），Network 面板对比响应体。
3. 写一个显示"当前时间"的组件，制造水合不匹配，再用 onMounted 延迟修复。
