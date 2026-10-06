---
title: "Rolldown 入门：Rust 时代的打包器与 Vite 8 的引擎"
description: "Rolldown 系列教程总览：统一 Vite 引擎的由来、核心特性、Rollup 迁移、OXC 转换与 Vite 8 升级实战。"
publishDate: 2026-06-25T09:00:00
tags: ["rolldown", "vite", "前端工程化", "教程"]
---

[Rolldown](https://rolldown.rs/) 是 Vite 团队用 Rust 写的打包器：**一个工具取代 Vite 旧引擎的三件套**（esbuild 的预构建与转换 + Rollup 的打包）。[Vite 系列第 1 章](/posts/vite-dev/01-why-vite.md)预告过它——本系列把它讲透：为什么造、怎么用、怎么从 Rollup 迁移，以及 2026 年 3 月 Vite 8 把它设为默认引擎之后，每个 Vite 项目要面对的实际变化。

> 内容依据 [Rolldown 官方文档](https://rolldown.rs/guide/introduction)与 Vite 官方迁移指南整理，代码示例均为原创。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：Rolldown 是什么](/posts/rolldown-guide/01-what-and-why/) | 定位、动机、性能数字 | [Introduction](https://rolldown.rs/guide/introduction) |
| [第 2 章：快速上手](/posts/rolldown-guide/02-getting-started/) | 独立使用、CLI、REPL | [Getting Started](https://rolldown.rs/guide/getting-started) |
| [第 3 章：核心特性](/posts/rolldown-guide/03-core-features/) | 转换、解析、interop、define/inject | [Notable Features](https://rolldown.rs/guide/notable-features) |
| [第 4 章：插件钩子过滤器](/posts/rolldown-guide/04-plugin-hook-filters/) | Rust 侧过滤、跨边界开销 | [Why Plugin Hook Filter](https://rolldown.rs/in-depth/why-plugin-hook-filter) |
| [第 5 章：从 Rollup 迁移](/posts/rolldown-guide/05-rollup-migration/) | 兼容范围、配置对照、差异清单 | [Troubleshooting](https://rolldown.rs/guide/troubleshooting) |
| [第 6 章：代码分割](/posts/rolldown-guide/06-code-splitting/) | 自动分割、advancedChunks | [Manual Code Splitting](https://rolldown.rs/in-depth/manual-code-splitting) |
| [第 7 章：OXC 转换](/posts/rolldown-guide/07-oxc-transforms/) | TS/JSX 转译、压缩、降级 | [Module Types](https://rolldown.rs/in-depth/module-types) |
| [第 8 章：rolldown-vite](/posts/rolldown-guide/08-rolldown-vite/) | Vite 7 的尝鲜通道与回滚 | [Vite 7 Rolldown 指南](https://v7.vite.dev/guide/rolldown) |
| [第 9 章：升级 Vite 8 实战](/posts/rolldown-guide/09-vite8-migration/) | 默认引擎后的迁移清单 | [v7→v8 迁移](https://vite.dev/guide/migration) |
| [第 10 章：生态与展望](/posts/rolldown-guide/10-outlook/) | VoidZero 工具链愿景、跟与不跟 | [Bundler API](https://rolldown.rs/apis/bundler-api) |
| [附录：速查](/posts/rolldown-guide/11-appendix/) | 命令、配置、报错关键词表 | — |

## 与 Vite 系列的衔接

| Vite 系列讲过的 | 本系列接续 |
| --- | --- |
| [第 1 章](/posts/vite-dev/01-why-vite.md)："Vite 7 起引入 Rolldown 作为实验引擎" | 第 1、8 章：它如何走到 Vite 8 默认 |
| [第 5 章](/posts/vite-dev/05-plugins.md)（Rollup 插件接口） | 第 4、5 章：兼容性范围与 hook filter |
| [第 9 章](/posts/vite-dev/09-optimization.md)（manualChunks） | 第 6 章：advancedChunks 继任者 |
| [第 10 章](/posts/vite-dev/10-debugging-migration.md)（升级节奏） | 第 9 章：Vite 8 迁移实战 |

## 环境准备

- **独立使用**：`npm i -D rolldown`，CLI 或 JS API 打包任意项目；
- **Vite 8+**：什么都不用做——Rolldown 已经是默认引擎；
- **Vite 7 尝鲜**：`"vite": "npm:rolldown-vite@latest"` 别名替换（第 8 章详述）；
- 在线体验：[REPL](https://repl.rolldown.rs/)。

## 遗留问题

- 原生 HMR 的实现细节、Builtin Plugins 全表以官方 [builtin-plugins](https://rolldown.rs/builtin-plugins/) 为准。
- WASM 版本（非 Node 环境运行）的性能与限制未展开。
