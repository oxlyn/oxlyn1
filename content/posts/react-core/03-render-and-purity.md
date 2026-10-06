---
title: "React 核心入门 · 第 3 章：渲染模型与纯函数"
description: "渲染即快照、触发-渲染-提交三步、严格模式双调用——React 一切'怪异行为'的总纲。"
publishDate: 2026-08-03T09:00:00
tags: ["react", "教程"]
---

> 本文对应官方文档[保持组件纯粹](https://zh-hans.react.dev/learn/keeping-components-pure)、[渲染与提交](https://zh-hans.react.dev/learn/render-and-commit)与[state 如快照](https://zh-hans.react.dev/learn/state-as-a-snapshot)。

**学习目标**：理解"触发→渲染→提交"三步流程，把"组件必须纯"内化为肌肉记忆。

## 三步走：触发 → 渲染 → 提交

每次界面更新的完整流程：

1. **触发**：组件首次挂载，或某处调了 setter；
2. **渲染**：React **重新调用**受影响组件（及其子组件）——你的函数被再执行一遍，拿到新的 props/state，返回新的 JSX 树；React 对比新旧两棵树（diff），算出最小 DOM 操作；
3. **提交**：把算好的操作应用到真实 DOM。

"渲染"这个词在这里 = **调用你的组件函数**，与"操作 DOM"无关——DOM 是提交阶段的事。理解这一点，"为什么改了 state 界面才变""为什么 setState 后立刻读是旧值"全部顺理成章。

## 纯函数：React 的最高纪律

渲染阶段 React 可能**随时、多次、并发地**调用你的组件函数——于是组件必须纯：

- **只做自己的事**：不修改 props、不修改本次渲染前存在的任何变量/对象；
- **相同输入相同输出**：同样的 props/state 每次渲染出同样的 JSX。

违反的典型与后果：

```jsx
// ❌ 副作用在渲染期：外部世界被改了
function List({ items }) {
  items.sort((a, b) => a.price - b.price)   // 突变了 props！
  return <ul>{/* ... */}</ul>
}

// ✅ 派生数据在渲染期"计算"而不是"修改"
function List({ items }) {
  const sorted = [...items].sort((a, b) => a.price - b.price)
  return <ul>{sorted.map(/* ... */)}</ul>
}
```

派生状态的第一选择是**渲染期直接计算**（变量、map/filter/sort 到新数组）——不需要 useMemo，除非算力昂贵（第 8 章）。官方口号"**你可能不需要 Effect**"的一半就是这句话：能算出来的别存、别同步（第 5 章展开）。

## 严格模式：故意的双调用

开发模式（StrictMode）下 React 会**调用组件函数两次**——不是 bug，是故意暴露不纯：如果你的组件因双调用打印两次日志、请求发两次、计数错乱，说明它有副作用藏在渲染期。生产环境只调一次，但 bug 已经被开发期抓出来了。

同理：`useState` 的初始化函数、传给 setState 的 updater 也可能被双调用——**updater 必须纯**（`(c) => c + 1` 合规，`(c) => c + Date.now()` 违规）。

## 副作用的正确位置

渲染期禁止副作用，那网络请求、订阅、改标题这些事在哪做？——**事件处理器**（用户交互触发的逻辑）与 **Effect**（需要"与外部系统同步"的逻辑，第 5 章）。决策树：

```
逻辑的触发时机？
├─ 用户交互（点击/输入/提交）→ 事件处理器
├─ 状态派生（能算出来）→ 渲染期计算
└─ 与外部系统同步（订阅/定时器/请求）→ Effect（第 5 章）
```

## 踩坑提示

- 在渲染期 `console.log` 发现双份——先检查是不是 StrictMode（别当 bug 修）。
- 组件顶层做随机值/时间戳（`Date.now()` 每次渲染不同）——破坏"相同输入相同输出"，要用时放事件或 Effect，或算一次存 state。
- "顺手"在渲染期改模块级变量/缓存——并发渲染下多份调用会踩踏，这类状态进 [Context/store](/posts/react-core/07-sharing-state-context.md)。

## 练习

1. 复现 StrictMode 双调用（Vite 模板默认开启），在组件里 console.log 观察次数。
2. 找一个"渲染期排序 props 数组"的组件（或照上面反例造一个），修成纯版本。
3. 把一段"渲染期发请求"的代码迁移到事件处理器，梳理三种触发时机的归属。
