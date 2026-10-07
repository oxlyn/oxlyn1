---
title: "Node.js 核心入门 · 第 8 章：事件循环与并发模型"
description: "Node 事件循环的六个阶段、nextTick 与微任务时序、线程池与 worker_threads——单线程为什么够用、什么时候不够。"
publishDate: 2026-10-13T09:00:00
tags: ["nodejs", "教程"]
---

> 本文对应官方指南[《The Node.js Event Loop, Timers, and process.nextTick()》](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)与 [worker_threads](https://nodejs.org/docs/latest/api/worker_threads.html)。

**学习目标**：把 JS 系列的语言级事件循环升级到 Node 级——六个阶段、nextTick 的插队规则、线程池的分工，以及"什么时候必须上 worker"。

[《JavaScript 核心入门》第 6 章](/posts/javascript-core/06-event-loop-and-promises/)讲过通用模型：单线程 + 宿主提供的事件循环。Node 是那个宿主，这章拆它的内部。

## 六个阶段

libuv 的事件循环每一轮（tick）依次走过六个阶段，每个阶段消费一个队列：

```text
   ┌─ timers       ：到期的 setTimeout / setInterval 回调
   ├─ pending      ：系统级回调（如 TCP 错误）
   ├─ poll         ：取新 I/O 事件；没活时在此等待
   ├─ check        ：setImmediate 回调
   └─ close        ：关闭回调（如 socket 'close'）
        ↓ 每个宏任务跑完 → 清空微任务（Promise）→ nextTick 队列
```

时序题的最佳教材，在 REPL 里跑一遍：

```js
setTimeout(() => console.log("timeout"), 0)
setImmediate(() => console.log("immediate"))
Promise.resolve().then(() => console.log("promise"))
process.nextTick(() => console.log("nextTick"))
// 稳定输出：nextTick → promise → timeout → immediate
```

规则记忆：**nextTick 最先**（每步操作后立即清空，优先于 Promise 微任务），微任务次之，然后才是事件循环阶段。`setTimeout(0)` 和 `setImmediate` 在主模块里顺序"看缘分"（受进入循环时机影响），但在 I/O 回调内部 `setImmediate` 恒定先跑——官方推荐语义化选择：想要"本轮循环后立刻"用 `setImmediate`，想要"至少 N 毫秒"用 `setTimeout`。

## 单线程：一个服务员的全部哲学

所有 JS 回调跑在**同一个线程**上。好处：无锁、无死锁、上下文切换便宜，并发靠"事件驱动 + 非阻塞 I/O"——I/O 等 SCSI 磁盘、等网卡这些活儿交给操作系统与线程池，JS 线程只负责"谁好了调度谁"。代价也唯一：**任何同步计算都会冻结一切**：

```js
app.get("/report", (req, res) => {
  const result = crunchTenSeconds(req.query)   // CPU 密集：10 秒纯计算
  res.json(result)
})
// 这 10 秒里：所有请求排队，健康检查超时，keepalive 断开——单线程没有"别人"
```

同步 API 同罪：`readFileSync`、`crypto.pbkdf2Sync` 都会让整个服务停摆。它们只属于两处：CLI 启动早期、测试。

## 线程池与 worker_threads

重活有两条出路，分工明确：

**libuv 线程池**（默认 4 线程，`UV_THREADPOOL_SIZE` 可调）——内置模块的异步 API 用的就是它：`fs` 的 promises、`crypto` 的异步加密、`zlib` 压缩。你只要用异步版本，就已经"并行"了。

**worker_threads**——池子之外的真·多线程，给"JS 自己的计算"用：

```js
// main.js
import { Worker } from "node:worker_threads"

const worker = new Worker(new URL("./crunch-worker.js", import.meta.url), {
  workerData: { iterations: 1e9 },
})
worker.on("message", (r) => console.log("结果：", r))
worker.on("error", (err) => console.error(err))
```

```js
// crunch-worker.js —— 独立线程，阻塞也只阻塞自己
import { parentPort, workerData } from "node:worker_threads"

let sum = 0
for (let i = 0; i < workerData.iterations; i++) sum += i
parentPort.postMessage(sum)
```

判断标准一句话：**等 I/O 用异步，算得久开 worker**。大数据 JSON 序列化、图片处理、加密——先 benchmark 再上，worker 的启动与通信有成本。

## 踩坑提示

- `nextTick` 递归调用自己——事件循环永远进不了下一阶段，I/O 饿死（这也是它叫 next**Tick** 的警示）。
- worker 里 import 了主线程的内存——线程不共享 JS 对象，传数据靠 `postMessage` 结构化克隆或 `SharedArrayBuffer`。
- 用 `setTimeout(fn, 0)` 想"让出主线程"——零延迟有最小毫秒约束且排在阶段头，让出给 I/O 用 `setImmediate`。
- 以为 async 函数在多线程跑——async/await 只是调度语法，计算还在当前线程。

## 练习

1. REPL 里跑上面的四种回调实验，再把 `setTimeout` 换成 `setTimeout(fn, 100)` 观察顺序变化并解释。
2. 写 `/report` 接口，先用同步计算压测 `ab`/`hey`，再换成 worker 版，对比两种情况下 `/health` 的响应时间。
3. 打印 `process.memoryUsage()` 与 `UV_THREADPOOL_SIZE`，把线程池调成 2 跑 8 个并发 `pbkdf2`，观察总耗时变化。
