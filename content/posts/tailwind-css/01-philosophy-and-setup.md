---
title: "Tailwind CSS 实战入门 · 第 1 章：原子类思想与环境"
description: "utility-first 的理念与代价、v4 的接入方式，以及从写 CSS 到组合类名的思维转换。"
publishDate: 2026-08-13T09:00:00
tags: ["tailwindcss", "css", "教程"]
---

> 本文对应官方文档[安装](https://tailwindcss.com/docs/installation)与[使用工具类](https://tailwindcss.com/docs/styling-with-utility-classes)。

**学习目标**：理解 utility-first 的取舍，跑通 v4 接入，完成第一个原子类页面。

## 一个类，一个属性

原子类的极致形态：每个类名对应**一条**CSS 声明：

```html
<p class="text-sm leading-6 text-gray-500 max-w-md mx-auto">
  一段灰色的说明文字。
</p>
```

`text-sm` 只是 font-size，`leading-6` 只是 line-height——不再有 `.card-title` 这种语义类名，也就不再有"这个样式写在哪个文件、这个类名叫什么"的两大难题。样式与结构同处一处，删组件时样式随组件一起消失，**死代码率天然极低**。

代价也明摆着：类名串长（靠编辑器折行与排序缓解）、重复组合多（靠组件抽取解决，第 8 章）、以及**你仍然要懂 CSS**——Tailwind 是 CSS 的快捷键，不是 CSS 的替代品。

## v4 接入：一个插件一行导入

```bash
npm install tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts（Astro 项目同款路径）
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({ plugins: [tailwindcss()] })
```

```css
/* src/styles/global.css */
@import "tailwindcss";
```

```astro
---
// 布局里引入全局样式
import '../styles/global.css'
---
```

v3 时代的 `tailwind.config.js`、`content` 配置、三条 `@tailwind` 指令全部退场：v4 编译器自动扫描源码收集类名（机制见[第 10 章](/posts/tailwind-css/10-production.md)），主题改用 CSS 变量（第 6 章）。升级项目可走官方[升级工具](https://tailwindcss.com/docs/upgrade-guide)与[兼容模式](https://tailwindcss.com/docs/compatibility)。

## 第一个页面：思维转换演练

用原子类还原一张名片，体会"组合"的手感：

```html
<div class="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  <img class="h-14 w-14 rounded-full object-cover" src="avatar.png" alt="头像" />
  <div class="min-w-0">
    <h2 class="truncate text-lg font-semibold text-gray-900">Oxlyn</h2>
    <p class="text-sm text-gray-500">写博客的人</p>
  </div>
</div>
```

读法从左到右：布局（flex/gap）→ 盒子（圆角/边框/内边距/阴影）→ 元素自身（尺寸/裁切）→ 文字（字号/字重/颜色）。**每个类都对应你已知的 CSS 属性**，学习成本在"记住缩放表"而非"理解新抽象"。

## 踩坑提示

- 忘引 `@import "tailwindcss"`，所有类"写了没效果"——查样式入口文件。
- 类名顺序不影响结果但影响可读性——装官方编辑器插件（自动排序 + 悬停显示 CSS），第一周就装。
- 先在 HTML 里堆类，堆到某个组合第三次出现再抽组件（第 8 章）——过早抽象是原子类新手第一大坑。

## 练习

1. 接入一个 Astro/Vite 项目，把 `@import` 写在全局样式里，验证 `text-red-500` 生效。
2. 不查文档，用原子类还原你常用的一个 UI 卡片，边写边猜类名（官方编辑器插件的补全就是教材）。
3. 打开本站任意页面，审查元素看一段真实类名串，尝试逐个说出对应 CSS。
