---
title: "从 0 开始实现一个 Coding Agent · 第 7 章：上下文压缩"
description: "阈值、缓存友好摘要、replace 投影，对照 compaction-basic 与 token-meter。"
publishDate: 2026-09-29T20:30:00
tags: ["教程", "agent"]
---

# 第 7 章 · 上下文压缩:阈值、缓存友好摘要与历史替换

> 对应代码:[code/mini-agent/compaction.ts](code/mini-agent/compaction.ts);replace 折叠机制在第 6 章已就位

## 学习目标

- 实现"压力触发 → 保留尾部 → 摘要头部 → replace 投影"的完整压缩闭环。
- 学会一个巧妙的省钱技巧:**摘要请求复用会话自身前缀**,让 provider 的前缀缓存命中。
- 理解压缩为什么必须是"投影改写 + 日志原样",以及两个触发点(压力、超限重试)。

## 概念:什么时候压,压什么

两个触发点:

1. **压力触发**:每个 step 之间,估算当前模型历史的 token,超过阈值就压。阈值 = `min(contextWindow × thresholdRatio, contextWindow − 输出预留)`——默认 0.8 的窗口占比,再减去给模型输出留的余量。
2. **超限触发**:请求真的报了"上下文超限"错误,先压一轮(更激进的阈值),再重试同一个请求。这是兜底,不是日常。

压什么:**头部区间整体替换成一条摘要,尾部原样保留**。最近的对话是工作记忆,不能压;旧历史是背景知识,压成摘要足够。

## 关键代码

**token 估算**。教程版用 `JSON 字符数 / 4` 的粗估。它注定不准,但不准的代价只是"早压一点或晚压一点";真实实现聪明得多——以下一次"锚点"为准:provider 每次请求返回的真实 usage 是精确值,估算只负责两次请求之间的增量。

**摘要请求复用会话前缀**。这是本章最值得学的技巧:

```ts
// 摘要请求 = 会话自身的消息前缀 + 末尾一条指令
const summaryText = await chatOnce(
  [...nodes.map((node) => node.message), { role: 'user', content: SUMMARY_INSTRUCTION }],
  signal,
)
```

如果直接构造一个"全新请求"去总结,provider 的前缀缓存(KV cache)完全命不中,等于全价重算一遍几十 K token。而把"待总结的内容"原样作为前缀、只在末尾追加指令,缓存命中,摘要的边际成本几乎只有指令和输出本身。

**SUMMARY_INSTRUCTION 要求固定的 Markdown 检查点结构**(Primary Request / Key Technical Concepts / Files and Code / Errors and Fixes / Current Work / Next Step)——结构化摘要让模型恢复工作时第一眼就能定位"我做到哪一步了"。

**记账与替换**。压缩在日志里留下两个 log-only 事件,再用一条带 `surfaceOp: replace` 的 user 消息改写投影(第 6 章的机制在这里兑现):

```ts
session.append('compaction/start', { startSeq, endSeq, reason: 'pressure' })   // log-only
session.append('compaction/summary', { replacedTokens })                       // log-only
session.append('user/message', {
  message: {
    role: 'user',
    content: `<compacted-summary>\n${summaryText}\n</compacted-summary>\n\n(以上摘要是此前 ${keepFrom} 条消息的压缩记录,原始消息仍在会话日志中;请基于摘要与后续消息继续工作。)`,
  },
}, { surfaceOp: { op: 'replace', startSeq, endSeq } })
```

三个细节:

- **替换消息用 user 角色**(而不是 system):它语义上是"交给模型的交接记录",而且 system 节点被保留不参与压缩(提示词本体永远不动)。
- **用 `<compacted-summary>` 标签框住摘要**:模型能识别这是压缩产物,而不是用户突然说的一段话。
- **原始事件一个字节都没动**:审计、fork、debug 时,完整历史仍在文件里。

## 对照 DeepSeek Harness

- **触发点一致**:`packages/compaction/compaction-basic/src/index.ts:148-235` 在 `agent/pre-step`(每步之间)做压力检查,在 `agent/request-error`(provider 确认上下文超限)时先压再允许重试——教程的两个触发点就是从这里来的。
- **阈值公式**:`thresholdTokens = min(contextWindow × thresholdRatio(默认 0.8), contextWindow − reservedCompletionTokens − headroomTokens(默认 65536))`(`packages/compaction/compaction-basic/src/config.ts:191-194`);尾部保留比例 `retainRatio` 默认 0.16。教程的默认值与它对齐。
- **摘要器复用前缀 + 固定结构**:`summarizer.ts:26-67` 明确注释了"复用会话自身前缀使 provider 的 KV/prefix cache 命中";检查点小节(Primary Request / Errors and Fixes / Current Work / Next Step 等)与教程一致,并额外要求只保留文本块、拒绝图片输出。
- **替换的投影语义**:替换事件是一条带 `surfaceOp: { op: 'replace', startSeq, endSeq }` 的 user/message(`packages/compaction/compaction-basic/src/region.ts:506-509`),surface 折叠时 `splice` 影子化旧区间(`packages/core/session/src/surface.ts:576`)——与教程实现逐一对应。压缩事件本身 log-only(`packages/compaction/compaction/src/types.ts:24-72`)。
- **token 计数是 replay-aware 的**:`packages/llm/token-meter` 以最近一次成功调用的 provider usage 为锚点,对增量做启发式估算再按路由定价;被替换区间的"影子定价"由替换事件前的记账事件声明(`packages/compaction/compaction/src/types.ts:26-32`),保证压缩后的估算仍然连续。
- **压缩不止摘要一种手段**:真实实现还有更廉价的"剪枝"(如 tool-result pruner:先丢弃旧的工具结果原文再考虑摘要),教程的"一刀切摘要"是策略谱系里最重的那一档。

## 练习

1. 把 `retainRatio` 调到 0.5,观察摘要后的模型行为差异(尾部保留越多,连续性越好,成本越高)。
2. 实现一个更便宜的 `pruneToolResults`:只把 5 步以前的 `tool/result` 内容替换成 `(旧工具结果已清理)`,不动其它消息——比较它与全文摘要的效果与成本。
3. (思考)压缩发生在 step 之间。如果压缩恰好把"上一步刚调用的工具的结果"压掉了,会发生什么?真实实现为什么用"可压缩区间"来避免这个(`selectCompactableRange`)?

## 本章留下的问题

agent 已经能干活、能记账、能省钱了。但所有调查型任务都有同一个痛点:读 30 个文件的过程会把主对话的上下文塞满。下一章:子代理——派一个"只带结论回来"的分身。
