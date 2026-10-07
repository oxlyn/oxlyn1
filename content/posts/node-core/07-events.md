---
title: "Node.js 核心入门 · 第 7 章：事件与 EventEmitter"
description: "事件驱动的统一抽象、on/emit/once、error 事件的特殊约定与监听器泄漏。"
publishDate: 2026-10-12T09:00:00
tags: ["nodejs", "教程"]
---

> 本文对应官方文档 [Events](https://nodejs.org/docs/latest/api/events.html)。

**学习目标**：掌握 EventEmitter 的使用与约定，理解"事件"为什么是 Node 的统一抽象，学会排查监听器泄漏。

浏览器里的 `addEventListener` 你天天用；Node 把这个模式抽成了通用的 `EventEmitter`，而且**无处不在**：HTTP 服务器的 `request`、流的 `data`/`error`、进程的 `exit`——前几章遇到的每个 `on(...)` 都是它。学会这一个类，等于看懂了 Node 大半个 API 表面。

## 基本用法

```js
import { EventEmitter } from "node:events"

const bus = new EventEmitter()

function onNoteAdded(note) {
  console.log(`新笔记：${note.text}`)
}

bus.on("note:added", onNoteAdded)      // 注册
bus.once("note:added", (n) => console.log("只提醒一次"))  // 触发一次后自动移除
bus.emit("note:added", { text: "学事件" })  // 触发，参数照常传
bus.off("note:added", onNoteAdded)     // 注销（别名 removeListener）
```

约定俗成的命名是"名词:动作"或过去式（`note:added`、`connected`）。事件是**同步派发**的：`emit` 逐个调用监听器，调用顺序 = 注册顺序，全部执行完 `emit` 才返回。

## error 是特殊事件

EventEmitter 有一条铁律：**`"error"` 事件没有监听器时，直接把错误抛出、进程崩溃**。这是故意的——错误被静默吞掉比崩溃危险得多：

```js
const server = createServer(handler)
server.on("error", (err) => console.error("服务器出错但不崩：", err))
// 不写这行，端口占用等错误会直接把进程干掉
```

所以每个"可能出错的对象"，拿到手先挂 error 监听器，是 Node 代码的标准起手式。

## 让自己的类可发事件

继承一个类就能获得完整的发布订阅能力，适合"状态会被多方关心"的组件：

```js
import { EventEmitter } from "node:events"
import { loadNotes, saveNotes } from "./store.js"

class NoteStore extends EventEmitter {
  async add(text) {
    const notes = await loadNotes()
    const note = { id: Date.now(), text }
    notes.push(note)
    await saveNotes(notes)
    this.emit("changed", { type: "add", note })   // 谁关心谁来听
    return note
  }
}

const store = new NoteStore()
store.on("changed", ({ type }) => console.log("存储变了：", type))
```

和另外两种解耦方式对照着选：**回调**适合"一对一、必然发生"（每个请求调一次 handler）；**Promise** 适合"一次调用一个结果"；**事件**适合"一对多、随时发生、次数不定"。

## 监听器泄漏：长期运行服务的头号内存病

```text
(node:12345) MaxListenersExceededWarning: Possible EventEmitter memory leak
detected. 11 note:added listeners added. Use emitter.setMaxListeners() to increase limit
```

这个警告的意思是：**同一个事件挂了超过 10 个监听器**，十有八九是每次调用都 `on` 却从不 `off`——比如 HTTP 回调里给全局 bus 注册监听，每个请求加一个，服务跑一天内存就满了。两个排查方向：

```js
bus.listenerCount("note:added")     // 当前挂了几个
bus.off("note:added", handler)      // 用完就摘
// 或者一次性响应：bus.once(...)
```

`setMaxListeners(0)` 能关掉警告，但那是掩盖问题不是修问题——先问"为什么监听器越挂越多"。

## 踩坑提示

- 在监听器里 emit 同一个事件（自己触发自己）→ 无限递归爆栈。
- 以为 `emit` 后能拿到监听器的返回值——事件是单向广播，要结果用回调参数或 Promise。
- 异步场景注册监听、忘了还没注册时事件已经发出（竞态）——先注册，再启动会发事件的逻辑。
- `off` 时传了不同的函数引用——匿名函数注销不了，注册时把引用存下来。

## 练习

1. 给 `NoteStore` 加 `remove(id)` 方法并 emit 不同 type 的 `changed`，写两个监听器分别统计 add 和 remove。
2. 构造一个泄漏：循环 20 次给同一事件 `on` 一个新函数，观察警告，再用 `listenerCount` + `removeAllListeners` 修复。
3. 用 `once` 实现"等待第一个 error 或成功"的一次性逻辑，和 Promise 包装（`events.once(emitter, 'x')`）各写一遍。
