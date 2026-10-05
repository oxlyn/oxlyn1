---
title: "从 0 开始实现一个 Coding Agent · 第 9 章：插件化架构"
description: "服务注册、可逆注册、waterfall 事件，对照 cordis 插件内核。"
publishDate: 2026-10-01T20:30:00
tags: ["教程", "agent"]
---

# 第 9 章 · 插件化:没有特权核心的架构

> 对应代码:[code/mini-agent-plugin/](code/mini-agent-plugin/)(kernel.ts + plugins.ts + loop.ts + main.ts)

## 学习目标

- 用 100 行写出一个插件内核:**服务注册**(provide/inject)、**可逆注册**(effect)、**事件扩展点**(on/emit 与 waterfall)。
- 把前八章的每个能力重组成插件,让循环不再 import 任何具体能力。
- 理解 capability seam 的三个角色:Service Definition / Service Provider / Consumer。

## 概念:为什么最后一章是架构

第 8 章结束时的 mini-agent 功能完整,但结构是"循环认识一切":

```text
agent.ts ──import──▶ tools.ts ──import──▶ permissions.ts
   │ import──▶ compaction.ts ──import──▶ llm.ts
   └ import──▶ session.ts
```

想给所有工具执行加个计时?改循环。想换掉压缩策略?改循环。想做一个"无人值守"变体?把权限逻辑从循环里抠出来。每一处演进都在改同一份代码——**特权核心**是大自然的熵增加速器。

插件化的做法:循环只暴露"在哪些时刻做决策",其余一切变成旁边挂上来的监听者与服务的提供者:

```text
                  ┌── permissions 插件:监听 tools/pre-execute
agent-loop 插件 ──┼── compaction 插件:监听 agent/pre-step
  (只管流程)     ├── tools 插件:提供工具注册表
                  ├── session 插件:提供日志服务
                  └── audit 插件:监听 tools/execute(计时)—— 新增能力,零改动
```

## 内核:三个原语

完整实现见 [kernel.ts](code/mini-agent-plugin/kernel.ts)(约 110 行)。接口:

```ts
export interface Context {
  provide<T>(name: string, service: T): Disposer          // 注册服务
  get<T>(name: string): T                                 // 取服务;缺失即抛错(fail loud)
  effect(dispose: Disposer): Disposer                     // 可逆注册:一切注册返回 disposer
  on<T>(event: string, listener: (payload: T) => ...): Disposer        // 串行广播
  onWaterfall<TIn, TOut>(event: string, listener: (p, next) => ...): Disposer // 环绕链
  emit(event: string, payload: unknown): Promise<void>
  waterfall<TIn, TOut>(event, payload, fallback): Promise<TOut>
  teardown(): void                                        // 逆序回卷全部注册
}
```

**waterfall 是"环绕"语义**,这是最容易写错的部分:监听者拿到 `(payload, next)`;调用 `next(payload)` 委托给链上的下一个监听者,最后一个 `next` 才落到内建行为(fallback);**不调用 `next()` 就是短路并取代内建行为**:

```ts
async waterfall<TIn, TOut>(event, payload, fallback): Promise<TOut> {
  const chain = [...(this.waterfalls.get(event) ?? [])]
  const next = (current: TIn): Promise<TOut> => {
    const listener = chain.shift()
    if (listener === undefined) return fallback(current)
    return listener(current, next)
  }
  return next(payload)
}
```

**装载顺序由依赖驱动**,不由排列顺序:`createApp` 反复挑出"inject 依赖已全部就绪"的插件安装,一轮下来一个都装不上就报错——**绝不静默跳过**。这排除了"把 permissions 插件放在 loop 后面就失效"这类顺序 bug。

## 能力变插件

[plugins.ts](code/mini-agent-plugin/plugins.ts) 把第 4–7 章的能力逐一重写。感受一下质变:

- **权限**(第 5 章)不再是循环里的一次调用,而是一个 `tools/pre-execute` 监听者——allow 时 `next()` 放行,deny 时不调 `next()` 直接短路:
- **压缩**(第 7 章)只是 `agent/pre-step` 的监听者:循环每次请求前广播这个事件,压缩插件决定做什么,循环毫不知情。
- **工具**(第 4 章)从写死的数组变成注册表服务,`register` 返回 disposer——插件卸载,工具随之消失。

**agent-loop 插件**([loop.ts](code/mini-agent-plugin/loop.ts))是同一个第 2 章骨架,只是决策点全部改走事件。对比它的工具调度:

```ts
// 决策权完全在事件链上,fallback 是"允许"——具体策略全部由插件注入。
const decision = await ctx.waterfall<ToolExec, Decision>('tools/pre-execute', exec, async () => ({ kind: 'allow' }))
if (decision.kind !== 'allow') return deny(decision.reason)

const content = await ctx.waterfall<ToolExec, string>('tools/execute', exec, () => tool.run(exec.args))
session.append('tool/result', { message: { role: 'tool', tool_call_id: call.id, content } }, { sourceEventSeqs: [callSeq] })
void ctx.emit('tool/result', { callId: call.id, tool: tool.name, content })
```

注意 fallback 是 `{ kind: 'allow' }`:**循环对权限一无所知**,没有权限插件时管线照常跑;插件插上来才有策略。

## 组装与第三方扩展

[main.ts](code/mini-agent-plugin/main.ts) 的全部组装逻辑:

```ts
const ctx = await createApp([
  sessionPlugin, llmPlugin, toolsPlugin, permissionsPlugin, compactionPlugin,
  agentLoopPlugin,
  auditPlugin, // ← "第三方":只监听事件就给所有工具执行加了计时
])
const agent = ctx.get<AgentService>('agent')
```

`auditPlugin` 全文十行,不改任何现有代码——这就是插件架构的意义:**扩展 = 挂一个新插件,而不是改核心**。

## 对照 DeepSeek Harness

到这里,你已经亲手重演了整个仓库的骨架,对照终于变成"同一件事的两种规模":

- **内核是真的**。vendor 的 Cordis 框架(`vendor/cordis/src`)就是这个内核的生产版:waterfall 的环绕实现与教程逐行同构(`vendor/cordis/src/events.ts:234-243`,含"最后一个 `next()` 落到内建行为");`ctx.effect` 的可逆注册(`fiber.ts:363`);服务随插件卸载自动注销(`service.ts:42-59`)。
- **插件形状的约定**。仓库约定命名导出 `name / inject / Config / apply`(`packages/subagent/tool-subagent/src/index.ts:44-45`),最小插件就是"一个 `apply(ctx)` 函数 + cordis.yml 一行"(`docs/cordis-tutorial/01-first-plugin.md:11-29`)。
- **一切皆插件,包括循环本身**。`agent-loop` 是服务(`ctx.agentLoop`),`tools` 注册表是服务(`ctx.tools`),LLM 适配器注册在 `ctx.llm`——`docs/architecture.md` 的"Core packages"表就是一张"服务清单"。没有特权核心:扩展 = 在旁边挂插件。
- **capability seam 三角色**。一个可替换的能力接缝 = **Service Definition**(声明接口,如 `LlmAdapter`、`SessionPersistence`)+ **Service Provider**(实现,如 DeepSeek 适配器、JSONL 后端)+ **Consumer**(使用者,如 agent-loop)。包可以兼任多角色,但只有一角不成接缝(`docs/architecture.md` "Capability seams")。第 3 章的"换 provider 只改路由"、第 4 章的"沙箱后端换平台",靠的都是这个结构。
- **配置即组装**。真实发行版用 profile(预设的插件清单)+ 有序 patch 文件组合出 `web / headless / sdk / acp` 等形态(`docs/architecture.md` "Profiles and bundles")——教程 `main.ts` 里的插件数组,加上"按 id 替换任意一行配置"的能力,就是它。
- **扩展点地图**。`docs/architecture.md` 末尾的表(Goal → Mechanism)列出了所有官方扩展点:加模型 provider 注册 `ctx.llm`、加工具注册 `ctx.tools`、拦请求用 `agent/*` 事件、存会话实现 `SessionPersistence`……你在这本书里练过的每一个接缝,都能在那张表上找到真实对应物。

## 毕业练习

1. 把第 8 章的子代理工具注册进插件工程(提示:子代理需要一个新的"restricted 组合"——它自己也是一个 `createApp`,只是插件清单更短)。
2. 写一个 `deny-list` 插件:监听 `tools/pre-execute`,拒绝命令里含 `sudo` 的 bash 调用。验证它与 permissions 插件的相对顺序如何影响裁决(体会"先注册者在最外层"与 monotonic guard 的差别)。
3. 给 kernel 的 `teardown()` 写一个测试:安装三个互相注册资源的插件,断言 disposer 以逆序执行。
4. 终极:读 `docs/architecture.md` 的 Turn flow 图,对照你写的 loop.ts,找出至少三处"你的循环有、真实循环也有"的机制和三处"真实循环有、你没有"的机制(提示:attempt 重试、request/header、inbox 与 next-step 输入)。

## 全书回顾

九章,一条线:

| 章 | 增加的能力 | mini-agent 中的模块 |
|---|---|---|
| 1 | 一次模型调用 + 多轮对话 | `code/01-chat.ts` |
| 2 | 工具调用 + agent 循环 | `code/02-agent-loop.ts` |
| 3 | 流式输出 + 统一事件词汇 | `code/03-streaming.ts` |
| 4 | 真实工具(bash/读写改) | `mini-agent/tools.ts` |
| 5 | 权限门与 fail-closed | `mini-agent/permissions.ts` |
| 6 | append-only 会话日志 + 投影 + 恢复 | `mini-agent/session.ts` |
| 7 | 上下文压缩 | `mini-agent/compaction.ts` |
| 8 | 子代理委托 | `mini-agent/subagent.ts` |
| 9 | 插件化重组 | `mini-agent-plugin/` |

(第 10、11 章为进阶篇:系统提示词与运行时上下文、离线测试与回放;术语速查见[附录[/posts/agent-from-scratch/appendix-glossary/]。)

贯穿全书的五条设计原则,同样刻在 DeepSeek Harness 的每一行代码里:

1. **model-visible ⟺ logged**:模型看到的一切必须能从日志重建。
2. **日志只追加**:改写历史 = 投影 replace,原文永不删除。
3. **fail-closed**:审批、沙箱、未知工具、坏渠道——拿不准就拒绝。
4. **策略外挂**:工具本体零权限代码;行为 = 事件监听者的组合。
5. **显式 > 隐式**:缺依赖、缺服务、缺渠道,宁可报错也不静默给默认。
