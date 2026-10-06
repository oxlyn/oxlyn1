---
title: "JavaScript 核心入门 · 第 4 章：原型与 class"
description: "class 是语法糖，原型链才是本体：构造、继承、私有字段，以及组合优于继承的工程判断。"
publishDate: 2026-05-24T09:00:00
tags: ["javascript", "教程"]
---

> 本文对应 MDN 指南[继承与原型链](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)与[使用类](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Using_classes)。

**学习目标**：理解原型链的查找机制，掌握 class 语法与继承，知道什么时候不该用继承。

## 原型链：属性查找的真相

JS 对象之间不是"类与实例"的关系，而是**链接**：读一个属性时，先查对象自身，没有就顺着 `__proto__` 指针往上找，直到链尾（null）：

```js
const base = { greet() { return `hi, ${this.name}` } }
const obj = Object.create(base)   // obj 的原型指向 base
obj.name = 'js'
obj.greet()                       // "hi, js"——greet 在原型上找到的
```

方法在原型上共享一份、数据在各自实例上，这就是 JS 的"面向对象"。写 `obj.greet()` 时 this 依然指向 obj（第 3 章的方法调用规则），所以原型方法能操作实例数据。

理解原型链的实用价值不在日常写 class，而在**读懂标准库和别人的代码**：数组的 `map` 挂在 `Array.prototype`，所有数组经原型链共享；给 `Array.prototype` 加方法（monkey-patch）能影响全部数组——所以别这么做。

## class：把原型包装成体面语法

class 不是新的运行时机制，是原型写法的语法糖，但代码可读性天差地别：

```js
class Store {
  #items = []                    // 私有字段：真私有，外部访问直接报错

  constructor(name) {
    this.name = name
  }

  add(item) { this.#items.push(item) }
  get size() { return this.#items.length }   // getter

  static from(list) {            // 静态方法：挂在类上而非实例
    const s = new Store('tmp')
    for (const i of list) s.add(i)
    return s
  }
}
```

继承用 `extends`，子类构造器里必须先 `super()`：

```js
class CachedStore extends Store {
  #cache = new Map()
  add(item) {
    this.#cache.set(item.id, item)
    super.add(item)              // 复用父类逻辑
  }
}
```

 instanceof 检查的真相也顺带揭晓：`a instanceof B` 沿着 a 的原型链找 `B.prototype`——原型链清楚了，它就不是魔法。

## 继承不是默认选项

class 继承解决"is-a"，但 JS 里更常用的工具是**组合与工厂**：需要"多个来源的能力"时，extends 的单链很快不够用；需要"带状态的行为"时，第 3 章的闭包工厂往往比类更轻：

```js
// 用工厂替代一个只有两个方法的类
const makeStore = () => {
  const items = []
  return { add: (i) => items.push(i), get size() { return items.length } }
}
```

工程判断：**有明确层次关系（Store → CachedStore）用 class；行为拼装、状态私有用闭包/组合**。第 3 章的 makeCounter 和这里的 makeStore 就是同一个思路——本站[《从零实现 Agent》](/posts/agent-from-scratch/)里大量运行时组件其实都是函数闭包而非类。

## 踩坑提示

- class 声明**没有提升**（本质是 let 绑定），定义前使用直接报错。
- 子类方法里忘了 `super.` 前缀，同名方法会无限递归调自己。
- `#private` 与 `_private` 命名约定是两回事：前者语言级强制，后者纯自觉。
- 在原型上存数据（而不是方法）会让所有实例共享同一份数据——数据放实例，方法放原型/class 体。

## 练习

1. 用 `Object.create` 手写一个带原型链的对象，在控制台展开它观察 `[[Prototype]]`。
2. 给 Store 类加 `remove(id)` 和迭代能力（提示：加一个 `*[Symbol.iterator]()`，第 5 章会讲语法）。
3. 把 CachedStore 改写成工厂函数版本（闭包实现），对比两种实现的行数与可读性。
