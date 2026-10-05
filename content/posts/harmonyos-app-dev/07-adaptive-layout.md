---
title: "鸿蒙应用开发 · 第 7 章：一多适配"
description: "一套工程多端部署：断点监听、栅格布局、自适应能力，以及列表-详情双栏的完整实战。"
publishDate: 2026-08-07T09:00:00
tags: ["harmonyos", "arkts", "教程"]
---

> 本文对应官方文档"一多"开发系列（[多端应用开发概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/multi-device-app-dev-overview)）。

**学习目标**：掌握断点与栅格两大机制，把单栏应用改造成宽屏双栏，建立"一多"布局观。

## 一多：一次开发，多端部署

同一套代码要跑在手机（竖屏窄）、折叠屏（展开近方形）、平板/PC（宽屏）上——"一多"（一次开发、多端部署）的目标是**布局自适应，不是为每端写一套**。核心思想与 Web 响应式（[Astro 主题系列第 4 章](/posts/astro-theme-dev/04-styling-theming.md)的 token 思想）一致：**布局跟随窗口能力，而不是跟随设备假设**。

## 断点：给窗口宽度分档

框架把宽度分成 sm/md/lg 三档（窗口级，可自定义），监听断点变化重新渲染布局：

```ts
@Entry
@Component
struct AppShell {
  @StorageProp('currentBreakpoint') bp: string = 'sm'

  build() {
    if (this.bp === 'lg') {
      TwoColumnLayout()      // 宽屏：列表 + 详情双栏
    } else {
      StackNavLayout()       // 窄屏：单栏 + 导航栈
    }
  }
}
```

断点值由框架写入 AppStorage（配一行挂载代码），[第 4 章](/posts/harmonyos-app-dev/04-state-v1.md)的 @StorageProp 直接消费——**UI 分支跟着窗口宽度走**。

## 栅格：对齐的骨架

GridRow/GridCol 是栅格容器：一行 12 列，子项按断点声明跨列数——宽屏一个卡片占 4 列（一排三个），窄屏占 12 列（一排一个）：

```ts
GridRow({ columns: { sm: 4, md: 8, lg: 12 }, gutter: 12 }) {
  GridCol({ span: { sm: 4, md: 4, lg: 4 } }) {
    ArticleCard({ post: a })
  }
  GridCol({ span: { sm: 4, md: 4, lg: 4 } }) {
    ArticleCard({ post: b })
  }
  GridCol({ span: { sm: 4, md: 8, lg: 4 } }) {
    ArticleCard({ post: c })
  }
}
```

同一个组件无需感知屏幕——**声明它在各档位下占多少列**，排列交给栅格。还有两个自适应小能力常配合使用：`Flex` 的 `wrap` 折行、`layoutWeight` 拉伸分配（第 3 章的 `layoutWeight(1)` 在双栏里就是"详情占满剩余"）。

## 实战：列表-详情双栏

资讯 App 的经典改造——窄屏点列表进详情页（[ArkTS 第 6 章](/posts/arkts-dev/06-lifecycle-routing.md)的路由），宽屏左列表右详情原地切换：

```ts
@Entry
@Component
struct NewsHome {
  @State selectedId: number = -1
  @StorageProp('currentBreakpoint') bp: string = 'sm'

  build() {
    Row() {
      PostList({ onSelect: (id: number) => this.open(id) })
        .layoutWeight(this.bp === 'lg' ? 2 : 1)

      if (this.bp === 'lg' && this.selectedId > 0) {
        Divider().vertical(true)
        PostDetail({ id: this.selectedId }).layoutWeight(3)
      }
    }
  }

  private open(id: number) {
    if (this.bp === 'lg') {
      this.selectedId = id           // 宽屏：原地切换
    } else {
      this.pathStack.pushPathByName('detail', { id })   // 窄屏：路由跳转
    }
  }
}
```

这套"同一动作、断点决定形态"的写法，配合 Navigation 的自适应模式（官方 Navigation 支持宽屏自动分栏），让信息架构天然跨端。

## 踩坑提示

- 尺寸单位用 vp/fp（虚拟像素/字体像素），写死 px 在高密度屏上会小成蚂蚁。
- 折叠屏的**展开瞬间**是断点切换，不是重启——状态要原地保持（selectedId 之类别放 aboutToAppear 里重置）。
- 双栏里详情页复用同一组件时，注意它内部不能依赖"自己是路由页"的假设（@Entry 专属钩子不可用）。

## 练习

1. 把资讯 App 的首页改造成 lg 双栏（列表 2 : 详情 3），窄屏回归单栏路由。
2. 用 GridRow 重做文章网格：sm 一列、md 两列、lg 三列。
3. 在模拟器里切折叠屏展开态，验证断点切换时选中文章不丢。
