---
title: "AI SDK 6 实战 · 第 4 章：ToolLoopAgent"
description: "用声明式 Agent 类替换手写循环：stopWhen 组合、prepareStep 分步控制、pruneMessages 压缩。"
publishDate: 2026-12-08T09:00:00
tags: ["ai-sdk", "agent", "教程"]
---

> 本文对应官方文档[《Building Agents》](https://ai-sdk.dev/docs/agents/overview)与[《Loop Control》](https://ai-sdk.dev/docs/agents/loop-control)。

**学习目标**：掌握 `ToolLoopAgent` 的声明式配置——停止条件、分步控制、上下文压缩——理解"手写循环"如何变成"配置对象"，以及框架把什么藏了起来。

## 从循环到类

手写的 Agent 循环 = while + 消息拼接 + 工具分发 + 步数判断，约百行（[Agent 第 2 章](/posts/agent-from-scratch/02-agent-loop/)）。SDK 的封装：

```ts
import { ToolLoopAgent, isStepCount } from "ai"

const notesAgent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-5.5",
  system: "你是笔记助手，只能通过工具读写笔记。",
  tools: { addNote, searchNotes, listNotes },
  stopWhen: isStepCount(20),        // 默认值即 isStepCount(20)
})

const result = await notesAgent.generate({
  prompt: "把'学完 MCP 第 8 章'记下来，再查查有没有安全相关的笔记",
})
result.text     // 最终回答
result.steps    // 完整轨迹
```

`generate()` 也可以接 `messages` 做多轮会话。**手写循环的全部工程判断被声明化**：步数上限（`stopWhen`）、每步用什么模型与参数（`prepareStep`）、上下文怎么瘦身（`pruneMessages`）。

## stopWhen：可组合的停止条件

| 条件 | 语义 |
| --- | --- |
| `isStepCount(20)` | 步数上限（默认） |
| `hasToolCall("done")` | 调用了指定工具即停 |
| `isLoopFinished()` | 永不触发，跑到自然收尾 |
| 自定义 `({ steps }) => boolean` | 检查轨迹内容（如出现 "ANSWER:"） |

数组形式 = 任一满足即停。两个高级用法值得记住：

- **`done` 工具模式**：定义一个没有 `execute` 的工具，配 `toolChoice: 'required'`——模型必须"调用收尾工具"来结束，循环在读到静态调用时终止，结果从 `result.staticToolCalls` 读取。这是强制"结构化收尾"的规范手法；
- **自定义条件读轨迹**：`steps.some(s => s.text?.includes("ANSWER:"))`——把"模型自认为完成"的信号变成停止判据。

## prepareStep：每一步的微分控制

```ts
new ToolLoopAgent({
  model: "anthropic/claude-sonnet-5.5",
  tools,
  prepareStep: async ({ stepNumber, messages }) => {
    if (stepNumber === 0) {
      return { temperature: 0, activeTools: ["searchNotes"] }   // 先查再说
    }
    if (stepNumber > 4) {
      return {
        messages: pruneMessages({ messages,                     // 上下文压缩
          reasoning: "all", toolCalls: "before-last-3-messages", emptyMessages: "remove" }),
      }
    }
    return {}
  },
})
```

`prepareStep` 在每步调用前执行，可覆盖模型、温度、`activeTools`（本步可用工具集）、`toolChoice`（强制调用某工具）。两个经典配方：

- **阶段化工具**：前几步只给检索工具、后几步只给写工具——把"先调研后动手"从提示词约定变成结构约束（[手写权限门禁](/posts/agent-from-scratch/05-permissions/)的声明式版）；
- **`pruneMessages` 压缩**：按规则裁剪历史消息（清 reasoning、截老的工具结果）——[手写上下文压缩](/posts/agent-from-scratch/07-compaction/)里最难的"何时删、删什么"变成了声明式规则，[MCP 第 7 章](/posts/mcp-dev/07-context/)的上下文预算终于有了现成的执行器。

## 框架藏了什么

ToolLoopAgent 收编了手写循环，也藏了几件事，使用时要知道：**消息的维护**（框架替你 append 工具结果）意味着你失去手工插队的自由——复杂干预要走 `prepareStep`；**重试与回退**的默认策略可能与你期望的节奏不同——关键任务先在小用例上验证步数与成本（[评测 runner](/posts/evals-dev/05-runner/) 正好能干这个）。第 10 章会给完整的取舍表。

## 踩坑提示

- `stopWhen` 数组里的条件互相矛盾（`isLoopFinished` + 一步停止）——停止语义看"任一满足"，先想清楚组合逻辑；
- `prepareStep` 返回的 `messages` 会成为后续步骤的基底——压缩规则写激进时先在评测里确认不丢关键上下文；
- `activeTools` 挡掉了模型想用的工具却不解释——配一条系统提示说明分阶段策略，模型才不硬试；
- 把 `done` 工具的 `staticToolCalls` 当普通工具结果读——它在 `result.staticToolCalls` 里，没有 `execute` 产物。

## 练习

1. 把手写的 notes Agent 循环完整迁移到 `ToolLoopAgent`，对比两边代码行数与 `steps` 轨迹。
2. 配一个三阶段 `prepareStep`（检索 → 分析 → 收尾），用 `activeTools` + `toolChoice` 强制走完三段。
3. 在第 4 步后启用 `pruneMessages`，打印每步的消息总量，验证压缩对长会话的影响。
