---
title: "从 0 开始实现一个 Coding Agent · 第 1 章：最简实现"
description: "一次模型调用、消息角色、多轮对话，对照 packages/llm/llm 的消息词汇与适配器接缝。"
publishDate: 2026-10-05T22:00:00
tags: ["教程", "agent"]
---

# 第 1 章 · 最简实现:一次模型调用

> 对应代码:[code/01-chat.ts](code/01-chat.ts)(约 75 行,零依赖)

## 学习目标

- 理解"模型 API 是无状态的"这件事,以及它如何决定了 agent 的一切设计。
- 写出最小的多轮对话程序:一个消息数组、一次 HTTP 调用。
- 认识消息的 `role` 体系——后面所有章节都建立在这几个角色之上。

## 概念:模型不会替你记住任何东西

模型 API(DeepSeek 的 OpenAI 兼容端点 `/chat/completions`)是**无状态**的:每次请求你必须把完整的对话历史发过去,模型根据这段历史生成下一条消息。所谓"对话记忆",不过是客户端把历史保存在一个数组里,每次请求 whole 重发。

这个数组里的每条消息有一个 `role`:

| role | 谁在说话 | 作用 |
|---|---|---|
| `system` | 程序作者 | 设定身份、规则、环境信息;用户一般看不到 |
| `user` | 用户 | 提问、下指令 |
| `assistant` | 模型 | 模型的回复(你要把它追加回去,对话才能延续) |

记住一个朴素的事实:**agent = 一个不断维护这个数组、并决定何时往里加什么的程序**。后面每一章都在给"往里加什么"增加新的来源:工具结果(第 2 章)、运行时上下文(第 4 章)、子代理结论(第 8 章)、压缩摘要(第 7 章)。

## 完整代码

```ts
import { createInterface } from 'node:readline/promises'

const API_URL = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-chat'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function chat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages }),
  })
  if (!res.ok) throw new Error(`API 返回 ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as { choices: { message: { content: string } }[] }
  return data.choices[0]!.message.content
}

async function main(): Promise<void> {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('请先设置环境变量 DEEPSEEK_API_KEY')
    process.exit(1)
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: '你是一个简洁的编程助手。' },
  ]

  process.stdout.write('输入问题,Ctrl+D 退出。\n你: ')
  const rl = createInterface({ input: process.stdin })
  for await (const line of rl) {
    const input = line.trim()
    if (input.length === 0) {
      process.stdout.write('你: ')
      continue
    }
    messages.push({ role: 'user', content: input })
    const answer = await chat(messages)
    messages.push({ role: 'assistant', content: answer })
    console.log(`助手: ${answer}`)
    process.stdout.write('你: ')
  }
}

main()
```

运行:

```sh
DEEPSEEK_API_KEY=sk-... node --experimental-strip-types 01-chat.ts
# Node >= 23.6 可直接:node 01-chat.ts
```

## 设计要点与坑

- **assistant 回复必须追加回数组**。漏了这一步,模型每轮都会"失忆"。这是新手最常见的 bug。
- **错误要带响应体**。`API 返回 400: ...` 比一个孤零零的状态码有用得多——400 的响应体里写着具体是哪条消息、哪个参数不合法,是调试提示词的第一现场。
- **system 消息是程序的,不是用户的**。它应该在会话开始时就位,并且用户输入永远不应拼进 system(那等于让用户改写你的规则)。

## 对照 DeepSeek Harness

这本教程的所有"对照"都指向本仓库(deepseek-harness)的真实实现,路径均以仓库根为基准。

- **角色词汇表更宽**。真实实现里消息角色有五种:`system / developer / user / assistant / tool`(`packages/llm/llm/src/message.ts:187` 的 `MessageRoleMap`)。`tool` 角色就是第 2 章的主角,`developer` 是"程序写给模型看、但语义上不同于 system"的消息。本教程为了起步简单,先只用三种。
- **消息不只是字符串**。真实实现的每条消息由 `ContentBlock[]` 组成(文本、推理、图片、文件、工具调用等七种,`packages/llm/llm/src/types.ts:137`),因为 agent 需要回传图片、拆分工具调用。第 3 章会看到这为什么重要。
- **API 协议不同**。仓库自带的 DeepSeek 适配器没有走 OpenAI 兼容协议,而是手写 `fetch` 直连 Anthropic Messages 风格的端点 `https://api.deepseek.com/anthropic`(`packages/llm/llm-deepseek/src/adapter.ts:120`,默认 base URL 见 `config.ts:106`)。协议可以不同,消息词汇是自有的中立词汇表——适配器负责把中立词汇翻译成 wire 协议(第 3 章对照)。
- **适配器是一个可替换的接缝**。真实实现把"怎么调模型"抽象成 `LlmAdapter` 基类,且只有 `stream()` 一个方法必须实现(`packages/llm/llm/src/index.ts:208-291`),按 provider 名字注册在 `ctx.llm` 上。第 9 章讲插件化时会回到这个设计。

## 练习

1. 把 system 提示词改成"用表格回答所有问题",观察行为变化——体会 system 的杠杆作用。
2. 打印每轮请求发出的完整 `messages` JSON,亲眼确认"整个历史每次都发过去"。
3. (思考)如果两个用户共用同一个进程,你应该怎么组织 `messages`?——这就是"会话"概念(第 6 章)的动机。

## 本章留下的问题

模型只会"说话",不会"做事":它不能读你的文件、不能跑命令。下一章给它手和脚——工具调用,agent 循环就此诞生。
