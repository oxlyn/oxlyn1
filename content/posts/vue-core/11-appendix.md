---
title: "Vue 核心入门 · 附录：API 速查与资源"
description: "Vue 高频 API 一页速查：响应式、指令、生命周期、组合式函数，附资源与站内对照。"
publishDate: 2026-08-23T09:00:00
tags: ["vue", "教程"]
---

## 响应式 API（第 2 章）

```ts
const count = ref(0)                    // 盒子：脚本 .value，模板自动解包
const user = reactive({ name: '' })     // 对象代理：不可整体替换
const total = computed(() => ...)       // 派生 + 缓存，必须纯
const r = toRefs(obj)                   // reactive 解构保响应
const v = toValue(maybeRef)             // ref/普通值统一取值
```

## 模板指令（第 3 章）

```
{{ expr }}                    插值
:attr="x"  @event="fn"        绑定属性 / 事件（v-bind / v-on）
v-if / v-else-if / v-else      真增删（低频切换）
v-show                        display 切换（高频切换）
v-for="(item, i) in list" :key="item.id"   稳定唯一 id，别用 index
v-model="x"                   双向绑定（.lazy/.number/.trim）
@click.prevent.stop.enter     事件修饰符链
:class="{ done: flag }"       条件类名
```

## 组件与插槽（第 4、6 章）

```ts
defineProps<{ title: string; tags?: string[] }>()   // 编译宏，勿 import
const emit = defineEmits(['remove', 'update:modelValue'])
const model = defineModel<number>()                  // v-model 3.4+
```

```vue
<slot name="head">回退</slot>       <!-- 默认/具名/回退 -->
<slot :row="row" />                  <!-- 作用域插槽 -->
<template #head="{ row }">…</template>
```

## 生命周期与侦听（第 5 章）

```ts
onMounted(() => {})        // DOM 就绪：取数/注册（配 onUnmounted 成对注销）
onUnmounted(() => {})
watch(src, (nv, ov) => {}, { immediate: true, deep: false, flush: 'post' })
watchEffect(() => {})      // 自动追踪，立即执行
watch([a, b], ([na, nb]) => {})
```

## 状态与复用（第 7、8 章）

```ts
provide('key', { value: themeRef, toggle })   // 传响应式引用，非快照
const injected = inject('key')
defineStore('cart', () => { const items = ref([]); return { items } })   // Pinia
export function useMouse() { /* use 开头，返回 ref 集合，副作用内闭环 */ }
defineAsyncComponent(() => import('./Heavy.vue'))   // 按需水合/加载
```

## 十章一图

| 主线 | 章节 | 一句话 |
| --- | --- | --- |
| 核心 | [1](/posts/vue-core/01-getting-started/) [2](/posts/vue-core/02-reactivity/) [3](/posts/vue-core/03-template-syntax/) | SFC 三段式；ref 是盒子；指令是语法糖 |
| 组件 | [4](/posts/vue-core/04-components-props.md) [5](/posts/vue-core/05-lifecycle-watchers.md) [6](/posts/vue-core/06-forms-vmodel.md) | props 进、事件出、插槽开放 |
| 进阶 | [7](/posts/vue-core/07-provide-inject-pinia.md) [8](/posts/vue-core/08-composables.md) | 状态按需上提，逻辑按 use 复用 |
| 落地 | [9](/posts/vue-core/09-ssr-nuxt.md) [10](/posts/vue-core/10-production-integration.md) | 渲染模式跟交互密度走，岛屿接进 Astro |

## 资源

- [Vue 官方中文文档](https://cn.vuejs.org/guide/introduction)——本系列依据（官方维护中文版）
- [Vue 交互式教程](https://cn.vuejs.org/tutorial/)——浏览器里逐步上手
- [Play 游乐场](https://play.vuejs.org/)——在线实验
- [Pinia 文档](https://pinia.vuejs.org/zh/) · [Nuxt 文档](https://nuxt.com.cn/) · [Vue Router](https://router.vuejs.org/zh/)

## 站内对照索引

- 声明式三部曲：[ArkUI](/posts/arkts-dev/03-declarative-ui/) · [Astro 组件](/posts/astro-theme-dev/02-components-props.md) · 本系列
- 状态注入三部曲：[ArkTS @Provide/@Consume](/posts/arkts-dev/04-state-v1.md) · [DSH 服务注入](/posts/dsh-plugin-dev/03-services.md) · 本系列 provide/inject
- 前置：[《JavaScript 核心入门》](/posts/javascript-core/)（闭包 ↔ 组合式函数）· [《CSS 核心入门》](/posts/css-core/)（scoped ↔ 层叠）
