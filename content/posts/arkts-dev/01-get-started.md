---
title: "ArkTS 鸿蒙开发入门 · 第 1 章：初识 ArkTS"
description: "ArkTS 与 TS 的关系、DevEco Studio 工程创建，以及第一个页面的完整解剖。"
publishDate: 2026-07-20T09:00:00
tags: ["arkts", "harmonyos", "教程"]
---

> 本文对应官方文档[初识 ArkTS](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-get-started)。

**学习目标**：理解 ArkTS 的定位，跑起第一个 HarmonyOS 页面，读懂页面的每个组成部分。

## ArkTS 是什么

官方定义一句话：**ArkTS 是 HarmonyOS 应用的默认开发语言，在 TypeScript 生态基础上做了扩展，通过规范强化静态检查和分析，提升稳定性与性能**。

拆开看是三层：

- **语言层**：TS 的收紧子集 + 扩展（第 2 章展开四条核心差异）；
- **UI 层**：ArkUI 声明式框架——状态变化驱动界面刷新，不手动操作视图（第 3 章起）；
- **运行层**：方舟编译器（ArkCompiler），配合静态类型做 AOT 优化——这也是语言收紧的动机。

注意它**兼容 TS/JS 生态**：老代码可以复用，但应用主战场是 ArkTS。

## 从工程到页面

DevEco Studio 新建 **Empty Ability** 工程后，核心目录长这样：

```
entry/src/main/
├── ets/
│   ├── entryability/EntryAbility.ets   # 应用入口（第 10 章展开）
│   └── pages/Index.ets                 # 首页
├── resources/                          # 字符串、图片、颜色等资源
└── module.json5                        # 模块配置（权限、页面注册）
```

跑起来点两下：预览器（Previewer）看单页，模拟器/真机跑全流程。

## 解剖第一个页面

```ts
// pages/Index.ets
@Entry
@Component
struct Index {
  @State message: string = 'Hello ArkTS'

  build() {
    Column({ space: 12 }) {
      Text(this.message)
        .fontSize(32)
        .fontWeight(FontWeight.Bold)
      Button('点我')
        .onClick(() => {
          this.message = '被点过了'
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
  }
}
```

五个组成部分，本系列反复出现：

- `@Entry`：标记为**独立页面**（可路由到）；
- `@Component`：自定义组件，UI 的基本组织单位；
- `struct Index`：ArkUI 组件用 struct 而非 class——它不是普通数据结构，是框架管理的组件声明；
- `@State message`：状态变量——改它，绑定它的 UI 自动刷新（第 4 章的主题）；
- `build()`：UI 描述函数——**声明**界面长什么样，而不是命令式地创建控件。

`Text(this.message).fontSize(32)` 这串点号是 ArkUI 的**链式属性语法**：组件后接配置方法，可读性和数据驱动都好过 XML/JSON 布局。

对照一下你熟悉的世界：[JS 系列第 10 章](/posts/javascript-core/10-dom-and-events/)里更新界面要 `querySelector` + 改文本节点，这里只改 `message`，框架负责渲染——这个"转身"是 ArkTS 开发最核心的心智迁移，Astro/Vue/React 用户会有天然的既视感。

## 踩坑提示

- `build()` 里只能写 UI 描述（组件 + 属性 + 事件），不能写 `if` 裸语句、循环之外的任意逻辑——逻辑放事件回调或生命周期里。
- struct 里的普通变量不触发 UI 刷新，只有状态装饰器修饰的变量会（第 4 章解释为什么）。
- 预览器不覆盖系统能力（网络、权限、跨设备），涉及这些必须上模拟器/真机。

## 练习

1. 新建工程，把 Index 改成个人名片（头像 Image + 姓名 Text + 简介 Text）。
2. 加一个 Button，点击切换简介的显示/隐藏（需要 if 渲染控制，下一章预告）。
3. 在预览器里改 `message` 初值，确认 UI 即时更新——体会"预览器也跑状态驱动"。
