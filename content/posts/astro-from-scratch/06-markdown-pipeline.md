---
title: "Astro 建站实战 · 第 6 章：Markdown 渲染管线"
description: "从 Markdown 到 HTML 的完整旅程：processor、remark/rehype 插件位、Expressive Code 高亮与 MDX 的取舍。"
publishDate: 2026-09-30T10:00:00
tags: ["astro", "教程"]
---

# 第 6 章 · Markdown 渲染管线

> 对应文档：[Markdown & MDX](https://docs.astro.build/en/guides/markdown-css/) · [Expressive Code](https://expressive-code.com/)

## 学习目标

- 看懂 Markdown → mdast → hast → HTML 的渲染旅程，知道插件插在哪。
- 会配置代码高亮（Expressive Code）并做主题适配。
- 能判断什么时候需要 MDX，什么时候 Markdown + 自定义插件就够。

## 概念：一条流水线

`render(entry)` 内部是条固定流水线：

```sh
Markdown 文本
  → 解析成 mdast（Markdown AST）     ← remark 插件在这一层（操作结构）
  → 转成 hast（HTML AST）            ← rehype 插件在这一层（操作输出）
  → 代码块交给语法高亮器处理
  → 序列化成 HTML
```

所有配置集中在 `astro.config.ts` 的 `markdown` 字段：`remarkPlugins`、`rehypePlugins`、`shikiConfig`/高亮器，以及 `extendMarkdownConfig`（MDX 是否继承这些配置）。

## 动手实践

### 一个最小的 rehype 插件

插件就是「接收 AST、改 AST」的函数：

```ts
// 给所有外链加 target="_blank"
function rehypeExternalLinks() {
  return (tree) => {
    tree.children.forEach((node) => {
      if (node.tagName === "a" && node.properties?.href?.startsWith("http")) {
        node.properties.target = "_blank";
        node.properties.rel = "noopener";
      }
    });
  };
}
```

自定义块语法（如提示块）通常在 remark 层解析标记，再在 hast 层渲染成组件——这就是社区 GFM admonitions（`> [!NOTE]`）的实现位置。

### 代码高亮：Expressive Code

```ts
// astro.config.ts
import expressiveCode from "astro-expressive-code";
export default defineConfig({
  integrations: [expressiveCode({
    themes: ["dracula", "github-light"],   // 暗、亮各一
    styleOverrides: { borderRadius: "4px" },
  })],
});
```

它比默认的 Shiki 多给：代码块复制按钮、文件名标签、`ins=/del=` 行高亮、diff 帧、终端帧。双主题跟随站点暗色模式的诀窍是用 `themeCssSelector` 让生成的 CSS 挂在 `[data-theme='dark']` 下。

### MDX：何时才需要

MDX = Markdown 里可以 `import` 组件并直接渲染。代价是内容不再是「纯文本可移植」，构建链也更重。判断标准：**交互组件需要插进文章中间**才用；否则 Markdown + 插件足够。

## 踩坑提示（全部真实经历）

- **「反引号没解析」假象**：`@tailwindcss/typography` 默认给行内代码 `::before/::after` 加装饰反引号 `content: "`"`，看起来像 Markdown 没渲染。修复是覆盖为 `content: none`——本站 `tailwind.config.ts` 里有一行注释记录此事。**遇到「渲染不对」先查 CSS 装饰，再查解析器。**
- 标题锚点、外链 `target` 这类需求别手写，官方/社区插件（autolink-headings、external-links）都是 hast 层的标准件。
- 自定义插件的调试方法：`astro.config` 里把 AST `console.dir` 出来——mdast 是 JSON 树，肉眼读比想象容易。
- 插件有 mdast/hast 两层之分，装错层的插件会「没效果但不报错」。

## 对照本站

- [astro.config.ts](/astro.config.ts) 的 `markdown` 段是本章全景图：自定义 processor 挂了 4 个 mdast 插件（图片解包、阅读时长、GitHub 仓库卡片、提示块）和 4 个 hast 插件（标题锚点、锚点链接、脚注角标、外链处理）——你在本站文章里看到的每一个「非原生 Markdown 效果」都对应其中一个插件。
- [src/plugins/admonitions.ts](/src/plugins/admonitions.ts)：自定义提示块的双层实现——remark 层认语法，hast 层渲染成带图标的容器，配套样式在 `src/styles/components/admonition.css`。想写自己的第一个 Markdown 插件，照它抄。
- 代码高亮：Expressive Code 双主题（dracula / github-light），`themeCssSelector` 对齐 `[data-theme]`，配置在 [src/site.config.ts](/src/site.config.ts) 的 `expressiveCodeOptions`。
- MDX：本站装了 `@astrojs/mdx` 以备交互内容，但目前所有文章都是纯 `.md`——实践「能不用就不用」。

## 练习

1. 写一个 rehype 插件，给所有 `h2` 加上 emoji 前缀。
2. 开启 Expressive Code，试着用 `ins`/`del` 语法高亮一版「修改前后」代码。
3. 复刻一个最简 admonition：识别 `> [!TIP]` 开头的引用块，渲染成带边框的提示容器。

## 遗留问题

纯静态内容站的路走通了。但如果某个局部真需要交互——搜索、切换、表单——难道要放弃零 JS？下一章：岛屿。
