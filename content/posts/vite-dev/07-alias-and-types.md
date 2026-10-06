---
title: "Vite 工程化入门 · 第 7 章：别名与类型"
description: "resolve.alias 与 tsconfig paths 的双轨配合、vite/client 类型、环境差异的自查清单。"
publishDate: 2026-05-27T09:00:00
tags: ["vite", "前端工程化", "教程"]
---

> 本文对应官方文档[配置参考](https://cn.vite.dev/config/)与 [TypeScript 指南](https://cn.vite.dev/guide/features)。

**学习目标**：配好编辑器与构建器都认识的路径别名，理解"双轨"必须同步的原因，补齐 TS 工程的 Vite 类型。

## 别名：两套系统一个约定

`@/components/Foo` 这类短路径靠**两个系统同时认识**：

```ts
// vite.config.ts —— 构建器侧：决定 import 实际指向哪个文件
export default defineConfig({
  resolve: {
    alias: { '@': '/src' },    // 或 path.resolve(__dirname, 'src')
  },
})
```

```json
// tsconfig.json —— 编辑器/类型侧：决定跳转与补全
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

**为什么必须双轨**：alias 只管运行时解析（打包时把 `@/x` 换成真实路径），paths 只管类型系统（编辑器能跳转、能补全）。只配一边的经典症状：**编辑器不报错、构建报 "Failed to resolve import"；或构建通过、编辑器满屏红线**。

本站的 Astro 项目同样如此：`astro.config.mjs` 的 `vite.resolve.alias` + `tsconfig.json` 的 `paths` 成对出现（[Astro 主题第 10 章](/posts/typescript-core/10-in-the-project.md)讲过 paths 不影响运行时解析——那条结论在这里闭环）。

## vite/client：补上 Vite 的类型层

`import.meta.env`、`import.meta.glob`、`?raw`/`?url` 后缀导入都是 Vite 的"语言扩展"，TS 默认不认识。一行引用全局类型：

```ts
// src/vite-env.d.ts（脚手架自带，删了会满屏红线）
/// <reference types="vite/client" />
```

它带来三样东西：`import.meta.env` 的内建字段类型、资源导入的默认类型（`.png` → string）、`import.meta.hot` 的 HMR 类型。自定义 env 字段的扩充见[第 3 章](/posts/vite-dev/03-build-and-env.md)。

## 相对路径的尽头

裸相对路径（`../../components/Foo`）的三宗罪：层级泄漏（目录结构调整全崩）、可读性差、复制粘贴即断。别名化的纪律：

```
@/components  @/composables  @/stores  @/styles
```

反向的克制：**别名不超过两三个**（`@` 一个基本够），到处是 `@/utils/x/y/z` 说明目录该重组了——别名是缩短路径，不是掩盖结构问题。

## tsconfig 的其他 Vite 相关项

```json
{
  "compilerOptions": {
    "module": "ESNext",              // Vite 世界只有 ESM（TS 第 8 章）
    "moduleResolution": "bundler",   // 按打包器语义解析（支持 exports/省后缀）
    "types": ["vite/client"],
    "noEmit": true                   // 编译交给 Vite，tsc 只做检查
  }
}
```

`moduleResolution: "bundler"` 是现代前端项目的标配：它承认"由打包器解析模块"的现实，允许 Node ESM 语法与 TS 语法共存。

## 踩坑提示

- 改了 alias/paths 不生效：dev server 要重启（配置是启动时读的，[第 2 章](/posts/vite-dev/02-dev-server-hmr.md)的边界），tsconfig 要重启编辑器服务。
- `@` 别名与 npm 包 `@scope/pkg` 撞前缀——`@` 单字符别名建议改成明确的 `@/`（带斜杠）并配好匹配顺序。
- monorepo 里 paths 各包各自为政——用 extends 共享基础 tsconfig，别名指向统一。

## 练习

1. 给裸项目配双轨别名，分别删掉一侧，复现两种症状。
2. 故意写 `import x from './a.png'` 但删掉 vite-env.d.ts，读 TS 报错。
3. 把一个深嵌套 `../../../` 引用改成别名引用，git diff 看改动面。
