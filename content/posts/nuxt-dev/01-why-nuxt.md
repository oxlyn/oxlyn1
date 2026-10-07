---
title: "Nuxt 全栈入门 · 第 1 章：为什么是 Nuxt"
description: "SSR 的动机、约定优于配置、Nuxt 4 的 app/ 目录结构与 DevTools——从 Vue 组件走向全栈应用的第一步。"
publishDate: 2026-10-30T09:00:00
tags: ["nuxt", "vue", "教程"]
---

> 本文对应官方文档[《Introduction》](https://nuxt.com/docs/4.x/getting-started/introduction)与[《Installation》](https://nuxt.com/docs/4.x/getting-started/installation)。

**学习目标**：理解"Vue 之上 Nuxt 补了什么"，装好脚手架、跑起 DevTools，把 Nuxt 4 的 `app/` 目录结构装进脑子。

[《Vue 核心入门》](/posts/vue-core/)学完，你能写出任何组件，但把它变成"一个网站"还需要：路由、SEO、服务端、部署配置——每样都自己选型和拼装。Nuxt 是 Vue 官方生态的全栈框架，把这些**以约定的形式**一次给齐：[第 9 章](/posts/vue-core/09-ssr-nuxt/)的 SSR 引子，在这里展开成完整答案。

> 内容依据 [Nuxt 官方文档](https://nuxt.com/docs/4.x/getting-started/introduction)（4.x，2026 年 5 月的 4.4 为当前版）整理，代码示例均为原创，每章附官方文档链接。

## Nuxt 补的三件事

**1. 服务端渲染（SSR）默认开启**——Vue 组件在服务器上先渲染成 HTML 发给浏览器，首屏无需等 JS 下载执行；爬虫拿到的直接是完整内容。SEO、首屏性能两大动机，Astro 系列讲过的[渲染哲学](/posts/astro-from-scratch/)在组件级框架里重现。

**2. 约定优于配置**——目录即语义：`pages/` 里的文件自动变成路由，`server/api/` 里的文件自动变成接口，`composables/` 里的函数免导入直接用。你少写的是配置代码，多写的是业务。

**3. 一条命令全栈**——`nuxt dev` 同时起前端、后端、类型检查和 DevTools；`nuxt build` 产物可用同一套代码部署到 Node、Cloudflare、Vercel（第 10 章）。

## 创建项目

```bash
npm create nuxt@latest notes-web   # 官方脚手架，一路按需选
cd notes-web
npm run dev                        # http://localhost:3000
```

贯穿本系列的还是那个老朋友——**notes**：同一套[笔记存储层](/posts/node-core/04-fs-and-path/)，在 node-core 里是 CLI（人用），在 [MCP 系列](/posts/mcp-dev/)里是 AI 工具，这个系列做成 **Web 应用**（浏览器用）。一套业务逻辑、三种客户端，正好检验框架边界。

## app/ 目录：Nuxt 4 的新家

Nuxt 4 把所有浏览器侧代码收进 **`app/` 目录**（Nuxt 3 平铺在根目录，迁移时可对照）：

```text
notes-web/
├── app/                    # 浏览器侧代码的家
│   ├── app.vue             # 根组件
│   ├── pages/              # 文件路由（第 2 章）
│   ├── layouts/            # 布局（第 2 章）
│   ├── components/         # 自动注册的组件（第 3 章）
│   ├── composables/        # 自动导入的组合式函数（第 3 章）
│   └── middleware/         # 路由中间件（第 7 章）
├── server/                 # 服务端代码（第 5 章）
│   ├── api/
│   └── middleware/
├── shared/                 # 前后端共享代码（第 3 章）
├── public/                 # 原样静态资源
└── nuxt.config.ts          # 唯一的配置文件
```

两半分家是 Nuxt 4 最重要的结构变化：`app/` 跑在浏览器（可 SSR），`server/` 只在服务端，`shared/` 两边都能用——**放错位置的代码会在构建或类型检查时立刻暴露**，而不是部署后哑火。

## DevTools：框架自带的驾驶舱

`npm run dev` 后页面底部多了个 Nuxt 图标——内置 DevTools：页面路由树、自动导入清单、组合式函数状态、payload 数据、Nitro 日志全在一处。学每一章时都开它对着看，比读文档更直观。

## 踩坑提示

- 还按 Nuxt 3 习惯在根目录建 `pages/`——4.x 不生效，页面必须在 `app/pages/`；
- 把 `server/` 里的代码 import 进组件——类型报错或构建失败，服务端代码去不了浏览器侧；
- 以为 Nuxt 是"另一个框架"——组件语法与 [vue-core](/posts/vue-core/01-getting-started/) 完全一致，Nuxt 只是工程外壳 + 服务端。

## 练习

1. 用脚手架建 `notes-web`，把 `app/app.vue` 改成自己的标题，用 DevTools 观察路由树。
2. 在 `app/pages/` 建 `about.vue`，浏览器访问 `/about`，体会"文件即路由"。
3. 故意在 `app/` 的组件里 import `server/` 下的工具函数，观察报错信息，理解目录边界的含义。
