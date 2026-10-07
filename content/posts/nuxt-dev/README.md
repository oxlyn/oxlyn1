---
title: "Nuxt 全栈入门：从 Vue 组件到全栈应用"
description: "Nuxt 系列教程总览：文件路由、数据获取、服务端路由、状态与配置、中间件鉴权、混合渲染、SEO 与部署。"
publishDate: 2026-11-10T09:00:00
tags: ["nuxt", "vue", "教程"]
---

[《Vue 核心入门》](/posts/vue-core/)教会你写组件，[第 9 章](/posts/vue-core/09-ssr-nuxt/)埋下的 SSR 引子在这里展开：**Nuxt 是 Vue 官方生态的全栈框架**——文件路由、自动导入、服务端接口、混合渲染、一键部署，以约定的形式一次给齐。学完本系列，Vue 的知识从"组件级"扩展到"应用级"，你将拥有独立完成一个 SEO 友好的全栈 Web 应用的能力。

> 内容依据 [Nuxt 官方文档](https://nuxt.com/docs/4.x/getting-started/introduction)（4.x 分支，4.4 为当前版）整理，代码示例均为原创，每章附官方文档链接。前置：[《Vue 核心入门》](/posts/vue-core/)的组件与组合式 API；服务端章节对应 [《Node.js 核心入门》](/posts/node-core/)。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：为什么是 Nuxt](/posts/nuxt-dev/01-why-nuxt/) | SSR 动机、约定优于配置、app/ 目录与 DevTools | [Introduction](https://nuxt.com/docs/4.x/getting-started/introduction) |
| [第 2 章：文件路由与布局](/posts/nuxt-dev/02-routing-and-layouts/) | 页面映射、动态路由、NuxtLink、layouts | [Routing](https://nuxt.com/docs/4.x/getting-started/routing) |
| [第 3 章：自动导入](/posts/nuxt-dev/03-auto-imports/) | 三层自动导入、显式取舍、shared/ 目录 | [Auto-imports](https://nuxt.com/docs/4.x/guide/concepts/auto-imports) |
| [第 4 章：数据获取](/posts/nuxt-dev/04-data-fetching/) | useFetch/useAsyncData/$fetch、payload 去重 | [Data Fetching](https://nuxt.com/docs/4.x/getting-started/data-fetching) |
| [第 5 章：服务端路由](/posts/nuxt-dev/05-server-routes/) | server/api、eventHandler、Nitro、全栈类型直通 | [Server Directory](https://nuxt.com/docs/4.x/directory-structure/server) |
| [第 6 章：状态与环境配置](/posts/nuxt-dev/06-state-and-config/) | useState、组合式复用、plugins、runtimeConfig | [State Management](https://nuxt.com/docs/4.x/getting-started/state-management) |
| [第 7 章：中间件与鉴权](/posts/nuxt-dev/07-middleware-and-auth/) | 路由中间件、server middleware、cookie 登录闭环 | [Middleware](https://nuxt.com/docs/4.x/directory-structure/app/middleware) |
| [第 8 章：渲染模式](/posts/nuxt-dev/08-rendering-modes/) | SSR/SSG/CSR/SWR、routeRules、nuxt generate | [Rendering Modes](https://nuxt.com/docs/4.x/guide/concepts/rendering) |
| [第 9 章：SEO 与错误处理](/posts/nuxt-dev/09-seo-and-errors/) | useSeoMeta、OG 卡片、error.vue 统一错误流 | [SEO Meta](https://nuxt.com/docs/4.x/getting-started/seo-meta) |
| [第 10 章：模块生态与部署](/posts/nuxt-dev/10-modules-and-deploy/) | 模块机制、Nitro preset 换端、生产清单 | [Deployment](https://nuxt.com/docs/4.x/getting-started/deployment) |
| [附录：目录与 API 速查](/posts/nuxt-dev/11-appendix/) | 目录、API、routeRules、命令四张表 | — |

## 贯穿项目：notes-web

notes 家族在三个系列里各长了一副面孔，本系列是第三副——**Web 应用**：

```text
第 2 章  页面骨架（列表 / 详情路由）
第 3 章  组件与工具库归位（components + shared）
第 4 章  页面接上数据（useFetch 三态）
第 5 章  server/api 接管存储层（第三次复用 store）
第 6 章  UI 状态与动作收进 composables
第 7 章  登录闭环（cookie + 双层中间件）
第 8 章  按页选渲染模式（列表 SSR、设置 CSR）
第 10 章 部署上线（Node / Cloudflare 双形态）
```

同一套 store 业务层，CLI 服务人（[node-core](/posts/node-core/)）、MCP 服务 AI（[mcp-dev](/posts/mcp-dev/)）、Web 服务浏览器——"业务逻辑与接口形态分离"贯穿始终。

## 三条主线

1. **结构**（第 1、2、3 章）——目录即语义：路由、布局、自动导入、shared 边界；
2. **数据流**（第 4、5、6、7 章）——页面取数、服务端接口、状态与配置、导航与请求的守卫；
3. **形态与上线**（第 8、9、10 章）——混合渲染、SEO 与错误、模块与部署。

## 运行环境

Node 20+，`npm create nuxt@latest` 脚手架；编辑器 VSCode（Volar 扩展）+ 内置 DevTools。系列只用 Nuxt 自带能力与少量官方模块，不引入额外状态库（Pinia 的取舍在第 6 章讨论）。

## 遗留问题

- 大型应用的状态管理（Pinia 深入）与表单方案（vee-validate/zod）未展开；
- `useHead` 的结构化数据（JSON-LD）、图片优化（@nuxt/image）只点到为止；
- Nitro 的存储绑定、任务队列等高阶服务端能力，见[官方 Nitro 文档](https://nuxt.com/docs/4.x/getting-started/deployment)与筹备中的 Hono + Workers 系列。
