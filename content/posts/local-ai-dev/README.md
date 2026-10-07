---
title: "本地与浏览器推理入门：零 API key 的前端 AI"
description: "本地推理系列总览：Ollama 本地 Agent、WebGPU 与 WebLLM 浏览器推理、Chrome 内置 AI、Transformers.js 专用模型与隐私架构。"
publishDate: 2026-12-28T09:00:00
tags: ["webgpu", "ai", "教程"]
---

前几个系列的模型调用都要 API key——本系列反着来：**一条 key 都不用**。模型跑在三个地方：你电脑上的 Ollama、访客浏览器的 WebGPU（WebLLM）、Chrome 自带的 Gemini Nano。隐私数据不出设备、token 账单归零、断网照常工作、模型版本完全可控——代价是能力天花板与硬件门槛，而管理这份取舍正是"前端 AI"的架构核心。

> 内容依据 [WebLLM](https://webllm.mlc.ai/)、[Chrome 内置 AI](https://developer.chrome.com/docs/ai/prompt-api)、[Ollama](https://ollama.com)、[Transformers.js](https://huggingface.co/docs/transformers.js) 官方文档（2026 年 12 月状态）整理，代码示例均为原创，每章附官方文档链接。前置：[《Node.js 核心入门》](/posts/node-core/)与[《AI SDK 6 实战》](/posts/ai-sdk-dev/)的接口概念。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：为什么在本地跑 AI](/posts/local-ai-dev/01-why-local/) | 三路线全景、零 key 四重价值、显存心算 | — |
| [第 2 章：Ollama 本地起步](/posts/local-ai-dev/02-ollama/) | 拉模型、读量化标签、OpenAI 兼容端点 | [Ollama](https://ollama.com) |
| [第 3 章：OpenAI 兼容接口通吃](/posts/local-ai-dev/03-openai-compatible/) | AI SDK 指向本地、零成本回归评测 | [AI SDK](https://ai-sdk.dev/docs) |
| [第 4 章：WebGPU 入门](/posts/local-ai-dev/04-webgpu/) | adapter/device、与 WebGL 代差、设备分级 | [MDN WebGPU](https://developer.mozilla.org/docs/Web/API/WebGPU_API) |
| [第 5 章：WebLLM 浏览器推理](/posts/local-ai-dev/05-webllm/) | CreateMLCEngine、WebWorker 引擎、权重缓存 | [WebLLM](https://webllm.mlc.ai/docs/user/get_started.html) |
| [第 6 章：浏览器里的工具调用](/posts/local-ai-dev/06-browser-agent/) | function calling、notes 浏览器版 Agent | [WebLLM](https://webllm.mlc.ai/docs/user/get_started.html) |
| [第 7 章：Chrome 内置 AI](/posts/local-ai-dev/07-chrome-prompt-api/) | LanguageModel 会话、JSON 约束、伴生 API | [Prompt API](https://developer.chrome.com/docs/ai/prompt-api) |
| [第 8 章：Transformers.js 与专用模型](/posts/local-ai-dev/08-transformersjs/) | 本地 embedding、Whisper 转写、小模型分类 | [Transformers.js](https://huggingface.co/docs/transformers.js) |
| [第 9 章：隐私与离线架构](/posts/local-ai-dev/09-privacy-offline/) | 数据分级、混合架构、PWA 离线组合 | [PWA](https://web.dev/learn/pwa) |
| [第 10 章：性能与选型收口](/posts/local-ai-dev/10-performance-and-choice/) | TTFT/吞吐/质量基线、最终决策表 | — |
| [附录：速查与选型](/posts/local-ai-dev/11-appendix/) | 路线对比、命令、API 速查、显存心算 | — |

## 贯穿项目：notes 的零 key 三形态

store 业务层第 N 次复用（Node CLI → MCP → Web → 浏览器），推理换三个零 key 来源：

```text
第 2~3 章  Ollama 版本地 Agent——评测回归零成本跑
第 5~6 章  WebLLM 版浏览器 Agent——访客设备上的工具循环
第 7 章    Gemini Nano——笔记摘要与分类的浏览器原生增强
```

三种形态共用一套工具定义与提示词——**推理位置是可替换的**，这是零 key 架构的核心测试。

## 三条主线

1. **本地路线**（第 2、3 章）——Ollama 与 OpenAI 兼容接口，现有代码零改动切换；
2. **浏览器路线**（第 4、5、6、7、8 章）——WebGPU 地基、WebLLM、内置 AI、专用模型，访客设备上的完整智能；
3. **架构层**（第 9、10 章）——数据分级、混合路由、性能与选型的量化方法。

## 运行环境

- 本地路线：[Ollama](https://ollama.com) + 8GB 显存（或 16GB 内存跑 Q4 小模型）；
- 浏览器路线：Chrome/Edge + WebGPU 支持（[第 4 章检测](/posts/local-ai-dev/04-webgpu/)），全程无需 API key。

## 遗留问题

- 自编译模型进 WebLLM（MLC 编译链）与多模态本地模型（LLaVA 等）超出前端视角，见各自框架文档；
- Chrome Prompt API 的多模态与扩展能力仍在快速演进，以[官方文档](https://developer.chrome.com/docs/ai/prompt-api)为准；
- 上下文压缩在小模型上的策略实测，归入筹备中的上下文工程系列。
