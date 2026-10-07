---
title: "AI SDK 6 实战 · 附录：API 速查与对照表"
description: "Core/Agent/UI 三层 API 速查、手写实现与 SDK 对照表、停止条件表、资源链接。"
publishDate: 2026-12-15T09:00:00
tags: ["ai-sdk", "agent", "教程"]
---

本系列的 API 与对照关系浓缩成四张表。

## Core 层 API 速查

| API | 用途 | 关键项 |
| --- | --- | --- |
| `generateText` | 一次性文本生成 | `model`（"供应商/模型"字符串）、`system`、`temperature`、`stopWhen` |
| `streamText` | 流式生成 | `textStream`（纯文本流）/ `fullStream`（全部事件） |
| `generateObject` / `streamObject` | 结构化输出 | `schema`（zod），类型直通业务代码 |
| `tool()` | 工具定义 | `description` / `inputSchema`（v6，旧名 parameters）/ `execute` |
| `embed` / `embedMany` | 向量化 | 与 `cosineSimilarity` 组成语义检索 |
| `pruneMessages` | 上下文压缩 | 在 `prepareStep` 中按规则裁剪历史 |

## Agent 层 API 速查

| API | 语义 |
| --- | --- |
| `new ToolLoopAgent({ model, system, tools, stopWhen, prepareStep, toolApproval })` | 声明式 Agent |
| `agent.generate({ prompt | messages })` | 跑完循环，`result.text` / `result.steps`（轨迹） |
| `isStepCount(n)` / `hasToolCall("name")` / `isLoopFinished()` | 停止条件（数组 = 任一满足） |
| 自定义 `StopCondition` | `({ steps }) => boolean`，读轨迹判停 |
| `prepareStep` | 每步前覆盖 model/temperature/`activeTools`/`toolChoice`/`messages` |
| `toolApproval` | 每工具策略：`"not-applicable" | "approved" | "denied" | "user-approval"` 或函数 |
| `tool-approval-request` / `tool-approval-response` | 审批中断与恢复的消息协议 |
| `HarnessAgent` | 统一 API 驱动现成 harness（Claude Code、Codex、Pi） |

## UI 层速查

| API | 用途 |
| --- | --- |
| `useChat`（@ai-sdk/react、@ai-sdk/vue 等） | 全栈流式聊天，`messages.parts` 含文本/工具/审批部件 |
| `addToolApprovalResponse({ id, approved })` | 前端回传审批决定 |
| AI Elements | 官方聊天组件集（消息、工具卡片、思考面板） |
| 生成式 UI | 工具名 → 组件映射，模型填参数、前端渲染白名单组件 |

## 手写 ↔ SDK 对照表（本站两条线的合并答案）

| 手写实现 | 出处 | SDK 等价 | 章节 |
| --- | --- | --- | --- |
| 供应商适配 + SSE 解析 | Agent 1/3 章 | `generateText` / `streamText` | 2 |
| 工具注册表 | Agent 4 章 / MCP 3 章 | `tool()` + `tools` 对象 | 3 |
| Agent while 循环 | Agent 2 章 | `ToolLoopAgent` + `stopWhen` | 4 |
| 权限门禁 | Agent 5 章 / MCP 8 章 | `toolApproval` | 5 |
| MCP client 与适配层 | MCP 6 章 / 10 章 | 内建 MCP 支持 / 二十行适配 | 6 |
| JSON 输出的解析重试 | — | `generateObject` | 7 |
| 终端流式 UI | Agent 3 章 | `useChat` / AI Elements | 8 |
| 语义检索 | MCP 附录预告 | `embed` 系列 + `cosineSimilarity` | 9 |
| 会话日志与遥测 | Agent 6 章 | OpenTelemetry 内建 | 10 |

## 资源

- 官方文档：[ai-sdk.dev/docs](https://ai-sdk.dev/docs)（[Agents](https://ai-sdk.dev/docs/agents/overview) / [Loop Control](https://ai-sdk.dev/docs/agents/loop-control) / [Tool Approvals](https://ai-sdk.dev/docs/agents/tool-approvals)）
- 示例与模板：[ai-sdk.dev](https://ai-sdk.dev) 首页的 Examples 区
- 配套系列：[从零实现 Agent](/posts/agent-from-scratch/)（原理层）/ [MCP 开发入门](/posts/mcp-dev/)（协议层）/ [LLM 应用评测入门](/posts/evals-dev/)（验收层）

## 进阶路线

1. **多 Agent 编排**——子代理（[Agent 第 8 章](/posts/agent-from-scratch/08-subagent/)）在 SDK 里的组合模式，官方 Agents 章节持续演进中；
2. **上下文工程**——`prepareStep` + `pruneMessages` 是压缩的执行器，策略设计属于筹备中的上下文工程系列；
3. **评测深化**——把本系列的 Agent 接进 [CI 门禁](/posts/evals-dev/07-ci/)，任何 SDK 升级都过一遍回归；
4. **生成式 UI 深挖**——[模型即路由器](https://ai-sdk.dev/docs/advanced/model-as-router)的进阶模式与设计系统结合。
