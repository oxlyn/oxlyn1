---
title: "Astro 主题开发 · 第 6 章：主题配置文件"
description: "site.config 模式：单文件收敛全部用户可改项，配置驱动组件，TypeScript 保证配置质量。"
publishDate: 2026-10-02T17:00:00
tags: ["astro", "主题开发", "教程"]
---

> 本章是实践章（官方无对应单页），核心思路来自成熟主题（含本站所用 astro-cactus）的通用模式。

**学习目标**：设计主题的配置文件，让使用者"改一个文件就能换脸"。

## 一个文件，全部可改项

第 1 章说过主题化第一原则：会因人而异的东西收敛到少数入口。这个入口的具体形态，社区成熟主题几乎都选择了**一个 TypeScript 配置文件**：

```ts
// src/site.config.ts
export const siteConfig = {
  url: "https://example.com",   // 部署域名，RSS/sitemap/OG 依赖它
  title: "我的博客",
  author: "某人",
  description: "一句话介绍这个站",
  locale: "zh-cn",
  postsPerPage: 10,
  showLogo: true,
  menuLinks: [
    { title: "文章", path: "/posts/" },
    { title: "标签", path: "/tags/" },
    { title: "关于", path: "/about/" },
  ],
} as const
```

组件全部从这个文件取值——`Header` 读 `menuLinks` 渲染导航，`Footer` 读 `author` 拼版权，RSS 页读 `url` 和 `title`。使用者面对的是一份带注释、有类型、可补全的清单，而不是去翻你的组件源码。

## 为什么用 ts 而不是 json

- **类型与补全**：配置写错字段名，编辑器立刻红线；
- **允许简单逻辑**：菜单可以条件生成、值可以引用环境变量；
- **`as const` 的意义**：字面量类型收窄，下游组件拿到的类型精确。

代价是使用者要适应 TS 语法，但对博客主题的目标用户（开发者）来说这不算门槛——这也是为什么"给非开发者的主题"通常才选 JSON。

## 配置设计的分寸

**该进配置的**：站点身份（url/title/author）、导航菜单、每页数量、功能开关（showLogo 这类布尔）。

**不该进配置的**：

- **颜色等视觉 token**——那是 CSS 变量的地盘（第 4 章），配置文件里放色值会让两套"主题入口"打架；
- **内容结构**（集合 schema、文件位置）——改这个等于 fork 你的主题，文档里写清楚就行；
- **环境相关的秘密**（API key）——走环境变量（`import.meta.env.PUBLIC_*`），不进代码库。

判断标准和第 1 章一致：会因使用者而异且**不涉及视觉与内容结构**的，进配置。

## 配置的传播方式

配置文件 export 出去，谁需要谁 import——不要层层 props 传递（`Layout → Header → NavItem` 每层都要接一遍 `siteConfig`）。直接在叶子组件里 import 配置是社区主题的常规做法：配置是全局事实，不是组件数据流的一部分。例外是会影响**布局决策**的配置（如 `postsPerPage`），由页面读出后再以 props 下传。

## 踩坑提示

- `url` 忘了让使用者改，RSS/sitemap/OG 图全指向你的示例域名——配置注释里加粗提醒，README 部署章节再提一次（本站 README 就有这条）。
- 配置里放了函数或复杂对象，序列化类特性（如部分 integrations 的配置透传）会出问题——配置保持纯数据。
- 加配置项忘了给默认值，使用者的旧配置文件缺字段直接崩——新字段一律可选 + 默认值，这是配置文件的向后兼容底线。

## 练习

1. 给你的主题建 `site.config.ts`，收敛第 1 章找出的三处写死值。
2. 改造 `Header` 从 `menuLinks` 渲染导航，验证改配置即生效。
3. 给配置补一个 `postsPerPage`，让分页组件从配置读值。
