---
title: "本地与浏览器推理入门 · 第 7 章：Chrome 内置 AI"
description: "Prompt API 与 Gemini Nano：能力检测、LanguageModel 会话、流式与 JSON 约束、伴生 API 家族。"
publishDate: 2026-12-23T09:00:00
tags: ["webgpu", "ai", "教程"]
---

> 本文对应 [Chrome 官方 Prompt API 文档](https://developer.chrome.com/docs/ai/prompt-api)——API 细节以官方文档为准（本章对齐 2026 年 12 月状态）。

**学习目标**：用 `LanguageModel` API 调用浏览器自带的 Gemini Nano，掌握能力检测、会话管理、流式与 JSON 约束，认识伴生任务 API 家族。

[WebLLM 路线](/posts/local-ai-dev/05-webllm/)的模型由页面下载与托管；Chrome 内置 AI 是第三种形态：**浏览器自带一个系统级模型（Gemini Nano）**，网站通过 Prompt API 直接用——零下载（首次由浏览器代下）、零依赖、跨网站共享一份模型。

## 能力检测与会话

```ts
// 检测四态：模型可能没下载/正在下载/已就绪
const availability = await LanguageModel.availability()
// "unavailable" | "downloadable" | "downloading" | "available"

if (availability !== "available") {
  // 引导： Chrome 设置里开启/等待下载；或降级到 WebLLM 路线
}

const session = await LanguageModel.create({
  temperature: 0.5,
  monitor: (m) => m.addEventListener("downloadprogress", (e) => {
    console.log(`下载 ${(e.loaded * 100).toFixed(0)}%`)       // 首次使用时代浏览器代下
  }),
})
```

`LanguageModel` 是 Prompt API 的全局接口（前身是实验性的 `window.ai`）。与 WebLLM 的架构差异值得体会：**WebLLM 里模型是页面的资源，这里模型是浏览器的资源**——下载、更新、显存管理全部由浏览器托管，页面只管对话。

## 会话：prompt 与 promptStreaming

```ts
const answer = await session.prompt("把这条笔记总结成一句话：……")

const stream = session.promptStreaming("详细解释这篇笔记的思路")
for await (const chunk of stream) {
  render(chunk)                    // 增量片段
}

session.destroy()                  // 会话资源显式释放
const clone = await session.clone()   // 分叉会话（各自演化互不影响）
```

会话自带**多轮记忆**（上下文在 session 内累积），`clone` 适合"主干对话 + 多个分支探索"的交互。长会话注意 `inputUsage`/`inputQuota`（会话级上下文预算），超限就开新会话——[上下文预算](/posts/mcp-dev/07-context/)在这里由浏览器量化后直接告诉你。

## 结构化输出与伴生 API

```ts
// JSON 约束：给 schema，产出合法 JSON（以官方文档为准的字段名）
const result = await session.prompt("分类这条笔记：……", {
  responseConstraint: {
    type: "object",
    properties: { category: { type: "string", enum: ["待办", "灵感", "日程"] } },
    required: ["category"],
  },
})
```

Prompt API 之外，Chrome 还内置了一批**任务型 API**——单一功能、免提示词工程、性能更好：

| API | 功能 | notes 里的用途 |
| --- | --- | --- |
| `Summarizer` | 摘要（长短/格式可调） | 笔记一键摘要 |
| `Translator` / `LanguageDetector` | 翻译 / 语种检测 | 外文笔记即时翻译 |
| `Writer` / `Rewriter` | 撰写 / 改写 | 笔记润色、口语转书面 |

能用任务型 API 就不用 Prompt API——**专用模型更小更快更稳**，这也把"通用 LLM"留给真正需要自由生成的场景。

## 隐私与争议：工程视角

Gemini Nano 的推理完全在本机（数据不出设备），这是内置路线的隐私红利；但**模型由浏览器厂商分发**——单一供应商的争议（Mozilla 的公开反对）值得记入选型考量。工程结论：**内置 AI 是"锦上添花"通道**——检测到就增强体验，检测不到就降级，永远不作为唯一依赖。

## 踩坑提示

- 只测 `availability()` 不处理 `downloadable`——首次访客等下载无提示；用 monitor 做进度；
- 硬件不达标当软件 bug——磁盘与显存门槛是产品前提，检测信息要转成用户能懂的话；
- Prompt API 写复杂系统提示词——Nano 是小模型，任务简单化或换 [WebLLM 路线](/posts/local-ai-dev/05-webllm/)；
- 忘了会话有配额——长会话 `prompt` 失败时先查 `inputUsage`，别当网络错误重试。

## 练习

1. 跑通检测 + 会话 + 流式三步，观察 `downloadable → downloading → available` 的状态迁移。
2. 用 `responseConstraint` 实现笔记分类，与 [Ollama 结构化输出](/posts/ai-sdk-dev/07-structured/)的调用方式对比。
3. 用 `Summarizer` 给一条长笔记生成摘要，对比 Prompt API 手写摘要提示词的效果与速度。
