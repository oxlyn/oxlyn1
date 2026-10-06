---
title: "Vue 核心入门 · 第 3 章：模板语法与指令"
description: "插值与指令家族：v-if/v-show 之辨、v-for 与 key、事件修饰符、class 与 style 绑定。"
publishDate: 2026-08-15T09:00:00
tags: ["vue", "教程"]
---

> 本文对应官方文档[模板语法](https://cn.vuejs.org/guide/essentials/template-syntax.html)、[条件渲染](https://cn.vuejs.org/guide/essentials/conditional.html)与[列表渲染](https://cn.vuejs.org/guide/essentials/list.html)。

**学习目标**：熟练使用指令家族，分清 v-if/v-show，写对 v-for 的 key，掌握 class/style 的绑定语法。

## 插值与绑定：一对核心指令

模板里 `{{ }}` 输出表达式；对外部世界的连接靠两个方向相反的指令：

```vue
<template>
  <img v-bind:src="avatarUrl" :alt="name" />       <!-- v-bind: 绑属性，: 简写 -->
  <button v-on:click="like" @click="like">赞</button>  <!-- v-on: 绑事件，@ 简写 -->
  <a :[attrName]="url">动态参数</a>                  <!-- 方括号：动态指令参数 -->
</template>
```

`:` 与 `@` 的简写占用率九成以上——写熟它们，模板就有了"数据向下、事件向上"的呼吸感。

## 条件渲染：v-if 与 v-show 之辨

```vue
<template>
  <p v-if="score >= 90">优秀</p>
  <p v-else-if="score >= 60">及格</p>
  <p v-else>重修</p>

  <p v-show="showTip" class="text-sm">提示：按 Tab 补全</p>
</template>
```

两者语义相同、机制不同：**v-if 真实地增删 DOM**（惰性，初始为假就不渲染），**v-show 永远渲染、只是切换 display**。选择标准：**切换频繁用 v-show**（无重建成本），**条件很少变/分支重用 v-if**（不渲染就是零成本）。`v-if` 与 `v-for` 不要同时挂在一个元素上（Vue 3 里 v-if 优先级更高，容易写出访问不存在变量的错）。

## 列表渲染与 key

```vue
<template>
  <li v-for="(item, index) in items" :key="item.id">
    {{ index + 1 }}. {{ item.title }}
  </li>

  <li v-for="(value, key) in user" :key="key">{{ key }}: {{ value }}</li>
</template>
```

`:key` 不是可省略的样板：它是 diff 时**节点身份的身份证**（[ArkTS 第 5 章](/posts/arkts-dev/05-render-control.md)的键生成器、React 的 key 同一角色）。规则两条：**用数据里稳定的唯一 id**，**永远不用 index 当 key**（中间插入/删除时，index 错位导致状态错乱——复现一次就再也不敢）。

## 事件与修饰符

```vue
<template>
  <form @submit.prevent="save">          <!-- .prevent = preventDefault -->
    <input @keyup.enter="save" />        <!-- .enter = 按键过滤 -->
    <button @click.stop="cancel">取消</button>  <!-- .stop = 停止冒泡 -->
    <button @click.once="init">只执行一次</button>
  </form>
</template>
```

修饰符把 [DOM 事件处理](/posts/javascript-core/10-dom-and-events.md)的样板（preventDefault、stopPropagation、按键判断）收进语法，模板保持一行一个意图。链式可叠加：`@click.stop.prevent`。

## class 与 style 绑定

```vue
<template>
  <div :class="['card', { done: item.done, highlight: isHot }]" />

  <!-- 对象语法：条件为真输出类名；数组语法混搭静态类 -->
  <span :style="{ color: activeColor, fontSize: size + 'px' }" />
</template>
```

对象语法 `{ done: item.done }` 等价于 Tailwind 项目的 `class:list`（[Astro 主题第 2 章](/posts/astro-theme-dev/02-components-props.md)）——条件类名的两个世界一模一样。

## 踩坑提示

- 模板里写复杂表达式（三元嵌套方法链）——超过一行的逻辑进 computed（[第 2 章](/posts/vue-core/02-reactivity.md)）。
- `v-for` 遍历对象时顺序基于 Object.keys，依赖顺序的业务要改用数组。
- `v-html` 直接渲染用户内容 = XSS（[JS 第 10 章](/posts/javascript-core/10-dom-and-events.md)同款警告），富文本必须过净化。

## 练习

1. 用 v-if/v-else 实现三档评分文案，再用 v-show 实现一个可开关的提示条，对比 DOM。
2. 复现 index 当 key 的错位 bug：列表头部插入一项后，输入框内容串位。
3. 把一个"满屏 @click 里写 if"的模板重构成修饰符 + computed。
