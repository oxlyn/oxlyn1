---
title: "Nuxt 全栈入门 · 第 4 章：数据获取"
description: "useFetch/useAsyncData/$fetch 三件套、SSR payload 去重、key 纪律、pending 与 error 状态。"
publishDate: 2026-11-02T09:00:00
tags: ["nuxt", "vue", "教程"]
---

> 本文对应官方文档[《Data Fetching》](https://nuxt.com/docs/4.x/getting-started/data-fetching)与 [useFetch](https://nuxt.com/docs/4.x/api/composables/use-fetch)、[useAsyncData](https://nuxt.com/docs/4.x/api/composables/use-async-data)。

**学习目标**：掌握 Nuxt 数据获取三件套的分工，理解"SSR 渲染一次、客户端不重取"的 payload 机制，给 notes-web 接上真实数据。

组件里 `onMounted` 发请求是 SPA 的习惯；SSR 场景这套不够——服务器渲染时组件就要拿到数据。Nuxt 的答案是**三件套**，分工先记牢：

| API | 定位 | 典型场景 |
| --- | --- | --- |
| `useAsyncData` | 通用的"异步取数据"包装 | 任意异步任务（含组装多个请求） |
| `useFetch` | useAsyncData 的 URL 快捷方式 | 直接取一个接口 |
| `$fetch` | 裸的 fetch 封装（不进 payload） | 事件回调里的提交、删除 |

## useFetch：页面数据的默认姿势

```vue
<!-- app/pages/notes/index.vue -->
<script setup>
const { data, pending, error, refresh } = await useFetch('/api/notes')
</script>

<template>
  <p v-if="pending">加载中…</p>
  <p v-else-if="error">出错了：{{ error.message }}</p>
  <ul v-else>
    <li v-for="note in data" :key="note.id">
      <NuxtLink :to="`/notes/${note.id}`">#{{ note.id }} {{ note.text }}</NuxtLink>
    </li>
  </ul>
</template>
```

注意 `await` 直接写在 setup 里——**组件在服务器上等数据就位后才渲染**，浏览器拿到的 HTML 已含完整列表。返回的 `data` 是 ref（[vue-core 响应式](/posts/vue-core/02-reactivity/)的 ref 原样适用），`pending`/`error` 是现成的状态，`refresh()` 手动重取。

## payload：为什么客户端不重复请求

SSR 页面刷新时序是：服务器取数据 → 渲染 HTML → **把数据一并序列化进页面（payload）** → 浏览器激活时直接复用。所以上面代码在客户端**不会**再发一次 `/api/notes`——DevTools 的 Payload 面板能看到这份数据。

这是框架级去重，但它依赖一个前提：**同一次渲染里，同样的数据用同样的 key**。`useFetch` 的 key 默认从 URL 与参数生成，`useAsyncData` 显式指定：

```ts
// key 相同的两次调用（SSR 与客户端）只会真正执行一次
const { data: stats } = await useAsyncData('notes-stats', () => computeStats())
```

Nuxt 4 把这套机制进一步收成**单例数据获取**：跨组件同 key 的调用共享同一次请求与同一份响应对象——列表页头部的统计和列表本身可以放心各自取数。

## key 纪律

- **不同数据必须不同 key**——key 撞了会拿到彼此的缓存；
- **同参数同 key**——`useFetch('/api/notes')` 与 `useFetch('/api/notes', { key: 'x' })` 是两份缓存；
- 响应式参数直接传 `ref`/getter，URL 变化自动重取并沿用 key 规则。

## $fetch：事件里的裸请求

`$fetch` 不注册缓存、不进 payload——**用户操作触发的写操作**用它：

```ts
async function addNote(text) {
  await $fetch('/api/notes', { method: 'POST', body: { text } })
  await refresh()          // 触发上面 useFetch 的重取
}
```

记忆口诀：**页面要的数据 useFetch/useAsyncData，按钮干的事 $fetch**。写完调 `refresh()` 让页面数据跟上。

## 踩坑提示

- 忘了 `await` useFetch——SSR 不等数据，页面闪"加载中"再水合；
- key 随机生成（`Date.now()` 拼进 key）——每次渲染都算缓存未命中，服务端白取一次；
- 列表接口返回对象又改返回数组——key 没变缓存结构对不上，改数据形状时同步换 key；
- 在 `shared/` 或服务端代码里调 useFetch——它是组件上下文的产物，服务端请求请用 `$fetch` 或直接函数调用。

## 练习

1. 给 `notes/index.vue` 接 `/api/notes`（先用静态 JSON 顶住，第 5 章换真接口），完整渲染 pending/error/data 三态。
2. 在详情页 `useFetch(\`/api/notes/${route.params.id}\`)`，从 DevTools Payload 面板确认客户端没有二次请求。
3. 把两个组件里对同一接口的取数改成相同 key 的 `useAsyncData`，用网络面板验证只发一次。
