---
title: "从 0 开始实现一个 Coding Agent · 第 10 章：系统提示词与运行时上下文"
description: "section 汇编、上下文快照 + replace 刷新。"
publishDate: 2026-10-02T20:30:00
tags: ["教程", "agent"]
---

# 第 10 章 · 系统提示词与运行时上下文

> 对应代码:[code/mini-agent/prompt.ts](code/mini-agent/prompt.ts) + `agent.ts` 的 `refreshRuntimeContext`

## 学习目标

- 把"一段写死的 system 字符串"升级为**section 汇编**:身份、工具规则、环境信息各自独立维护。
- 理解会"过期"的信息(时间、cwd)该怎么进上下文:**运行时上下文快照 + 原地 replace**,而不是每轮追加。
- 认识真实 harness 的一个关键决策:**system 提示词就是历史里的 system 节点,而不是请求的独立字段**。

## 概念:提示词是装配出来的,环境是会过期的

到此为止 mini-agent 的 system 提示词是 `main.ts` 里一段手拼字符串。它有两个工程问题:

**问题一:不可组合。** 身份设定、工具使用规则、环境信息搅在一起,任何插件想贡献一段提示词都得改这一处。真实 harness 的做法:提示词由多个 **section** 汇编而成,每个 section 由自己的提供者维护,汇编结果再渲染成完整文本。

**问题二:会过期。** "当前时间"写进 system 一次,聊一小时后就是错的。重新 append 一条?历史每轮膨胀一条。真实解法很优雅:**运行时上下文以 user 角色的快照进入历史;内容变了就以 surface replace 原地替换那个节点**——历史长度不变,信息永远新鲜。这是第 6 章 replace 机制的第二个用途。

## 代码

**section 汇编**([prompt.ts](code/mini-agent/prompt.ts),完整文件):

```ts
export interface PromptSection {
  id: string
  text: string
}

// 汇编:按顺序拼接非空 section,空行分隔。
export function renderPrompt(sections: PromptSection[]): string {
  return sections.map((section) => section.text.trim()).filter((text) => text.length > 0).join('\n\n')
}
```

`identitySection` / `toolRulesSection` / `runtimeContextSection` 各管一段;`todoSection(session)` 是最有意思的一个——它从**会话日志**重建任务清单并注入提示词,`--resume` 之后模型立刻知道"做到哪一步了"(第 4 章 todo 机制与第 6 章日志原则在此闭环):

```ts
export function todoSection(session: Session): PromptSection | null {
  const todos = currentTodos(session)
  if (todos.length === 0) return null
  return { id: 'todos', text: `当前任务清单(恢复自会话日志,继续完成即可):\n${renderTodoList(todos)}` }
}
```

**运行时上下文刷新**(`agent.ts`):每轮开始,与历史中最后一次快照比较,变了才动手:

```ts
private refreshRuntimeContext(): void {
  const { session, runtimeContext } = this.options
  if (runtimeContext === undefined) return
  const text = `${RUNTIME_CONTEXT_TAG}\n${runtimeContext()}`
  const nodes = session.deriveNodes()
  const last = [...nodes].reverse().find((node) =>
    typeof node.message.content === 'string' && node.message.content.startsWith(RUNTIME_CONTEXT_TAG))
  if (last !== undefined && last.message.content === text) return
  session.append('user/message', { message: { role: 'user', content: text } },
    last !== undefined ? { surfaceOp: { op: 'replace', startSeq: last.seq, endSeq: last.seq } } : {})
}
```

**main.ts 组装**:section 列表交给 `renderPrompt`,运行时上下文以函数注入(每轮调用取新值):

```ts
const sections = [identitySection(), toolRulesSection(), runtimeContextSection()]
const todos = todoSection(session)
if (todos !== null) sections.push(todos)
const agent = new Agent({
  systemPrompt: renderPrompt(sections),
  runtimeContext: () => runtimeContextSection().text,
  ...
})
```

运行后看日志,你会发现第一轮是 `[system, runtime-context 快照, 用户输入, ...]`,之后每轮快照**原地更新**(事件 seq 换了,历史位置不动)。

## 设计要点与坑

- **快照是 user 角色,不是 system**。它是"交给模型的环境事实",语义上属于对话数据;真正的 system(身份与规则)仍由 system 节点承担。混用会让"程序的规则"和"环境的状态"失去边界。
- **replace 是幂等的关键**。同内容跳过、变了才替换,保证连续多轮不产生重复快照。
- **压缩与快照的相互作用**:压缩的 replace 区间可能把旧快照"压掉"——没关系,下一轮 refresh 发现历史里没有快照,会重新 append。每个机制都为其它机制的失误兜底,这正是"日志是唯一事实源"的红利。

## 对照 DeepSeek Harness

- **section 汇编是服务**:`ctx.systemPrompt.assemble(...)` 经 `system-prompt/assemble` 瀑布汇集各插件贡献的 sections、contexts 与工具 schema,再 `renderPrompt()` 渲染(`packages/core/system-prompt/src/index.ts:558`;调用点在 `agent-loop/src/agent.ts` 的 pre-step)。教程的 `PromptSection[]` 就是它的最小形。
- **请求里没有 system 字段**。真实实现的 wire 请求头(`EpochHeader`)根本没有 `system` 位置——system 提示词就是历史里的 `system/message` surface 节点(`packages/core/session/src/types.ts:247` 起;决策记录 `.agents/notes/implemented/architecture/2026-09-02-system-prompt-as-surface-node.md`)。支持"历史内更新"的路由把变更后的提示词追加为新 system 节点;不支持的路由用 replace 把首个系统节点改写为新文本。教程只实现了"首个节点 + 快照 replace"这一档。
- **运行时上下文 = user 快照**:动态上下文(时间、cwd 等)作为 `source: { kind: 'runtime-context' }` 的 user 消息快照追加(`packages/core/agent-loop/src/runtime-context.ts:152-163`),与教程的 `[runtime-context]` 快照同构。
- **能力声明决定刷新方式**:路由通过 `prepareCall` 声明自己是否支持 `systemPromptUpdate: 'in-history'`,循环据此选择"追加新 system 节点"还是"改写首节点"——教程没有路由概念,所以只有一种策略。

## 练习

1. 给 prompt.ts 加一个 `workspaceSection()`:列出生效的权限模式与沙箱模式,让模型知道自己"有多大权限"。
2. 把 `runtimeContextSection` 的时间粒度改成秒,连跑两轮,观察 replace 是否如预期触发(提示:两轮之间时间必然变了)。
3. (思考)为什么 todo 状态不直接存在一个 `todos.json` 文件里,而要从日志重建?两个候选答案:崩溃一致性;fork 子代理时清单跟随会话走。还有别的吗?

## 本章留下的问题

功能越来越多了,每改一处都要"跑一次真的"才能确认没坏——贵、慢、不可复现。最后一章:让整个 agent 离线可测。
