---
title: "TypeScript 核心入门 · 第 6 章：泛型"
description: "类型参数让函数与容器复用：推断优先、extends 约束、泛型接口与默认类型参数。"
publishDate: 2026-07-13T09:00:00
tags: ["typescript", "教程"]
---

> 本文对应 Handbook [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)。

**学习目标**：理解类型参数的实例化时机，掌握 extends 约束，会写泛型容器与工具函数。

## 泛型：类型的函数

泛型把"类型"变成参数——**调用时才确定**，一个签名覆盖一族具体类型：

```ts
function first<T>(list: T[]): T | undefined {
  return list[0]
}

first(['a', 'b'])     // T 实例化为 string → 返回 string | undefined
first([1, 2])         // T 实例化为 number
```

关键机制是**推断**：调用处几乎从不手写 `first<string>(...)`，TS 从实参推出 T。这和[第 2 章](/posts/typescript-core/02-everyday-types.md)的原则一脉相承——标注留给边界（这里 T 就是边界），其余交给推断。

对比两条歪路，泛型的价值一目了然：写 `any[]` 版本（丢掉全部类型）或按类型复制十份函数（人肉模板）。泛型 = 精确到成员的复用。

## extends 约束：给 T 立规矩

裸 T 上什么都不能做（它可能是任何东西），约束给它最低保障：

```ts
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map(i => i[key])     // 编译器知道 key 一定是 T 的键
}

const titles = pluck(posts, 'title')      // string[]
pluck(posts, 'titel')                     // 编译错：不是合法键
```

`K extends keyof T` 是泛型的精髓：**类型参数之间建立关系**——key 不是随意的 string，而是"T 的键之一"，返回值类型 `T[K]` 也跟着联动。约束还可以是对象形状（`T extends { id: string }`）、联合、任何类型表达式。

## 泛型容器：接口层的标准姿势

泛型不只在函数里——**容器和协议**用泛型接口表达：

```ts
interface ApiResponse<T> {
  code: number
  data: T
  error?: string
}

interface Repository<T, ID = string> {    // 默认类型参数
  get(id: ID): Promise<T | null>
  list(): Promise<T[]>
  save(item: T): Promise<void>
}

// 具体化
const postRepo: Repository<Post> = db.createPostRepo()
const user = (await postRepo.get('u1'))?.title   // 完整的 Post 推断
```

`Repository<Post>` 把"对什么实体操作"参数化——接口写一次，实体任意换。标准库的 `Array<T>`、`Promise<T>`、`Map<K, V>` 全是这个模式：**泛型接口 = 可复用的协议**，[JS 系列第 5 章](/posts/javascript-core/05-iterators-and-generators.md)的迭代器协议在 TS 里就是 `Iterable<T>`。

## 踩坑提示

- 过度泛型化：只用一次、类型单一的地方不需要 T——泛型是为"多种实例化"服务的。
- 泛型 ≠ any：`<T>(x: T) => void` 收到什么都能传，但**类型信息保住了**；any 是直接销毁。
- 约束里用不存在的成员，错误出现在调用点而不是定义点——约束写宽了，错误就会漂移。

## 练习

1. 写泛型 `groupBy<T, K extends keyof T>(items: T[], key: K): Record<string, T[]>`。
2. 给自己的数据层定义 `Repository<T>` 接口，实现一个内存版（Map 存储泛型类）。
3. 故意去掉 `K extends keyof T` 的约束，观察 `pluck` 的报错漂移到哪一行。
