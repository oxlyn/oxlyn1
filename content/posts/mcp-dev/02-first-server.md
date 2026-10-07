---
title: "MCP 开发入门 · 第 2 章：第一个 MCP 服务器"
description: "TS SDK 项目搭建、McpServer 与 registerTool、stdio 传输、stdout 协议红线、接入现成 Host。"
publishDate: 2026-10-19T09:00:00
tags: ["mcp", "agent", "教程"]
---

> 本文对应官方教程[《Build an MCP server》](https://modelcontextprotocol.io/docs/2026-07-28/develop/build-server)。

**学习目标**：跑通"写一个 Server → 接进现成 Host → 看模型真的调用它"的完整闭环，并记住 stdio 服务器那条最重要的红线。

第 1 章看了地图，这章直接上路。目标服务器只有一个工具，但麻雀虽小：SDK 安装、协议连接、接入 Host 三件事全都要过一遍。

## 项目搭建

TypeScript 项目（Node 20+，[Node 系列环境](/posts/node-core/01-what-is-node/)直接复用）：

```bash
mkdir notes-mcp && cd notes-mcp
npm init -y
npm install @modelcontextprotocol/server zod
npm install -D typescript @types/node
```

```json
{
  "type": "module",
  "bin": { "notes-mcp": "./build/index.js" },
  "scripts": { "build": "tsc" }
}
```

`tsconfig.json` 用官方教程同款关键项：`"module": "Node16"` + `"moduleResolution": "Node16"`（SDK 用了 Node16 风格的子路径导出，`"bundler"` 解析会编译不过）+ `"strict": true` + `"outDir": "./build"`。

> 旧代码和旧教程里常见合并包 `@modelcontextprotocol/sdk`，现行文档已拆为 `@modelcontextprotocol/server` 与 `@modelcontextprotocol/client` 两个包，导入路径一一对应。

## 最小可用的 Server

```ts
// src/index.ts
import { McpServer } from "@modelcontextprotocol/server"
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio"
import { z } from "zod"
import { loadNotes, addNote } from "./store.js"   // 从 node-core 项目抄来的持久层

const server = new McpServer({ name: "notes", version: "1.0.0" })

server.registerTool(
  "add_note",
  {
    description: "添加一条笔记。输入笔记正文，返回创建结果。",
    inputSchema: z.object({
      text: z.string().describe("笔记正文，一句话以内"),
    }),
  },
  async ({ text }) => {
    const note = await addNote(text)
    return { content: [{ type: "text", text: `已添加 #${note.id}：${note.text}` }] }
  },
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("notes MCP server 已就绪（stdio）")
}

main().catch((err) => { console.error(err); process.exit(1) })
```

逐段看重点：`McpServer` 是高层 API，帮你处理第 1 章的握手、分帧、错误回复；`registerTool(名称, 元数据, 处理函数)` 三件套，`inputSchema` 用 zod 声明（SDK 自动转成协议要求的 JSON Schema，`.describe()` 的文字模型看得见）；处理函数收到的是**解析过的参数**（schema 兜底校验），返回 `{ content: [...] }`——内容块数组，第 3 章展开。

`store.js` 直接复制[《Node.js 核心入门》第 4 章](/posts/node-core/04-fs-and-path/)的持久层——**业务逻辑零改动，只是前面挂了个协议门面**，这正是 MCP 的设计意图。

## 红线：stdout 是协议通道

stdio 模式下，JSON-RPC 消息从 stdin 进、从 stdout 出，**一个杂音字节都会让协议解析崩掉**：

```ts
console.log("服务器启动")   // ❌ 写进 stdout = 污染协议流
console.error("服务器启动") // ✅ stderr 随便写，Host 会把它记进日志
```

官方文档用显眼的警告强调这条。养成肌肉记忆：**stdio 服务器里的一切输出走 `console.error` 或日志库，`console.log` 在这个文件类型里等于 bug**。

## 接进现成 Host

以 Claude Desktop 为例（Cursor、VSCode 的配置同构）：编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "notes": {
      "command": "node",
      "args": ["/绝对路径/notes-mcp/build/index.js"]
    }
  }
}
```

重启 Host，它就会**以子进程方式拉起你的 Server**（stdio 传输的本质），握手上台，然后你可以直接说"帮我记一条：学完 MCP 第 2 章"——模型看到工具、发起调用、Host 执行。`env` 字段可以给子进程注入环境变量（第 8 章的凭据管理靠它）。

从这一刻起，你的 notes 从"人敲命令的工具"升级成了"任何 MCP Host 都能用的服务"——写一次，Claude、Cursor、你自己的 Agent 全都能调。

## 踩坑提示

- Host 里服务器不出现——检查配置文件 JSON 语法、路径是否绝对、**完全退出并重启** Host（关窗口不算）。
- 编译后运行报 `Cannot find module`——忘了 `npm run build`，或者 `moduleResolution` 没设成 `Node16`。
- 工具调了但报"参数校验失败"——zod schema 和实际传参对不上，把 `.describe()` 写清楚通常顺带解决。
- 在服务器代码里加了 `console.log` 调试——Host 侧表现为连接异常断开，改回 `console.error`。

## 练习

1. 给服务器加第二个工具 `list_notes`：无参数，返回全部笔记的文本列表。
2. 故意在处理函数里 `console.log`，观察 Host 侧行为，再改回 `console.error`。
3. 把同一个 Server 配置到另一个 Host（如 VSCode），验证"写一次、处处能用"。
