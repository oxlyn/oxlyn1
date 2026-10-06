---
title: "React 核心入门：函数组件与 Hooks"
description: "React 系列教程总览：组件与 JSX、状态与渲染模型、Effect 纪律、Context、自定义 Hook 与 Astro 集成。"
publishDate: 2026-08-12T09:00:00
tags: ["react", "教程"]
---

React 是"UI 是状态的函数"这一宣言的鼻祖：组件就是一个**接收 props、返回界面的函数**，框架负责在状态变化时重新调用它。这个系列与[《Vue 核心入门》](/posts/vue-core/)平行——同一个问题域（声明式 UI），两种世界观（React 的显式重渲染 vs Vue 的隐式响应式）。学完任何一个再看另一个，都是"换语法复习概念"。

> 内容依据 [React 官方中文文档](https://zh-hans.react.dev/learn)（react.dev，React 19 时代）整理，代码示例均为原创（函数组件 + Hooks），每章附官方文档链接。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：组件与 JSX](/posts/react-core/01-components-and-jsx/) | 函数组件、JSX 规则、props | [你的第一个组件](https://zh-hans.react.dev/learn/your-first-component) |
| [第 2 章：状态与事件](/posts/react-core/02-state-and-events/) | useState、不可变更新、批量更新 | [state：组件的记忆](https://zh-hans.react.dev/learn/state-a-components-memory) |
| [第 3 章：渲染模型与纯函数](/posts/react-core/03-render-and-purity/) | 渲染即快照、严格模式双调用 | [保持组件纯粹](https://zh-hans.react.dev/learn/keeping-components-pure) |
| [第 4 章：列表与条件渲染](/posts/react-core/04-lists-keys-conditional/) | key 的身份语义、&& 与三元 | [渲染列表](https://zh-hans.react.dev/learn/rendering-lists) |
| [第 5 章：Effect 与生命周期](/posts/react-core/05-lifecycle-and-effects/) | useEffect、依赖数组、清理 | [Effect 同步](https://zh-hans.react.dev/learn/synchronizing-with-effects) |
| [第 6 章：表单与受控组件](/posts/react-core/06-forms-and-controlled/) | 受控/非受控、双向的 React 姿势 | [状态管理](https://zh-hans.react.dev/learn/managing-state) |
| [第 7 章：状态提升与 Context](/posts/react-core/07-sharing-state-context/) | 状态归属、createContext | [用 Context 传递数据](https://zh-hans.react.dev/learn/passing-data-deeply-with-context) |
| [第 8 章：自定义 Hook](/posts/react-core/08-custom-hooks/) | 复用逻辑、useMemo/useCallback/useRef | [用自定义 Hook 复用逻辑](https://zh-hans.react.dev/learn/reusing-logic-with-custom-hooks) |
| [第 9 章：性能优化](/posts/react-core/09-performance/) | memo、虚拟化、React Compiler | [性能](https://zh-hans.react.dev/learn/render-and-commit) |
| [第 10 章：生态与 Astro 集成](/posts/react-core/10-ecosystem-integration/) | React 19、Server Components、岛屿 | [Astro + React](https://docs.astro.build/zh-cn/guides/integrations-guide/react/) |
| [附录：Hook 速查](/posts/react-core/11-appendix/) | Hooks 全家桶 + 资源 | — |

## 与 Vue 系列的对照表

| 概念 | Vue（[本站系列](/posts/vue-core/)） | React（本系列） |
| --- | --- | --- |
| 组件 | SFC（`.vue` 三段式） | 函数 + JSX（一个函数全包） |
| 状态 | `ref`（.value 双面性） | `useState`（返回 [值, setter]） |
| 更新机制 | 隐式：ref 赋值自动追踪 | 显式：调 setter 触发重渲染 |
| 派生值 | `computed` | 渲染期直接算（或 `useMemo`） |
| 副作用 | `watch`/`watchEffect` | `useEffect` + 依赖数组 |
| 双向绑定 | `v-model`（语法糖） | 无糖：value + onChange 手写 |
| 跨层传递 | provide/inject | Context |
| 逻辑复用 | 组合式函数（useXxx） | 自定义 Hook（useXxx） |

**同源的部分**：key 的身份语义、单向数据流、闭包陷阱、组合优于继承——[JS 系列](/posts/javascript-core/)的底层知识两边通用。

## 环境准备

```bash
npm create vite@latest my-app -- --template react-ts   # Vite 脚手架（[Vite 系列](/posts/vite-dev/)）
npm run dev
```

编辑器推荐 VS Code + 官方 ESLint 插件（eslint-plugin-react-hooks 能抓 Hook 依赖错误——第 5 章的救星）。

## 遗留问题

- Server Components / Actions（React 19 的服务端范式）在第 10 章只做概念导读，深水区属于 Next.js 等全栈框架。
- useReducer、useSyncExternalStore、lazy/Suspense 等进阶 Hook 着墨有限，以官方 API 参考为准。
