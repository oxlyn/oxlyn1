---
title: "TypeScript 核心入门 · 第 4 章：类型收窄"
description: "让编译器跟着代码走：typeof/in 收窄、判别联合、never 穷尽检查——TS 类型系统的主舞台。"
publishDate: 2026-08-04T09:00:00
tags: ["typescript", "教程"]
---

> 本文对应 Handbook [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)。

**学习目标**：理解收窄机制，掌握判别联合这一 TS 最重要的建模武器，用 never 做穷尽检查。

## 收窄：分支里的类型会变聪明

联合类型的值在使用处必须"分情况"，而 TS 能顺着你的判断**自动收窄**类型：

```ts
function format(value: string | number) {
  if (typeof value === 'string') {
    return value.trim()          // 此分支里 value: string
  }
  return value.toFixed(2)        // 此分支里 value: number
}
```

`typeof`、`instanceof`、`in`（查属性存在）、相等比较、truthiness 判断——所有这些运行时检查都会同步更新分支内的类型。收窄是**控制流分析**：编译器像执行代码一样跟踪每个分支里"值可能是什么"。

这就是 TS 与"给 JS 加注释"的本质区别：你不是在标注，而是在**给编译器描述逻辑**，它替你验证逻辑与类型的一致性。

## 判别联合：状态建模的完全体

第 3 章埋的种子在这里结果。给联合的每个成员放一个**同名字面量字段**（判别字段），TS 就能按它收窄：

```ts
type Request =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'done'; data: string[] }
  | { state: 'error'; message: string }

function view(r: Request) {
  switch (r.state) {
    case 'idle':   return '等待中'
    case 'loading':return '加载中…'
    case 'done':   return r.data.join(',')     // 只有这里有 data
    case 'error':  return `失败: ${r.message}` // 只有这里有 message
  }
}
```

每个分支只看到"该有的字段"：`r.data` 在 done 分支之外不可访问——**非法状态在类型层面不存在**。对比"一个对象塞满可选字段 + 布尔标志"的写法（isDone 和 data 可能自相矛盾），判别联合把状态机的每个态描述成独立成员，不可能的组合编译器直接拒绝。前端的数据请求、Agent 的会话状态、任何"互斥状态 + 各自附加数据"的场景都该这么建。

## never 与穷尽检查

`never` 是空类型：没有任何值属于它。它的实用价值是**当编译器的报警器**——把所有可能都处理完后，剩余分支的类型就是 never：

```ts
function view(r: Request) {
  switch (r.state) {
    // ...四个 case 齐了
    default: {
      const _exhaustive: never = r   // 少写一个 case，这里立刻编译报错
      return _exhaustive
    }
  }
}
```

将来给 Request 加第五个状态时，所有 switch 里的 `_exhaustive` 一起标红——**改枚举忘改分支**这类维护事故被编译器接管。这个模式叫穷尽检查，成本一行，收益长期。

## 踩坑提示

- `filter` 不能自动收窄：`list.filter(x => x !== null)` 得到的还是 `(T | null)[]`——需要第 5 章的类型谓词。
- 收窄会被**回调打断**：把可变的对象传入闭包后再读，收窄失效（编译器不知道回调期间值变没变），必要时先存到 const 局部变量。
- truthiness 收窄对 `0`、`''` 有意外副作用：`if (count)` 会把 0 和"没有"混为一谈——判断存在性用 `!== undefined`。

## 练习

1. 把"用户会话"建模成判别联合（匿名/已登录/被封禁），每个态带各自的字段。
2. 给上面的 switch 补 default 穷尽检查，然后新加一个状态，验证编译器报错。
3. 写一个 `assertNever(x: never): never` 工具函数，替换 `_exhaustive` 模式。
