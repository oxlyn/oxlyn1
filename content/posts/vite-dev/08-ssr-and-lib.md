---
title: "Vite 工程化入门 · 第 8 章：SSR 与库模式"
description: "SSR 构建的双包结构、库模式打包组件库——两种'不止一个 bundle'的构建。"
publishDate: 2026-06-09T09:00:00
tags: ["vite", "前端工程化", "教程"]
---

> 本文对应官方文档[SSR](https://cn.vite.dev/guide/ssr)与[库模式](https://cn.vite.dev/guide/build)。

**学习目标**：理解 SSR 构建的 client/server 双包与产物差异，会用 lib 模式打出一个可发布的组件库。

## SSR 构建：一个应用，两份包

[Vue 第 9 章](/posts/vue-core/09-ssr-nuxt.md)讲过 SSR 的运行模型：服务器渲染 HTML、浏览器水合。落到构建上就是**同一份源码打两遍**：

```ts
// vite.config.ts
export default defineConfig({
  build: {
    // 客户端包：浏览器水合用（默认入口）
  },
})
```

```ts
// vite.ssr.config.ts（或用 --ssr 参数）
export default defineConfig({
  build: {
    ssr: 'src/entry-server.ts',     // 服务器包：Node 里执行，产出纯渲染函数
    target: 'node18',
    format: 'esm',
  },
})
```

两份包的差异由运行环境决定：

| | 客户端包 | 服务器包 |
| --- | --- | --- |
| 运行地 | 浏览器 | Node |
| 产物 | 水合脚本（带事件绑定） | `render(url)` 渲染函数 |
| CSS | 注入 style/link | 抽成字符串拼进 HTML |
| 环境分支 | 全量 | 要处理 `import.meta.env.SSR` |

代码里用 `import.meta.env.SSR` 做环境分支（**构建期静态替换**——死代码在另一侧直接被 tree-shake 掉，[第 3 章](/posts/vite-dev/03-build-and-env.md)的机制在这里发光）：

```ts
if (import.meta.env.SSR) {
  // 只有服务器包里存在
} else {
  // window/localStorage 只在客户端包里
}
```

实践提示：手写双配置适合学习与定制场景；生产级 SSR 项目（Nuxt/自研框架）已把双包编排封装好——理解原理即可，不必重复造轮子。

## 库模式：打包一个组件库

[主题开发第 7 章](/posts/astro-theme-dev/07-publish-theme.md)说过"Astro 原生文件可以零构建发布"——那是 `.astro`/`.vue` 单文件直发的情况。当库包含**需要编译的资源**（TS 源码、需要 tree-shake 的多入口）时，用 Vite 的库模式：

```ts
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],        // 双格式：现代 bundler + 传统 Node
      fileName: (format) => `my-lib.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],             // 依赖外部化：不打包，由使用方提供
    },
  },
})
```

三个关键决策：

- **external 化对端依赖**（vue/react 不打进库里，否则使用方应用里出现两份 Vue——[ArkTS 第 1 章](/posts/harmonyos-app-dev/01-app-model.md)的"单例副本问题"在 npm 世界的翻版）；
- **双格式产物** + package.json 的 `exports` 字段按条件导出（`import` 走 es、`require` 走 cjs——[TS 第 8 章](/posts/typescript-core/08-modules.md)的 exports 知识闭环）；
- **保留组件样式**：CSS 由 lib 模式单独抽成文件，README 里注明"import 使用"。

产物结构示例：

```
dist/
├── my-lib.es.js      # ESM：import { Card } from 'my-lib'
├── my-lib.cjs.js     # CJS：require('my-lib')
└── style.css
```

发布流程与[第 7 章 npm 路线](/posts/astro-theme-dev/07-publish-theme.md)一致（files/exports/keywords），只是产物来自 Vite 而非裸源码。

## 踩坑提示

- 库模式忘记 external，产物体积翻倍且运行时冲突——`npm pack --dry-run` 后看 bundle 里有没有 vue/react 的实现代码。
- SSR 包里误用了 window（没写 SSR 分支）——服务器渲染时 ReferenceError，[Vue 第 9 章](/posts/vue-core/09-ssr-nuxt.md)的坑在构建层的落点。
- cjs 产物里用了顶层 await——构建期直接报错，ESM 专属特性别带进 cjs。

## 练习

1. 跑通一个 lib 模式打包：写个 Button 组件库，external vue，双格式产物 + exports 字段。
2. 在一个小组件里写 `import.meta.env.SSR` 分支，分别构建两份包，看产物里各自的痕迹。
3. 用 `npm pack --dry-run` 检查库包内容，故意去掉 external 验证体积变化。
