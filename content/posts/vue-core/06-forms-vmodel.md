---
title: "Vue 核心入门 · 第 6 章：表单与 v-model"
description: "v-model 双向绑定的编译原理、原生表单的修饰符、组件上的自定义 v-model。"
publishDate: 2026-08-18T09:00:00
tags: ["vue", "教程"]
---

> 本文对应官方文档[表单输入绑定](https://cn.vuejs.org/guide/essentials/forms.html)。

**学习目标**：理解 v-model 的糖衣内核，掌握表单修饰符，给组件设计自己的 v-model。

## v-model：语法糖的拆解

```vue
<input v-model="keyword" />
```

这行等价于：

```vue
<input :value="keyword" @input="keyword = $event.target.value" />
```

**属性绑定 + 事件回写**的合体——所以它本质上不"魔法"，只是把第 4 章 props/emit 那对机制在最常用的表单场景打包。不同控件的回写事件不同（文本是 `input`、复选是 `change`），框架替你对号入座。

对比两个世界的"双向"：[ArkTS 的 @Link](/posts/arkts-dev/04-state-v1.md) 是框架级引用共享；React 没有 v-model，受控组件要手写 `value + onChange`（[Vue 与 React 的取舍](/posts/vue-core/10-production-integration.md)）；Vue 折中——**双向绑定存在，但拆开看仍是单向流的糖**。

## 表单修饰符

```vue
<template>
  <input v-model.lazy="draft" />      <!-- change 时同步（失焦/回车），不是每个键 -->
  <input v-model.number="age" />      <!-- 自动转 number -->
  <input v-model.trim="name" />       <!-- 去首尾空格 -->
  <textarea v-model="bio" />
  <select v-model="city"><option value="hz">杭州</option></select>
  <input type="checkbox" v-model="agreed" />
  <input type="checkbox" value="a" v-model="picks" />   <!-- 数组收集多选 -->
</template>
```

`.lazy` 是防抖表单的免费替代（[第 5 章](/posts/vue-core/05-lifecycle-watchers.md)手写过防抖——搜索框如果只是"失焦才搜"，lazy 一行搞定）；`.number` 治理"拿到的是字符串"的经典 bug。

## 组件上的 v-model

v-model 不只属于原生控件——**自定义组件也能接**，规范是"modelValue prop + update:modelValue 事件"：

```vue
<!-- RateStars.vue：星级评分组件 -->
<script setup>
const props = defineProps<{ modelValue: number }>()
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <button v-for="i in 5" :key="i"
          @click="emit('update:modelValue', i)"
          :class="{ active: i <= modelValue }">★</button>
</template>

<!-- 使用方：像原生控件一样双向 -->
<RateStars v-model="score" />
```

看得穿糖衣后就没有秘密：`v-model="score"` ≈ `:modelValue="score"` + `@update:modelValue="score = $event"`。Vue 3.4+ 还提供 `defineModel()` 宏把样板再压一行：

```vue
<script setup>
const model = defineModel<number>()
</script>
<template>
  <button @click="model = Math.min((model ?? 0) + 1, 5)">★ {{ model }}</button>
</template>
```

多 v-model 用参数区分（`v-model:title="t" v-model:page="p"`）——一个组件多个双向通道时用。

## 一个完整表单

```vue
<script setup>
import { reactive, computed } from 'vue'

const form = reactive({ name: '', email: '', agreed: false })
const valid = computed(() =>
  form.name.trim() !== '' && /.+@.+\..+/.test(form.email) && form.agreed)
</script>

<template>
  <form @submit.prevent="submit">
    <input v-model.trim="form.name" placeholder="昵称" />
    <input v-model.lazy="form.email" placeholder="邮箱" />
    <label><input type="checkbox" v-model="form.agreed" /> 同意条款</label>
    <button :disabled="!valid">提交</button>
  </form>
</template>
```

派生校验用 computed（[第 2 章](/posts/vue-core/02-reactivity.md)），提交拦截用 `@submit.prevent`（[第 3 章](/posts/vue-core/03-template-syntax.md)）——表单工程 = 前几章的组装。

## 踩坑提示

- v-model 绑 reactive 对象的属性完全合法（`v-model="form.name"`）——绑"整体替换 reactive"才是坑（[第 2 章](/posts/vue-core/02-reactivity.md)）。
- 组件 v-model 忘了 emit `update:modelValue`，父状态永远不变——写自定义控件先查事件名。
- checkbox 的 true/false 与 value 数组两种语义靠绑定的变量类型区分（布尔 vs 数组），类型写对才生效。

## 练习

1. 把第 1 章的 TodoList 输入框改造成 TodoInput 组件，用 defineModel 双向。
2. 实现一个评分组件（defineModel），在表单里与 computed 校验联动。
3. 用 .lazy 对比输入实时同步与失焦同步的请求次数差异。
