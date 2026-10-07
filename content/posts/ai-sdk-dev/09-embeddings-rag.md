---
title: "AI SDK 6 实战 · 第 9 章：embed 与语义检索"
description: "embed/embedMany、cosineSimilarity 与语义搜索的最小闭环——notes 语义版与上下文预算。"
publishDate: 2026-12-13T09:00:00
tags: ["ai-sdk", "agent", "教程"]
---

> 本文对应官方文档 [Embeddings](https://ai-sdk.dev/docs/reference/ai-sdk-core/embed)（embed / embedMany / cosineSimilarity）。

**学习目标**：掌握 embedding 的三个核心 API，给 notes 加上语义搜索，理解"检索质量"如何进入[评测](/posts/evals-dev/)与[上下文预算](/posts/mcp-dev/07-context/)的视野。

[notes 的搜索](/posts/mcp-dev/03-tools/)目前是关键词匹配——"还书"搜不到"图书馆借阅期限"。**语义搜索**把文本变成向量，按"意思的距离"检索。AI SDK 的 embed 系列是全流程的标准件。

## 三个核心 API

```ts
import { embed, embedMany, cosineSimilarity } from "ai"

// 单条：查询时用
const { embedding } = await embed({
  model: "openai/text-embedding-3-small",
  value: "图书馆借阅期限",
})

// 批量：入库时用
const { embeddings } = await embedMany({
  model: "openai/text-embedding-3-small",
  values: notes.map((n) => n.text),
})

// 比较：算"意思的距离"
const sim = cosineSimilarity(queryEmbedding, noteEmbedding)   // [-1, 1]，越大越近
```

模式固定：**入库时向量化存档，查询时向量化问题，余弦相似度排序取 Top-K**。向量存哪？notes 的体量用 JSON 文件 + 内存排序足矣（[一贯的极简存储](/posts/node-core/04-fs-and-path/)）；上万条换 SQLite 向量扩展或专用向量库——接口形状不变，换的是存储。

## 给 notes 加 semantic_search

```ts
import { tool } from "ai"

export const semanticSearch = tool({
  description: "按语义搜索笔记。关键词搜索无结果、或用户用自然语言描述内容时使用。",
  inputSchema: z.object({
    query: z.string().describe("自然语言描述，如'关于还书的事'"),
    limit: z.number().int().min(1).max(20).default(5),
  }),
  execute: async ({ query, limit }) => {
    const { embedding } = await embed({ model: EMBED_MODEL, value: query })
    const notes = await loadNotesWithVectors()          // 预计算好的向量随笔记存档
    return notes
      .map((n) => ({ ...n, score: cosineSimilarity(embedding, n.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  },
})
```

工程要点：**向量随笔记落盘**（新增/修改时重算该条，别每次查询全量重算）；工具 description 按[三问](/posts/mcp-dev/03-tools/)写清与关键词搜索的分工；`limit` 默认值克制（[上下文预算](/posts/mcp-dev/07-context/)）。

## 混合检索：两把尺子一起用

语义搜索的已知短板：专有名词、编号、精确短语容易"意思相近但答非所问"。生产配方是**关键词与语义并行，结果融合**：

```ts
const kw = await searchNotes(keyword)          // 精确命中通道
const se = await semanticSearchOnly(query)     // 语义通道
const merged = fuse(kw, se)                    // 并集 + 分数加权
```

[notes-mcp 的 search_notes](/posts/mcp-dev/03-tools/) 升级版就是这个混合体——对 Agent 来说工具签名没变，检索质量内部进化，这正是"业务层与门面分离"（[贯穿项目](/posts/evals-dev/README.md)）的红利。

## 检索质量进入评测视野

语义检索是概率行为，[评测三要素](/posts/evals-dev/01-why-evals/)直接套用：

- **用例**：查询 + 期望命中的笔记 id（回归集里最值得写的一类）；
- **断言**：Top-K 是否包含期望 id（确定性断言）+ 命中位置（排序质量）；
- **A/B**：换 embedding 模型、调 limit、关键词与语义的融合权重——每个改动都跑一遍检索评测集。

RAG 的专项指标（忠实度、检索命中率）有现成量表（[RAGAS](https://docs.ragas.io/) 一类），方法论与本系列一致——独立成篇属于筹备中的上下文工程系列。

## 踩坑提示

- 入库与查询用了不同 embedding 模型——向量空间不同，相似度全错；模型名要和向量一起存档；
- 只存向量不存原文与元数据——召回后还要回查一次库，多此一举；
- 余弦阈值抄通用值——不同 embedding 模型的分数分布差异巨大，用你自己的标注数据标定；
- 语义搜索全量重算向量——每次查询一个 API 调用每条笔记，成本与延迟双爆。

## 练习

1. 给 notes 加"入库时计算向量"的字段与 `semantic_search` 工具，用"还书"测试查"图书馆借阅期限"的跨词命中。
2. 实现关键词 + 语义的混合融合，与两个单通道分别对比 5 个查询的命中表现。
3. 写 5 条检索评测用例（查询 + 期望命中 id），接入[评测 runner](/posts/evals-dev/05-runner/)，得到检索质量的第一份回归分数。
