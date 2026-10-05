---
title: "Astro 建站实战 · 第 9 章：构建与部署"
description: "astro build 产物解剖、静态与 SSR 的选择、Cloudflare 部署两条路，以及 push 即发布的自动化。"
publishDate: 2026-10-05T09:00:00
tags: ["astro", "教程"]
---

# 第 9 章 · 构建与部署

> 对应文档：[Deploy your site](https://docs.astro.build/en/guides/deploy/) · [Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/)

## 学习目标

- 认识 `dist/` 产物的形态，理解「静态站」到底部署了什么。
- 会判断静态构建与 SSR（adapter）该选哪个。
- 建立一条 push 即发布的自动化流程。

## 概念：两种渲染模式

| | 静态（默认） | SSR（按需渲染） |
| --- | --- | --- |
| 渲染时机 | `astro build` 时全部生成 | 请求到达时即时渲染 |
| 需要的服务 | 任意静态文件托管 | 能跑 Node/边缘函数的运行时 |
| 额外依赖 | 无 | `@astrojs/cloudflare` 等 adapter |
| 适合 | 博客、文档、营销页 | 登录、个性化、高频变化的数据 |

两者可以**按路由混用**：全站静态，仅个别页面声明 `export const prerender = false` 走按需渲染（需装 adapter）。

## 动手实践

### 解剖构建产物

```sh
npm run build
tree dist -L 2
```

你会看到：每个路由一个 `index.html`（或 `page.html`）、`_astro/` 里的指纹化 CSS/JS/图片资产。所谓部署静态站，就是把这坨文件原样放到能 HTTP 访问的地方。

### Cloudflare 两条路

官方文档现在把新项目引向 **Workers**（能力更全）；本站用的 **Pages** 是更轻的经典路径，两者对纯静态站体感一致：

- **Git 集成**（支持 GitHub/GitLab）：后台导入仓库，构建命令 `npm run build`，输出目录 `dist`，环境变量 `NODE_VERSION=22`，此后 push 即部署。
- **直传**：`npx wrangler pages deploy dist --project-name=xxx`（首次 `npx wrangler login`）。适合仓库托管在别处、或 CI 不方便的场景。

SSR 想上 Cloudflare 则是 `npx astro add cloudflare` + `wrangler deploy`，需要 `nodejs_compat` 兼容标志。

### push 即发布

流水线的完整闭环：

```sh
git push → CI 触发 → npm install → npm run build → 产物上传 CDN → 线上更新
```

注意构建在 CI 机器上进行——本机的环境怪癖（缓存权限、镜像源）都不会跟到线上；反过来，CI 的 Node 版本要显式钉住。

## 踩坑提示（真实经历）

- **搜索引擎验证别忘**：上线后第一件事 `curl 域名/sitemap-0.xml`——确认里面的域名是线上的而不是占位符（第 8 章的坑在部署环节最后一道重现）。
- **构建后处理脚本**：搜索索引这类「产物再加工」用 npm 的生命周期钩子挂进流程（本站 `postbuild` 跑 `pagefind --site dist`），CI 里只要统一调 `npm run build` 就能带上。
- **CI 的 Node 版本**：Cloudflare 构建机的默认版本可能低于 Astro v7 要求，用环境变量显式钉住。
- 纯静态站不需要长期占用任何服务器进程；被流量打挂的通常是「没缓存 OG 图」这类构建端问题，而不是托管本身。

## 对照本站

- 本站的部署声明写在 [README.md](/README.md)：仓库托管在 Gitee，push 到 `main` 即自动构建发布到 **https://oxlyn1.pages.dev/**——Gitee 不在 Cloudflare git 集成名单里，所以这条流水线由 CI 桥接完成，本地零发布命令。
- `package.json` 的脚本编排值得一看：`build` 后面挂 `postbuild`（Pagefind 索引），`check` 串起 `astro check` 与 biome——CI 与本地跑同一条命令，结果一致。
- 发布后验证清单（本站每次改动的固定动作）：文章页样式与系列侧栏 → `/rss.xml` 域名 → sitemap 域名 → OG 图可访问。
- 一个反面教材：`site.config.ts` 的 `url` 占位符在上线后还存活了几个小时，直到检查 sitemap 才发现——本章的验证清单就是它的墓志铭。

## 练习

1. `npm run build` 后数一数 `dist/` 里 HTML 文件数量，对照你的路由清单。
2. 把站部署到 Cloudflare Pages（Git 集成或直传任选），记下从 push 到线上可访问的耗时。
3. 给任意一个页面加 `export const prerender = false`（需 adapter），观察构建输出里它从静态清单消失、变为运行时路由。

## 遗留问题

教程主线到此完结：一个能写、能搜、能订阅、自动发布的 Astro 博客。附录备了一张速查表，把九章的 API 和命令浓缩成三页纸——写代码时手边常备。
