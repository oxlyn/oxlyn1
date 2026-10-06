---
title: "JavaScript 核心入门 · 第 3 章：函数与闭包"
description: "函数是一等公民：三种写法、this 的绑定规则，以及闭包——JS 一切高级模式的底层机制。"
publishDate: 2026-05-11T09:00:00
tags: ["javascript", "教程"]
---

> 本文对应 MDN 指南[函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Functions)与[闭包](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Closures)。

**学习目标**：掌握函数声明/表达式/箭头函数的差异，理解 this 的绑定规则，能读懂并写出闭包。

## 函数就是值

JS 里函数是**一等公民**：可以存进变量、当参数传、当返回值返回。这让"行为"变成可传递的数据——第 2 章的 `filter(p => ...)` 传的就是函数，回调、事件监听、中间件（[DSH 系列的 waterfall](/posts/dsh-plugin-dev/04-events/)）全都建立在这上面。

三种写法，两个关键差异：

```js
function declare(a, b) { return a + b }     // 声明：有提升，调用可以写在定义之前
const expr = function (a, b) { return a + b }  // 表达式：无提升
const arrow = (a, b) => a + b               // 箭头：无提升 + 词法 this + 隐式返回
```

箭头函数的短体形态 `=> expression` 直接返回表达式值，`map`、`filter` 里大量使用。多语句就需要花括号和显式 `return`。

## this：由调用方式决定

`this` 不是定义时确定的，而是**调用时**由"谁在点它"决定：

```js
const counter = {
  n: 0,
  inc() { this.n++ },          // 方法调用：this = counter
}
counter.inc()                   // this 是 counter
const f = counter.inc
f()                             // this 是 undefined（严格模式）——丢失绑定！
```

规则按优先级记：`new` 调用 > `call/apply/bind` 显式指定 > `obj.method()` 方法调用 > 普通函数调用（undefined）。

**箭头函数没有自己的 this**——它沿用定义处外层的 this，且无法被 call 改变。这不是缺陷而是解药：回调里需要"外层的 this"时，箭头函数天然正确：

```js
const timer = {
  seconds: 0,
  start() {
    setInterval(() => { this.seconds++ }, 1000)  // 箭头函数：this 沿用 start 的
  },
}
```

类字段 + 箭头函数也是常见组合（React 时代的老朋友）：把方法绑定死在实例上。

## 闭包：函数记住它的出生地

闭包 = 函数 + 它定义时所处的作用域。即使外层函数已经返回，内层函数依然能访问外层的变量：

```js
function makeCounter() {
  let count = 0                 // 被"关"进返回的函数里
  return { inc: () => ++count, get: () => count }
}
const c = makeCounter()
c.inc()
c.get()                         // 1——外部无法直接改 count
```

这是 JS 最重要的机制，没有之一。它实现了**私有状态**（上面的 count 从外部摸不到）、**工厂函数**（第 4 章 class 出现之前的标准封装手段）、**柯里化与偏函数**、以及一切"注册回调"型 API 的基础。连模块系统里"模块只初始化一次"的语义，底层也是闭包。

闭包的代价同样要懂：被关住的变量不会释放，**闭包引用大对象会延长其生命周期**——回调里随手引用一个大数组，它就活在回调活着的那一刻。

## 踩坑提示

- 循环 + `var` + 回调是经典事故：所有回调共享同一个 var，打印的全是最后一个值——`let` 天生按轮次新建绑定，换了就好（第 1 章练习验证过）。
- 把对象方法拆出来单独传（`setTimeout(obj.method)`）会丢 this，需要 `bind(obj)` 或包一层箭头函数。
- 在循环里创建闭包并引用循环变量时，先想清楚"每个闭包要的是各自的值还是同一个值"。

## 练习

1. 写一个 `once(fn)`：返回的新函数只执行原函数一次，之后调用返回缓存结果（闭包存状态）。
2. 写 `memoize(fn)`：按参数缓存计算结果，用 Map 存。
3. 用箭头函数修复一个丢失 this 的回调，再用 bind 修一次，对比两种写法。
