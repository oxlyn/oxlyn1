---
title: "Nuxt 全栈入门 · 第 7 章：中间件与鉴权"
description: "路由中间件 defineNuxtRouteMiddleware、server middleware、useCookie 轻量登录与页面守卫。"
publishDate: 2026-11-05T09:00:00
tags: ["nuxt", "vue", "教程"]
---

> 本文对应官方文档[《Middleware》](https://nuxt.com/docs/4.x/directory-structure/app/middleware)。

**学习目标**：掌握前端路由中间件与服务端中间件的分工，用 cookie 实现一个最小可用的登录流，理解每层"守卫"拦截什么。

"访问控制"散落在各处会失控——每个页面都写一遍"没登录就跳走"是第一个要消灭的重复。Nuxt 的中间件分两层，各管半边。

## 路由中间件：导航的关卡

```ts
// app/middleware/auth.ts —— 自动导入，文件名即中间件名
export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie('notes-token')
  if (!token.value) {
    return navigateTo(`/login?redirect=${to.path}`)   // 拦下，带上去向
  }
})
```

```vue
<!-- 需要登录的页面声明一下 -->
<script setup>
definePageMeta({ middleware: ['auth'] })
</script>
```

三种挂载方式：**页面级**（如上）、**命名式全局**（`app/middleware/` 下 `auth.global.ts`，每个导航必经）、`definePageMeta` 里匿名内联。中间件在**服务器渲染与客户端导航时都会执行**——刷新和站内跳转得到同一条防线。

鉴权页面读"去向"与"回跳"的完整闭环：

```vue
<!-- app/pages/login.vue -->
<script setup>
const route = useRoute()
async function login() {
  // 生产请用真实认证服务，这里演示 cookie 流程
  useCookie('notes-token', { maxAge: 60 * 60 * 24 }).value = 'demo-token'
  await navigateTo(route.query.redirect ?? '/notes')
}
</script>
```

`useCookie` 是 Nuxt 的关键拼图：**同一个 cookie ref 在服务端渲染时从请求头读、客户端响应式读写**——SSR 首屏就能知道"已登录"，不会闪登录按钮。

## server middleware：每个请求的必经之路

`server/middleware/` 下的文件对**所有进入 Nitro 的请求**执行（包括静态资源之外的一切接口调用），没有"下一页"只有 `next`：

```ts
// server/middleware/log.ts —— 请求日志，第 6 章 runtimeConfig 在此读取
export default defineEventHandler((event) => {
  console.log(`[nitro] ${event.method} ${event.path}`)
})
```

与路由中间件的分工表：

| | 路由中间件（app/） | server middleware（server/） |
| --- | --- | --- |
| 触发时机 | 页面导航 | 每个 API/路由请求 |
| 能看到 | 路由目标、页面元信息 | 原始请求 event |
| 典型用途 | 登录守卫、A/B、重定向 | 请求日志、统一注入头、接口级鉴权 |

**接口权限要在服务端拦**——路由中间件只拦得住"页面"，拦不住手搓 curl 的人。让 `server/api` 的敏感接口自己检查 cookie/token（或抽成 `server/utils/requireAuth.ts` 复用），前端中间件只是体验层的第一道门。

## notes-web 的登录闭环

本章产出：`login.vue`（登录页）、`auth.global.ts`（全局守卫：`/login` 与公开页放行，其余查 token）、`server/utils/requireAuth.ts`（接口侧校验，`notes.post.ts` 等写操作接入）。至此同一套 notes 有了第四种访问方式——浏览器里带登录的 Web 应用。

## 踩坑提示

- 只写了路由中间件——接口照样被匿名调用，服务端校验才是权限的实体；
- cookie 没设 `httpOnly`（server 端 set 时）——脚本可读，生产环境用 Set-Cookie 响应头下发的 token 记得加；
- 中间件里无脑 `navigateTo` 造成循环重定向——先判断目标是否就是 `/login`；
- 依赖 `useCookie` 存敏感数据明文——cookie 可见可改，真正的鉴权判定要在服务端对 token 验签。

## 练习

1. 完成登录闭环：未登录访问 `/notes` 被导到 `/login?redirect=/notes`，登录后回到原页。
2. 给 `server/api/notes.post.ts` 接入 `requireAuth`，用 curl 无 cookie 调一次验证 401。
3. 写 `server/middleware/log.ts`，观察 DevTools 的 Nitro 面板里每条请求的日志顺序。
