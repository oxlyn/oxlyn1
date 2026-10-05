---
title: "Astro 主题开发 · 第 1 章：主题的骨架"
description: "项目结构分层与主题化第一原则：会因人而异的东西，必须收敛到配置和内容，而不是散落在组件里。"
publishDate: 2026-09-27T09:00:00
tags: ["astro", "主题开发", "教程"]
---

> 本章对应官方文档[项目结构](https://docs.astro.build/zh-cn/basics/project-structure/)，并结合主题开发场景展开。

**学习目标**：搭出主题的目录骨架，建立"配置与实现分离"的主题化思维。

## 从网站到主题，差的是一个视角

同样是 `npm create astro` 生成的项目，作为"网站"和作为"主题"，评价标准完全不同：

- **网站**：能跑、好看就行。标题写死在 Header 组件里，无所谓。
- **主题**：用的人要能**不改你的组件**就换成自己的标题、导航、颜色、内容结构。任何写死的"你的东西"都是使用者的负担。

所以主题开发的第一原则是：**把会因人而异的东西收敛到少数几个入口**——一个配置文件 + 内容集合 schema，其余代码全部只从这两处取值。

## 目录骨架

Astro 的约定目录在主题场景下的推荐分工：

```
src/
├── config.ts          # 主题配置（第 6 章专门设计）
├── content.config.ts  # 内容 schema（第 5 章）
├── components/        # 组件，按角色分层（见下）
├── layouts/           # 布局（第 3 章）
├── pages/             # 路由，薄：只做取数 + 选布局
├── styles/            # 全局样式与主题 token（第 4 章）
└── utils/             # 取数、日期等纯函数
content/               # 用户的内容（演示内容随主题附送）
```

`components/` 建议按三个角色分层，这也是 astro-cactus 的实际结构：

- **layout 部件**：`Header`、`Footer`、`Navigation`——只服务页面外壳；
- **内容部件**：`PostCard`、`Pagination`、`TableOfContents`——消费内容集合的数据；
- **UI 部件**：`ThemeToggle`、`Search`、`Button`——纯表现，不关心内容从哪来。

分层不是教条，收益是：使用者想换掉页脚，他只需要知道"页脚在 layout 部件区"；想改卡片样式，改内容部件；都不用碰其他区域。

## pages 要"薄"

主题里的页面应该退化成**组装车间**：取数、套布局、传 props，不带业务逻辑。逻辑下沉到 `utils/`（取数）和组件（表现），这样使用者换路由结构时不会踩到逻辑。

```astro
---
// src/pages/index.astro——薄页面的样子
import BaseLayout from "@/layouts/Base.astro";
import PostCard from "@/components/PostCard.astro";
import { getAllPosts } from "@/data/post";

const posts = (await getAllPosts()).slice(0, 5);
---
<BaseLayout>
  {posts.map((post) => <PostCard post={post} />)}
</BaseLayout>
```

## 演示内容随主题走

主题仓库要附一套最小演示内容（两三篇文章、几个标签）：新人克隆后 `npm run dev` 十秒内能看到完整效果，而不是空白页报错。astro-cactus 自带的 demo 文章就是这个用途——用完直接删，不影响主题结构。

## 踩坑提示

- 配置散落是主题的头号反模式：颜色写死在组件 `<style>` 里、页脚年份写死、每页文章数写死在 pages 里——使用者为改一个字要翻遍你的代码。
- 反过来也别过度设计：一开始就做"全部可配置"会让主题变成配置地狱。判断标准：**这个值会因使用者而异吗？** 会，进配置；不会，留在组件里。
- `utils/` 里的取数函数记得过滤 `draft`（生产环境），演示内容里放一篇 draft 正好用来验证。

## 练习

1. 用 `npm create astro` + 博客模板建一个项目，按上面的骨架重排目录。
2. 找出项目里三处"写死的、会因人而异"的值，挪进一个新建的 `src/config.ts`。
3. 写两篇演示文章（一篇带 `draft: true`），确认首页列表过滤行为正确。
