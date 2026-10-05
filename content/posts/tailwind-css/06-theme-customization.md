---
title: "Tailwind CSS 实战入门 · 第 6 章：主题定制"
description: "v4 的 CSS-first 定制：@theme 变量生成工具类、@utility 自定义原子类、v3 兼容。"
publishDate: 2026-08-18T09:00:00
tags: ["tailwindcss", "css", "教程"]
---

> 本文对应官方文档[主题](https://tailwindcss.com/docs/theme)与[添加自定义样式](https://tailwindcss.com/docs/adding-custom-styles)。

**学习目标**：用 `@theme` 把品牌 token 变成工具类，用 `@utility` 造自己的原子类，知道 v3 项目的迁移路径。

## @theme：CSS 变量即配置

v4 把"配置文件"搬进了 CSS：在 `@theme` 里定义变量，框架**同步生成两样东西**——CSS 变量（进 :root）和对应的工具类：

```css
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(62% 0.19 258);   /* → bg-brand-500 / text-brand-500 ... */
  --color-brand: #1d4ed8;                   /* → bg-brand / text-brand（不带档位） */
  --font-display: "Source Han Sans", sans-serif;  /* → font-display */
  --breakpoint-3xl: 120rem;                 /* → 3xl: 前缀 */
  --animate-fade-in: fade-in 0.3s ease-out; /* → animate-fade-in */
}
```

变量名即类名契约：`--color-*` 出颜色族、`--font-*` 出字体族、`--breakpoint-*` 出断点、`--spacing-*` 出间距——**改一处，全站工具类跟着变**。第 5 章暗色方案的 `--color-global-bg: var(--bg)` 就是在这个层面接线。

品牌接入的完整动作只需三步：设计稿取色 → 按 11 档补全 `--color-brand-50..950` → 全站用 `text-brand-600` 替换默认色。配色梯度可以用 oklch 色相旋转生成，保证感知亮度均匀。

## @utility：造自己的原子类

`@utility` 定义**可参与变体系统**的自定义工具类（`hover:`、`md:` 照常可用）——这是它优于普通 CSS 类的地方：

```css
@utility text-balance-pretty {
  text-wrap: pretty;
}

@utility content-auto {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}
```

```html
<p class="text-balance-pretty md:text-lg">长段落自动平衡断行。</p>
```

本站真例：`global.css` 里的 `@utility prose`——把 typography 插件的颜色变量重映射到主题 token（`--tw-prose-body: var(--color-global-text)` 等），让文章排版跟随亮暗主题。这就是 `@utility` 的典型用途：**把一组相关声明收敛成一个语义化原子类**。

## @apply 与 @layer 的边界

- `@apply`：在 CSS 里复用原子类串（`.btn { @apply rounded-lg px-4 py-2 font-medium; }`）——能用，但它是"退回 CSS 文件"的后门，规则见[第 8 章](/posts/tailwind-css/08-component-extraction.md)；
- `@layer base/components/utilities`：改基础样式（如标题默认间距）用 `@layer base { h1 { ... } }`；`preflight`（[重置样式](https://tailwindcss.com/docs/preflight)）的个别覆盖也在这里做；
- `@config "../../tailwind.config.ts"`：v3 配置文件的兼容入口——存量项目过渡用，新项目不写。

## 主题设计的最小集

起步项目的 token 清单，比想象中短：

```css
@theme {
  /* 品牌 + 语义色（第 5 章变量法） */
  --color-brand-50..950
  /* 字体：无衬线一份、等宽一份（代码块用） */
  --font-sans / --font-mono
  /* 圆角档位收敛 */
  --radius-card: 0.75rem
}
```

**先窄后宽**：遇到"这个值反复出现"再加 token，别一上来造 200 个变量——token 的价值在"被反复引用"，不在"存在"。

## 踩坑提示

- `@theme` 变量改了没生效：工具类是**编译期**生成的，确认文件在编译入口（被 @import 的链路上）。
- 自定义色只定义了 500 一档，`bg-brand-200` 就是空类——要么补全档位，要么用无档位形式 `--color-brand`。
- `@utility` 里用 `@apply` 套另一个 @utility 会循环——自定义原子类里写原生声明最稳。

## 练习

1. 定义品牌色五档（50/100/600/800/950），把第 4 章的按钮全部换成品牌色。
2. 造一个 `@utility line-clamp-safe`（含 contain-intrinsic-size），验证 `hover:` 前缀可用。
3. 用 `--breakpoint-xs` 加一档 480px 断点，验证 `xs:` 前缀生效。
