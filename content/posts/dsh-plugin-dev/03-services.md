---
title: "DSH 插件开发 · 第 3 章：服务"
description: "Service 类 + declare module 类型合并 + inject 依赖注入：harness 内部的组织方式。"
publishDate: 2026-09-29T14:00:00
tags: ["dsh", "cordis", "教程"]
---

> 本文对应官方教程[第 3 章：服务](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/03-services)，示例代码在其基础上改编。

**学习目标**：学会提供和消费具名服务，理解 PENDING 状态与动态重连。

## 服务是什么

**服务（service）是插件提供的、其他插件通过 `ctx` 消费的具名能力**。在 harness 里，`ctx.tools`、`ctx.llm`、`ctx.agents` 全都是服务——第 7 章注册工具用的 `ctx.tools` 就是这么来的。

消费方只需要在 `inject` 里写一个名字，不关心也不必关心是哪个插件在提供。这层间接让"换实现"变得零成本：只要新插件提供同名服务，消费方一行不改。

## 提供一个服务

服务通常用 `Service` 基类编写，构造时把自己绑定到 ctx 上的一个名字：

```ts
// counter.ts
import { Service, Context } from '@cordisjs/core'

export class CounterService extends Service {
  count = 0
  increment() { return ++this.count }
}

declare module '@cordisjs/core' {
  interface Context {
    counter: CounterService
  }
}

export function apply(ctx: Context) {
  ctx.counter = new CounterService(ctx, 'counter')
}
```

三个关键点：

1. **`super(ctx, 'counter')`** 的第二个参数是服务名，也是全局命名空间里的键；
2. **`declare module` 类型合并**把 `counter` 挂进 `Context` 接口——之后任何文件里写 `ctx.counter` 都有完整类型提示，这是 Cordis 开发体验的核心；
3. 赋值语句 `ctx.counter = ...` 本身就是一次 effect 注册，插件卸载时服务自动移除。

## 消费：inject

别的插件要用这个服务，导出 `inject`：

```ts
export default {
  name: 'uses-counter',
  inject: ['counter'],
  apply(ctx) {
    ctx.log('current count:', ctx.counter.count)
  },
}
```

进入本插件 `apply` 时，`ctx.counter` **保证已就绪**——这是 inject 的承诺。如果 `counter` 服务还没被提供，本插件会停在 `PENDING` 状态等待，而不是拿着 `undefined` 崩溃。

## 可选依赖与动态重连

两个进阶行为：

**可选依赖**：不是硬需求的服务用 `ctx.get('name')` 拿，拿不到就返回 `undefined`，不会让插件卡在 PENDING：

```ts
apply(ctx) {
  const maybe = ctx.get('some-optional-service')
}
```

**动态重连**：如果 `counter` 服务被卸载，所有 inject 了它的插件会被**自动卸载**；等服务重新出现，这些插件又会**自动重新加载**。依赖是活的，不是启动时对一次表。官方教程把这套机制称为 live dependency tracking——对写热重载友好的插件至关重要。

## 命名空间的代价

服务的名字空间是**扁平**的：全局只有一个 `counter`。两个无关的插件都想叫 `logger`，后到的会出问题。harness 官方的做法值得模仿——用带所有者的长名字（如 `dsh.tools`）或至少加前缀。给自己的服务起名时，当作给全局变量命名一样慎重。

## 踩坑提示

- 忘写 `declare module` 不会报错，但 `ctx.counter` 会变成 `any`——类型合并是给自己用的，一定别漏。
- `inject` 写错服务名不会立刻报错，插件只会永远 PENDING（第 6 章讲怎么诊断）。
- 服务构造函数里不要访问别的服务——构造期依赖还没建立，需要的服务放到 `start()` 生命周期钩子里拿。

## 练习

1. 提供一个 `store` 服务（内存 KV），再写一个消费插件 inject 它并调用。
2. 注释掉提供方插件的组合项，观察消费插件停在 PENDING；恢复后确认它自动复活。
3. 给服务起个带前缀的名字，体会全局命名的约束。
