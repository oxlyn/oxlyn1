---
title: "ArkTS 鸿蒙开发入门：从 TS 到 ArkUI"
description: "ArkTS 系列教程总览：语言层约束、声明式 UI 与状态管理、并发模型与应用框架的学习路线。"
publishDate: 2026-06-25T09:00:00
tags: ["arkts", "harmonyos", "教程"]
---

ArkTS 是 HarmonyOS（鸿蒙）应用的默认开发语言：在 TypeScript 生态基础上扩展，**收紧语言约束换取静态检查与运行性能**，再配上一套声明式 UI 框架（ArkUI）。对已经写过 TS 的人来说，上手 ArkTS 的难点不在语法，而在两个转身：**从"灵活的 TS"转到"约束的 ArkTS"**，以及**从"命令式操作 DOM"转到"声明式驱动 UI"**。

> 内容依据 HarmonyOS/OpenHarmony 官方文档（语言介绍、迁移规则、状态管理指南等）整理，代码示例均为原创，每章附官方文档链接。

## 系列定位与前置

本系列是[《JavaScript 核心入门》](/posts/javascript-core/)与[《TypeScript 核心入门》](/posts/typescript-core/)的续篇——ArkTS 的类型系统就是 TS 的收紧版，异步模型就是 JS 的事件循环。没有这两个前置也能读，但会频繁"知其然不知其所以然"。

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：初识 ArkTS](/posts/arkts-dev/01-get-started/) | 语言定位、DevEco Studio、第一个页面 | [初识 ArkTS](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-get-started) |
| [第 2 章：从 TS 到 ArkTS](/posts/arkts-dev/02-arkts-vs-ts/) | 四条语言约束与迁移心法 | [适配规则](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/typescript-to-arkts-migration-guide) |
| [第 3 章：声明式 UI 基础](/posts/arkts-dev/03-declarative-ui/) | struct/build、内置组件、链式属性 | [基本语法概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-basic-syntax-overview) |
| [第 4 章：状态管理 V1](/posts/arkts-dev/04-state-v1/) | @State/@Prop/@Link/@Provide/@Watch | [状态管理概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-state-management-overview) |
| [第 5 章：渲染控制与复用](/posts/arkts-dev/05-render-control/) | if/ForEach/LazyForEach、@Builder | [UI 装饰器总览](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-decorator-overview) |
| [第 6 章：生命周期与路由](/posts/arkts-dev/06-lifecycle-routing/) | 页面/组件生命周期、router 传参 | [生命周期](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-page-custom-components-lifecycle) |
| [第 7 章：深观察与状态 V2](/posts/arkts-dev/07-state-deep-and-v2/) | @Observed/@ObjectLink、V2 装饰器 | [V2 状态管理](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-new-observedV2-and-trace) |
| [第 8 章：异步与网络](/posts/arkts-dev/08-async-network/) | async/await、HTTP 请求与权限 | [Network Kit](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/network-http-request) |
| [第 9 章：并发模型](/posts/arkts-dev/09-concurrency/) | 线程隔离、TaskPool 与 @Sendable | [TaskPool](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/taskpool-introduction) |
| [第 10 章：应用框架](/posts/arkts-dev/10-app-framework/) | UIAbility、Navigation、工程结构 | [UIAbility 生命周期](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/uiability-lifecycle) |
| [附录：速查与资源](/posts/arkts-dev/11-appendix/) | 装饰器速查表、生命周期表、资源 | — |

## 三条主线

1. **语言层**（第 1、2 章）——ArkTS 与 TS 的四条核心差异，决定你写的代码"像不像 ArkTS"；
2. **UI 层**（第 3–7 章）——声明式范式 + 状态驱动刷新，重点是把"状态归属"想清楚；
3. **系统层**（第 8–10 章）——网络、并发、Ability 与导航，应用的骨架。

## 环境准备

- [DevEco Studio](https://developer.huawei.com/consumer/cn/deveco-studio/)（含 SDK、预览器、模拟器），新建工程选 **Empty Ability** 模板；
- 代码文件扩展名 `.ets`（ArkTS Source），UI 与逻辑都在其中；
- 预览器秒级看单页面效果，模拟器/真机跑完整应用——**预览器只渲染 UI，不覆盖系统能力**。

## 遗留问题

- 分布式、卡片（Widget）、动画专题未展开，官方文档均有独立章节。
- ArkTS 仍在快速演进（状态管理 V2、ArkTS 1.2 运行时），本系列以 API 12+ 的主干语法为准。
