---
title: "Rolldown 入门 · 第 1 章：Rolldown 是什么"
description: "Vite 旧引擎的三件套裂缝、一个 Rust 工具的统一野心，以及 10~30 倍的性能从何而来。"
publishDate: 2026-06-02T09:00:00
tags: ["rolldown", "vite", "前端工程化", "教程"]
---

> 本文对应官方文档[Introduction](https://rolldown.rs/guide/introduction)与[Why Bundlers](https://rolldown.rs/in-depth/why-bundlers)。

**学习目标**：理解 Rolldown 的定位与动机，看清 Vite 旧引擎的结构性裂缝。

## Vite 旧引擎的三件套

[Vite 系列](/posts/vite-dev/)讲过 Vite 的架构：开发时 esbuild 做依赖预构建与转译，构建时 Rollup 打包。深挖一层，裂缝有三：

1. **两套行为**：esbuild 和 Rollup 对"同一份代码"的处理存在细微差异（模块解析、interop、压缩语义）——"开发好的上线坏"的又一来源（[Vite 第 3 章](/posts/vite-dev/03-build-and-env.md)差异表的深层原因）；
2. **三份心智**：esbuild 配置、Rollup 插件、（有的项目还有）SWC 转译——三套 API、三份文档、三份版本矩阵；
3. **性能天花板**：Rollup 是 JavaScript 写的，打包速度与项目体积同步恶化（[Vite 第 1 章](/posts/vite-dev/01-why-vite.md)的"保存焦虑"在 build 侧同样存在）。

## Rolldown：一个工具取代三个

Rolldown 用 Rust 重写了这整层：

- **性能**：官方基准——与 esbuild 同级，**比 Rollup 快 10~30 倍**；
- **兼容**：API 与插件接口**兼容 Rollup**——存量插件与配置基本直接可用，这是它区别于"又一个新打包器"的关键；
- **统一**：内建 TS/JSX 转译（取代 esbuild 的转换角色）、内建压缩（取代 esbuild minify）、内建 CJS 支持（取代 @rollup/plugin-commonjs）——Vite 从"三件套拼装"变成"单引擎驱动"；
- **为 Vite 而生**：HMR、按需编译等 Vite 需要但 esbuild/Rollup 不打算加的能力，原生内建。

时间线锚点（对照 [Vite 系列的表述](/posts/vite-dev/01-why-vite.md)）：Vite 7 时代（2025）Rolldown 通过 `rolldown-vite` 包提供**可选引擎**；**2026 年 3 月发布的 Vite 8 将 Rolldown 设为默认**——esbuild 与 Rollup 从 Vite 的依赖里退役（有 esbuild 专属用法的项目仍可自行安装）。第 8、9 章分别讲两条路径。

## 性能数字怎么读

"快 10~30 倍"要放进场景读：

- **冷构建**：大项目（几万模块）从分钟级到秒级——这是 87% 构建时间缩减这类迁移报告的主要来源；
- **压缩**：内建 minifier（基于 OXC，第 7 章）替代 esbuild minify 后，单独一步压缩的耗时也大幅下降；
- **WASM 版本**连 esbuild 的 WASM 构建都能胜出（Go 的 WASM 编译不如 Rust 原生优化）——非 Node 环境也能吃到性能。

但性能不是全部意义：**单一工具 = 单一行为语义**，dev 与 build 的差异被结构性消除（[Vite 第 3 章](/posts/vite-dev/03-build-and-env.md)那张差异表由此瘦身），插件生态只维护一份接口——这才是"统一"的工程价值。

## 定位澄清

- Rolldown 不是"给 Vite 用的内部工具"——它是**通用打包器**，独立 CLI/API 可用（第 2 章），也能当 **Rollup 的直接替代品**；
- 也不是"重写 webpack"——webpack 的 loader 生态与运行时特性（code splitting 语义差异、HMR API）不在兼容目标里，迁移 webpack 项目请走 [Vite 第 10 章](/posts/vite-dev/10-debugging-migration.md)的路线。

## 练习

1. 找一个用 Rollup 的老项目，用 Rolldown CLI 构建一次，对比耗时与产物。
2. 列出自己项目里"esbuild/Rollup/SWC 三件套"的痕迹（配置文件、依赖），画出替换后的样子。
3. 读官方 [Why Bundlers](https://rolldown.rs/in-depth/why-bundlers)，复述"为什么需要打包器"给一个非前端同事听。
