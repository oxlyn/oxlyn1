---
title: "CSS 核心入门 · 第 8 章：过渡与变换"
description: "transition 与 transform 的正确分工、GPU 加速的真相、animation 与 prefers-reduced-motion。"
publishDate: 2026-07-27T09:00:00
tags: ["css", "教程"]
---

> 本文对应 MDN 指南[过渡](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Transitions)与[变换](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Transforms)。

**学习目标**：掌握 transition 四件套与 transform 独立轴，理解"为什么动画掉帧"，写出不卡的性能友好动画。

## transition：状态 A 到 B 的补间

transition 声明"当某属性值变化时，用多长时间、什么节奏过渡过去"——它**只关心变化瞬间**：

```css
.button {
  background: var(--brand-600);
  transition: background-color 0.2s ease-out, transform 0.15s ease-out;
}
.button:hover {
  background: var(--brand-500);
  transform: translateY(-1px);
}
```

四件套：`property`（过渡谁）、`duration`（多久）、`timing-function`（节奏曲线）、`delay`（延迟）。曲线速记：**界面反馈用 ease-out（快进慢收）**，退场用 ease-in，物理感用 cubic-bezier 自调。经验时长：微交互 150–200ms，面板展开 250–350ms——超过 500ms 的界面动画都在消耗用户耐心。

陷阱：**display: none 与 display: block 之间没有过渡**（display 不可插值）。展开/收起动画要么用 `grid-template-rows: 0fr → 1fr` 技巧，要么改 opacity/transform + `visibility`。

## transform：动画的专属通道

transform 有两个特权：**不触发重排**（元素视觉上动了，布局纹丝不动）、走 GPU 合成层。动画属性的白名单：

```css
transform: translateX(8px) scale(1.05) rotate(-2deg);   /* 位移/缩放/旋转 */
opacity: 0.8;
```

反例警钟：**动画 width/height/top/margin** = 每帧重排 = 掉帧。位移用 translateX 而不是 left，缩放用 scale 而不是改 width——同一个视觉效果，性能天差地别。子像素模糊时给 transform 加 `will-change: transform`（提前提升合成层），但**不要全局滥用**——每个合成层都是内存。

变换的多值顺序有讲究：`transform: translate(...) scale(...)` 从左到右应用，translate 在前可以让缩放围绕正确中心。

## animation：多帧编排

transition 只能 A→B，keyframes 可以多帧循环：

```css
@keyframes spin { to { transform: rotate(360deg); } }

.loading {
  animation: spin 1s linear infinite;
}
```

`animation` 相比 transition 多了迭代次数、方向、填充模式（`forwards` 保住结束帧）。选择口径：**交互反馈 transition，循环/多帧/编排 animation**。

## 无障碍与性能的双重闸门

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

用户系统开启"减少动态效果"时，上面这条把它全部关掉（[第 6 章](/posts/css-core/06-responsive.md)的无障碍件）——它已是多数设计系统的标配。性能侧的自查三问：动画的是不是 transform/opacity？有没有引发滚动条闪现（触发重排）？长列表里是不是每项都在动画（合成层爆炸）？

## 一个完整例子

```css
.card {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
}
```

悬浮卡片的标准实现：只动 transform 与 shadow（不重排），200ms ease-out，克制而高级——动画设计的第一原则永远是"少而准"。

## 踩坑提示

- transition 写在 hover 态里（而不是元素默认态）：hover 移出时无过渡、瞬跳——transition 放默认态。
- 动画 opacity 从 0 开始的元素仍拦截点击——配合 `visibility: hidden` 或 `pointer-events: none`。
- transform 让 position: fixed 的后代改认祖先为锚（[第 5 章](/posts/css-core/05-positioning.md)的层叠上下文连环坑）——动效容器里的弹层要挪出去。

## 练习

1. 把一个"hover 改 width"的进度条动画改成 scale 版本，Profiler 对比掉帧。
2. 用 grid-template-rows 0fr→1fr 实现手风琴展开，替代 display 切换。
3. 实现"卡片悬浮上移 + 阴影加深 + 图标平移"三联动，全程只动 transform/opacity/shadow。
