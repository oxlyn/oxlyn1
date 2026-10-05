---
title: "Astro 建站实战 · 第 4 章：样式体系"
description: "scoped 样式、is:global、@layer 分层与 Tailwind 4 的接入方式，外加暗色模式的实现。"
publishDate: 2026-09-10T09:00:00
tags: ["astro", "教程"]
---

# 第 4 章 · 样式体系

> 对应文档：[Styles & CSS](https://docs.astro.build/en/guides/styling/) · [Tailwind](https://docs.astro.build/en/guides/styling/)

## 学习目标

- 理解 Astro scoped 样式的实现原理与 `<style is:global>` 的适用场景。
- 看懂 Tailwind 4 通过 Vite 插件接入后，主题在 CSS 里配置的新形态。
- 掌握一种可靠的暗色模式实现：CSS 变量 + `data-theme` 属性。

## 概念

Astro 的样式分三档，按「作用范围」选：

1. **scoped**（默认）：`<style>` 里的规则被编译时改写成 `div[data-astro-cid-xxx]`，天然隔离。
2. **is:global**：本组件样式全局生效，用于第三方库的覆盖、 resetting。
3. **外部 CSS / Tailwind**：设计系统层面的全局约定。

## 动手实践

### scoped 与 :global

```astro
<style>
  h1 { color: teal; }                /* 只影响本组件的 h1 */
  :global(.prose) img { margin: 0 auto; }  /* 逃逸到全局 */
</style>
```

### Tailwind 4

Tailwind 4 没有了 `tailwind.config` 强依赖，接入变成一个 Vite 插件加一条 CSS 入口：

```ts
// astro.config.ts
import tailwind from "@tailwindcss/vite";
export default defineConfig({
  vite: { plugins: [tailwind()] },
});
```

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-brand: oklch(55% 0.2 20);
}
```

工具类直接写在模板里；主题 token 用 `@theme` 声明成 CSS 变量，`text-brand` 这类类名自动生成。

### 暗色模式：变量 + 属性切换

```css
:root { --color-bg: white; --color-text: black; }
html[data-theme="dark"] { --color-bg: #111; --color-text: #eee; }
body { background: var(--color-bg); color: var(--color-text); }
```

切换主题只需要 `document.documentElement.dataset.theme = "dark"`——纯 CSS 变量级联，不需要任何框架状态管理。配合 `transition` 还能拿到平滑的配色过渡。

## 踩坑提示

- **scoped 样式管不到 `<slot />` 注入的内容**：插槽内容的类名属于「提供方」组件。跨组件样式要么写在双方共用的全局层，要么用 `:global()`。
- Tailwind 4 里旧版 `tailwind.config.ts` 的 `theme.extend` 大多迁移进 CSS（`@theme`、`@utility`）；本站保留 config 文件只是为 `@tailwindcss/typography` 插件传参。
- 第三方组件库的内部 DOM 用 scoped 样式永远打不中，直接 `is:global` 精确选择器覆盖。

## 对照本站

- [src/styles/global.css](/src/styles/global.css)：Tailwind 4 形态的活样本——开头 `@layer theme, base, pagefind, components, utilities` 声明层级顺序；`@property` 注册主题色变量；`@custom-variant dark` 把暗色变体绑定到 `[data-theme="dark"]`；底部 `@utility prose` 自定义工具类。
- 暗色模式：颜色全部走 CSS 变量，`html[data-theme="dark"]` 一段覆盖变量值；[src/components/ThemeProvider.astro](/src/components/ThemeProvider.astro) 负责初始化与持久化，[ThemeToggle.astro](/src/components/ThemeToggle.astro) 负责切换——就是我们第 1 章说的「变量 + 属性」方案。
- 上一章的 `seriesRail` 布局让位规则写在 global.css 末尾的裸 `@media` 块里，**故意不放 layer**：层级外样式优先于 Tailwind 工具类，正好压过 `<body>` 上的 `mx-auto max-w-3xl`。
- typography 插件的个性化配置（行内代码边框、脚注 `[1]` 角标）在 [tailwind.config.ts](/tailwind.config.ts)——它是这套体系里唯一还靠 config 文件传参的部分。

## 练习

1. 给第 3 章的 `PostCard` 写 scoped 样式，再建第二个使用方组件，确认样式互不影响。
2. 用 `@theme` 加一个品牌色变量，做一个 `bg-brand` 的按钮。
3. 复刻本站的暗色切换：三个 CSS 变量 + 一个 `data-theme` 属性 + 两行 script。

## 遗留问题

样式就绪。但「文章」现在只是硬编码的 props——标题、日期、正文该存在哪，怎么校验，怎么查询？下一章：内容集合。
