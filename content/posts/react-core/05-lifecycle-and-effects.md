---
title: "React 核心入门 · 第 5 章：Effect 与生命周期"
description: "useEffect 的同步语义、依赖数组、清理函数，以及'你可能不需要 Effect'的判别术。"
publishDate: 2026-08-05T09:00:00
tags: ["react", "教程"]
---

> 本文对应官方文档[用 Effect 进行同步](https://zh-hans.react.dev/learn/synchronizing-with-effects)、[你可能不需要 Effect](https://zh-hans.react.dev/learn/you-might-not-need-an-effect)与[Effect 的生命周期](https://zh-hans.react.dev/learn/lifecycle-of-reactive-effects)。

**学习目标**：理解 Effect 是"与外部系统同步"而非"生命周期钩子"，掌握依赖数组与清理，学会把误用的 Effect 搬回正位。

## Effect 是什么、不是什么

渲染是纯的（第 3 章），但总有些事必须"出去接触世界"：发请求、订阅 WebSocket、操作 document.title、同步第三方 DOM 插件。**Effect（useEffect）就是让某段代码在提交之后执行、且"跟随响应式值自动重跑"的机制**：

```jsx
import { useEffect } from 'react'

function Room({ roomId }) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const conn = createConnection(roomId)      // 与外部系统（服务器）建立连接
    conn.connect()
    return () => conn.disconnect()             // 清理：断开旧连接
  }, [roomId])                                 // 依赖：roomId 变了才重新同步

  return <MessageList messages={messages} />
}
```

官方定义精确到刻薄：Effect 让你**把组件与某个外部系统保持同步**。它不是生命周期钩子——"挂载时跑一次"只是"同步一次"的特例。

## 依赖数组：同步的重跑条件

`[roomId]` 的语义：**effect 的代码依赖了 roomId，roomId 变化时先清理旧同步、再建立新同步**。规则：

- **依赖要诚实**：effect 里用到的所有响应式值都要列上（React 的 ESLint 插件会查）——撒谎的依赖是陈旧闭包 bug 之源（[JS 闭包](/posts/javascript-core/03-functions-and-closures.md)的 React 翻版）；
- **空数组 `[]`** = 不依赖任何响应式值 = 只在挂载时同步一次（卸载时清理）；
- 依赖越多重跑越频繁——想少跑，**减少依赖**（把组件外的常量挪出去、用 setter 的函数式形态、或拆组件），而不是骗依赖数组。

## 清理函数：成对出现

清理在"依赖变化前"和"卸载时"执行——它保证**同一时刻只有一份同步**。开发模式 StrictMode 会挂载→卸载→再挂载地演练一遍（[第 3 章](/posts/react-core/03-render-and-purity.md)的双调用），就是逼你把清理写全：没写清理的订阅/定时器，双挂载下立刻暴露成双份。

## 你可能不需要 Effect

官方最著名的一章，判别术值得整段记住：

```jsx
// ❌ 用 Effect 同步派生状态：多一次渲染、可能与源不同步
const [fullName, setFullName] = useState('')
useEffect(() => { setFullName(first + ' ' + last) }, [first, last])

// ✅ 派生值在渲染期直接算（[第 3 章]：能算出来的别存）
const fullName = first + ' ' + last

// ❌ 用 Effect 响应用户事件
useEffect(() => { if (submitted) sendMessage(body) }, [submitted])

// ✅ 事件逻辑放事件处理器（和用户点击同一时机）
function handleSubmit() { setSubmitted(true); sendMessage(body) }
```

**Effect 的正当用途清单**：与外部系统同步（订阅/请求/第三方组件）、`document.title` 等非 React 世界的修改、分析埋点。**反模式清单**：派生状态、事件逻辑、链式 setState、缓存初始化。写 useEffect 前先问：这逻辑是"响应状态变化"还是"响应用户动作"？后者是事件处理器的活。

## 数据请求的模式

请求是最常见的 Effect，正确姿势带竞态清理：

```jsx
useEffect(() => {
  let ignore = false                       // 竞态守卫：慢响应不得覆盖新响应
  fetchTodo(id).then((data) => {
    if (!ignore) setTodo(data)
  })
  return () => { ignore = true }
}, [id])
```

进阶用框架级方案（React 19 的 `use()` + 框架缓存、TanStack Query）——[ArkTS 第 9 章](/posts/arkts-dev/09-concurrency.md)的竞态纪律在 Web 的同源问题。

## 踩坑提示

- 依赖数组里塞对象/函数（每次渲染都是新引用）→ effect 每次渲染都重跑——依赖原始值，或用第 8 章的 useMemo/useCallback 稳定引用。
- 想跳过"首渲染执行"就动依赖数组——官方明确反对（破坏与重跑的对称性），需求多半该用事件处理器。
- 清理函数里再 setState 导致循环——effect 与被它更新的状态形成闭环，重新设计数据流。

## 练习

1. 写房间切换的连接管理（依赖 roomId + 清理断开），StrictMode 下验证无重复连接。
2. 把一个"Effect 派生 fullName"的反例改回渲染期计算，渲染次数计数对比。
3. 给搜索请求加竞态守卫，人为制造"慢响应后到"验证旧结果不覆盖新结果。
