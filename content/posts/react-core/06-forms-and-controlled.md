---
title: "React 核心入门 · 第 6 章：表单与受控组件"
description: "受控与非受控两条路线、value+onChange 的双向姿势、多字段表单的组织。"
publishDate: 2026-08-06T09:00:00
tags: ["react", "教程"]
---

> 本文对应官方文档[用 state 管理 state](https://zh-hans.react.dev/learn/managing-state)与[表单相关 DOM API](https://zh-hans.react.dev/reference/react-dom/components/input)。

**学习目标**：分清受控与非受控组件，写对多字段表单，理解"React 没有 v-model"的补偿方案。

## 两条路线：受控与非受控

表单输入在 React 里有两种管法，选型先做：

**受控组件**：输入框的值由 state 驱动，每次输入回写 state——**React 是唯一事实源**：

```jsx
function SearchBox({ value, onChange }) {
  return (
    <input
      value={value}                        // UI 由 state 决定
      onChange={(e) => onChange(e.target.value)}   // 输入回写 state
    />
  )
}
```

**非受控组件**：DOM 自己管值，React 只在需要时"问一下"（用 ref 读）：

```jsx
import { useRef } from 'react'

function UncontrolledForm() {
  const nameRef = useRef(null)
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      console.log(nameRef.current.value)   // 提交时才读
    }}>
      <input ref={nameRef} defaultValue="初始值" />
    </form>
  )
}
```

| | 受控 | 非受控 |
| --- | --- | --- |
| 事实源 | React state | DOM |
| 实时校验/联动 | 天然支持 | 要监听手动做 |
| 代码量 | 每字段两行 | 近零 |
| 适用 | 大多数表单 | 一次性读值、文件上传、第三方封装 |

**默认受控**（需要联动/校验/格式化时才有意义）；"只交一次表单"的简单场景非受控更省。`defaultValue`/`defaultChecked` 是非受控的初值入口（受控的对应物是 `value`）。

## "React 没有 v-model"的补偿

[Vue 的 v-model](/posts/vue-core/06-forms-vmodel.md) 是"props + 事件"的语法糖；React 不提供糖——受控写法就是全部（`value + onChange`）。补偿是**组件层封装**：把这对组合封进可复用的字段组件（第 8 章的 useInput hook 或 Field 组件），一次封装处处用。

## 多字段表单的组织

字段多时用对象 state + 统一 setter：

```jsx
import { useState } from 'react'

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', agreed: false })

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [field]: value }))   // 函数式 + 不可变展开（第 2 章）
    }
  }

  const valid = form.name.trim() !== '' && /.+@.+\..+/.test(form.email) && form.agreed

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(form) }}>
      <input value={form.name} onChange={update('name')} />
      <input value={form.email} onChange={update('email')} />
      <label>
        <input type="checkbox" checked={form.agreed} onChange={update('agreed')} /> 同意条款
      </label>
      <button disabled={!valid}>提交</button>
    </form>
  )
}
```

复选框的值读 `checked`（不是 value）；派生校验 `valid` 在渲染期直接算（[第 3 章](/posts/react-core/03-render-and-purity.md)：能算的别存）。`e.target.name` 配合字段命名可以进一步收敛 update 函数。

## 表单状态放哪

- **单组件自用** → 组件内 useState（本章）；
- **跨组件/跨步骤** → 状态提升到父组件（[第 7 章](/posts/react-core/07-sharing-state-context.md)）或表单库（React Hook Form：非受控底座 + 校验生态）；
- **服务端行动**（React 19 的 form Actions）→ [第 10 章](/posts/react-core/10-ecosystem-integration.md)导读。

选择次序同 [Vue 第 6 章](/posts/vue-core/06-forms-vmodel.md)：**先标准 API，够了不上库**。

## 踩坑提示

- 受控 input 忘绑 onChange → 输入不进去（React 接管了 value 却没人回写）——控制台会有警告。
- value 绑了 state 但初始为 undefined → React 分不清受控/非受控——确保初值是 `''`/`false` 这类确定值。
- checkbox 用 `value` 而不是 `checked` 驱动——勾选状态永远不变。

## 练习

1. 把 Signup 表单完整实现：三字段受控 + computed 式校验 + 禁用态按钮。
2. 写一个 useInput 自定义 hook（返回 value/onChange/set），重构上面的重复组合（第 8 章预告）。
3. 用非受控方式重写同一表单，对比两种路线的代码量与联动能力。
