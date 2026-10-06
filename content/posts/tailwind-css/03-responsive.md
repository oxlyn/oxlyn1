---
title: "Tailwind CSS 实战入门 · 第 3 章：响应式设计"
description: "mobile-first 的断点语义、标准断点表、任意断点——本站三栏布局的真例还原。"
publishDate: 2026-08-03T09:00:00
tags: ["tailwindcss", "css", "教程"]
---

> 本文对应官方文档[响应式设计](https://tailwindcss.com/docs/responsive-design)。

**学习目标**：建立 mobile-first 心智，掌握断点前缀与任意断点，看懂并写出多栏自适应布局。

## mobile-first：无前缀是小屏

断点前缀是 **min-width** 语义：`md:flex` 意思是"≥768px 才 flex"，**不带前缀的写法是所有尺寸的默认**——所以移动端样式裸写、桌面端逐级叠加：

```html
<!-- 小屏纵向，md 起横向 -->
<div class="flex flex-col md:flex-row md:items-center gap-4">...</div>

<!-- 小屏隐藏，lg 起显示（桌面导航/侧栏的标配） -->
<aside class="hidden lg:block">...</aside>
```

这个语义决定写法方向：**先写手机样子，再往大屏"加"能力**，而不是"桌面设计稿 + 小屏修补"——后者的 `md:` 里堆满取消类（`md:mt-0`），是新手最明显的坏味道。

## 断点表与任意断点

| 前缀 | 宽度 |
| --- | --- |
| `sm:` | ≥ 640px |
| `md:` | ≥ 768px |
| `lg:` | ≥ 1024px |
| `xl:` | ≥ 1280px |
| `2xl:` | ≥ 1536px |

设计稿的切点不在标准档上（比如 896px、960px）？任意断点直接写：`min-[56rem]:end-0`——按 CSS 值精确生效。

**真例就在本站**：博客三栏布局里，系列侧栏在 md 档 fixed 到左缘，本页目录在 56rem（896px）这一自定义档 fixed 到右缘——浏览器窗口 920px 时标准档 xl（1280px）够不着、md 档又太宽，正是任意断点把这个"标准档位之间的真空"填上的（当年的 Edge 90% 缩放问题，复盘见[建站系列](/posts/astro-from-scratch/)）。

## 响应式三套路

**套路一：网格列数递增**

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- 文章卡片网格的万能写法 -->
</div>
```

**套路二：容器形状随屏变化**

```html
<div class="flex flex-col sm:flex-row sm:items-center">
  <img class="w-full sm:w-48 h-40 sm:h-auto rounded-lg object-cover" />
  <div class="mt-3 sm:mt-0 sm:ms-4">...</div>
</div>
```

**套路三：功能性显隐**——`hidden md:block`（桌面专属）、`md:hidden`（移动菜单按钮）、配合 `group` 做悬停展开。

## 与容器查询的分工

断点看的是**视口**，容器查询（`@container`，v4 原生支持）看的是**容器**——组件级自适应（同一张卡片放进窄侧栏和宽主区各自变形）用容器查询更正确。经验法则：**页面级布局用视口断点，可复用组件用容器查询**。

## 踩坑提示

- `md:hidden` 与 `hidden md:block` 忘了互斥，同一元素两套逻辑打架——写前先画一张"各断点该看到什么"的表。
- 断点叠加要从小到大排列（编辑器插件自动排序兜底），`lg:` 写在 `md:` 前面虽不改变结果（都是 min-width），但顺序乱了没法读。
- 移动端真机 ≠ 缩窄窗口：触摸目标、安全区（`pt-safe` 类环境）要额外照顾。

## 练习

1. 把一张移动端设计稿直接用原子类实现，全程不写 `max-` 前缀，体会 mobile-first。
2. 用 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` 做仪表盘卡片行。
3. 给本站的 56rem 断点设计一个实验：把窗口从 900px 拉到 1300px，观察右栏（本页目录）出现与固定的时刻。
