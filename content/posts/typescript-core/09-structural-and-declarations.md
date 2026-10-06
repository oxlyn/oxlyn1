---
title: "TypeScript 核心入门 · 第 9 章：结构化类型与声明合并"
description: "TS 兼容性只看形状：多余属性检查的攻防，declare module 的扩展手法与真实用法。"
publishDate: 2026-06-10T09:00:00
tags: ["typescript", "教程"]
---

> 本文对应 Handbook [Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)（深入篇）。

**学习目标**：理解结构化类型这一 TS 的兼容性基石，掌握多余属性检查的规则，学会用 declare module 扩展类型。

## 结构化：只问形状，不问出处

TS 判断类型兼容**不看名字，看形状**（鸭子类型的静态版）：

```ts
interface Point { x: number; y: number }
interface Coord { x: number; y: number; label?: string }

const p: Point = { x: 1, y: 2, label: 'ok' }   // OK：Coord 是 Point 的超集，兼容
```

`Point` 和 `Coord` 没有任何继承关系，但形状匹配就互通。这是 TS 与名义类型系统（Java/C#）最大的差异，也解释了很多"为什么能这么传"——成员多（超集）可以赋给要求少的，少不能赋给多。

代价是**语义被形状淹没**：`UserId = string` 和 `OrderId = string` 完全互通，混用无人报警。需要"同名不可互换"时用品牌类型模拟：

```ts
type Brand<T, B extends string> = T & { __brand: B }
type UserId = Brand<string, 'UserId'>

function load(id: UserId) {}
load('u1' as UserId)        // 必须显式断言，裸 string 传不进去
```

## 多余属性检查：字面量的特殊待遇

结构化规则下，超集赋值本应全部合法，TS 对**对象字面量**额外多一道"拼写检查"：

```ts
const p1: Point = { x: 1, y: 2, label: 'ok' }   // 编译错：label 不存在于 Point
const extra = { x: 1, y: 2, label: 'ok' }
const p2: Point = extra                          // OK：变量中转就绕过了检查
```

这道检查只防**当场写错字**，不是严格的排他验证——规则冷门但实用：报错"对象字面量只能指定已知属性"时，先查拼写；而"变量中转绕过"正说明它不是安全机制，别拿它当校验用。

## declare module：给类型世界打补丁

声明合并是 interface 的独特能力：**同名声明自动合并**。它的实战形态有两种，一是给没有类型的第三方库补声明：

```ts
// types/untyped-lib.d.ts
declare module 'legacy-pkg' {
  export function setup(options?: { debug?: boolean }): void
}
```

二是**扩展库自己的类型**——这也是本站 [DSH 插件系列](/posts/dsh-plugin-dev/)反复出现的机制：服务名挂上 `Context`（[第 3 章](/posts/dsh-plugin-dev/03-services/)）、事件名挂进 `Events`（[第 4 章](/posts/dsh-plugin-dev/04-events/)）、工具事件类型（[第 7 章](/posts/dsh-plugin-dev/07-into-the-harness.md)的 `import type {}`），底层全是声明合并：

```ts
// 给别人家的 interface 加成员——合并生效于全项目
declare module '@cordisjs/core' {
  interface Events {
    'my:alert': (message: string) => void
  }
}
```

插件 A 声明的事件，插件 B 的 `ctx.on('my:alert', ...)` 立即有类型——**类型层的"多人协作"就是靠合并实现的**。理解了这一点，插件框架的类型魔法全部祛魅。

## 踩坑提示

- declare module 的模块名拼错不报错，只是声明落空——补类型没生效先核对包名。
- 合并的字段类型冲突会报错；合并顺序影响函数重载的匹配优先级。
- d.ts 里的声明是全局/模块二分的：文件顶层有 import/export 就成了模块声明，漏写或错写作用域是"d.ts 不生效"的常见根因。

## 练习

1. 构造一个"超集赋值"用例，验证结构化兼容；再用品牌类型封住一种 id 混用。
2. 给一个无类型的 npm 包手写最小 d.ts，验证导入不再报"隐式 any"。
3. 复现 [DSH 第 4 章](/posts/dsh-plugin-dev/04-events.md)的事件声明合并，在自己的项目里给 Events 加一个自定义事件。
