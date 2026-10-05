---
title: "Tailwind CSS 实战入门 · 第 5 章：暗色模式"
description: "media 与 class 两种流派、data-theme 自定义变体、CSS 变量 token 法——本站方案全解。"
publishDate: 2026-08-17T09:00:00
tags: ["tailwindcss", "css", "教程"]
---

> 本文对应官方文档[暗色模式](https://tailwindcss.com/docs/dark-mode)。本站案例来自这个博客的真实改造。

**学习目标**：分清暗色模式的两种实现流派，为"三态主题切换"搭一套 CSS 变量 token，理解本站的选择。

## 两种流派

**流派一：跟随系统（media 策略，v4 默认）**。`dark:` 变体编译成 `@media (prefers-color-scheme: dark)`——零 JS，用户系统切暗色页面跟着切。缺点：**页面内没有开关**，用户无法让"亮色系统看暗站"。

**流派二：手动切换（class/属性策略）**。暗色判定由你定义——通常是给根元素挂 class 或属性，再让 `dark:` 变体匹配它。v4 的姿势是**自定义变体**：

```css
@import "tailwindcss";

/* 让 dark: 匹配 data-theme="dark" 及其后代 */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

```html
<html data-theme="dark">
  <div class="bg-white dark:bg-gray-900">...</div>
```

切换按钮只需改根元素的 `data-theme`（JS 一行），页面全量变色。

## 第三条路：CSS 变量 token（本站的选型）

上面两条路都要求**每个组件写两份颜色类**（`bg-white dark:bg-gray-900`）。本站选了第三条：**颜色原子类只写一份，指向 CSS 变量；变量在亮暗两套主题里各定义一份**：

```css
/* global.css（简化自本站真实代码） */
@import "tailwindcss";

@theme {
  --color-global-bg: var(--bg);
  --color-global-text: var(--text);
  --color-link: var(--link);
}

:root {
  --bg: oklch(98% 0 0);
  --text: oklch(20% 0 0);
  --link: oklch(55% 0.18 350);
}
[data-theme="dark"] {
  --bg: oklch(23.6% 0.005 248);
  --text: oklch(83.5% 0 264);
  --link: oklch(70% 0.11 349);
}
```

组件里从此只有一份类：`bg-global-bg text-global-text`——亮暗切换是变量换值，**组件根本不知道暗色的存在**。切换动画也只过渡变量（[本站 global.css](https://github.com/windcat0/oxlyn1) 的 `transition: --color-global-bg ...` 同款思路）。

三流派对比：

| 方案 | 组件类名 | 开关 | 适合 |
| --- | --- | --- | --- |
| media | 两份 | 无 | 内容型、跟随系统即可 |
| 自定义变体 | 两份 | 有 | 需要逐元素精细控制的暗色 |
| 变量 token | **一份** | 有 | 多主题/品牌化/长期维护 |

## 三态切换：auto / light / dark

产品级需求通常是三态。实现：`data-theme` 只存 light/dark 两态之一，"auto"态时由一小段脚本按 `prefers-color-scheme` 解析并写入（外加防闪烁的 inline 脚本——首屏前就要定好 data-theme，否则暗色用户白屏一闪）：

```js
// 防闪烁：<head> 里的 is:inline 脚本
const pref = localStorage.theme ?? 'auto'
document.documentElement.dataset.theme =
  pref !== 'auto' ? pref
  : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
```

## 踩坑提示

- 流派二忘了把"用户选择"持久化进 localStorage，刷新就弹回——三态脚本里那个 `localStorage.theme` 不能省。
- 变量 token 法下新增颜色忘了加进暗色表，暗色下漏出一条亮色——[鸿蒙暗色](/posts/harmonyos-app-dev/)同款坑：**两份变量表字段必须一一对应**。
- `dark:` 变体自定义后，`@custom-variant` 的选择器写错不报错、只是不生效——改完先在控制台确认编译产物。

## 练习

1. 按流派二接入 dark 变体 + 切换按钮，跑通后再按变量 token 法重构，对比组件里类名的变化。
2. 实现三态切换（auto/light/dark）+ 防闪烁脚本，暗色系统下刷新无白闪。
3. 给变量 token 加第三套主题（如高对比度），体会"组件零改动"的含义。
