---
title: "CSS 核心入门 · 第 3 章：Flexbox"
description: "主轴与交叉轴的双轴思维、flex 三兄弟、对齐全家桶与 gap 的救赎。"
publishDate: 2026-07-10T09:00:00
tags: ["css", "教程"]
---

> 本文对应 MDN 指南[弹性盒布局](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Flexible_box_layout)。

**学习目标**：建立"双轴"心智模型，掌握弹性分配三属性，能用 Flex 解决九成的行内/行间布局。

## 开启弹性盒：主轴与交叉轴

`display: flex` 的瞬间，容器产生**两条轴**：主轴（默认水平）与交叉轴（垂直）。`flex-direction` 决定谁是主轴——`row` 横、`column` 竖。**全部 Flex 属性都相对这两条轴定义**，这是 Flexbox 的第一心智模型：不要背"水平居中是 justify 还是 align"，而是问"我要对齐主轴还是交叉轴"。

```css
.container {
  display: flex;
  flex-direction: row;      /* 主轴 = 水平 */
  justify-content: space-between;  /* 主轴：两端对齐 */
  align-items: center;             /* 交叉轴：垂直居中 */
  gap: 1rem;                       /* 子项间距（无折叠！） */
}
```

`justify-*`（主轴）与 `align-*`（交叉轴）是两套平行词汇：`flex-start / center / flex-end / space-between / space-around / space-evenly`。

## 弹性分配：三兄弟

子项在主轴上的伸缩由三个属性控制：

```css
.item {
  flex-grow: 1;     /* 有剩余空间时分多少（0 = 不抢） */
  flex-shrink: 0;   /* 空间不足时让多少（默认 1，0 = 保住不缩） */
  flex-basis: 0;    /* 分配前的基准尺寸 */
  /* 简写：flex: <grow> <shrink> <basis> */
}
```

三个高频组合，值得背下来：

- `flex: 1`（= 1 1 0）——**均分剩余空间**：主内容列、双栏的主侧；
- `flex: none`（= 0 0 auto）——**按内容尺寸、坚决不伸缩**：固定按钮、头像；
- `flex: 0 1 auto`（默认）——"内容多大就多大，挤了才缩"。

[第 1 章](/posts/css-core/01-box-model.md)的 min-width 陷阱在这里兑现：flex 子项默认 `min-width: auto`，长文本会撑破容器——**给会截断的子项加 `min-width: 0`** 是 Flexbox 最经典的补丁。

## 对齐的进阶：单子项与换行

- `align-self`：单个子项脱离容器的交叉轴对齐（如聊天列表里自己的消息靠右）；
- `flex-wrap: wrap`：放不下换行——换行后容器从"一行"变"多行"，`align-content` 管行与行的间距分布；
- `order`：改视觉顺序（无障碍与 DOM 顺序脱钩，慎用）。

## gap：间距的正解

Flexbox 时代的间距靠 margin 互相抵消（`:not(:last-child)` 之类），Flexbox 支持 `gap` 后这些技巧进博物馆：**gap 无折叠、无首尾多余、随换行自动处理**。[第 1 章](/posts/css-core/01-box-model.md)的 margin 折叠陷阱在 gap 面前自动消失——凡是用 flex/grid 的地方，间距一律 gap。

## 一个完整例子

```css
.toolbar {
  display: flex;
  align-items: center;      /* 交叉轴垂直居中 */
  gap: 0.75rem;
}
.toolbar .title { flex: 1; min-width: 0; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
.toolbar .actions { flex: none; }   /* 保住操作区 */
```

这就是[Tailwind 第 7 章](/posts/tailwind-css/07-layout-patterns.md)"flex 三兄弟"（flex-1 / min-w-0 / shrink-0）的原生版本——原子类只是这套机制的马甲。

## 踩坑提示

- 居中"差一像素"：图片默认基线对齐捣乱，容器加 `align-items: center` 或图片 `display: block`。
- `height: 100%` 链断在半路：flex 子项改用 `align-items: stretch`（默认）或 `align-self: stretch` 拉满。
- direction: column 后主轴变竖直，justify/align 的方向感全部反转——先问"哪条是主轴"。

## 练习

1. 实现"头像 + 多行标题（截断）+ 按钮"工具栏，缩窄到 320px 不破。
2. 用 `flex-wrap` + `gap` 做标签云，对比 margin 抵消老写法的行数。
3. 故意删掉 min-width: 0，观察长标题撑破布局，再修复。
