---
title: "React 核心入门 · 第 1 章：组件与 JSX"
description: "组件即函数、JSX 的三条语法规则、props 的只读契约——React 世界观的入口。"
publishDate: 2026-08-01T09:00:00
tags: ["react", "教程"]
---

> 本文对应官方文档[你的第一个组件](https://zh-hans.react.dev/learn/your-first-component)与[用 JSX 书写标记](https://zh-hans.react.dev/learn/writing-markup-with-jsx)。

**学习目标**：理解"组件即函数"，掌握 JSX 的核心规则与限制，学会用 props 建立组件接口。

## 组件就是一个函数

```jsx
function Greeting({ name }) {
  return <h1>你好，{name}</h1>
}

// 使用：像 HTML 标签一样
<Greeting name="Oxlyn" />
<Greeting name="Vue" />
```

组件是**接收 props、返回 UI 描述的普通函数**——没有类、没有模板引擎、没有编译期魔法（JSX 只是 `React.createElement` 的语法糖）。这个定义的分量要到第 3 章（渲染模型）才完全显现：**每次状态变化，React 重新调用你的函数**，所以组件函数必须纯、必须快。

与 [Vue SFC](/posts/vue-core/01-getting-started.md)（模板/逻辑/样式三段式）对照：React 一切皆 JS——标记是 JS 表达式（JSX），样式要么内联对象要么配 [Tailwind](/posts/tailwind-css/)，文件即组件。

## JSX 三条规则

JSX 看着像 HTML，实则是 JS 的语法扩展，规则有三：

**1. 只能返回一个根元素**（想多返回用 Fragment `<>...</>` 包裹，它不产生真实 DOM）；

**2. 标签必须闭合**——`<img>`、`<input>` 都要 `<img />` 自闭合；

**3. 大小写敏感**：小写开头的标签当原生 HTML（`<div>`），大写开头当组件（`<Greeting>`）——组件必须先定义/导入再使用。

**花括号 `{}` 是逃生舱**——从"标记世界"回到"JS 世界"：

```jsx
export default function TodoStats({ items }) {
  const done = items.filter((i) => i.done).length
  return (
    <p>
      共 {items.length} 项，完成 {done} 项——{done === items.length ? '全清 ✅' : '继续加油'}
    </p>
  )
}
```

`{}` 里放**任意表达式**（三元、函数调用、算术），不能放语句（if/for）——语句的活用三元或提前算好（第 4 章的条件渲染模式）。

## props：只读的入参

props 是组件的函数参数，铁律是**只读**：

```jsx
function Avatar({ src, size = 48 }) {
  return <img src={src} width={size} height={size} className="rounded-full" />
}

// 父组件里：props 向下流
<Avatar src="/a.png" size={64} />
```

与 [Vue 的 props 单向流](/posts/vue-core/04-components-props.md)同一契约；默认值直接用参数解构（`size = 48`）。**children** 是特殊的内置 prop——组件标签之间的内容：

```jsx
function Card({ title, children }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div>{children}</div>   {/* 父组件塞进来的任何内容 */}
    </div>
  )
}

<Card title="公告">
  <p>这里的内容会成为 children</p>
</Card>
```

这就是 [Vue 插槽](/posts/vue-core/04-components-props.md)的 React 版——内容分发靠 children 透传。

## class 与样式

JSX 里是 `className`（不是 `class`——JS 保留字问题，[Astro 主题第 2 章](/posts/astro-theme-dev/02-components-props.md)的同款保留字故事）。样式三选一：Tailwind 类（本站路线）、CSS Modules、内联对象 `style={{ color: 'red' }}`（注意双花括号：外层是表达式，内层是对象字面量）。

## 踩坑提示

- `{}` 里写了 `if` 语句报语法错——用三元、`&&`，或把逻辑提到 return 之前（第 4 章）。
- 组件名忘大写：`<greeting>` 会被当原生标签静默渲染成空——函数名大驼峰是硬约定。
- props 解构时丢默认值顺序（`{ size = 48 }` 的默认值写法）与 TS 的 `interface Props` 配合，[TS 系列知识](/posts/typescript-core/03-objects-and-interfaces.md)直接平移。

## 练习

1. 写一个 `Profile` 组件（头像 + 姓名 + 简介），用 props 传全部数据。
2. 用 Fragment 写一个返回两个相邻元素的组件，检查 DOM 确认无多余包裹。
3. 故意用小写函数名当组件，观察"什么都没渲染"，再修复。
