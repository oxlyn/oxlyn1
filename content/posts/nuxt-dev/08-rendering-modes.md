---
title: "Nuxt 全栈入门 · 第 8 章：渲染模式"
description: "SSR/SSG/CSR 的混合渲染、routeRules 路由级策略、nuxt generate 与预渲染——按页面选模式。"
publishDate: 2026-11-06T09:00:00
tags: ["nuxt", "vue", "教程"]
---

> 本文对应官方文档[《Rendering Modes》](https://nuxt.com/docs/4.x/guide/concepts/rendering)。

**学习目标**：理解四种渲染策略的代价与收益，掌握 routeRules 的路由级混合配置，知道什么内容配什么模式。

默认 SSR 不是终点——全站 SSR 意味着每次访问都有服务端开销，而很多内容根本不变。Nuxt 的答案是**混合渲染**：一个应用里，每个路由自己选模式。

## 四种模式速览

| 模式 | HTML 何时生成 | 适合 | 代价 |
| --- | --- | --- | --- |
| SSR（默认） | 每次请求时 | 个性化、实时数据 | 服务器持续算力 |
| SSG（预渲染） | 构建时一次 | 内容固定：文档、营销页 | 内容更新需重新构建 |
| SWR/ISR | 先发缓存页，后台定时再生 | 内容偶尔变：列表、首页 | 有短暂陈旧窗口 |
| CSR（`ssr: false`） | 不生成，浏览器渲染 | 重交互后台、登录后页面 | 无 SEO、首屏慢 |

## routeRules：路由级混搭

全部配置收在 `nuxt.config.ts` 一张表里：

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { swr: 60 },                 // 首页：缓存 60 秒，过期后台再生
    '/notes/**': { ssr: true },       // 笔记页：标准 SSR（SEO 关键）
    '/account/**': { ssr: false },    // 个人设置：纯客户端渲染
    '/about': { prerender: true },    // 关于页：构建时直接生成静态 HTML
    '/api/**': { cors: true },        // 接口层也能配（CORS、缓存头）
  },
})
```

选型一句话：**内容给谁看、多久变一次**——给搜索引擎看且少变的上预渲染，给用户看且常变的 SSR，登录后的私域页面 CSR 就够。这与 [Astro 建站](/posts/astro-from-scratch/)的"默认静态、按需动态"是同一道题的两种默认值：Astro 默认零 JS 静态优先，Nuxt 默认 SSR 组件优先，routeRules 让两者中间地带可以逐页滑动。

## 预渲染：nuxt generate

```bash
nuxt generate     # 构建 + 把 prerender 目标抓成静态 HTML
```

配置了 `prerender: true` 的路由在构建时产出纯静态文件；整站纯静态时，产物可以直接扔任何静态托管。爬链接（crawler）默认开启：从 `/` 出发顺着 `<NuxtLink>` 把能到达的页面都抓一遍，断链在构建期就报出来——**白送的链接检查器**。

## 渲染模式的调试观察

- DevTools 渲染面板显示当前路由命中的规则；
- `curl -s localhost:3000/notes | grep 笔记`——SSR 页面在 HTML 源码里能看到内容，CSR 页面只有壳，用这个土办法直观感受差异；
- 响应头 `x-nitro-prerender` / 缓存命中标识能看出 SWR 是否生效。

## 踩坑提示

- 全站 `ssr: false` 然后抱怨 SEO——组件默认渲染回 CSR 了，SEO 页面保留 SSR；
- `prerender` 的页面里藏了每人不同的数据——构建时的快照发给所有人，个性化内容上 SSR/CSR；
- SWR 时间设 0——每次访问都触发再生，等于最贵的 SSR；按内容变更频率定 TTL；
- 接口也跟着 `nuxt generate` 蒸发了——静态部署没有运行时，需要接口的应用部署到带 Nitro 的端（第 10 章）。

## 练习

1. 用 curl 对比 `/`（SSR）与 `ssr: false` 页面的 HTML 源码差异，找到"内容在不在源码里"。
2. 给 `/about` 加 `prerender: true`，跑 `nuxt generate`，在 `.output/public` 里找到它的 HTML。
3. 给 `/notes` 配 `swr: 30`，连续请求两次对比响应时间，观察第二次的缓存命中。
