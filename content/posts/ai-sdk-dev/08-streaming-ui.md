---
title: "AI SDK 6 实战 · 第 8 章：流式 UI 与生成式界面"
description: "useChat 全栈接线、AI Elements 组件、生成式 UI（工具返回界面）——模型决定渲染什么。"
publishDate: 2026-12-12T09:00:00
tags: ["ai-sdk", "agent", "教程"]
---

> 本文对应官方文档 [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview)、[生成式 UI](https://ai-sdk.dev/docs/advanced/rendering-ui-with-language-models)与 [AI Elements](https://ai-sdk.dev/elements/overview)。

**学习目标**：把 Agent 接到前端——useChat 的全栈流式协议、消息里的工具与审批部件、生成式 UI 让模型决定渲染什么组件。

前几章的 Agent 都活在终端里；AI SDK 的 UI 层负责"让用户看见"——而且看见的不只是文本。

## useChat：一条全栈流式协议

前端钩子与后端 Agent 之间是 SDK 约定的流式协议（文本增量、工具调用、审批请求都是消息部件）：

```ts
// React 示例（Vue/Svelte 同构：@ai-sdk/vue 等）
"use client"
import { useChat } from "@ai-sdk/react"

export function Chat() {
  const { messages, sendMessage, status } = useChat({ api: "/api/chat" })
  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          {m.parts.map((part, i) => {
            if (part.type === "text") return <p key={i}>{part.text}</p>
            if (part.type.startsWith("tool-"))
              return <ToolCard key={i} part={part} />   // 工具调用与状态可见
            return null
          })}
        </div>
      ))}
      <button disabled={status !== "ready"} onClick={() => sendMessage("记一条：买牛奶")}>
        发送
      </button>
    </div>
  )
}
```

后端把 [Agent 的流](/posts/ai-sdk-dev/04-tool-loop-agent/)接到同一条协议上，前端 `messages` 的 parts 数组是**全程事件的回放**：文本增量、工具调用、[审批请求](/posts/ai-sdk-dev/05-approvals/)（`state: "approval-requested"` + `addToolApprovalResponse`）。手写流式 UI 时自建的"增量拼接 + 事件分发"（[Agent 第 3 章](/posts/agent-from-scratch/03-streaming/)）整段退役。

## AI Elements：聊天的 shadcn

聊天界面的通用件（消息气泡、工具调用卡片、思考过程面板、输入框）被抽成 **AI Elements** 组件库（基于 React/shadcn 风格，可复制可改）——不用它也要看它的部件划分，那是官方对"Agent UI 需要哪些元素"的答案。

## 生成式 UI：模型决定渲染什么

更进一步：**工具的产出直接是界面组件**。模型判断"用户要看天气"时调用 `weatherWidget` 工具，前端不是渲染一段"今天 24 度"的文本，而是渲染一个真正的天气组件：

```tsx
// 前端：工具名 → 组件的映射
const ui = {
  weatherWidget: ({ city, temp }) => <WeatherCard city={city} temp={temp} />,
  noteList: ({ notes }) => <Notes items={notes} />,
}
// messages 里的工具部件按映射渲染，数据由工具 execute 提供
```

价值在"**结构化交互**"：确认弹窗、可点击的列表、表单——比让模型生成 HTML 安全得多（组件是白名单，模型只填参数）。适用边界也清晰：**动态内容渲染交给生成式 UI，页面骨架还是手写组件**——与[Astro 岛屿](/posts/astro-from-scratch/)的哲学互为镜像：那边是"静态页里嵌交互岛"，这边是"对话流里嵌 UI 岛"。

## Vue 开发者的路径

[本站 Vue 线](/posts/vue-core/)的读者：`@ai-sdk/vue` 提供 `useChat` 同构钩子，核心概念一一对应；生成式 UI 的组件映射用 Vue 组件表实现同理。教程生态 React 优先——概念吃透后换框架只是语法。

## 踩坑提示

- 在 parts 渲染里只处理 text 类型——工具调用、审批请求全都黑屏，部件类型要穷举；
- 生成式 UI 的组件映射暴露给模型过多——模型乱点菜单，映射表按页面场景裁剪；
- 流式协议与自建 SSE 混接——前端两套解析互相污染，接了 useChat 就走全协议；
- 把密钥链的模型调用放在客户端——模型 key 只在后端 route 里，前端只见协议流。

## 练习

1. 用 useChat + 后端 Agent 搭一个 notes 聊天页，确认工具调用部件在消息流里可见。
2. 给 `removeNote` 的审批请求渲染确认弹窗，走通"拒绝 → AI 收到原因 → 换方案"。
3. 实现一个 `noteList` 生成式 UI 工具：模型调用后前端渲染真实组件而非文本，对比两种呈现的交互成本。
