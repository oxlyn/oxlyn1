---
title: "DSH 插件开发 · 第 4 章：事件与分发模式"
description: "从 emit 到 waterfall：Cordis 的五种事件分发模式，以及 harness 靠它实现工具结果、模型请求与审批流转。"
publishDate: 2026-09-21T09:00:00
tags: ["dsh", "cordis", "教程"]
---

> 本文对应官方教程[第 4 章：事件](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/04-events)，示例代码在其基础上改编。

**学习目标**：掌握事件的声明/发出/监听，分清五种分发模式的适用场景，理解 waterfall 的"必须调用 next"纪律。

## 服务是调用，事件是广播

服务解决"我知道要找谁"，事件解决"我不知道谁在听"。发出方只负责把事情喊出去，监听方各自响应——工具执行结果、模型请求、审批决定，在 harness 里都以事件流转。

## 声明、发出与监听

事件表通过 `Events` 接口的类型合并来扩展。定义一个自己的事件：

```ts
import { Context, Events } from '@cordisjs/core'

declare module '@cordisjs/core' {
  interface Events {
    'my:alert': (message: string) => void
  }
}

// 发出方
ctx.emit('my:alert', '服务重启了')

// 监听方（同样是 effect，随插件卸载自动移除）
ctx.on('my:alert', (message) => {
  ctx.log('收到警报:', message)
})
```

事件名建议带命名空间前缀（`my:`），和第 3 章的服务命名一个道理——扁平空间，先到先得。

## 五种分发模式

同一个事件表，Cordis 提供五种发出方式，区别在于**等不等、等多久、要不要返回值**：

| 方法 | 语义 | 典型场景 |
| --- | --- | --- |
| `ctx.emit(name, ...args)` | 同步通知，不等待 | 日志、埋点这类"喊完就走" |
| `ctx.parallel(name, ...args)` | 并发等所有监听器完成 | 要确认所有方都处理完 |
| `ctx.serial(name, ...args)` | 按注册顺序逐个等 | 后面的监听器依赖前面的副作用 |
| `ctx.bail(name, ...args)` | 第一个非空返回值短路 | "谁能处理？找到就停" |
| `ctx.waterfall(name, state, next)` | 中间件链传递状态 | 请求处理管线 |

`bail` 的直觉是"责任链"：多个插件都能处理某类请求，谁先返回非空结果就采用谁的。

## waterfall：harness 的动脉

`waterfall` 值得单独一章的待遇，因为 harness 最核心的流程都建在它上面：**Agent 的请求循环、审批请求的流转**，本质都是一串监听器依次加工状态、决定放不放行。

```ts
ctx.waterfall('agent/request', session, async (session) => {
  // 拿到的 session 已被前面的监听器加工过
  return session
})
```

两条铁律：

1. **观察型监听器必须调用 `next()`**。你的监听器如果只是"看看"，末尾一定要 `return next()`，否则事件链在你这里断掉，后续监听器和最终处理全部失联——这是 waterfall 类框架（Koa、connect 同款）最经典的坑。
2. **短路即否决**。不调 `next` 直接返回值，等于宣称"这个请求我处理完了/我否决了"。审批插件就是靠"不调 next 并返回拒绝"实现一票否决的。

## 踩坑提示

- 用错模式：需要确认完成的场景用了 `emit`（不等结果），是典型的时序 bug 来源。判断标准就一条：发完之后要不要"确定所有人都做完了"。
- `waterfall` 监听器里忘了 `return next()`，下游全哑——症状是"某个功能突然不工作"，很难联想到是自己新加的监听器断了链。
- 事件参数是按引用传的，监听器里改了 session 对象，后面所有人都看得到——这正是 waterfall 的工作方式，但用 `emit`/`parallel` 时要小心共享可变状态。

## 练习

1. 定义一个 `my:audit` 事件，两个插件分别监听，用 `parallel` 发出并确认两个都完成。
2. 实现一个 `bail` 事件：三个监听器只有一个认识这种消息，验证短路行为。
3. 写两个 `waterfall` 监听器加工同一个对象，故意让第一个不调 `next()`，观察第二个是否被执行。
