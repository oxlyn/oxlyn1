---
title: "CSS 核心入门：从盒模型到层叠上下文"
description: "CSS 系列教程总览：盒模型、层叠与优先级、Flex/Grid 布局、定位、响应式与现代特性的学习路线。"
publishDate: 2026-08-12T09:00:00
tags: ["css", "教程"]
---

CSS 是 Web 的"样式层"，也是被误会最深的语言——很多人写了五年还在靠猜。这个系列的目标是把 CSS 的**五个心智模型**钉死：一切皆盒子（盒模型）、规则怎么赢（层叠）、一维怎么排（Flex）、二维怎么排（Grid）、怎么脱离文档流（定位）。这五个模型立住了，剩下的只是查表。

> 内容依据 [MDN CSS 指南](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides)（2025 年起的 Guides 新结构）整理，代码示例均为原创，每章附官方文档链接。本站是 Astro + Tailwind 项目，系列多处"对照本站"——原子类背后就是这些原生机制。

## 章节导航

| 章节 | 内容 | MDN 对应 |
| --- | --- | --- |
| [第 1 章：盒模型与单位](/posts/css-core/01-box-model/) | box-sizing、margin 折叠、px/em/rem/vw | [盒模型](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Box_model) |
| [第 2 章：选择器与层叠](/posts/css-core/02-selectors-cascade/) | 特异性、继承、@layer 决胜规则 | [层叠](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Cascade) |
| [第 3 章：Flexbox](/posts/css-core/03-flexbox/) | 双轴思维、flex 三兄弟、对齐 | [弹性盒](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Flexible_box_layout) |
| [第 4 章：Grid](/posts/css-core/04-grid/) | 显式/隐式网格、fr/minmax/auto-fit | [网格](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Grid_layout) |
| [第 5 章：定位](/posts/css-core/05-positioning/) | 五种 position、z-index 与层叠上下文 | [定位](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Positioned_layout) |
| [第 6 章：响应式与容器查询](/posts/css-core/06-responsive/) | 视口/媒体查询/容器查询三层级 | [媒体查询](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Media_queries) |
| [第 7 章：文字与颜色](/posts/css-core/07-typography-color/) | 字体栈、行高、oklch 现代色彩 | [颜色](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Colors) |
| [第 8 章：过渡与变换](/posts/css-core/08-transitions-transforms/) | transition/transform、渲染性能 | [过渡](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Transitions) |
| [第 9 章：变量与现代特性](/posts/css-core/09-variables-modern/) | 自定义属性、clamp、:has()、逻辑属性 | [级联变量](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Cascading_variables) |
| [第 10 章：CSS 架构](/posts/css-core/10-architecture/) | 命名困境、方法论、调试工作流 | ——（实践章） |
| [附录：属性速查](/posts/css-core/11-appendix/) | 高频属性一页速查 + 资源 | — |

## 学习路线与前置

- **按序读**：1 → 2 → 3/4 → 5 是一条主线（模型 → 规则 → 布局三件套），6–9 各自独立，10 收官；
- 前置只需 [HTML 常识](/posts/javascript-core/10-dom-and-events/)；读完第 2、3、4、6 章再去看 [Tailwind 系列](/posts/tailwind-css/)，会看到原子类不过是这些机制的"快捷键外壳"——层叠、断点、单位全部一一对应。

## 三个练习场

1. **浏览器 DevTools**：Elements 面板的盒模型图与 Computed 面板是第 1、2 章的显微镜；
2. **本站源码**：`src/styles/global.css` 里有大量真例——oklch 暗色变量表（第 7、9 章）、`:target { scroll-margin-block }`（第 5 章）、`scrollbar-gutter: stable`（第 6 章）、层叠覆盖（第 10 章）；
3. **重做一个知名页面**：整个系列练手就用"还原一个你喜欢的网站首页"贯穿。

## 遗留问题

- 打印样式、无障碍焦点管理、`@font-face` 与字体子集化、SVG 样式未展开。
- Houdini、Scroll-driven Animations 等前沿特性以 MDN 兼容性表为准。
