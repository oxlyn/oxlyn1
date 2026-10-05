---
title: "Astro 主题开发 · 第 3 章：布局与插槽"
description: "BaseLayout 模式、slot 回退与命名插槽、嵌套布局复用，以及 Markdown 的 layout 属性。"
publishDate: 2026-10-05T14:15:00
tags: ["astro", "主题开发", "教程"]
---

> 本文对应官方文档[布局](https://docs.astro.build/zh-cn/basics/layouts/)，示例在其基础上改编。

**学习目标**：搭出主题的布局体系：外壳布局 + 内容布局的两层结构。

## 布局就是"带外壳的组件"

布局没有特殊性，只是惯例：提供页面外壳（`<html>`/`<head>`/`<body>`）和一个内容注入点。唯一硬规则：**`<html>` 必须是组件里所有元素的父级**，否则输出的 HTML 不合法。

```astro
---
// src/layouts/Base.astro
import Header from '@/components/layout/Header.astro'
import Footer from '@/components/layout/Footer.astro'
interface Props {
  title: string
  description?: string
}
const { title, description } = Astro.props
---
<html lang="zh-cn">
  <head>
    <meta charset="utf-8" />
    <title>{title}</title>
  </head>
  <body>
    <Header />
    <main>
      <slot />  <!-- 页面内容注入点 -->
    </main>
    <Footer />
  </body>
</html>
```

使用时像普通组件一样包住页面内容：

```astro
<BaseLayout title="首页">
  <p>页面内容会被放进 slot 里</p>
</BaseLayout>
```

## slot 的三种用法

- **默认插槽** `<slot />`：接住包在组件标签里的全部内容；
- **插槽回退**：`<slot />` 里写的内容是**默认值**，调用方什么都没传时显示——布局里给 `<main>` 一个"空页面"占位提示就很合适；
- **命名插槽** `<slot name="aside" />`：一个布局多个注入口，对应调用方的 `<Fragment slot="aside">…</Fragment>`。文章页的侧边栏就是典型：主内容走默认插槽，侧栏内容走命名插槽。

## 嵌套布局：主题布局体系的正解

官方推荐的模式是把外壳和内容版式拆成两层，内层复用外层：

```astro
---
// src/layouts/BlogPost.astro —— 只管文章版式
import BaseLayout from './Base.astro'
const { frontmatter } = Astro.props
---
<BaseLayout title={frontmatter.title}>
  <h1>{frontmatter.title}</h1>
  <time>{frontmatter.publishDate}</time>
  <article>
    <slot />
  </article>
</BaseLayout>
```

职责划分清晰：`BaseLayout` 管 head、导航、页脚这些**全站不变**的外壳；`BlogPost` 管标题、日期、正文的**版式**。使用者想换文章版式只动内层，想换全站外壳只动外层。本站就是这个结构（`Base.astro` + `BlogPost.astro`），后者还通过 props（如 `seriesRail`）把布局变体暴露给页面选择。

## Markdown 页面的 layout 属性

`src/pages/` 下的独立 `.md` 文件可以在 frontmatter 里指定 `layout`，布局会自动收到一组渲染属性：`frontmatter`、`url`、`headings`（标题树）等：

```md
---
layout: ../layouts/BlogPost.astro
title: 用 Markdown 写页面
---
正文内容……
```

注意适用边界：这只对"散装"的 pages 下的 md 有效，**内容集合不走这条路**（集合文章的布局在页面模板里统一套）。MDX 则必须手动 import 布局并自己传 props，且要自己写 `<meta charset="utf-8" />`。

## 踩坑提示

- 布局里忘写 `<meta charset="utf-8" />`，中文内容直接乱码——官方文档特别点名，MDX 场景 Astro 不会替你补。
- 嵌套布局时 props 要层层显式传递，内层布局收到的 `Astro.props` 只有调用方传的部分。
- 命名插槽拼错 `slot` 名不报错，内容静默消失——用 TypeScript 的 `Props` 约束插槽名做不到，但至少在使用处保持常量引用。

## 练习

1. 给第 1 章的项目补上 `Base.astro`，把 Header/Footer 从页面里挪进布局。
2. 新建 `BlogPost.astro` 嵌套复用 Base，渲染 frontmatter 的标题和日期。
3. 在 Base 里给默认插槽写一段回退内容，建一个空页面验证。
