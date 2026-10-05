---
title: "JavaScript 核心入门 · 第 1 章：变量与类型"
description: "let/const/var 的真实区别、七种类型与动态类型的边界，以及 == 背后的隐式转换规则。"
publishDate: 2026-07-08T09:00:00
tags: ["javascript", "教程"]
---

> 本文对应 MDN 指南[语法与类型](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Grammar_and_types)、[数据结构](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Data_structures)与[相等性判断](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness)。

**学习目标**：掌握三种声明方式的区别，建立"七种类型"的心智模型，搞清 `==` 到底在做什么。

## 三种声明：只有两种该用

```js
const a = 1        // 常量绑定：不能重新赋值（推荐默认）
let b = 2          // 变量绑定：会重新赋值时才用
var c = 3          // 旧世界：函数作用域 + 变量提升，别在新代码里用
```

`const` 锁的是**绑定**而不是值——对象的内容照样能改：

```js
const list = []
list.push(1)       // 合法：改的是内容
// list = []       // TypeError：改的是绑定
```

实践守则很简单：默认 `const`，需要重新赋值再放宽到 `let`，`var` 只在读旧代码时认识它。

## 七种类型，两大阵营

JavaScript 的值分七种原始类型（string、number、bigint、boolean、undefined、symbol、null）和对象类型（object，数组、函数都是它的子类）。关键区别在**赋值语义**：

```js
let x = 1
let y = x
y = 2
console.log(x)     // 1——原始类型按值复制

const o1 = { n: 1 }
const o2 = o1
o2.n = 99
console.log(o1.n)  // 99——对象按引用共享
```

由此得出日常最重要的推论：**把对象传给函数，函数内改它会反映到外面**；想要独立副本就得手动拷贝（第 2 章展开）。

两个容易踩的特例：

- `typeof null === "object"`——历史 bug，改不了了，判断 null 只能 `x === null`；
- `0.1 + 0.2 !== 0.3`——所有语言的 IEEE 754 通病，金额计算用整数分或 bigint。

## 动态类型与转换

变量没有类型，**值**才有。同一个变量先后可以装字符串和数字，于是隐式转换无处不在。最臭名昭著的是 `==`：它会先把两边转成同类型再比，于是有了 `0 == ""`、`null == undefined` 这类反直觉结果。

规则可以背，但没必要——直接立规矩：**永远用 `===` 和 `!==`**，需要转换时手动写 `Number(x)`、`String(x)`、`Boolean(x)`，转换发生在哪一行一目了然。`==` 只有一条例外值得记：`x == null` 同时匹配 null 和 undefined，判断"空值"时偶尔比 `x === null || x === undefined` 省事。

## 踩坑提示

- `let` 有暂时性死区：声明前访问直接 ReferenceError（`var` 只是 undefined，这就是"提升"骗人的地方）。
- `NaN` 不等于任何值包括自己，判断用 `Number.isNaN(x)`。
- 数组也是对象，`typeof [] === "object"`，判断数组用 `Array.isArray(x)`。

## 练习

1. 分别用 `var`/`let` 在循环里注册三个定时器打印循环变量，对比输出差异。
2. 写一个 `safeAdd(a, b)`：把参数 `Number()` 转换后相加，任一结果是 NaN 就返回 0。
3. 在控制台验证 `[] + []`、`[] + {}` 的结果，体会隐式转换的不可预测——然后继续用 `===`。
