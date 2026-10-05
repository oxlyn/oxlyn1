---
title: "从 0 开始实现一个 Coding Agent · 第 8 章：子代理"
description: "委托、三重隔离、深度预算，对照 subagent 与 tool-subagent。"
publishDate: 2026-09-01T09:00:00
tags: ["教程", "agent"]
---

# 第 8 章 · 子代理:隔离的委托

> 对应代码:[code/mini-agent/subagent.ts](code/mini-agent/subagent.ts)

## 学习目标

- 把"派一个子 agent"实现成一个普通工具(`spawn_subagent`),理解它为什么天然是工具而不是循环的特殊分支。
- 掌握隔离的三个维度:**会话隔离**(独立日志)、**工具隔离**(更小的工具集)、**权限钉死**(审批永远关闭)。
- 用深度预算防止"子生孙、孙生子孙"的递归失控。

## 概念:委托为什么是工具

父 agent 的上下文是稀缺资源。让它自己读 30 个文件,过程噪声(每个文件几千 token)会把工作记忆冲掉;正确的做法是把"过程"外包,只把"结论"收回来:

```text
父 agent ── prompt(一段自包含的任务)──▶ 子 agent(全新历史,只读工具)
父 agent ◀── 工具结果:子的最终结论文本 ── 子 agent
```

关键认识:**对父 agent 来说,子代理就是一个普通工具**——有名字、有描述、有参数 schema、返回文本。循环(第 2 章)不需要任何改动;特殊的是这个工具的 `run` 里跑了一个完整的 agent 循环。

## 关键代码

**深度预算写进会话 header**。子会话的 header 记录 `delegationDepth = 父的深度 + 1`,因此 resume 之后预算依然成立,不受进程重启影响:

```ts
if (options.depth + 1 > options.maxDepth) {
  return `Error: 子代理深度已达上限(${options.maxDepth}),不再派生`
}
const childSession = Session.create(filePath, options.depth + 1) // header 落账
```

**三重隔离**:

```ts
// 1) 工具隔离:子代理只拿只读工具
const childPolicy: PermissionPolicy = {
  mode: 'never',                                        // 3) 权限钉死:ask 一律自动拒
  allowBashPrefixes: [],
  readOnlyTools: READONLY_TOOLS.map((tool) => tool.name), // read_file / list_dir
}
const child = new ChildRunner(childSession, READONLY_TOOLS, childPolicy)
```

2) 会话隔离即 `Session.create`:子会话从空白历史开始,父对话的任何内容都不在它的事件流里;它知道的只有 prompt 里写明的部分。这既是隐私边界(父的上下文不外泄),也是成本边界(子的过程 token 不会回流父的历史)。

**结果回传**。子循环跑完,最终 assistant 文本就是父拿到的"工具结果";非正常结束(步数耗尽、报错)则把原因和**已产生的部分输出**一起带回,并标为错误——父可以决定重试、放弃或换个问法:

```ts
const { text, reason } = await child.runTurn()
if (reason !== 'completed') {
  return `Error: 子代理未正常结束(${reason}),以下是已产生的部分输出:\n${text}`
}
return text
```

**prompt 必须自包含**。子 agent 看不到父对话,所以工具描述里要明确教模型:"prompt 必须写清任务所需的一切(路径、目标、格式)"。这是工具 description 的职责——教模型正确使用约定。

## 对照 DeepSeek Harness

- **委托接口是一个显式 seam**:`SubagentProvider`(`packages/subagent/subagent/src/types.ts:344-373`)声明 `start(request)` 与可选的续接能力;请求里带 `prompt`、`parent`、可选的 `agentOptions / outputSchema / maxDepth / toolFilter / persona`。能力不满足在 start 前就拒绝(fail loud)。教程的"函数直接实现"是它的一个退化 provider。
- **隔离维度完全对应**:子会话元数据持久化 `parentSession`、`origin: 'subagent'`、`delegationDepth`(`packages/subagent/subagent/src/child-agent.ts:139-157`);深度检查在创建前(`:50-59`);每个子代理的 persona 与工具限制挂在**子自己的 scope** 上,父与兄弟不可见(`:200-219`);审批策略被钉死为 `'never'` 并以 `source: 'delegation'` 事件写进子的日志,使子代理的权限范围仅凭日志即可重建(`:249-280`)。
- **结果语义**:前台运行的收尾(`packages/subagent/tool-subagent/src/index.ts:208-224`)取子代理最后一条非空 assistant 消息作为输出;停止原因非 `completed` 时转为 isError 工具结果,但**仍附带诊断信息与部分输出**——和教程相同,失败不是一无所获。
- **组合隔离**:子代理运行在"父 preset + 固定委托声明文案"的组合里,工具列表可通过 `ctx.tools.restrict({ allow?, deny? })` 按名过滤。父上下文是否可见由 provider 决定:fresh 型不种父历史;fork 型用父日志前缀做种子(第 6 章练习 1 的 fork 在这里的真实用途)。
- **后台与续接**:真实实现支持 `run_in_background` 的一次性运行与可续接(continuable)运行,运行生命周期有 `subagent/start` / `subagent/end` 事件对。教程只实现前台一次性运行。

## 练习

1. 给 `spawn_subagent` 加一个 `focus` 参数(如 `"只关注错误处理"`),体会 persona 如何影响结论质量。
2. 实现并行委托:父的某个 step 里同时派两个子代理(`Promise.all`),观察结果按模型顺序回填的要求(第 2 章)如何与并发执行共存。
3. (思考)子代理失败时,"部分输出 + 错误说明"比"纯错误字符串"好在哪里?如果部分输出本身就是错的(子代理读错了文件),父 agent 需要什么信息才能不盲信它?

## 本章留下的问题

现在功能齐了:循环、工具、权限、日志、压缩、子代理。但这些能力是**硬编码**在一起的——循环 import 工具,工具 import 权限,权限 import 渠道。想给全部工具执行加个计时日志?你得改循环。下一章:插件化,让一切能力都变成"旁边挂上来"的插件。
