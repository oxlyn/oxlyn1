---
title: "ArkTS 鸿蒙开发入门 · 第 5 章：渲染控制与 UI 复用"
description: "if/ForEach/LazyForEach 渲染控制、键生成器的重要性，@Builder/@Styles/@Extend 复用手法。"
publishDate: 2026-08-05T09:00:00
tags: ["arkts", "harmonyos", "教程"]
---

> 本文对应官方文档[基本语法概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-basic-syntax-overview)、[@Builder](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-builder)与[UI 装饰器总览](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-decorator-overview)。

**学习目标**：掌握三类渲染控制语句，理解键生成器对刷新性能的影响，学会三种 UI 复用手法。

## 条件渲染：if/else 就是 UI 的分支

`build()` 里可以直接写 `if/else`，条件变化时框架增删对应分支的组件：

```ts
build() {
  Column() {
    if (this.loading) {
      LoadingProgress().width(40).height(40)
    } else if (this.error !== '') {
      Text(this.error).fontColor(Color.Red)
    } else {
      PostList({ posts: this.posts })
    }
  }
}
```

与判别联合配合是标准姿势（[TS 系列第 4 章](/posts/typescript-core/04-narrowing.md)）：状态对象设计成互斥成员，UI 按判别字段分支——**非法状态渲染不出来**。

## ForEach：键生成器是性能开关

```ts
ForEach(
  this.items,                          // 数据源
  (item: Item, index: number) => {     // itemGenerator：生成组件
    ListItem() { ItemCard({ item: item }) }
  },
  (item: Item) => item.id.toString()   // keyGenerator：身份标识
)
```

框架靠**键**判断"哪些项是新的、哪些没变"：键稳定时，数据更新只重建变化的项；键缺失或不稳定（比如用索引当键），一次增删就是全量重建——列表闪烁、输入丢失都源于此。规则只有一条：**键用数据里稳定的唯一标识，永远不用 index**。

长列表（几百上千条）再进一步：`LazyForEach` 配合 `IDataSource` 数据源做**按需渲染**，滚到哪加载到哪——List + LazyForEach 是鸿蒙列表的标配组合。

## @Builder：抽一段 UI 出来

重复的 UI 片段抽成 `@Builder` 方法——它不是组件，是**轻量构建函数**（无生命周期、无独立状态）：

```ts
@Builder
function tag(text: string) {
  Text(text)
    .fontSize(12)
    .padding({ left: 8, right: 8 })
    .backgroundColor('#F1F3F5')
    .borderRadius(4)
}

// build() 里
Row({ space: 8 }) {
  tag('hot')
  tag('new')
}
```

复杂卡片内部拆分、列头/单元格复用都用它。粒度判断：**需要独立状态和生命周期 → 自定义组件；只是渲染片段 → @Builder**——和 Astro 主题系列[组件分层](/posts/astro-theme-dev/01-theme-skeleton.md)（layout 部件/UI 部件）的判断逻辑一致。

## @Styles 与 @Extend：样式复用

- `@Styles`：把一串**通用属性**（尺寸、边距、圆角）打包成方法，组件间共享；
- `@Extend(Component)`：扩展**特定组件**的属性组合，可以带参数，比 @Styles 表达力强。

```ts
@Styles function card() {
  .padding(12)
  .borderRadius(12)
  .backgroundColor(Color.White)
}

@Extend(Text) function emphasis() {
  .fontWeight(FontWeight.Bold)
  .fontColor('#0A59F7')
}

Column() {
  Text('重点').emphasis()
}.card()
```

定义一次、处处引用——换主题、调间距时只动一处，和 CSS 变量做 token（[Astro 主题系列第 4 章](/posts/astro-theme-dev/04-styling-theming.md)）是同一个工程思想。

## 踩坑提示

- ForEach 的 itemGenerator 里不要再包一层耗时计算——数据先在状态层算好（或用 @Computed，第 7 章）。
- @Builder 按值传参时父组件更新不会刷新它，需要响应式传引用参数——官方 Builder 文档的"按引用传递"小节务必读。
- 滚动容器（Scroll/List）必须给**确定的高度或 layoutWeight**，否则内容撑不开或直接不滚。

## 练习

1. 给第 3 章的 TodoPage 加"全部/未完成/已完成"三个过滤分支（if + 状态）。
2. 故意把 ForEach 键改成 index，在列表头部插入一项，观察输入框内容的错位。
3. 把 ItemCard 的公共样式抽成 @Styles/@Extend，统计省了多少行。
