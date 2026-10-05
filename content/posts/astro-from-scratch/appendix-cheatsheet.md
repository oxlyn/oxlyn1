---
title: "Astro 建站实战 · 附录：速查表与资源"
description: "九章内容的浓缩：命令、API、指令一页速查，官方文档地图与本站文件对照。"
publishDate: 2026-10-04T10:00:00
tags: ["astro", "教程"]
---

# 附录 · 速查表与资源

## 命令

```sh
npm create astro@latest      # 新建项目
npm run dev                  # 开发服务器 :4321
npm run build                # 构建 → dist/
npm run preview              # 预览构建产物
npx astro add <react|mdx|sitemap|tailwind|cloudflare|...>   # 加集成
npx astro check              # 类型与错误检查
```

## 内容集合 API

```ts
import { defineCollection } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";
import { getCollection, getEntry, render } from "astro:content";

const post = defineCollection({
  loader: glob({ base: "./content/posts", pattern: "**/*.{md,mdx}" }),
  schema: z.object({ title: z.string(), publishDate: z.coerce.date() }),
});
export const collections = { post };

const all = await getCollection("post", ({ data }) => !data.draft);  // 查询+过滤
const one = await getEntry("post", "my-post");                        // 单条
const { Content } = await render(one);                                // 渲染正文
// entry.id：路径 id；entry.data：校验后的 frontmatter；entry.body：原始文本
```

常用 zod 片段：`z.coerce.date()`、`z.array(z.string()).default([])`、`z.boolean().default(false)`、`z.iso.datetime({ offset: true })`、`image()`、`.transform()`。

## 路由

```astro
---
export function getStaticPaths() {
  return [{ params: { id: "a" }, props: { x: 1 } }];  // 静态模式必填
}
export function getStaticPaths({ paginate }) {         // 分页
  return paginate(items, { pageSize: 10 });
}
const { id } = Astro.params;   // 路径参数
const { page } = Astro.props;  // paginate 的页对象：data/currentPage/lastPage/url.prev|next
---
```

文件名约定：`[id].astro` 单段动态；`[...slug].astro` rest 参数；`_` 前缀排除。优先级：静态 > 动态参数 > rest。

## client 指令

| 指令 | 水合时机 |
| --- | --- |
| `client:load` | 页面加载立即 |
| `client:idle` | requestIdleCallback 后 |
| `client:visible` | 滚入视口 |
| `client:media="(max-width: 768px)"` | 媒体查询匹配 |
| `client:only="react"` | 纯客户端，跳过 SSR |

岛屿边界：props 必须可序列化（函数不行）；岛屿内不能 import Astro 组件（用 slot 从外部传）；Astro 组件不可水合。

## 样式

```astro
<style>/* scoped */</style>
<style is:global>/* 全局 */</style>
<style>:global(.x) {}</style>   /* 选择器逃逸 */
```

Tailwind 4：`@tailwindcss/vite` 插件 + CSS 里 `@import "tailwindcss"`；主题 token 走 `@theme`；层级用 `@layer`；暗色模式推荐「CSS 变量 + `[data-theme]` 属性」。

## meta / 分发

- `astro.config.ts` 的 `site` 是 sitemap / RSS / OG 的地基，上线前必改。
- RSS：`src/pages/rss.xml.ts` 导出 `GET`，用 `@astrojs/rss` 组装 items。
- OG 图：satori（HTML-ish → SVG）+ sharp（→ PNG），构建期按文章生成，记得缓存。

## 官方文档地图

| 主题 | 地址 |
| --- | --- |
| 入门教程 | docs.astro.build/en/tutorial/ |
| 路由 | docs.astro.build/en/guides/routing/ |
| 内容集合 | docs.astro.build/en/guides/content-collections/ |
| Markdown 与 MDX | docs.astro.build/en/guides/markdown-css/ |
| 框架岛屿 | docs.astro.build/en/guides/framework-components/ |
| 指令参考 | docs.astro.build/en/reference/directives-reference/ |
| 部署指南 | docs.astro.build/en/guides/deploy/ |
| Expressive Code | expressive-code.com |

## 本站文件对照表

| 教程知识点 | 本站文件 |
| --- | --- |
| 配置与集成 | `astro.config.ts` |
| 站点元数据与导航 | `src/site.config.ts` |
| 内容集合 schema | `src/content.config.ts` |
| 查询层封装 | `src/data/post.ts` |
| 布局嵌套 | `src/layouts/Base.astro`、`src/layouts/BlogPost.astro` |
| 系列识别与排序 | `src/utils/series.ts` |
| Markdown 插件 | `src/plugins/`（admonitions、github-cards 等） |
| 代码高亮配置 | `src/site.config.ts` 的 `expressiveCodeOptions` |
| 暗色模式 | `src/styles/global.css` + `ThemeProvider/ThemeToggle` |
| 分页路由 | `src/pages/posts/[...page].astro`、`src/pages/tags/[tag]/[...page].astro` |
| RSS | `src/pages/rss.xml.ts`、`src/pages/notes/rss.xml.ts` |
| OG 图 | `src/pages/og-image/[...slug].png.ts` |
| 部署 | `README.md` 部署一节 |
