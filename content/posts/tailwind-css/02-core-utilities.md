---
title: "Tailwind CSS 实战入门 · 第 2 章：核心原子类"
description: "间距缩放表的规律、颜色阶梯体系、排版三件套，以及任意值的克制用法。"
publishDate: 2026-07-21T09:00:00
tags: ["tailwindcss", "css", "教程"]
---

> 本文对应官方文档[使用工具类](https://tailwindcss.com/docs/styling-with-utility-classes)与[颜色](https://tailwindcss.com/docs/colors)。

**学习目标**：掌握缩放体系的内在规律（而不是死记硬背），能凭推理写出大部分日常类名。

## 间距缩放：一个数字系统

Tailwind 的间距是**统一缩放表**：`0.25rem × n`——`p-1` 是 0.25rem，`p-4` 是 1rem，`p-8` 是 2rem。同一张表被一整族前缀共享：

| 前缀 | 管什么 | 例 |
| --- | --- | --- |
| `p-4` / `px-` / `py-` / `pt-` | 内边距（全/横/纵/单边） | `px-6 py-3` |
| `m-4` / `mx-auto` / `-mt-2` | 外边距（负值加 `-`） | `-ml-2` |
| `gap-4` | flex/grid 间距 | `gap-x-8 gap-y-2` |
| `w-` / `h-` / `size-6` | 尺寸（`size-` 是宽高合体） | `size-10` |
| `inset-4` / `top-` / `start-` | 定位偏移 | `top-2 end-2` |

**为什么必须用表**：所有间距取自同一组值，页面上的空隙只会是 0.25rem 的整数倍——这是原子类派的"设计 token"第一步（对照：鸿蒙断点、[Astro 主题的 token 化](/posts/astro-theme-dev/04-styling-theming.md)都是同一思想）。表外取值走任意值 `p-[17px]`，克制使用：每出现一次，设计系统就漏一次气。

## 颜色：阶梯制调色板

每族颜色 11 档（50–950），语义按属性 + 角色 + 阶梯组合：

```html
<div class="bg-blue-50 text-blue-950 border-blue-200">
  <span class="text-blue-600 hover:text-blue-500">链接</span>
</div>
```

- **600 是交互基准色**（按钮、链接），300/400 做装饰，50/100 做浅底，800/950 做深底文字——社区惯例，不是语法；
- 中性色 `gray/zinc/stone` 选一族用到底，别混；
- 需要品牌色不换库：在 `@theme` 里加自己的色阶（第 6 章）。

透明度用 `/`：`bg-black/50`，比 rgba 可读得多。

## 排版与边框三件套

```html
<h1 class="text-2xl font-bold tracking-tight text-gray-900">标题</h1>
<p class="text-sm leading-7 text-gray-600">正文段落，行高放宽。</p>
<div class="rounded-xl border border-gray-200 shadow-sm">卡片</div>
```

- 字号 `text-sm/xl/2xl` 与行高**成对设计**（`text-sm` 自带合适行高，要覆盖再写 `leading-*`）；
- 字重 `font-normal/medium/semibold/bold`——两级字重分层级足够；
- 圆角 `rounded-md/lg/xl/full`，边框 `border` + `border-<色>`，阴影 `shadow-sm/md`——卡片三件套齐了。

## 逻辑属性：start/end 优先

`ps-4/pe-4`（padding-inline-start/end）、`start-0/end-0`、`ms-auto` 这类**逻辑属性**类是国际化标配：RTL 布局下自动镜像。新代码一律 start/end 优先于 left/right——本站主题的侧栏定位（`md:start-0`、`min-[56rem]:end-0`）用的就是它们。

## 踩坑提示

- `p-4` 是 1rem 不是 4px——缩放表的单位是 rem（跟随用户浏览器字号，这也是它比 px 好的地方）。
- `h-full` 链条上任何一层高度塌了都失效——纵向撑满要每一层配合（`min-h-screen` / `h-full` 全链）。
- 颜色用错了档（比如链接用了 300）不会报错，只会"看起来不专业"——把"交互色 = 600"写成团队约定。

## 练习

1. 不看文档写出：上 2rem 左右 1.5rem 的内边距、8px 圆角、水平垂直居中的容器。
2. 用一套 blue 阶梯做"浅底深字"的提示条（50 底 + 800 字 + 200 边框）。
3. 找一处自己项目里写死的 px 间距，换算成缩放表最近的档位。
