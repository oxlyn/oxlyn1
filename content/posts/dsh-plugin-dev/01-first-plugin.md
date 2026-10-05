---
title: "DSH 插件开发 · 第 1 章：第一个插件"
description: "从 apply 函数约定开始：三种插件形态、cordis.yml 组合根，以及两种截然不同的失败语义。"
publishDate: 2026-09-27T14:00:00
tags: ["dsh", "cordis", "教程"]
---

> 本文对应官方教程[第 1 章：你的第一个插件](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/01-first-plugin)，示例代码在其基础上改编。

**学习目标**：理解 Cordis 插件的加载模型，写出第一个能被运行时执行的插件。

## 插件就是一个函数

Cordis 对插件的要求低到令人意外：一个导出了 `apply` 命名函数的模块，就是插件。运行时加载模块后，会用一个**上下文对象**（context，惯用变量名 `ctx`）调用这个函数，插件的所有行为都通过 `ctx` 完成。

```ts
// hello.ts
import type { Context } from '@cordisjs/core'

export function apply(ctx: Context) {
  ctx.log('hello from cordis')
}
```

除了 `apply`，插件还可以导出 `name`——它不参与逻辑，只是给日志和诊断一个可读的标识：

```ts
export const name = 'hello'
```

没有 `name` 时框架会退回用模块路径，功能不受影响，但排查问题时可读性差很多，建议始终导出。

## 三种插件形态

同一个插件可以用三种写法表达，按需选择：

**1. 函数**（上面的形式）：最轻量，适合一段有副作用的初始化逻辑。

**2. 对象**：当插件需要 `inject`（依赖其他服务，第 3 章展开）或者想给 `apply` 传配置时使用：

```ts
export default {
  name: 'hello',
  inject: ['tools'],
  apply(ctx) {
    ctx.log('hello, with dependencies')
  },
}
```

**3. Service 子类**：插件本身要向别人提供具名服务时使用，第 3 章专门展开。

三种形态在框架内部会被归一化处理，所以没有优劣之分，只有场景之分。

## 组合根：cordis.yml

插件自己不会启动，启动它们的是组合文件 `cordis.yml`——它声明"这个运行时由哪些插件构成"：

```yaml
- ./hello.ts
- ./another-plugin.ts
```

列表项是模块路径，也可以指向 npm 包名（如官方教程里的 `@deepseek-ai/dsh-tools`）。运行时的启动流程是：

1. 读取 `cordis.yml`；
2. loader 逐项解析模块（支持 TS，配合 `--import tsx`）；
3. 对每个模块调用 `apply(ctx)`。

## 两种失败语义

这一节是我认为官方教程里最容易被忽略、又最有实用价值的部分。同样是"出问题"，两种情况的表现完全不同：

- **`apply` 执行时抛异常** → 整个运行时**崩溃退出**。启动阶段的错误被视为致命错误，宁可不起来也不带病运行。
- **模块无法解析**（路径写错、包没装）→ 只**记录日志**，其余插件照常启动。

这个设计值得体会：编译期/解析期的问题（文件丢了）被降级为可恢复，而用户代码在初始化时犯的错被升级为不可恢复。前者通常能通过修复组合文件解决，后者往往意味着插件有 bug，带病启动会让错误扩散到后续流程。

动手试一下两种情况，观察终端输出的差别，比读十遍文档记得牢。

## 踩坑提示

- `apply` 必须是**命名导出**（`export function apply`），`export default` 一个函数是不够的；对象形态才用 `export default`。
- 路径以 `./` 开头表示相对当前 `cordis.yml`，不带 `./` 会被当作包名去解析。
- 忘记 `--import tsx` 会得到一堆语法错误——Node 不认识 TS。

## 练习

1. 写一个 `hello` 插件，`apply` 里用 `ctx.log` 打印一句问候，加入 `cordis.yml` 跑通。
2. 故意把 `cordis.yml` 里的路径写错，观察"只记日志不崩溃"的行为。
3. 再故意在 `apply` 里 `throw new Error('boom')`，观察整个进程退出。
