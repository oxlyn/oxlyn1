---
title: "Astro 建站实战 · 第 8 章：SEO 与分发"
description: "sitemap、RSS、动态 OG 分享图与 meta 基础设施，内容站最后十公里。"
publishDate: 2026-10-05T09:15:00
tags: ["astro", "教程"]
---

# 第 8 章 · SEO 与分发

> 对应文档：[Sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) · [RSS](https://docs.astro.build/en/guides/integrations-guide/rss/)

## 学习目标

- 给站点配好 sitemap、robots.txt 和 RSS。
- 理解 `site` 配置为什么是这一切的地基。
- 会用 satori 动态生成社交分享图（OG image）。

## 概念

内容站写完只是开始，分发面有三张网：

- **搜索引擎**：sitemap 告诉爬虫「我有这些页」，robots.txt 告诉它「哪里别爬」。
- **订阅者**：RSS 让读者在不打开你网站的情况下收到更新。
- **社交分享**：OG（Open Graph）meta 决定链接被转发时显示的标题、描述和卡片图。

三者的共同依赖是 `astro.config.ts` 里的 `site` 字段——所有绝对 URL 的地基。

## 动手实践

### sitemap 与 robots

```ts
// astro.config.ts
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
export default defineConfig({
  site: "https://oxlyn1.pages.dev/",   // 没有它，sitemap 直接不生成
  integrations: [sitemap(), robotsTxt()],
});
```

构建后自动产出 `sitemap-index.xml` 和 `robots.txt`，后者自动引用前者。

### RSS

```ts
// src/pages/rss.xml.ts —— 端点文件，输出 XML 而非页面
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const posts = await getCollection("post", ({ data }) => !data.draft);
  return rss({
    title: "我的博客",
    description: "……",
    site: context.site,                       // 来自 site 配置
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: `/posts/${post.id}/`,
    })),
  });
}
```

读者侧用任何 RSS 阅读器订阅 `https://你的域名/rss.xml` 即可。

### 动态 OG 图

社交卡片图不必逐张手做——satori（把 JSX 风格标记渲染成 SVG）+ sharp（SVG 转 PNG）可以在构建时给每篇文章生成一张带标题、日期、作者的个人化图片：

```ts
// 思路示意，见本站完整实现
export function getStaticPaths() {
  return posts.map((post) => ({ params: { slug: post.id } }));
}
// 用文章标题排版 → satori 产 SVG → sharp 转 PNG → 输出 /og-image/<id>.png
```

页面的 `<meta property="og:image">` 指向对应图片即可。记得给 OG 图做缓存或长期 Cache-Control——satori 不便宜，每次构建重复算一遍是浪费。

## 踩坑提示（真实经历）

- **`site` 忘改占位符是新手第一坑**：本站上线时 sitemap 里还躺着 `https://example.com/`，RSS 全文链接同样受害。症状：页面正常、分发全错。部署完第一件事：`curl 你的域名/sitemap-0.xml` 检查域名。
- RSS 的 `link` 尾斜杠要和你实际的规范 URL 一致，避免订阅器重复收录 `/a` 和 `/a/`。
- OG 图尺寸约定 1200×630；纯中文注意 satori 需要显式加载中文字体文件。
- `og:image` 用绝对 URL（社交平台爬不到相对路径）。

## 对照本站

- [src/pages/rss.xml.ts](/src/pages/rss.xml.ts)：上面的 RSS 代码的完整版；[src/pages/notes/rss.xml.ts](/src/pages/notes/rss.xml.ts) 是便签的第二路 RSS——一个站可以多条订阅源。
- [src/pages/og-image/[...slug].png.ts](/src/pages/og-image/%5B...slug%5D.png.ts)：satori + sharp 的完整生产实现，含缓存目录（`_cacheUtil.ts`）；排版模板在 `_ogMarkup.ts`，作者、标题、日期全部来自文章数据。
- [src/components/BaseHead.astro](/src/components/BaseHead.astro)：全站 meta 的总装车间——`og:title/description/image/locale`、canonical、主题色都从这里进 `<head>`。
- 血泪教训的实物：`src/site.config.ts` 的 `url` 字段旁边还留着官方主题的警告注释「Please remember to replace...」——那行注释差点被我们忽略过去。

## 练习

1. 给你的站配上 sitemap + robots，构建后检查两个文件的域名是否正确。
2. 做 `/rss.xml`，用任意阅读器订阅验证。
3. 写一个最简 OG 图端点：只渲染文章标题和日期，构建后用微信/Telegram 发给自己看卡片效果。

## 遗留问题

万事俱备，只差上线。构建产物长什么样？静态托管和 SSR 怎么选？怎么做到 push 即发布？下一章：部署。
