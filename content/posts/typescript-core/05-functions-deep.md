---
title: "TypeScript 核心入门 · 第 5 章：函数类型"
description: "函数签名即契约：参数与返回值标注、类型谓词守卫、重载的适用时机。"
publishDate: 2026-07-24T09:00:00
tags: ["typescript", "教程"]
---

> 本文对应 Handbook [More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)。

**学习目标**：掌握函数签名的完整写法，学会用类型谓词写自定义守卫，知道重载什么时候才值得用。

## 函数签名：最重要的类型边界

[第 2 章](/posts/typescript-core/02-everyday-types/)说过"边界标注"——函数签名就是最重要的边界：调用方能传什么、能得到什么，一眼即知：

```ts
type Fetcher = (url: string, init?: RequestInit) => Promise<Response>

function fetcher(url: string, init?: RequestInit): Promise<Response> {
  // 实现体
}
```

参数细节：可选参数 `?`（等价于 `T | undefined`，且必须排在必选后）、默认值（有默认值自动变可选）、剩余参数 `...rest: T[]`、参数解构（直接在解构模式后标注对象类型）。返回值通常交给推断——**返回类型不标，改实现时调用方全都不用动**；公共库的导出函数反而建议显式标（类型即文档）。

返回值类型里有两个特化角色：

- `void`：调用方不该使用返回值（回调的常见签名）；
- `never`：永不正常返回（抛错、死循环）——`function fail(msg: string): never { throw new Error(msg) }`，它能帮收窄（fail 之后的分支里，TS 知道代码到不了）。

## 类型谓词：自己写收窄规则

内置检查（typeof/instanceof）覆盖不到的场景，用**类型谓词**把判断函数变成守卫：

```ts
function isPost(x: unknown): x is Post {
  return typeof (x as Post).title === 'string'    // 实现里才允许断言
}

const raw: unknown = await getData()
if (isPost(raw)) {
  raw.title          // 收窄为 Post
}
```

谓词的价值在[第 4 章](/posts/typescript-core/04-narrowing.md)留下的坑上兑现——**filter 不再丢类型**：

```ts
const posts: (Post | null)[] = /* ... */
const real = posts.filter((p): p is Post => p !== null)
// real: Post[]（不用谓词的话还是 (Post | null)[]）
```

责任随之转移：谓词函数的实现正确性 TS 无法验证（它信你的 `is`）——谓词体里多一分较真，全局少一分隐患。

## 重载：一个函数多个签名

重载让对外 API 按**参数组合**给出精确的返回类型：

```ts
function createDate(timestamp: number): Date
function createDate(year: number, month: number, day: number): Date
function createDate(a: number, b?: number, c?: number): Date {   // 实现签名，对外不可见
  return b === undefined ? new Date(a) : new Date(a, b - 1, c)
}
```

调用方只能看到上面的重载签名列表。适用判断：**返回类型随参数形态改变**才值得重载（如 `parse('2026-01-01')` 返回 Date、`parse(id)` 返回 Post）；只是参数可选就别用重载——联合参数 + 内部收窄通常更直白。

## 踩坑提示

- 回调签名写宽了（参数 any），调用方丢掉全部推断——宁可让 TS 从上下文推断回调参数。
- 重载列表的顺序有意义：TS 从上到下匹配第一个命中的签名，宽的放前面会挡住窄的。
- 类型谓词写错（`is` 的类型与实际不符）不会报错——它是最需要代码评审的地方。

## 练习

1. 写谓词函数 `isNonEmptyString(x: unknown): x is string`，用它清洗一组脏数据。
2. 给 `createDate` 加一个字符串时间戳的重载，验证调用方提示。
3. 把一个 `any` 参数的旧函数改造成泛型或谓词版本，对比调用处的类型体验。
