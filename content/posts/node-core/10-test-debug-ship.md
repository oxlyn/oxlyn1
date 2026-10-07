---
title: "Node.js 核心入门 · 第 10 章：测试、调试与上线"
description: "node:test 内置测试、--inspect 断点调试、错误兜底与部署清单——把能跑的代码变成能托付的代码。"
publishDate: 2026-10-15T09:00:00
tags: ["nodejs", "教程"]
---

> 本文对应官方文档 [Test runner](https://nodejs.org/docs/latest/api/test.html)与[《Debugging Node.js》](https://nodejs.org/en/learn/getting-started/debugging)。

**学习目标**：用零依赖的 node:test 给 notes 写单元测试，掌握 inspect 断点调试，建立生产环境的错误兜底与部署清单。

能跑 → 能测 → 能查 → 能托付，工程化的最后一段路。本章刻意全用 Node 内置能力——测试框架与断言库都内置了，小项目连依赖都不用加；理解了它们，再看 [Vitest](https://vitest.dev) 这类框架（后续会有独立系列）只是换语法。

## node:test：内置的测试器

```js
// store.test.js
import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

describe("store", () => {
  let dir
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "notes-"))   // 每个测试独立的临时目录
  })

  test("add 后能 list 出来", async () => {
    const store = makeStore(dir)
    await store.add("第一条")
    const notes = await store.list()
    assert.equal(notes.length, 1)
    assert.equal(notes[0].text, "第一条")
  })

  test("空存储返回空数组", async () => {
    const store = makeStore(dir)
    assert.deepEqual(await store.list(), [])
  })
})
```

测试要点全在结构里：`assert/strict` 的方法名即语义（`equal`/`deepEqual`/`throws`/`rejects`）；**测试之间必须隔离**——这里用临时目录 + `beforeEach`，结束后 `rm` 清理；异步测试直接 `await`，失败的 Promise 会正确标记用例失败。跑起来：

```bash
node --test            # 按 *.test.js 约定自动发现
node --watch store.test.js   # 改代码自动重跑，配合开发
```

`node:test` 还内置 mock：`t.mock.method(console, "log")` 可以替换任意对象方法、验证调用——依赖注入做对了，测试就不需要第三方 mock 库。

## 调试：从 console.log 到断点

console.log 能解决一半问题；另一半靠**调试器**。Node 开箱支持 Chrome DevTools 协议：

```bash
node --inspect-brk main.js
# Debugger attached. → Chrome 打开 chrome://inspect，或 VSCode 直接 F5
```

VSCode 里更简单：launch.json 加 `"type": "node"` 的配置，断点、单步、调用栈、变量面板全套。查"对象到底长什么样"用 `console.dir(obj, { depth: null })` 或 `util.inspect`，比默认的两层深度打印诚实得多。

## 错误兜底：最后一道防线

异步错误的两个"逃逸口"，生产环境必须接住：

```js
process.on("uncaughtException", (err) => {
  console.error("未捕获异常", err)
  process.exitCode = 1        // 记录后退出——带着损坏的状态硬撑比重启危险
})
process.on("unhandledRejection", (reason) => {
  console.error("未处理的 Promise 拒绝", reason)
  process.exitCode = 1
})
```

原则：**兜底记录，然后退出**。吞掉错误继续跑，进程状态已不可信。配合第 6 章在服务器层为每个请求 try/catch，把已知错误变成 500 响应，未知错误才落到这里。

## 上线清单

进程交给谁管、日志往哪写、挂了怎么办：

- **进程管理**：systemd / pm2 / 容器编排任选其一，职责都是崩溃自动重启 + 开机自启；
- **优雅重启**：接第 9 章的 SIGTERM 处理——先停止接新请求、清空在途请求、落盘、再退出；
- **日志写 stdout**，交给运行环境收集，别在应用里自己管日志文件；
- **健康检查**：`/health` 返回 200（第 6 章练习写过），供负载均衡探活；
- **配置全走环境变量**（第 9 章），镜像与配置分离。

至此本系列闭环：notes CLI 从第 4 章的十行存储长成了带测试、可发布、能部署的工具。往前走的三条路都通了——[《从零实现 Agent》](/posts/agent-from-scratch/)（把流、子进程、事件全部用上）、服务端框架（Hono/Workers 系列）、以及把这一章的测试升级为 Vitest + Playwright 的工程化测试系列。

## 踩坑提示

- 测试共享真实的数据目录——测试把你的笔记删了；永远 mock 或指向临时目录。
- `assert.deepEqual` 用的宽松相等（`==` 语义）——一律 `import assert from "node:assert/strict"`。
- 只在生产开 `--inspect`——等于把调试端口暴露给公网；调试只在本机或内网。
- 用 `process.exit()` 收尾导致日志缺尾——第 9 章讲过，设 `exitCode` 让流排空。

## 练习

1. 给 `store.js` 补 `remove(id)` 的测试：删除存在的返回 true、不存在的返回 false 且数据不变。
2. 给 HTTP 服务加统一错误中间件：任何 handler 抛错返回 500 JSON，并用测试验证。
3. 用 `--inspect-brk` 在 `addNote` 里下断点，观察调用栈与变量面板，然后故意抛一个异常看未捕获路径。
