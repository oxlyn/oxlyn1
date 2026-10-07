---
title: "AI SDK 6 实战 · 第 7 章：结构化输出"
description: "generateObject/streamObject 与 zod schema、结构化输出的评测衔接、'schema 即契约'的工程红利。"
publishDate: 2026-12-11T09:00:00
tags: ["ai-sdk", "agent", "教程"]
---

> 本文对应官方文档 [generateObject](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object) 与 [streamObject](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-object)。

**学习目标**：掌握结构化输出的两种模式，把 zod schema 变成"提示词、类型、评测断言"三处共享的单一真理源。

让模型输出 JSON 不难，难在**形状保证**：字段全不全、类型对不对、枚举越不越界。手写时代的答案是"解析失败就再请求一次"—— SDK 的 `generateObject` 把 schema 约束下沉到解码层。

## generateObject：schema 进、对象出

```ts
import { generateObject } from "ai"
import { z } from "zod"

const NoteClassification = z.object({
  category: z.enum(["待办", "灵感", "日程"]).describe("笔记类别"),
  priority: z.number().int().min(1).max(5),
  dueDate: z.string().nullable().describe("ISO 日期，无期限则 null"),
})

const { object } = await generateObject({
  model: "anthropic/claude-sonnet-5.5",
  schema: NoteClassification,
  prompt: "分类这条笔记：周五前把书还给图书馆",
})
// object 的类型由 schema 直接推断：{ category: ..., priority: number, ... }
object.category      // 类型安全，无需手写 interface
```

要点：**schema 即类型**（`z.infer` 的推断直达业务代码，[TS 系列](/posts/typescript-core/04-narrowing/)的类型收窄知识直接变现）；**schema 即提示**（`.describe()` 与枚举约束会被框架注入生成策略）；**解析失败自动修复**（格式错误的重试在 SDK 内部完成）。流式场景用 `streamObject`，按字段增量产出——UI 可以在 JSON 没流完时就渲染前几个字段。

## 与工具调用的分工

| | `generateObject` | 工具调用 |
| --- | --- | --- |
| 目的 | 产出一份结构化数据 | 执行副作用 |
| 终止 | 一次调用即完 | 循环到模型收尾 |
| 典型场景 | 分类、抽取、表单填充、评测 | 记笔记、发消息、查系统 |

判断口诀：**要"数据"用 generateObject，要"动作"用工具**。两者可以组合——Agent 的 `done` 工具（[第 4 章](/posts/ai-sdk-dev/04-tool-loop-agent/)）的 arguments 本质就是一次结构化收尾。

## schema 即评测断言

结构化输出与[评测](/posts/evals-dev/)的结合是零摩擦的：

- [第 3 章的 JSON Schema 断言](/posts/evals-dev/03-deterministic-assertions/)与这里的 zod schema **共享同一份定义**——zod 的 `.toJSONSchema()`（或手工映射）生成校验器，被测与断言永不脱节；
- 枚举字段天然可精确断言：`category` 必须是三值之一——确定性断言的天堂；
- A/B 换模型时（[第 6 章](/posts/evals-dev/06-ab-compare/)），schema 兼容性是第一个该跑的冒烟集——弱模型在复杂嵌套 schema 上的形状崩坏，评测一跑便知。

series-planner 的实战：大纲生成的结构化收尾（系列名、slug、章节标题数组、每章官方链接），schema 来自[站点规范](/posts/agent-skills-dev/10-blog-workflow/)——**规范的机器可读形态就是 schema**。

## 踩坑提示

- schema 里嵌套过深、字段过多——模型形状错误率指数上升，先扁平后拆解；
- 用 `z.any()` 糊弄动态字段——类型与断言双双失效，宁可用 discriminated union；
- nullable 与 optional 混用——前者字段必须在（值可 null），后者字段可缺，评测断言按同一种语义写；
- 大对象用 streamObject 却逐字段渲染 UI——不完整对象先藏后显，别让用户看见半截。

## 练习

1. 给笔记分类写 schema（含枚举、区间、nullable 三种约束），跑通 `generateObject` 并打印推断类型。
2. 把同一份 schema 转成评测断言（JSON Schema 校验），验证"生成与验收共享真理源"。
3. 用 `streamObject` 实现分类结果的渐进渲染（终端逐字段打印即可），观察不完整 JSON 的到达顺序。
