---
title: "本地与浏览器推理入门 · 第 6 章：浏览器里的工具调用"
description: "WebLLM function calling、notes 浏览器版 Agent、小模型工具循环的纪律与上下文限制。"
publishDate: 2026-12-22T09:00:00
tags: ["webgpu", "ai", "教程"]
---

> 本文对应 [WebLLM 的 OpenAI 兼容文档](https://webllm.mlc.ai/docs/user/get_started.html)（function calling 部分）；工具设计规范回看[《MCP 开发入门》第 3 章](/posts/mcp-dev/03-tools/)。

**学习目标**：在纯浏览器环境跑通工具调用循环，完成 notes 的零 key 浏览器版 Agent，掌握小模型 + 访客设备下的工程纪律。

[第 5 章](/posts/local-ai-dev/05-webllm/)跑通了对话；这一章给浏览器里的模型装上"手"——工具调用。**没有服务器参与**：模型在访客 GPU 上推理，工具在页面里执行，store 在 localStorage 里读写。

## function calling：方言内的标准件

WebLLM 说 OpenAI 方言，工具定义就是 OpenAI 形状：

```ts
const addNoteTool = {
  type: "function",
  function: {
    name: "add_note",
    description: "添加一条笔记。输入笔记正文，返回创建结果。",
    parameters: {                       // JSON Schema 形状
      type: "object",
      properties: { text: { type: "string", description: "笔记正文" } },
      required: ["text"],
    },
  },
}

const chunks = await engine.chat.completions.create({
  messages,
  tools: [addNoteTool, searchNotesTool],
  tool_choice: "auto",
  stream: true,
})
```

循环要么用 WebLLM 的 agentic 配置（引擎代管工具执行），要么手写循环消费 `delta.tool_calls`——后者与[手写 Agent 循环](/posts/agent-from-scratch/02-agent-loop/)同构，步数上限与[上下文压缩](/posts/ai-sdk-dev/04-tool-loop-agent/)的纪律原样适用。

## 浏览器版 store：数据不出访客设备

```ts
// localStorage 版 store（体量大换 IndexedDB）
export async function loadNotes() {
  return JSON.parse(localStorage.getItem("notes") ?? "[]")
}
export async function saveNotes(notes) {
  localStorage.setItem("notes", JSON.stringify(notes))
}
```

工具定义复用 [notes 家族的接口形状](/posts/mcp-dev/02-first-server/)（add/search/list），执行体指向浏览器版 store——**第 N 次复用同一份业务逻辑**：Node CLI、MCP 服务器、Nuxt Web、浏览器本地，五副面孔一个核心。

## 小模型 + 访客设备：三条纪律

云端旗舰跑工具循环"自由生长"即可；本地 8B 在访客设备上跑，纪律要收紧：

1. **工具面收窄**：3 个以内工具（[少而正交](/posts/mcp-dev/03-tools/)），参数 schema 扁平——小模型的工具选择准确率对选项数量极其敏感；
2. **上下文预算前置**：系统提示 + 工具定义就吃掉小模型上下文的一小半，[prune 思路](/posts/ai-sdk-dev/04-tool-loop-agent/)从第一步启用，历史消息按轮裁剪；
3. **每步都兜底**：schema 校验失败、非法工具名、无限复读——手写循环里的 `stopWhen` 与错误回复缺一不可（[MCP 第 3 章](/posts/mcp-dev/03-tools/)的 isError 约定照写）。

还有一条**设备纪律**：引擎创建前先跑[第 4 章的分级检测](/posts/local-ai-dev/04-webgpu/)，limited 设备换 3B 模型、unsupported 设备走[第 7 章的内置 AI](/posts/local-ai-dev/07-chrome-prompt-api/)或引导——降级链写进产品，不是异常处理。

## 踩坑提示

- 工具循环的中间消息永不清理——几轮后超出上下文窗口报错，边跑边裁；
- 在访客设备上默认加载最大模型——首访体验从"惊艳"变"卡死"，模型选择跟随分级；
- 把 localStorage 当数据库——5MB 配额与同步阻塞是硬上限，笔记多了升 IndexedDB（[第 9 章](/posts/local-ai-dev/09-privacy-offline/)）；
- 模型编造工具名直接崩——非法调用按"错误信息回喂"处理（第 4 章防呆清单的做法）。

## 练习

1. 跑通浏览器版"记一条笔记 → 查一条笔记"的两步工具循环，打印每步的 tool_calls。
2. 把工具从 3 个加到 8 个，观察小模型选择准确率的变化，写下你的工具面纪律。
3. 实现每轮消息裁剪（保留系统提示 + 最近 3 轮），跑 10 轮长会话验证不爆上下文。
