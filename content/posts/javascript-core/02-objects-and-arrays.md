---
title: "JavaScript 核心入门 · 第 2 章：对象与数组"
description: "属性模型与引用语义、解构与展开、用 map/filter/reduce 替代手写循环。"
publishDate: 2026-05-22T09:00:00
tags: ["javascript", "教程"]
---

> 本文对应 MDN 指南[处理对象](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Working_with_objects)、[索引集合](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Indexed_collections)与[带键集合](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Keyed_collections)。

**学习目标**：理解 JS 对象的属性模型，熟练使用解构/展开，把常用循环重写成集合方法。

## 对象：一个动态的属性袋

JS 对象比"类实例"更原始：它就是一组**键值对**，键是字符串（或 symbol），值随意，随时增删：

```js
const user = { name: 'Oxlyn', level: 1 }
user.email = 'a@b.c'      // 加
delete user.level         // 删
console.log('name' in user)  // true：查键是否存在
```

访问属性有两种写法：`user.name` 和 `user['name']`——后者接受任意表达式，键来自变量时只能用它。属性名里有空格、连字符时也必须用方括号。

第 1 章说过对象按引用共享，这里补上工程实践中最常见的三个拷贝姿势：

```js
const shallow = { ...user }              // 浅拷贝一层
const deepJson = JSON.parse(JSON.stringify(user))  // 粗暴深拷贝（函数/undefined 会丢）
const deep = structuredClone(user)       // 现代深拷贝，优先用这个
```

浅拷贝是大多数场景的正确选择——嵌套对象通常就该共享。真要深拷贝，`structuredClone` 是内置答案，别再手写递归。

## 解构与展开：现代 JS 的日常语法

```js
const { name, level = 1, ...rest } = user      // 对象解构，带默认值，剩余打包
const [first, , third] = ['a', 'b', 'c']       // 数组解构，可跳位
const merged = { ...defaults, ...options }     // 展开合并，后者覆盖前者
const [head, ...tail] = list                   // 取头，尾收数组
```

解构让"传一堆参数"进化成"传一个对象"——函数签名变成命名的、可省略的、顺序无关的，这是现代 JS 库 API 的标准形态（Astro 组件的 `Astro.props` 解构同款思路）。

## 用方法替代手写循环

数组的三个核心方法，覆盖八成的数据处理需求：

```js
const posts = [
  { title: 'a', tags: ['js', 'astro'] },
  { title: 'b', tags: ['js'] },
  { title: 'c', tags: ['astro'] },
]

posts.filter(p => p.tags.includes('js'))   // 过滤：返回新数组
     .map(p => p.title)                     // 映射：返回新数组
     .slice(0, 2)                           // 切片

posts.reduce((acc, p) => acc + p.tags.length, 0)  // 聚合：任意归约

posts.find(p => p.title === 'b')           // 找一个（没有则 undefined）
posts.some(p => p.tags.length > 1)         // 存在性判断
posts.every(p => p.title)                  // 全称判断
```

选择标准：**产出新数组用 map/filter，产出单值用 reduce/find/some**。链式写法让数据流向自上而下可读——这是手写下标循环给不了的表达力。注意这些方法都返回**新数组**，不改动原数组（`sort`/`splice` 是会改原数的少数派，链式里要小心）。

## Map / Set：键值对的另一个选择

普通对象的键只能是字符串，且有原型链上"自带键"的干扰；需要**任意类型做键**或**频繁增删查**时用 `Map`，需要去重集合用 `Set`：

```js
const seen = new Set()
for (const tag of posts.flatMap(p => p.tags)) seen.add(tag)
console.log(seen.size)                     // 去重后的标签数
```

## 踩坑提示

- `{ ...a, ...b }` 是浅合并，嵌套对象会被整体覆盖而不是递归合并。
- `for...in` 遍历对象会连原型链上的可枚举属性一起遍历，遍历键请用 `Object.keys()`/`Object.entries()`，遍历数组用 `for...of`（第 5 章讲区别）。
- `JSON.parse(JSON.stringify(x))` 会静默丢掉函数、undefined、循环引用——现在有 `structuredClone`，没有理由再用它。

## 练习

1. 把一个手写的双重 for 循环（找两数组交集）重写成 `filter + includes`（或 Set）。
2. 写一个函数 `pick(obj, keys)`：用解构和展开从对象里挑出指定键组成新对象。
3. 对比 `{ ...a, ...b }` 与 `structuredClone` 后再合并的差异，构造一个能体现浅合并问题的嵌套用例。
