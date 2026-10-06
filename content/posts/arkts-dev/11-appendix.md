---
title: "ArkTS 鸿蒙开发入门 · 附录：装饰器速查与资源"
description: "ArkTS 开发一页速查：V1/V2 状态装饰器表、生命周期表、常用组件，附官方学习资源。"
publishDate: 2026-07-06T09:00:00
tags: ["arkts", "harmonyos", "教程"]
---

## 状态装饰器速查（依据官方装饰器总览）

**V1 体系**（@Component 组件内）：

| 装饰器 | 用途 |
| --- | --- |
| `@State` | 组件内状态（观察第一层） |
| `@Prop` | 父 → 子单向同步（深拷贝副本） |
| `@Link` | 父 ↔ 子双向同步（共享引用） |
| `@Provide` / `@Consume` | 祖先 ↔ 后代跨层双向 |
| `@Observed` / `@ObjectLink` | 嵌套类对象的深观察 |
| `@Track` | 类属性级精细更新 |
| `@Watch` | 状态变化回调 |
| `@StorageLink/Prop` | 与 AppStorage（应用级仓库）同步 |
| `@LocalStorageLink/Prop` | 与 LocalStorage（页面级仓库）同步 |
| `@Reusable` | 组件可复用池 |

**V2 体系**（@ComponentV2 组件内，不可与 V1 混用）：

| V1 对应 | V2 装饰器 |
| --- | --- |
| @State | `@Local` |
| @Prop | `@Param`（+ `@Once` 只同步一次） |
| @Link 双向 | `@Param` + `@Event` 显式回调 |
| @Provide/@Consume | `@Provider` / `@Consumer` |
| @Watch | `@Monitor` |
| @Observed/@ObjectLink | `@ObservedV2` + `@Trace`（属性级） |
| —— | `@Computed` 计算属性 |

**UI 复用**：`@Builder` 构建函数、`@Styles` 通用属性、`@Extend` 组件扩展。
**并发**：`@Concurrent` 子线程任务、`@Sendable` 跨线程对象。

## 生命周期表

| 范围 | 钩子 | 用途 |
| --- | --- | --- |
| 组件 | `aboutToAppear` / `aboutToDisappear` | 取数与注册 / 注销与清理 |
| 页面（@Entry） | `onPageShow` / `onPageHide` / `onBackPress` | 可见性与返回拦截 |
| UIAbility | `onCreate` / `onWindowStageCreate` / `onForeground` / `onBackground` / `onDestroy` | 应用容器全生命周期 |

## 常用内置组件

- **布局**：Column / Row / Stack / Grid / List + ListItem
- **基础**：Text / Image / Button / TextInput / Toggle / LoadingProgress / Divider
- **滚动**：Scroll / List（长列表配 LazyForEach）
- **导航**：Navigation + NavDestination（新）/ router（存量）

## 十章一图

| 主线 | 章节 | 一句话 |
| --- | --- | --- |
| 语言层 | [1](/posts/arkts-dev/01-get-started/) [2](/posts/arkts-dev/02-arkts-vs-ts/) | TS 收紧四条：全静态、布局不变、运算符收紧、名义类型 |
| UI 层 | [3](/posts/arkts-dev/03-declarative-ui/) [4](/posts/arkts-dev/04-state-v1/) [5](/posts/arkts-dev/05-render-control/) [6](/posts/arkts-dev/06-lifecycle-routing/) [7](/posts/arkts-dev/07-state-deep-and-v2/) | UI 是状态的函数；装饰器决定数据流 |
| 系统层 | [8](/posts/arkts-dev/08-async-network/) [9](/posts/arkts-dev/09-concurrency/) [10](/posts/arkts-dev/10-app-framework/) | 网络、TaskPool 并发、Ability 与 Navigation |

## 官方资源

- [HarmonyOS 开发文档](https://developer.huawei.com/consumer/cn/doc/)——本系列依据，指南按 Kit 组织
- [ArkTS 学习路线](https://developer.huawei.com/consumer/cn/arkts/)——官方编写的进阶路径
- [ HarmonyOS Samples](https://gitee.com/openharmony/applications_app_samples)——官方示例仓库，按特性检索
- [API 参考](https://developer.huawei.com/consumer/cn/doc/harmonyos-references/)——接口手册

## 站内延伸

- 前置：[《JavaScript 核心入门》](/posts/javascript-core/)（异步/闭包）→ [《TypeScript 核心入门》](/posts/typescript-core/)（类型系统）
- 对照：[《Astro 主题开发》](/posts/astro-theme-dev/)的组件与 Props 思想（[第 2 章](/posts/astro-theme-dev/02-components-props.md)、[第 6 章配置收敛](/posts/astro-theme-dev/06-theme-config.md)）与 ArkUI 的声明式组件同构；[《从零实现 Agent》](/posts/agent-from-scratch/)的状态机思想对应判别联合建模
