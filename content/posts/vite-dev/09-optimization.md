---
title: "Vite 工程化入门 · 第 9 章：构建优化"
description: "依赖预构建的原理、代码分割与 manualChunks、首屏加载的分层策略。"
publishDate: 2026-06-22T09:00:00
tags: ["vite", "前端工程化", "教程"]
---

> 本文对应官方文档[依赖预构建](https://cn.vite.dev/guide/dep-pre-bundling)与[构建选项](https://cn.vite.dev/config/build-options.html)。

**学习目标**：理解预构建为什么存在，掌握代码分割的两条路径，建立"按需加载"的分层直觉。

## 依赖预构建：dev 快的另一半

第 1 章说 dev 是"原生 ESM 按需编译"——但 npm 里的依赖**不是 ESM**（大量 CJS 包），且动辄几百个小模块（一个 lodash 上千文件）。让浏览器直接加载它们 = 几百个请求 + 语法不兼容。Vite 的解法是 **esbuild 预构建**：启动前把 node_modules 里的依赖**转成 ESM、合并成单文件**，缓存进 `node_modules/.vite`：

```
lodash-es（几百个小模块）→ 预构建 → node_modules/.vite/deps/lodash-es.js（单文件）
```

于是浏览器请求依赖时是**一个请求一个 ESM 文件**。缓存触发规则：lockfile、vite 配置、node_modules 变化任一发生就重跑——"新装包后要重启 dev"的原因（配置与缓存指纹变了）。`optimizeDeps.include` 可以把"运行中才发现"的深层依赖提前纳入（[第 6 章](/posts/vite-dev/06-astro-and-vite.md)的透传场景）。

## 代码分割：两条路径

**路径一：自动分割（动态 import）**—— Rollup 默认按"动态导入边界"分包：

```ts
// 静态 import：进主包
import HeavyReport from './HeavyReport.vue'

// 动态 import：单独成 chunk，用到才加载
const HeavyReport = defineAsyncComponent(() => import('./HeavyReport.vue'))
```

路由级懒加载是它的标准应用（Vue Router 的 `component: () => import(...)`），首屏只带首屏的代码——[Vue 第 10 章](/posts/vue-core/10-production-integration.md)的第一板斧。

**路径二：手工分割（manualChunks）**——把指定依赖强制聚到一起：

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['vue', 'vue-router'],        // 框架层：变化少、缓存久
        charts: ['echarts'],                   // 大依赖独立：不拖累主包
      },
    },
  },
}
```

策略直觉：**变化频率分层**——框架与稳定依赖进 vendor（长缓存），业务代码频繁变进主 chunk。注意手工分割是双刃剑：分得过碎请求数爆炸，分错了反而让缓存大面积失效——**先看自动分割的产物，再有针对性地切**。

## 首屏加载的分层清单

按收益排序的行动项：

1. **路由级懒加载**：非首屏页面全部动态 import；
2. **重组件异步化**：图表/编辑器/地图用 `defineAsyncComponent`（[Vue 第 10 章](/posts/vue-core/10-production-integration.md)）；
3. **大依赖审视**：`rollup-plugin-visualizer` 生成体积报告，找一个"占 30% 却只用于一个小功能"的依赖换轻量替代；
4. **资源维度**：图片压缩、字体子集化、按需 icon（[第 4 章](/posts/vite-dev/04-static-assets.md)的 glob 按需）；
5. **vendor 稳定化**：框架依赖独立分包，业务迭代不伤缓存。

验收工具：`npm run build` 输出的 chunk 尺寸表 + Lighthouse 的首屏指标——**优化必须配基线数据**（[鸿蒙第 9 章](/posts/harmonyos-app-dev/09-performance-debug.md)的度量纪律在 Web 同样成立）。

## 踩坑提示

- 预构建报 "Outdated Optimize Dep"：重启 dev（缓存指纹失效的正常反应），别硬清 node_modules。
- manualChunks 把"互相依赖的模块"分到两个 chunk——循环引用警告 + 初始化顺序问题，切割面要顺着依赖方向。
- 过度懒加载：首屏关键组件也 async 了，首屏反而多一次往返——懒加载只对"非关键路径"下手。

## 练习

1. 打开 node_modules/.vite/deps 看预构建产物，数一数 lodash 被合并成了几个文件。
2. 用 visualizer 生成体积报告，找出最该被懒加载的 chunk 并改造。
3. 做 manualChunks 实验：把框架层独立出来，改一次业务代码重新 build，对比 hash 变化范围。
