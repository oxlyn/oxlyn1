---
title: "JavaScript 核心入门 · 附录：ES2015+ 速查"
description: "现代 JavaScript 高频语法一页速查：解构、展开、可选链、空值合并、结构化克隆等，附学习资源。"
publishDate: 2026-05-07T09:00:00
tags: ["javascript", "教程"]
---

## 语法速查（2015 年以来高频新增）

```js
// 解构 + 默认值 + 重命名（第 2 章）
const { name: userName = 'anon', ...rest } = obj
const [first, , third = 'x'] = arr

// 展开 / 剩余（第 2 章）
const merged = { ...a, ...b }
const fn = (a, ...rest) => rest

// 模板字符串
const msg = `你好 ${userName}，共 ${items.length} 项`

// 箭头函数 + 词法 this（第 3 章）
const doubled = nums.map(n => n * 2)

// 类与私有字段（第 4 章）
class A { #hidden = 1; static create() { return new A() } }

// 短路求值升级
const city = user?.address?.city ?? '未知'   // 可选链 + 空值合并（只兜 null/undefined）
obj?.method?.()                               // 方法安全调用

// 迭代协议（第 5 章）
for (const [k, v] of Object.entries(o)) {}
const lazy = function* () { yield 1; yield 2 }

// 异步三件套（第 6、7 章）
const [ra, rb] = await Promise.all([p1, p2])
const done = await Promise.allSettled(tasks)

// 常用对象/数组 API
Object.fromEntries(pairs)      // 键值对数组 → 对象
structuredClone(deep)          // 深拷贝
arr.at(-1)                     // 负索引取值
[...new Set(arr)]              // 去重
arr.flatMap(x => x)            // map + 打平一层

// 数字与字符串
1_000_000                      // 数字分隔符
str.replaceAll('a', 'b')       // 全量替换
str.trimStart() / .trimEnd()
```

## 十章一图

| 主线 | 章节 | 一句话 |
| --- | --- | --- |
| 类型与值 | [1](/posts/javascript-core/01-variables-and-types/) [2](/posts/javascript-core/02-objects-and-arrays/) | 值有类型、变量没有；对象按引用共享 |
| 对象模型 | [3](/posts/javascript-core/03-functions-and-closures/) [4](/posts/javascript-core/04-prototype-and-class/) [5](/posts/javascript-core/05-iterators-and-generators/) | 函数是值、原型是链、迭代是协议 |
| 异步模型 | [6](/posts/javascript-core/06-event-loop-and-promises/) [7](/posts/javascript-core/07-async-await-and-concurrency/) [9](/posts/javascript-core/09-errors-and-debugging/) | 单线程 + 队列；await 别串行、all 要限流 |
| 环境与生态 | [8](/posts/javascript-core/08-modules/) [10](/posts/javascript-core/10-dom-and-events/) | ESM 静态可分析；DOM 用原生也能写 |

## 学习资源

- [MDN JavaScript 指南](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide)——本系列的依据，语言细节的第一查询入口
- [MDN Reference](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference)——API 手册，配合指南使用
- [javascript.info 中文](https://zh.javascript.info/)——篇幅更长的免费教程，可作平行阅读

## 系列内延伸

读完本系列，按兴趣接续：

- 想写 Agent：[《从零实现 Agent》](/posts/agent-from-scratch/)——第 3 章的流式响应正是第 5、6 章知识的实战
- 想建站点：[《Astro 建站实战》](/posts/astro-from-scratch/) → [《Astro 主题开发》](/posts/astro-theme-dev/)
- 想写插件：[《DSH 插件开发》](/posts/dsh-plugin-dev/)——闭包（第 3 章）与事件协议（第 5 章）是插件框架的底层机制
