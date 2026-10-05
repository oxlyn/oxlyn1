---
title: "CSS 核心入门 · 第 5 章：定位"
description: "五种 position 的语义、absolute 的参照系、z-index 与层叠上下文的求解。"
publishDate: 2026-08-05T09:00:00
tags: ["css", "教程"]
---

> 本文对应 MDN 指南[定位布局](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Positioned_layout)。

**学习目标**：分清五种定位的参照系，掌握 absolute 定位的"锚点"机制，能解 z-index 不生效问题。

## 五种 position，五种参照系

| 值 | 参照系 | 是否脱离文档流 | 用途 |
| --- | --- | --- | --- |
| `static`（默认） | 无 | 否 | 普通流 |
| `relative` | 自己原本的位置 | 否 | 微调 + **给 absolute 当锚点** |
| `absolute` | 最近的**非 static 祖先** | 是 | 角标、下拉、徽章 |
| `fixed` | 视口 | 是 | 吸顶、悬浮按钮 |
| `sticky` | 滚动容器 + 阈值 | 半脱离 | 粘性表头、侧栏目录 |

核心心法：**absolute 永远在找锚点**——沿祖先链向上找第一个非 static 的元素作为参照。`position: relative` 自己几乎不偏移（不写 top/left 时位置不变），它的真实身份是"锚点制造者"：

```css
.card { position: relative; }        /* 锚点 */
.card .badge {
  position: absolute;
  top: -0.5rem;
  inset-inline-end: -0.5rem;         /* 逻辑属性：右/左随书写方向（第 9 章） */
}
```

"绝对定位飞出了组件"= 祖先链上没有锚点，它飞去了更远的参照物——修法永远是在预期父级加 `position: relative`。

## fixed 与 sticky 的江湖

`fixed` 参照视口，滚动时纹丝不动——但**祖先有 transform/filter 时会变成它的锚点**（不再相对视口），这是"fixed 失灵"的头号来源。

`sticky` 是相对流的粘性定位：在阈值内当 relative 用，到达 `top: 0` 时"粘住"，滚出容器后随容器离开：

```css
.table-head { position: sticky; top: 0; background: white; }
/* 粘性范围 = 父容器的高度边界 */
```

`sticky` 失效三查：**祖先有 `overflow: hidden/auto`**（最常见）、没写 top 阈值、父容器高度没有超出视口。本站的页内目录、吸顶导航全是 sticky 的应用场景。

## 层叠上下文：z-index 的真实规则

z-index 不是全局数字游戏，它只在**层叠上下文**内部比较。上下文由这些条件创建：根元素、positioned + 非 auto 的 z-index、opacity < 1、transform、filter、isolation 等。

```css
.modal { position: fixed; z-index: 50; }
.widget { position: relative; z-index: 10; opacity: 0.99; }  /* opacity 创建了新上下文！ */
/* widget 内部 z-index 再大，也只在 widget 这层里横——永远压不过 modal */
```

"z-index 设了 9999 还是压不住"= 它被某个祖先的上下文**困住了**。解法沿两条路：移除祖先的上下文创建条件（transform/opacity 等），或故意给祖先建上下文做"层级隔离"（组件库常用：组件根 `isolation: isolate`，内部 z 再大也不外溢）。**z-index 治理守则**：层级只留少数几档（0/40/50 之类），有意识地用 isolation 把弹层/卡片隔成孤岛。

## 定位之外的补充

- 锚点定位的亲兄弟：滚动定位——`:target { scroll-margin-block: 5ex; }` 给锚点跳转留出头部高度余量（本站 global.css 正有这条，防吸顶头部遮住跳转目标）；
- `position: absolute` 元素不参与父级高度计算——容器塌陷时考虑 padding-bottom 占位或改用 grid 叠层（`grid-area: 1/1` 叠放是 modern 的层叠替代方案）。

## 踩坑提示

- `top: 50%; left: 50%` + `translate(-50%, -50%)` 的老式居中可退休——`inset: 0; margin: auto;`（尺寸已知）或第 4 章的 `place-items: center`。
- 下拉菜单被轮播图压住：轮播图的 transform 建了上下文，轮到"层叠上下文隔离"问题。
- fixed 元素在 iOS 上配合软键盘的诡异物——关键交互避免依赖 fixed 的底部栏。

## 练习

1. 给卡片加角标（relative + absolute + 逻辑属性 inset），故意删锚点观察它飞到哪。
2. 复现 sticky 失效（父级 overflow: hidden），逐项排查三查清单。
3. 构造一次"z-index 9999 压不住弹窗"，用 isolation: isolate 方案修复。
