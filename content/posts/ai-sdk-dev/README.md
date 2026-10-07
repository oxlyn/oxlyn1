---
title: "AI SDK 6 实战：从手写 Agent 到标准框架"
description: "AI SDK 6 系列教程总览：统一模型接口、工具循环、ToolLoopAgent、审批流、MCP 接入、结构化输出、流式 UI 与生产化。"
publishDate: 2026-12-16T09:00:00
tags: ["ai-sdk", "agent", "教程"]
---

[《从零实现 Agent》](/posts/agent-from-scratch/)里我们亲手写过循环、流式、工具、权限、压缩——懂了原理，但也学会了它有多繁琐：每换一家模型供应商，适配代码重写一遍。AI SDK（v6，2025 年 12 月发布）把这些固化成 TypeScript 标准件：一套 API 调所有主流模型，Agent 循环变成声明式配置，审批与 MCP 内建。这个系列的读法是**对照**：每章先回忆手写版的实现，再看框架把同一件事变成了什么——手写过，才看得懂框架替你做了什么、又藏了什么。

> 内容依据 [ai-sdk.dev 官方文档](https://ai-sdk.dev/docs)（v6）整理，代码示例均为原创，每章附官方文档链接。前置：[《从零实现 Agent》](/posts/agent-from-scratch/)（原理层）、[《MCP 开发入门》](/posts/mcp-dev/)（协议层）、[《LLM 应用评测入门》](/posts/evals-dev/)（验收层）。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：手写之后看框架](/posts/ai-sdk-dev/01-why-framework/) | 三层结构、手写↔框架对照地图 | [Introduction](https://ai-sdk.dev/docs/introduction) |
| [第 2 章：统一模型接口](/posts/ai-sdk-dev/02-unified-provider/) | generateText/streamText、供应商字符串、usage 统一 | [generateText](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text) |
| [第 3 章：工具定义与循环](/posts/ai-sdk-dev/03-tools/) | tool() 三要素、手动循环、stopWhen 初见 | [Building Agents](https://ai-sdk.dev/docs/agents/overview) |
| [第 4 章：ToolLoopAgent](/posts/ai-sdk-dev/04-tool-loop-agent/) | 声明式 Agent、停止条件、prepareStep、pruneMessages | [Loop Control](https://ai-sdk.dev/docs/agents/loop-control) |
| [第 5 章：工具审批](/posts/ai-sdk-dev/05-approvals/) | toolApproval 策略、审批消息流、useChat 侧确认 | [Tool Approvals](https://ai-sdk.dev/docs/agents/tool-approvals) |
| [第 6 章：接入 MCP](/posts/ai-sdk-dev/06-mcp/) | 适配层桥接 notes-mcp、内建支持的取舍 | [Building Agents](https://ai-sdk.dev/docs/agents/overview) |
| [第 7 章：结构化输出](/posts/ai-sdk-dev/07-structured/) | generateObject/streamObject、schema 即契约 | [generateObject](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object) |
| [第 8 章：流式 UI 与生成式界面](/posts/ai-sdk-dev/08-streaming-ui/) | useChat 全栈协议、AI Elements、生成式 UI | [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview) |
| [第 9 章：embed 与语义检索](/posts/ai-sdk-dev/09-embeddings-rag/) | embed/embedMany/cosineSimilarity、混合检索 | [Embeddings](https://ai-sdk.dev/docs/reference/ai-sdk-core/embed) |
| [第 10 章：生产化与收口](/posts/ai-sdk-dev/10-production/) | 遥测、重试、评测接线、手写 vs 框架决策表 | [Telemetry](https://ai-sdk.dev/docs/ai-sdk-core/telemetry) |
| [附录：API 速查与对照表](/posts/ai-sdk-dev/11-appendix/) | 三层 API 表、手写↔SDK 对照表 | — |

## 贯穿项目：Agent 的框架化重写

[从零实现 Agent](/posts/agent-from-scratch/README.md) 的 notes Agent 在本系列被逐章重写：第 2 章退役手写适配层、第 4 章循环变成 `ToolLoopAgent`、第 5 章权限变成 `toolApproval`、第 6 章接上 [notes-mcp](/posts/mcp-dev/02-first-server/)、第 10 章整体接入[评测门禁](/posts/evals-dev/07-ci/)。终局是一份**决策表**：哪些场景值得手写、哪些场景框架完胜——两套代码都真实存在过，选边才有依据。

## 三条主线

1. **Core 层**（第 2、3、7、9 章）——统一模型接口、工具、结构化输出、向量：框架的"物理层"；
2. **Agent 层**（第 4、5、6 章）——声明式循环、审批、MCP：手写循环的全部工程判断被声明化；
3. **产品层**（第 8、10 章）——流式 UI、生成式界面、遥测与评测接线。

## 运行环境

Node 22+，`npm install ai @ai-sdk/anthropic zod`；任意一家模型 API key，或本地 OpenAI 兼容端点（[Ollama](https://ollama.com) 亦可）；第 8 章 UI 部分需 React 或 Vue 环境。

## 遗留问题

- SDK 迭代快，专属字段（如 `experimental_*` 前缀）以[官方文档](https://ai-sdk.dev/docs)为准，本系列对齐 v6 的稳定面；
- 多 Agent 编排（子代理组合）只点到 [HarnessAgent](https://ai-sdk.dev/docs/agents/overview) 与 [Agent 第 8 章](/posts/agent-from-scratch/08-subagent/)的对照，编排专题留待 SDK 生态稳定后成篇；
- 生成式 UI 的 React 深水区（服务端组件、流式 UI 协议细节）超出 Vue/通用视角，参考[官方进阶篇](https://ai-sdk.dev/docs/advanced/model-as-router)。
