---
title: "Vite 工程化入门 · 第 4 章：静态资源"
description: "public 与 assets 的分工、导入即 URL 的语义、new URL 与 glob 导入两个利器。"
publishDate: 2026-05-24T09:00:00
tags: ["vite", "前端工程化", "教程"]
---

> 本文对应官方文档[静态资源处理](https://cn.vite.dev/guide/assets)。

**学习目标**：分清 public 与源码资源的取舍，掌握资源导入、`new URL()` 与 `import.meta.glob` 三种引用方式。

## 两种资源，两种哲学

**public/ 目录**：原样拷贝进产物根目录，路径写死、不经处理：

```html
<!-- public/favicon.ico → /favicon.ico -->
<link rel="icon" href="/favicon.ico" />
```

**源码资源（assets/）**：import 进来，Vite 接管——压缩、改名（内容 hash）、按体积内联（小于 4KB 变 data URL）：

```ts
import logoUrl from './assets/logo.png'   // → "/assets/logo-9a8b7c.png"
img.src = logoUrl
```

选型口诀：**需要精确路径且永不变（favicon、robots.txt）→ public；被代码引用、想要缓存与压缩 → 源码资源**。public 里的文件不会被 hash，改了内容文件名不变，缓存陷阱自负。

## 导入即 URL 的语义

在 Vite 的世界里，import 一个资源默认得到**它的最终 URL**（第 1 章说的"请求到才编译"在资源上表现为"引用到才处理"）：

```ts
import workerUrl from './scan.worker.ts?worker'   // ?worker：包装成 Worker
import rawText from './data.txt?raw'              // ?raw：拿原始字符串
import inlineSvg from './icon.svg?inline'         // ?inline：强制内联
```

`?raw` 与 `?worker` 是高频彩蛋：把一段文本/一个脚本文件变成可直接用的形式，不需要额外管线。

## new URL()：运行时才知道路径的资源

静态 import 要求路径**字面量**（编译期确定）。路径是拼接出来的（如按用户语言加载图片）时，用 `new URL`：

```ts
// Vite 识别这个模式，构建时把 glob 式的候选全部纳入产物
const url = new URL(`./flags/${locale}.png`, import.meta.url).href
```

注意模板字符串里**变量在文件名位置**——这个特定模式 Vite 会展开处理；完全动态的路径（变量在目录层级）依旧无能为力，那是下一节的 glob 主场。

## import.meta.glob：批量导入

"把某个目录下所有文件都拿进来"——路由自动注册、图标批量映射的标配：

```ts
// 惰性版：返回 () => import(...) 动态导入函数（按需加载）
const modules = import.meta.glob('./pages/*.vue')
// { './pages/Home.vue': () => import('./pages/Home.vue'), ... }

// 立即版：直接拿到模块对象
const posts = import.meta.glob('./data/*.json', { eager: true })

// 只导入某类、重命名键
const icons = import.meta.glob('./icons/*.svg', {
  eager: true,
  import: 'default',
  query: '?url',
})
```

这也是**静态扫描**的又一个案例（[Tailwind 第 10 章](/posts/tailwind-css/10-production.md)同族）：glob 模式在构建期展开成确定的文件清单，运行时零魔法。本站的系列侧边栏数据（[建站第 5 章](/posts/astro-from-scratch/05-content-collections.md)）在 Astro 底层正是靠这套机制把 content 目录变成模块图。

## 踩坑提示

- 图片 404：写相对路径 `./assets/x.png` 的 `<img src>` 不经处理（dev 碰巧能用、build 必挂）——要么 import，要么 `new URL`，要么进 public。
- 大图别进 src 内联阈值以上还到处 import——该压缩的先压缩（`?inline` 反向需求同理）。
- glob 路径必须以 `./` 或 `/` 开头的字面量——变量拼接的 glob 不是 glob。

## 练习

1. 对比同一张图走 public 与走 import 的产物差异（文件名/体积/缓存头）。
2. 用 `?raw` 加载一份本地 JSON 字符串并解析。
3. 用 import.meta.glob 自动注册 routes/ 下所有页面，数一数省了几行手动 import。
