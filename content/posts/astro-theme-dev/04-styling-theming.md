---
title: "Astro 主题开发 · 第 4 章：样式与主题化"
description: "scoped 样式的边界、全局样式的正确打开方式、CSS 变量与暗色模式：把外观做成主题 token。"
publishDate: 2026-09-30T17:00:00
tags: ["astro", "主题开发", "教程"]
---

> 本文对应官方文档[样式与 CSS](https://docs.astro.build/zh-cn/guides/styling/)，示例在其基础上改编。

**学习目标**：掌握 Astro 样式的作用域规则，学会用 CSS 变量设计主题 token 和暗色模式。

## scoped 样式：默认安全区

组件 `<style>` 里的样式**默认只作用于本组件**——编译时 Astro 给元素加上 `data-astro-cid-xxx` 属性、给选择器加同样的属性限定：

```css
/* 你写的 */
h1 { color: red; }
/* 编译后 */
h1[data-astro-cid-hhnqfkh6] { color: red; }
```

对主题开发是重大利好：可以放心写 `h1 {}` 这种低特异性选择器，不怕污染别人的页面。优先级上，作用域样式高于 `<link>` 和导入的样式（但更高的特异性仍能覆盖它）。

## 边界一：样式不传给子组件

作用域样式**不会**作用到子组件——`Card.astro` 里写 `p { margin: 0 }` 管不到 Card 内部引用的其他组件。需要从外部注入样式到子组件时，走第 2 章的 `class` 转发，而不是用全局样式兜底。

## 边界二：内容渲染区必须全局

Markdown 渲染出来的正文 HTML 不归任何 Astro 组件所有，作用域样式够不着。这正是 `:global()` 的主场——只把内容区放开，不把整个样式表放开：

```astro
<article class="prose">
  <slot />
</article>
<style>
  /* 只有 article 内部的 h1 放开 */
  .prose :global(h1) { font-size: 1.8em; }
</style>
```

`is:global` 是整张样式表全部全局，慎用——官方建议尽量作用域样式、必要处才全局。另一个要记住的规则：**导入的 CSS 会"泄漏"**（即使组件没被使用也生效），所以全局 CSS 统一在布局里导入，且布局 import 放在其他导入之前以获得最低优先级，方便覆盖。

## CSS 变量：主题 token 的载体

主题外观的"可换皮"能力全靠 CSS 变量。官方的 `define:vars` 能从脚本传值进样式，但主题 token 更适合集中在全局定义：

```css
/* src/styles/global.css */
:root {
  --color-text: oklch(20% 0 0);
  --color-bg: oklch(98% 0 0);
  --color-accent: oklch(70% 0.14 163);
}
```

组件里只消费变量，不出现具体色值：

```astro
<style>
h1 { color: var(--color-accent); }
</style>
```

## 暗色模式：data-theme + 变量覆盖

暗色模式就是把变量表换成第二份：

```css
:root[data-theme="dark"] {
  --color-text: oklch(83% 0 264);
  --color-bg: oklch(24% 0.005 248);
}
```

切换按钮只负责改 `data-theme` 属性（几行客户端脚本，或用 `is:inline` 的小段脚本避免闪烁），颜色全部由 CSS 层完成。本站 global.css 的暗色模式就是这个结构：亮色变量定义在 `:root`，暗色在 `:root[data-theme="dark"]` 里覆盖，加上一组 `transition` 让切换有过渡。

## class:list 与工具类

动态类名用 `class:list`：传入数组/对象，条件为真才输出对应类名。使用 Tailwind 的主题（`npx astro add tailwind`）时，工具类直接写在模板里即可，Astro 4+ 对其无额外配置；但主题 token 依然建议收敛成 CSS 变量（Tailwind 4 也在向原生 CSS 变量靠拢），工具类负责布局、变量负责颜色，两层各司其职。

## 踩坑提示

- 全局 CSS 在多个组件里重复导入，等于导入了多次——统一在布局导入一次。
- `:global()` 的选择器范围写太宽（如直接 `:global(p)`）等于全局污染，永远挂在前缀类下面。
- 暗色模式只写了暗色变量、漏了某个新加的 token，会出现"暗色下某个元素还是亮色"的漏网之鱼——新增 token 时两份变量表一起改。

## 练习

1. 把项目里的具体色值替换成 CSS 变量 token，加一套暗色覆盖。
2. 写一个切换按钮，改 `data-theme` 验证暗色生效。
3. 写一个 `Prose.astro` 组件，用 `.prose :global()` 给 Markdown 正文排版样式。
