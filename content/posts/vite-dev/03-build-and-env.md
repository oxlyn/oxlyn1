---
title: "Vite 工程化入门 · 第 3 章：构建与环境变量"
description: "build 的产物逻辑、.env 文件家族、import.meta.env 与 PUBLIC_ 前缀、模式（mode）机制。"
publishDate: 2026-06-04T09:00:00
tags: ["vite", "前端工程化", "教程"]
---

> 本文对应官方文档[构建](https://cn.vite.dev/guide/build)与[环境变量和模式](https://cn.vite.dev/guide/env-and-mode)。

**学习目标**：看懂 build 产物，搭一套多环境变量体系，理解 dev/build 行为差异的根源。

## .env 文件家族

Vite 从项目根目录的 `.env` 文件读取环境变量，文件后缀决定生效场景：

```
.env                # 所有场景
.env.local          # 所有场景，本地覆盖（gitignore！）
.env.development    # 仅 dev（npm run dev）
.env.production     # 仅 build（npm run build）
.env.test           # mode 为 test 时
```

变量必须以 `VITE_` 开头才会**注入到客户端产物**：

```bash
# .env
VITE_API_BASE=https://api.example.com
VITE_APP_TITLE=我的应用
SECRET_KEY=never-in-client   # 没有 VITE_ 前缀：只在 node 侧可见，不进前端包
```

使用方式是 `import.meta.env`（浏览器的原生模块元数据，Vite 在编译期做**静态替换**）：

```ts
const base = import.meta.env.VITE_API_BASE
const title = import.meta.env.VITE_APP_TITLE
const isDev = import.meta.env.DEV          // 布尔内建：是否 dev server
const isProd = import.meta.env.PROD        // 是否生产构建
const mode = import.meta.env.MODE          // 当前模式字符串
```

**静态替换**是理解一切的关键：构建时把 `import.meta.env.VITE_API_BASE` 直接替换成字符串字面量。两个推论：**值打进产物**（放密钥就等于公开——[鸿蒙上架](/posts/harmonyos-app-dev/10-release.md)同款隐私纪律）；**不能动态拼 key**（`import.meta.env[dynamicKey]` 拿不到值——和 [Tailwind 动态类名](/posts/tailwind-css/10-production.md)同一个"编译期静态"原理）。

## 模式（mode）

`npm run dev` 默认 mode 为 `development`，`npm run build` 为 `production`。可以用 `--mode staging` 自定义，让 `.env.staging` 参与加载——预发环境走这条路。模式同时决定 `.env.[mode]` 加载哪一份与 `import.meta.env.PROD` 的值。

TypeScript 侧给 env 补类型（[TS 第 3 章](/posts/typescript-core/03-objects-and-interfaces.md)的接口契约）：

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_APP_TITLE: string
}
```

## build 产物速览

```
dist/
├── index.html          # 入口：script 标签指向带 hash 的模块
├── assets/
│   ├── index-a1b2c3.js     # 应用代码（按路由分包后可能多个）
│   ├── vendor-d4e5f6.js    # 依赖（第 9 章 manualChunks 可控）
│   └── logo-9a8b7c.png     # 资源（第 4 章），小图可能内联成 data URL
```

文件名的 hash 是**内容指纹**：内容不变 hash 不变 → CDN/浏览器长缓存永久有效，发版只拉变化的文件——"为什么文件名这么丑"的答案。

## dev 与 build 的差异清单

| 事项 | dev | build |
| --- | --- | --- |
| 模块处理 | 原生 ESM 按需编译 | Rollup 打包压缩 |
| 依赖处理 | 预构建成 ESM（[第 9 章](/posts/vite-dev/09-optimization.md)） | 打进 bundle |
| env | 实时读取 | 编译期静态替换 |
| 报错 | 宽松（尽快看到界面） | 严格（类型外的构建错误都拦） |

**"开发好的上线坏"基本都出这张表**：环境变量没加前缀、依赖只有 CJS 版本、动态 import 路径拼错。对策是 `npm run build && npm run preview` 常态化——本地演练生产产物（[第 1 章](/posts/vite-dev/01-why-vite.md)练习 3 的日常化）。

## 踩坑提示

- `.env.local` 提交进了 git——secret 已泄漏，先换密钥再删文件。
- 前端"环境变量"本质是**公开配置**，鉴权凭证永远放服务端。
- mode 与 NODE_ENV 混为一谈：Vite 自管 mode，NODE_ENV 只是它的映射结果之一——判断环境用 `import.meta.env.PROD`。

## 练习

1. 建 .env.development 与 .env.production 各配一个 VITE_API_BASE，dev 与 preview 里分别打印验证。
2. 给一个不带前缀的变量做"能否读到"实验，理解 VITE_ 门禁。
3. 改一次源码重新 build，对比产物 hash 哪些变了哪些没变。
