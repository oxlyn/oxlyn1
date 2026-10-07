---
title: "Nuxt 全栈入门 · 第 6 章：状态与环境配置"
description: "useState 的 SSR 安全性、组合式函数复用、plugins 注入、runtimeConfig 与 NUXT_ 环境变量。"
publishDate: 2026-11-04T09:00:00
tags: ["nuxt", "vue", "教程"]
---

> 本文对应官方文档[《State Management》](https://nuxt.com/docs/4.x/getting-started/state-management)与[《Runtime Config》](https://nuxt.com/docs/4.x/guide/going-further/runtime-config)。

**学习目标**：掌握 SSR 场景下共享状态的正确姿势，把组件间通信收拢成组合式状态，学会用 runtimeConfig 注入环境配置。

[Vue 系列第 7 章](/posts/vue-core/07-provide-inject-pinia/)讲过 provide/inject 与 Pinia；SSR 场景多了一条铁律：**状态不能是模块级单例**——服务器是所有用户共用的一个进程，模块级变量会串号。Nuxt 为此给了 `useState`。

## useState：SSR 安全的共享状态

```ts
// app/composables/useNotesUi.ts
export const useNotesUi = () => {
  // key 唯一即可，值是任意可序列化对象
  const filter = useState('notes-filter', () => '')
  return { filter }
}
```

```vue
<script setup>
// 任意组件里，同 key 即同状态
const { filter } = useNotesUi()
</script>
```

三条规则：

- **初始化值必须是函数**（`() => ''`）——`useState('x', someObject)` 会把对象在服务器实例间共享；
- **key 全局唯一**——它就是状态的身份证（和第 4 章数据获取的 key 同一套哲学）；
- **始终经由 useState**，别在 composables 顶层写 `let x = ref()` 模块级变量——那正是会串号的写法。

跨组件的复杂状态仍是 Pinia 的主场（官方支持良好），`useState` 适合轻量、可序列化的 UI 状态；判断标准：这状态需不需要跨页面保持、要不要 devtools 时间旅行——要就上 Pinia。

## 组合式函数：逻辑复用原地成立

[第 3 章](/posts/nuxt-dev/03-auto-imports/)的自动导入让 [vue-core 第 8 章](/posts/vue-core/08-composables/)的组合式函数直接变成全站可用的"本地库"：

```ts
// app/composables/useNoteActions.ts —— 读写动作收拢
export function useNoteActions() {
  async function add(text) { await $fetch('/api/notes', { method: 'POST', body: { text } }) }
  async function remove(id) { await $fetch(`/api/notes/${id}`, { method: 'DELETE' }) }
  return { add, remove }
}
```

页面里 `const { add } = useNoteActions()` 一行接入——组件薄、逻辑厚，这是 Nuxt 项目组织的主旋律。

## plugins：启动期注入

需要在**应用启动时**做一次的事（初始化 SDK、注册全局助手）放 `app/plugins/`：

```ts
// app/plugins/announce.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('version', '1.0.0')   // 任意组件里 useNuxtApp().$version
})
```

插件有 `order`、可声明 `.client.ts` / `.server.ts` 只在指定端跑——能不用尽量不用，**大多数"启动注入"其实该做成 composables**，懒加载的永远好过启动加载的。

## runtimeConfig：配置进环境

构建时不知道、部署时才定的东西（接口地址、第三方 key）走 `runtimeConfig`：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    notesToken: '',                     // 服务端专用（如读数据库的凭据）
    public: { siteName: 'notes-web' },  // 前后端都可用
  },
})
```

```bash
NUXT_NOTES_TOKEN=abc123 nuxt build     # NUXT_ 前缀的环境变量自动覆盖同名配置
NUXT_PUBLIC_SITE_NAME=notes nuxt build # public 区同理
```

```ts
const config = useRuntimeConfig()
config.public.siteName        // 组件里读
config.notesToken             // 只在 server/ 里可见——密钥永远别进 public 区
```

这套机制与[《Node.js 核心入门》第 9 章](/posts/node-core/09-process-and-cli/)的"配置走环境变量"完全同源，只是加了类型与命名空间。第 10 章部署时它是主角。

## 踩坑提示

- useState 初始值传了对象字面量——服务器多实例共享同一对象，用户 A 的状态出现在 B 的页面；
- 把 API key 放进 `public` 区——等于印在发给每个访客的 HTML 里；
- 插件里做重活（拉数据、初始化大库）——所有页面启动都付一次代价，挪进按需 composable；
- 在 `shared/` 里用 useRuntimeConfig——运行环境 API 不可跨端，配置读取各自成对。

## 练习

1. 用 `useState` 做"侧边栏开关"，两个页面共享，切换后跳转验证状态保持。
2. 把 add/remove 动作收进 `useNoteActions`，列表页瘦身成纯展示。
3. 在 `runtimeConfig.public` 配 siteName，用 `NUXT_PUBLIC_SITE_NAME=其他名 nuxt dev` 启动，验证环境变量覆盖。
