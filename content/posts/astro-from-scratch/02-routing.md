---
title: "Astro 建站实战 · 第 2 章：文件路由与动态路由"
description: "src/pages 约定、[param] 动态段、getStaticPaths、rest 参数与 paginate 分页。"
publishDate: 2026-09-26T10:00:00
tags: ["astro", "教程"]
---

# 第 2 章 · 文件路由与动态路由

> 对应文档：[Routing](https://docs.astro.build/en/guides/routing/)

## 学习目标

- 掌握 `src/pages/` 文件路由约定与优先级规则。
- 会用 `[param]` 动态段 + `getStaticPaths()` 生成一批页面。
- 会用 `paginate()` 给文章列表做分页。

## 概念：目录即路由

`src/pages/` 下的文件路径直接映射 URL，没有路由配置文件，也没有 `<Link>` 组件——导航就是普通 `<a>`：

```sh
src/pages/
├── index.astro          →  /
├── about.astro          →  /about
└── posts/
    ├── index.astro      →  /posts
    └── [id].astro       →  /posts/xxx（动态）
```

要点：

- 以 `_` 开头的文件/目录被排除，可用来放共享组件。
- 静态路由优先于动态路由；动态参数优先于 rest 参数（`[...path]`）。
- 静态模式下，**每个动态路由必须导出 `getStaticPaths()`**，枚举所有可能的参数——毕竟构建时就要把每个页面都生成出来。

## 动手实践

### 动态路由

```astro
---
// src/pages/posts/[id].astro
export function getStaticPaths() {
  return [
    { params: { id: "hello" }, props: { title: "你好" } },
    { params: { id: "world" }, props: { title: "世界" } },
  ];
}
const { id } = Astro.params;          // 来自 params
const { title } = Astro.props;        // 来自 props（可选，省得再查一次）
---
<h1>{title}</h1>
<p>路径参数：{id}</p>
```

构建产物就是 `/posts/hello/index.html` 和 `/posts/world/index.html` 两个文件。

### rest 参数

文件名写成 `[...slug].astro` 可以吞掉多段路径，`slug` 为 `undefined` 时还能匹配父路径本身。需要「既匹配 `/posts` 又匹配 `/posts/xxx/yyy`」时用它。

### 分页

`paginate(数据数组, 选项)` 是 `getStaticPaths` 的入参之一，返回每一页的参数组合：

```astro
---
// src/pages/posts/[page].astro
import { getCollection } from "astro:content";
export function getStaticPaths({ paginate }) {
  const posts = await getCollection("post");
  return paginate(posts, { pageSize: 10 });
}
const { page } = Astro.props;
---
{page.start}–{page.end} / 共 {page.total} 篇，第 {page.currentPage}/{page.lastPage} 页
{page.url.prev && <a href={page.url.prev}>上一页</a>}
{page.url.next && <a href={page.url.next}>下一页</a>}
```

`page` 对象的常用字段：`data`（本页数据切片）、`currentPage`（从 1 起）、`lastPage`、`url.prev/next/first/last`（不存在即 `undefined`）。注意 `page.url.*` 生成的是 `/posts/2` 这样的路径，第 1 页自动是 `/posts`。

## 踩坑提示

- `getStaticPaths` 返回的 `params` 必须**全是字符串**，且构建时不会帮你 `decodeURI`——中文标签做参数时自己处理编码。
- `page.url.next` 是 `undefined` 时记得别渲染 `<a href={undefined}>`，用 `&&` 守住。
- 忘写 `getStaticPaths` 的报错发生在构建期，信息很直白；静态模式下没有「运行时兜底」这回事。

## 对照本站

- [src/pages/posts/[...slug].astro](/src/pages/posts/%5B...slug%5D.astro)：文章详情页。用 `getStaticPaths` 展开全部 post 集合生成每篇文章；正文渲染靠第 5 章的 `render()`。
- [src/pages/posts/[...page].astro](/src/pages/posts/%5B...page%5D.astro)：文章列表分页，就是上面的 `paginate` 写法，`pageSize` 与分组逻辑在 `getStaticPaths` 内完成。
- [src/pages/tags/[tag]/[...page].astro](/src/pages/tags/%5Btag%5D/%5B...page%5D.astro)：**嵌套分页**的完整例子——先按标签分组，再对每组各调一次 `paginate(filteredPosts, { params: { tag } })`，最后 flatMap 汇总。想挑战嵌套分页直接读它。
- `src/pages/notes/` 下同名双文件（`[...page]` 列表 + `[...slug]` 详情）与 posts 平行，是同一套模式的复用。

## 练习

1. 建一个 `src/pages/quotes/[n].astro`，用 `getStaticPaths` 生成 5 条名言页。
2. 给它加 `props` 传标题，页面里不再读 `Astro.params`。
3. 把名言做成每页 2 条的分页列表，接好上一页/下一页链接。

## 遗留问题

页面骨架（`<html>`、导航、页脚）现在还散落在每个页面里重复写。组件和布局怎么抽象？下一章。
