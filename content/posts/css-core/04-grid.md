---
title: "CSS 核心入门 · 第 4 章：Grid"
description: "显式与隐式网格、fr/minmax/auto-fit 三剑客、grid-area 命名布局——二维排布的正解。"
publishDate: 2026-07-11T09:00:00
tags: ["css", "教程"]
---

> 本文对应 MDN 指南[网格布局](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Grid_layout)。

**学习目标**：掌握 Grid 的行列定义与轨道函数，理解与 Flex 的分工，能写出自适应卡片墙与命名区域布局。

## 二维心智：先划格子再放东西

Flex 是一维（一行或一列内分配），Grid 是**二维**：先把容器划成行×列的格子，再把子项放进格子（或跨格子）：

```css
.layout {
  display: grid;
  grid-template-columns: 15rem 1fr;   /* 两列：固定侧栏 + 弹性主区 */
  grid-template-rows: auto 1fr auto;  /* 三行：头部 / 主体 / 底部 */
  gap: 1rem;
}
```

`fr`（fraction，剩余份额）是 Grid 的灵魂单位：`1fr 2fr` = 剩余空间按 1:2 分。`auto` 表示"看内容"。

## 轨道函数三剑客

**minmax(min, max)**：给轨道一个弹性区间——`minmax(15rem, 1fr)` 表示"最窄 15rem，有空间就均分"。侧栏不塌陷的关键。

**repeat(n, ...)**：批量定义轨道——`repeat(3, 1fr)` 三等分，`repeat(auto-fill, minmax(240px, 1fr))` 是**自适应卡片墙的完全体**：

```css
.wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
  /* 容器变宽自动多放一列，变窄自动少一列——零媒体查询 */
}
```

**auto-fit 与 auto-fill** 之别：auto-fill 留空轨道（项少时靠左），auto-fit 把空轨道折叠掉（项少时铺满）——卡片墙用 auto-fit，表单对齐用 auto-fill。

## 放置：跨行跨列与命名区域

```css
.featured {
  grid-column: 1 / -1;      /* 从第一列到最后一列（负数 = 倒数） */
  grid-row: span 2;         /* 跨两行 */
}
```

更可读的形态是**命名区域**——布局即图纸：

```css
.page {
  display: grid;
  grid-template-areas:
    "header header"
    "side   main"
    "footer footer";
  grid-template-columns: 15rem 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
}
.page > header { grid-area: header; }
.page > aside  { grid-area: side; }
.page > main   { grid-area: main; }
.page > footer { grid-area: footer; }
```

移动端适配只需重画 areas（`"header" "main" "footer"`），元素零改动——这是 Grid 对响应式最大的馈赠，与[第 6 章](/posts/css-core/06-responsive.md)媒体查询配合是整页布局的正解。窄屏细节分发依旧交给 Flex（**Grid 管版面，Flex 管格子里面的排列**——分工口诀）。

## 对齐：与 Flex 同一套词汇

`justify-items / align-items / justify-content / align-content / place-*`——把第 3 章的双轴词汇搬到格子里即可，另外多了 `justify-self / align-self` 单项控制。居中一个未知尺寸的元素，Grid 一行：

```css
.parent { display: grid; place-items: center; }   /* 传说中的完美居中 */
```

## 隐式网格与对齐陷阱

子项超出显式定义的行列时，Grid 自动生成**隐式轨道**（默认 auto 尺寸）——`grid-auto-rows: 1fr` 可以给它们定规矩。瀑布流式不等高卡片是 Grid 的历史弱项（`grid-auto-flow: dense` 只能部分缓解），真瀑布流交给 CSS columns 或 JS 方案。

## 踩坑提示

- `1fr` ≠ "正好平均"：fr 默认最小值是 auto（内容尺寸），内容过宽会撑破均分——给轨道加 `minmax(0, 1fr)` 才是严格均分。
- 卡片墙空出整列怪异？auto-fill 改 auto-fit。
- 跨行列布局里 `gap` 同样无折叠——第 1 章的 margin 折叠彻底与你告别。

## 练习

1. 用 `repeat(auto-fit, minmax(220px, 1fr))` 做文章卡片墙，拉伸窗口观察列数变化。
2. 用 grid-template-areas 实现三段式页面，并写出它的移动端 areas 版本。
3. 复现"两列 1fr 但内容不均分"，用 minmax(0, 1fr) 修复。
