---
title: "鸿蒙应用开发 · 第 1 章：应用模型与模块化工程"
description: "Stage 模型的组件地图、HAP/HAR/HSP 三种包的分工，以及多模块工程的拆分策略。"
publishDate: 2026-08-01T09:00:00
tags: ["harmonyos", "arkts", "教程"]
---

> 本文对应官方文档[应用模型概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/abilitykit-overview)与 [AbilityStage](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/abilitystage)。

**学习目标**：理清 Stage 模型的组件地图，理解三种包的分工，学会把单模块工程拆成多模块。

## Stage 模型的组件地图

[ArkTS 系列第 10 章](/posts/arkts-dev/10-app-framework.md)见过 UIAbility，这里把 Stage 模型的完整拼图放在一起：

| 组件 | 角色 | 数量 |
| --- | --- | --- |
| `UIAbility` | 有界面的任务容器（一个任务一个） | 可多个 |
| `AbilityStage` | **模块级**生命周期（加载/配置变化） | 每模块一个 |
| `ExtensionAbility` | 无界面的扩展形态（卡片、输入法、后台服务……） | 按需 |

与旧 FA 模型的区别不用细究，只需记住 Stage 的设计意图：**组件分类清晰、进程与任务边界明确**。应用级的全局初始化（埋点 SDK、日志）放 `AbilityStage.onCreate`，页面级初始化放组件 `aboutToAppear`——层次别错。

## 三种包：HAP / HAR / HSP

工程产物的三种形态，分工不同：

- **HAP**（Harmony Ability Package）：**部署单元**，一个 entry/feature 模块编译成一个 HAP。应用 = 一个或多个 HAP，主模块 entry 必须有；
- **HAR**（静态共享包）：编译时**复制进**依赖方，二方三方代码/资源都行——类似 npm 包打进产物；
- **HSP**（动态共享包）：运行时**共享单实例**，多模块引用同一份——适合体积大的公共能力，也用于规避 HAR 多副本的类实例不同源问题（比如两个 HAR 各自持有同一个对象池）。

选型口诀：**业务功能 → feature 模块（HAP）；公共工具/组件 → HAR；需要单例或体积敏感 → HSP**。

## 多模块拆分实战

单模块长到几千行就该拆了，经典三层：

```
entry/        # HAP：桌面入口、主页面、导航
feature/      # HAP ×N：feed/、detail/ 等业务功能模块
common/       # HAR：网络封装、组件库、工具、常量
```

依赖方向单向：entry/feature → common，feature 之间**不互相依赖**（需要共享的沉到 common）——和[主题开发系列第 1 章](/posts/astro-theme-dev/01-theme-skeleton.md)的分层原则同构，只是这里由编译器强制。

module.json5 是每个模块的身份证：

```json
{
  "module": {
    "name": "entry",
    "type": "entry",
    "abilities": [{
      "name": "EntryAbility",
      "srcEntry": "./ets/entryability/EntryAbility.ets",
      "exported": true,
      "skills": [{ "entities": ["entity.system.home"], "actions": ["action.system.home"] }]
    }]
  }
}
```

`skills` 里的 home 声明决定谁是启动入口；后续各章的权限（INTERNET 等）也都写在这里。

## 踩坑提示

- feature 模块的页面也能被路由，但要正确声明 type 与导出，漏了就是"页面存在却跳不过去"。
- HAR 里放单例会因多副本变成多个实例——需要全局单例的资源（数据库连接、配置中心）走 HSP 或 AppStorage。
- 模块间资源不共享：common 的字符串/图片不能被 entry 直接 `$r()` 引用，要用包名限定（`$r('app.string.xxx', context)` 形式或 getRemoteResource）。

## 练习

1. 新建一个 feature 模块，把[ArkTS 第 8 章](/posts/arkts-dev/08-async-network.md)的 PostList 挪进去，由 entry 跳转访问。
2. 把网络封装抽成 common HAR，两个模块同时引用，验证依赖方向。
3. 故意在两个 HAR 里各自 new 一个"单例"，打印实例地址验证副本问题，再迁移到 HSP。
