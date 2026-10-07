---
title: "本地与浏览器推理入门 · 第 1 章：为什么在本地跑 AI"
description: "三条零 key 路线全景（浏览器内/Chrome 内置/本地服务器）、隐私与成本动机、硬件与量化常识、选型决策表。"
publishDate: 2026-12-17T09:00:00
tags: ["webgpu", "ai", "教程"]
---

> 本文对应 [WebLLM 官网](https://webllm.mlc.ai/)、[Chrome Prompt API 文档](https://developer.chrome.com/docs/ai/prompt-api)与 [Ollama](https://ollama.com) 的概览；三者的实操分别在第 2、5、7 章。

**学习目标**：建立"模型推理在哪里发生"的全景图，理解零 API key 的四重价值，掌握硬件与量化常识，学会按场景选路线。

前几个系列的模型调用都要 API key——[评测 runner](/posts/evals-dev/05-runner/) 的账单护栏、[MCP 的凭据管理](/posts/mcp-dev/08-security/)都在为它操心。这个系列反着来：**一条 API key 都不用**。模型跑在三个地方——你的浏览器里、操作系统自带的运行时里、你自己的电脑上。

> 内容依据 [WebLLM](https://webllm.mlc.ai/)、[Chrome 内置 AI](https://developer.chrome.com/docs/ai/prompt-api)、[Ollama](https://ollama.com) 官方文档（2026 年 12 月状态）整理，代码示例均为原创，每章附官方文档链接。

## 三条路线全景

| 路线 | 模型在哪 | 算力来源 | 谁维护模型 | 章节 |
| --- | --- | --- | --- | --- |
| **本地服务器** | 你电脑上的 Ollama | 本机 GPU/CPU | 你（ollama pull） | 第 2~3 章 |
| **浏览器内推理** | 网页下载的模型权重（WebGPU） | 访客的 GPU | 框架（MLC 编译） | 第 4~6 章 |
| **浏览器内置 AI** | Chrome 自带的 Gemini Nano | 本机，浏览器托管 | 浏览器厂商 | 第 7 章 |
| （附加）专用小模型 | ONNX 权重 | WebGPU/WASM | 你 | 第 8 章 |

三条路线共享一个前提：**推理发生在用户自己的硬件上**。区别只在"谁来下载和管理模型"——你自己（Ollama）、框架运行时（WebLLM 首次加载权重）、还是浏览器（Gemini Nano 首次使用时下载）。

## 零 key 的四重价值

- **隐私**：笔记、病历、代码、私人对话不出本机——对个人工具是底线，对行业（医疗/法律/金融）是合规前提；
- **成本**：token 计费归零。[评测系列](/posts/evals-dev/05-runner/)的成本护栏从"防惊吓"变成"不需要"——本地模型跑回归想跑多少跑多少；
- **离线**：飞机上、内网里、弱网环境照常工作（第 9 章的 PWA 组合）；
- **可控**：模型版本锁定、无静默更新（[安全评测](/posts/evals-dev/10-red-team/)的"模型静默升级门禁"在本地路线里直接消失）、无供应商跑路风险。

代价同样明确：**能力天花板低**（本地模型远弱于云端旗舰）、**首次成本高**（权重下载 GB 级）、**硬件门槛**（下一节）。工程的艺术在于把任务分级——不是所有任务都配得上旗舰模型。

## 硬件与量化常识

LLM 推理的瓶颈是**显存（或内存）**，一个粗略的心算公式：

```text
模型显存占用 ≈ 参数量(B) × 量化精度(bytes) × 1.2
7B 模型 Q4（4bit）≈ 7 × 0.5 × 1.2 ≈ 4.2 GB
```

- **参数量**：3B/7B 适合消费级硬件，13B+ 要正经显卡；
- **量化（quantization）**：把 16bit 权重压到 4bit/8bit，显存降数倍、质量小幅下降——本地推理的默认选择（Q4 起步）；
- **上下文窗口**也吃显存：长会话在本地是真实成本，[上下文压缩](/posts/ai-sdk-dev/04-tool-loop-agent/)在这里不是优化项而是必需品。

浏览器路线还有额外一层：**WebGPU 支持**（Chrome/Edge 等，[第 4 章](/posts/local-ai-dev/04-webgpu/)检查兼容性），访客设备参差不齐——优雅降级策略（检测失败就引导到云端或内置 AI）是产品必备。

## 贯穿项目：notes 的零 key 三形态

老朋友最后一次变形——同一份 [store 业务层](/posts/node-core/04-fs-and-path/)（浏览器版走 [IndexedDB/localStorage](/posts/nuxt-dev/05-server-routes/)），配三种零 key 推理：

```text
第 2~3 章  Ollama 版：本地 Node Agent（评测零成本回归）
第 5~6 章  WebLLM 版：纯浏览器 Agent（访客设备上跑）
第 7 章    Gemini Nano 版：浏览器内置模型做笔记摘要
```

三形态共用同一套工具定义与提示词——**推理位置是可替换的，这本身就是零 key 架构最好的测试**。

## 踩坑提示

- 本地模型当旗舰用——7B 模型做不了云端 200B 的活，任务分级是第 10 章的正式课题；
- 忽略首次下载成本——GB 级权重的加载体验（进度、缓存、断点）是产品问题不是技术细节；
- 在不支持的浏览器上硬跑 WebGPU——检测、降级、引导三步都要有；
- 把"零 key"当"零运维"——本地路线的模型管理（版本、磁盘、更新）转移到你自己手里。

## 练习

1. 用显存公式估算你的设备能跑多大的 Q4 模型，写下结论。
2. 列出你的 AI 功能清单，逐条标注：可本地 / 必须云端 / 混合。
3. 浏览 [WebLLM](https://webllm.mlc.ai/) 与 [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api) 文档，对比两者"模型从哪来"的机制差异。
