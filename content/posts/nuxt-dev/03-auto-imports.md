---
title: "Nuxt 全栈入门 · 第 3 章：自动导入"
description: "composables/utils 免导入、components 目录自动注册、显式导入的取舍、shared/ 共享目录。"
publishDate: 2026-11-01T09:00:00
tags: ["nuxt", "vue", "教程"]
---

> 本文对应官方文档[《Auto-imports》](https://nuxt.com/docs/4.x/guide/concepts/auto-imports)。

**学习目标**：理解自动导入的覆盖范围与实现原理，掌握"哪些东西不用写 import"，学会用 shared/ 目录组织跨端代码。

`useRoute()`、`useFetch()`、`navigateTo()`……前两章代码里它们都没写 import——这不是省略，是 Nuxt 的**自动导入**机制：约定目录里的导出与框架内置 API，编译时按需注入，写在哪都能用。

## 三层自动导入

| 层 | 来源 | 例子 |
| --- | --- | --- |
| 框架 API | Vue 与 Nuxt 内置 | `ref` `computed` `useRoute` `useFetch` `useState` `navigateTo` |
| 自定义函数 | `app/composables/`、`app/utils/` | 你的组合式函数、纯工具函数 |
| 组件 | `app/components/` | 文件名即标签名，`NoteCard.vue` → `<NoteCard>` |

自定义层的规则一目了然：

```text
app/composables/useNoteFilter.ts   →  useNoteFilter()   任意组件直接调用
app/utils/formatDate.ts            →  formatDate()      任意组件直接调用
app/components/note/NoteCard.vue   →  <NoteCard>        按目录加前缀避免重名
```

组件的标签名默认带**目录路径前缀**（`components/note/NoteCard.vue` → `<NoteCard>`，同名冲突时前缀变长），所以推荐"目录即命名空间"的组织法。

## 它是怎么做到的

自动导入不是全局变量——编译器扫描代码里的标识符，**只把用到的那个注入成 import 语句**。结果：代码里零 import 但产物按需打包、类型提示完整、DevTools 的 Imports 面板能看到全部可导入项。理解了这一点就不会担心"树摇不掉"这类玄学。

## 显式导入的取舍

团队里想写明 import 也完全支持，路径从 `#imports` 或直接从文件取：

```ts
import { useFetch, useState } from '#imports'
import { useNoteFilter } from '~/composables/useNoteFilter'
```

取舍建议：**框架 API 与自己的 composables 交给自动导入**（它们是"环境"的一部分），**utils 里重名风险高的工具显式导入**——可读性与确定性平衡即可，两条路线混用没有任何问题。

## shared/：前后端的中间地带

Nuxt 4 把"浏览器和服务端都要用"的代码正式收编进 **`shared/` 目录**（自动导入同样生效）：

```ts
// shared/utils/noteSchema.ts —— 校验规则、类型、常量
export const MAX_NOTE_LENGTH = 500
export function isNoteText(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= MAX_NOTE_LENGTH
}
```

组件里校验输入、`server/api` 里校验请求体，用的是**同一份代码**。注意边界：shared 里只能写无副作用、不依赖运行环境的代码——碰 `process` 或 DOM 的东西不属于这里。

## 踩坑提示

- 新建 `composables/` 文件后函数找不到——开发服务器缓存了导入清单，重启 `nuxt dev`；
- 两个 `index.ts` 导出同名函数——自动导入报冲突，重命名或改用显式导入；
- 在 `server/` 里 import `app/` 的代码——方向反了，服务端要用共享代码请放 `shared/`；
- 组件标签大小写和文件名对不上——`noteCard.vue` 期望 `<note-card>`，文件命名跟着 PascalCase 走最省心。

## 练习

1. 写 `composables/useNoteFilter.ts`（关键词过滤函数），在列表页直接调用（不写 import），用 DevTools Imports 面板找到它。
2. 建 `components/note/NoteCard.vue`，在页面里用 `<NoteCard>` 渲染占位数据。
3. 把"笔记文本上限"的常量与校验函数放进 `shared/`，让页面和第 5 章的接口共用（先占位，第 5 章兑现）。
