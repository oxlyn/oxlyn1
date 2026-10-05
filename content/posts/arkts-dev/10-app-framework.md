---
title: "ArkTS 鸿蒙开发入门 · 第 10 章：应用框架"
description: "UIAbility 生命周期、Navigation 导航体系、Tabs 与工程结构：把页面组装成应用。"
publishDate: 2026-08-22T09:00:00
tags: ["arkts", "harmonyos", "教程"]
---

> 本文对应官方文档 [UIAbility 生命周期](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/uiability-lifecycle)与 [Navigation](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-navigation-navigation)。

**学习目标**：理解应用的最小运行单元 UIAbility，用 Navigation 组织多页面，理清工程配置全貌。

## UIAbility：应用的容器

页面（@Entry）之上还有一层：**UIAbility** 是具备生命周期的应用组件，承载 UI 与系统能力的连接。一个应用可以多个 Ability，最小工程就是一个 EntryAbility：

```ts
import { UIAbility } from '@kit.AbilityKit'

export default class EntryAbility extends UIAbility {
  onCreate(want: Want): void { /* 应用创建：初始化全局数据 */ }
  onWindowStageCreate(stage: window.WindowStage): void {
    stage.loadContent('pages/Index')     // 挂载首页
  }
  onForeground(): void { /* 回到前台 */ }
  onBackground(): void { /* 退到后台：暂停任务、保存状态 */ }
  onDestroy(): void { /* 销毁：释放一切 */ }
}
```

生命周期与[第 6 章](/posts/arkts-dev/06-lifecycle-routing.md)页面钩子的关系：Ability 管"进程级的可见性"（前后台切换、销毁），页面管"栈内的可见性"（push/back）——数据保存放 onBackground，比等 onDestroy 靠谱（进程可能被直接回收）。

## Navigation：现代导航体系

[第 6 章](/posts/arkts-dev/06-lifecycle-routing.md)预告过的 Navigation，用**一个主容器 + 栈管理**替代多页面注册：

```ts
@Entry
@Component
struct Main {
  pathStack: NavPathStack = new NavPathStack()

  build() {
    Navigation(this.pathStack) {
      HomePage()
    }
    .mode(NavigationMode.Stack)
    .navDestination(this.destination)   // 名字 → 组件的映射
  }

  @Builder
  destination(name: string) {
    if (name === 'detail') {
      DetailPage()                      // NavDestination 包裹的子页
    }
  }
}

// 任意位置跳转：push 名字 + 参数
this.pathStack.pushPathByName('detail', { id: 42 })
// 子页里取参数：NavDestination 的 onReady 回调拿 pathStack 与 params
```

对比 router 的优势：子页是普通组件（可用状态装饰器全家桶）、转场与嵌套（Tabs 内导航）自然支持、参数全程可类型化。**新项目默认 Navigation，router 只用于维护存量**。

## Tabs：主界面骨架

App 主结构通常是 Tabs 底栏 + 内容区：

```ts
Tabs({ barPosition: BarPosition.End }) {
  TabContent() { HomePage() }.tabBar('首页')
  TabContent() { DiscoverPage() }.tabBar('发现')
  TabContent() { MinePage() }.tabBar('我的')
}
.barMode(BarMode.Fixed)
```

Tabs 内部再嵌 Navigation 栈，就是绝大多数应用的信息架构。

## 工程配置全貌

各文件职责一张表：

| 文件 | 职责 |
| --- | --- |
| `module.json5` | 模块声明：Ability 注册、权限（[第 8 章](/posts/arkts-dev/08-async-network.md)的 INTERNET）、页面注册（router 用） |
| `app.json5` | 应用级：包名、版本号 |
| `oh-package.json5` | 依赖管理（HarmonyOS 的 package.json，装三方库） |
| `resources/base/profile/main_pages.json` | router 页面清单 |
| `resources/` | 字符串/图片/颜色，`$r()` 引用 |

三方依赖生态：三方库在 oh-package 里声明后 import 使用，但注意[第 2 章](/posts/arkts-dev/02-arkts-vs-ts.md)——纯 JS 库要看是否兼容 ArkTS 约束。

## 踩坑提示

- onBackground 里不做持久化，进程被杀时数据全丢——关键状态写 Preferences/数据库要在退后台时机。
- Navigation 子页忘了用 NavDestination 包裹，返回手势与转场全部异常。
- 多 Ability 的应用，Want 参数传递是跨 Ability 的通道——别和页面参数混为一谈。

## 练习

1. 在 onBackground 打日志，用模拟器 Home 键验证前后台切换顺序。
2. 把第 6 章的 router 双页改成 Navigation 实现，对比参数传递的代码。
3. 搭一个 Tabs + 三页骨架，每页一个 Navigation 栈入口。
