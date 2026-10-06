---
title: "ArkTS 鸿蒙开发入门 · 第 2 章：从 TS 到 ArkTS"
description: "四条语言约束：强制静态类型、对象布局不可变、运算符语义收紧、放弃结构化类型。"
publishDate: 2026-06-15T09:00:00
tags: ["arkts", "harmonyos", "教程"]
---

> 本文对应官方文档[从 TypeScript 到 ArkTS 的适配规则](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/typescript-to-arkts-migration-guide)与[语法适配背景](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-migration-background)。

**学习目标**：掌握 ArkTS 对 TS 的四条核心约束，把 TS 代码习惯平移成 ArkTS 风格。

## 为什么要"收紧"

TS 给 JS 加了类型层，但它是**可选的**：any 满天飞、运行时随意改对象、结构化类型的宽兼容，都让编译器无法可靠推断——运行时仍要做大量类型检查，AOT 编译器也难以优化。ArkTS 的解法是**把这些灵活点改成硬约束**，换取更少的运行时开销和更早的错误暴露。动机理解了，四条规则就都不意外了。

## 约束一：强制静态类型

TS 里能拖就拖的类型标注，ArkTS 里是必须项——类型推断虽有，但**禁止 any/unknown**这类"放弃检查"的类型：

```ts
// TS 习惯
let data: any = getData()

// ArkTS：必须给出明确类型
interface Data { id: number; title: string }
let data: Data = getData()
```

类的属性必须**显式初始化**（声明处或构造函数里），这等价于 TS 的 `strictPropertyInitialization`：

```ts
class Person {
  name: string = ''          // 必须给初值
  setName(n: string): void { this.name = n }
}
```

对照[TS 系列第 1 章](/posts/typescript-core/01-why-and-setup/)：`strict: true` 是 TS 的推荐项，在 ArkTS 里成了**唯一选项**——你在 TS 系列里学的所有"为什么"在这里全部兑现。

## 约束二：运行时不可改变对象布局

对象一旦创建，**形状就固定了**——不能运行时新增属性、删除属性：

```ts
interface Point { x: number; y: number }
const p: Point = { x: 1, y: 2 }
// p['z'] = 3                // 禁止：布局不可变
// delete p.y                // 禁止
```

[JS 系列第 2 章](/posts/javascript-core/02-objects-and-arrays.md)说过对象是"动态属性袋"，这里袋子被焊死了。收益是属性偏移可预测、内存布局紧凑——AOT 优化的前提。工程上的对应习惯：**所有字段在类型定义里想全**，"用的时候随手加字段"的写法直接没有。

## 约束三：运算符语义收紧

代表性的例子：一元 `+` 只能用于数字。JS 里 `+'42'`（字符串转数字）这类隐式转换全部出局——类型转换必须显式写 `Number('42')`。精神与[JS 系列第 1 章](/posts/javascript-core/01-variables-and-types.md)"永远用 `===`、显式转换"一脉相承，只是从"最佳实践"升级为"语法约束"。

## 约束四：放弃结构化类型

TS 的兼容性只看形状（[TS 系列第 9 章](/posts/typescript-core/09-structural-and-declarations.md)），ArkTS 改为**名义类型**：类型是否兼容看声明身份，不看形状。两个结构相同的 interface 互不相认：

```ts
interface UserId { value: string }
interface OrderId { value: string }
const u: UserId = { value: 'u1' }
// const o: OrderId = u      // TS 允许（形状相同），ArkTS 拒绝
```

TS 系列里需要品牌类型（Brand）才能实现的"id 不可混用"，在 ArkTS 里是默认行为——约束四反过来送了一份安全红利。代价是"适配接口的第三方对象"要多写显式转换/包装。

## 迁移心法

- **先改数据建模**：把动态属性、any、可选链兜底全部收敛成完整 interface——约束一、二就自动过了；
- **防御式代码做减法**：为"运行时改形状"写的防御逻辑（in 检查、默认字段拼装）大多可以删；
- **报错即文档**：DevEco 的 ArkTS linter 会给出对应规则链接，比背规则表高效。

## 踩坑提示

- `JSON.parse` 返回的是动态结构，赋给接口类型前先做校验转换（第 8 章给出完整模式）。
- 第三方 TS/npm 库不一定能直接用——用了 ArkTS 约束外特性的库要找替代或适配。
- 别把"ArkTS 禁 any"理解成"禁灵活性"：泛型、联合类型、映射类型都在，收窄的只是动态面。

## 练习

1. 写一段依赖动态属性的 TS 代码（运行时加字段），改造成 ArkTS 可编译的版本。
2. 用两个结构相同但名字不同的 interface 体会名义类型的拒绝行为。
3. 把自己 TS 项目里的一处 any 改成完整类型，迁移成 ArkTS 风格，对比防御代码的增减。
