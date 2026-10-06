---
title: "Vite 工程化入门：从开发服务器到生产构建"
description: "Vite 系列教程总览：dev server 与 HMR、构建与环境变量、插件系统、Astro 集成与优化实践。"
publishDate: 2026-06-13T09:00:00
tags: ["vite", "前端工程化", "教程"]
---

学会 [JavaScript](/posts/javascript-core/) 与 [TypeScript](/posts/typescript-core/) 之后，浏览器和源代码之间还隔着一层**工程化**：怎么把 `.ts`/`.vue`/`.css` 变成浏览器能跑的东西？开发时怎么改一行立刻看到？上线时怎么打包出最优产物？Vite 就是这一层的现代答案——而且它不只服务 Vue/React 脚手架，**本站 Astro 的内核就是 Vite**。

> 内容依据 [Vite 官方中文文档](https://cn.vite.dev/guide/why)（Vite 7）整理，代码示例均为原创，每章附官方文档链接。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：为什么是 Vite](/posts/vite-dev/01-why-vite/) | 打包器时代的两难、按需编译 | [为什么选 Vite](https://cn.vite.dev/guide/why) |
| [第 2 章：开发服务器与 HMR](/posts/vite-dev/02-dev-server-hmr/) | 模块图、热更新边界 | [Features](https://cn.vite.dev/guide/features) |
| [第 3 章：构建与环境变量](/posts/vite-dev/03-build-and-env/) | build 产物、.env 与 import.meta.env | [环境变量](https://cn.vite.dev/guide/env-and-mode) |
| [第 4 章：静态资源](/posts/vite-dev/04-static-assets/) | public 目录、资源导入、glob 导入 | [静态资源](https://cn.vite.dev/guide/assets) |
| [第 5 章：插件系统](/posts/vite-dev/05-plugins/) | Rollup 插件兼容、常用钩子 | [插件 API](https://cn.vite.dev/guide/api-plugin) |
| [第 6 章：Astro 与 Vite](/posts/vite-dev/06-astro-and-vite/) | 框架如何用 Vite、本站配置真例 | [使用插件](https://cn.vite.dev/guide/using-plugins) |
| [第 7 章：别名与类型](/posts/vite-dev/07-alias-and-types/) | resolve.alias 与 tsconfig 双轨 | [配置](https://cn.vite.dev/config/) |
| [第 8 章：SSR 与库模式](/posts/vite-dev/08-ssr-and-lib/) | SSR 构建、打包组件库 | [SSR](https://cn.vite.dev/guide/ssr) |
| [第 9 章：构建优化](/posts/vite-dev/09-optimization/) | 依赖预构建、代码分割 | [依赖预构建](https://cn.vite.dev/guide/dep-pre-bundling) |
| [第 10 章：调试与迁移](/posts/vite-dev/10-debugging-migration/) | 高频报错、版本升级 | [破坏性变更](https://cn.vite.dev/changes/) |
| [附录：配置速查](/posts/vite-dev/11-appendix/) | 配置项、指令、资源速查 | — |

## 学习路线

- **按序读**：1–3 章是主干（dev → env → build），4–9 按需，第 6 章（Astro 集成）强烈建议本站读者读；
- **前置**：[《TypeScript 核心入门》](/posts/typescript-core/)第 8 章（ESM/CJS）——Vite 的世界里全是模块，分不清两者会寸步难行；
- **后续衔接**：[ArkTS 的 HMR](/posts/arkts-dev/06-composition-and-hmr.md)（热重载两种方言）、[Vue](/posts/vue-core/01-getting-started.md)（create-vue 即 Vite 脚手架）、[Tailwind](/posts/tailwind-css/01-philosophy-and-setup.md)（@tailwindcss/vite 插件）。

## 环境准备

```bash
npm create vite@latest my-app   # 官方脚手架（选框架模板）
cd my-app && npm install && npm run dev
```

已有 Astro/Vue/React 项目则**什么都不用装**——它们的工具链已经内置 Vite。

## 遗留问题

- Backend Integration（传统后端模板接 Vite）、Vitest 单测、PWA/SSG 插件生态未展开。
- Vite 7 起引入 Rolldown（Rust 版 Rollup）作为可选构建引擎；**Vite 8 起它已是默认引擎**——后续见[《Rolldown 入门》系列](/posts/rolldown-guide/)。
