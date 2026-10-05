---
title: "TypeScript 核心入门 · 第 8 章：any/unknown/never 与断言"
description: "三个顶层类型的取舍：any 的传染性、unknown 的安全通道、as 与 satisfies 的正确用法。"
publishDate: 2026-07-27T09:00:00
tags: ["typescript", "教程"]
---

> 本文对应 Handbook [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) 的 any/unknown 部分。

**学习目标**：分清 any/unknown/never 的语义，掌握 as 断言的适用边界，学会用 satisfies 做"检查但不拓宽"。

## any：可传染的逃生舱

`any` 表示"放弃检查"：它兼容一切类型，也**把自己的 unchecked 属性传染出去**：

```ts
let data: any = JSON.parse(raw)
data.user.name                       // 不检查
const n: number = data.user.name     // 也不检查——any 流到哪，哪就失明
```

any 的危害不是单点，而是**蔓延**：从 any 取出的值全是 any，错误沿着赋值链一路沉默。`noImplicitAny`（strict 的一部分）至少堵住"隐式 any"——TS 推断不出类型时不再默默放行。

## unknown：需要验证的 any

`unknown` 是 any 的安全版：**什么值都能装，但用之前必须收窄**（第 4 章）：

```ts
function parse(raw: string): unknown {
  return JSON.parse(raw)
}

const data = parse(input)
// data.foo                            // 编译错：unknown 上不能取属性
if (typeof data === 'object' && data !== null && 'user' in data) {
  // 收窄之后才能用
}
```

实践守则一句话：**any 的所有场景优先换 unknown**。代价是要写守卫——或者接[第 5 章](/posts/typescript-core/05-functions-deep.md)的类型谓词、运行时校验库（第 10 章）。unknown 把"这段代码没验证"从隐式变成显式，这就是它的全部价值。

`never` 则在另一端：空集语义，除穷尽检查（第 4 章）外几乎不会主动出现在业务代码里，见到它多半是类型体操的产物。

## as：断言要断得有据

`as` 是"我比编译器懂"的单方面声明，**不做任何运行时转换**：

```ts
const input = document.querySelector('#app') as HTMLDivElement   // 合理：TS 不解析 DOM
const raw = JSON.parse(text) as ApiResponse<Post>                 // 危险：纯信任
```

第一条是 as 的正当用途——TS 拿不到的运行时信息（元素 id 对应什么标签）；第二条则是**把谎言写进类型层**，数据不符时错误照样在运行时爆炸。断言的使用纪律：**只断言"编译器无法知道、但你已验证"的事实**，且尽量靠近验证代码。

两个语法层增强：

```ts
const obj = { env: 'dev', port: 3000 } as const    // 字面量收窄：env: 'dev'（而非 string）
const conf = { env: 'dev', port: 3000 } satisfies Config
// satisfies：按 Config 检查，但保留字面量推断——"检查而不拓宽"
```

`as const` 让对象变成只读字面量类型（配置、判别字段常需）；`satisfies` 是比 as 更现代的选择——**通过检查但保留精确推断**，还能顺手验证拼写（[Astro 主题系列第 6 章](/posts/astro-theme-dev/06-theme-config.md)配置文件用 `as const` 的场景，多数可以用 satisfies 拿到更好的提示）。

## 踩坑提示

- `as unknown as T` 双重断言 = 强行翻案，几乎总是设计问题的信号。
- as 不改变运行时：`x as number` 后照旧能是字符串——断言不是转换，转换要写代码。
- 配置对象忘了 `as const`/`satisfies`，字面量拓宽成 string/number，联合类型的赋值点报错——错误出现在使用处，根因在定义处。

## 练习

1. 把一个 `any` 参数的函数改成 `unknown`，补齐收窄，统计多写了多少行、拦住了什么。
2. 用 `satisfies` 重构一个 `as const` 配置对象，对比两者的编辑器提示差异。
3. 在 `JSON.parse` 的返回值上故意 `as` 一个错误结构，运行验证"断言不救运行时"。
