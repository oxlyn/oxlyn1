---
title: "Rolldown 入门 · 第 7 章：OXC 转换"
description: "OXC 生态：transformer 与 minifier 如何取代 babel/esbuild/SWC，降级与装饰器注意点。"
publishDate: 2026-06-08T09:00:00
tags: ["rolldown", "vite", "前端工程化", "教程"]
---

> 本文对应官方文档[Module Types](https://rolldown.rs/in-depth/module-types)与 [OXC](https://oxc.rs/) 文档。

**学习目标**：认识 OXC 工具族在 Rolldown 里的角色，掌握 target 降级配置，知道哪些转译场景需要外援。

## OXC：Rust 化的"语法处理全家桶"

Rolldown 的转译与压缩不是自研闭环，而是交给同门兄弟 **OXC**（Oxc 项目：Rust 写的 JS 工具集）：

| OXC 组件 | 取代的旧世界工具 | 在 Rolldown 里的角色 |
| --- | --- | --- |
| oxc-parser | @babel/parser、acorn | 全部语法解析 |
| oxc-transform | esbuild transform、babel 预设、SWC | TS/JSX/语法降级 |
| oxc-minifier | esbuild minify、terser | 代码压缩 |

对使用者的意义：**转译与压缩从"配置链"变成"编译器开关"**——[Vite 第 3 章](/posts/vite-dev/03-build-and-env.md)的 `esbuild` 配置块、老项目的 babel.config、swc 配置文件，在 Rolldown 世界收敛为 output 的 `target`：

```ts
output: {
  target: 'es2020',      // 降级目标：高于目标的语法自动转换
}
```

性能顺位（官方基准排序）：Rolldown+OXC 一体化 > esbuild > SWC > babel——不只快，还省掉"同一份代码被多个解析器重复解析"的浪费（babel 链的经典开销）。

## 转换的范围与例外

内建转换覆盖：TypeScript（含最新语法）、JSX/TSX、类字段/可选链等**语法降级**到 target。**刻意不覆盖**的也有一条明确的线：**TC39 装饰器（实验性 proposal 阶段的 decorators）不做降级**——这是 Vite 8 迁移期最著名的兼容性坑（老 Angular/Aurelia/Legacy MobX 项目踩中），官方解法是装饰器密集的代码保留 Babel 外援或升级到标准化后的装饰器实现（第 9 章迁移清单的重头项）。

判断自己项目有没有踩线：搜 `experimentalDecorators` 的 tsconfig 开关、`@Component`/`@customElement` 类装饰器——有，就进第 9 章的迁移风险清单。

## CSS 与其他模块类型

CSS 的压缩在 rolldown-vite/Vite 8 里交给 **Lightning CSS**（Rust 化的另一员，替代 postcss 压缩链）；`?raw`、JSON、文本等[模块类型](https://rolldown.rs/in-depth/module-types)（[第 2 章](/posts/rolldown-guide/02-getting-started.md)）由 Rolldown 的类型管线内建处理。PostCSS 生态（Tailwind v3 时代的 autoprefixer 等）依旧可用——只是"压缩"这一步换了执行者。

## 独立使用 OXC

OXC 也提供独立 API（`transformWithOxc` 是 rolldown-vite 对 `transformWithEsbuild` 的接任者）——一次性转换代码片段时用：

```ts
import { transform } from 'rolldown'   // 或独立包 oxc-transform

const { code } = transform('a.ts', source, { /* tsx、target 等 */ })
```

写代码生成器、 playground、in-browser 转换工具时，这是 esbuild.transform 的直接替身。

## 踩坑提示

- target 写太新，老浏览器直接白屏——对照自己项目的 browserslist 语义设 target（语义有差但意图对应）。
- 从 babel 迁移后"某个语法插件没了"——先查 OXC 是否已内建该语法（多数已内建），内建没有的（如装饰器降级）再补外援。
- minify 后行为异常，先做**不压缩构建**对照（minify: false）——把问题切到"转换侧"还是"压缩侧"。

## 练习

1. 把一个项目的 target 从 esnext 降到 es2018，diff 产物看哪些语法被降级。
2. 检查自己 tsconfig 是否有 experimentalDecorators——有的话记进第 9 章的风险清单。
3. 用 minify: false 复现一次"压缩疑似 bug"的排查流程。
