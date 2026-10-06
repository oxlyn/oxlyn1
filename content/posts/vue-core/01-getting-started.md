---
title: "Vue 核心入门 · 第 1 章：初识 Vue"
description: "单文件组件的结构、script setup 语法、声明式渲染的第一课。"
publishDate: 2026-08-13T09:00:00
tags: ["vue", "教程"]
---

> 本文对应官方文档[快速上手](https://cn.vuejs.org/guide/quick-start.html)与[单文件组件](https://cn.vuejs.org/guide/scaling-up/sfc.html)。

**学习目标**：跑起第一个 Vue 项目，读懂 SFC 三段结构，理解"声明式渲染"在 Vue 里的落点。

## 单文件组件：一个文件三段式

Vue 的代码组织单位是 **SFC**（Single-File Component，`.vue` 文件）——模板、逻辑、样式同居一室：

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <button @click="count++">点了 {{ count }} 次</button>
</template>

<style scoped>
button { padding: 0.5rem 1rem; }
</style>
```

`<script setup>` 是组合式 API 的编译糖：顶层变量**自动暴露给模板**，不用写 return。`scoped` 让样式只作用于本组件（编译期加属性哈希，[CSS 第 2 章](/posts/css-core/02-selectors-cascade.md)的 scoped 特异性在这里出现）。

## 声明式渲染：第三次相遇

```vue
<template>
  <p>{{ message }}</p>          <!-- 插值：{{ }} 里是 JS 表达式 -->
  <input :value="message" @input="message = $event.target.value" />
</template>
```

改 `message`，`<p>` 自动更新——与 [ArkUI](/posts/arkts-dev/03-declarative-ui.md) 的"改 @State"和 [Astro](/posts/astro-theme-dev/02-components-props.md) 的组件组合是同一哲学：**UI 是状态的函数**。区别在时机：Astro 构建时渲染成静态 HTML（零运行时），Vue 在浏览器里持续响应——前者快在首屏，后者活在水合之后。

## 组合式 API：一切从 setup 开始

Vue 3 的组合式 API 把组件逻辑组织成**函数调用**（`ref`、`computed`、`onMounted`……），在 `<script setup>` 的顶层逐条声明。对比 Options API（data/methods 的老写法）：同一功能的代码不再按"选项"分散四处，而是**按功能聚拢**——计数逻辑、请求逻辑各自成块，第 8 章还能整体抽出去复用。

## 第一个完整组件

```vue
<script setup>
import { ref } from 'vue'

const draft = ref('')
const items = ref(['买牛奶', '写周报'])

function add() {
  if (draft.value.trim() === '') return
  items.value.push(draft.value)
  draft.value = ''
}
</script>

<template>
  <form @submit.prevent="add">
    <input v-model="draft" placeholder="新事项" />
    <button>添加</button>
  </form>
  <ul>
    <li v-for="item in items" :key="item">{{ item }}</li>
  </ul>
</template>
```

几个新面孔都是后几章的主角：`ref`（第 2 章）、`v-model`（第 6 章）、`v-for` 与 `:key`（第 3 章）、`@submit.prevent`（事件修饰符，第 3 章）。注意 `ref` 的值在脚本里要 `.value`、在模板里不用——第 2 章解释这个"双面性"。

## 踩坑提示

- 模板里只能用**顶层绑定**：`<script setup>` 里嵌套函数作用域的变量模板看不到。
- SFC 文件名用大驼峰（`TodoList.vue`），组件在模板里也用它——官方风格约定。
- `<template>` 里根元素可以多个（Vue 3 起不再强制单根），但属性继承（如 class）在多根时需要显式声明。

## 练习

1. 用脚手架建项目，把 TodoList 组件接入首页跑通。
2. 在官方 [Play 游乐场](https://play.vuejs.org/)里改 `message`，观察插值即时更新。
3. 给 TodoList 加"已完成划线"样式，体会 scoped 样式的作用域。
