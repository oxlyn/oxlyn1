---
title: "从 0 开始实现一个 Coding Agent · 第 11 章：离线测试与回放"
description: "mock 模型、日志断言、样例日志，全程不联网。"
publishDate: 2026-09-04T09:00:00
tags: ["教程", "agent"]
---

# 第 11 章 · 离线测试与回放:agent 怎么测

> 对应代码:[code/mini-agent-test/](code/mini-agent-test/)(mock-llm.ts、test-offline.ts、record-sample.ts)

## 学习目标

- 用**脚本化 mock 模型**离线跑通完整的 agent 循环:真的日志、真的工具、假的模型。
- 学会把断言落在**会话日志**上——"日志是唯一事实源"让离线断言成为可能。
- 理解真实仓库的回放测试哲学:提交的会话日志既是回放输入,又是期望输出。

## 概念:测 agent 难在哪

Agent 的行为 = 模型决策 + 工具效果 + 时间,三样都不确定:每次跑都花钱、结果不同、有真实副作用。直接"跑真的"当测试,又贵又飘。

出路是把不确定性拆开:

```text
不确定的:模型的输出          → 用脚本回放(StreamChunk 序列)
确定的:  循环、工具、日志、投影 → 用真的
断言落在:会话日志(事实,已持久化)
```

关键认识:**对循环来说,LLM 服务只是一个接口**。第 3 章做了 adapter seam,第 9 章把 llm 做成了插件——现在回报来了:换掉一个实现,整个 agent 就离线了。如果当初循环里写死了 `fetch`,今天就无从下手。

## 代码

**假模型**([mock-llm.ts](code/mini-agent-test/mock-llm.ts),完整文件):与真实 `LlmService` 同形,内部是一个脚本队列——每次请求弹出一步,把回放的 StreamChunk 逐个 yield 出去;步骤用尽再被调用就报错(fail loud,测试悄悄空转比失败更糟):

```ts
export function toolCallStep(id: string, name: string, args: unknown): StreamChunk[] {
  const argsJson = JSON.stringify(args)
  const half = Math.floor(argsJson.length / 2)
  return [
    { type: 'tool-call-delta', index: 0, id, name, argumentsDelta: argsJson.slice(0, half) },
    { type: 'tool-call-delta', index: 0, argumentsDelta: argsJson.slice(half) }, // 参数分帧到达!
    { type: 'usage', usage: { inputTokens: 120, outputTokens: 20 } },
    { type: 'finish', reason: 'tool-calls' },
  ]
}
```

注意 `toolCallStep` 刻意把参数 JSON **拆成两帧**——真实流就是这样的,组装器(第 3 章)必须在测试里被真实地 exercising。

**离线测试**([test-offline.ts](code/mini-agent-test/test-offline.ts)):组合 = 真会话插件 + mock llm 插件 + 真工具 + 真循环;断言落在日志上:

```ts
const llm = new MockLlm([
  toolCallStep('c1', 'read_file', { file_path: join(dir, 'src', 'hello.ts') }),
  textStep('文件定义了 answer = 42,共 1 行。'),
])
const { ctx, session } = await boot(sessionPath, llm) // mock 只替换 llm 插件,其余全是真插件
const result = await ctx.get<AgentService>('agent').runTurn('看看 src/hello.ts 里有什么')

check('turn 以 completed 收束', result.reason === 'completed')
check('真工具读到真文件(结果含文件内容)', eventsOf(session).some((event) =>
  event.type === 'tool/result' && JSON.stringify(event.data).includes('answer = 42')))
check('usage 落账到 assistant/message', eventsOf(session).some((event) =>
  event.type === 'assistant/message' && event.data.usage?.outputTokens === 10))
```

三个场景覆盖三条关键路径:**正常工具往返**、**resume 后前缀稳定**(重放恢复的历史与打开时逐字一致,日志只追加)、**工具失败自愈**(isError 结果进入日志且模型仍正常收束)。

**样例日志生成**([record-sample.ts](code/mini-agent-test/record-sample.ts)):跑一个含 `todo_write` + `read_file` 的脚本,把产生的会话日志存为 [code/examples/session.sample.jsonl](code/examples/session.sample.jsonl)——这就是第 6/7 章可以"逐行看"的实物,离线可复现:

```sh
node --experimental-strip-types record-sample.ts   # 每次重新生成完整样例
```

读这份日志的钥匙:`seq: 0` 是 header;`tool/call` 与 `tool/result` 靠 `callId` / `sourceEventSeqs` 配对;`turn/end` 的 `reason` 说明收束方式;全程 11 个事件就是一次完整 turn 的全部事实。

## 设计要点与坑

- **mock 不许"聪明"**。脚本顺序错了测试就该挂——如果 mock 开始"理解"消息再决定回什么,你测的就不再是循环而是 mock。
- **断言打在日志上,不打在 stdout 上**。日志是持久化事实;控制台输出是 UI 细节,随时会改。
- **离线测试不是模型行为的测试**。它验证"给定模型输出,机制正确";模型决策对不对,需要真实评测(evals)——那是另一个学科,真实仓库用快照回放 + 真实 e2e 分层覆盖。

## 对照 DeepSeek Harness

- **提交的日志既是输入又是期望**:`snapshots/` 下的快照测试,每个场景的 committed session JSONL 就是回放输入,持久化结果就是期望输出(`snapshots/AGENTS.md`);`pnpm run test:snapshot` **无密钥**回放已录制的会话。教程的 mock 脚本 + 日志断言是同一思想的最小形。
- **录制物是"规范化的不动点"**:快照日志里的易变身份(随机 id、时间戳)被替换为保持关系的类型化 token,请求里的 system prompt 与工具 schema 也替换为 token 引用——否则每次录制都会产生无意义 diff。教程的 mock 天然稳定,无需这一步;写"录制型"测试时这是必修课。
- **录制权是独占的**:只有 owner 能 record/refresh 自己的会话角色,历史代不被重写(第 6 章不可变原则在测试设施上的延伸)。
- **测试分层**:`docs/testing.md` 的政策——单测覆盖机制、快照回放覆盖会话级行为、真实 e2e(`test:e2e`,有 key 才跑)覆盖 provider 集成。教程的 test-session(第 6 章)与 test-offline(本章)对应第一层与第二层。

## 毕业练习

1. 给 test-offline 加一个场景:mock 在参数 JSON 中间截断(`finish: 'length'`),断言循环收束为 max-tokens 且历史里没有悬空调用。
2. 把场景 2 改成"压缩后 resume":手工往日志里塞一段压缩事件,断言重放后的历史以摘要开头。
3. (终极)为自己的一个真实会话写"回放版"测试:从 `.mini-agent/sessions/` 挑一份日志,把其中的 assistant 消息逐条转成 mock 脚本,断言重放产生同构的日志。

## 全书完

十一章走完:一次调用 → 循环 → 流式 → 工具 → 权限 → 日志 → 压缩 → 子代理 → 插件 → 提示词 → 测试。接下来最好的下一步,是回到 [README[/posts/agent-from-scratch/README/] 的"学完之后",打开真实仓库亲手加一个工具。
