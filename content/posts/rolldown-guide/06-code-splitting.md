---
title: "Rolldown 入门 · 第 6 章：代码分割"
description: "自动分割的语义、advancedChunks 对 manualChunks 的继承与超越、chunk 归属的判断。"
publishDate: 2026-06-07T09:00:00
tags: ["rolldown", "vite", "前端工程化", "教程"]
---

> 本文对应官方文档[Automatic Code Splitting](https://rolldown.rs/in-depth/automatic-code-splitting)与[Manual Code Splitting](https://rolldown.rs/in-depth/manual-code-splitting)。

**学习目标**：理解 Rolldown 的自动分割语义，掌握 advancedChunks 的分组语法，做一次 [Vite 第 9 章](/posts/vite-dev/09-optimization.md)优化策略的迁移。

## 自动分割：动态边界优先

与 Rollup 同源的语义：**静态 import 进引用链所在的 chunk，动态 import 自成边界**。多入口共享的模块自动抽成共享 chunk——默认行为已经覆盖 [Vite 第 9 章](/posts/vite-dev/09-optimization.md)的"路径一"（路由懒加载 + 重组件异步化），无需配置：

```ts
// 入口 A、B 都静态引用 shared.ts → 自动产出 shared chunk
// 任一入口动态 import Heavy.vue → Heavy 自成 chunk，用到才加载
```

判断口诀照旧：**该懒的懒（动态 import），该共享的共享（让打包器抽）**——手写分组只在默认结果不满意时出场。

## advancedChunks：manualChunks 的继任者

`manualChunks` 已废弃，继任者是表达力更强的 `advancedChunks`：

```ts
// Rollup/Vite 旧写法（函数式，靠模块路径字符串返回 chunk 名）
manualChunks(id) {
  if (id.includes('node_modules')) return 'vendor'
}

// Rolldown 新写法（声明式分组，支持正则与优先级）
output: {
  advancedChunks: {
    groups: [
      { name: 'framework', test: /node_modules\/(vue|vue-router)/ },
      { name: 'charts', test: /node_modules\/echarts/ },
      { name: 'vendor', test: /node_modules/ },
      { name: 'shared', test: /src\/shared/ },
    ],
  },
}
```

读法：**分组按序匹配，先命中先归属**——模块被分进第一个 test 命中的组。相比函数式写法的三个升级：

1. **声明式**：分组是数据，可审查、可生成（[第 8 章](/posts/rolldown-guide/08-rolldown-vite.md)的 meta-frameworks 就是靠它做路由级分割）；
2. **组内控制**：每组可配 `minSize`（小于阈值不拆）、优先级等细粒度参数；
3. **语义更稳**：函数式的隐式依赖（module id 形态）被显式正则取代——"换个包管理器 id 变了、分组失效"这类暗病消失。

迁移对照：旧函数式逻辑逐条翻成正则组——`if (id.includes('node_modules/react')) return 'react'` 变成 `{ name: 'react', test: /node_modules\/react/ }`，**顺序即优先级**。

## chunk 归属的判断与验收

分组写完必做两步验收：

```bash
rolldown -c          # 看 build 输出的 chunk 清单
# 或用 visualizer 类工具看归属——每个模块进了哪个组一目了然
```

- **重复出现**的模块（两个 chunk 各带一份）→ 组的正则没圈住公共依赖；
- **vendor 太大** → 细分大依赖（echarts、moment 各自成组）；
- **共享 chunk 太碎** → `minSize` 合并微 chunk。

[鸿蒙第 9 章](/posts/harmonyos-app-dev/09-performance-debug.md)的度量纪律：改分组前后各存一份基线数据。

## 踩坑提示

- 组顺序写反（`vendor` 的宽正则在 `charts` 前面）——大依赖被 vendor 吞掉，分组失效但无报错。
- advancedChunks 与动态 import 边界打架（组把懒加载模块抢进同步 chunk）——首屏反而变大，懒边界优先于手工分组。
- [Vite 第 9 章](/posts/vite-dev/09-optimization.md)的警告原样有效：切分面顺着依赖方向，逆方向的分组制造循环 chunk。

## 练习

1. 把 [Vite 第 9 章](/posts/vite-dev/09-optimization.md)的 manualChunks 例子迁移成 advancedChunks，对比产物 chunk 表。
2. 加 minSize 实验微 chunk 合并，记录 chunk 数量变化。
3. 故意调换两个组的顺序，复现"大依赖被吞"，再修复。
