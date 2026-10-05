---
title: "ArkTS 鸿蒙开发入门 · 第 4 章：状态管理 V1"
description: "@State 的观察能力、父子组件的 @Prop/@Link 单双向同步、@Provide/@Consume 跨层传递。"
publishDate: 2026-07-23T09:00:00
tags: ["arkts", "harmonyos", "教程"]
---

> 本文对应官方文档[状态管理概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-state-management-overview)与各装饰器专页（[@State](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-state)、[@Prop](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-prop)、[@Link](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-link)）。

**学习目标**：建立"状态归属"的判断力，掌握 V1 装饰器家族的数据流向。

## 状态的归属决定装饰器

状态管理 V1 的一切装饰器，都在回答一个问题：**这份数据归谁、谁能改它、变化要通知谁**。先给决策表，再逐个展开：

| 装饰器 | 归属 | 数据流 | 典型场景 |
| --- | --- | --- | --- |
| `@State` | 组件私有 | 组件内 | 页面自己的数据源 |
| `@Prop` | 子组件持有副本 | 父 → 子（单向） | 只读展示，子不回写 |
| `@Link` | 父子共享同一份 | 父 ↔ 子（双向） | 表单联动、开关 |
| `@Provide`/`@Consume` | 跨层级共享 | 祖先 ↔ 后代（双向） | 主题、用户信息 |
| `@Watch` | —— | 回调通知 | 状态变化时的副作用 |

## @State：组件内的数据源

[第 3 章](/posts/arkts-dev/03-declarative-ui.md)已见：被 `@State` 装饰的变量变化时，**绑定它的 UI 组件**重新渲染。注意观察能力的边界——**只观察第一层**：

```ts
@State user: User = new User('Oxlyn', 1)

this.user.level = 2      // 触发刷新：第一层属性
this.user.profile.bio = 'x'  // 不触发！嵌套第二层
this.user = new User('Ox', 2)   // 触发：整体替换
```

嵌套对象的深观察是 V1 的经典痛点，解法（@Observed/@ObjectLink）在第 7 章。数组的 `push/splice` 能被观察到（框架代理了数组方法），但**对象内新增属性不行**——正好是[第 2 章](/posts/arkts-dev/02-arkts-vs-ts.md)"布局不可变"约束的体现。

## @Prop / @Link：父子之间

```ts
@Component
struct StepCounter {
  @Prop value: number = 0          // 单向：父变子跟着变，子改自己不回传
  @Link synced: number             // 双向：改谁都是同一份

  build() {
    Row() {
      Text(`值: ${this.value}`)
      Button('+').onClick(() => this.synced++)
    }
  }
}

// 父组件里
StepCounter({ value: this.count, synced: this.count! })
```

- `@Prop` 是**深拷贝副本**：父刷新时子同步，子内部改动是私有的——适合"纯展示"子组件；
- `@Link` 是**引用同步**：父子共享一份数据，子组件的修改父立刻可见——适合双向控件。父组件传参时不加引号直接传状态变量。

判断标准一句话：**子组件需不需要"改回父组件"？** 不需要就用 @Prop（数据流更干净），需要才用 @Link。

## @Provide / @Consume：跨层直通车

组件树超过两层后，逐层传 @Prop/@Link 会形成"中间人地狱"。@Provide 在祖先声明、@Consume 在任意后代取，**中间层完全无感**：

```ts
@Component
struct App {
  @Provide('theme') theme: string = 'dark'
}
// 任意深度的后代
@Component
struct Badge {
  @Consume('theme') theme: string
}
```

典型用途：主题、登录态、全局配置。它本质是"键共享"——和 React Context、Astro 的全局配置文件（[主题系列第 6 章](/posts/astro-theme-dev/06-theme-config.md)）解决同一个问题，只是这里语言级集成。应用级状态用 `AppStorage` + `@StorageLink`（键值中心仓库），思路同源。

## @Watch：变化回调

@Watch 不参与数据流，只注册"变化时回调"——副作用（日志、请求、联动赋值）放这里：

```ts
@State @Watch('onQueryChange') keyword: string = ''

onQueryChange(propName: string) {
  this.search(this.keyword)        // 严禁在回调里再改这个被监听的变量（会循环）
}
```

## 踩坑提示

- @Prop 深拷贝有成本，大对象/长列表用 @ObjectLink（第 7 章）或拆状态。
- @Link 只能由 @State/@Provide 等状态变量同步而来，传普通变量编译报错。
- 在 @Watch 回调里改被监听的变量 = 无限循环；需要级联变化时改"另一个"状态。

## 练习

1. 写一个带最小值/最大值的步进器组件，用 @Link 双向同步。
2. 把主题字符串改成 @Provide/@Consume，加一个三层嵌套的子组件验证跨层同步。
3. 给搜索框的 @State 加 @Watch，实现输入防抖搜索（防抖函数用[JS 第 10 章](/posts/javascript-core/10-dom-and-events.md)的实现）。
