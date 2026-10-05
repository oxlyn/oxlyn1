---
title: "从 0 开始实现一个 Coding Agent · 第 2 章：Agent 循环"
description: "工具调用、while 循环、step/turn，对照 packages/core/agent-loop。"
publishDate: 2026-09-24T20:30:00
tags: ["教程", "agent"]
---

# 第 2 章 · Agent 循环:工具调用与 while 循环

> 对应代码:[code/02-agent-loop.ts](code/02-agent-loop.ts)(约 170 行,零依赖)

## 学习目标

- 写出 agent 的本体:一段"模型要工具就执行、把结果喂回去、直到模型不再要"的循环。
- 理解 function calling 的完整往返:声明 schema → 模型返回 `tool_calls` → 执行 → 以 `tool` 消息回填。
- 知道循环什么时候该停,以及"防失控"有哪些手段。

## 概念:agent 就是这段循环

模型本身不会执行任何东西。所谓工具调用,是一个约定:

1. 请求时附带一份工具清单(name + description + JSON Schema 参数);
2. 模型如果决定用某个工具,响应里不输出普通文本,而是输出结构化的 `tool_calls`;
3. **你的程序**(而不是模型)负责真正执行;
4. 执行结果作为 `role: "tool"` 的消息追加进历史,再次请求;
5. 模型看到结果后,要么继续要下一个工具,要么输出最终回答。

所以"agent"没有任何魔法,它就是这一段循环:

```ts
while (true) {
  const res = await chat(messages, tools)
  messages.push(res.message)
  if (res.message.tool_calls?.length) {
    for (const call of res.message.tool_calls) {
      const result = await execute(call)          // 3. 你来执行
      messages.push({ role: 'tool', tool_call_id: call.id, content: result })  // 4.
    }
    continue                                      // 5. 带着结果再问一次
  }
  break                                           // 模型不再要工具 → 本轮结束
}
```

两个术语贯穿全书(也是真实 harness 的术语):一次**step** = 一次模型请求加上它触发的工具执行;一个**turn** = 一轮用户输入引发的零或多个 step。

## 完整代码

见 [code/02-agent-loop.ts](code/02-agent-loop.ts)。核心部分解读:

**工具定义** = 名字 + 描述 + JSON Schema + 执行函数。描述和 schema 是给模型看的"使用说明书",写得越准,模型用得越对:

```ts
interface Tool {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema
  run: (args: Record<string, unknown>) => Promise<string>
}
```

**执行与回填**。注意三件事:参数是模型生成的 **JSON 字符串**,要自己 `JSON.parse` 且必须处理解析失败;找不到的工具名、执行抛错,都要把错误**作为工具结果**返回给模型(而不是让程序崩溃)——模型看到 `Error: ...` 会自己换办法;回填顺序必须与 `tool_calls` 一致,且每个 call 都要有配对结果,否则 API 直接拒绝请求:

```ts
for (const call of calls) {
  const tool = tools.find((candidate) => candidate.name === call.function.name)
  let result: string
  if (tool === undefined) {
    result = `Error: unknown tool ${call.function.name}`
  } else {
    try {
      const args = JSON.parse(call.function.arguments) as Record<string, unknown>
      result = await tool.run(args)
    } catch (error) {
      result = `Error: ${error instanceof Error ? error.message : String(error)}`
    }
  }
  messages.push({ role: 'tool', tool_call_id: call.id, content: result })
}
```

**保险丝**。教程版加了 `MAX_STEPS = 32` 防止失控烧钱。这是教学保险,不是行业惯例——见下面对照。

运行:

```sh
DEEPSEEK_API_KEY=sk-... node --experimental-strip-types 02-agent-loop.ts
```

试试:"列出当前目录的 markdown 文件,并统计总行数"。你会看到模型连续调用几次 `run_command`,最后汇总回答——这就是 agent。

## 设计要点与坑

- **错误也是信息**。把 `Error: 文件不存在` 喂回给模型,它会修正参数重试;把异常直接抛出程序,用户只能看到崩溃。让模型看见失败,是 agent 自我纠正的前提。
- **工具结果里要有机器可读的失败信号**。非零退出码不该被吞掉,真实 harness 用 `[exit code: N]` 这样的 marker 附在结果末尾,并在系统提示里教模型"注意检查 exit code marker"(第 4 章展开)。
- **循环结束条件要想清楚**。模型不再要工具、保险丝触发、用户取消——每一种都要有明确的收尾动作,而不是靠异常满天飞。

## 对照 DeepSeek Harness

- **没有步数硬上限**。真实 harness 的循环里搜不到 `maxSteps` 之类的计数器(`packages/core/agent-loop/src/agent.ts` 的 `kick()`/`turn()`/`step()` 三层驱动,252/296/398 行)。防失控靠三个设计:模型自然停机;工具结果可以声明 `concludesTurn: true` 数据化地收束本轮;`agent/turn-stopping` 检查点让外部在收尾前再注入一次输入或叫停。计数器是"不信任任何人的暴力解",机制化的收束才可组合。
- **历史不是内存数组**。教程版维护一个 `messages` 数组;真实实现的模型历史是**从会话日志投影推导**的(`session.deriveMessages()`,`packages/core/session/src/index.ts:860`),每次请求前重新派生。为什么?因为历史会被压缩改写、会话会崩溃重启、fork 需要切前缀——一个平行维护的数组迟早和日志不一致。第 6 章专门讲这个。
- **工具调用是两条日志事件,不是一条消息**。真实实现每次调用先落 `tool/call` 事件,结果以 `tool/result` 事件落账并用 `sourceEventSeqs: [callSeq]` 显式配对(`packages/core/agent-loop/src/tool-calls.ts:263-290`)。把"模型要求调用"和"结果产生"拆开记录,崩溃恢复时才能精确知道哪个调用没有结果(第 6 章的修复机制全靠它)。
- **step 失败会补写缺失的结果**。如果工具执行到一半进程崩了,下次打开会话时,合成一条 `isError` 的占位结果补进日志,措辞明确区分"已启动但结果未知"(只读操作才可重试)和"从未启动"(可重试)(`packages/core/agent-loop/src/repair.ts:15-41`)。教程版的 `Error: ...` 字符串就是它的雏形。

## 练习

1. 给工具清单加一个故意写错描述的 `read_file`,观察模型误用后如何靠错误信息自我纠正。
2. 把 `MAX_STEPS` 改成 2,体验保险丝触发时的收尾。
3. (思考)如果两个 `tool_calls` 互相独立,能不能并发执行?并发后"结果顺序与 calls 一致"要怎么保证?——mini-agent 的实现见 `mini-agent/agent.ts` 的 `runStep`:批次内**全部**并发安全的调用才并行(工具定义里的 `isConcurrencySafe`),结果仍按模型顺序逐个落账;真实实现用有界并发池,exclusive 调用形成 barrier(`tool-calls.ts:60-102`)。

## 本章留下的问题

模型"想"和"做"之间有整整一次网络往返,用户盯着黑屏等半天才知道 agent 在干什么。下一章:流式输出。
