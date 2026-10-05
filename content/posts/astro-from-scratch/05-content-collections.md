---
title: "Astro 建站实战 · 第 5 章：内容集合"
description: "content.config.ts 定义集合、glob loader 加载 Markdown、zod 校验 frontmatter，getCollection 类型安全查询。"
publishDate: 2026-09-29T10:00:00
tags: ["astro", "教程"]
---

# 第 5 章 · 内容集合

> 对应文档：[Content Collections](https://docs.astro.build/en/guides/content-collections/)

## 学习目标

- 会定义集合：`defineCollection` + glob loader + zod schema。
- 理解 schema 带来的三件礼物：校验、类型、自动补全。
- 会用 `getCollection` / `render` 完成查询与渲染，并接进第 2 章的动态路由。

## 概念

内容集合解决「一堆 Markdown 文件」的结构化问题：**在哪**（loader）、**长什么样**（schema）、**怎么查**（query API）。配置写在 `src/content.config.ts`：

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const post = defineCollection({
  loader: glob({ base: "./content/posts", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string().max(60),
    description: z.string(),
    publishDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { post };
```

schema 校验发生在**内容同步时**：任何一个文件的 frontmatter 不合规，构建直接失败并指出文件与字段——错误在上线前暴露，而不是渲染出一个空标题的页面。

## 动手实践

### 查询与渲染

```astro
---
// src/pages/posts/[...slug].astro
import { getCollection, render } from "astro:content";

export async function getStaticPaths() {
  const posts = await getCollection("post", ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}
const { post } = Astro.props;
const { Content } = await render(post);
---
<h1>{post.data.title}</h1>
<Content />
```

要点：

- `getCollection("post", 过滤函数)` 返回 `CollectionEntry[]`；每个 entry 有 `id`（glob loader 按文件路径生成，含子目录）、`data`（schema 校验后的 frontmatter）、`body`（原始正文）。
- `render(entry)` 返回的 `<Content />` 才是把 Markdown 变 HTML 的那一步（第 6 章拆它）。
- `getCollection` **不保证顺序**，按日期排要自己 `.sort()`。
- frontmatter 里写 `slug` 字段可自定义 id；URL 里想用子目录结构，靠 id 天然支持。

### 类型红利

`entry.data.title` 有完整类型，`CollectionEntry<'post'>` 可以直接当组件 Props 用——schema 就是单一事实来源。

## 踩坑提示

- `z.coerce.date()` 比 `z.date()` 实用：frontmatter 里的日期是字符串，coerce 帮你转。要求带时区的严格格式就用 `z.iso.datetime({ offset: true })`（本站便签集合这么干）。
- schema 里没声明的 frontmatter 字段会被**丢弃**——想保留就声明，哪怕只是 `z.any()`。
- 改了 schema 之后如果类型没刷新，重启 dev server（内容类型是构建期生成的）。

## 对照本站

- [src/content.config.ts](/src/content.config.ts)：三个集合的完整定义。`post` 集合比上面的示例丰富：`pinned` 置顶、`updatedDate` 可选更新时间、`tags` 用 `.transform()` 自动去重转小写、`coverImage` 用 `z.object + image()` 声明图片资产（Astro 会做类型检查与优化）。
- [src/data/post.ts](/src/data/post.ts)：查询层封装。`getAllPosts()` 在生产构建时过滤 `draft`（开发时保留，方便预览草稿）——「环境感知过滤」一行代码搞定；同文件还有 `getUniqueTagsWithCount` 等标签统计工具。
- 本站的系列（你左侧栏看到的那棵目录树）**没有用任何数据库**：同一子目录 = 一个系列，`src/utils/series.ts` 按文件名排序（README 置顶、数字前缀按数序）。约定优于配置的极端案例。
- 标签介绍页 `content/tags/*.md` 对应 `tag` 集合——集合也可以只是「可选的元数据」，不生成页面。

## 练习

1. 给你的博客定义 `post` 集合，要求：标题必填且 ≤ 80 字符，日期自动转换，标签默认空数组。
2. 故意把某篇的 `publishDate` 写成 `tomorrow`，看构建报错长什么样。
3. 做一个 `/posts/index.astro`：倒序列出全部非草稿文章，显示标题、日期、标签。

## 遗留问题

文章数据有了、页面能生成了。但 Markdown 从文件到最终 HTML 之间经历了什么？想加自定义语法（提示块、GitHub 卡片）从哪下手？下一章：渲染管线。
