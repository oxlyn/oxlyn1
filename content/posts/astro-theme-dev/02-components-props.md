---
title: "Astro 主题开发 · 第 2 章：组件与 Props"
description: "Astro 组件的解剖：frontmatter 脚本 + 模板、Props 接口、组件组合，以及 class 传递这个经典坑。"
publishDate: 2026-09-28T09:00:00
tags: ["astro", "主题开发", "教程"]
---

> 本文对应官方文档[Astro 组件](https://docs.astro.build/zh-cn/basics/astro-components/)，示例在其基础上改编。

**学习目标**：掌握组件的完整语法与 Props 约定，理解主题组件的接口设计。

## 组件的解剖

Astro 组件就是一个 `.astro` 文件，默认只输出 HTML、零 JS。结构分两段：

```astro
---
// 组件脚本：import、取数、定义变量——只在构建时运行
interface Props {
  title: string
  tags?: string[]
}
const { title, tags = [] } = Astro.props
---
<!-- 组件模板：输出 HTML -->
<article>
  <h2>{title}</h2>
  {tags.length > 0 && <p>{tags.join(' / ')}</p>}
</article>
```

两段都是可选的：没有模板的组件可以做纯逻辑封装，没有脚本的组件就是纯静态片段。组件文件里**默认不渲染任何东西**——忘写 `<h2>{title}</h2>` 这类模板，页面上就是一块空白，排查"组件不显示"时先看这里。

## Props：主题组件的对外接口

`Props` 接口是 TypeScript 的类型声明，配合 `Astro.props` 解构使用。它对主题开发有双重意义：

1. **文档作用**：使用者看你组件的第一件事就是看 Props——这是组件的 API 签名；
2. **编辑器补全**：使用者在自己的页面里用你的组件时，props 拼错立刻有红线。

设计 Props 时的主题化考量：

- **必填越少越好**：能给默认值的都给默认值（`tags = []`），使用者只传他关心的；
- **传数据不传配置**：组件需要的"站点级配置"（如站点标题）不要让使用者层层手动传——从主题配置里读（第 6 章），组件签名保持干净；
- **回调解耦**：需要自定义渲染的地方用 `slot`（下一章）而不是传 JSX 回调——Astro 是构建时框架，没有 React 那种回调渲染。

## 组合：组件用组件

组件在 frontmatter 里 import，在模板里当标签用，嵌套无限制：

```astro
---
import PostCard from './PostCard.astro'
import Pagination from './Pagination.astro'
---
<PostCard post={post} />
<Pagination page={2} total={10} />
```

没有"注册"环节、没有运行时开销——构建时所有组件直接内联成最终 HTML。这意味着主题组件的拆分粒度可以很自由，按"一个组件一件事"切就行。

## 经典坑：class 传不进去

给组件传 `class` 想从外面控制它的样式？直接写 `class={className}` 解构会编译报错——`class` 在 JS 里是保留字。官方姿势是解构时重命名：

```astro
---
const { class: className, ...rest } = Astro.props
---
<div class={className} {...rest}>
  <slot />
</div>
```

还有一个隐蔽点：组件内 `<style>` 的作用域样式**不会作用于你转手包出去的内容**（下一章细讲），所以包装类组件（Card、Container）都该养成接收 `class` 并转发的习惯——这是"可主题化组件"的基本礼仪，astro-cactus 的所有包装组件都带这一手。

## 踩坑提示

- Props 只能从父组件传给子组件，**不能从子组件"抛"给父组件**——需要反向通信时，用 slot（下一章）或事件思路重新设计。
- `Astro.props` 是只读的，别在模板里改它。
- 忘写 `interface Props` 不报错，但失去全部类型检查——主题组件永远要写。
- 模板里的 `{expression}` 在构建时求值，不要试图在里面写依赖浏览器环境的代码（`window` 之类）。

## 练习

1. 写一个 `TagList.astro`，接收 `tags: string[]` 并渲染标签链接，带默认值处理空数组。
2. 给它加上 `class` 转发，从父组件传入自定义类名验证生效。
3. 故意传一个类型错误的 prop（如 `tags="astro"`），观察构建期报错信息。
