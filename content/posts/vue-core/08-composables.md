---
title: "Vue 核心入门 · 第 8 章：组合式函数"
description: "把响应式逻辑抽成可复用的 composable：约定、模式与三个实战例子。"
publishDate: 2026-08-20T09:00:00
tags: ["vue", "教程"]
---

> 本文对应官方文档[组合式函数](https://cn.vuejs.org/guide/reusability/composables.html)。

**学习目标**：把"一段带响应式状态的逻辑"抽成函数复用，掌握命名与返回约定，看清与 React Hooks 的异同。

## 组合式函数是什么

组合式函数（composable）= **使用组合式 API 的函数**，名字以 `use` 开头，封装"有状态的逻辑"供多个组件复用：

```ts
// composables/useMouse.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(e: MouseEvent) {
    x.value = e.pageX
    y.value = e.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}
```

```vue
<script setup>
import { useMouse } from '@/composables/useMouse'
const { x, y } = useMouse()      // 每个调用者拿到独立的状态实例
</script>

<template>鼠标：{{ x }}, {{ y }}</template>
```

它的本质是 [JS 闭包](/posts/javascript-core/03-functions-and-closures.md)的工程化：函数闭住一份响应式状态与生命周期钩子，调用一次实例化一份。**生命周期钩子写在 composable 里完全合法**——它会自动绑定到调用它的组件实例上，"注册/注销成对"就地完成（[第 5 章](/posts/vue-core/05-lifecycle-watchers.md)的纪律内建于函数）。

## 三个高频套路

**1. 包装浏览器 API**（上面的 useMouse，同款还有 useLocalStorage、useIntersectionObserver）。

**2. 包装异步请求**：

```ts
export function useFetch<T>(url: () => string) {
  const data = ref<T | null>(null)
  const error = ref('')
  const loading = ref(false)

  async function run() {
    loading.value = true
    error.value = ''
    try { data.value = await request<T>(url()) }
    catch (e) { error.value = (e as Error).message }
    finally { loading.value = false }
  }

  watch(url, run, { immediate: true })
  return { data, error, loading, reload: run }
}
```

调用方拿到 `{ data, error, loading }` 三态——[ArkTS 第 4 章](/posts/harmonyos-app-dev/04-data-layer.md)判别联合三态的 Vue 拼写。URL 是 getter 形式（响应式），地址变了自动重拉。

**3. 状态机/复杂联动**：表单分步、拖拽——逻辑聚在一个函数里，组件只剩模板。

## 约定与边界

- **入参支持 ref**：`useXxx(maybeRef)` 里用 `toValue()` 统一取值——"接受 ref 或普通值"是生态通用礼仪；
- **返回 ref 而非 reactive**（调用方有解构自由）；需要解构 reactive 时配 `toRefs()`；
- **副作用收进函数**：composable 内部完成注册/注销，调用方零清理负担；
- **无响应式逻辑不配 composable**：纯工具函数（格式化日期）放 `utils/`，别套 use 头衔。

与 React 自定义 Hook 对照：形态几乎一致（都是闭包 + 生命周期/副作用 API），最大差异在**运行时**——React 每次渲染重跑 hook 函数（依赖数组控制重置），Vue 的 setup 只跑一次（响应式由 ref 的订阅接手）。所以 Vue composable 没有"依赖数组拼错"这个经典坑，React 的 [`useEffect` 心智](/posts/vue-core/05-lifecycle-watchers.md)对应物是 `watch` 的显式源。

## 踩坑提示

- composable 在组件外调用（工具函数里）会丢组件实例绑定（生命周期钩子警告）——它属于"组件 setup 上下文"。
- 在 composable 里用了全局单例状态又想"每实例独立"——先想清楚状态住址（[第 7 章](/posts/vue-core/07-provide-inject-pinia.md)）。
- 返回 reactive 对象被解构丢响应——返回 ref 组成的普通对象最稳。

## 练习

1. 写 useLocalStorage<T>(key, initial)：读写自动持久化（[ArkTS 第 2 章](/posts/harmonyos-app-dev/02-preferences-files.md)Preferences 的 Web 版）。
2. 写 useDebounceRef(source, ms)：返回防抖后的响应式副本。
3. 用 useFetch 重构第 5 章的搜索页，对比组件内代码行数。
