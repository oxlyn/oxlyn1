---
title: "Nuxt 全栈入门 · 第 10 章：模块生态与部署"
description: "Nuxt 模块机制与常用模块、Nitro preset 一键换端、部署到 Cloudflare/Node/静态托管、生产清单。"
publishDate: 2026-11-08T09:00:00
tags: ["nuxt", "vue", "教程"]
---

> 本文对应官方文档[《Deployment》](https://nuxt.com/docs/4.x/getting-started/deployment)与[模块目录](https://nuxt.com/modules)。

**学习目标**：会用模块扩展框架能力，理解 Nitro preset 的"一次构建、处处部署"，把 notes-web 推上线并附生产清单。

## 模块：框架的插件系统

Nuxt 把"集成第三方能力"标准化成**模块**——一个模块 = 一包配置 + 自动导入 + 构建钩子，装上即用：

```bash
npx nuxi module add tailwindcss    # 安装 + 自动写入 nuxt.config 的 modules
npx nuxi module add @nuxt/content  # 同上
```

四个高频模块建立体感：

- **`@nuxtjs/tailwindcss`**——[Tailwind](/posts/tailwind-css/) 全套进 Nuxt，样式类即刻可用；
- **`@nuxt/content`**——Markdown 变成可查询的内容集合（本站 [Astro 的内容集合](/posts/astro-from-scratch/)同款思路的 Vue 版），适合文档与博客；
- **`@nuxt/image`**——图片自动压缩、响应式尺寸、懒加载；
- **`@nuxt/devtools`**——第 1 章用的驾驶舱，开发期标配。

模块质量参差是生态常态，选型看三点：维护活跃度、Nuxt 4 兼容声明、卸载是否干净（好的模块不污染你的配置）。

## Nitro preset：一次构建，处处部署

构建产物是一台 **Nitro 服务**，部署目标由 **preset**（预置）决定，通常零配置自动探测：

```bash
nuxt build            # 默认：Node 服务器（node .output/server/index.mjs）
```

| 目标 | preset | 说明 |
| --- | --- | --- |
| Node 服务器 | `node-server`（默认） | 自管服务器/VPS/Docker |
| Cloudflare Pages | `cloudflare_pages` | 本站同款托管，SSR 跑在 Workers |
| Vercel / Netlify | 自动 | 边缘函数 |
| 静态托管 | `nuxt generate` | 第 8 章预渲染产物，扔任何静态站 |

同一份代码，部署目标换个 preset——这是第 5 章"协议与传输分离"思想的部署版：**业务代码不感知运行环境**。notes-web 部署到 Cloudflare Pages 时有个真实注意点：我们的 JSON 存储用的是 `node:fs`，边缘运行时没有文件系统——**把存储换成 KV/D1**（或放弃边缘 preset 改用 Node 部署）。框架给你移植自由，但运行时边界永远存在（[node-core 第 1 章](/posts/node-core/01-what-is-node/)的"运行时决定能力"在这里闭环）。

```bash
# Node 部署形态
nuxt build && node .output/server/index.mjs   # 自带生产服务器，配 systemd/容器守护
```

## 生产清单

- **环境变量**：`runtimeConfig` 项经 `NUXT_*` 注入（第 6 章），密钥只进服务端区；
- **日志到 stdout**：Nitro 日志交由平台收集，别自己写文件；
- **缓存策略**：routeRules 的 SWR 值按内容变更频率定（第 8 章）；
- **错误兜底**：error.vue + 接口统一 createError（第 9 章），生产接监控上报；
- **健康检查**：`server/routes/health.get.ts` 返回 200，供平台探活；
- **优雅退出**：SIGTERM 处理（[node-core 第 9 章](/posts/node-core/09-process-and-cli/)），容器滚动更新不丢请求。

## 收官：notes 的四种形态

```text
node-core：notes CLI（人用，stdin/stdout）
mcp-dev ：notes-mcp（AI 用，JSON-RPC/stdio+HTTP）
nuxt-dev：notes-web（浏览器用，SSR + Nitro API）
          ── 同一套 store 业务层，三种协议门面 ──
```

三章合读，你能看清"业务逻辑"与"接口形态"的边界怎么划：**逻辑写在最里层不依赖任何运行时 API，协议门面各写各的**。下一站可选：给 notes-web 补测试（Vitest + Playwright 的工程化测试系列筹备中），或深挖部署（Hono + Cloudflare Workers 系列筹备中）。

## 踩坑提示

- 部署后 `runtimeConfig` 全是空——平台没配 `NUXT_*` 环境变量，去部署面板补；
- 静态 generate 的站点带 `server/api`——运行时不存在，接口 404；有接口选 Node/边缘 preset；
- 模块装了一堆不卸载——构建时间与包体积线性受害，定期审计 `modules` 列表；
- 忘了适配边缘运行时（fs 不可用）——本地 Node 跑得好好的，上 Cloudflare 就炸，先看 preset 的运行时能力表。

## 练习

1. 装 `@nuxtjs/tailwindcss`，把前三章的页面样式换成 Tailwind 类，对比改造前后的组件可读性。
2. 把 notes-web 构建成 Node 形态并本机启动 `.output/server/index.mjs`，用 `NUXT_PUBLIC_SITE_NAME=prod` 验证配置注入。
3. 写 `server/routes/health.get.ts` 健康检查端点，模拟 SIGTERM 观察日志（呼应 node-core 第 9 章的优雅退出）。
