---
title: "Vue 核心入门 · 第 4 章：组件与插槽"
description: "defineProps 与单向数据流、defineEmits 事件契约、插槽的默认/具名/作用域三形态。"
publishDate: 2026-08-16T09:00:00
tags: ["vue", "教程"]
---

> 本文对应官方文档[组件基础](https://cn.vuejs.org/guide/essentials/component-basics.html)、[Props](https://cn.vuejs.org/guide/components/props.html)与[插槽](https://cn.vuejs.org/guide/components/slots.html)。

**学习目标**：设计组件的对外接口（props 进、事件出、插槽开放），理解单向数据流的纪律。

## props：组件的入参

`defineProps` 是 `<script setup>` 的编译宏（不用 import），声明组件接受哪些数据：

```vue
<!-- PostCard.vue -->
<script setup>
defineProps({
  title: { type: String, required: true },
  tags: { type: Array as PropType<string[]>, default: () => [] },
  pinned: Boolean,
})
</script>

<template>
  <article>
    <h3>{{ title }}<span v-if="pinned">📌</span></h3>
    <p>{{ tags.join(' / ') }}</p>
  </article>
</template>

<!-- 使用方 -->
<PostCard title="Vue 入门" :tags="['vue', '教程']" pinned />
```

两条铁律：**props 单向数据流**——父传子、子不可改（改了会警告，语义上是"偷改别人的数据"）；子组件想影响父，走事件。对象/数组的默认值用工厂函数（`default: () => []`）——共享引用是万恶之源。

对比 [Astro 主题的 Props 接口](/posts/astro-theme-dev/02-components-props.md)：Astro 的 props 是构建期数据（纯 HTML 输出），Vue 的 props 是**活的数据**——父组件更新后子组件响应式刷新。这是"静态组件"与"交互组件"的本质分野（第 10 章在 Astro 岛屿里统一两者）。

## emits：组件的出参

`defineEmits` 声明事件契约，`$emit` 触发：

```vue
<script setup>
const emit = defineEmits(['remove', 'toggle'])
function onRemove() {
  emit('remove', props.id)          // 事件名 + 载荷
}
</script>

<template>
  <button @click="onRemove">删除</button>
  <input @change="$emit('toggle', !checked)" />
</template>

<!-- 使用方：v-on 监听 -->
<PostItem @remove="onRemove" @toggle="onToggle" />
```

数据流从此闭环：**props 向下、事件向上**。所有"子组件直接改 props"的冲动都翻译成"emit 事件让父改"——这条纪律与 [React 单向流](/posts/arkts-dev/07-state-deep-and-v2.md)（V2 的 @Param+@Event）、[ArkUI 的显式事件](/posts/arkts-dev/07-state-deep-and-v2.md)殊途同归：双向都显式化，数据才可追踪。

`v-model` 是这对机制的语法糖（props + emit 合体）——第 6 章拆解它。

## 插槽：内容分发的三个形态

props 传**数据**，插槽传**内容**：

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <header><slot name="header">默认标题</slot></header>   <!-- 具名 + 回退 -->
    <main><slot /></main>                                  <!-- 默认插槽 -->
    <footer><slot name="footer" :time="savedAt" /></footer> <!-- 作用域插槽带数据出 -->
  </div>
</template>

<!-- 使用方 -->
<Card>
  <template #header><h3>自定义标题</h3></template>
  <p>正文内容……</p>
  <template #footer="{ time }">保存于 {{ time }}</template>
</Card>
```

三形态分层记忆：**默认插槽**（塞正文）、**具名插槽**（多注入口，`#name`）、**作用域插槽**（子组件把内部数据交给插槽内容渲染——列表组件的"行渲染交给调用方"全靠它）。与 [Astro 的 slot](/posts/astro-theme-dev/03-layouts-slots.md) 对照：默认/具名/回退完全同构，作用域插槽是 Vue 多出的交互态能力。

## 组件的组织习惯

- **按职责拆**：容器组件（管状态与请求）+ 展示组件（纯 props/emit）——[主题系列第 1 章](/posts/astro-theme-dev/01-theme-skeleton.md)的分层思想同样适用；
- 组件引用进 `<script setup>` 即可在模板使用（PascalCase 标签）；
- 多根模板时用 `useAttrs` 或显式 `inheritAttrs: false` 处理透传——报"Extraneous non-props attributes"就查这里。

## 踩坑提示

- props 对象/数组在子组件里"就地修改"不报警告但违反单向流——复杂数据改动 emit 出去或用 [Pinia](/posts/vue-core/07-provide-inject-pinia.md)。
- 事件名用 camelCase 声明、模板里 kebab-case 监听（`@remove-item`）——Vue 自动匹配，但写混了排查半小时。
- 插槽内容运行在**父组件作用域**（能访问父的数据），只有作用域插槽能拿子的数据——"插槽里访问不到子的变量"是理解错位。

## 练习

1. 把 TodoList 拆成 TodoList（容器）+ TodoItem（展示）两个组件，props/emit 全连。
2. 给 TodoItem 加作用域插槽：行的"操作区"由使用方渲染。
3. 故意在子组件里改 props 对象属性，读一遍控制台警告的措辞。
