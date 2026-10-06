---
title: "JavaScript 核心入门 · 第 6 章：事件循环与 Promise"
description: "单线程如何做到非阻塞：调用栈、任务队列与事件循环，Promise 的链式与组合。"
publishDate: 2026-05-14T09:00:00
tags: ["javascript", "教程"]
---

> 本文对应 MDN 指南[使用 Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Using_promises) 与[执行模型（事件循环）](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Event_loop)。

**学习目标**：理解"单线程 + 事件循环"的运行模型，掌握 Promise 的生命周期、链式与组合。

## 单线程，但不阻塞

JS 只有一条调用栈——同一时刻只执行一段代码。它还能同时等十几个网络请求，靠的是**宿主环境**（浏览器/Node）提供的异步能力：耗时操作交给环境，完成后把回调排进队列，等调用栈空了再由**事件循环**取出来执行。

由此推出两条铁律：

1. **同步代码永远优先**——`while(true)` 一行就能冻结整个页面，因为事件循环再也轮不到队列；
2. **异步回调永远在当前同步代码全部跑完之后**——`setTimeout(fn, 0)` 不是"马上执行"，是"栈空了尽快执行"。

任务队列还分两层：**微任务**（Promise 回调）与**宏任务**（setTimeout、I/O）。每轮事件循环把当前宏任务跑完后，会**清空全部微任务**才进下一轮。所以 Promise.then 总比 setTimeout(0) 先执行。

```js
setTimeout(() => console.log('宏'), 0)
Promise.resolve().then(() => console.log('微'))
console.log('同步')
// 输出：同步 → 微 → 宏
```

## Promise：未来的值

Promise 是"异步结果的占位符"，三种状态：pending → fulfilled / rejected，**状态一旦落定不可更改**。它比回调函数的本质优势是**可组合**——回调嵌套会变成金字塔，Promise 是链条：

```js
fetch('/api/posts')                    // 返回 Promise<Response>
  .then(res => {
    if (!res.ok) throw new Error(res.status)   // 抛错 = 转入 rejected
    return res.json()                  // 返回 Promise，链条会等待它
  })
  .then(posts => posts.length)
  .catch(err => ({ error: String(err) }))      // 捕获链条上任何一环的错误
  .finally(() => console.log('收尾'))
```

链式的两个关键语义：**then 里返回的 Promise 会被自动等待**（所以能串异步步骤），**错误沿链条向后传递直到最近的 catch**（所以一处 catch 兜底全链）。

## 组合：并发的四种姿势

多个 Promise 的编排有一组标准工具：

```js
await Promise.all([p1, p2, p3])        // 全成功才行，一个失败全失败
await Promise.allSettled([p1, p2])     // 永不拒绝，返回每个的状态
await Promise.race([p1, timeout(500)]) // 第一个落定的说了算（超时控制的经典用法）
await Promise.any([p1, p2])            // 第一个成功的获胜
```

`Promise.all` 的 fail-fast 语义要记牢：数组里任何一个 reject，整体立刻 reject——**已经成功的那些结果会丢失**，需要全部结果时用 `allSettled`。

## 踩坑提示

- 忘记 return：then 里调了异步函数却没 `return`，链条不会等它，下一环拿不到结果也不报错——async/await（第 7 章）能根治这个坑。
- 在 then 里新建 Promise 却把错误抛在里面又不在链上，形成"断链"。
- 微任务里再排微任务会饿死宏任务（同理无限递归 then）——浏览器会报错，Node 会告警。

## 练习

1. 写一个 `timeout(ms)` 工具：返回一个 ms 后 reject 的 Promise，与请求 race 实现超时。
2. 用 `allSettled` 并发请求三个可能失败的接口，输出每个的成功/失败摘要。
3. 在控制台写一组同步 + 微任务 + 宏任务的输出题（三行 console），先猜后跑验证执行顺序。
