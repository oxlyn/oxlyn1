---
title: "JavaScript 核心入门 · 第 5 章：迭代器与生成器"
description: "for...of 的幕后协议、function* 的暂停恢复机制，以及异步生成器——流式数据的处理利器。"
publishDate: 2026-07-24T09:00:00
tags: ["javascript", "教程"]
---

> 本文对应 MDN 指南[迭代器与生成器](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Iterators_and_generators)。

**学习目标**：理解迭代协议（Iterator/Iterable），掌握生成器的暂停-恢复模型，认识异步生成器在流式场景的价值。

## 迭代协议：for...of 的幕后

数组能被 `for...of` 遍历、能被展开，不是特例而是**协议**：任何对象只要实现了 `[Symbol.iterator]()` 方法（返回一个带 `next()` 的迭代器），就是可迭代的。`for...of`、展开运算符、解构全走这条协议：

```js
const range = {
  from: 1, to: 3,
  [Symbol.iterator]() {
    let cur = this.from
    return {                       // 迭代器
      next: () =>
        cur <= this.to
          ? { value: cur++, done: false }
          : { value: undefined, done: true },
    }
  },
}
console.log([...range])            // [1, 2, 3]——自定义对象也能展开
```

协议的好处：**消费端只认协议，不关心数据从哪来**——数组、字符串、Map、生成器、甚至无限序列，同一套 `for...of` 通吃。

## 生成器：会暂停的函数

`function*` 定义的生成器函数，调用后不执行，返回一个迭代器；每次 `next()` 执行到下一个 `yield` 暂停，把值交出去，下次从暂停点继续：

```js
function* fib() {
  let [a, b] = [0, 1]
  while (true) {                   // 无限序列也不会死循环
    yield a
    ;[a, b] = [b, a + b]
  }
}

const it = fib()
it.next().value                    // 0
it.next().value                    // 1
it.next().value                    // 1

// 惰性取用：要多少算多少
for (const n of fib()) {
  if (n > 100) break
  console.log(n)
}
```

和手写迭代器对比：同样的协议，状态机（暂停点、变量、循环）由语言替你管理，`yield` 一下就完事。**惰性求值**是它最大的工程价值：处理大文件、分页接口、无限流时，内存里永远只有"当前这一段"。

`yield*` 可以委托给另一个生成器，组合生成器时常用。

## 异步生成器：流式处理的钥匙

`for await...of` + `async function*` 把同一套协议搬到异步世界——每次 next 返回 Promise，循环体等待每个值：

```js
async function* lines(file) {
  for await (const chunk of file.stream()) {
    // 每次给出一行，而不是整个文件
    yield* chunk.toString().split('\n')
  }
}
```

这正是[《从零实现 Agent》第 3 章](/posts/agent-from-scratch/03-streaming/)流式响应的处理方式：LLM 的 SSE 事件流就是一个异步生成器，`for await` 逐个消费 token，界面逐字上屏。读到本系列第 6、7 章后，回头再看那个例子会完全透明。

## 踩坑提示

- 生成器**惰性**：`[...fib()]` 会永远跑下去（无限序列直接展开必死），消费必须配 `take`/`break`。
- 生成器对象是一次性的：跑完 done 就废了，需要重新遍历就重新调用生成器函数。
- `for...of`（迭代协议）和 `for...in`（枚举键，含原型链）完全两回事——遍历值用前者。

## 练习

1. 写一个生成器 `chunk(arr, size)`：把数组按 size 切块逐个 yield。
2. 写 `take(iter, n)`：从任意迭代器取前 n 个，验证对无限生成器可用。
3. 把 fib 生成器接到 `for await...of` 上（包一层 async 生成器），体会两套协议的同构。
