---
title: "React 核心入门 · 第 2 章：状态与事件"
description: "useState 的快照语义、不可变更新的原因、批量更新与函数式 setter。"
publishDate: 2026-08-02T09:00:00
tags: ["react", "教程"]
---

> 本文对应官方文档[state：组件的记忆](https://zh-hans.react.dev/learn/state-a-components-memory)与[响应事件](https://zh-hans.react.dev/learn/responding-to-events)。

**学习目标**：掌握 useState 的正确姿势，理解"快照"语义与不可变更新，分清普通更新与函数式更新。

## useState：组件的记忆

普通函数的局部变量每次调用都重置——组件要"记住"东西，就得用 useState：

```jsx
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)   // [当前值, 修改函数]，参数是初值

  return <button onClick={() => setCount(count + 1)}>点了 {count} 次</button>
}
```

与 [Vue 的 ref](/posts/vue-core/02-reactivity.md) 对照：Vue 是"赋值自动追踪"（隐式），React 是"必须调 setter"（显式）。**直接改变量不调 setter = React 毫不知情 = 界面不更新**——React 第一大新手坑，没有之一：

```jsx
count++              // ❌ 改了局部变量，界面纹丝不动
setCount(count + 1)  // ✅ 唯一合法的修改方式
```

## 快照语义：渲染中的 state 是定格的

React 的渲染模型（第 3 章展开）决定了：**本次渲染中的 state 是一张快照**——即使 setter 已经调用，当前这次渲染里读到的仍是旧值：

```jsx
function handleClick() {
  setCount(count + 1)
  setCount(count + 1)
  setCount(count + 1)
  console.log(count)   // 依然是旧值！三次"count + 1"基于同一张快照 → 只加 1
}
```

想基于**最新值**连续更新，用**函数式 setter**（回调收到上一个已确定的值）：

```jsx
setCount((c) => c + 1)   // ✅ 三次各加 1：每次基于上一次的结果
setCount((c) => c + 1)
setCount((c) => c + 1)
```

判断标准：新值**依赖旧值**就用函数式（`(c) => c + 1`），新值与旧值无关就直传（`setName(input)`）。

## 不可变更新：对象与数组

state 里的对象/数组必须**换新引用**而不是改旧的——React 靠引用比较决定"要不要重渲染"：

```jsx
// ❌ 突变：引用没变，React 认为没变化
user.name = 'new'
list.push(item)

// ✅ 替换：造新对象/新数组
setUser({ ...user, name: 'new' })
setList([...list, item])
setList(list.filter((i) => i.id !== id))       // 删除
setList(list.map((i) => i.id === id ? { ...i, done: true } : i))  // 更新一项
```

这与 [ArkTS 第 2 章](/posts/arkts-dev/02-arkts-vs-ts.md)"运行时不可改布局"的精神异曲同工：**数据变更显式化**。深层嵌套的更新层层展开很啰嗦——结构超两层就该考虑拆组件或用 Immer。

## 批量更新

同一轮事件里的多次 setState 会**自动合并为一次重渲染**（React 18 起连定时器/异步回调里也批量）——所以"调三次 setter"不等于"渲染三次"，性能上不必手抖。快照语义 + 批量更新组合出的推论：**事件处理器里 setState 之后立刻读 state，读到的还是旧值**——需要"改完立刻用"，把新值存局部变量，别回头读 state。

## 事件处理

事件属性驼峰（`onClick`/`onChange`），值为函数（不是字符串调用）：

```jsx
<button onClick={() => setCount(count + 1)}>      {/* 内联箭头：带参数 */}
<button onClick={handleClick}>                     {/* 传函数引用：别写 handleClick() */}
```

`onClick={handleClick()}` 是经典笔误——渲染时就执行了（返回值 undefined 被当处理器）。带参数时永远包箭头函数：`onClick={() => remove(id)}`。事件对象是合成事件：`e.preventDefault()` 用法同[原生 DOM](/posts/javascript-core/10-dom-and-events.md)。

## 踩坑提示

- useState 的初值只在**首次渲染**生效——"想重置状态"要靠 key 切换（第 4 章）或显式 setter，改初值参数没用。
- 函数式 setter 里写返回旧对象的突变操作（`(l) => { l.push(x); return l }`）——引用没变等于没更新。
- 事件处理器里忘写箭头直接传调用式——页面一加载就触发。

## 练习

1. 复现"连点三次只加 1"，换成函数式 setter 修复。
2. 写一个购物车：数组 state 的增/删/改全用不可变方式，故意用 push 观察"界面不更新"。
3. 在一次点击里调 4 个不同 setter，用 console 确认只渲染一次（批量更新）。
