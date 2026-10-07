---
title: "Node.js 核心入门 · 第 6 章：HTTP 服务"
description: "node:http 的 req/res 模型、手写路由、内置 fetch——看懂框架之前先看懂底层。"
publishDate: 2026-10-11T09:00:00
tags: ["nodejs", "教程"]
---

> 本文对应官方文档 [HTTP](https://nodejs.org/docs/latest/api/http.html)与[全局 fetch](https://nodejs.org/docs/latest/api/globals.html#fetch)。

**学习目标**：用裸 API 写出能跑的 HTTP 服务与 JSON 接口，理解"框架帮你做了什么"，会用内置 fetch 当客户端。

[《Astro 建站实战》](/posts/astro-from-scratch/)讲过静态站点的分发；这一章往前一步——**动态响应**。先用十几行裸代码看懂 HTTP 服务的本质，之后无论用 Express、Fastify 还是 Hono，本质都是在这一层之上加糖。

## 最小服务器

```js
// server.js
import { createServer } from "node:http"

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" })
  res.end(`你访问了 ${req.url}，方法 ${req.method}`)
})

server.listen(3000, () => console.log("http://localhost:3000"))
```

`createServer` 的回调对**每个请求**执行一次：`req` 是可读流（请求头已解析，请求体按需读取），`res` 是可写流（写完必须 `end()`）。**浏览器里访问后按 F12 看 Network，把报文和这两个对象的字段一一对应**——HTTP 学习的最短路径。

## 手写路由：JSON API

给 notes 加 HTTP 接口。路由 = method + path 的分支，请求体要从流里攒出来：

```js
import { createServer } from "node:http"
import { addNote, loadNotes } from "./store.js"

function sendJSON(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" })
  res.end(JSON.stringify(data))
}

const server = createServer(async (req, res) => {
  const { method } = req
  const url = new URL(req.url, "http://localhost")   // 借 URL 解析 query

  if (method === "GET" && url.pathname === "/api/notes") {
    return sendJSON(res, 200, await loadNotes())
  }
  if (method === "POST" && url.pathname === "/api/notes") {
    const body = await new Response(req).json()      // req 是流，一行变 JSON
    const note = await addNote(String(body.text ?? ""))
    return sendJSON(res, 201, note)
  }
  sendJSON(res, 404, { error: "Not Found" })
})

server.listen(3000)
```

三个来自第 5 章的呼应：`req` 是 Readable，`res` 是 Writable，`new Response(req)` 是 Web 标准对"消费流"的封装。用内置 `fetch` 验证：

```bash
curl -X POST localhost:3000/api/notes -H 'content-type: application/json' -d '{"text":"学 HTTP"}'
curl localhost:3000/api/notes
```

## fetch：Node 也是客户端

`fetch` 是全局函数（底层是 undici），和浏览器同一套：

```js
const res = await fetch("https://httpbin.org/json")
if (!res.ok) throw new Error(`HTTP ${res.status}`)   // fetch 不把 4xx/5xx 当异常！
const data = await res.json()
```

超时用 `AbortSignal.timeout(5000)` 传入第二参数——给一切外部调用加超时是服务端的基本素养。

## 框架补的是什么

裸写的路由每个项目都要重复：路径参数（`/api/notes/:id`）、中间件（日志、鉴权、错误兜底）、内容协商、静态文件……框架就是把它们标准化。看一眼 Hono 之于本章代码的关系，你会发现只是"路由注册换个写法 + 中间件管线"：

```js
app.get("/api/notes", async (c) => c.json(await loadNotes()))
```

理解了 `req/res` 与流，框架文档里的每个概念都有了着落。服务端框架（Hono + Cloudflare Workers）会作为独立系列展开，这里先立起地基。

## 踩坑提示

- 响应"卡住"不结束——某条分支忘了 `res.end()`，连接一直挂着。
- POST 时 JSON 解析报错——客户端没发 `Content-Type: application/json` 或 body 为空，先判空再解析。
- 回调里抛了异常进程直接退出——`createServer` 的回调是 async 时，错误要自己 try/catch 或统一交给 `process.on('unhandledRejection')`（第 10 章）。
- 端口被占用报 `EADDRINUSE`——上一个进程还活着，找出来杀掉或换端口。

## 练习

1. 给 API 加 `GET /api/notes?done=true`：用 `url.searchParams` 过滤。
2. 加 `DELETE /api/notes/:id`：手写路径匹配提取 id，成功返回 204。
3. 用 `fetch` 写一个并发请求 10 个 URL 的脚本，统计各自耗时（对照[JS 系列第 7 章](/posts/javascript-core/07-async-await-and-concurrency/)的 `Promise.all`）。
