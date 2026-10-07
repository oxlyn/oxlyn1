---
title: "Nuxt 全栈入门 · 附录：目录与 API 速查"
description: "目录结构速查、组合式 API 速查、routeRules 速查、命令速查与资源链接。"
publishDate: 2026-11-09T09:00:00
tags: ["nuxt", "vue", "教程"]
---

本系列的目录约定、组合式 API 与配置项浓缩成四张表。

## 目录结构速查

| 路径 | 语义 | 章节 |
| --- | --- | --- |
| `app/pages/` | 文件即路由，`[id].vue` 动态、`[...slug].vue` 兜底 | 2 |
| `app/layouts/` | 布局骨架，`<slot />` 注入页面 | 2 |
| `app/components/` | 文件名即标签，目录即命名空间 | 3 |
| `app/composables/` `app/utils/` | 免导入的函数库 | 3 |
| `app/middleware/` | 路由中间件，`.global.ts` 全局生效 | 7 |
| `app/plugins/` | 启动期注入（克制使用） | 6 |
| `server/api/` | 文件即接口，方法写在文件名后缀 | 5 |
| `server/middleware/` | 每个请求必经的服务端中间件 | 7 |
| `server/utils/` | 服务端免导入工具（store 层） | 5 |
| `shared/` | 前后端共享代码（类型、校验、常量） | 3 |
| `public/` | 原样静态资源 | 1 |

## 组合式 API 速查

| API | 用途 | 关键点 |
| --- | --- | --- |
| `useFetch(url)` | 页面取数快捷方式 | `await` 写在 setup；进 payload，客户端不重取 |
| `useAsyncData(key, fn)` | 通用异步取数 | key 全局唯一，同 key 共享单例请求 |
| `$fetch` | 裸请求 | 事件回调里的写操作，不进 payload |
| `useState(key, init)` | SSR 安全共享状态 | 初始值必须是函数 |
| `useRoute()` / `navigateTo()` | 路由读取 / 编程式导航 | 只在组件上下文可用 |
| `useCookie(name)` | cookie 读写 | SSR 首屏即可见 |
| `useSeoMeta()` / `useHead()` | 页面元信息 | 传 getter 保持响应式 |
| `useRuntimeConfig()` | 读环境配置 | 密钥只碰非 public 区 |
| `definePageMeta()` | 页面级配置 | layout / middleware |
| `defineEventHandler()` | 服务端事件处理 | 配 `getQuery` / `readBody` / `getRouterParam` / `createError` |

## routeRules 速查

```ts
routeRules: {
  '/':            { swr: 60 },        // 缓存 60s，过期后台再生
  '/notes/**':    { ssr: true },      // 标准 SSR
  '/account/**':  { ssr: false },     // 纯客户端渲染
  '/about':       { prerender: true },// 构建时静态生成
  '/api/**':      { cors: true },     // 接口级配置
}
```

## 命令速查

```bash
npm create nuxt@latest <name>   # 脚手架
nuxt dev                        # 开发服务器（localhost:3000）
nuxt build                      # 生产构建（Nitro 产物 .output/）
node .output/server/index.mjs   # 运行 Node 形态产物
nuxt generate                   # 静态生成（prerender 路由 + 爬链接）
npx nuxi module add <mod>       # 安装模块并写配置
```

## 资源

- 官方文档：[nuxt.com/docs/4.x](https://nuxt.com/docs/4.x/getting-started/introduction)（每页 URL 加 `.md` 可取原始 Markdown）
- 模块目录：[nuxt.com/modules](https://nuxt.com/modules)
- 组合式 API 参考：[useFetch](https://nuxt.com/docs/4.x/api/composables/use-fetch) / [useAsyncData](https://nuxt.com/docs/4.x/api/composables/use-async-data)
- 部署指引：[nuxt.com/deploy](https://nuxt.com/deploy)

## 进阶路线

1. **测试**——Vitest 单测 + Playwright E2E（工程化测试系列筹备中），第 4 章的 composables 与第 5 章的 handlers 都是好测对象；
2. **深挖 Nitro**——server routes 的完整能力（缓存、任务、存储绑定）见官方 Nitro 文档；
3. **对比阅读**——[Astro 建站实战](/posts/astro-from-scratch/)（内容优先的渲染）与本系列（组件优先的全栈）合读，混合渲染的决策树就完整了；
4. **实战整合**——把 notes-web 的接口按 [MCP 系列](/posts/mcp-dev/05-transports/)第 5 章换成 MCP 传输，AI 与浏览器共用同一业务层。
