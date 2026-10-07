---
title: "AI SDK 6 实战 · 第 2 章：统一模型接口"
description: "generateText/streamText、供应商字符串、流式增量与 usage 统计——手写 HTTP 适配层的终结。"
publishDate: 2026-12-06T09:00:00
tags: ["ai-sdk", "agent", "教程"]
---

> 本文对应官方文档 [Core 层 generateText](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text) 与 [streamText](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text)。

**学习目标**：掌握 Core 层两个核心函数的输入输出形状，理解"供应商抽象"到底抽象了什么，把手写的流式解析代码彻底退役。

## generateText：一次调用的全部形状

```ts
import { generateText } from "ai"

const result = await generateText({
  model: "anthropic/claude-sonnet-5.5",
  system: "你是笔记助手，回答简洁。",
  prompt: "总结这条笔记的要点：……",
  temperature: 0.2,
  maxOutputTokens: 500,
})

result.text            // 最终文本
result.usage           // { inputTokens, outputTokens, totalTokens } —— 统一计量
result.finishReason    // "stop" | "length" | "tool-calls" | …
result.steps           // 多步调用的每一步（第 3 章的工具循环产物）
```

对照[手写版](/posts/agent-from-scratch/01-minimal-chat/)：请求体的组装、认证头、端点路径、响应解析——手写时是"每家一份适配函数"，SDK 里是**同一份参数表**。`usage` 的统一尤其值钱：token 计量不再依赖各家响应字段名，[评测的成本护栏](/posts/evals-dev/05-runner/)（第 5 章 runner）因此只写一次。

## 供应商字符串与迁移成本

`"anthropic/claude-sonnet-5.5"` 是 v6 的统一写法：冒号前是供应商，后面是模型标识。换供应商 = 换字符串 + 换环境变量里的 key——**第 6 章 A/B 对比里的"跨模型矩阵"（[评测系列](/posts/evals-dev/06-ab-compare/)）因此从"每家写一个适配"变成"每格换一个字符串"**。

需要更细的控制时，用 provider 工厂：

```ts
import { createAnthropic } from "@ai-sdk/anthropic"

const anthropic = createAnthropic({ baseURL: "http://localhost:11434/v1" })  // 指向本地 OpenAI 兼容端点
const model = anthropic("claude-sonnet-5.5")
```

本地模型（Ollama 等兼容端点）与云上模型在代码里无差别——[nuxt-dev 第 10 章](/posts/nuxt-dev/10-modules-and-deploy/)讲过的"运行时决定能力"，在模型接口层同样成立。

## streamText：流式的标准形状

[手写流式输出](/posts/agent-from-scratch/03-streaming/)时，SSE 分帧、增量拼接、done 哨兵——每家供应商一套。SDK 把它压平：

```ts
import { streamText } from "ai"

const stream = streamText({
  model: "anthropic/claude-sonnet-5.5",
  prompt: "解释事件循环的六个阶段",
})

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk)          // 增量文本，终端打字机效果
}

const result = await stream.result     // 流结束后拿到完整结果（含 usage）
```

`textStream` 只是众多流之一——`fullStream` 会给出**全部事件**（text-delta、tool-call、tool-result、finish），类型判别式联合，Agent 循环与 UI 层都吃这个流。手写版里的"解析 SSE 并分发事件类型"整段消失。

## 错误与重试：框架的默认值

SDK 内建指数退避重试（`maxRetries`，默认 2）、统一的错误类型（限流、超时、内容策略），`.toolCalls` 中断恢复等细节也都有约定。手写时代"每个供应商的错误形状不同"是最阴的坑——[评测 runner](/posts/evals-dev/05-runner/) 里那层 try/catch 可以退役了。

## 踩坑提示

- `streamText` 的 `result` 在流结束前是 undefined——先消费流再取结果，或用 `await stream.text`；
- 温度、maxOutputTokens 等设置混进 prompt 文本——参数归参数，[prepareStep](/posts/ai-sdk-dev/04-tool-loop-agent/) 才是分步控制的正主；
- 把供应商字符串当唯一抽象——切换供应商时仍要重跑[评测](/posts/evals-dev/06-ab-compare/)，行为差异不会因接口统一而消失。

## 练习

1. 用 `generateText` 与 `streamText` 各实现一次"总结笔记"，在终端对比两者输出方式。
2. 把模型字符串换成本地端点（Ollama 的 OpenAI 兼容接口），跑通同一份代码。
3. 给手写的流式调用（[Agent 第 3 章](/posts/agent-from-scratch/03-streaming/)）列一个"SDK 已内置"清单，逐项划掉。
