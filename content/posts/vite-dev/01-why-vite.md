---
title: "Vite 工程化入门 · 第 1 章：为什么是 Vite"
description: "打包器时代的两难：超大 dev server 与慢速启动，原生 ESM 按需编译如何破局。"
publishDate: 2026-06-14T09:00:00
tags: ["vite", "前端工程化", "教程"]
---

> 本文对应官方文档[为什么选 Vite](https://cn.vite.dev/guide/why)。

**学习目标**：理解 Vite 与 webpack 类工具的本质差异，跑通第一个 Vite 项目。

## 打包器时代的两难

webpack 时代的开发流程：**启动即全量构建**——把整个应用的模块图从入口开始解析、转换、打包成一个或多个 bundle，然后才起 dev server。项目越大，冷启动越慢（几分钟级），改一行代码等半天的"保存焦虑"就成了常态。为提速出现的各种缓存、DLL 方案，都是在这条"先打包再服务"的路上打补丁。

Vite 的破局点是换问题：**开发时根本不打包**。

## 原生 ESM 按需编译

现代浏览器原生支持 ES Module——`import` 就是 HTTP 请求。Vite 的 dev server 顺势而为：**浏览器请求哪个模块，就按需编译哪个**：

```ts
// main.ts —— dev 时浏览器直接按 ESM 加载，Vite 在中间做即时转译
import { createApp } from 'vue'
import App from './App.vue'      // 请求到 App.vue 时才编译它
import './style.css'
createApp(App).mount('#app')
```

三重收益：

1. **冷启动快到无感**——不用等全量打包，起的是个静态服务器；
2. **热更新只走一条边**——改了某个模块，只需让"引用它的那一小段"失效重取，速度与项目体积**解耦**；
3. **代码就是你写的样子**——TS 自动转译、.vue/.css 按需处理，浏览器永远拿到可读的模块。

那**生产构建呢**？上线路径回归传统：用 Rollup 打包优化产物（tree-shaking、压缩、合并请求）——**开发走原生 ESM，构建走打包器**，两边各取所长。Vite 7 起构建引擎向 Rolldown（Rust 版 Rollup）过渡，指导思想不变。

## 与脚手架的关系

`npm create vite@latest` 生成的项目里没有 `vite.config.ts` 也能跑——零配置默认值开箱即用。配置文件是可选的增强：

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: 5173 },
  plugins: [],          // 第 5 章的主场
})
```

更重要的是：**大多数框架项目根本不用手动建 Vite**——`npm create vue` / `npm create astro` 们生成的工程内部都是 Vite（[Vue 第 1 章](/posts/vue-core/01-getting-started.md)、本站 Astro 皆然）。学 Vite 的意义在于：这些项目报错、调优、配插件时，你知道底下发生了什么。

## 第一个项目走一遍

```bash
npm create vite@latest hello-vite -- --template vanilla-ts
cd hello-vite && npm install && npm run dev
```

打开 `http://localhost:5173`，改一行 `main.ts` 保存——**浏览器无刷新更新**（第 2 章的 HMR）。再看 `npm run build` 的产物：压缩、哈希文件名、按模块图分包的 JS/CSS——两种世界在同一条命令行里各司其职。

## 踩坑提示

- dev 与 build 行为不同源导致"开发好的上线坏"——典型是环境变量（[第 3 章](/posts/vite-dev/03-build-and-env.md)）与依赖的打包差异（[第 9 章](/posts/vite-dev/09-optimization.md)），两章专门处理。
- 裸 `npm run dev` 报"无法找到模块"：先 `npm install`——Vite 的依赖预构建（[第 9 章](/posts/vite-dev/09-optimization.md)）要先跑。
- 把 Vite 理解成"Vue 的工具"是最常见的误会：它框架无关，Astro/Vue/Svelte/React 全在用。

## 练习

1. 建 vanilla-ts 项目，故意在 TS 里写类型错误，观察 dev 与 build 的不同反应。
2. 在 Network 面板看 dev 模式加载了哪些模块——数一数浏览器发了多少个 ESM 请求。
3. 对比 `npm run dev` 与 `npm run build && npm run preview` 的产物结构。
