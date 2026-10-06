---
title: "JavaScript 核心入门 · 第 7 章：async/await 与并发控制"
description: "async 函数就是 Promise：顺序写法的并发陷阱、Promise.all 批量化，以及信号量限流。"
publishDate: 2026-05-15T09:00:00
tags: ["javascript", "教程"]
---

> 本文对应 MDN 指南[使用 Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Using_promises)（async/await 与并发组合部分）。

**学习目标**：理解 async 函数的本质是 Promise，识别"顺序写法杀死并发"的陷阱，掌握批量化与限流。

## async 函数：Promise 的语法糖

`async` 函数永远返回 Promise——return 的值会被包装，抛出的错误变成 rejection。`await` 则在 Promise 落定前暂停整个 async 函数（不阻塞线程，只挂起这个函数的执行）：

```js
async function load() {
  const res = await fetch('/api/posts')   // 等待响应
  if (!res.ok) throw new Error(res.status) // throw = Promise reject
  return res.json()                        // return = Promise resolve
}
// load() 的返回值就是 Promise，调用方照旧 await 或 .then
```

第 6 章链式的 return 丢失、错误传递分散这些问题，在 await 写法里天然不存在——**异步代码获得了同步的线性可读性**，这正是 async/await 取代裸 .then 的原因。

## 陷阱一：把并发写成串行

await 只暂停**当前函数**，但多个 await 连排会变成串行：

```js
// 慢：串行，总耗时 = a + b
const a = await fetchA()
const b = await fetchB()

// 快：并发，总耗时 = max(a, b)
const [a2, b2] = await Promise.all([fetchA(), fetchB()])
```

判断标准：**后一个 await 依赖前一个的结果才串行；互不依赖就先发起、再统一 await**。`Promise.all` 接受的是"已经开始的 Promise"——所以 `Promise.all([fetchA(), fetchB()])` 里两个请求是立刻同时发出的，await 只是最后收口。

## 陷阱二：forEach 里的 await 没人等

`forEach(async item => await f(item))` 完全不等任何回调——forEach 不认 Promise。需要逐个（串行）就用 `for...of`，需要并发就用 `map + Promise.all`：

```js
// 串行：一个接一个
for (const id of ids) await loadOne(id)

// 并发：全量同时发
const results = await Promise.all(ids.map(loadOne))
```

## 并发控制：无限制 all 是事故源

`ids.map(load)` 一千个 id 就是一千个并发请求——打爆自己的服务。这时需要一个简易信号量：**最多 N 个任务在飞，完成一个补一个**：

```js
async function pool(items, worker, limit = 5) {
  const results = []
  let idx = 0
  const runners = Array.from({ length: limit }, async () => {
    while (idx < items.length) {           // 各 worker 从队列抢单
      const i = idx++
      results[i] = await worker(items[i])
    }
  })
  await Promise.all(runners)
  return results
}

// 最多 5 个并发的批量下载
const pages = await pool(urls, (u) => fetch(u).then(r => r.text()), 5)
```

几十行实现了 p-limit 类库的核心。要点是共享一个游标 `idx`：limit 个 runner 谁空谁取，结果按下标归位。

## 顺序保证与失败策略

- `Promise.all` 结果**按输入顺序**返回（哪怕完成顺序乱了），配 pool 时同样成立；
- 想要"全部做完，失败的不打断别人"，用 `allSettled` 再过滤 fulfilled；
- 需要"随时可取消"时要配合 `AbortController` 传递 signal——这是 Agent 工具链（[DSH 第 7 章](/posts/dsh-plugin-dev/07-into-the-harness/)的 execute signal）的标准姿势。

## 踩坑提示

- 忘 await 的 async 调用返回 Promise，代码"看起来执行了"实际没等——开 ESLint 的 no-floating-promises 类规则能抓。
- 循环里 await 后又修改外部共享变量，串行时安全、并发时竞态——并发版本要么结果按下标归位，要么用 Map 按键归位。
- async 函数里的 `try/catch` 能接住 await 的 rejection，但接不住"已经飞出去、没被 await 的" Promise。

## 练习

1. 写 `parallel vs serial` 的计时对比实验：三个 500ms 的假请求，测两种写法的总耗时。
2. 把 pool 改成 `allSettled` 语义：单个任务失败不影响整体，返回 { ok, value } 列表。
3. 用 AbortController 给 pool 加超时：整体 2 秒没完成就中止所有在飞任务。
