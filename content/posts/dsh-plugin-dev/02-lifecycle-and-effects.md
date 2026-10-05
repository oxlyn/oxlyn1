---
title: "DSH 插件开发 · 第 2 章：生命周期与 effect"
description: "effect 是 Cordis 的心智模型核心：通过 ctx 做的注册会自动跟随插件生灭，fiber 状态机让卸载可观测、可递归、可异步。"
publishDate: 2026-09-28T14:00:00
tags: ["dsh", "cordis", "教程"]
---

> 本文对应官方教程[第 2 章：生命周期与 effect](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/02-lifecycle-and-effects)，示例代码在其基础上改编。

**学习目标**：理解 effect 的自动清理机制和 fiber 状态机，学会手动管理子插件。

## 为什么需要 effect

插件不是启动后就永远活着的。Cordis 插件可能因为以下原因被卸载：

- 用户修改了配置；
- 热重载（第 6 章）；
- 调用方显式释放资源；
- 它依赖的服务消失了（第 3 章）。

如果注册定时器、监听器、子进程时要手动记清理函数，插件作者十有八九会漏。Cordis 的解法是把"注册"和"随生命周期清理"绑死：**凡是通过 `ctx` API 建立的注册都是 effect（副作用），所属插件被卸载时自动回收**。

## ctx.effect：显式的资源管理

`ctx.effect` 接受一个建立资源的函数和一个清理函数：

```ts
export function apply(ctx: Context) {
  ctx.effect(
    (ctx) => {
      const timer = setInterval(() => ctx.log('tick'), 1000)
      return timer
    },
    (timer) => clearInterval(timer),
  )
}
```

要点：`ctx.effect(scope, dispose)` 中 `scope` 的返回值会传给 `dispose`。插件卸载时，`dispose` 一定会被调用——不需要你记得在某个 `process.on('exit')` 里打扫。

其实前面两章你已经"用过" effect 了：`ctx.on()` 注册的事件监听、`ctx.plugin()` 挂载的子插件、服务与 registry 的注册，底层全都是 effect。这就是为什么框架能保证"插件一卸，注册全消"——所有入口殊途同归。

## fiber：插件的生命周期载体

每个插件实例在框架内部对应一个 **fiber**（纤程）。它有明确的状态机：

```
PENDING → LOADING → ACTIVE
                   ↘ UNLOADING → DISPOSED
        （任意阶段出错 → FAILED）
```

- `PENDING`：已声明但还没就绪——典型原因是依赖的服务还没出现（第 3 章）；
- `LOADING`：`apply` 正在执行；
- `ACTIVE`：正常运行；
- `UNLOADING` → `DISPOSED`：正在清理 → 已清理完毕；
- `FAILED`：加载或运行失败。

`ctx.plugin()` 返回子插件的 fiber，`fiber.dispose()` 触发卸载——并且是**递归**的（子插件的子插件一起卸）和**异步感知**的（等所有异步清理真正完成）。

```ts
export function apply(ctx: Context) {
  const fiber = ctx.plugin(require('./child'))
  // 稍后：
  // await fiber.dispose()
}
```

## 卸载顺序：逆序 + 并发

多个 effect 同时存在时，卸载按**注册的逆序**执行——后建立的先清理，和栈的出栈顺序一致（申请锁的顺序反过来释放，才不会死锁）。多个异步 disposer 之间是**并发**执行的，互不等待。

动手验证顺序：注册三个 `ctx.effect`，各自 `console.log` 标记建立与清理，然后 `fiber.dispose()`，观察输出次序。

## 踩坑提示

- 在 `apply` 里绕过 `ctx` 直接 `setInterval` / `addEventListener`，框架帮不了你——泄漏的定时器会活过插件的生命周期。
- `apply` 是异步函数没问题，但 `PENDING` ≠ `LOADING`：如果插件卡在等依赖，fiber 会停在 `PENDING`，`apply` 根本没开始跑。
- `fiber.dispose()` 返回 Promise，生产代码记得 `await`，测试代码里忘了 await 会出现"看似卸载了其实没卸干净"的假象。

## 练习

1. 写一个插件注册一个 `setInterval`，用 `ctx.effect` 提供清理函数，手动 `dispose` 后确认不再打印。
2. 在同一个插件里注册两个 effect，观察清理顺序是否为逆序。
3. 写两个插件，父插件用 `ctx.plugin` 挂载子插件，卸载父插件后确认子插件也被清理。
