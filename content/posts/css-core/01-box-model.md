---
title: "CSS 核心入门 · 第 1 章：盒模型与单位"
description: "一切皆盒子：box-sizing 的救赎、margin 折叠、长度单位的选用矩阵。"
publishDate: 2026-07-08T09:00:00
tags: ["css", "教程"]
---

> 本文对应 MDN 指南[盒模型](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Box_model)与[值和单位](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Values_and_units)。

**学习目标**：把"一切皆盒子"变成直觉，搞懂 box-sizing 为什么是现代 CSS 第一行代码，建立单位选用矩阵。

## 盒子的四层结构

每个元素都是一个盒子，从内到外四层：**内容（content）→ 内边距（padding）→ 边框（border）→ 外边距（margin）**。DevTools 里那块彩色立体图就是它。

关键分水岭是"宽高算到哪一层"：

```css
/* content-box（默认）：width 只管内容层 */
/* border-box：width 管到边框——人类直觉 */
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

`border-box` 下 `width: 100%` + `padding: 1rem` 不会撑破容器。这就是 Tailwind 的 [Preflight](https://tailwindcss.com/docs/preflight) 第一件事就全局设 `border-box` 的原因——本站也靠它，代码块才能老老实实占满内容列。这个重置应该是你每个项目的第一行 CSS。

## margin 的两个陷阱

**1. 外边距折叠**：垂直方向上相邻元素的 margin 会合并取最大值——上块 `mb-2` + 下块 `mt-3`，实际间距是 12px（0.75rem）而不是 35px。父子之间也会折叠（父元素没有 padding/border 时，第一个子元素的 margin-top 会"顶穿"到父元素外面）。规避手段：间距统一用 padding 或父容器 `gap`（Flex/Grid 里没有折叠，这也是第 3 章推荐 gap 的原因之一）。

**2. 负 margin 依赖**：布局错位时用负 margin 硬拉，短期有效、长期是债——先用 flex/grid 重排，负 margin 是最后的胶水。

## 单位选用矩阵

| 单位 | 含义 | 用在哪 |
| --- | --- | --- |
| `px` | 绝对像素 | 边框、阴影、发丝线 |
| `rem` | 根元素字号 | **间距、字号、圆角**——跟随用户浏览器设置，无障碍友好 |
| `em` | 当前元素字号 | 行内排版相关的间距（如图标与文字的间隙） |
| `%` | 相对父级 | 尺寸比例 |
| `vw` / `vh` | 视口宽/高的 1% | 全屏区块、大标题（见 clamp） |
| `ch` / `ex` | 字符宽/高 | `max-width: 65ch` 行长控制 |
| `fr` | 网格剩余份额 | 第 4 章专属 |

两条军规：**间距与字号一律 rem**（用户调大浏览器字号时全站跟涨）；**行长用 ch 量**——正文列 `max-width: 65ch` 是可读性研究的结论。Tailwind 的 `p-4 = 1rem` 缩放表（[Tailwind 第 2 章](/posts/tailwind-css/02-core-utilities.md)）就是 rem 体系的工程化。

## 一个完整例子

```css
.card {
  box-sizing: border-box;
  width: min(100%, 24rem);   /* 不超容器也不超 24rem——min() 后面第 9 章展开 */
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  margin-block: 1.5rem;      /* 逻辑属性：竖直方向，第 9 章展开 */
}
```

## 踩坑提示

- `width: 100%` + padding 破版 = 忘了 border-box（先查全局重置）。
- 视觉间距"不等于我写的值"：九成是 margin 折叠，用 DevTools 盒模型图对照。
- 移动端 100vh 与浏览器地址栏打架——用 `100dvh`（动态视口高度）替代。

## 练习

1. 写两块对比实验：content-box 与 border-box 下同样 `width: 10rem; padding: 1rem; border: 4px`，量实际宽度。
2. 制造一次父子 margin 折叠，用加 padding 或改 gap 两种方式修复。
3. 把一个页面的间距从 px 全量换成 rem，浏览器字号调到 200% 看区别。
