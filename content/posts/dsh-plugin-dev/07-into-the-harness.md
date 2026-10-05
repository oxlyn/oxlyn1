---
title: "DSH 插件开发 · 第 7 章：注册工具，进入 Harness"
description: "defineTool + ctx.tools：把插件能力暴露成 Agent 可调用的工具，监听 tools/result，完成一次完整组合。"
publishDate: 2026-10-05T12:30:00
tags: ["dsh", "cordis", "教程"]
---

> 本文对应官方教程[第 7 章：进入 harness](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/07-into-the-harness)，示例代码在其基础上改编。

**学习目标**：注册 Agent 可调用的工具，订阅工具结果事件，理解 harness 的完整组合结构。

## harness 把能力放在服务里

前六章都在 Cordis 层面打转，本章 harness 登场：它把 Agent 运行时的三大能力——**工具（tools）、模型接入（llm）、Agent 管理（agents）**——做成三个服务，挂在 ctx 上。写 harness 插件，本质就是往这三个服务里注册东西，或者监听相关事件。

## 定义并注册工具

工具用 `defineTool` 定义，通过 `ctx.tools.register` 注册（注册是 effect，随插件卸载自动注销——第 2 章的机制）：

```ts
// dice-tool.ts
import { defineTool, brandString } from '@deepseek-ai/dsh-tools'
import type { ToolCallId } from '@deepseek-ai/dsh-tools'

export const diceTool = defineTool({
  name: 'roll_dice',
  description: '掷一个 N 面骰子，返回点数',
  parameters: {
    type: 'object',
    properties: {
      sides: { type: 'number', description: '骰子面数，默认 6' },
    },
  },
  async execute(args, callId, signal) {
    const sides = args.sides ?? 6
    const value = Math.floor(Math.random() * sides) + 1
    return {
      output: `掷出了 ${value} 点（${sides} 面骰）`,
      callId: brandString<ToolCallId>(callId),
    }
  },
})

export function apply(ctx) {
  ctx.tools.register(diceTool)
}
```

拆解一下工具定义的各部分：

- `name` / `description`：给模型看的，描述写得越清楚，模型调用得越准；
- `parameters`：标准 JSON Schema，模型据此生成参数；
- `execute(args, callId, signal)`：真正干活的地方。`callId` 标识这一次调用（需要用 `brandString<ToolCallId>()` 品牌化），`signal` 用于中止——长任务务必尊重它；
- 返回值 `output` 是给模型的执行结果。

插件本身记得 `inject: ['tools']`——`ctx.tools` 是个服务，先注入才能用（第 3 章的规矩）。

## 监听工具结果

想审计每次工具调用？订阅 `tools/result` 事件：

```ts
// tool-logger.ts
import type {} from '@deepseek-ai/dsh-tools'

export function apply(ctx) {
  ctx.on('tools/result', (exec, result) => {
    ctx.log('工具', exec.name, '返回:', result)
  })
}
```

注意第一行的 `import type {}`——空导入不为运行时引入任何东西，**只为触发 TypeScript 的类型合并**，让 `tools/result` 这个事件名获得类型。这是声明合并体系（第 3、4 章）在 harness 里的实战形态。

## 手动调用工具

不用等模型，插件里也能直接执行工具（比如做集成测试）：

```ts
const result = await ctx.tools.execute({
  callId: brandString<ToolCallId>('demo-1'),
  name: 'roll_dice',
  arguments: { sides: 20 },
  signal: new AbortController().signal,
})
```

## 完整组合

把这些拼进 `cordis.yml`：

```yaml
- @deepseek-ai/dsh-system-prompt
- @deepseek-ai/dsh-tools
- ./tool-logger.ts
- ./dice-tool.ts
```

`dsh-tools` 和 `dsh-system-prompt` 必须在列——前者是工具服务的提供方，后者负责系统提示，缺了它们 Agent 循环转不起来。运行：

```bash
node --import tsx ../../vendor/cordis/bin.js
```

日志里能看到工具被注册；与 Agent 对话时让它"掷一个 20 面骰"，就能看到完整的 模型请求 → 工具调用 → `tools/result` → 模型续写 流程。

## 从这里走向完整 Agent

教程到此把插件侧讲完了，剩余的部分官方指向三块进阶内容：**LLM 适配器**（接入具体模型）、**Agent 循环**（请求-工具-响应的主循环定制）、**持久化**（会话存储）。它们分别对应 `ctx.llm`、`ctx.agents` 两个服务和相关的 waterfall 事件（第 4 章的 `agent/request`、`approval/request`）。

本站[《从零实现 Agent》](/posts/agent-from-scratch/)系列正好覆盖后两块的概念层——两边对照着读，"框架怎么用"和"框架为什么这样设计"就都齐了。

## 踩坑提示

- `ctx.tools` 用之前忘 `inject: ['tools']`，插件永远 PENDING——这是本系列最经典的坑，第 6 章的诊断方法此刻派上用场。
- `execute` 返回值缺 `output` 字段，模型收到的是空结果，表现为"工具明明执行了但 Agent 说没结果"。
- `tools/result` 监听器不写 `import type {} from '@deepseek-ai/dsh-tools'`，事件名没有类型（纯字符串），拼错没人提醒。
- 长任务忽略 `signal`，用户中止请求后工具还在后台跑。

## 练习

1. 把 dice 工具换成你自己的场景（查询天气、翻译、查数据库都行），走通注册到调用的全流程。
2. 给 tool-logger 加上耗时统计：`tools/result` 的参数里找时间信息，或自己在 `tools/call` 类事件计时。
3. 在 `cordis.yml` 里去掉 `dsh-system-prompt`，观察 Agent 行为的变化，体会系统提示的作用。
