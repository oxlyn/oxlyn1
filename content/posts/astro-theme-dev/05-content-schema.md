---
title: "Astro 主题开发 · 第 5 章：为内容设计 schema"
description: "内容集合是主题与使用者之间的契约：frontmatter 字段设计、校验与默认值、严格与宽松的权衡。"
publishDate: 2026-10-01T09:00:00
tags: ["astro", "主题开发", "教程"]
---

> 本文对应官方文档[内容集合](https://docs.astro.build/zh-cn/guides/content-collections/)（基础用法在本站[《Astro 建站实战》第 5 章](/posts/astro-from-scratch/05-content-collections/)讲过，本篇聚焦主题视角）。

**学习目标**：站在主题作者的角度设计内容集合 schema，让"用你的主题"变成"遵守一份清晰的写作契约"。

## schema 是主题的契约

建站时，`content.config.ts` 是给自己写的；做主题时，它是**写给所有使用者看的接口文档**——使用者照着 schema 写 frontmatter，写错字段会在构建期得到清晰的报错，而不是运行时页面上莫名缺一块。

这份契约的质量直接决定主题的口碑。设计时问三个问题：

1. **必填项够少吗？** `title`、`publishDate` 之外尽量都可省略——省略字段必须有合理默认值或显式分支；
2. **字段名有歧义吗？** `date` 还是 `publishDate`？`cover` 还是 `coverImage`？一旦发布就不能随便改，起名一步到位；
3. **报错可读吗？** zod 校验失败的信息会直接展示给使用者，加 `.describe()` 说明字段用途。

## 一个博客主题的典型 schema

```ts
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const post = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/posts' }),
  schema: z.object({
    title: z.string().max(60).describe('文章标题，建议 30 字内'),
    description: z.string().describe('摘要，列表页与 SEO 使用'),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]).transform(
      (tags) => [...new Set(tags.map((t) => t.toLowerCase()))],
    ),
    coverImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
})

export const collections = { post }
```

值得展开的三个细节：

- **`z.coerce.date()`**：接受字符串自动转 Date，使用者不用知道"必须是 Date 对象"这种内部细节；
- **`transform` 做规范化**：标签自动转小写、去重——主题替使用者消化脏数据，而不是报错烦他。约束用在校验上，宽容用在规范化上；
- **`draft` 默认 false**：缺字段 = 正常发布，符合直觉。

## 主题作者的三条实践

**1. schema 即文档**：主题 README 里列 frontmatter 示例，和 schema 保持一字不差的对应。也可以在主题仓库放一个 `content/` 演示集，每个字段都用上一次，让使用者抄。

**2. 查询封装成函数**：不要让使用者在页面里直接写 `getCollection('post')` 加过滤逻辑——主题提供 `getAllPosts()`、`getPostsByTag()` 这类工具函数（含 draft 过滤、排序），schema 改动时只改一处。本站的 `src/data/post.ts` 就是这个角色。

**3. 严格与宽松的权衡**：schema 越严格（枚举、正则、max），使用者体验越好、迁移越痛苦；越宽松，主题对脏数据越宽容但布局越容易崩。博客主题的常见折中：**核心字段严格**（title/date），**装饰字段宽松**（coverImage、tags）。

## 踩坑提示

- schema 加了字段但组件没处理 `undefined` 分支——`updatedDate` 是 optional，页面上就得有"没更新过就不显示"的写法，别忘了。
- `glob` loader 的 id 会小写化并处理成 slug，文件名里的中文/大写会变——文档里提醒使用者用英文文件名。
- 主题升级改 schema 却没写迁移说明，使用者的旧文章构建报错——schema 变更是 breaking change，进 changelog。

## 练习

1. 给你的主题 schema 加一个 `lang` 字段（枚举：zh/en），带默认值。
2. 写 `getPostsByTag()` 工具函数，封装过滤与排序逻辑。
3. 故意把 `publishDate` 写成"2026/10/05"，观察 `z.coerce.date()` 能否救回来；再写成一个纯文本试试报错效果。
