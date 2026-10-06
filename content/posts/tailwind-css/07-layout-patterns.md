---
title: "Tailwind CSS 实战入门 · 第 7 章：布局模式实战"
description: "Flex/Grid 高频套路、粘性头部与三栏布局——用本站真实类名还原一套博客骨架。"
publishDate: 2026-08-07T09:00:00
tags: ["tailwindcss", "css", "教程"]
---

> 本文对应官方文档[使用工具类](https://tailwindcss.com/docs/styling-with-utility-classes)与布局相关原子类，案例类名取自本站真实代码。

**学习目标**：积累高频布局套路，能独立拼出"头部 + 三栏主体"的经典页面骨架。

## Flex 三板斧

90% 的行内布局就三个动作：

```html
<!-- 1. 主轴排列 + 间距 -->
<div class="flex items-center gap-4">
  <img class="size-10 rounded-full" />
  <div class="flex-1 min-w-0">      <!-- 2. flex-1 占满剩余 -->
    <h3 class="truncate">标题会截断而不是撑破布局</h3>
  </div>
  <button class="shrink-0">操作</button>   <!-- 3. shrink-0 保住不被压缩 -->
</div>
```

`flex-1`（占满剩余）、`min-w-0`（允许子项收缩、truncate 生效的前提）、`shrink-0`（保住固定元素）——这"三兄弟"是 flex 布局不出事故的核心。对齐就两族：`justify-*`（主轴）、`items-*`（交叉轴），居中全家桶 `flex items-center justify-center`。

## Grid 两板斧

**等分网格**（第 3 章的响应式套路）之外，最常用的是 **span 跨列**：

```html
<div class="grid grid-cols-12 gap-6">
  <aside class="col-span-12 lg:col-span-3">侧栏</aside>
  <main class="col-span-12 lg:col-span-9">主区</main>
</div>
```

12 列栅格 + `col-span-*` 表达一切比例（3:9、2:10、5:7），比 float 时代的实现干净一个时代。不规则流式卡片用 `grid-cols-[repeat(auto-fit,minmax(240px,1fr))]` 任意值一招解决。

## 粘性头部与三栏骨架

**粘性头部**两行搞定：

```html
<header class="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
  <!-- bg 半透明 + backdrop-blur = 毛玻璃，滚动时内容从头部底下透过来 -->
</header>
```

**三栏布局**——用本站真实类名还原骨架（博客的左栏系列目录 + 中间正文 + 右栏页内目录）：

```html
<body class="mx-auto max-w-3xl px-4 pt-16">  <!-- 3xl 上限，居中 -->

  <!-- 左栏：md 起 fixed 到视口左缘、上下通顶 -->
  <aside class="hidden md:fixed md:inset-y-0 md:start-0 md:z-40 md:w-56 md:overflow-y-auto md:border-e lg:w-64">
    <nav>系列章节……</nav>
  </aside>

  <!-- 正文流 -->

  <!-- 右栏：56rem（896px）任意断点起 fixed 到右缘 -->
  <nav class="hidden min-[56rem]:fixed min-[56rem]:inset-y-0 min-[56rem]:end-0 min-[56rem]:z-40
              min-[56rem]:w-44 min-[56rem]:overflow-y-auto min-[56rem]:border-s">
    本页目录……
  </nav>
</body>
```

关键手法有三：**fixed 脱离文档流后，中栏用 body 的 max-width + margin 居中，左右栏"浮"在留白区上**；`md:` 与 `min-[56rem]:` 两档分别放左右栏，错开出现的时机；`border-e`/`border-s` 逻辑属性边框在 RTL 下自动镜像。这套"fixed 两翼 + 居中主体"比 grid 三栏的好处是**窄屏时两翼自然隐藏、中栏独占**——响应式行为免费送。

## 定位与层级的克制用法

`fixed/absolute` + `z-*` 的使用纪律：**z 层级约定三档**（内容 z-0、粘性头部/侧栏 z-40、弹层 z-50），不搞 `z-[999]` 军备竞赛。 absolute 定位记得父容器 `relative`——"绝对定位飞出了组件"九成是这层没加。

## 踩坑提示

- `truncate` 需要 `overflow-hidden` + 固定宽度语境（flex 子项先 `min-w-0`），否则不生效。
- fixed 侧栏内容超出视口高度：容器 `overflow-y-auto` + `inset-y-0` 拉满，滚动才锁在栏内。
- `sticky` 的父级不能有 `overflow: hidden`——粘不住先查祖先的 overflow。

## 练习

1. 用 flex 三兄弟做一个"头像 + 长标题 + 按钮"的工具栏，验证窄屏不破。
2. 还原本章三栏骨架，窗口从 768px 拉到 1280px，观察左右栏先后出场。
3. 给粘性头部加滚动阴影：滚动超过 8px 时切换 shadow 类（一小段 JS + class 切换）。
