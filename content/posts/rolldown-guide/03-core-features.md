---
title: "Rolldown 入门 · 第 3 章：核心特性"
description: "转换、解析、interop、define/inject：取代 esbuild 的那部分能力盘点。"
publishDate: 2026-06-16T09:00:00
tags: ["rolldown", "vite", "前端工程化", "教程"]
---

> 本文对应官方文档[Notable Features](https://rolldown.rs/guide/notable-features)。

**学习目标**：盘点 Rolldown 内建能力的全景，理解每一项"取代了谁"。

## 特性全景：每一项都有出身

| 能力 | 旧世界的承担者 | Rolldown 内建 |
| --- | --- | --- |
| TS/JSX 转译、语法降级 | esbuild / babel / SWC | ✅ 基于 OXC（第 7 章） |
| 依赖解析（Node 风格） | Rollup + 插件 | ✅ Node 兼容解析内建 |
| ESM/CJS 互操作 | @rollup/plugin-commonjs | ✅ 内建 |
| 代码压缩 | esbuild minify / terser | ✅ 内建 minifier |
| 宏替换 | @rollup/plugin-replace | ✅ define |
| 依赖注入填充 | @rollup/plugin-inject | ✅ inject |
| 代码分割 | Rollup 原生 | ✅ 自动 + advancedChunks（第 6 章） |
| tree-shaking | Rollup 原生 | ✅ 同语义 |

[TS 第 8 章](/posts/typescript-core/08-modules.md)的 ESM/CJS 互操作难题（default 导出形状、循环引用行为）在 Rolldown 里是**内建语义**——打包 CJS 依赖不再需要装 commonjs 插件、调 interop 选项。

## define 与 inject

两个"编译期改写"能力，对应 vite 的 `define` 与老 webpack 的 ProvidePlugin：

```ts
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('1.2.0'),   // 字面量替换（第 3 章 env 同款纪律：要 JSON.stringify）
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  inject: {
    Promise: ['es6-promise', 'Promise'],        // 缺失全局的自动 import
  },
})
```

`define` 的三条老规矩原样适用：**替换的是语法树节点**（值要用 `JSON.stringify` 产出合法字面量）、只在匹配处替换（拼不出来的动态 key 无效）、替换发生在构建期（值进产物，别放秘密）。

## Node 兼容解析

`mainFields`、`exports` 字段、扩展名补全、目录 index——Rolldown 按 Node 的解析语义内建实现，`resolve.alias` 同样可用（[Vite 第 7 章](/posts/vite-dev/07-alias-and-types.md)的双轨纪律：rolldown 这条轨替代 vite 轨）。monorepo/包管理器符号链接的解析行为也与 Node 对齐。

## 平台预设与目标环境

输出给谁用，决定转换与格式：

```ts
export default defineConfig({
  platform: 'browser',     // browser / node / neutral
  output: {
    format: 'esm',
    target: 'es2020',      // 语法降级目标（第 7 章）
  },
})
```

`platform: 'node'` 时自动调整解析偏好（main 而非 browser 字段）；`neutral` 关闭平台假设（做通用库时用，[Vite 第 8 章](/posts/vite-dev/08-ssr-and-lib.md)lib 模式的 Rolldown 版）。

## 踩坑提示

- 从 Vite 配置搬 `define` 时忘了 JSON.stringify，产物语法错误——替换值必须是**完整的 JS 表达式字面量**。
- 特性状态在变（minify/HMR 曾长期 WIP）：以你安装版本的[官方文档](https://rolldown.rs/guide/notable-features)标注为准，别按记忆。
- 内建能力与插件重复（还装着 commonjs 插件）——先删插件，重复处理可能互相踩。

## 练习

1. 用 define 替换一个项目的 @rollup/plugin-replace，对比产物。
2. 打一个引 CJS 依赖的项目，验证"无 commonjs 插件"直接可用。
3. 把 platform 从 browser 切到 node，观察同一依赖解析到的入口差异。
