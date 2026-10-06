---
title: "Vite 工程化入门 · 附录：配置与指令速查"
description: "Vite 配置项、环境变量、资源后缀、指令一页速查，附资源与站内对照索引。"
publishDate: 2026-06-12T09:00:00
tags: ["vite", "前端工程化", "教程"]
---

## vite.config.ts 速查

```ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],                 // 插件数组（第 5 章）

  resolve: {
    alias: { '@': '/src' },                 // 路径别名（第 7 章，配 tsconfig paths）
  },

  server: {                                 // dev（第 2 章）
    port: 5173,
    host: true,                             // 局域网/真机可访问
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } },
  },

  envPrefix: 'VITE_',                       // 注入前缀（第 3 章）

  build: {                                  // 生产构建（第 3、9 章）
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: { vendor: ['vue'] },  // 手工分包
      },
    },
  },

  optimizeDeps: { include: ['some-pkg'] },  // 预构建（第 9 章）

  base: '/sub-path/',                       // 子路径部署
})
```

## 命令行

```
vite / npm run dev        开发服务器（HMR）
vite build                生产构建（Rollup）
vite preview              预览构建产物（本地演练生产）
vite --host --port 3000   命令行覆盖 server 配置
vite build --mode staging 自定义模式（第 3 章）
vite optimize             手动触发依赖预构建
```

## 环境变量与模式（第 3 章）

```
.env / .env.local / .env.[mode]   文件家族（local 进 gitignore）
VITE_XXX=...                      前缀门禁：进客户端产物
import.meta.env.VITE_XXX          使用（编译期静态替换，禁动态 key）
import.meta.env.DEV / PROD / MODE 内建字段
```

## 资源与导入（第 4 章）

```ts
import img from './a.png'                       // → 最终 URL（hash 文件名）
import txt from './a.txt?raw'                   // 原始字符串
import w from './a.worker.ts?worker'            // Web Worker
const u = new URL(`./dir/${name}.png`, import.meta.url).href   // 运行时路径
const all = import.meta.glob('./dir/*.ts', { eager: true })    // 批量导入
```

## HMR 与构建钩子（第 2、5 章）

```ts
if (import.meta.hot) {
  import.meta.hot.accept((mod) => { /* 自定义热替换 */ })
}
// 插件钩子：configureServer / transform / resolveId / load / handleHotUpdate
```

## 报错关键词表（第 10 章）

| 关键词 | 根因 |
| --- | --- |
| Failed to resolve import | 包未装 / 别名漏 / 大小写 |
| exports is not defined | CJS/ESM 混用 |
| Outdated Optimize Dep | 预构建缓存失效，重启 dev |
| dev 好 build 坏 | env 前缀 / CJS 依赖 / 动态路径 |
| 白屏无报错 | 挂载点 / base 路径 / type=module |

## 十章一图

| 主线 | 章节 | 一句话 |
| --- | --- | --- |
| 原理 | [1](/posts/vite-dev/01-why-vite/) [2](/posts/vite-dev/02-dev-server-hmr/) | dev 按需编译，构建回归打包；HMR 走模块图 |
| 配置 | [3](/posts/vite-dev/03-build-and-env.md) [4](/posts/vite-dev/04-static-assets.md) [7](/posts/vite-dev/07-alias-and-types.md) | env 静态替换；资源 import 即 URL；别名要双轨 |
| 扩展 | [5](/posts/vite-dev/05-plugins/) [6](/posts/vite-dev/06-astro-and-vite.md) | 插件 = Rollup 钩子 + server 钩子；框架即插件集合 |
| 进阶 | [8](/posts/vite-dev/08-ssr-and-lib.md) [9](/posts/vite-dev/09-optimization.md) [10](/posts/vite-dev/10-debugging-migration.md) | 双包/库模式；分割按需分层；报错按关键词定位 |

## 资源

- [Vite 官方中文文档](https://cn.vite.dev/guide/)——本系列依据（Vite 7）
- [配置参考](https://cn.vite.dev/config/)——全量配置项手册
- [Changes 页](https://cn.vite.dev/changes/)——大版本破坏性变更与迁移对照
- [Vite 生态列表](https://github.com/vitejs/awesome-vite)——插件与工具集合

## 站内对照索引

- 本站即 Astro（Vite 内核）项目：[第 6 章](/posts/vite-dev/06-astro-and-vite.md)配置逐行解读
- [ArkTS/Cordis HMR](/posts/arkts-dev/06-composition-and-hmr.md) ↔ 本章 HMR：热重载的两种方言
- [TS 第 8 章](/posts/typescript-core/08-modules.md)（ESM/CJS）是本章报错表的理论底座；[Tailwind 第 10 章](/posts/tailwind-css/10-production.md)的"编译期静态"与 env 替换同源
