---
title: "JavaScript 核心入门 · 第 10 章：DOM 与事件"
description: "查询与创建节点、事件监听与委托、防抖节流：浏览器端 JS 的最小必要知识。"
publishDate: 2026-08-10T09:00:00
tags: ["javascript", "教程"]
---

> 本文对应 MDN 的 [DOM 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Document_Object_Model)与[脚本化文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development/Core/Scripting)。

**学习目标**：掌握 DOM 的树模型与常用操作，理解事件流与委托，写一个不依赖任何框架的交互组件。

## DOM：页面即对象树

浏览器把 HTML 解析成一棵节点树，JS 通过 `document` 对象读写它——前九章的纯 JS 知识在这里第一次"看得见摸得着"。查询节点的现代标准姿势只有一个：

```js
const box = document.querySelector('#app')        // 第一个匹配（CSS 选择器）
const items = box.querySelectorAll('.item')       // 全部匹配（NodeList）
```

创建与挂载遵循"先造好、再上线"——离屏组装，一次挂载，避免反复触发重排：

```js
const list = document.createElement('ul')
for (const post of posts) {
  const li = document.createElement('li')
  li.textContent = post.title          // textContent 防注入；innerHTML 才有 XSS 风险
  li.className = 'post-item'
  list.append(li)
}
document.querySelector('#app').append(list)
```

改样式优先改 class（`el.classList.toggle('active')`）而不是内联 style——和第 4 章 Astro 样式的结论一致：样式归 CSS，JS 只负责状态。

## 事件流与委托

事件从 window 一路下潜到目标（捕获），再原路上浮（冒泡）。日常监听发生在冒泡阶段，由此得到一个杠杆：**父元素一个监听器，能服务所有子元素，包括未来才出现的**：

```js
list.addEventListener('click', (e) => {
  const li = e.target.closest('li')    // 从实际点击处向上找目标
  if (!li || !list.contains(li)) return
  console.log('选中:', li.textContent)
})
```

这就是**事件委托**：千条列表只挂一个监听器；SPA 里内容换了又换，委托监听器纹丝不动。`e.target`（实际点击的元素）与 `e.currentTarget`（挂监听器的元素）的区别是委托正确性的关键。

常用收尾动作：`e.preventDefault()` 阻止默认行为（如提交跳转），`e.stopPropagation()` 阻止继续冒泡——后者慎用，会截断其他监听者的感知。

## 防抖与节流

高频事件（input、scroll、resize）需要限频，两个闭包的经典应用（第 3 章）：

```js
const debounce = (fn, ms) => {         // 防抖：停止触发 ms 后才执行一次
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

const throttle = (fn, ms) => {         // 节流：每 ms 最多执行一次
  let last = 0
  return (...args) => {
    const now = Date.now()
    if (now - last < ms) return
    last = now
    fn(...args)
  }
}

search.addEventListener('input', debounce((e) => query(e.target.value), 300))
```

语义区分记一句话：防抖"等你说完"，节流"限个频率"。搜索框用防抖，滚动加载用节流。

## 框架时代的定位

Astro/Vue/React 都在替你操作 DOM，但这章不是屠龙之技：**理解 DOM 才能理解框架在替你做什么**（虚拟 DOM 的 diff、Astro 岛屿的水合边界），而主题里那些几行脚本的轻交互（本站的主题切换、移动菜单）用原生 DOM 直接写，反而是零依赖的最优解。

## 踩坑提示

- `innerHTML` 拼接用户输入 = XSS，展示用户内容用 `textContent`。
- 查询时机：脚本在 head 里时 DOM 还没生成，把 script 放 body 尾或用 `defer`。
- 委托里漏了 `closest` 的 null 检查，点到容器空白处直接报错。
- `querySelectorAll` 返回的是静态 NodeList（快照），之后新增的节点不在其中。

## 练习

1. 不用框架实现一个"待办清单"：输入、回车添加、点击删除（删除用事件委托）。
2. 给清单加"输入时实时搜索高亮"，接上 debounce，对比接与不接的触发次数。
3. 打开本站任意页面，在控制台用委托给全部文章链接挂 click 监听并打印 href。
