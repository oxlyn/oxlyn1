---
title: "Vue 核心入门 · 第 5 章：生命周期与侦听器"
description: "onMounted 全家桶的时机表、watch 的四种用法、watchEffect 与清理纪律。"
publishDate: 2026-08-17T09:00:00
tags: ["vue", "教程"]
---

> 本文对应官方文档[生命周期](https://cn.vuejs.org/guide/essentials/lifecycle.html)与[侦听器](https://cn.vuejs.org/guide/essentials/watchers.html)。

**学习目标**：把生命周期钩子挂在正确的时机上，掌握 watch 的深浅与 immediate，理解 watchEffect 的自动追踪。

## 生命周期：时机表

组合式 API 的生命周期钩子按组件阶段注册，最常用的四个：

```vue
<script setup>
import { onMounted, onUnmounted, onUpdated } from 'vue'

onMounted(() => {
  /* DOM 已挂载：取数、测量、注册全局监听 */
})
onUnmounted(() => {
  /* 销毁前：注销监听、清定时器 */
})
</script>
```

时机表（按序）：`setup`（= script setup 本体）→ `onBeforeMount` → `onMounted` → 更新循环（`onBeforeUpdate`/`onUpdated`）→ `onBeforeUnmount` → `onUnmounted`。SSR 下只有 setup 会执行（[第 9 章](/posts/vue-core/09-ssr-nuxt.md)的伏笔：onMounted 里不放"服务端也要做的事"）。

纪律与 [ArkTS 生命周期](/posts/arkts-dev/06-lifecycle-routing.md)、[JS effect](/posts/javascript-core/02-lifecycle-and-effects.md)完全同款：**注册与注销成对出现**。onMounted 里 `addEventListener` / `setInterval`，onUnmounted 里必须反向回收。

## watch：精确监视一个源

```vue
<script setup>
import { ref, watch } from 'vue'

const keyword = ref('')
const stop = watch(keyword, async (newVal, oldVal) => {
  await search(newVal)
})

// 稍后手动停止（组件卸载时自动停，但循环外的 watcher 要显式管理）
</script>
```

关键选项：

- `immediate: true`——注册即执行一次回调（初值也要处理的场景）；
- `deep: true`——深观察对象内部变化（有性能成本，能拆字段就拆）；
- `flush: 'post'`——DOM 更新后再执行（回调里要读 DOM 时）；
- **监视响应式对象的属性**要写成 getter：`watch(() => user.name, ...)`——直接传对象只能看整体替换。

多个源用数组：`watch([a, b], ([na, nb]) => ...)`。

## watchEffect：自动追踪的即时执行

`watchEffect` 不指定源——回调里**用到谁就追踪谁**，且注册立即执行一次：

```vue
<script setup>
import { watchEffect, ref } from 'vue'

const page = ref(1), size = ref(10)
watchEffect(() => {
  fetchList(page.value, size.value)   // page/size 任一变化自动重跑
})
</script>
```

选型口诀：**"一个源变了做一件事"用 watch**（依赖显式、旧值可得）；**"这几个值组合出效果"用 watchEffect**（自动追踪、天然 immediate）。代价是 watchEffect 的依赖藏在函数体里，读代码要自己找——复杂副作用还是 watch 显式声明更可审计。

## 清理与防抖的完整例子

```vue
<script setup>
import { ref, watch, onUnmounted } from 'vue'

const keyword = ref('')
let timer: ReturnType<typeof setTimeout>

watch(keyword, (val) => {
  clearTimeout(timer)
  timer = setTimeout(() => search(val), 300)     // 防抖（JS 第 10 章同款）
})

onUnmounted(() => clearTimeout(timer))            // 收尾
</script>
```

watch 回调的第三参数 `onCleanup` 也能挂清理——竞态请求（旧响应覆盖新响应）用它取消：这正是 [ArkTS 第 9 章](/posts/arkts-dev/09-concurrency.md)TaskPool 取消、通用"请求竞态"问题的 Vue 解法。

## 踩坑提示

- watch 一个 reactive 对象默认是浅的，属性变化不触发——用 getter 或 deep。
- 在 onMounted 里同步读子组件 DOM，可能子还没挂——用模板引用 + flush: 'post' 的 watchEffect。
- watchEffect 无限循环：回调里改了自己追踪的状态（和 [ArkTS @Watch](/posts/arkts-dev/04-state-v1.md) 的循环警告同源）。

## 练习

1. 实现搜索框：watch + 防抖 + onCleanup 取消竞态，对比无防抖的请求次数。
2. 用 watchEffect 做分页联动（page/size 变化自动拉列表），翻页验证只请求一次。
3. 故意在 onMounted 注册 interval 不注销，路由切走再回来看重复执行。
