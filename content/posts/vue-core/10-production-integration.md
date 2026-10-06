---
title: "Vue 核心入门 · 第 10 章：工程化与 Astro 集成"
description: "Vite 工程结构、性能要点、在 Astro 岛屿中挂载 Vue——把组件放进真实项目。"
publishDate: 2026-08-22T09:00:00
tags: ["vue", "教程"]
---

> 本文对应官方文档[性能优化](https://cn.vuejs.org/guide/best-practices/performance.html)与 [Astro 集成指南](https://docs.astro.build/zh-cn/guides/integrations-guide/vue/)。

**学习目标**：认识 Vite 工程的分包与按需加载，掌握 Vue 性能三板斧，把 Vue 组件作为岛屿挂进 Astro 项目。

## 工程结构：约定大于配置

`npm create vue@latest` 生成的标准布局：

```
src/
├── components/    # 组件（PascalCase）
├── composables/   # 组合式函数（第 8 章）
├── stores/        # Pinia（第 7 章）
├── pages/         # 接了 Router 才有
├── assets/        # 静态资源（走构建管线）
└── App.vue        # 根组件
```

Vite 的两件事值得知道：**按需编译**（dev 阶段只编译被请求的模块，秒级冷启动）、**基于路由的代码分割**（动态 `import()` 自动分包）。体积优化的第一性原理：**首屏只加载首屏用的代码**——路由懒加载与异步组件都服从这条。

## 性能三板斧

1. **异步组件**：重组件（图表、编辑器）按需水合——

```vue
<script setup>
import { defineAsyncComponent } from 'vue'
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))
</script>
```

2. **列表 keyed + 稳定结构**：v-for 的正确 key（[第 3 章](/posts/vue-core/03-template-syntax.md)）让 diff 最小化；超长列表上虚拟滚动（官方生态 `vue-virtual-scroller`，原理同 [JS 生成器惰性](/posts/javascript-core/05-iterators-and-generators.md)的"只渲染可见"）。

3. **慎用深观察**：`deep: true` 的 watch 与超大 reactive 对象是隐性成本大户——状态切小、字段拆细（[第 2 章](/posts/vue-core/02-reactivity.md)的边界）。

（Vue 3.5 起响应式系统已大幅优化内存与追踪开销，"手动 memo 化一切"的老经验大多过时——先测量再优化，[鸿蒙第 9 章](/posts/harmonyos-app-dev/09-performance-debug.md)的三段式纪律通用。）

## 在 Astro 岛屿里用 Vue

本站是 Astro 项目——Vue 组件以**岛屿**形态挂进去（[Astro 第 7 章](/posts/astro-from-scratch/07-islands.md)的机制）：

```bash
npx astro add vue       # 装集成，astro.config.mjs 自动接线
```

```astro
---
import ThemeSwitcher from '@/components/vue/ThemeSwitcher.vue'
---
<!-- 默认：仅服务端渲染成静态 HTML，零客户端 JS -->
<ThemeSwitcher theme="light" />

<!-- client:* 指令决定水合时机 -->
<ThemeSwitcher client:load />
<HeavyChart client:idle />
<CommentBox client:visible />
```

水合指令四件：`client:load`（立即）、`client:idle`（空闲）、`client:visible`（滚进视口）、`client:media`（匹配断点）——**交互密度决定水合策略**。混合站点的黄金组合：静态内容用 Astro 组件（[主题系列](/posts/astro-theme-dev/02-components-props.md)的构建期 props），交互岛屿用 Vue/React（props 序列化传入，运行时复活）。

注意岛屿边界：Vue 岛屿之间不共享运行时状态（各水合各的）——跨岛状态要么走 localStorage（[第 8 章](/posts/vue-core/08-composables.md)的 useLocalStorage），要么合并成一个大岛。

## Vue 与 React 的选型快评

两者服务同一问题域，差异是气质：**Vue** 单文件组件聚拢（模板/逻辑/样式一处）、响应式隐式（ref 订阅自动化）、官方全家桶齐整（Router/Pinia/DevTools 一脉）；**React** JSX 一把梭（UI 即 JS 表达式）、显式重渲染、生态更宽。团队既有 TS 深度用户又求稳——两者都成立；从零快速起一个中文生态项目——Vue 的文档与工具链友好度目前占优。本站选 Astro 而非两者，理由见[第 9 章](/posts/vue-core/09-ssr-nuxt.md)。

## 踩坑提示

- Astro 岛屿的 props 必须可序列化（函数/类实例传不过去）——岛屿接口用纯数据。
- `client:visible` 的岛屿在视口外永远不水合——首屏关键交互别用它。
- 异步组件没有加载态占位会闪一下——配 `loadingComponent` 或骨架屏。

## 练习

1. 用 `npm create vue` 建全功能项目，把 [第 8 章](/posts/vue-core/08-composables.md)的 useFetch 用进一个列表页。
2. 在本站（或任意 Astro 项目）接 Vue 集成，挂一个 client:visible 的计数器岛屿。
3. 把一个重组件改成 client:idle 异步加载，用 Network 面板对比首屏请求数。
