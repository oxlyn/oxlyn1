---
title: "AI SDK 6 实战 · 第 1 章：手写之后看框架"
description: "AI SDK 的三层结构（Core/UI/Agent）、与手写 Agent 的模块对照表、安装与第一个 generateText。"
publishDate: 2026-12-05T09:00:00
tags: ["ai-sdk", "agent", "教程"]
---

> 本文对应官方文档[《Introduction》](https://ai-sdk.dev/docs/introduction)与[《Building Agents》](https://ai-sdk.dev/docs/agents/overview)。

**学习目标**：建立"手写模块 ↔ 框架 API"的对照地图，理解 AI SDK 6 的三层结构，跑通第一个调用。

[《从零实现 Agent》](/posts/agent-from-scratch/)里，我们亲手写过 Agent 循环、流式输出、工具注册、权限门禁、上下文压缩——**每一块都懂原理，但每换一个模型供应商就要重新适配一遍**。AI SDK（Vercel 出品，v6 为 2025 年 12 月发布的当前大版本）把这些固化成了 TypeScript 标准件。这个系列的读法只有一句话：**每章先回忆手写版的实现，再看框架把同一件事变成了什么**——手写过才看得懂框架替你做了什么、又藏了什么。

> 内容依据 [ai-sdk.dev 官方文档](https://ai-sdk.dev/docs)（v6）整理，代码示例均为原创，每章附官方文档链接。前置：[《从零实现 Agent》](/posts/agent-from-scratch/)与 [TypeScript 系列](/posts/typescript-core/)。

## 三层结构

```text
┌─ Agent 层 ────────────────────────────────┐
│ ToolLoopAgent：声明式 Agent（第 4~6 章）     │
│ HarnessAgent：跑现成 harness（Claude Code…）│
├─ UI 层 ──────────────────────────────────┤
│ useChat / 生成式 UI / AI Elements（第 8 章） │
├─ Core 层 ─────────────────────────────────┤
│ generateText / streamText / tool / embed   │
│ 统一的模型供应商抽象（第 2、3、7、9 章）       │
└───────────────────────────────────────────┘
```

- **Core**：一套 API 调所有主流模型——供应商差异（流式格式、工具调用协议、错误形状）被压平成一个接口；
- **UI**：React/Vue/Svelte 的聊天与生成式 UI 钩子，流式协议内置；
- **Agent**：把[手写循环](/posts/agent-from-scratch/02-agent-loop/)变成声明式配置，审批、MCP、可观测性内建。

## 手写 ↔ 框架对照地图

本系列的行进路线，也是一张速查表：

| 手写实现（Agent 系列） | AI SDK 6 对应 | 章节 |
| --- | --- | --- |
| 最小对话与流式调用 | `generateText` / `streamText` | 第 2 章 |
| 工具注册表 + 循环 | `tool()` + `ToolLoopAgent` | 第 3、4 章 |
| 权限与人工确认 | `toolApproval` 审批流 | 第 5 章 |
| 自研 MCP client 接入 | 内建 MCP 支持 | 第 6 章 |
| （evals 的被测函数） | 结构化输出 `generateObject` | 第 7 章 |
| 终端流式 UI | `useChat` / 生成式 UI | 第 8 章 |
| 语义检索（RAG 章） | `embed` / `cosineSimilarity` | 第 9 章 |
| 会话日志与遥测 | OpenTelemetry 内建 | 第 10 章 |

## 安装与第一行代码

```bash
npm install ai @ai-sdk/anthropic zod
```

```ts
import { generateText } from "ai"

const result = await generateText({
  model: "anthropic/claude-sonnet-5.5",     // 供应商/模型 字符串，v6 的统一写法
  prompt: "用一句话解释什么是 Agent 循环",
})
console.log(result.text)
```

没有 SDK 时，这段话要经过：HTTP 客户端封装 → 认证头 → 请求体形状适配 → SSE 解析 → 增量拼接 → 错误重试。**`generateText` 一行背后是 agent 系列第 1、3 章的全部手写代码**——框架的价值不是"更简单"，是"供应商中立"：换模型只换一个字符串。

## 对照阅读的方法

往后每章的三段式：**手写版怎么做的（回忆）→ SDK 的等价 API（新知）→ 它藏了什么、什么时候还该手写（判断）**。框架不是终点——第 10 章会给出完整的"手写 vs 框架"决策表，本系列结束时你应该能 confident 地选边，而不是默认跟随。

## 踩坑提示

- 用旧版教程的 `parameters` 字段写工具——v6 已改名 `inputSchema`（第 3 章展开）；
- 以为 AI SDK 绑定 Vercel/Next.js——Core 层是纯 TypeScript，Node、Bun、任何运行时都能跑；
- 直接上 Agent 层跳过 Core——循环停止条件、审批、压缩这些"Agent 的配置项"全是 Core 概念的组合，倒着学会雾里看花。

## 练习

1. 安装并跑通 `generateText`，把模型字符串换成另一家供应商的模型，验证只改一处。
2. 打开 [agent 系列第 2 章](/posts/agent-from-scratch/02-agent-loop/)，逐行标出"这段在 SDK 里对应什么"（先猜，后续章节对照）。
3. 浏览 [ai-sdk.dev/docs](https://ai-sdk.dev/docs) 的目录树，找出本系列对照地图里没提到的两个模块，预判它们的价值。
