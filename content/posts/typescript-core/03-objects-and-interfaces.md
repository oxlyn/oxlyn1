---
title: "TypeScript 核心入门 · 第 3 章：对象与接口"
description: "interface 与 type 的真实差异、可选/只读/索引属性，以及 extends 复用形状。"
publishDate: 2026-08-15T09:00:00
tags: ["typescript", "教程"]
---

> 本文对应 Handbook [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)。

**学习目标**：熟练描述对象形状，理清 interface 与 type 的取舍，用 extends 组织类型层次。

## 描述一个对象

[JS 系列第 2 章](/posts/javascript-core/02-objects-and-arrays/)说过对象是"属性袋"，TS 的对象类型就是给这个袋子画图纸：

```ts
interface Post {
  title: string
  description?: string          // 可选：可以没有
  readonly id: string           // 只读：创建后不可改
  tags: string[]
  [key: string]: unknown        // 索引签名：还允许任意字符串键（值类型受限）
}
```

可选属性的值为 `T | undefined`——读取后必须处理空分支，和 null 同一套纪律。readonly 只约束 TS 层（运行时照样可改），价值在于把"不该改"写进契约。

索引签名 `[key: string]: unknown` 是"键不固定"场景的出口，但会放宽整个对象的检查——能用具体字段描述就别用索引签名，两者并存时，具体字段类型必须兼容签名类型。

## interface 还是 type

两套写法能描述同一个对象形状，差异在两点：

```ts
interface A { name: string }
type B = { name: string }        // type 侧是"赋值"，什么类型都能起名
```

1. **扩展方式**：interface 用 `extends`，type 用交叉 `&`。对同一个 interface 的多次声明会**自动合并**（声明合并，第 9 章的主角）；type 重名直接报错。
2. **表达范围**：interface 只能描述对象形状；type 能给联合、元组、映射类型起名。

取舍惯例：**对象形状用 interface（可扩展、报错信息更友好），联合与类型变换用 type**。两者能接的地方团队统一即可——本站 Astro 主题系列的组件 Props 用的就是 `interface Props`。

## extends：形状的复用

```ts
interface BasePost { title: string; publishDate: Date }
interface Draft extends BasePost { status: 'draft' }
interface Published extends BasePost { status: 'published'; url: string }
```

extends 是"含 $\text{父}$ 的新形状"，配合字面量联合做**状态的互斥建模**：Draft 没有 url，Published 没有 draft 语义——比 `status: string` 加一堆可选字段的"大杂烩接口"强一个量级。这是判别联合（第 4 章）的前置姿势。

交叉类型 `A & B` 是 type 侧的"合体"：`type Admin = User & { permissions: string[] }`。注意交叉与 extends 的一个差异：字段冲突时 extends 报错，交叉会产出 `never` 类型的字段——静默的坑。

## 踩坑提示

- 接口字段写错名，创建对象时才报错——报错点离定义点远，先检查形状定义。
- 索引签名 + 具体字段并存，字段类型必须能赋给签名类型，否则报错信息很难懂。
- `readonly` 数组 `readonly T[]` 不能传给要求 `T[]` 的函数——可变性也是类型契约的一部分。

## 练习

1. 把本站文章的 frontmatter（title/publishDate/tags/draft…）建模成 interface，tags 做成可选 + 默认语义。
2. 用 extends + 字面量联合把 Post 拆成 Draft/Published 两个互斥接口。
3. 用交叉类型合并两个 interface，故意让同名字段类型冲突，观察 `never` 的出现。
