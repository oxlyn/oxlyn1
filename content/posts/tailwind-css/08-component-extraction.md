---
title: "Tailwind CSS 实战入门 · 第 8 章：组件抽取的边界"
description: "三层复用的优先级：框架组件优先、@utility 次之、@apply 兜底——用 Button 组件实战。"
publishDate: 2026-08-20T09:00:00
tags: ["tailwindcss", "css", "教程"]
---

> 本文对应官方文档[添加自定义样式](https://tailwindcss.com/docs/adding-custom-styles)。

**学习目标**：建立"复用层级"的判断力：什么时候抽组件、什么时候写 @utility、什么时候才轮到 @apply。

## 重复的三次法则与三个去处

原子类天然有重复：同一个按钮组合出现十次，改一次要改十处。Tailwind 官方的建议先"忍三次"（第 1 章），第三次出现时抽取——但**抽到哪里**是层级决策：

| 层级 | 载体 | 参数化能力 | 适用 |
| --- | --- | --- | --- |
| **组件层** | Astro/React/Vue 组件 | props/插槽，最强 | 有结构、有行为、有变体 |
| **工具类层** | `@utility` | 变体可叠加 | 一组固定声明、需响应 hover/md: |
| **样式层** | `@apply` | 无 | 组件库外的第三方挂载点、编辑器限制场景 |

判断顺序自上而下：**能用组件解决的不要用 CSS 抽象**——组件还能收编逻辑与可访问性属性，CSS 抽象做不到。

## 组件层实战：Button 的变体设计

用 Astro 组件做一个支持变体的按钮，注意两个关键点——**class 转发**（[主题系列第 2 章](/posts/astro-theme-dev/02-components-props.md)讲过的保留字解构）与**变体映射表**：

```astro
---
// src/components/ui/Button.astro
interface Props {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'md' | 'sm'
  class?: string
}
const { variant = 'primary', size = 'md', class: className, ...rest } = Astro.props

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700',
  ghost:   'bg-transparent text-brand-600 hover:bg-brand-50',
  danger:  'bg-red-600 text-white hover:bg-red-500',
} as const
const sizes = { md: 'px-4 py-2 text-sm', sm: 'px-2.5 py-1.5 text-xs' } as const
---
<button class:list={[
  'inline-flex items-center gap-2 rounded-lg font-medium transition-colors',
  'focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-50',
  variants[variant], sizes[size], className,
]} {...rest}>
  <slot />
</button>
```

三层信息各归其位：**不变的结构**（圆角/布局/过渡）写死，**会变的语义**（变体/尺寸）查表，**调用方的个性**（className）拼接在最后——后者可覆盖前者是 class:list 拼接顺序给的自由。

类名是**完整字面量**出现在映射表里（第 10 章会讲为什么必须如此——编译器靠静态扫描收集类名）。

## @utility 层：无结构的声明组

没有结构、纯粹一组声明的复用（`text-balance-pretty`、[第 6 章](/posts/tailwind-css/06-theme-customization.md)的 `prose` 重映射），走 `@utility`——它比组件轻、比 @apply 强（可叠加变体）。

## @apply：最后的兜底

```css
/* 第三方组件的挂载点——你控制不了它的标记，只能在 CSS 里上类 */
.vditor-reset {
  @apply text-sm leading-7 text-global-text;
}
```

`@apply` 的三个已知代价：可读性（类串写进 CSS 后变"暗物质"）、优先级纠缠（见第 10 章）、与设计系统的脱节（组件 props 能做校验，@apply 不能）。本站只在**编辑器/markdown 管线注入的第三方标记**处用了它——这是它正当的生存空间。

## 团队约定建议

- 组件 props 用字面量联合（`variant: 'primary' | 'ghost'`），调用方拼错编译期就报错；
- 类名串超过一行（约 8-10 个类）且重复三次 → 抽组件或 @utility；
- `!important` 前缀（`!text-red-500`）只用于压第三方库的样式，自研组件里出现即事故。

## 踩坑提示

- 组件 props 传 color 字符串拼接类名（`class={`bg-${color}-600`}`）——编译器扫不到，第 10 章的主题，这里先立规矩：**映射表写全字面量**。
- @apply 里的自定义类（`@apply text-brand-600`）要求该工具类在编译期可见——跨文件引用注意 @import 链。
- Astro 的 `class:list` 数组里塞 `undefined`/`false` 没问题（自动过滤）——条件变体放心写。

## 练习

1. 把第 4 章的按钮抽成带三变体的组件，在两个页面里各用一次，再全局改一次圆角验证收口效果。
2. 故意写一版"模板字符串拼类名"的变体实现，观察生产构建里类丢失。
3. 在一个第三方挂载点（如 markdown 正文容器）用 @apply 定制，体会这层为什么是兜底。
