---
title: "JavaScript 核心入门 · 第 8 章：模块化 ESM"
description: "import/export 的完整语义、命名与默认导出的取舍，以及 ESM 与 CommonJS 的关键差异。"
publishDate: 2026-05-16T09:00:00
tags: ["javascript", "教程"]
---

> 本文对应 MDN 指南[JavaScript 模块](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules)。

**学习目标**：掌握 ESM 的导出/导入全套写法，理解模块的加载语义，能读懂 Node 生态里两种模块体系的差异。

## 为什么需要模块

脚本时代的 JS 靠 `<script>` 拼接，所有文件共享全局作用域——变量冲突、加载顺序、依赖关系全靠人脑记。ESM（ES Module）是语言级的解法：**每个文件一个独立作用域，显式声明导出什么、导入什么**，依赖图在加载期就确定。

## 导出：命名与默认

```js
// math.js —— 命名导出：一个模块可以有很多个
export const add = (a, b) => a + b
export function sub(a, b) { return a - b }
export default {                       // 默认导出：一个模块只能有一个
  add, sub,
}
```

```js
// 导入端
import math, { add, sub as minus } from './math.js'  // 默认 + 命名，命名可改本地名
import * as m from './math.js'                       // 命名空间：全部收进一个对象

// 动态导入：返回 Promise，按需加载
const mod = await import('./heavy.js')
```

写法上的取舍惯例：**库/组件型模块给默认导出**（`import Search from 'Search.astro'`），**工具集合给命名导出**（`import { getPost } from '@/data/post'`）。两者都给也常见——本站 Astro 系列里组件用默认导出、工具函数用命名导出，正是这个分工。

`export { x as y }` 的 as 还能做"出口重命名"，聚合多个子模块时好用：

```js
// index.js —— 桶文件：统一出口
export { add, sub } from './math.js'
export { default as Store } from './store.js'
```

## 加载语义：静态与只读

ESM 两个决定性特征：

1. **静态结构**：`import` 语句必须在顶层、模块路径必须是字面量（不能是变量），因此工具能在**构建期**分析整个依赖图——Tree-shaking（摇掉没用到的导出）、打包、按需编译全部建立在这上面。这就是动态路径只能走 `import()` 的原因。
2. **只读视图**：导入的绑定不是值的拷贝，而是对导出方的**实时只读引用**——导出方后来改了值，导入方看到的是新值，但导入方自己不能赋值。

```js
// counter.js
export let count = 0
export const inc = () => count++
// app.js
import { count, inc } from './counter.js'
inc()
console.log(count)   // 1——实时反映；直接 count = 5 则报错
```

## 与 CommonJS 的差异

Node 老生态是 CommonJS（`require`/`module.exports`）：动态加载（require 可以写在 if 里）、值拷贝语义、同步加载。两种体系至今共存，日常需要记住的：

| | ESM | CommonJS |
| --- | --- | --- |
| 语法 | `import`/`export` | `require`/`module.exports` |
| 加载时机 | 静态分析、构建期确定 | 运行时动态 |
| 绑定 | 只读引用（实时） | 值拷贝（导出快照） |
| 顶层 await | 支持 | 不支持 |

Node 里的开关是 package.json 的 `"type": "module"`（.mjs/.cjs 后缀可单独指定）。[Astro 主题开发系列第 7 章](/posts/astro-theme-dev/07-publish-theme/)强调过 npm 包必须 `"type": "module"`——原因就是本章的静态分析：现代构建工具假设你是 ESM。

## 踩坑提示

- 浏览器里 `<script type="module" src="...">` 才启用 ESM；忘了 type 属性，import 直接语法错误。
- 路径必须带扩展名（浏览器 ESM 里 `./math` 不行，要 `./math.js`）；打包器环境（Astro/Vite）才允许省略。
- 循环导入不报错但可能拿到"还没初始化"的绑定——出现 undefined 时先查依赖图里的环。

## 练习

1. 把一个多文件小工具（第 3 章的 once/memoize）拆成模块 + 桶文件，统一从 index 导入。
2. 用 `import()` 实现"点击才加载"的重模块，观察 Network 面板里的按需请求。
3. 在 Node 里分别用 ESM 和 CJS 导出 `let` 变量，验证"实时引用 vs 值拷贝"的差异。
