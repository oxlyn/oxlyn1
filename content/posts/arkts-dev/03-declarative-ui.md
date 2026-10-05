---
title: "ArkTS 鸿蒙开发入门 · 第 3 章：声明式 UI 基础"
description: "struct 与 build 的声明式范式、内置组件全家桶、链式属性与事件、常用布局容器。"
publishDate: 2026-07-10T09:00:00
tags: ["arkts", "harmonyos", "教程"]
---

> 本文对应官方文档[基本语法概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-basic-syntax-overview)。

**学习目标**：掌握声明式 UI 的描述方式，熟练使用布局容器与基础组件，理解"UI 是状态的函数"。

## 声明式：描述结果，而非过程

命令式 UI（[JS 系列第 10 章](/posts/javascript-core/10-dom-and-events.md)的 DOM 操作）回答"怎么改"；声明式 UI 回答"长什么样"——**UI 是状态的函数**，状态变了框架自动重算界面：

```ts
@Component
struct Counter {
  @State count: number = 0

  build() {
    Column({ space: 8 }) {
      Text(`点击了 ${this.count} 次`).fontSize(20)
      Button('加一').onClick(() => {
        this.count++        // 只改状态，不碰 UI
      })
    }
  }
}
```

`this.count++` 之后没有任何"更新 Text"的代码——框架检测到状态变化，重新执行受影响的 UI 描述。你从"操作界面的工人"变成"描述界面的设计师"。

## 布局容器：组合出界面

ArkUI 的布局是**容器嵌套**，常用五个：

| 容器 | 排列方式 |
| --- | --- |
| `Column` | 纵向排列，`space` 控制间距 |
| `Row` | 横向排列 |
| `Stack` | 层叠（子组件叠放，红点/浮层的标配） |
| `Grid` | 网格 |
| `List` | 滚动列表（第 5 章配合 LazyForEach） |

对齐与分布用链式属性：容器上 `justifyContent`（主轴）+ `alignItems`（交叉轴），子项上 `alignSelf`。

## 基础组件与链式属性

```ts
Text('标题')
  .fontSize(24)
  .fontWeight(FontWeight.Bold)
  .fontColor('#182431')
  .maxLines(1)
  .textOverflow({ overflow: TextOverflow.Ellipsis })

Image($r('app.media.avatar'))      // 引用 resources/media 下的图片
  .width(48).height(48).borderRadius(24)

TextInput({ placeholder: '搜索' })
  .onChange((value: string) => { this.keyword = value })

Button('提交')
  .enabled(this.canSubmit)
  .onClick(() => this.submit())
```

要点：属性方法全部链式、顺序无关；`$r('app.media.xxx')` 是资源引用语法（字符串、颜色同款 `$r('app.string.xxx')`）——**字面量进 resources，代码里只引用**，多语言与主题切换才有抓手。

## 一个完整的小页面

```ts
@Entry
@Component
struct TodoPage {
  @State items: string[] = ['买牛奶', '写周报']
  @State draft: string = ''

  build() {
    Column({ space: 12 }) {
      Row({ space: 8 }) {
        TextInput({ placeholder: '新事项', text: this.draft })
          .onChange((v: string) => this.draft = v)
          .layoutWeight(1)
        Button('添加')
          .onClick(() => {
            if (this.draft !== '') {
              this.items.push(this.draft)
              this.draft = ''
            }
          })
      }.width('100%')

      ForEach(this.items, (item: string) => {
        Text(item)
      }, (item: string) => item)
    }
    .padding(16)
    .width('100%')
    .height('100%')
  }
}
```

`layoutWeight(1)` 是弹性布局的关键（剩余空间分配，类似 flex:1）；`ForEach` 的第三个参数是键生成器——它的坑第 5 章细讲。

## 踩坑提示

- `build()` 内只允许 UI 描述；条件分支用 `if/else`（内置支持）、循环用 `ForEach`，不能写任意 JS 语句。
- 普通成员变量（无状态装饰器）变了**不触发刷新**——界面不动八成是忘了 `@State`（下一章）。
- 链式属性每次调用返回新的配置副本，把属性抽成常量复用要用 `@Styles`（第 5 章），不是存变量。

## 练习

1. 用 Column/Row/Stack 还原一个"聊天消息行"（头像 + 气泡 + 时间角标）。
2. 给 TodoPage 加删除：点击某条 Todo 移除它（提示：ForEach 的 itemGenerator 第二参数是索引）。
3. 把硬编码的颜色换成 `$r('app.color.xxx')` 资源引用。
