---
title: "本地与浏览器推理入门 · 第 5 章：WebLLM 浏览器推理"
description: "CreateMLCEngine、OpenAI 兼容对话、WebWorker 引擎、权重缓存与首次加载体验。"
publishDate: 2026-12-21T09:00:00
tags: ["webgpu", "ai", "教程"]
---

> 本文对应 [WebLLM 官方文档](https://webllm.mlc.ai/docs/user/get_started.html)与 [GitHub 仓库](https://github.com/mlc-ai/web-llm)。

**学习目标**：用 WebLLM 在浏览器里跑通第一个模型，理解引擎的两种形态（主线程/WebWorker）与权重缓存机制，做出合格的首次加载体验。

[WebGPU 地基](/posts/local-ai-dev/04-webgpu/)打好了，这一章让 LLM 真正在浏览器里跑起来。WebLLM（MLC 团队出品）把开源模型**预编译成 WebGPU 可执行的形态**，暴露的接口说的还是 OpenAI 方言——前端开发者的学习成本被压到最低。

## 第一个浏览器模型

```bash
npm install @mlc-ai/web-llm
```

```ts
import * as webllm from "@mlc-ai/web-llm"

const engine = await webllm.CreateMLCEngine("Qwen3-8B-q4f16_1", {
  initProgressCallback: (p) => {
    console.log(`${(p.progress * 100).toFixed(0)}% ${p.text}`)   // 下载与编译进度
  },
})

const chunks = await engine.chat.completions.create({
  messages: [{ role: "user", content: "用一句话解释量化" }],
  stream: true,
})
for await (const chunk of chunks) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "")
}
```

三个关键点：

- **模型 ID 选自[预编译列表](https://github.com/mlc-ai/web-llm#webllm-models)**（Qwen、Llama、Gemma、Phi、Mistral 等，`-q4f16_1` 后缀即量化标记）——必须是列表内的编译产物，随便写个模型名会加载失败；
- **首次调用触发权重下载**（GB 级，几秒到几十分钟取决于网速），`initProgressCallback` 把进度喂给你的 UI——**这段体验决定用户去留**，进度条 + 预期管理是产品必修；
- 下载后权重进**浏览器缓存**（Cache Storage），二次访问秒开；缓存的清理权在用户与浏览器手里，别当永久资产。

## 引擎的两种形态

```ts
// 形态一：主线程引擎（简单场景）
const engine = await webllm.CreateMLCEngine(modelId)

// 形态二：WebWorker 引擎（生产推荐）
// worker.ts 里一行：
const engine = await webllm.CreateWebWorkerMLCEngine(self, modelId)
// 主线程：
const engine = new webllm.WebWorkerMLCEngine(new Worker("worker.ts"))
```

推理是持续的 GPU+CPU 混合负载，跑在主线程会卡死 UI（点击、滚动全冻）。**生产一律用 WebWorker 形态**——推理隔离在 worker 线程，主线程只收 token。这与[手写 Agent 时代的 worker_threads](/posts/node-core/08-event-loop/) 是同一个设计判断：重活离场，UI 独立。

## OpenAI 方言的完整度

WebLLM 接口刻意对齐 OpenAI SDK：`chat.completions.create`、`stream: true`、`temperature`、**JSON mode 与 function calling 也支持**（第 6 章用它做浏览器 Agent）。迁移常识：云端 OpenAI SDK 的代码把 client 换成 engine 即可；但**模型行为是开源小模型的行为**——[提示词纪律](/posts/local-ai-dev/03-openai-compatible/)同样适用。

## notes 浏览器版起步

store 换成浏览器侧实现（localStorage/IndexedDB 存 JSON，[第 9 章](/posts/local-ai-dev/09-privacy-offline/)展开），推理用 WebLLM——**访客的设备跑访客自己的笔记助手，数据与算力都不经过任何服务器**。工具调用留给第 6 章，先把"对话 + 流式"的体验做扎实。

## 踩坑提示

- 非预编译模型名硬加载——MLC 只认编译列表，自编译是进阶话题（见 MLC 文档）；
- 主线程引擎跑长对话——UI 冻结被当成"页面坏了"，引擎必须进 WebWorker；
- 权重缓存当永久缓存——用户清缓存、浏览器配额回收都会丢，首次加载逻辑要每次都健在；
- 大模型塞小显存设备——创建引擎时传 `contextWindowSize` 与模型选择要跟着[设备分级](/posts/local-ai-dev/04-webgpu/)走。

## 练习

1. 跑通主线程版对话，故意在同一页面加一个按钮点击计数器，感受主线程卡顿，再换 WebWorker 引擎对比。
2. 实现带进度条的首次加载流程（含"预计还需 X MB"与失败重试），清一次缓存完整体验。
3. 把 [Ollama 版对话代码](/posts/local-ai-dev/03-openai-compatible/)与 WebLLM 版并排，列出"接口相同/不同"清单。
