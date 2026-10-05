# 我的博客

基于 [Astro](https://astro.build)（[astro-cactus](https://github.com/chrismwilliams/astro-cactus-theme) 主题定制）的静态博客，支持文章系列、便签、标签页、Pagefind 全文搜索与动态 OG 图。

## 开发

```bash
npm install
npm run dev      # 本地开发，默认 http://localhost:4321
```

常用脚本：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 本地开发服务器 |
| `npm run build` | 构建到 `dist/`，随后自动跑 Pagefind 生成搜索索引 |
| `npm run preview` | 本地预览构建产物 |
| `npm run check` | `astro check` + biome 静态检查 |
| `npm run lint` | biome 自动修复 |
| `npm run format` | Prettier 格式化 |

> 本机注意：npm 默认缓存 `~/.npm` 存在 root 属主文件，安装前需先修复
> （`sudo chown -R 501:20 ~/.npm`）或设置 `npm_config_cache` 到可写目录；
> 依赖可用 `--registry=https://registry.npmmirror.com/` 安装。
> 构建时若提示遥测目录无权限，设置 `ASTRO_TELEMETRY_DISABLED=1`。

## 写内容

内容在根目录 `content/` 下，分三个集合，schema 见 `src/content.config.ts`。

### 博客文章（`content/posts/`）

新建 Markdown 文件：

```md
---
title: '文章标题'         # 必填，最长 60 字符
description: '一句话摘要'  # 必填
publishDate: 2026-10-06   # 必填
tags: ['tag1']            # 可选，自动去重并转小写
draft: false              # 可选，草稿仅开发模式可见
pinned: false             # 可选，置顶
coverImage:               # 可选封面图
  alt: '描述'
  src: '@/assets/xxx.png'
updatedDate: 2026-10-07   # 可选
---
正文……
```

列表页与详情页由 `src/pages/posts/` 自动生成。

### 系列（series）

同一子目录下的文章自动归为一个系列（如 `content/posts/agent-from-scratch/`）：

- 系列名 = 目录名；
- 排序规则：`README.md`（总览）置顶 → `01-` 数字前缀按数序 → 其余按文件名；
- 文章详情页侧边栏展示系列目录（`src/components/SeriesSidebar.astro`）。

放在 `content/posts/` 顶层（无子目录）的文章不属于任何系列。

### 便签（`content/notes/`）

短内容，与文章分开管理，`publishDate` 必须是带时区的 ISO 8601 格式：

```md
---
title: '标题'
description: '可选摘要'
publishDate: '2026-10-06T12:00:00Z'
---
```

### 标签

标签来自文章 frontmatter 的 `tags` 字段，`/tags/` 索引页与 `/tags/<tag>/` 详情页自动生成。
若想给某个标签补介绍文案，在 `content/tags/<tag>.md` 里写可选的 `title` / `description` 即可。

## 站点配置

`src/site.config.ts`：站点 URL、标题、作者、语言、导航菜单、Expressive Code 主题。
`url` 必须与线上域名一致，否则 RSS / sitemap / OG 图链接不对。

## 部署

站点：**https://oxlyn1.pages.dev/**（Cloudflare Pages）

**push 到 Gitee（`main` 分支）即自动构建发布**，无需本地构建或发布命令。

## 目录结构

```
content/
├── posts/            # 博客文章（子目录自动成系列）
├── notes/            # 便签
└── tags/             # 可选的标签介绍页
src/
├── site.config.ts    # 站点信息与导航
├── content.config.ts # 内容集合 schema
├── plugins/          # 自定义 markdown 插件（admonitions、GitHub 卡片等）
├── data/post.ts      # 文章/标签查询工具
├── utils/            # 系列、日期、TOC 等工具
├── components/       # 系列侧边栏、搜索、主题切换等
├── layouts/          # Base / BlogPost 布局
└── pages/            # posts / notes / tags / about / rss / og-image / 404
```
