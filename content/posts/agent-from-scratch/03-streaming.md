---
title: "从 0 开始实现一个 Coding Agent · 第 3 章：流式输出"
description: "SSE 解析、统一事件词汇、组装器，对照 StreamChunk / BlockAssembler。"
publishDate: 2026-08-27T09:00:00
tags: ["教程", "agent"]
---

# 第 3 章 · 流式输出:SSE、统一事件词汇与组装器

> 对应代码:[code/03-streaming.ts](code/03-streaming.ts)(约 230 行,零依赖)

## 学习目标

- 手写 SSE 解析,理解 `data:` 帧与 `[DONE]` 终止符。
- 把 wire 协议的增量碎片翻译成一组**统一的事件词汇**(text-delta / tool-call-delta / usage / finish)。
- 写一个**组装器**,把事件流拼回一条可入历史的完整消息——尤其是工具调用参数的分段拼接。

## 概念:三层结构

流式不是"把打印语句加进去"那么简单。工程上它分三层,每层职责单一,这也是真实 harness 的分层:

```text
HTTP/SSE 字节流 ──解析──▶ 增量事件(StreamChunk)──组装──▶ 完整消息
```

1. **解析层**:读响应体,按行剥出 `data:` 载荷,处理分包(一个 SSE 帧可能被切成两次网络读)。
2. **词汇层**:把协议特有的字段(`choices[0].delta.content` 等)翻译成中立事件。上层代码从此不认识任何具体协议。
3. **组装层**:把事件流折叠回 `{ role, content, tool_calls }` 的完整消息。只有组装结果才进入历史。

## 关键代码

**SSE 解析器**。要点:网络分包随时可能把一行切成两半,所以维护一个 `buffer`,`indexOf('\n')` 逐行消费,剩余的留给下一轮:

```ts
async function* sseData(res: Response): AsyncIterable<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let newline = buffer.indexOf('\n')
    while (newline >= 0) {
      const line = buffer.slice(0, newline).replace(/\r$/, '')
      buffer = buffer.slice(newline + 1)
      if (line.startsWith('data:')) yield line.slice(5).trim()
      newline = buffer.indexOf('\n')
    }
  }
}
```

**事件词汇**。这是本章真正的主角——一组中立的、协议无关的流事件:

```ts
type StreamChunk =
  | { type: 'text-delta'; text: string }
  | { type: 'tool-call-delta'; index: number; id?: string; name?: string; argumentsDelta: string }
  | { type: 'usage'; usage: Usage }
  | { type: 'finish'; reason: 'stop' | 'tool-calls' | 'length' | 'error' }
```

**工具调用参数的拼接**。流式下,一次工具调用被拆成很多帧:第一帧带 `id` 和 `name`,后续帧只带 `index` 和一小段 `arguments` 增量。按 `index` 聚拢、逐段累加,`finish` 到来时得到完整 JSON 字符串:

```ts
case 'tool-call-delta': {
  const call = calls.get(chunk.index) ?? { id: '', name: '', arguments: '' }
  if (chunk.id !== undefined) call.id = chunk.id
  if (chunk.name !== undefined) call.name = chunk.name
  call.arguments += chunk.argumentsDelta
  calls.set(chunk.index, call)
  break
}
```

**组装器**遍历全部事件,产出完整消息。循环(第 2 章)从此改为:先收集事件 → 组装 → 推历史,流式只是"边收集边给用户看"的副作用。这个顺序很重要:**历史里只进完整消息,不进碎片**。

运行:

```sh
DEEPSEEK_API_KEY=sk-... node --experimental-strip-types 03-streaming.ts
```

## 设计要点与坑

- **不要把协议类型泄漏到上层**。如果循环代码里出现 `choices[0].delta`,你就被这个协议绑架了。词汇层是留给"换模型厂商"的保险。
- **`finish_reason: 'length'` 要当回事**。它意味着输出被 max-tokens 截断——如果截断发生在一个工具调用的参数中间,那条调用就是废的,组装器应丢弃不完整调用,循环要把本轮标记为"因长度收束",否则下一轮 API 会因为"调用没有配对结果"拒绝请求。本章代码已处理:`assemble` 过滤参数没收完的调用,循环在 `length` 时收束本轮并告警。
- **usage 也要流式拿**(OpenAI 兼容协议用 `stream_options: { include_usage: true }`,在最后一个 chunk 上送达)。没有它,你无法做第 7 章的上下文预算。

## 对照 DeepSeek Harness

- **事件词汇几乎同名**。真实实现的 `StreamChunk` 是七种事件的闭式联合:`block-start / text-delta / reasoning-delta / tool-call-delta / block-end / usage / finish`(`packages/llm/llm/src/types.ts:452-464`)。教程版少了 `block-start/block-end`——那是因为真实消息由 ContentBlock 组成,流按"块"开合;理解了本章的 `index` 聚拢,就理解了块机制的一半。
- **组装器是同一个算法**。`BlockAssembler` 按 index 聚拢增量、`block-end` 权威收口、max-tokens 时丢弃未完成的 tool call(`packages/llm/llm/src/assembler.ts:69-76, 135-141`)。你刚写的就是它的简化版。
- **SSE 解析不手写**。仓库用 `eventsource-parser/stream` 的 `EventSourceParserStream` pipe 解帧(`packages/llm/llm-deepseek/src/sse.ts:13-28`),并校验 SSE event 名与帧内 `event.type` 一致;error 帧统一转成结构化的 provider 错误(AUTH/RATE_LIMIT/CONTEXT_WINDOW_EXCEEDED 等,`transport.ts:22-44`)。教程手写一遍是为了看清它只是"按行切 data:",生产实现换成解析器库即可。
- **失败与重试是一等公民**。真实实现把一次流封装成 attempt:失败时先把已收到的碎片作为 `assistant/attempt` 落账(仅日志、不进历史),再触发 `agent/request-error` 瀑布;重试插件 `llm-retry` 按策略指数退避(`packages/llm/llm-retry/src/index.ts:59`),且重试复用同一次已渲染的请求,不重复提交用户消息。教程的 `llm.ts` 现在有一个最小版:只重试**流开始前**的 429/5xx 与网络错误(指数退避 + 抖动),流开始后的失败不重试——已展示给用户的增量无法撤销。
- **取消时保留用户已看到的内容**。用户按 Ctrl+C 打断流,已到达的前缀会以 `interrupted: true` 的 assistant 消息持久化(`packages/core/agent-loop/src/agent.ts:448-465`)——"用户看到过的,必须留下",这是模型可见性与 UI 一致性的要求。

## 练习

1. 在词汇层加一种新事件 `reasoning-delta`(deepseek-reasoner 模型的 `delta.reasoning_content` 字段),组装器忽略它、UI 把它打成灰色——体验"词汇层隔离协议"的好处。
2. 故意在组装后丢弃 `finish_reason`,然后让模型生成一个超长工具调用,观察第 2 章的循环如何死掉。
3. (思考)如果两个工具调用的帧交错到达(`index: 0` 与 `index: 1` 交替),你的组装器还能工作吗?

## 本章留下的问题

现在 agent 能跑、能看、能干活了,但它手里只有一把"跑命令"的锤子。下一章给它一套真正的工具:带行号的读、防误伤的写、唯一性校验的编辑,以及一个像样的 bash 执行器(超时、截断、退出码)。
