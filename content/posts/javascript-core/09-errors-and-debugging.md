---
title: "JavaScript 核心入门 · 第 9 章：错误处理与调试"
description: "try/catch 的适用边界、异步错误的捕获时机、自定义 Error 与一套定位问题的调试流程。"
publishDate: 2026-07-04T09:00:00
tags: ["javascript", "教程"]
---

> 本文对应 MDN 指南[控制流与错误处理](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)。

**学习目标**：分清"该接的错误"与"该崩的 bug"，掌握异步错误的捕获，建立系统性的调试流程。

## 两种异常，两种策略

运行期错误分两类，策略完全不同：

- **预期内错误**（输入不合法、网络失败、文件不存在）：用 try/catch 接住，转化为正常分支处理；
- **程序 bug**（undefined 上取属性、逻辑算错）：catch 住反而**掩盖问题**，让它崩出来暴露才是正确做法。

`throw` 可以抛任何值，但**只抛 Error 实例（或其子类）**：Error 自带 stack 和 message，`catch (e)` 里的 `e.message`、`e.stack` 是定位问题的全部线索。自定义错误用继承（第 4 章）：

```js
class ValidationError extends Error {
  constructor(field) {
    super(`字段不合法: ${field}`)
    this.name = 'ValidationError'
    this.field = field
  }
}

try {
  throw new ValidationError('email')
} catch (e) {
  if (e instanceof ValidationError) {
    // 预期内：走业务分支
  } else {
    throw e                      // 不是我的错，继续往上抛——不要吞
  }
}
```

"只接认识的错误、其余 rethrow"是 try/catch 最重要的纪律。无差别 `catch (e) {}`（吞错误）是排障时最痛的反模式——问题没消失，只是没人看见了。

## 异步错误：捕获的时机决定成败

同步 try/catch 接不住异步错误——抛出时 try 块早就执行完了：

```js
try {
  setTimeout(() => { throw new Error('晚到') }, 100)   // catch 接不住
  fetch('/api').catch(() => {})                        // Promise 靠 .catch
} catch (e) {}

try {
  await fetch('/api')            // await 把 rejection 变成同步 throw
} catch (e) {
  // 接得住——async/await 在错误处理上全面占优
}
```

第 6 章的链条语义在这里兑现：**Promise 链上的错误沿链传递到最近的 catch**，async 函数里 await 什么就要在什么的作用域里 try。裸飞的 Promise（创建后没人 await 也没 .catch）会变成 unhandled rejection——现代 Node/浏览器都会全局报这种错，见到就修，别当噪音。

## 调试：从现象到根因

一套稳定的排查流程，比任何单个技巧都值钱：

1. **复现**：找到稳定触发路径，缩小成最小用例；
2. **断点优先于 console.log**：DevTools/Node inspector 里 `debugger` 语句或 Sources 面板断点，直接看当时的作用域、调用栈——比盲打日志快一个量级；
3. **读 stack trace**：从上往下第一条**你自己代码**的帧，才是离根因最近的地方（node_modules 里的帧通常只是路过）；
4. **二分定位**：注释/插桩收缩可疑区间，一次对半砍；
5. **修完写测试**：这个 bug 的最小用例就是现成的回归测试。

生产环境的错误要带上上下文再上报：`e.stack`、入参摘要、版本号——只有 message 的错误报告等于没报。

## 踩坑提示

- catch 里只 `console.log(e)` 然后继续跑，调用方以为成功——上层永远看不到失败。
- `e instanceof Error` 在跨 realm（iframe/worker）时会失效，用 `e.name` 或 Duck 判断更稳。
- 把 stack 里最上面一行当根因——那只是抛出点，根因往往在下面几帧你自己代码的调用链上。

## 练习

1. 给第 7 章 pool 练习加上错误策略：预期错误（自定义 NotFoundError）走重试，其他直接抛。
2. 故意写一个 unhandled rejection，观察 Node/控制台的全局报错输出。
3. 在 DevTools 里对一个 bug 打条件断点（第 N 次命中才停），体会断点相对日志的效率差。
