---
title: "Astro 建站实战：跟着官方文档做一个博客"
description: "一套基于 Astro v7 官方文档的中文实战教程：从群岛架构讲到路由、内容集合、样式、岛屿、SEO 与部署，每一步都对照本站的真实实现。"
publishDate: 2026-10-05T10:00:00
tags: ["astro", "教程"]
---

# Astro 建站实战

一套基于 Astro v7 官方文档的中文实战教程：从「为什么是 Astro」出发，把文件路由、组件与布局、样式体系、内容集合、Markdown 渲染管线、交互岛屿、SEO 分发、构建部署逐一过一遍，最终长成一个能上线、能搜索、能分发的完整博客。

**你正在看的这个网站，就是用 Astro 写的。** 所以每一章除了讲文档概念，还有一节「对照本站」：把刚学的知识点映射到这个博客的真实源码上——你能看到每一个 API 在生产代码里的样子，包括我们踩过的坑。

## 这份教程怎么读

- **每章一个主题**，按顺序读最好，但每章也自成一体，可以按需跳读。
- **每章固定的结构**：学习目标 → 概念 → 动手实践 → 踩坑提示 → **对照本站**（真实文件路径）→ 练习 → 遗留问题（引出下一章）。
- 所有示例代码都基于 **Astro v7**，与官方文档（docs.astro.build）同步。

## 章节目录

| 章 | 文件 | 主题 |
| --- | --- | --- |
| 总览 | README.md | 本页 |
| 第 1 章 | 01-why-astro.md | 为什么是 Astro：内容优先与群岛架构 |
| 第 2 章 | 02-routing.md | 文件路由与动态路由 |
| 第 3 章 | 03-components-layouts.md | 组件、Props 与布局 |
| 第 4 章 | 04-styling.md | 样式体系：scoped、全局与 Tailwind |
| 第 5 章 | 05-content-collections.md | 内容集合：类型安全的写作流 |
| 第 6 章 | 06-markdown-pipeline.md | Markdown 渲染管线与代码高亮 |
| 第 7 章 | 07-islands.md | 交互岛屿：按需水合 |
| 第 8 章 | 08-seo-rss.md | SEO 与分发：sitemap、RSS、OG 图 |
| 第 9 章 | 09-deploy.md | 构建与部署：从本地到 Cloudflare |
| 附录 | appendix-cheatsheet.md | 速查表与资源 |

## 环境准备

```sh
# Node 22.19+ 或 24+（Astro v7 的要求）
node -v

# 创建第一个项目（选 Empty 模板即可跟着做）
npm create astro@latest
```

常用命令只有三个：

```sh
npm run dev      # 开发服务器 http://localhost:4321
npm run build    # 构建到 dist/
npm run preview  # 本地预览构建产物
```

## 前置知识

- HTML / CSS / 现代 JavaScript（模块、async/await、模板字符串）
- 不需要任何框架经验——Astro 组件比 React 组件更接近 HTML
- 需要一点 TypeScript 基础（本站与示例都用 TS，但可以当成「带类型的 JS」读）

## 约定

- 「对照本站」里的文件路径均指本博客仓库的相对路径，可直接在仓库里搜索定位。
- 示例代码力求可直接运行；与官方文档冲突时，以 docs.astro.build 为准并欢迎指正。
