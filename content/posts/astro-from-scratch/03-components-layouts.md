---
title: "Astro 建站实战 · 第 3 章：组件、Props 与布局"
description: ".astro 组件的复用单元：Props 类型、slot 插槽、嵌套组合出整页布局。"
publishDate: 2026-10-05T10:30:00
tags: ["astro", "教程"]
---

# 第 3 章 · 组件、Props 与布局

> 对应文档：[Components](https://docs.astro.build/en/basics/astro-components/) · [Layouts](https://docs.astro.build/en/basics/layouts/)

## 学习目标

- 会写接收 `Props` 的组件，并理解构建时求值的含义。
- 掌握 `<slot />` 与命名插槽，看懂「布局就是套了 `<slot />` 的组件」。
- 能把页面骨架抽成 Layout，让每个页面只剩差异部分。

## 概念

Astro 组件没有实例、没有状态、没有生命周期——它更像「构建时执行的模板函数」：栅栏代码跑一次，输出一段 HTML。复用靠三件事：**Props 传数据、slot 传结构、import 传位置**。

## 动手实践

### Props

```astro
---
// src/components/PostCard.astro
interface Props {
  title: string;
  href: string;
  date?: Date;
}
const { title, href, date } = Astro.props;
---
<article>
  <h3><a href={href}>{title}</a></h3>
  {date && <time datetime={date.toISOString()}>{date.toLocaleDateString("zh-CN")}</time>}
</article>
```

`interface Props` 是纯 TypeScript，编辑器全程检查。Astro 组件**不能**有 `className` 这类运行时魔法——写什么就是什么。

### slot 与布局

布局 = 套了 `<slot />` 的组件。命名插槽用 `<slot name="x">`，使用方用 `slot="x"` 属性填充：

```astro
---
// src/layouts/Base.astro
const { title } = Astro.props;
---
<html lang="zh-CN">
  <head><title>{title}</title></head>
  <body>
    <nav>…导航…</nav>
    <main><slot /> {/* 页面内容注入这里 */}</main>
    <footer>…</footer>
  </body>
</html>
```

```astro
---
// src/pages/about.astro
import Base from "../layouts/Base.astro";
---
<Base title="关于">
  <h1>关于我</h1>
  <p>普通内容进默认 slot。</p>
  <aside slot="sidebar">命名插槽按位置注入。</aside>
</Base>
```

### 布局套布局

布局也是组件，自然可以嵌套：页面级 Layout 引入更外层的文档骨架，逐层组合。

## 踩坑提示

- 给「整页布局」传进来的 `<slot />` 内容是在**使用方**上下文求值的——样式作用域属于各页面自己，布局里的 scoped 样式管不到页面内容（需要时用 `:global()` 或全局样式，第 4 章）。
- `Astro.props` 解构后别忘了默认值写法：`const { draft = false } = Astro.props`。
- slot 不是 props：传结构用 slot，传数据用 props，别混。

## 对照本站

- [src/layouts/Base.astro](/src/layouts/Base.astro)：全站的文档骨架（`<html>`、`<head>`、页头页脚），`Props` 里除了 `meta` 还有一个布尔 `seriesRail`——这正是上一轮「系列页三栏布局」改造的入口：布局通过 prop 感知页面类型，给 `<body>` 附加 `series-rail-layout` 类。
- [src/layouts/BlogPost.astro](/src/layouts/BlogPost.astro)：**布局套布局**的示范——文章布局在 BaseLayout 之上再叠一层「页头 + 正文 + 目录侧栏」的结构，并把 `<slot />`（正文 Markdown）放进 prose 容器。
- [src/components/layout/Header.astro](/src/components/layout/Header.astro)：读 `site.config.ts` 的 `menuLinks` 数组渲染导航——组件 + 配置驱动的典型写法，改导航菜单不用碰组件。

## 练习

1. 把第 2 章的名言页公共骨架抽成 `QuoteLayout.astro`。
2. 给布局加一个命名插槽 `header-extra`，在其中一个页面里塞一个搜索框占位。
3. 给 `PostCard` 加 `pinned` 布尔 prop，置顶时多渲染一个 📌。

## 遗留问题

组件和布局的问题解决了，但所有页面还共用同一套样式，改一个颜色要全局搜索替换。样式体系怎么组织？下一章。
