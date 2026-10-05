---
title: "ArkTS 鸿蒙开发入门 · 第 9 章：并发模型"
description: "线程隔离与消息传递、TaskPool 自动线程池、@Concurrent/@Sendable 的使用规则。"
publishDate: 2026-07-28T09:00:00
tags: ["arkts", "harmonyos", "教程"]
---

> 本文对应官方文档 [TaskPool 简介](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/taskpool-introduction)与多线程开发指南。

**学习目标**：理解 ArkTS 的线程隔离模型，用 TaskPool 把耗时任务移出主线程，守住 UI 流畅线。

## 为什么需要多线程：主线程只有一条

和[JS 第 6 章](/posts/javascript-core/06-event-loop-and-promises.md)一样，UI 主线程一条栈——2 秒的 JSON 解析放主线程，界面就卡 2 秒。但 ArkTS 的并发与浏览器 Worker 有个关键差异：**跨线程不共享对象内存**，一切跨线程数据要么可序列化、要么标记为可共享（@Sendable）。没有 SharedArrayBuffer 的任性，换来的是不需要锁的心智模型——线程间通信一律**消息传递**。

## TaskPool：开箱即用的线程池

TaskPool 是官方封装的任务池：自动管理线程、自动调度、支持任务优先级与取消——**大多数场景不需要手写 Worker**：

```ts
import { taskpool } from '@kit.ArkTS'

@Concurrent
function parseHeavy(raw: string): number[] {
  const data: number[] = JSON.parse(raw)     // 在子线程执行
  return data.filter((n: number) => n > 0)
}

// 主线程：交给线程池，返回 Promise
async function run() {
  const result: number[] = await taskpool.execute(parseHeavy, bigJsonString)
  this.items = result                         // 结果回主线程再更新状态
}
```

要点：

- `@Concurrent` 标记的函数在**子线程**执行，入参出参可序列化（跨线程拷贝）；
- 函数必须是模块级或编译期确定的（不能传闭包里的临时函数——闭包捕获的上下文没法跨线程）；
- `execute` 返回 Promise，与[第 8 章](/posts/arkts-dev/08-async-network.md)的 async/await 无缝衔接。

适用判断：**耗时超过约 3ms 的纯计算**（解析、图片处理、加密、排序大数组）都值得进 TaskPool；I/O 类（网络、文件）系统已异步化，不必加线程。

## Worker：长驻线程的选项

任务**长生命周期、高频通信**（后台持续定位、音频处理）时用 Worker：手动创建、手动管理消息、随用随销毁。与 TaskPool 的取舍：

| | TaskPool | Worker |
| --- | --- | --- |
| 线程管理 | 系统池化，自动 | 手动创建销毁 |
| 通信 | execute 参数/返回值 | postMessage 持续通信 |
| 适用 | 一次性短任务 | 常驻长任务 |
| 数量上限 | 系统调度 | 有数量上限（内存成本） |

一句话：**短任务 TaskPool，长驻 Worker**，别为了"听起来高级"上 Worker。

## @Sendable：跨线程共享对象

消息传递每次都拷贝大对象有成本。对确需共享的对象，`@Sendable` 装饰的类允许跨线程传递引用——代价是类被约束成"数据容器"：方法受限、属性布局固定（[第 2 章](/posts/arkts-dev/02-arkts-vs-ts.md)布局不可变在并发场景的延伸）：

```ts
@Sendable
class ImageMeta {
  width: number = 0
  height: number = 0
}
```

能序列化就序列化（简单、安全），性能确有瓶颈再上 @Sendable。

## 踩坑提示

- TaskPool 函数里访问 UI 组件或主线程状态——不可能跨线程，返回数据后回主线程赋值。
- 子线程里 `new` 了 @Observed 类实例再传回来，状态代理不跨线程——在主线程重建实例。
- 忘记 await execute 的结果就更新 UI，拿到的是 Promise——又是[JS 第 7 章](/posts/javascript-core/07-async-await-and-concurrency.md)那条老纪律。

## 练习

1. 写一个 @Concurrent 函数对 10 万条数据排序，主线程与 TaskPool 各跑一次，用 Date.now() 对比 UI 掉帧感。
2. 给 TaskPool 任务加取消：连续搜索时取消上一次未完成的解析（taskpool 的 cancel 能力）。
3. 把第 8 章的 JSON 解析挪进 TaskPool，观察列表页打开耗时变化。
