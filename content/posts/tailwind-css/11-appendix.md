---
title: "Tailwind CSS 实战入门 · 附录：速查与资源"
description: "常用原子类与指令一页速查，附十条团队规范与官方资源、站内对照索引。"
publishDate: 2026-08-11T09:00:00
tags: ["tailwindcss", "css", "教程"]
---

## 常用类速查

**间距与尺寸**（缩放：n × 0.25rem）

```
p-4 px-6 py-2 pt-2 ms-auto -mt-2   gap-4 gap-x-8
w-full h-screen size-10 max-w-3xl min-w-0 shrink-0 flex-1
inset-0 top-16 start-2 end-0
```

**颜色与视觉**

```
bg-white text-gray-600 border-gray-200   bg-black/50
rounded-lg rounded-full   border border-e border-s
shadow-sm shadow-md   opacity-75
```

**排版**

```
text-sm text-lg text-2xl   font-medium font-bold
leading-7 tracking-tight   truncate text-balance
text-start text-center
```

**Flex / Grid**

```
flex flex-col md:flex-row   items-center justify-between
grid grid-cols-12 sm:grid-cols-2 lg:grid-cols-3   col-span-9
```

**定位与层级**

```
relative absolute fixed sticky   z-0 z-40 z-50
overflow-hidden overflow-y-auto   backdrop-blur bg-white/80
```

## 变体前缀速查

| 前缀 | 含义 |
| --- | --- |
| `hover:` `focus-visible:` `active:` `disabled:` | 交互状态 |
| `sm: md: lg: xl:` `min-[56rem]:` | 响应式（min-width，从小到大） |
| `dark:` | 暗色（media 或自定义变体，见第 5 章） |
| `group-hover:` `peer-checked:` | 父/前置兄弟状态 |
| `md:hover:` | 叠加：从右往左读 |

## 指令速查（v4）

| 指令 | 用途 |
| --- | --- |
| `@import "tailwindcss"` | 入口（含 theme/base/utilities） |
| `@theme { --color-brand-500: ... }` | token → CSS 变量 + 工具类 |
| `@utility name { ... }` | 自定义原子类（可叠加变体） |
| `@custom-variant dark (...)` | 重定义 dark: 匹配规则 |
| `@apply` | CSS 里复用类串（兜底） |
| `@source` / `@source inline(...)` | 补充扫描路径 / 内联登记类 |
| `@config "./tailwind.config.ts"` | v3 兼容入口 |

## 十条团队规范

1. 编辑器插件（自动排序 + 悬停翻译）强制安装；
2. mobile-first：先写小屏，逐级加断点前缀；
3. 交互色 600、装饰色 300、浅底 50——色阶语义写进约定；
4. 逻辑属性（ps-/pe-/start-/end-）优先于 left/right；
5. 重复三次的类串 → 抽组件（props 查表），不是加 CSS；
6. 动态类名一律映射表字面量，模板禁止拼类名；
7. z-index 只用约定档位（0/40/50）；
8. 覆盖第三方：主题层改值、元素层改规则、unlayered 保命——注释说明原因；
9. `!` 前缀与 safelist 出现即评审；
10. 新增 @theme token 必须带引用场景。

## 十章一图

| 主线 | 章节 | 一句话 |
| --- | --- | --- |
| 原子类思维 | [1](/posts/tailwind-css/01-philosophy-and-setup/) [2](/posts/tailwind-css/02-core-utilities/) [3](/posts/tailwind-css/03-responsive/) [4](/posts/tailwind-css/04-states-variants/) | 类名即样式，缩放即 token，mobile-first |
| 设计系统 | [5](/posts/tailwind-css/05-dark-mode/) [6](/posts/tailwind-css/06-theme-customization/) [7](/posts/tailwind-css/07-layout-patterns/) [8](/posts/tailwind-css/08-component-extraction/) | 变量收口颜色，@theme 收口 token，组件收口复用 |
| 工程化 | [9](/posts/tailwind-css/09-plugins/) [10](/posts/tailwind-css/10-production/) | 插件默认值要审，静态扫描定生死，layer 定优先级 |

## 官方资源

- [Tailwind CSS 文档](https://tailwindcss.com/docs)——v4 全量指南
- [Playground](https://play.tailwindcss.com/)——浏览器里实验类名组合
- [升级指南](https://tailwindcss.com/docs/upgrade-guide)——v3 → v4 迁移（含自动升级工具）
- [Catalyst](https://tailwindcss.com/) 官方组件库——生产级组件的类名范本

## 站内对照索引

- 本站即 Astro + Tailwind 项目：三栏布局真例（[第 3、7 章](/posts/tailwind-css/07-layout-patterns/)）、暗色双变量表（[第 5 章](/posts/tailwind-css/05-dark-mode/)）、@utility prose（[第 6 章](/posts/tailwind-css/06-theme-customization.md)）、typography 两役（[第 9 章](/posts/tailwind-css/09-plugins.md)）、unlayered 覆盖（[第 10 章](/posts/tailwind-css/10-production.md)）
- 前置：[《JavaScript 核心入门》](/posts/javascript-core/)；姊妹篇：[《Astro 主题开发》](/posts/astro-theme-dev/)（组件 Props 与 class 转发在[第 2 章](/posts/astro-theme-dev/02-components-props.md)）
