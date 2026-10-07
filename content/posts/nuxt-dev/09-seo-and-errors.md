---
title: "Nuxt 全栈入门 · 第 9 章：SEO 与错误处理"
description: "useHead/useSeoMeta 元信息管理、SSR 对 SEO 的意义、错误边界与 createError 统一错误流。"
publishDate: 2026-11-07T09:00:00
tags: ["nuxt", "vue", "教程"]
---

> 本文对应官方文档[《SEO Meta》](https://nuxt.com/docs/4.x/getting-started/seo-meta)与[《Error Handling》](https://nuxt.com/docs/4.x/getting-started/error-handling)。

**学习目标**：掌握每页元信息的注入方式，理解 SSR 与 SEO 的因果，建立统一的错误处理流——让应用"被搜索到"且"出错不失态"。

做 SSR 的头号动机就是 SEO，那 SEO 的本体——标题、描述、社交卡片——就要配置到位。错误处理则是 SSR 应用的另一课：页面在服务器渲染，一个未捕获错误可能毁掉整个响应。

## useSeoMeta：每页的元信息

```vue
<!-- app/pages/notes/[id].vue -->
<script setup>
const { data: note } = await useFetch(`/api/notes/${route.params.id}`)

useSeoMeta({
  title: () => note.value ? `#${note.value.id} ${note.value.text}` : '笔记',
  description: () => note.value?.text.slice(0, 100) ?? '',
  ogTitle: () => `笔记 #${route.params.id}`,
  ogDescription: () => note.value?.text.slice(0, 100) ?? '',
  ogImage: 'https://example.com/cover.png',
})
</script>
```

- **响应式**：传 getter，数据到达后标题自动更新（SSR 与客户端导航都生效）；
- `og:` 前缀是社交平台分享卡片（Open Graph），页面有 ogImage 才像样——本站博客的[动态 OG 图](/posts/astro-theme-dev/)是这套机制的手工加强版；
- 完整 `<head>` 控制（link、script、结构化数据）走它的底层 `useHead`。

SSR 在这里的角色：爬虫大多不执行 JS，**CSR 应用的动态标题它们看不到，SSR 应用的元信息直接在 HTML 源码里**——第 8 章 curl 验证过的差异，落到 SEO 就是收录与不收录的差别。

## 错误流：createError 到错误页

Nuxt 把错误分两类、各给一条路径：

```ts
// 页面/服务端任意位置：抛出"该展示错误页"的信号
throw createError({ statusCode: 404, statusMessage: '笔记不存在', fatal: true })
```

```vue
<!-- app/error.vue —— 全局错误页（独立于 app.vue 的顶层组件） -->
<script setup>
const props = defineProps({ error: Object })
</script>
<template>
  <div class="p-10 text-center">
    <h1 class="text-4xl">{{ error.statusCode }}</h1>
    <p>{{ error.statusMessage }}</p>
    <button @click="clearError({ redirect: '/' })">回首页</button>
  </div>
</template>
```

规则清单：

- **`fatal: true` 或服务端抛错** → 渲染 `error.vue` 整页兜底（404/500 等真实状态码）；
- **非致命错误** → 组件内用 `onErrorCaptured` 或页面的 `error` 响应值局部处理（[vue-core 生命周期](/posts/vue-core/05-lifecycle-watchers/)知识直接适用）；
- `server/api` 里第 5 章的 `createError({ statusCode: 400 })` 会原样传给 `useFetch` 的 `error`——**错误在两端形状一致**，前端 `v-else-if="error"` 分支接住即可。

## 可访问性与语义

SEO 的另一面是语义化：页面主内容用 `<h1>` 每页一个、导航用 `<nav>`、图片必带 `alt`——`<NuxtLink>` 渲染的原生 `<a>` 已经替你做对了一半，别用"可点击的 div"把它糟蹋掉。

## 踩坑提示

- 所有页面同标题——默认值没人改，`useSeoMeta` 每页必写；
- ogImage 用相对路径——分享卡片要求绝对 URL；
- 把 error.vue 放进 app/pages/——它是顶层组件，放错位置不生效；
- 服务端抛错被裸 try/catch 吞掉——错误静默变成 200 空页，要么重抛要么明确兜底。

## 练习

1. 给三个页面配齐 title/description/og 元信息，用 DevTools 看头部注入，再用 curl 确认 SSR 源码里有标题。
2. 让详情页对不存在 id 抛 `createError 404`，观察整页跳到 error.vue 与真实 404 状态码。
3. 写 error.vue 的错误上报逻辑（`onErrorCaptured` 或全局 hook），把 error.statusCode 打进控制台。
