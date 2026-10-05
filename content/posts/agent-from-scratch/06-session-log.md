---
title: "从 0 开始实现一个 Coding Agent · 第 6 章：会话日志"
description: "append-only JSONL、投影推导、resume 与崩溃修复。"
publishDate: 2026-08-30T09:00:00
tags: ["教程", "agent"]
---

# 第 6 章 · 会话日志:append-only、投影推导与崩溃恢复

> 对应代码:[code/mini-agent/session.ts](code/mini-agent/session.ts);回归测试见本章"验证"一节

## 学习目标

- 把"内存里的 messages 数组"替换成**追加式事件日志**,让模型历史从日志**投影推导**。
- 实现 surface(模型可见)与 log-only(仅记账)两类事件,以及 `replace` 改写投影的机制(第 7 章压缩的地基)。
- 实现 resume:重放日志重建历史,并**自动修复**崩溃留下的悬空工具调用。

这是全书最重要的一章。前面所有章节的"消息数组"从此消失——它是所有一致性 bug 的根源。

## 概念:日志是唯一事实源

前面章节的模型历史 = 一个内存数组。它的死穴:

- 进程崩溃,数组没了,对话断了;
- 历史要被压缩改写(第 7 章)时,数组要原地变形,日志和数组迟早不一致;
- fork(复制一段历史开新会话)、转写、审计,都要从数组再抄一遍。

解法是把方向反过来:**程序只追加事件;模型历史任何时候都从事件流推导**。这就是"model-visible ⟺ logged"原则:凡是模型看得到的,必然在日志里;凡是日志里没有的,绝不许发给模型。

## 事件模型

信封三件套 + 可选的投影信息:

```ts
export type SessionEvent =
  | { seq: number; time: string; type: 'session/header'; data: { version: number; ...; delegationDepth: number } }
  | { seq: number; time: string; type: 'turn/start'; data: { turn: number } }
  | { seq: number; time: string; type: 'turn/end'; data: { turn: number; reason: TurnEndReason } }
  | { seq: number; time: string; type: 'system/message' | 'user/message'; data: { message: WireMessage }; surfaceOp?: SurfaceOp }
  | { seq: number; time: string; type: 'assistant/message'; data: { message: WireMessage; usage?: Usage; interrupted?: boolean } }
  | { seq: number; time: string; type: 'tool/call'; data: { callId: string; name: string; arguments: string } }
  | { seq: number; time: string; type: 'tool/result'; data: { message: WireMessage; isError?: boolean }; sourceEventSeqs?: number[] }
  | { seq: number; time: string; type: 'compaction/start' | 'compaction/summary'; data: ... }
```

四条规则:

1. **seq 单调连续**,打开时校验,跳号即损坏。
2. **只有四类 surface 事件**(system/user/assistant 消息、tool 结果)出现在模型历史里;`tool/call`、`turn/*`、`compaction/*` 是 **log-only 记账**,只留审计。(真实实现还有第五类 developer 消息。)
3. **surface 事件可携带 `surfaceOp`**:`append`(默认)或 `replace(startSeq, endSeq)`——replace 是"投影改写":旧事件仍在文件里,只是不再投影为模型可见历史。日志永不删改。
4. **`tool/result` 用 `sourceEventSeqs` 指回配对的 `tool/call`**,这是崩溃恢复能精确定位的钥匙。

落盘就是一个 JSONL 文件,每事件一行;第一行是 header(含格式版本号)。追加用同步 `appendFileSync`——教程版用吞吐换简单与崩溃安全(真实实现用异步缓冲 + 显式 flush 检查点)。

## 投影:fold 与 derive

```ts
private fold(event: SessionEvent): void {
  switch (event.type) {
    case 'system/message':
    case 'user/message':
    case 'tool/result': {
      const node = { seq: event.seq, message: event.data.message }
      if (event.surfaceOp?.op === 'replace') this.applyReplace(event.surfaceOp, node)
      else this.nodes.push(node)
      break
    }
    case 'assistant/message':
      this.nodes.push({ seq: event.seq, message: event.data.message })
      break
    default:
      break // log-only
  }
}
```

循环从此每次请求前 `session.deriveMessages()` 现场推导,不再持有平行数组。

## resume 与崩溃恢复

`Session.open` 的三步:读全部行并校验 seq 连续性与版本号(过新直接拒绝)→ 逐事件 fold → **修复悬空调用**:

```ts
repairInterruptedCalls(): void {
  // 找出所有"有 tool/call、无配对 tool/result"的调用,补一条 isError 占位结果
  for (const call of requested) {
    if (answered.has(call.callId)) continue
    this.append('tool/result', {
      message: {
        role: 'tool',
        tool_call_id: call.callId,
        content: 'Error: 上次运行在该调用产生结果前被中断,结果未知。只读或幂等操作可以重试;有副作用的操作请先核实状态。',
      },
      isError: true,
    }, { sourceEventSeqs: [call.seq] })
  }
}
```

为什么不回滚、不丢弃?"调用可能已经执行过了"——`rm` 也许已经发生。诚实的做法是留一条占位结果,明确告诉模型"结果未知,别盲目重试"。注意措辞区分(与真实 harness 相同):**已启动但结果未知**(只读/幂等才可重试)与**从未启动**(可重试)是两种不同的恢复码。

## 验证(不依赖 API,可直接跑)

[code/mini-agent/test-session.ts](code/mini-agent/test-session.ts) 用三个场景验证上述机制:落盘重放一致;悬空调用打开时自动补占位结果;replace 折叠后原始事件仍在文件里但不再投影:

```ts
const reopened = Session.open(path)                    // 与写入方 events 数量一致
reopened.deriveMessages().map((m) => m.role)           // system,user,assistant,tool
// 崩溃场景:tool/call 没有结果 → open 时补 1 条 tool/result
// 压缩场景:replace 后 deriveMessages 只剩 [system, 摘要],而 events.length 不变
```

```sh
node --experimental-strip-types test-session.ts   # 输出全 OK 即通过
```

运行 `--resume` 试试真实恢复:`Ctrl+C` 打断一次执行,再 `node main.ts --resume .mini-agent/sessions/<file>.jsonl`,日志原样接上。

## 对照 DeepSeek Harness

- **事件词汇**:`SessionEventMap` 声明了 `turn/start|end`、`step/start|end`、`system/developer/user/assistant/message`、`tool/call|result`、`request/header|context` 等核心事件(`packages/core/session/src/types.ts:281`),插件可用 declaration merging 增加自己的事件(第 7 章的压缩事件就是这么加的)。事件信封还有个 `ignorable: true` 标志:旧读者遇到不认识的事件,只有带这个标志的才可安全跳过——这是"加事件不升版本"的护栏。
- **格式版本与不可变历史代**:`SESSION_FORMAT_VERSION` 只在结构性变化时 bump(普通加事件不算);历史版本文件**永不改名、改写、删除**,迁移是"生成一个 vN+1 新文件"而不是原地升级(`packages/core/session/src/types.ts:89`;`packages/session/session-persistence-jsonl/src/generation.ts:946-1000`,发布用硬链接 + 原子可见性,`:833-843`)。文件名规则:`session.jsonl`(v0)→ `session.v4.jsonl[.zstd]`(`packages/session/session-format/src/filename.ts:14-17`)。教程的 `version > 当前就拒绝打开` 是同一原则的最低配。
- **投影推导 + 增量缓存**:`deriveMessages()` 不是每次全量重算,而是按 `surfaceOp` 维护增量投影、尾部 O(新节点)(`packages/core/session/src/index.ts:860-881`);消息深冻结,调用方拿到引用也改不了历史。
- **fork**:复制前缀 + 打 `session/end-seed` 切割标记 + 合成 open turn 的收尾事件(`packages/core/session/src/fork.ts:21-30`)。第 8 章的子代理会用到同样的思路。
- **恢复措辞**:两种恢复码 `TOOL_OUTCOME_UNKNOWN` / `TOOL_NOT_STARTED` 见 `packages/core/agent-loop/src/repair.ts:15-41`;step 内失败时的即时补账逻辑在 `agent.ts:342-353`。

## 练习

1. 实现 `fork(boundarySeq)`:复制前缀事件 + 补合成收尾,产出新会话文件。
2. 给信封加 `ignorable` 并在 `open` 时验证:未知事件类型若无 `ignorable` 标志则拒绝打开。
3. (思考)为什么 header 里的 `version` 过新要拒绝,过旧却允许(然后迁移)?两种方向的错误各意味着什么?

## 本章留下的问题

日志解决了一致性,但没解决成本:50 轮对话后,每次请求都把 50 轮全部重发,费用和延迟线性上涨,最后撞上上下文窗口。下一章:压缩——用 replace 投影,把旧历史换成一条摘要。
