---
title: "Vue 核心入门 · 第 7 章：状态共享"
description: "状态归属决策表：组件内 ref、provide/inject 跨层传递、Pinia 全局仓库。"
publishDate: 2026-08-19T09:00:00
tags: ["vue", "教程"]
---

> 本文对应官方文档[状态管理](https://cn.vuejs.org/guide/scaling-up/state-management.html)、[Provide/Inject](https://cn.vuejs.org/guide/components/provide-inject.html)与 [Pinia](https://pinia.vuejs.org/zh/introduction.html)。

**学习目标**：为状态选对"住址"：局部 ref、跨层 provide/inject、全局 Pinia，三档不混用。

## 状态住址的三档决策

和 [ArkTS 第 4 章](/posts/arkts-dev/04-state-v1.md)同一张决策表：

| 状态 | 住址 | 典型 |
| --- | --- | --- |
| 单组件自用 | 组件内 `ref/computed` | 输入草稿、开关 |
| 跨层共享（祖先 → 后代） | `provide/inject` | 主题、当前用户 |
| 全应用共享（任意读写） | Pinia store | 登录态、购物车、配置 |

判断口诀：**先让状态住得尽量"低"**——能留在组件内就不上提，能 provide 就不进 Pinia。状态的"住址"越高，理解成本与耦合面越大。

## provide / inject：跨层直通车

```vue
<!-- 祖先：提供 -->
<script setup>
import { provide, ref } from 'vue'

const theme = ref('light')
provide('theme', {
  value: theme,                                  // 提供响应式引用
  toggle: () => { theme.value = theme.value === 'light' ? 'dark' : 'light' },
})
</script>

<!-- 任意深度的后代：注入 -->
<script setup>
import { inject } from 'vue'

const { value: theme, toggle } = inject('theme')
</script>
<template>
  <button @click="toggle">{{ theme }}</button>
</template>
```

两个纪律：**provide 响应式状态时传引用**（直接传 `theme.value` 就传了个快照，后代永远看不到变化）；**注入键用 Symbol 或统一常量**（字符串键在大型应用里易撞名）。中间层组件完全无感——这是它与逐层 props 的本质区别。

这正是"依赖注入"的三次相逢：[ArkTS 的 @Provide/@Consume](/posts/arkts-dev/04-state-v1.md)、[DSH 插件的服务](/posts/dsh-plugin-dev/03-services.md)（名字注册、按需注入、PENDING 等依赖）、Vue 的 provide/inject——同一设计模式的三种方言。

## Pinia：全应用的状态仓库

跨页面、跨任意组件树的状态（登录态、购物车）进 Pinia——官方状态库，基于响应式系统的"直用派"：

```ts
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ name: string } | null>(null)
  const isLoggedIn = computed(() => user.value !== null)

  async function login(name: string) {
    user.value = { name }        // 真实场景：await api.login()
  }
  function logout() { user.value = null }

  return { user, isLoggedIn, login, logout }
})
```

```vue
<script setup>
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<template>
  <p v-if="auth.isLoggedIn">{{ auth.user.name }}</p>
  <button v-else @click="auth.login('Oxlyn')">登录</button>
</template>
```

注意写法：**组合式风格定义 store**（和组件的 `<script setup>` 同款词汇），store 里的 ref 就是状态、computed 就是 getter、函数就是 action——**没有新概念，只有作用域的放大**。跨 store 复用逻辑用第 8 章的组合式函数。

## 该不该全局？一个过滤器

把状态塞进 Pinia 前过三个问题：**两个以上不相邻的组件需要它吗？需要跨路由存活吗？有异步副作用要集中管理吗？** 三问全"否"，就地 ref——全局仓库是垃圾桶还是工具箱，取决于入桶纪律。

## 踩坑提示

- Pinia store 在组件外使用（如路由守卫、工具函数）需要先 `setActivePinia` 或在调用点拿——组件外用 store 的姿势文档有专节。
- provide 传的是快照（忘了传 ref 引用）——后代界面不更新，查"传的是盒子还是值"（[第 2 章](/posts/vue-core/02-reactivity.md)的双面性再现）。
- store 里存派生值（该用 getter 的存了 ref）——两处状态迟早漂移，computed 一统天下。

## 练习

1. 用 provide/inject 实现暗色主题切换（对照[本站 CSS 变量方案](/posts/tailwind-css/05-dark-mode.md)，前后端各做一次）。
2. 建 Pinia 购物车 store：add/remove/total，两个不相邻页面共享。
3. 复现"provide 传快照"bug，修成传引用。
