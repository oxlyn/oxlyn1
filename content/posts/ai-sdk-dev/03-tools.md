---
title: "AI SDK 6 实战 · 第 3 章：工具定义与工具循环"
description: "tool() 三件套（inputSchema/execute/description）、手动工具循环与 stopWhen——从注册表到声明。"
publishDate: 2026-12-07T09:00:00
tags: ["ai-sdk", "agent", "教程"]
---

> 本文对应官方文档[《Building Agents》](https://ai-sdk.dev/docs/agents/overview)与 [Loop Control](https://ai-sdk.dev/docs/agents/loop-control)。

**学习目标**：掌握 `tool()` 的三要素与手动工具循环的写法，理解"工具循环"在框架里的边界——第 4 章的 Agent 类就是它的封装。

## tool()：三要素

[手写工具注册表](/posts/agent-from-scratch/04-real-tools/)（`工具名 → { schema, 处理函数 }`）在 SDK 里的等价物是 `tool()`：

```ts
import { tool } from "ai"
import { z } from "zod"
import { addNote, searchNotes } from "./store.js"

const addNoteTool = tool({
  description: "添加一条笔记。输入笔记正文，返回创建结果。",
  inputSchema: z.object({                       // v6 字段名（旧版叫 parameters）
    text: z.string().describe("笔记正文，一句话以内"),
  }),
  execute: async ({ text }) => {
    const note = await addNote(text)
    return `已添加 #${note.id}：${note.text}`
  },
})
```

三要素与[手写版](/posts/agent-from-scratch/04-real-tools/)逐项对应：`description` = 写给模型看的说明书（[MCP 第 3 章](/posts/mcp-dev/03-tools/)的"三问"写法原样适用）；`inputSchema` = zod 声明（框架转成各家模型 API 的 schema，`.describe()` 照样是给模型的参数说明）；`execute` = 处理函数。**[notes-mcp](/posts/mcp-dev/02-first-server/) 的工具定义几乎可以原样搬过来**——MCP server 与 SDK tool 共享同一套 store 业务层。

## 手动工具循环：看清楚框架管理的东西

先用 `generateText` 手动跑一圈循环——这是[手写 Agent 循环](/posts/agent-from-scratch/02-agent-loop/)的 SDK 版：

```ts
import { generateText, stepCountIs } from "ai"

const result = await generateText({
  model: "anthropic/claude-sonnet-5.5",
  system: "你是笔记助手，只能用工具读写笔记。",
  prompt: "记一条：学完 AI SDK 第 3 章，然后告诉我现在有几条笔记",
  tools: { addNote: addNoteTool, listNotes: listNotesTool },
  stopWhen: stepCountIs(8),        // 最多 8 步，防止死循环
})

for (const step of result.steps) {
  if (step.toolCalls.length) console.log("调用：", step.toolCalls.map(t => t.toolName))
  if (step.text) console.log("回复：", step.text)
}
```

关键语义：**框架接管循环后，`execute` 由框架在收到工具调用时自动执行**，结果自动回填对话，模型继续——直到模型自然收尾或 `stopWhen` 触发。`result.steps` 是完整轨迹（每步的文本与工具调用），[轨迹评测](/posts/evals-dev/09-agent-evals/)的断言对象直接就是它。

## stopWhen：停止条件是一等公民

手写循环里"最多跑 N 轮"的 if 判断，在 SDK 里是可组合的停止条件（第 4 章展开全部）：

```ts
stopWhen: stepCountIs(8)                                    // 步数上限
stopWhen: hasToolCall("done")                               // 调到某个工具即停
stopWhen: [stepCountIs(8), hasToolCall("done")]             // 任一满足即停
```

**手写 vs 框架的第一条判断线**出现了：单步工具调用（模型帮你选一次工具、你执行）用 `generateText` + `stopWhen: stepCountIs(1)` 的手动循环，全程可见可控；多步自治任务才进第 4 章的 Agent 类。

## 踩坑提示

- 旧教程的 `parameters` 字段——v6 改名 `inputSchema`，报 schema 校验错先查这个；
- `execute` 忘了写——工具只被调用不执行，进入"静态工具"模式（专门用于强制收尾的技巧，第 4 章的 `done` 工具就是这个用法）；
- 没设 `stopWhen` 的裸循环——模型复读工具调用时烧穿账单，步数上限是默认安全带；
- 在 `execute` 里抛异常当业务错误——错误会中断循环，业务失败应返回错误说明（[MCP 第 3 章](/posts/mcp-dev/03-tools/)的 isError 约定同源）。

## 练习

1. 把 [notes-mcp 的工具面](/posts/mcp-dev/03-tools/)（add/search/remove）用 `tool()` 重写，共享同一份 store。
2. 写一个两步任务（添加后清点数量），打印 `result.steps`，对照[手写循环](/posts/agent-from-scratch/02-agent-loop/)的消息流转。
3. 故意去掉 `stopWhen` 并让模型陷入复读（提示词里写"必须连续调用工具"），观察步数上限缺失的后果。
