---
title: "Tailwind CSS 实战入门 · 第 9 章：插件生态"
description: "typography 插件的 prose 体系与两场真实战役：65ch 宽度陷阱与装饰反引号。"
publishDate: 2026-08-21T09:00:00
tags: ["tailwindcss", "css", "教程"]
---

> 本文对应官方文档 [typography 插件](https://tailwindcss.com/docs/typography-plugin)。两场战役来自本站真实改造记录。

**学习目标**：用 typography 插件给 Markdown 正文排版，掌握插件主题的两个定制层面，见识别"第三方插件的默认值也是要审的"。

## prose：给"没有类名的 HTML"排版

Markdown 渲染出来的 HTML 没有类名，原子类无处安放——typography 插件的解法是给**容器**一个类，内部所有元素按排版规则着装：

```astro
---
import { renderedPost } from '../data/post'
---
<article class="prose dark:prose-invert max-w-none">
  <Fragment set:html={renderedPost} />
</article>
```

`prose` 提供：标题/段落/列表/引用/表格/代码的完整排版层级；`prose-lg/sm` 调整整体字号；`dark:prose-invert` 是暗色适配的官方姿势。修饰类全走变体体系（第 4 章的知识直接复用）。

## 战役一：65ch 宽度陷阱

上线第一天就发现的怪象：**代码块右侧永远空一截**，中间内容列没占满。根因是 `prose` 自带 `max-width: 65ch`——它假设你把文章放窄栏里读，而本站是"全宽内容列"的设计。

解法一行：容器加 `max-w-none` 覆盖内置上限。

教训值得通用化：**插件的默认值是它作者的设计假设，不是你的**。接入任何 typography/layout 类插件，第一件事是读它的默认 token（字号阶梯、宽度、间距），列出与你设计稿冲突的项，再决定"覆盖"还是"顺应"。

## 战役二：装饰反引号

第二个怪象：行内代码 `` `code` `` 渲染出来**两边各多一个引号**，看起来像伪元素。确实就是伪元素——prose 默认给 `code::before/::after` 注入一对引号装饰（它认为这样更好看）。

关闭它要进插件的**主题定制层**（v3 时代写在 tailwind.config 的 typography 配置里，本站保存了这段历史配置）：

```ts
// tailwind.config.ts（节选）
plugin: ({ theme }) => ({
  ...typography(),
  theme: {
    ...theme,
    code: {
      ...theme.code,
      'code::before': { content: 'none' },   // 关闭装饰反引号
      'code::after': { content: 'none' },
    },
  },
})
```

v4 的 CSS-first 写法可以直接用 `@utility`/`@layer` 覆盖同名规则，效果一致。两层定制口的分工：**主题层改"值"**（颜色/字号/间距——接 token，见[第 6 章](/posts/tailwind-css/06-theme-customization.md)的 prose 重映射），**元素层改"规则"**（增删伪元素、改选择器行为）。

## 插件生态速览

- **@tailwindcss/typography**：本文主角，长文站必备；
- **@tailwindcss/forms**：统一表单控件基线（reset 掉浏览器千姿百态的默认样式），表单多的应用接它省一半纠偏类；
- **@tailwindcss/aspect-ratio、container-queries**：v4 已原生支持对应能力，老项目里它们还是插件形态——读文档时先确认版本归属；
- 自定义插件：需要跨项目分发的规则集时再写（plugin API 基于 addUtilities/addComponents），一般项目用不到。

## 踩坑提示

- `prose` 忘配 `dark:prose-invert`，暗色模式下正文黑字黑底——[第 5 章](/posts/tailwind-css/05-dark-mode.md)变量 token 法可以更彻底：把 prose 的颜色变量重映射到主题变量，暗色免费。
- 插件版本与 Tailwind 大版本错配（v4 项目装了 v3 时代插件的旧版）——报错信息往往指向"类不存在"而非版本，先查兼容表。
- `prose` 里的 img/video 默认样式激进（如圆角外边距），图文混排需求复杂时，逐元素覆盖比全盘放弃插件划算。

## 练习

1. 给一篇文章页接入 prose + prose-invert，确认暗色下代码块可读。
2. 复现 65ch 陷阱：去掉 max-w-none 看代码块右侧留白，再修复。
3. 把 prose 的 body/heading 颜色重映射到自己的主题变量（@utility 层），删掉 dark:prose-invert 试试是否仍然全暗色正确。
