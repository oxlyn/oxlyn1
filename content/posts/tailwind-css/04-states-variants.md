---
title: "Tailwind CSS 实战入门 · 第 4 章：状态与变体"
description: "hover/focus/active/disabled 五件套、变体叠加的读写规则、group 与 peer 的兄弟联动。"
publishDate: 2026-08-04T09:00:00
tags: ["tailwindcss", "css", "教程"]
---

> 本文对应官方文档[悬停、聚焦与其他状态](https://tailwindcss.com/docs/hover-focus-and-other-states)。

**学习目标**：掌握状态变体全家族，理解变体叠加的顺序语义，学会 group/peer 的"他人状态"写法。

## 状态前缀：伪类的前缀化

CSS 伪类在原子类里统一成**前缀**：`hover:bg-blue-600` 编译成 `.hover\:bg-blue-600:hover { ... }`——每个交互态一行写完，不用跳到样式文件找对应的 `:hover` 规则：

```html
<button class="bg-blue-600 text-white rounded-lg px-4 py-2
               hover:bg-blue-500 active:bg-blue-700
               focus-visible:outline-2 focus-visible:outline-blue-600
               disabled:opacity-50 disabled:pointer-events-none">
  提交
</button>
```

高频家族五件套：`hover:`（悬停）、`focus-visible:`（键盘聚焦，比裸 `focus:` 更精准——鼠标点击不触发）、`active:`（按下）、`disabled:`（禁用）、`checked:`（选中态）。表单控件的 `focus:` 默认自带一圈 ring（v4 的 focus 样式继承自 preflight），想自定义就覆盖 `focus:ring-*`。

## 变体叠加：从右往左读

变体可以链式叠加，**读法从右往左**：`dark:hover:bg-gray-800` = 暗色模式下、悬停时、底色变灰。响应式与状态叠加同理：`md:hover:text-lg` = 桌面端悬停放大字号。

叠加的意义是**组合爆炸不爆炸在代码里**——两个变体一类搞定，不需要为"暗色悬停"单开一条规则。

## group / peer：看别人的状态

变体默认只看自己。要看**父元素**（group）或**前置兄弟**（peer）的状态：

```html
<!-- group：悬停整卡片，标题变蓝、箭头平移 -->
<a class="group block rounded-xl border p-6 hover:shadow-md transition">
  <h3 class="group-hover:text-blue-600 group-hover:underline">文章标题</h3>
  <p class="mt-2 text-gray-500">摘要……</p>
  <span class="inline-block transition-transform group-hover:translate-x-1">→</span>
</a>

<!-- peer：勾选后点亮后面的说明 -->
<input type="checkbox" class="peer sr-only" />
<span class="peer-checked:text-emerald-600 peer-checked:font-medium">已同意条款</span>
```

命名约定：`group` 一个容器只能有一个（多层用 `group/name` 命名分组），`peer` 只能作用于**前置**兄弟——DOM 顺序即约束。

## 过渡：别让状态跳变

状态变化配上 `transition` 家族才有"活"感：

```html
<button class="transition-colors duration-200 hover:bg-blue-500 ...">
<!-- 或全属性：transition + duration-150 ease-in-out -->
```

只过渡需要的属性（`transition-colors`/`transform`）优于全量 `transition`——少重绘。位移类配合 `transform` 原子类（`hover:-translate-y-0.5`）做卡片悬浮感。

## 踩坑提示

- `hover:` 在触屏上会"粘住"——移动端的关键交互别只挂在 hover 上（用 active 或直接常显）。
- `focus:` 与 `focus-visible:` 混用导致鼠标点击也出圈——表单用前者、按钮/链接用后者。
- 变体叠太长（`md:dark:hover:disabled:...`）意味着这个组件该抽走了（第 8 章），四层是警界线。

## 练习

1. 做一个完整的按钮：四种状态 + 过渡 + 禁用，全部一行类名。
2. 用 group 实现"卡片悬停时图片放大 5% 且标题变色"的组合效果。
3. 用 peer 实现"密码输入框聚焦时，下方提示文字出现"（提示：peer-focus:block）。
