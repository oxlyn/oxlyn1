---
title: "Nuxt 全栈入门 · 第 5 章：服务端路由"
description: "server/api 的文件即接口、eventHandler 与 getQuery/readBody、Nitro 运行时、全栈类型直通。"
publishDate: 2026-11-03T09:00:00
tags: ["nuxt", "vue", "教程"]
---

> 本文对应官方文档[《Server Directory》](https://nuxt.com/docs/4.x/directory-structure/server)。

**学习目标**：掌握 server/api 的路由映射与事件处理器写法，理解 Nitro 服务引擎的定位，把 notes 的存储层接成真正的后端接口。

[《Node.js 核心入门》第 6 章](/posts/node-core/06-http-server/)里，接口要自己 `createServer`、手写路由分支；Nuxt 把这件事收敛成"**`server/api/` 下建个文件**"。前端框架带后端，不是送你一个玩具，而是一台完整的 **Nitro** 服务引擎。

## 文件即接口

```text
server/api/
├── notes.get.ts          →  GET  /api/notes
├── notes.post.ts         →  POST /api/notes
└── notes/[id].get.ts     →  GET  /api/notes/:id
```

规则与 pages 同构：目录树即路径，**方法写进文件名后缀**（`.get.ts`/`.post.ts`/`.put.ts`/`.delete.ts`），不带后缀的文件接收所有方法。

```ts
// server/api/notes.get.ts
import { loadNotes } from '../utils/store'    // 业务逻辑：node-core 抄来的 store

export default defineEventHandler(() => loadNotes())
```

```ts
// server/api/notes.post.ts
import { addNote } from '../utils/store'
import { isNoteText } from '~~/shared/utils/noteSchema'   // 第 3 章 shared 的同一份校验

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!isNoteText(body?.text)) {
    throw createError({ statusCode: 400, statusMessage: '笔记文本不合法' })
  }
  return addNote(body.text)
})
```

`defineEventHandler` 拿到的 **event 对象**就是请求上下文（相当于第 6 章的 `req` + `res` 合体）：`getQuery(event)` 取查询参数，`readBody(event)` 读请求体，`getRouterParam(event, 'id')` 取路径参数；`createError` 抛错自动变成对应状态码的 JSON 响应。这些 API 自动导入，不用写 import。

## Nitro：藏在 server/ 后面的引擎

`server/` 目录的运行时是 **Nitro**——Nuxt 的服务端引擎，几件值得知道的事：

- 它不只是开发期玩具：`nuxt build` 产出的**后端部分就是 Nitro 应用**，和前端一起部署（第 10 章）；
- 除了 `api/`，还有 `server/routes/`（任意路径的原始路由，如 sitemap）、`server/middleware/`（每个请求必经的中间件，第 7 章）；
- [node-core 的流、子进程、fs](/posts/node-core/) 在这里全都可用——这就是个 Node 环境，只是路由和类型帮你写好了。

## 全栈类型直通

最舒服的体验在类型上：`server/api` 的**返回值类型会自动流入前端**——

```ts
const { data } = await useFetch('/api/notes')
//    data 的类型：{ id: number, text: string, createdAt: string }[] | null
//    来自 notes.get.ts 的返回值，无需手写任何 interface
```

后端改了返回形状，前端立刻类型报错。这份"改接口不破前端"的安全感，是全栈框架相对"前后端分离手写类型"的最大红利。

## store 接入：第三次复用

把 [node-core 第 4 章](/posts/node-core/04-fs-and-path/)的 `store.js`（JSON 持久层）原样放进 `server/utils/store.ts`（`server/utils` 自动导入），`getRouterParam` 替代 CLI 的 argv，`createError` 替代 CLI 的退出码——**同一家店，第三种顾客**：CLI 服务人，MCP 服务 AI，Web 服务浏览器。接口清单：`GET/POST /api/notes`、`GET/DELETE /api/notes/[id]`。

## 踩坑提示

- 接口 404——文件名后缀忘了写（`notes.get.ts` 写成 `notes.ts` 又只回 GET 逻辑），或文件不在 `server/api/` 下；
- `readBody` 拿到 undefined——客户端没发 `Content-Type: application/json`（`$fetch` 会自动带，手写 fetch 别忘）；
- 在 server 代码里用了 `useFetch`/`useState`——这些是浏览器侧 API，服务端只有 event 体系；
- 把密钥写进 server 代码——环境变量与 `runtimeConfig` 才是正道（第 6 章）。

## 练习

1. 实现全部四个接口，用 `$fetch` 或 curl 逐个验证，故意传非法 body 看 400 响应。
2. 加 `GET /api/notes?keyword=x`：用 `getQuery` 过滤，确认前端 `useFetch` 的响应类型随之更新。
3. 把校验逻辑挪进 `shared/`，在接口里故意传超长文本，验证前后端同一份规则拦截。
