---
title: "本地与浏览器推理入门 · 附录：速查与选型"
description: "三路线对比表、Ollama 命令、WebLLM 与 Prompt API 速查、硬件要求表、资源链接。"
publishDate: 2026-12-27T09:00:00
tags: ["webgpu", "ai", "教程"]
---

本系列的路线、命令与 API 浓缩成五张表。

## 三条路线对比表

| | Ollama（本地服务器） | WebLLM（浏览器内） | Chrome 内置 AI |
| --- | --- | --- | --- |
| 模型来源 | `ollama pull` 自选 | 页面下载预编译权重 | 浏览器代下 Gemini Nano |
| 算力 | 你的 GPU/CPU | 访客 GPU（WebGPU） | 访客设备（浏览器托管） |
| 接口方言 | OpenAI `/v1` 兼容 | OpenAI chat completions | `LanguageModel` 专有 |
| 谁能用 | 本机开发者/工具 | 任何访客 | 支持硬件上的 Chrome 访客 |
| 模型自由度 | 最高（万级模型） | 预编译列表 | 仅 Gemini Nano |
| 典型章节 | 2~3 | 4~6 | 7 |

## Ollama 命令速查

```bash
ollama pull <model>       # 下载模型（library 页核对量化与体积）
ollama run <model>        # 交互对话
ollama list / ps          # 已装模型 / 运行中与显存占用
ollama rm <model>         # 删除
# 服务端：http://localhost:11434（OpenAI 兼容：/v1/chat/completions）
```

## WebLLM 速查

```ts
import * as webllm from "@mlc-ai/web-llm"

// 主线程（简单）/ WebWorker（生产推荐）
const engine = await webllm.CreateMLCEngine(modelId, { initProgressCallback })
const engine = await webllm.CreateWebWorkerMLCEngine(self, modelId)  // 在 worker 内

// OpenAI 兼容调用（stream / tools / JSON mode 均支持）
await engine.chat.completions.create({ messages, stream: true })
```

模型 ID 必须取自预编译列表；权重缓存在浏览器 Cache Storage；生产引擎一律进 WebWorker。

## Chrome Prompt API 速查（细节以官方文档为准）

```ts
await LanguageModel.availability()      // "unavailable" | "downloadable" | "downloading" | "available"
await LanguageModel.create({ temperature, monitor })   // monitor 看下载进度
await session.prompt(text, { responseConstraint })     // 同步出结果 / JSON Schema 约束
await session.promptStreaming(text)                    // 增量流
session.clone() / session.destroy() / inputUsage / inputQuota
// 伴生任务 API：Summarizer / Translator / LanguageDetector / Writer / Rewriter
```

硬件前提（Chrome）：约 22GB+ 可用磁盘；显存要求随多模态能力提升——检测后降级是产品必备。

## 显存心算与指标

```text
显存 ≈ 参数量(B) × 量化字节 × 1.2    （7B Q4 ≈ 4.2GB）
TTFT：首字延迟；吞吐：tokens/s（10~20 流畅基线）
质量：notes 用例集 + [确定性断言](/posts/evals-dev/03-deterministic-assertions/) + 裁判终验
```

## 资源

- [Ollama](https://ollama.com)（[模型库](https://ollama.com/library)）
- [WebLLM](https://webllm.mlc.ai/)（[GitHub](https://github.com/mlc-ai/web-llm)）
- [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api)（[内置 AI 总览](https://developer.chrome.com/docs/ai)）
- [Transformers.js](https://huggingface.co/docs/transformers.js) / [MDN WebGPU](https://developer.mozilla.org/docs/Web/API/WebGPU_API)

## 进阶路线

1. **自编译模型**——MLC 框架把自定义模型编译进 WebLLM（超出本系列的 Rust/编译链话题）；
2. **多模态本地推理**——视觉/音频的本地模型（LLaVA、VLM 量化版）与 [Transformers.js 视觉任务](/posts/local-ai-dev/08-transformersjs/)；
3. **上下文工程本地版**——小模型的[压缩](/posts/ai-sdk-dev/04-tool-loop-agent/)策略实测，筹备中的上下文工程系列；
4. **回到云端**——混合架构的云端半边与[评测门禁](/posts/evals-dev/07-ci/)并轨，完成"本地回归 + 云端终验"的全流程。
