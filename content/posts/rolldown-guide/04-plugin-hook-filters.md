---
title: "Rolldown 入门 · 第 4 章：插件钩子过滤器"
description: "hook filter：把'要不要处理'的判断下沉到 Rust 侧，消掉 JS↔Rust 桥接开销。"
publishDate: 2026-06-05T09:00:00
tags: ["rolldown", "vite", "前端工程化", "教程"]
---

> 本文对应官方文档[Why Plugin Hook Filter](https://rolldown.rs/in-depth/why-plugin-hook-filter)。

**学习目标**：理解 hook filter 解决的性能问题，学会在插件里声明过滤器，会用 withFilter 包装存量插件。

## 问题：插件调用的桥接税

Rolldown 的核心是 Rust，而插件生态是 JavaScript——插件钩子每次被调用都要**跨一次 Rust↔JS 边界**（序列化参数、进 JS 引擎执行、把结果传回来）。Rollup 时代这个调用全在 JS 里，成本可忽略；Rust 化之后，**"调了一个不值得调的钩子"变成了主要开销**：

```ts
// 低效：每个模块都要跨边界问一遍
{
  name: 'svg-transform',
  transform(code, id) {
    if (!id.endsWith('.svg')) return null    // 999/1000 次白跑
    return doHeavyWork(code)
  },
}
```

## 解法：把判断声明给 Rust

**hook filter** 让插件把"处理哪些文件"的判断**声明式地下沉到 Rust 侧**——Rust 直接跳过不匹配的模块，JS 钩子只在真正的目标上执行：

```ts
{
  name: 'svg-transform',
  transform: {
    filter: { id: /\.svg$/ },        // Rust 侧过滤：正则/字符串/数组
    handler(code, id) {
      return doHeavyWork(code)       // 只有匹配的模块才会进来
    },
  },
}
```

filter 支持 `id`（文件路径）、`code`（内容）维度的匹配，值可以是正则、精确字符串或它们的数组——**语义与钩子里的 if 完全等价，位置从 JS 移到了 Rust**。这是 Rolldown 对插件模型的实质增强，也是它性能故事的一部分：生态插件逐步改造后，"万插件齐跑"的浪费消失。

## withFilter：存量插件的零改造包装

改不了源码的第三方插件，用官方的 `withFilter` 包装——语义同上，插件本身无感：

```ts
import { withFilter } from 'rolldown'

export default defineConfig({
  plugins: [
    withFilter(svgr(), { load: { id: /\.svg\?react$/ } }),
    withFilter(somePlugin(), { transform: { id: [/\.ts$/, /\.tsx$/] } }),
  ],
})
```

`withFilter(plugin, { hookName: filter })` 的第二参数按钩子名声明过滤——把它当"给老插件的 Rust 加速外挂"。

## 在 rolldown-vite / Vite 8 里的位置

[rolldown-vite](https://v7.vite.dev/guide/rolldown)（第 8 章）把这套机制带给 Vite 项目：文档明确建议**用 withFilter 包住重量级插件**以减少跨边界开销。Vite 8 默认引擎后，这成了性能调优的新维度——原来"少装插件"的建议，升级成"让每个插件都有 filter"。

## 踩坑提示

- filter 与 handler 内部的判断**要一致**：filter 放行了但 handler 又拒掉，无害；filter 漏放而 handler 处理——**钩子永远不执行**（静默失效），插件"不工作了"先查 filter。
- 过滤正则写太宽（`/./`）等于没过滤——性能收益归零但无报错。
- 不是所有钩子都值得 filter：`transform`/`load` 这类每模块都触发的钩子收益最大；只在构建末尾跑一次的钩子（renderChunk 除外，它也是每 chunk 触发）加 filter 意义有限。

## 练习

1. 给一个自己写的 transform 插件补上 filter，用 `console.time` 对比全量构建耗时。
2. 用 withFilter 包装一个第三方插件，故意写错 filter 正则，复现"静默失效"。
3. 在 REPL 里体会：给两个插件分别加 filter 前后的钩子调用计数差异。
