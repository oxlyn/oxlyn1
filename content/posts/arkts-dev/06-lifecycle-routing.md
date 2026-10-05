---
title: "ArkTS 鸿蒙开发入门 · 第 6 章：生命周期与页面路由"
description: "组件与页面的生命周期钩子、router 页面跳转与参数传递、返回键的拦截。"
publishDate: 2026-08-18T09:00:00
tags: ["arkts", "harmonyos", "教程"]
---

> 本文对应官方文档[自定义组件的生命周期](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-page-custom-components-lifecycle)。

**学习目标**：分清"组件生命周期"与"页面生命周期"，掌握路由跳转与参数传递的全套姿势。

## 两套生命周期，别混

- **组件生命周期**（所有 @Component）：`aboutToAppear`（创建后、build 前）→ `aboutToDisappear`（销毁前）——数据加载、监听注册/注销在这里；
- **页面生命周期**（仅 @Entry 页面）：`onPageShow` / `onPageHide` / `onBackPress`——页面的可见性变化（从别的页回来、切后台）在这里。

```ts
@Entry
@Component
struct Detail {
  @State post: Post | null = null
  private timer: number = -1

  aboutToAppear() {
    this.load()                          // 异步取数（第 8 章）
    this.timer = setInterval(() => this.tick(), 1000)
  }

  aboutToDisappear() {
    clearInterval(this.timer)            // 有注册必有注销
  }

  onPageShow() { /* 从其他页面返回时刷新数据 */ }

  onBackPress(): boolean {
    return false                         // true = 自己处理返回（如弹确认框）
  }

  build() { /* ... */ }
}
```

对称纪律与[JS 系列第 2 章](/posts/javascript-core/02-objects-and-arrays.md)的 effect 思想一致：**aboutToAppear 里申请的资源，aboutToDisappear 里必须释放**——定时器、事件监听、Worker（第 9 章）都算。漏一个就是内存泄漏加幽灵回调。

## 路由：跳转、参数、返回

页面（@Entry 标记的组件）之间用 `router` 跳转：

```ts
import { router } from '@kit.ArkUI'

// 发起方：push 带参数
router.pushUrl({
  url: 'pages/Detail',
  params: { id: 42, from: 'list' } as DetailParams
})

// 目标页：取参数
const params = router.getParams() as DetailParams
this.load(params.id)

// 返回并带回数据
router.back({ url: 'pages/Index' })
```

工程约束：**页面必须在 `resources/base/profile/main_pages.json` 注册**才能路由——跳转白屏/报"页面不存在"，先查注册表。这和 Astro 的文件路由（[建站系列第 2 章](/posts/astro-from-scratch/02-routing/)）一个哲学：框架要有页面清单，只是鸿蒙靠配置文件手动维护。

类型安全靠你自己：`getParams()` 返回的是无类型的对象，`as DetailParams` 是信任声明（[TS 第 8 章](/posts/typescript-core/08-any-unknown-never.md)的断言纪律适用于此）——参数结构最好抽成共享的 interface，两端同一份定义。

## router 的局限与 Navigation 的登场

router 是第一代路由：页面栈扁平、转场定制弱、复杂嵌套（Tabs 内页签导航）表达吃力。API 10+ 官方主推 **Navigation** 导航体系（NavDestination 子页 + NavPathStack 栈管理），转场动画、一多适配、嵌套场景全面占优——新项目直接用 Navigation，第 10 章展开它的完整用法。本章的 router 知识仍然必要：存量代码和简单场景还在用它。

## 踩坑提示

- `pushUrl` 后目标页才创建，`aboutToAppear` 里取参数即可，别在构造逻辑里。
- 用 `replaceUrl` 做"登录后进主页"这类**不留历史**的跳转，否则返回键会退回登录页。
- onBackPress 返回 true 却忘了自己处理返回，用户就"卡"在页面上了。

## 练习

1. 做一个列表页 + 详情页：列表 push 传 id，详情页 aboutToAppear 里取参加载。
2. 详情页加 onBackPress 拦截：数据未保存时弹确认对话框（AlertDialog）。
3. 在详情页的 aboutToDisappear 里打印日志，配合预览器验证生命周期顺序。
