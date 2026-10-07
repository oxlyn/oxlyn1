---
title: "MCP 开发入门 · 第 6 章：客户端"
description: "用 SDK Client 写一个不带 LLM 的 mini-host，理解 Host 的职责边界，再对接 Agent 循环。"
publishDate: 2026-10-23T09:00:00
tags: ["mcp", "agent", "教程"]
---

> 本文对应官方教程[《Build an MCP client》](https://modelcontextprotocol.io/docs/2026-07-28/develop/build-client)与[《Client concepts》](https://modelcontextprotocol.io/docs/2026-07-28/learn/client-concepts)。

**学习目标**：从 Host 侧把协议走一遍——连接、发现、调用、关闭；先造一个不需要 LLM 的 mini-host，把职责边界看清楚，再接回 Agent 循环。

写 Server 的人更要懂 Client：Server 的一切设计（工具描述、annotations、isError）都是为了配合 Host 侧的职责。

## SDK Client：四个动词

```ts
// npm install @modelcontextprotocol/client
import { Client } from "@modelcontextprotocol/client"
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio"

// 1. 连接：拉起子进程 + 握手
const transport = new StdioClientTransport({
  command: "node",
  args: ["../notes-mcp/build/index.js"],
})
const client = new Client({ name: "mini-host", version: "0.1.0" })
await client.connect(transport)

// 2. 发现：拿到工具清单（含 schema，转成模型 API 的 tool 定义）
const { tools } = await client.listTools()

// 3. 调用
const result = await client.callTool({
  name: "add_note",
  arguments: { text: "从 mini-host 调用成功" },
})
console.log(result.content)            // [{ type: "text", text: "已添加 #3：…" }]

// 4. 关闭：结束会话、回收子进程
await client.close()
```

`listTools()` 返回的 `name/description/inputSchema` 结构，和模型 API 的 function calling 定义几乎同构——Host 的工作就是**把这仨字段搬运给模型**。

## mini-host：没有 LLM 的 Host

不调模型 API 也能当 Host——"选择工具"这一步手工来：

```ts
import readline from "node:readline/promises"

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
while (true) {
  const input = await rl.question("输入 工具名 JSON参数（直接回车退出）：\n> ")
  if (!input.trim()) break
  const [name, ...rest] = input.split(/\s+/)
  const args = JSON.parse(rest.join(" ") || "{}")
  const result = await client.callTool({ name, arguments: args })
  for (const block of result.content) {
    if (block.type === "text") console.log(block.text)
  }
  if (result.isError) console.log("（工具报告失败）")
}
```

这个三十行的程序是理解协议的透镜：**connect/listTools/callTool 三步之外，全是 Host 的"人"的责任**——真实 Host 里，"手工输入工具名"由模型的工具调用取代，"console.log 展示"由聊天 UI 取代，"你想都没想到就直接执行"由审批弹窗取代。把 LLM 插进来只多两步：`tools` 清单随请求发给模型；模型回的 `tool_use` 映射成 `callTool`——这正是[《从零实现 Agent》第 2 章](/posts/agent-from-scratch/02-agent-loop/)的循环，工具注册表换成 MCP client 而已。

## Host 的责任清单

自研 Host（或评估别人的）时对照这张清单：

- **能力聚合**：连多个 Server（每个一条 Client），工具重名要加命名空间；
- **审批与安全**：依据工具 description/annotations 决定自动放行还是弹窗（第 8 章）；
- **上下文管理**：工具结果怎么进对话、何时截断（第 7 章）；
- **呈现**：内容块（文本/图片）转 UI，`isError` 转错误样式；
- **生命周期**：Server 崩溃重连、Host 退出时收干净子进程（stdio 尤其要防孤儿进程）。

## 踩坑提示

- `callTool` 抛协议异常 ≠ 工具失败——参数不合法等由异常表达，业务失败看 `isError`，两个都要接；
- 连多个 Server 时复用一个 Client——不行，**Client 与 Server 严格 1:1**，多个连接开多个 Client；
- 忘了 `close()`——stdio 子进程挂在后台，测试跑完一堆 node 进程；用 try/finally 收尾；
- 把工具清单缓存到进程退出——服务器可能发 `notifications/tools/list_changed`（第 7 章），长会话里要重拉。

## 练习

1. 跑通 mini-host 全流程：listTools 展示清单 → 调 add_note → 调 search_notes → 退出确认子进程已回收。
2. 同时连 notes-mcp 和另一个 Server，写一个"按工具名前缀加命名空间"的聚合函数。
3. 在 mini-host 里加审批模拟：annotations 有 `destructiveHint: true` 的工具先打印确认提示再执行。
