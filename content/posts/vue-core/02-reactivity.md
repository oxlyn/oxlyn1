---
title: "Vue 核心入门 · 第 2 章：响应式系统"
description: "ref 的双面性、reactive 的边界、computed 派生状态——Vue 自动化的引擎室。"
publishDate: 2026-08-14T09:00:00
tags: ["vue", "教程"]
---

> 本文对应官方文档[响应式基础](https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html)与[计算属性](https://cn.vuejs.org/guide/essentials/computed.html)。

**学习目标**：理解 ref 为什么需要 .value，掌握响应式对象的适用边界，学会用 computed 表达派生状态。

## ref：一个带 .value 的盒子

JS 本身没有"监听赋值"的能力，Vue 的办法是把值**包进盒子**——`ref` 返回一个带 getter/setter 的对象，读写都走 `.value`，框架借此追踪依赖、触发更新：

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
count.value++          // 脚本里读写都要 .value
</script>

<template>
  <span>{{ count }}</span>   <!-- 模板里自动解包，不用 .value -->
</template>
```

`.value` 的双面性是 Vue 新手第一坑：模板里忘了不用（编译器解包）、脚本里忘了要用（拿到的是盒子不是值）。两条纪律：**脚本读写一律过脑检查 .value**；解构会丢响应性（`const { value } = someRef` 之后两者断联），保持整盒引用。

## reactive：对象的原生代理

`reactive` 用 Proxy 把**整个对象**变成响应式，属性访问不需要 .value：

```vue
<script setup>
import { reactive } from 'vue'

const user = reactive({ name: 'Oxlyn', level: 1 })
user.level = 2          // 直接改属性即可，自动触发更新
</script>
```

但它有两条硬边界：**不能整体替换**（`user = {...}` 会切断代理与模板的关联——响应式丢失且不报错）、**解构丢响应**（解构出来的是普通值）。所以官方推荐：**默认用 ref**，reactive 只在"一组字段聚合成整体"且不会整体替换的场景用。深层的数组 push、属性修改都自动响应——与 [ArkTS @State 只观察第一层](/posts/arkts-dev/04-state-v1.md)相比，Vue 的观察是深度全量的，少了一类坑。

## computed：派生状态的正解

凡是能从现有状态**算出来**的值，一律用 computed——它带缓存（依赖不变不重算）且自动追踪依赖：

```vue
<script setup>
import { ref, computed } from 'vue'

const items = ref(['a', 'b', 'c'])
const done = ref(new Set())

const remaining = computed(() => items.value.length - done.value.size)
const allDone = computed(() => remaining.value === 0)
</script>

<template>
  <p v-if="allDone">全部完成 🎉</p>
  <p v-else>还剩 {{ remaining }} 件</p>
</template>
```

对比两个反面写法：**函数调用**（`{{ remaining() }}`）没有缓存、每次渲染都执行；**手动同步**（watch 里把结果赋给另一个 ref）产生"状态冗余"，迟早不同步。computed 的定位：**它是状态的派生视图，不是第二个数据源**——这和 [ArkTS 第 7 章](/posts/arkts-dev/07-state-deep-and-v2.md)的 @Computed、React 的 useMemo 是同一个思想的三种拼写。

computed 也可以**可写**（传入 get/set），`v-model` 一个派生状态时有用（第 6 章衔接）。

## 响应式的边界

三类"框架看不见"的修改要警惕：

- 解构 props/reactive（丢响应）——用 `toRefs()` 或保持原引用；
- 非响应式数据源（普通变量、闭包里的旧值——[JS 第 3 章](/posts/javascript-core/03-functions-and-closures.md)的闭包捕获在响应式里的翻版）；
- `setTimeout` 等异步回调里持有旧值——回调里读 ref 永远读 `.value` 的当下值，不算旧值陷阱，但回调里缓存的"盒子引用"要看清。

## 踩坑提示

- `ref` 包对象同样是深度响应的（内部自动转 reactive），选 ref 不吃亏。
- 在模板里调用"改变状态的函数"没问题，但在 computed 里改状态是大忌——computed 必须纯（无副作用），否则依赖追踪混乱。
- `console.log(someRef)` 打印的是盒子——想看值打 `someRef.value` 或用 `toRaw` 调试。

## 练习

1. 写一个购物车：`items` ref 数组 + computed 总价/件数，界面三处联动。
2. 复现"reactive 整体替换丢响应"，再改用 ref 修复。
3. 把一个 watch + 手动赋值的写法重构成 computed，对比代码量。
