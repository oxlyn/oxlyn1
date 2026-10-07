---
title: "MCP 开发入门 · 第 9 章：测试、调试与发布"
description: "MCP Inspector 三形态、协议级测试、版本协商与日期版本号、npm 发布与 npx 分发。"
publishDate: 2026-10-26T09:00:00
tags: ["mcp", "agent", "教程"]
---

> 本文对应官方[《Inspector》](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector)、[《Debugging》](https://modelcontextprotocol.io/docs/2026-07-28/tools/debugging)与[《Versioning》](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning)。

**学习目标**：会用官方 Inspector 在三个层面调试，给 Server 建立自动化测试，理解日期版本号的协商规则，最后把 Server 发布出去。

第 2 章接入 Host 后，出问题时你看到的是"模型没调用""调用失败"这类模糊现象——因为隔着两层：模型决策 + 协议会话。调试 MCP 就是把这两层拆开看。

## Inspector：官方透镜

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

一条命令拉起[官方 Inspector](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector)，三种形态对应三个调试深度：

- **Web UI**（浏览器打开）：连接 Server，手动 `tools/list`、填参数 `tools/call`，**请求与响应的 JSON-RPC 原文直接可见**——第 1 章学的消息形状在这里兑现；
- **CLI**：`--cli` 模式一行命令测一个调用，适合脚本化回归；
- **TUI**：终端交互界面，远程服务器上没有浏览器也能用。

调试心法按层剥洋葱：**连接失败看握手日志（stderr），调用失败先在 Inspector 里复现（协议层），Inspector 里正常但模型不调用（描述层）**——第三层往往不是 bug，是 description 写得让模型读不懂，回第 3 章改提示词。

## 协议级测试

把工具处理函数写成**纯函数**（输入 → 输出，不碰传输），就可以用[《Node.js 核心入门》第 10 章](/posts/node-core/10-test-debug-ship/)的 `node:test` 直接单测：

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { searchNotesHandler } from "./handlers.js"

test("search_notes 无结果返回 isError", async () => {
  const result = await searchNotesHandler({ keyword: "不存在的词", limit: 10 })
  assert.equal(result.isError, true)
  assert.match(result.content[0].text, /没有包含/)
})
```

传输层以上再补一条**协议冒烟测试**：用 SDK 的 Client 连自己的 Server（`new StdioClientTransport({ command: "node", args: ["build/index.js"] })`），断言 connect → listTools → callTool 全链路通——mini-host（第 6 章）稍加封装就是现成的测试桩。行为变更时，这条冒烟测试比任何单元测试都早发现问题。

## 版本化：日期即版本

MCP 的规范版本是**日期**（2025-06-18 → 2025-11-25 → 2026-07-28），协商在第 1 章的 initialize 里完成：客户端声明它支持的最高版本，服务器要么支持要么回退到自己最新的兼容版。对你意味着：

- **读文档先看路径里的日期**，新旧版本行为差异以 [changelog](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning) 为准；
- SDK 升级 = 适配新规范版本，`protocolVersion` 由 SDK 代管；
- 自己发协议消息（测试、网关）时硬编码日期版本要跟规范走。

## 发布：npm 生态复用

stdio Server 的分发就是一次普通的 npm 发包（[第 3 章](/posts/node-core/03-npm-and-packages/)的全套知识原样适用）：

```json
{
  "name": "notes-mcp",
  "bin": { "notes-mcp": "./build/index.js" },
  "files": ["build"],
  "engines": { "node": ">=20" }
}
```

用户侧用 `npx notes-mcp` 即插即用——`mcpServers` 配置里写 `{"command": "npx", "args": ["-y", "notes-mcp"]}`。生态里所有主流 Server（官方的文件系统、GitHub 服务器等）都是这个模式，[examples 目录](https://modelcontextprotocol.io/examples)是学习别人工具面设计的最佳素材。

## 踩坑提示

- 只在真实 Host 里调试——Host 的重试、缓存会掩盖协议细节；先 Inspector 后 Host；
- 测试直连了业务实现却没测协议层——schema 校验错误、握手失败只在链路上暴露；
- 发布前忘了 `files: ["build"]`——把 src 和 node_modules 打进包里，体积翻十倍；
- Host 配置里用相对路径——子进程的 cwd 不一定是你想的那个目录，写绝对路径或用 npx。

## 练习

1. 用 Inspector 连 notes-mcp，找到 `tools/call` 的 JSON-RPC 原文，与第 1 章手写的消息对照。
2. 把第 2~4 章的工具处理函数抽成 handlers.js，补三个单测（成功 / isError / schema 拒绝）。
3. 跑一条完整的协议冒烟测试，然后故意改坏一个工具名，确认冒烟测试能抓住。
