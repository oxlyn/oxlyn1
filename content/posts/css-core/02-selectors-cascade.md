---
title: "CSS 核心入门 · 第 2 章：选择器与层叠"
description: "特异性计算器、继承与初始值、@layer 决胜规则——理解'为什么这条规则没生效'。"
publishDate: 2026-07-09T09:00:00
tags: ["css", "教程"]
---

> 本文对应 MDN 指南[层叠](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Cascade)。

**学习目标**：掌握特异性算法，理解层叠的完整决胜顺序，会用 @layer 治理样式冲突。

## 选择器是地址，层叠是仲裁

选择器负责"选中谁"（类型、类、ID、属性、伪类、组合器），层叠负责"冲突听谁的"。"我写的样式没生效"永远是层叠问题，仲裁顺序从高到低：

1. **来源与 !important**：作者样式 > 浏览器默认；`!important` 反转比较方向；
2. **层叠层（@layer）**：后声明的层 > 先声明的层；**无 layer 的样式 > 一切有 layer 的**；
3. **特异性**；
4. **源码顺序**：同权重后者胜。

## 特异性：三段计数

特异性是 `(ID, 类/属性/伪类, 类型)` 的三段计数，逐段比较：

```css
p                 /* (0,0,1) */
.card p           /* (0,1,1) */
#nav .card p      /* (1,1,1) */
a:hover           /* (0,1,1)——伪类算类那段 */
p::before         /* (0,0,2)——伪元素算类型那段 */
```

**计数不进位、不可跨段**：11 个类压不过 1 个 ID——这就是"ID 选择器是代码异味"的根源（它永远赢，且没法被类覆盖）。实战守则：**类选择器为主，单段内做加法**。

DevTools 的 Styles 面板直接显示每条规则是否生效、被谁划掉——特异性调试不要猜，看面板。

## 继承与初始值

有些属性（color、font、line-height）沿文档树**向下继承**，有些（border、margin）不继承。不继承的属性可以用 `inherit` 强制继承、`initial` 回到默认、`unset` 智能二选一。利用继承收敛配置：

```css
body {
  font-family: ...;
  color: var(--text);
  line-height: 1.7;   /* 全站文字继承这三种，组件里少写一万遍 */
}
```

## @layer：现代 CSS 的治理工具

`@layer` 给样式"分组排序"——层与层之间特异性**不作数**，只按层序定胜负：

```css
@layer reset, base, components, utilities;

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
}
@layer base {
  h1 { font-size: 1.6rem; }
}
/* utilities 层未在此定义，但排在最后——里面的规则赢过 base */
```

这正是 Tailwind v4 的架构（[Tailwind 第 10 章](/posts/tailwind-css/10-production.md)）：工具类放在最上层 utilities，永远能覆盖组件样式；而**未被 layer 包裹的旧式 CSS 高于一切层**——本站三栏布局里那条 unlayered 的 body 偏移计算能压过工具类，用的就是这个"层外制胜"的机制。

治理结论：**自己项目的样式全部进 layer，给"必须压过一切"的覆盖（如对第三方库的修正）留一条无 layer 的窄道**。

## 踩坑提示

- "同样式先后写了两遍，前者生效了"——大概率不是顺序问题，是特异性差一段，回面板看。
- 内联样式 `style="..."` 特异性为 (1,0,0,0) 级，高于一切选择器（只有 !important 能压）。
- scoped 样式（如 Astro/Angular 的属性哈希）会给选择器加一段属性计数——覆盖第三方组件时注意它的存在。

## 练习

1. 手算五条规则的特异性，再用 DevTools 验证。
2. 把项目里一条 `#id .class` 选择器降级为纯类选择器，体会"必须配 !important"的场景消失。
3. 用 @layer 搭 reset/base/components 三层，故意在 base 里写一条与 utilities 冲突的规则，确认 utilities 赢。
