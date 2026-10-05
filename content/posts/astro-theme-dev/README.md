---
title: "Astro 主题开发：从写网站到做主题"
description: "Astro 主题开发系列总览：主题与网站的区别、两种分发形态、章节导航与学习路线。"
publishDate: 2026-10-05T09:00:00
tags: ["astro", "主题开发", "教程"]
---

写过 Astro 网站之后，下一步自然是：能不能把我这套设计**复用**出去，让别人也用上？这就是主题开发——它和建站的区别不在技术难度，而在约束的转换：网站里你可以随手写死的东西（标题、导航、颜色），在主题里都必须收敛成**配置项**或**内容约定**，因为用主题的人和你不是一个人。

这个系列以官方文档为基础，带你把"一个能跑的博客"重构成"一个可分发的 Astro 主题"。一个现成的对照物就在眼前：**本站就是 [astro-cactus](https://github.com/chrismwilliams/astro-cactus) 主题 v8.3.0 的 fork**——一个把站点配置、内容 schema、布局分层都收敛过的成熟主题，每个环节我们都会回头看看它是怎么做的。

> 内容依据 Astro 官方文档整理（组件、布局、样式、发布等页面），代码示例在其基础上改编，每章开头给出对应文档链接。

## 主题的两种形态

| 形态 | 使用方式 | 适合 |
| --- | --- | --- |
| **模板仓库**（GitHub Template） | 用户点 "Use this template" 或 clone 后自己改代码 | 设计感强、深度定制的博客主题 |
| **npm 组件包** | `npm install` 后按需引入组件/集成 | 复用某个部件（组件、适配器、加载器） |

两个形态不互斥：astro-cactus 本质是模板仓库形态，但同样的代码加上 `package.json` 的 `exports` 就能变成 npm 包。第 7 章会展开两条路线。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：主题的骨架](/posts/astro-theme-dev/01-theme-skeleton/) | 项目结构、目录分层、"会变的东西"收敛原则 | [项目结构](https://docs.astro.build/zh-cn/basics/project-structure/) |
| [第 2 章：组件与 Props](/posts/astro-theme-dev/02-components-props/) | 组件语法、Props 接口、class 传递 | [Astro 组件](https://docs.astro.build/zh-cn/basics/astro-components/) |
| [第 3 章：布局与插槽](/posts/astro-theme-dev/03-layouts-slots/) | BaseLayout 模式、slot 回退、嵌套布局 | [布局](https://docs.astro.build/zh-cn/basics/layouts/) |
| [第 4 章：样式与主题化](/posts/astro-theme-dev/04-styling-theming/) | scoped 样式、全局样式边界、CSS 变量与暗色模式 | [样式与 CSS](https://docs.astro.build/zh-cn/guides/styling/) |
| [第 5 章：为内容设计 schema](/posts/astro-theme-dev/05-content-schema/) | 内容集合即契约：主题作者的 frontmatter 设计 | [内容集合](https://docs.astro.build/zh-cn/guides/content-collections/) |
| [第 6 章：主题配置文件](/posts/astro-theme-dev/06-theme-config/) | site.config 模式：让用户改一个文件就能换脸 | —（实践章） |
| [第 7 章：分发主题](/posts/astro-theme-dev/07-publish-theme/) | 模板仓库 vs npm 包、workspaces、发布流程 | [发布到 npm](https://docs.astro.build/zh-cn/guides/publish-to-npm/) |
| [附录：主题开发检查清单](/posts/astro-theme-dev/08-appendix/) | 七个维度的自查清单 + 文档索引 | — |

## 学习路线建议

- 已读过本站[《Astro 建站实战》](/posts/astro-from-scratch/)系列：路由、内容集合基础、部署在那边讲过，本系列不重复，直接从"主题化改造"切入。
- 没读过也行：跟着官方 [Blog 教程](https://docs.astro.build/zh-cn/tutorials/blog/)先建一个最小博客，再从第 1 章开始做主题化改造，效果一样。

## 遗留问题

- 主题的国际化（i18n）与多语言路由，超出本系列范围，官方有独立指南。
- 表单、搜索等需要服务端的交互，静态主题只覆盖前端形态。
