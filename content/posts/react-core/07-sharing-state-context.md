---
title: "React 核心入门 · 第 7 章：状态提升与 Context"
description: "状态放哪的决策框架、逐层 props 的终结者 Context、useContext 的纪律与拆分。"
publishDate: 2026-08-07T09:00:00
tags: ["react", "教程"]
---

> 本文对应官方文档[组件间共享状态](https://zh-hans.react.dev/learn/sharing-state-between-components)与[用 Context 传递数据](https://zh-hans.react.dev/learn/passing-data-deeply-with-context)。

**学习目标**：掌握状态归属的决策框架，用状态提升解决兄弟共享，用 Context 解决逐层传递。

## 状态放哪：三档决策

与 [Vue 第 7 章](/posts/vue-core/07-provide-inject-pinia.md)、[ArkTS 第 4 章](/posts/arkts-dev/04-state-v1.md)同一张表：

| 状态 | 住址 | 手段 |
| --- | --- | --- |
| 单组件自用 | 组件内 useState | [第 2 章](/posts/react-core/02-state-and-events.md) |
| 兄弟/父子共享 | 提升到最近公共父组件 | props 下传 + 回调上抛 |
| 全树共享（主题/用户） | Context 或外部 store | 本章 |

## 状态提升：兄弟共享的正解

两个兄弟组件要共享数据——把状态搬到它们最近的公共父级：

```jsx
function App() {
  const [selectedId, setSelectedId] = useState(null)

  return (
    <>
      <PostList onSelect={setSelectedId} />
      <PostDetail id={selectedId} />
    </>
  )
}
```

纪律是**单向数据流**：状态在父、数据走 props 向下、修改走回调向上——[Vue 第 4 章](/posts/vue-core/04-components-props.md)的 props/emit 契约换了个拼写。两个子组件不再各自持有"同一份数据的副本"——**副本即漂移的温床**（[ArkTS 第 3 章](/posts/arkts-dev/03-services.md)单例语义的 UI 版）。

## Context：逐层传递的终结者

状态提升到很高处后，中间层组件被迫当"传声筒"（十层组件层层透传 theme props）。Context 让**祖先直接广播、后代直接订阅**，中间层无感：

```jsx
import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext(null)

// 祖先：包住整棵子树
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  return (
    <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>
  )
}

// 任意深度的后代：订阅
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必须在 ThemeProvider 内使用')
  return ctx
}

function ThemeButton() {
  const { theme, toggle } = useTheme()
  return <button onClick={toggle}>{theme}</button>
}
```

三个工程习惯：**createContext 放独立文件**（生产者消费者共享）；**包一层自定义 Hook**（useTheme）做存在性校验与解耦（换实现只动一处）；**Provider 用组件包裹 children**（React 19 起可直接 `<Context value=...>`，省掉 `.Provider`）。

这是"依赖注入"的第四次相逢：[ArkTS @Provide/@Consume](/posts/arkts-dev/04-state-v1.md)、[Vue provide/inject](/posts/vue-core/07-provide-inject-pinia.md)、[DSH 服务注入](/posts/dsh-plugin-dev/03-services.md)、React Context——同一模式四种方言，连"传引用别传快照"的警告都通用（Context value 对象要包在 state 里，别在渲染期新造对象字面量——每次渲染都是新引用，全部消费者跟着重渲染）。

## Context 的纪律

- **按变化频率拆**：theme 与 user 分两个 Context——一个变了不该牵动另一个的消费者；
- **Context 不是状态库**：复杂业务状态（购物车、多模块联动）用状态库（Zustand/Redux）或 [Pinia 的对照物](/posts/vue-core/07-provide-inject-pinia.md)——Context 擅长"低频全局值"，不擅长"高频读写"（value 变 = 整棵订阅子树重渲染）；
- **组合优于透传**：能用 props 明说关系的（父子直接传），别动用 Context——它是"跨层"工具，不是"懒传参"工具。

## 决策流程图

```
状态被谁用？
├─ 只有自己 → 组件内 useState
├─ 父子/兄弟 → 状态提升（props + 回调）
├─ 深层多处低频（主题/用户/语言）→ Context
└─ 全局高频读写（购物车/会话）→ 状态库（第 10 章生态）
```

## 踩坑提示

- Context value 在渲染期写对象字面量 → 引用每次变化 → 消费者全量重渲染——用 useMemo 或把 value 拆成 state 本体。
- Provider 包漏了某个分支 → useTheme 抛错（自定义 Hook 里 throw 的价值就在这）。
- Context 里放"高频变化"的状态（输入框逐字）——大面积重渲染卡顿，[第 9 章](/posts/react-core/09-performance.md)的定位首案。

## 练习

1. 把第 6 章的 Signup 与导航栏共享登录态：状态提升实现一遍，Context 实现一遍。
2. 拆 Theme/User 两个 Context，验证互不牵动（渲染计数）。
3. 故意让 useTheme 在 Provider 外调用，确认自定义 Hook 的 throw 兜底。
