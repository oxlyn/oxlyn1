---
title: "Vite 工程化入门 · 第 5 章：插件系统"
description: "基于 Rollup 的插件接口、开发/构建双阶段钩子、手写一个 transform 插件。"
publishDate: 2026-05-25T09:00:00
tags: ["vite", "前端工程化", "教程"]
---

> 本文对应官方文档[插件 API](https://cn.vite.dev/guide/api-plugin)与[使用插件](https://cn.vite.dev/guide/using-plugins)。

**学习目标**：理解插件的两种钩子时序，会装会配会写一个最小插件。

## 插件：Vite 的扩展点体系

Vite 复用 **Rollup 的插件接口**（构建期钩子全兼容），再叠加一组 dev server 专属钩子——这就是"开发自研、构建兼容"架构的扩展面。安装即用：

```ts
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],    // 数组顺序即执行顺序
})
```

本站 Astro 的 `astro.config.mjs` 里就有这么一组：`@astrojs/vue`、`@tailwindcss/vite`——**框架本身就是 Vite 插件的集合**（第 6 章展开）。

## 钩子的两个世界

一个插件对象里，钩子按运行时机分两类：

| 类别 | 代表钩子 | 何时跑 |
| --- | --- | --- |
| **Vite 专属**（server） | `configureServer`、`transformIndexHtml`、`handleHotUpdate` | dev server 阶段 |
| **Rollup 兼容**（build） | `transform`、`resolveId`、`load`、`renderChunk` | 构建期（部分也在 dev 生效） |

核心钩子 `transform(code, id)` 是一把万能刀：拿到每个模块的源码与文件路径，返回加工后的代码——Tailwind 扫描类名、Vue 编译 SFC、Macro 替换标记，本质都是 transform：

```ts
// 一个最小可用插件：把源码里的 __BUILD_TIME__ 替换成构建时间戳
function buildStamp(): Plugin {
  let stamp = ''
  return {
    name: 'build-stamp',
    configResolved() {
      stamp = new Date().toISOString()
    },
    transform(code, id) {
      if (!id.endsWith('.ts')) return null       // 返回 null = 不处理
      return code.replaceAll('__BUILD_TIME__', JSON.stringify(stamp))
    },
  }
}

export default defineConfig({ plugins: [buildStamp()] })
```

`configResolved` 属于"拿到最终配置"的早期钩子；`configureServer` 能摸到 dev server 实例（加中间件、注册 mock 接口）；`handleHotUpdate` 自定义 HMR 行为（[第 2 章](/posts/vite-dev/02-dev-server-hmr.md)）。

## 排序与适用范围

- 插件数组顺序 = 应用顺序；用 `enforce: 'pre' | 'post'` 强制插队（在 Vite 核心之前/之后）；
- `apply: 'build' | 'serve'` 让插件只在某一侧生效；
- 按条件启用：`plugins: [...(process.env.MOCK ? [mockPlugin()] : [])]`。

## 生态速览

- **官方**：`@vitejs/plugin-vue` / `plugin-react` / `plugin-legacy`（老浏览器转译降级）；
- **本站在用**：`@tailwindcss/vite`（[Tailwind 第 1 章](/posts/tailwind-css/01-philosophy-and-setup.md)）、`@astrojs/vue`；
- **通用**：unplugin-auto-import（自动 import）、vite-plugin-svg-icons 等按需探索。

## 踩坑提示

- 插件版本与 Vite 大版本错配是"装了没效果/报钩子不存在"的头号原因——查插件的 peerDependencies。
- transform 返回的 code 必须是**可解析的模块内容**——替换后语法坏了，报错在下游文件（难定位），替换逻辑要保守。
- dev 与 build 双钩子都要测：只用 configureServer 的插件在生产等于不存在。

## 练习

1. 写 build-stamp 插件，在页面里显示构建时间，dev 与 preview 各看一次。
2. 用 configureServer 挂一个 /mock/user 中间件，返回假数据（配合[第 2 章](/posts/vite-dev/02-dev-server-hmr.md)代理做开关）。
3. 给 build-stamp 加 `apply: 'build'`，验证 dev 下不再生效。
