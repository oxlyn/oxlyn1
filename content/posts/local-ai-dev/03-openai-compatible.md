---
title: "本地与浏览器推理入门 · 第 3 章：OpenAI 兼容接口通吃"
description: "AI SDK 与 fetch 指向本地端点、流式对话、评测 runner 切换本地模型——零成本回归实现。"
publishDate: 2026-12-19T09:00:00
tags: ["webgpu", "ai", "教程"]
---

> 本章是综合实战：OpenAI 兼容接口由 [Ollama](https://ollama.com/docs) 提供；客户端写法对应 [AI SDK 第 2 章](/posts/ai-sdk-dev/02-unified-provider/)与[评测 runner](/posts/evals-dev/05-runner/)。

**学习目标**：把现有客户端代码零改动指向本地模型，验证"接口标准 = 推理位置可替换"，实现零成本回归评测。

[第 2 章](/posts/local-ai-dev/02-ollama/)的 `/v1` 端点说的是 OpenAI 方言——这意味着**前几个系列写的所有客户端代码原封不动就能指向本地模型**。这一章是零 key 架构的第一次兑现。

## AI SDK 三行切换

[AI SDK 第 2 章](/posts/ai-sdk-dev/02-unified-provider/)里模型是一根字符串；指向本地只需改 baseURL：

```ts
import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

const local = createOpenAI({
  baseURL: "http://localhost:11434/v1",   // Ollama 的 OpenAI 兼容端点
  apiKey: "ollama",                       // 本地服务不校验，占位即可
})

const result = await generateText({
  model: local("qwen3:8b"),
  prompt: "用一句话解释事件循环",
})
```

流式同理（`streamText` + `textStream`），Agent、[工具调用](/posts/ai-sdk-dev/03-tools/)、[结构化输出](/posts/ai-sdk-dev/07-structured/)全部照常——**同一份业务代码，云端旗舰与本地 8B 只是两个字符串**。

## 裸 fetch 也一样

不想引依赖时，标准 chat completions 直接打：

```ts
const res = await fetch("http://localhost:11434/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "qwen3:8b",
    messages: [{ role: "user", content: "你好" }],
    stream: true,                          // SSE 流式，格式与 OpenAI 一致
  }),
})
// res.body 是 SSE 流：逐行读 data: {...}，choices[0].delta.content 为增量
```

[手写解析](/posts/agent-from-scratch/03-streaming/)的知识在这里原样复活——因为 Ollama 说的是同一门方言。

## 零成本回归：评测设施的本地化

[评测 runner](/posts/evals-dev/05-runner/) 的被测方换成 local client——**回归想跑多勤跑多勤**：

```ts
// 之前：subject = 云端模型（每次回归都计费）
// 现在：subject = 本地模型（电费而已）
node runner.mjs cases/all.jsonl --tags regression
```

三件以前"舍不得做"的事立刻可行：

- **[技能](/posts/agent-skills-dev/08-debugging/)与[提示词](/posts/evals-dev/07-ci/)的每次改动都全量回归**——本地模型当回归靶子，云端模型只在发布前终验；
- **[A/B 的参数化矩阵](/posts/evals-dev/06-ab-compare/)**加大样本量——统计结论不再被账单限制；
- **[安全红队](/posts/evals-dev/10-red-team/)对抗样本的高频迭代**——攻击者思路不设预算。

注意方法论边界：本地 8B 与云端旗舰是**不同的模型**，本地回归分数只能看趋势与回归（相对变化），发布判定仍要以目标模型终验——[评测第 6 章](/posts/evals-dev/06-ab-compare/)的"别跨模型外推结论"。

## notes 本地版 Agent 串线

把 [notes-mcp 的工具面](/posts/mcp-dev/03-tools/)（`tool()` 定义）+ 本地模型 + [ToolLoopAgent](/posts/ai-sdk-dev/04-tool-loop-agent/) 拼起来：**零 API key 的完整 Agent**，跑在你的电脑上。小模型跑工具循环的提示词纪律比云端更严（少工具、强约束、短上下文）——这正是[本地路线的能力边界](/posts/local-ai-dev/01-why-local/)的第一手体感。

## 踩坑提示

- 本地与云端分数直接比大小——量化程度、上下文长度、模板差异都在干扰，比较只在同模型的不同版本间有效；
- 长上下文硬塞 8B 模型——显存随上下文暴涨且质量下滑，先[压缩](/posts/ai-sdk-dev/04-tool-loop-agent/)再喂；
- 忘了本地端点没有速率限制——并发直接拉满打爆显存，[runner 的并发护栏](/posts/evals-dev/05-runner/)改成 1~2；
- JSON 模式/工具调用在小模型上不稳——把[结构化收尾](/posts/ai-sdk-dev/07-structured/)的 schema 写得更扁平，或降级到单工具。

## 练习

1. 把[评测 runner](/posts/evals-dev/05-runner/) 的云端 subject 与本地 subject 各跑一遍 notes 用例集，记录分数差与成本差。
2. 用 ToolLoopAgent + 本地模型跑通"记一条笔记"的工具循环，故意塞 5 个工具观察小模型的选择准确率。
3. 建一个"本地回归 + 云端终验"的两段式流程文档，写清各自的触发时机与判定权。
