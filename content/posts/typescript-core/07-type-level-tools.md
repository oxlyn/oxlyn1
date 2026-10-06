---
title: "TypeScript 核心入门 · 第 7 章：类型级工具"
description: "typeof/keyof/索引访问三大运算符、映射类型原理，以及内置工具类型的实现拆解。"
publishDate: 2026-05-15T09:00:00
tags: ["typescript", "教程"]
---

> 本文对应 Handbook [Creating Types from Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)（含 [keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)、[typeof](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)、[索引访问](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)、[映射类型](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)各节）。

**学习目标**：掌握从旧类型造新类型的四个运算符，理解映射类型与内置工具类型的实现原理。

## 三个运算符：类型的取值与遍历

类型层也有自己的"取值语法"：

```ts
const config = { host: 'localhost', port: 3000 }
type Config = typeof config            // { host: string; port: number }——值 → 类型
type Host = Config['host']             // string——索引访问：类型上的取属性
type Keys = keyof Config               // 'host' | 'port'——所有键的联合
```

- `typeof`：把**值**变成它的类型（类型位置上才生效，和运行时 typeof 是两回事）；
- 索引访问 `T['a']`：在类型上取属性的类型，配合联合键能一次取多个 `T['a' | 'b']`；
- `keyof T`：拿到所有键的联合——它是"对键编程"的基础。

三个运算符组合出经典模式：**从配置对象导出类型**，配置与类型永远同步：

```ts
type Key = keyof typeof config        // 后续约束用
function set<K extends Key>(key: K, value: Config[K]) { /* ... */ }
set('port', 8080)                     // value 类型自动联动为 number
```

## 映射类型：批量变换字段

映射类型是类型层的 `map`：遍历键联合，逐个变换：

```ts
type MyPartial<T> = {
  [K in keyof T]?: T[K]          // 每个键加 ?，值的类型是原值
}

type ReadonlyVersion<T> = {
  readonly [K in keyof T]: T[K]  // 加 readonly 修饰符
}
```

`[K in keyof T]` 就是"对 T 的每个键"——映射类型的骨架固定，变化都在修饰符（`?`、`readonly`，都可加 `-` 去除）和值类型（可用条件表达式）上。内置工具类型几乎全是它的薄壳：

```ts
type Pick<T, K extends keyof T>     = { [P in K]: T[P] }
type Record<K extends keyof any, V> = { [P in K]: V }
type Omit<T, K extends keyof any>   = Pick<T, Exclude<keyof T, K>>
```

读懂这三行，工具类型就不再是黑魔法：**Pick 挑键、Record 造表、Omit = 挑键 - 排除键**。

## 常用工具类型速览

| 工具 | 一句话 | 典型场景 |
| --- | --- | --- |
| `Partial<T>` | 全部可选 | 更新接口的入参 |
| `Required<T>` | 全部必填 | 消除可选漂移 |
| `Pick<T, K>` / `Omit<T, K>` | 挑/剔字段 | 列表视图、对外 DTO |
| `Record<K, V>` | 键集合 → 值类型 | 字典、状态表 |
| `ReturnType<F>` | 函数返回类型 | 从实现导出类型 |
| `NonNullable<T>` | 剔除 null/undefined | 清洗联合 |

组合用法比单用更有威力：`type PostInput = Omit<Post, 'id' | 'publishDate'>`——**创建入参 = 完整实体去掉服务端字段**，一 行顶一个接口定义，且永远与 Post 同步。

## 踩坑提示

- `typeof` 拿到的是"当前初始化表达式"的类型，对象后来加的字段不在其中——配置先写全再 typeof。
- 映射类型默认只遍历自身键，遇到索引签名源要加 `& {}` 之类的技巧，否则行为反直觉。
- 工具类型套太深（三层 Omit 里套 Partial）报错信息会变成天书——超过两层的类型变换，值得起个中间别名。

## 练习

1. 手写 `MyOmit`、`MyRecord`，用几个类型测试（赋值对不上会编译错）验证行为一致。
2. 从本站 [site.config 思路](/posts/astro-theme-dev/06-theme-config/)出发：定义配置对象，用 `typeof` + `keyof` 派生出 setter 的类型。
3. 用 `ReturnType` 从一个函数导出返回类型，然后改函数实现，验证调用方类型自动跟随。
