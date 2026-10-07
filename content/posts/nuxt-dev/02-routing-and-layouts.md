---
title: "Nuxt 全栈入门 · 第 2 章：文件路由与布局"
description: "pages 目录即路由表、动态路由与嵌套路由、NuxtLink、definePageMeta 与 layouts 布局系统。"
publishDate: 2026-10-31T09:00:00
tags: ["nuxt", "vue", "教程"]
---

> 本文对应官方文档[《Routing》](https://nuxt.com/docs/4.x/getting-started/routing)、[《Pages》](https://nuxt.com/docs/4.x/directory-structure/app/pages)与[《Layouts》](https://nuxt.com/docs/4.x/directory-structure/app/layouts)。

**学习目标**：掌握"文件即路由"的映射规则与动态路由写法，会用 layouts 抽公共骨架，给 notes-web 搭起页面骨架。

手写 Vue 项目里路由要自己装 vue-router、配路由表；Nuxt 里 **`app/pages/` 的目录树就是路由表**——本章的全部知识就是这张映射表的规则。

## 文件 → 路由的映射规则

```text
app/pages/
├── index.vue             →  /
├── about.vue             →  /about
├── notes/
│   ├── index.vue         →  /notes
│   └── [id].vue          →  /notes/:id        动态参数
└── user/
    └── [id]/
        └── settings.vue  →  /user/:id/settings
```

- 方括号 `[id].vue` 是**动态路由**，一层目录一层路径，嵌套天然成立；
- `index.vue` 表示"本目录的根"；
- 双层方括号 `[...slug].vue` 是 catch-all，吃掉剩余任意层级。

读参数用 `useRoute()`（自动导入，无 import）：

```vue
<!-- app/pages/notes/[id].vue -->
<script setup>
const route = useRoute()
const id = route.params.id        // 字符串，数字自己转
</script>

<template>
  <h1>笔记 {{ id }}</h1>
</template>
```

## NuxtLink：导航的正确姿势

页面间跳转一律用 `<NuxtLink>`，它渲染成 `<a>` 但带客户端路由：点击不再整页刷新，而是拉取新页面数据 + 原地切换（SPA 导航），同时自动做**预取**（链接进入视口就开始准备）：

```vue
<template>
  <nav>
    <NuxtLink to="/notes">笔记</NuxtLink>
    <NuxtLink :to="`/notes/${note.id}`">{{ note.text }}</NuxtLink>
  </nav>
</template>
```

组件内编程式导航用 `navigateTo('/notes')`，中间件与 `definePageMeta` 场景（第 7 章）里尤其常用。

## definePageMeta：页面的元信息

每个页面可以用 `definePageMeta` 声明路由级配置，最常用的两项：

```vue
<script setup>
definePageMeta({
  layout: 'wide',          // 使用 layouts/wide.vue 布局
  middleware: ['auth'],    // 进入前先过这道中间件（第 7 章）
})
</script>
```

## layouts：公共骨架

导航栏、页脚、侧边栏这类"每页都长一样"的部分放进布局，页面只填充内容：

```vue
<!-- app/layouts/default.vue -->
<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b p-4">
      <NuxtLink to="/">notes-web</NuxtLink>
    </header>
    <main class="flex-1 p-6">
      <slot />          <!-- 页面内容注入点 -->
    </main>
  </div>
</template>
```

页面默认套用 `default.vue`；页面组件顶层的 `<slot />` 约定和 [Vue 插槽](/posts/vue-core/04-components-props/)是同一机制，只是注入的不再是"父组件的内容"而是"当前页面"。

## notes-web 的骨架

本章产出三个页面加一个布局：`pages/index.vue`（首页导航）、`pages/notes/index.vue`（笔记列表占位）、`pages/notes/[id].vue`（笔记详情占位）——数据从第 4 章的 `useFetch` 接进来。用 DevTools 的 Pages 面板看一眼路由树，和你建出的目录树逐条对照。

## 踩坑提示

- 页面跳转后内容不刷新——同一组件复用时 `route.params.id` 变了但 setup 不重跑，用 `watch(() => route.params.id, ...)` 或给 `<NuxtPage>` 加 key；
- `[id]` 忘写方括号——`id.vue` 成了字面路由 `/id`，动态参数不生效；
- `useRoute` 用在了 `<script setup>` 之外（工具函数里）——拿不到注入的上下文，路由信息要从调用处传进去；
- 布局里忘了 `<slot />`——所有页面空白，内容没地方放。

## 练习

1. 建 `pages/notes/index.vue` 与 `pages/notes/[id].vue`，列表页放 10 个 `<NuxtLink>`，点击跳转看 URL 与参数。
2. 写一个 `wide.vue` 布局（内容区更宽），在详情页用 `definePageMeta` 启用它。
3. 加 `pages/notes/[...slug].vue` 兜底页，访问不存在的层级观察命中规则，验证 catch-all。
