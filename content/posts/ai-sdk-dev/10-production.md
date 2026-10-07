---
title: "AI SDK 6 实战 · 第 10 章：生产化与收口"
description: "telemetry 与错误重试、手写 vs 框架决策表、评测接线与 HarnessAgent——全系列的取舍总结。"
publishDate: 2026-12-14T09:00:00
tags: ["ai-sdk", "agent", "教程"]
---

> 本文对应官方文档 [Telemetry](https://ai-sdk.dev/docs/ai-sdk-core/telemetry)与 [Building Agents](https://ai-sdk.dev/docs/agents/overview) 的 HarnessAgent 部分。

**学习目标**：补上生产化的最后三块（遥测、重试、成本），给出"手写 vs 框架"的完整决策表，把 AI SDK Agent 接进评测设施，全系列收口。

## 遥测：OpenTelemetry 内建

[手写会话日志](/posts/agent-from-scratch/06-session-log/)要自己攒字段；SDK 开箱输出 OpenTelemetry 标准的 span：

```ts
const result = await generateText({
  model: "anthropic/claude-sonnet-5.5",
  prompt: "…",
  experimental_telemetry: { isEnabled: true, functionId: "notes-agent", metadata: { version: "v7" } },
})
```

每次调用产生结构化 span（输入、输出、token、耗时），接入任意 OTel 后端——**trace 字段与[评测第 8 章](/posts/evals-dev/08-observability/)的对齐是现成的**，数据飞轮的采集端因此零成本。`functionId` 与 `metadata.version` 就是 promptVersion 的官方载体。

## 重试与错误：确认默认值

SDK 默认两次指数退避重试（`maxRetries`），错误类型统一。生产前过一遍这三问：限流时重试会不会放大故障（对限流敏感的场景降低 maxRetries）；超时阈值与业务 SLA 是否匹配；不可重试错误（内容策略拒绝）是否给了用户可理解的反馈——[MCP 第 3 章](/posts/mcp-dev/03-tools/)的"错误写给模型"在 UI 层变成"写给用户"。

## 接进评测设施

AI SDK 的 Agent 就是[评测 runner](/posts/evals-dev/05-runner/) 的理想被测方——一个函数收输入、出文本与轨迹：

```ts
const subject = async (input) => {
  const r = await notesAgent.generate({ prompt: input })
  return { text: r.text, steps: r.steps }
}
// 第 5 章的 runner、第 9 章的轨迹断言、第 7 章的 CI 门禁全部原样生效
```

**第 3 章的 `result.steps` 在这里兑现**：轨迹评测的断言对象由框架替你结构化好了。模型升级、提示词改动、[prepareStep](/posts/ai-sdk-dev/04-tool-loop-agent/) 调整——任何变化都过门禁。

## HarnessAgent：站在框架上跑现成 Agent

v6 的另一个信号是 `HarnessAgent`：用统一 API 驱动**现成的 Agent 工具**（Claude Code、Codex、Pi）——你的应用把整个编码 Agent 当一个工具用。这印证了[第 1 章](/posts/ai-sdk-dev/01-why-framework/)的生态观：SDK 正在成为"Agent 的 JDBC"——既替你跑自建循环，也能标准化地驾驶别人的 Agent。

## 手写 vs 框架：决策表

全系列的最终交付，按场景选边：

| 场景 | 建议 | 理由 |
| --- | --- | --- |
| 学习 AI 工程 / 供应商深度定制 | **手写**（[Agent 系列](/posts/agent-from-scratch/)） | 每一层都可见可改 |
| 单一模型、单次调用 | `generateText` 即可 | 框架收益在最薄处 |
| 多供应商 / 工具循环 / 审批 | **ToolLoopAgent** | 标准件已覆盖 [Agent 系列全部功能](/posts/agent-from-scratch/README.md) |
| 要接生态协议（MCP） | 框架 + [适配层](/posts/ai-sdk-dev/06-mcp/) | 接口已标准，实现可替换 |
| 聊天产品 UI | useChat / 生成式 UI | 流式协议与审批 UI 白拿 |
| 极端性能/成本敏感的核心循环 | 手写 + [评测护栏](/posts/evals-dev/07-ci/) | 框架的通用默认值有开销 |

一句话收束本系列：**手写教你原理，框架给你杠杆，评测替你兜底**——三者不是替代关系，是同一套工程能力的三个海拔。

## 踩坑提示

- 遥测默认关闭却以为有 trace——`experimental_telemetry.isEnabled` 是显式开关；
- 上生产不设 `maxRetries` 与超时预算——SDK 默认值是通用值不是你的 SLA；
- 评测被测方直接绑 SDK 类型——保持"函数进函数出"（第 5 章 runner 的约定），换框架时评测资产零损失；
- 把本决策表当教条——每季度用新版本 SDK 重测一遍，"框架藏了什么"这个答案会随版本变化。

## 练习

1. 给 notes Agent 开启遥测，接入一个 OTel 后端（或打印 span），核对字段与[评测 trace](/posts/evals-dev/08-observability/)的对齐度。
2. 把 AI SDK Agent 作为 subject 接进 runner，全量跑 notes 评测集，与手写版的成绩并排对比。
3. 按决策表逐行给你自己的项目选边，写出每行的"当前选择 + 迁移触发条件"。
