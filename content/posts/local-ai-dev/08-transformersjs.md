---
title: "本地与浏览器推理入门 · 第 8 章：Transformers.js 与专用模型"
description: "ONNX 路线的浏览器 AI：embedding、Whisper 转写、小模型分类——LLM 之外的推理版图。"
publishDate: 2026-12-24T09:00:00
tags: ["webgpu", "ai", "教程"]
---

> 本文对应 [Transformers.js 官方文档](https://huggingface.co/docs/transformers.js)（Hugging Face 出品，ONNX Runtime Web 后端）。

**学习目标**：认识浏览器推理的第二大框架路线，掌握 embedding、语音转写、文本分类三个高频专用场景，把"浏览器 AI"从 LLM 扩展到完整版图。

LLM 不是浏览器 AI 的全部。生成式任务（写摘要、分类、转写）用**专用小模型**往往更快更准更省——Transformers.js（Hugging Face，ONNX Runtime Web 后端）是这个领域的标准库，与 WebLLM（[第 5 章](/posts/local-ai-dev/05-webllm/)）构成浏览器推理的两条腿。

## 两种框架路线的分工

| | WebLLM | Transformers.js |
| --- | --- | --- |
| 模型形态 | MLC 预编译的 LLM | ONNX 格式的任意任务模型 |
| 擅长 | 生成式对话、工具调用 | embedding、分类、语音、视觉 |
| 接口方言 | OpenAI chat completions | 任务式 pipeline API |
| 权重来源 | 预编译列表 | Hugging Face Hub（万级模型） |

选型口诀：**对话与 Agent 找 WebLLM，"智能件"找 Transformers.js**——两者可以同页共存（各自独立 worker）。

## 三个高频专用场景

**1. Embedding：本地语义向量**

```ts
import { pipeline } from "@huggingface/transformers"

const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
const output = await extractor("图书馆借阅期限", { pooling: "mean", normalize: true })
// output.data 即向量 —— 余弦相似度自算，或替换 [AI SDK 的 embed](/posts/ai-sdk-dev/09-embeddings-rag/)
```

[语义搜索](/posts/ai-sdk-dev/09-embeddings-rag/)的本地化形态：向量计算也在浏览器里完成，**整条语义检索链路零网络请求**——隐私场景的正确答案。

**2. Whisper：语音转文字**

```ts
const transcriber = await pipeline("automatic-speech-recognition", "onnx-community/whisper-base")
const text = await transcriber(audioBuffer)     // 麦克风录音 → 文本笔记
```

"语音记笔记"是 notes 的自然扩展：录音在本地转写，敏感内容永不上传——云端语音 API 做不到的隐私保证。

**3. 文本分类：不用 LLM 的分类**

```ts
const classifier = await pipeline("text-classification", "Xenova/distilbert-base-uncased-finetuned-sst-2-english")
await classifier("这条笔记看起来是待办")      // { label, score }
```

细粒度 LLM 分类（[第 7 章](/posts/local-ai-dev/07-chrome-prompt-api/)）之外，固定标签集的分类用 BERT 系小模型：毫秒级、零成本、零幻觉——**LLM 分类与专用模型分类是两个物种**，前者自由度高，后者又快又稳。

## 浏览器 AI 的完整版图

```text
生成式对话/Agent   → WebLLM（第 5~6 章）/ Chrome Prompt API（第 7 章）
向量与检索        → Transformers.js embedding / AI SDK embed
语音转写          → Transformers.js Whisper
分类/情感/NER     → Transformers.js BERT 系
摘要/翻译/改写    → Chrome 任务型 API（第 7 章伴生家族）
```

架构设计的单元从"接一个模型"变成**"拼一块推理积木"**——每个智能件独立选型，本地/云端/内置三来源可混搭（第 9 章的分级架构）。

## 踩坑提示

- ONNX 模型没选 quantized 版本——体积与速度差数倍；Transformers.js 默认配 q8，别手动改大；
- WASM 后端跑大模型——WebGPU 后端（`device: "webgpu"` 选项）快得多，能上就上；
- 语音转写不做分块——长录音爆内存，按时长切片；
- 全部智能件同时初始化——首屏加载崩塌，按需懒加载 + [缓存](/posts/local-ai-dev/05-webllm/)策略。

## 练习

1. 跑通本地 embedding + 余弦相似度，替换 notes 关键词搜索的排序层。
2. 接 Whisper 做"录音 → 笔记"，实测 60 秒音频的转写耗时（WebGPU vs WASM）。
3. 给 notes 写一个"智能件选型表"：每个功能（摘要/分类/转写/对话）标注选型与理由。
