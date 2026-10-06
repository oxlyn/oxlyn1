---
title: "Rolldown 入门 · 第 2 章：快速上手"
description: "独立使用 Rolldown：安装、CLI、JS API、配置文件，与 Rollup 调用方式对照。"
publishDate: 2026-06-03T09:00:00
tags: ["rolldown", "vite", "前端工程化", "教程"]
---

> 本文对应官方文档[Getting Started](https://rolldown.rs/guide/getting-started)。

**学习目标**：脱离 Vite 独立使用 Rolldown，跑通 CLI 与 JS API 两种姿势。

## 安装与最小打包

```bash
npm i -D rolldown
```

```
src/
├── main.ts        # 入口：import { greet } from './greet.ts'
└── greet.ts       # 纯 TS，无需任何配置
rolldown.config.ts
```

```ts
// rolldown.config.ts
import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'src/main.ts',
  output: {
    dir: 'dist',
    format: 'esm',          // es / cjs / iife / umd ...
  },
})
```

```bash
rolldown -c rolldown.config.ts    # 或无配置时 rolldown src/main.ts -d dist
```

产出的 `dist/main.js` 已完成：TS 转译、依赖解析、tree-shaking——注意**没有装任何 babel/ts 转译器**，转换内建（第 7 章展开）。与 Rollup 的配置几乎逐字相同（input/output/format/plugins）——这就是"Rollup 兼容"的第一体感：把 `rollup.config` 改名 `rolldown.config`，多数项目能直接跑。

## JS API：程序化打包

写工具、做脚手架时用 API 形态（[Vite 第 5 章](/posts/vite-dev/05-plugins.md)的插件也能直接传入）：

```ts
import { rolldown } from 'rolldown'

const bundle = await rolldown({
  input: 'src/main.ts',
  plugins: [/* Rollup 兼容插件 */],
})
const { output } = await bundle.generate({ format: 'esm' })
for (const chunk of output) {
  console.log(chunk.fileName, chunk.code?.length ?? 0)
}
await bundle.write({ dir: 'dist', format: 'esm' })
await bundle.close()
```

与 Rollup 的 JS API 同构：`rolldown()` 得到 bundle 对象，`generate`（内存）或 `write`（落盘）。`watch` API 支持监听模式——自己造 dev 工具时的积木。

## 模块类型：不止 JS

Rolldown 对"一个文件是什么"引入了**模块类型**（module type，实验性）概念：`.ts`/`.tsx`/`.jsx`/`.json`/`.css`/`.text`/`.base64` 等——每种类型对应内建的处理管线。在插件里转换出非 JS 内容时可以显式声明 `moduleType: 'css'`，让框架接管（对比 [Vite 插件](/posts/vite-dev/05-plugins.md)里"转成 JS 模块"的惯用法，这是一处语义升级）。

## REPL：零安装实验

[repl.rolldown.rs](https://repl.rolldown.rs/) 在浏览器里直接写输入代码、看产物与 treeshaking 结果——验证"这段代码会不会被摇掉"比本地建项目快得多。

## 踩坑提示

- CLI 版本与文档特性对不上：Rolldown 迭代快，特性按你装的版本查（`rolldown --version`），别按博客文章。
- output 未写 dir 时产物打到 stdout——脚本里看一屏乱码多半是这个。
- 从 Rollup 抄配置时报"未知选项"：少数 Rollup 专有项（如某些 output 选项）不在兼容范围，逐项对照第 5 章的迁移清单。

## 练习

1. 把 [Vite 第 2 章](/posts/vite-dev/02-dev-server-hmr.md)的 vanilla 项目改用 Rolldown CLI 打包，对比产物与耗时。
2. 用 JS API 写一个"构建并统计每个 chunk 体积"的小脚本。
3. 在 REPL 里验证：一段只 import 具名函数的代码，未用的导出是否被摇掉。
