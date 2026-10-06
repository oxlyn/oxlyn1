---
title: "Rolldown 入门 · 附录：命令与配置速查"
description: "Rolldown CLI、配置项、rolldown-vite 开关与报错关键词一页速查，附资源链接。"
publishDate: 2026-06-12T09:00:00
tags: ["rolldown", "vite", "前端工程化", "教程"]
---

## CLI 与安装

```bash
npm i -D rolldown            # 独立使用
rolldown -c rolldown.config.ts
rolldown src/main.ts -d dist # 无配置极简用法
rolldown -w                  # watch 模式
# 在线实验：https://repl.rolldown.rs/
```

## rolldown.config.ts 速查

```ts
import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'src/main.ts',
  platform: 'browser',              // browser / node / neutral
  resolve: { alias: { '@': '/src' } },
  define: { __APP_VERSION__: JSON.stringify('1.2.0') },
  inject: { Promise: ['es6-promise', 'Promise'] },
  plugins: [
    withFilter(somePlugin(), { transform: { id: /\.ts$/ } }),   // 第 4 章
  ],
  output: {
    dir: 'dist',
    format: 'esm',                  // es / cjs / iife / umd
    target: 'es2020',               // 语法降级（第 7 章）
    advancedChunks: {               // 分组按序匹配，先命中先归属（第 6 章）
      groups: [
        { name: 'framework', test: /node_modules\/vue/ },
        { name: 'vendor', test: /node_modules/ },
      ],
    },
  },
})
```

## 插件钩子过滤器（第 4 章）

```ts
transform: {
  filter: { id: /\.svg$/, code: 'export default' },   // Rust 侧过滤
  handler(code, id) { /* 只对匹配模块执行 */ },
}
withFilter(legacyPlugin(), { load: { id: /\.svg\?react$/ } })
```

## rolldown-vite / Vite 8 开关（第 8、9 章）

```json
// Vite 7 尝鲜：package.json 别名（锁版本）
{ "dependencies": { "vite": "npm:rolldown-vite@7.0.0" } }
// peer 依赖场景
{ "overrides": { "vite": "npm:rolldown-vite@7.0.0" } }
```

```ts
experimental: { enableNativePlugin: 'resolver' }   // 原生插件降级开关（过渡期）
// 探针：this.meta.rolldownVersion / vite.rolldownVersion
// 迁移对照：manualChunks → advancedChunks；transformWithEsbuild → transformWithOxc
```

## 报错关键词表

| 关键词 | 根因 |
| --- | --- |
| 未知选项警告 | 旧 Rollup/Vite 配置残留，按警告清理 |
| Unknown module type | 插件产出声明 moduleType，或类型不受支持 |
| Top-level await in cjs | TLA 混进 cjs 产物（第 5 章） |
| 插件"静默不工作" | filter 与 handler 判断不一致（第 4 章） |
| 装饰器未被降级 | OXC 不支持 TC39 proposal 装饰器（第 9 章预案） |

## 十章一图

| 主线 | 章节 | 一句话 |
| --- | --- | --- |
| 定位 | [1](/posts/rolldown-guide/01-what-and-why/) [2](/posts/rolldown-guide/02-getting-started/) | 一个 Rust 工具取代 esbuild+Rollup |
| 能力 | [3](/posts/rolldown-guide/03-core-features/) [4](/posts/rolldown-guide/04-plugin-hook-filters.md) [6](/posts/rolldown-guide/06-code-splitting.md) [7](/posts/rolldown-guide/07-oxc-transforms.md) | 内建全家桶 + hook filter + advancedChunks + OXC |
| 落地 | [5](/posts/rolldown-guide/05-rollup-migration.md) [8](/posts/rolldown-guide/08-rolldown-vite.md) [9](/posts/rolldown-guide/09-vite8-migration.md) | Rollup 迁移七步、Vite 7 尝鲜、Vite 8 实战 |
| 展望 | [10](/posts/rolldown-guide/10-outlook.md) | 统一工具链，配置变声明 |

## 资源

- [Rolldown 官方文档](https://rolldown.rs/guide/introduction)——本系列依据
- [In-Depth 深度系列](https://rolldown.rs/in-depth/why-bundlers)——模块类型/分割/CJS 专文
- [REPL](https://repl.rolldown.rs/)——零安装实验
- [rolldown-vite 指南（Vite 7）](https://v7.vite.dev/guide/rolldown)与 [v7→v8 迁移指南](https://vite.dev/guide/migration)
- [OXC 文档](https://oxc.rs/)——转译与压缩底座

## 站内对照索引

- 前置：[Vite 系列](/posts/vite-dev/)（引擎三件套、manualChunks、升级节奏）
- 机制对照：[Tailwind 第 10 章](/posts/tailwind-css/10-production.md)（编译期静态扫描）· [TS 第 8 章](/posts/typescript-core/08-modules.md)（ESM/CJS）· [ArkTS HMR](/posts/arkts-dev/06-composition-and-hmr.md)（热重载方言）
- 实战出口：[Vite 第 8 章](/posts/vite-dev/08-ssr-and-lib.md)的 lib 模式平移到 Rolldown 打库
