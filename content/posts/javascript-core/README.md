---
title: "JavaScript 核心入门：从语法到事件循环"
description: "JavaScript 系列教程总览：面向已有其他语言基础的开发者，十章打通语法、对象模型与异步三大关卡。"
publishDate: 2026-08-12T09:00:00
tags: ["javascript", "教程"]
---

JavaScript 是这个博客所有系列的地基：[《从零实现 Agent》](/posts/agent-from-scratch/)用 TypeScript 写 Agent 运行时，[《Astro 建站实战》](/posts/astro-from-scratch/)的组件脚本和[《DSH 插件开发》](/posts/dsh-plugin-dev/)的插件全是 JS/TS。这个系列回到地基本身——不求覆盖语言的每个角落，只求把**真正支撑日常写码的内核**讲透：类型系统、对象模型、函数与闭包、异步三件套。

> 内容依据 [MDN JavaScript 指南](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide)整理，每章开头给出对应章节链接；代码示例均为原创，可在浏览器控制台或 `node` 里直接跑。

## 这个系列怎么读

面向**已有任意一门语言基础**的读者：不再解释"什么是变量"，把篇幅留给 JavaScript 独有（或与直觉相悖）的部分——原型链、闭包、事件循环、this。

| 章节 | 内容 | MDN 对应 |
| --- | --- | --- |
| [第 1 章：变量与类型](/posts/javascript-core/01-variables-and-types/) | let/const、七种类型、相等性判断的坑 | [语法与类型](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Grammar_and_types) |
| [第 2 章：对象与数组](/posts/javascript-core/02-objects-and-arrays/) | 属性模型、解构展开、map/filter/reduce | [处理对象](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Working_with_objects) |
| [第 3 章：函数与闭包](/posts/javascript-core/03-functions-and-closures/) | 一等函数、this、闭包的原理与用途 | [函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Functions) / [闭包](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Closures) |
| [第 4 章：原型与 class](/posts/javascript-core/04-prototype-and-class/) | 原型链才是本体，class 是语法糖 | [继承与原型链](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain) |
| [第 5 章：迭代器与生成器](/posts/javascript-core/05-iterators-and-generators/) | for...of 的幕后、function*、惰性求值 | [迭代器与生成器](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Iterators_and_generators) |
| [第 6 章：事件循环与 Promise](/posts/javascript-core/06-event-loop-and-promises/) | 单线程怎么异步、Promise 链式与组合 | [使用 Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Using_promises) |
| [第 7 章：async/await 与并发控制](/posts/javascript-core/07-async-await-and-concurrency/) | 语法糖的真相、Promise.all 系列限流 | [使用 Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Using_promises) |
| [第 8 章：模块化 ESM](/posts/javascript-core/08-modules/) | import/export、与 CommonJS 的区别 | [JavaScript 模块](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules) |
| [第 9 章：错误处理与调试](/posts/javascript-core/09-errors-and-debugging/) | try/catch 的适用边界、异步错误的捕获 | [控制流与错误处理](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Control_flow_and_error_handling) |
| [第 10 章：DOM 与事件](/posts/javascript-core/10-dom-and-events/) | 查询与创建节点、事件委托 | [DOM 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Document_Object_Model) |
| [附录：ES2015+ 速查](/posts/javascript-core/11-appendix/) | 现代语法一页速查 + 学习资源 | — |

## 三条主线

十章内容可以归纳成三条主线，读到后面可以回来自查：

1. **类型与值**（第 1、2 章）——动态类型之下，什么在变、什么不变；
2. **对象模型**（第 3、4、5 章）——函数是对象、原型链、迭代协议，三者合起来才是 JS 的"面向对象"；
3. **异步模型**（第 6、7 章，第 9 章收尾）——单线程 + 事件循环 + Promise，这是 JS 与其他语言差异最大的地方，也是 Agent、Astro 这类现代工具链的灵魂。

## 运行环境

浏览器控制台（F12）或 [Node.js](https://nodejs.org/) 任一即可，系列代码刻意避开浏览器专属 API（除第 10 章）。推荐用 `node --watch` 边写边跑。

## 遗留问题

- 正则表达式、Date/Intl 国际化、TypedArray 等专题未展开，MDN 指南均有独立章节。
- TypeScript 不在本系列范围，但读完本系列再看任何 TS 代码都不会有语法障碍。
