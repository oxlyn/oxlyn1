---
title: "Vue 核心入门：组合式 API 与响应式系统"
description: "Vue 系列教程总览：响应式核心、模板指令、组件通信、组合式函数、SSR 与生产实践的学习路线。"
publishDate: 2026-08-24T09:00:00
tags: ["vue", "教程"]
---

Vue 是渐进式 JavaScript 框架：核心只解决"**状态变，界面自动跟着变**"一件事，路由、状态库、构建工具按需加。它的响应式系统是三大前端框架里最"语言原生"的一个——直接用 JS 的 getter/setter 拦截赋值，这也是理解 Vue 一切魔法的钥匙。

> 内容依据 [Vue 官方中文文档](https://cn.vuejs.org/guide/introduction)（官方维护的中文版）整理，代码示例均为原创（默认 Vue 3.5+ 组合式 API + `<script setup>`），每章附官方文档链接。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：初识 Vue](/posts/vue-core/01-getting-started/) | SFC、setup 语法、声明式渲染 | [快速上手](https://cn.vuejs.org/guide/quick-start.html) |
| [第 2 章：响应式系统](/posts/vue-core/02-reactivity/) | ref/reactive/computed 三件套 | [响应式基础](https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html) |
| [第 3 章：模板语法与指令](/posts/vue-core/03-template-syntax/) | v-if/v-for/v-on/v-bind 家族 | [模板语法](https://cn.vuejs.org/guide/essentials/template-syntax.html) |
| [第 4 章：组件与插槽](/posts/vue-core/04-components-props/) | defineProps/defineEmits、slot | [组件基础](https://cn.vuejs.org/guide/essentials/component-basics.html) |
| [第 5 章：生命周期与侦听器](/posts/vue-core/05-lifecycle-watchers/) | onMounted、watch/watchEffect | [生命周期](https://cn.vuejs.org/guide/essentials/lifecycle.html) |
| [第 6 章：表单与 v-model](/posts/vue-core/06-forms-vmodel/) | 双向绑定的原理与组件化 | [表单输入绑定](https://cn.vuejs.org/guide/essentials/forms.html) |
| [第 7 章：状态共享](/posts/vue-core/07-provide-inject-pinia/) | provide/inject 与 Pinia | [状态管理](https://cn.vuejs.org/guide/scaling-up/state-management.html) |
| [第 8 章：组合式函数](/posts/vue-core/08-composables/) | 复用逻辑的自定义 hook | [组合式函数](https://cn.vuejs.org/guide/reusability/composables.html) |
| [第 9 章：SSR 与 Nuxt](/posts/vue-core/09-ssr-nuxt/) | 服务端渲染的收益与代价 | [服务端渲染](https://cn.vuejs.org/guide/scaling-up/ssr.html) |
| [第 10 章：工程化与集成](/posts/vue-core/10-production-integration/) | 性能要点、Astro 岛屿集成 | [性能优化](https://cn.vuejs.org/guide/best-practices/performance.html) |
| [附录：API 速查](/posts/vue-core/11-appendix/) | 高频 API 一页速查 + 资源 | — |

## 与本站其他系列的关系

- **前置**：[《JavaScript 核心入门》](/posts/javascript-core/)（闭包与异步是响应式的地基）、[《CSS 核心入门》](/posts/css-core/)（样式照常写）；
- **声明式宇宙**：Vue 模板与 [ArkUI 声明式 UI](/posts/arkts-dev/03-declarative-ui/)、[Astro 组件](/posts/astro-theme-dev/02-components-props.md)同构——"UI 是状态的函数"三个世界各讲一遍；
- **响应式对照**：`ref` ↔ [ArkTS 的 @State](/posts/arkts-dev/04-state-v1.md)，`provide/inject` ↔ [ArkTS 同名机制](/posts/arkts-dev/04-state-v1.md)，组合式函数 ↔ [JS 闭包](/posts/javascript-core/03-functions-and-closures.md)的工程化；
- **归宿**：本站用 Astro，[第 10 章](/posts/vue-core/10-production-integration.md)讲 Vue 作为岛屿挂进 Astro 的实战。

## 环境准备

```bash
npm create vue@latest    # 官方脚手架（Vite 驱动，可勾选 TS/Router/Pinia）
npm run dev
```

或[官方 Play | 游乐场](https://play.vuejs.org/)零安装实验。推荐 VS Code + 官方语言扩展（Volar）。

## 遗留问题

- Transition 动画组件、KeepAlive、Teleport、自定义渲染器未展开。
- Options API（老写法）只作对照，不单独成章——新项目一律组合式 API。
