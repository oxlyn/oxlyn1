---
title: "CSS 核心入门 · 第 9 章：变量与现代特性"
description: "自定义属性与主题系统、clamp 流体排版、:has() 父选择器、逻辑属性——现代 CSS 的四张王牌。"
publishDate: 2026-07-28T09:00:00
tags: ["css", "教程"]
---

> 本文对应 MDN 指南[级联变量](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Cascading_variables)、[逻辑属性](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Logical_properties_and_values)与相关现代特性文档。

**学习目标**：用自定义属性搭主题系统，用 clamp 写流体排版，认识 :has() 与逻辑属性带来的范式变化。

## 自定义属性：CSS 的运行时变量

自定义属性（CSS 变量）与前章所有机制的根本区别：**它们参与层叠与继承，且运行时可改**——JS 改一个变量，全站瞬间响应：

```css
:root {
  --bg: oklch(98% 0 0);
  --text: oklch(20% 0 0);
  --brand: oklch(62% 0.19 258);
}
[data-theme="dark"] {
  --bg: oklch(23.6% 0.005 248);
  --text: oklch(83.5% 0 264);
}
body { background: var(--bg); color: var(--text); }
```

```js
document.documentElement.dataset.theme = 'dark'   // 全站换肤，零重排
```

这正是[本站暗色模式](/posts/tailwind-css/05-dark-mode.md)的底层——Tailwind 的 `@theme` 变量（`--color-*`）就是自定义属性的工程化封装。三个进阶点：变量**按 DOM 子树层叠**（子树内重定义即局部主题，如侧栏局部暗色）；默认值语法 `var(--x, fallback)`；配合 `@property` 可给变量注册类型，让 transition 能过渡颜色变量（本站的换肤过渡）。

## clamp()：一行流式排版

`clamp(min, preferred, max)` 三参数夹逼，是响应式数值的正解：

```css
h1 {
  font-size: clamp(1.8rem, 1.2rem + 2.5vw, 3rem);   /* 窄屏 1.8rem，宽屏 3rem，中间随视口流动 */
}
.container { width: min(100% - 2rem, 72rem); margin-inline: auto; }  /* 容器居中 + 安全边距 */
```

fluid typography（首选值里掺 vw）让断点数量骤减——[第 6 章](/posts/css-core/06-responsive.md)说过的"断点减半"主要归功于它。同族函数：`min()` 取小、`max()` 取大，全部可嵌套、可混单位（[第 1 章](/posts/css-core/01-box-model.md)单位矩阵的终点站）。

## :has()：父选择器终于来了

2023 年全量落地的 `:has()` 让 CSS 第一次"向后看"——根据**后代/后续**兄弟选中祖先：

```css
/* 表单里有非法输入时，整块标红（以前必须 JS 加类） */
.field:has(input:user-invalid) { border-color: red; }

/* 卡片里有图片时用宽版布局 */
.card:has(img) { grid-template-columns: 1fr 2fr; }

/* 后续兄弟联动 */
label:has(+ input:focus) { color: var(--brand); }
```

它把一批"为样式服务的 JS 类名开关"送进了历史——状态样式回归 CSS 说明书。

## 逻辑属性：国际化地基

物理属性（left/right/top/bottom）假设"从左往右、从上到下"；逻辑属性按**书写方向**定义：

```css
.card {
  padding-inline: 1rem;        /* 行内方向（左右，RTL 自动镜像） */
  padding-block: 0.75rem;      /* 块方向（上下） */
  border-inline-start: 1px solid;  /* "开始侧"边框 = LTR 左 / RTL 右 */
  inset-inline-end: 0;         /* 定位同理 */
}
```

`margin-block`、`inset-inline-start`、`border-start`……本站的侧栏定位（`md:start-0`、`min-[56rem]:end-0`）全套逻辑属性——Tailwind 的 `ps-`/`pe-`/`start-` 前缀正是它们的马甲。新代码一律逻辑属性优先：阿拉伯语用户打开你的页面时，布局自动镜像。

## 现代特性查漏

按需认识的清单：`@supports (selector(:has(*))) { }` 特性查询做渐进增强；`:user-valid/:user-invalid` 替代 JS 表单校验样式；`overscroll-behavior` 治理滚动穿透；`scroll-behavior: smooth` 平滑锚点。查新姿势：MDN 每个属性的兼容性表 + Baseline 标识。

## 踩坑提示

- 变量名拼错不报错（回退到 fallback 或继承值）——大面积"颜色不对"先查变量拼写与作用域。
- 变量在 `:root` 定了、在暗色里忘改，出现"单色没跟上主题"——[Tailwind 第 5 章](/posts/tailwind-css/05-dark-mode.md)的两表一一对应纪律。
- clamp 的 preferred 段忘掺 vw（写成固定值）——它就退化成三参 min/max，流动效果消失。

## 练习

1. 用自定义属性 + @property 实现带过渡的主题切换，再给侧栏做局部暗色（子树内重定义变量）。
2. 把三处媒体查询字号断点改成一条 clamp()。
3. 找一个"JS 监听输入合法性加 error 类"的代码，用 :has(input:user-invalid) 纯 CSS 重写。
