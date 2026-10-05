---
title: "TypeScript 核心入门 · 第 2 章：日常类型"
description: "标注与推断的分工、联合与字面量类型的建模威力，以及数组和元组的正确用法。"
publishDate: 2026-07-21T09:00:00
tags: ["typescript", "教程"]
---

> 本文对应 Handbook [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)。

**学习目标**：掌握日常标注语法，学会用联合与字面量类型建模，理解"能推断就不标注"的原则。

## 标注与推断

标注就是在名字后面加 `: 类型`：

```ts
const title: string = 'hello'
let count: number = 0
function summary(post: Post): string { /* ... */ }
```

但 TS 的日常体验恰恰是**很少需要标注**——初始化、函数返回值大多能自动推断：

```ts
const title = 'hello'          // 推断为 string
const nums = [1, 2, 3]         // 推断为 number[]
const sum = nums.reduce((a, b) => a + b, 0)   // 推断为 number
```

实践原则：**边界标注，内部推断**。函数参数（边界——调用方要遵守的契约）标清楚；函数体内部的局部变量交给推断。内部加标注纯属噪音，还会挡住"改类型时只需改一处"的便利。

## 联合与字面量：小类型解决大问题

联合类型 `A | B` 表示"二选一"，配上**字面量类型**（值即类型），建模能力立刻上一个台阶：

```ts
type Status = 'draft' | 'published' | 'archived'

interface Post {
  title: string
  status: Status          // 三个合法值，写错编译期报错
}
```

对比两种常见反面写法：`status: string`（什么都能塞）和 `status: number`（魔法数字 1/2/3 靠注释解释）。字面量联合让**非法状态无法被表达**——这是类型建模的核心思想，第 4 章的判别联合是它的完全体。

null 处理同理：`string | null` 明确表达"可能没有"，配合 strictNullChecks 强制分支处理（第 1 章）。

## 数组与元组

```ts
const tags: string[] = ['js', 'ts']
const pair: [string, number] = ['age', 18]   // 元组：定长、每位类型固定
const dict: Record<string, number> = {}      // 键随意的映射（第 7 章讲 Record 原理）
```

元组的典型用途是"结构固定的短序列"——坐标、键值对、函数多返回值（`return [name, age] as const`）。超过三位还用元组，就该换成对象了：具名可读，位置不可读。

## 类型别名：给形状起名字

`type` 给任意类型起名，联合、元组、函数签名都值得起——**复用是次要的，语义命名才是主要收益**：

```ts
type Id = string
type Handler = (event: string) => void
type Maybe<T> = T | null
```

## 踩坑提示

- 字面量推断陷阱：`let s = 'draft'` 推断为 `string` 而非 `'draft'`——把会变的值赋给接口的 `Status` 字段会报错。需要保持字面量用 `as const`（第 8 章）。
- 对象字面量没标注就 push 进数组，字段拼写错误没人管——容器先标类型再装数据。
- `Record<string, T>` 的读取结果是 `T`（若开 `noUncheckedIndexedAccess` 则是 `T | undefined`），别假设键一定存在。

## 练习

1. 给[JS 系列第 2 章](/posts/javascript-core/02-objects-and-arrays/)的 posts 数据补上 TS 类型（含 status 字面量联合）。
2. 故意给 `status` 赋值 `'publshed'`，读一遍编译错误，体会字面量联合的防错价值。
3. 写一个返回元组的函数 `minMax(nums: number[]): [number, number]`。
