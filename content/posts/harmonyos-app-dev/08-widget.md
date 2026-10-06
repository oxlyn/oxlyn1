---
title: "鸿蒙应用开发 · 第 8 章：应用卡片"
description: "ArkTS 卡片的心智模型：FormExtensionAbility、卡片配置、定时与代理刷新。"
publishDate: 2026-07-03T09:00:00
tags: ["harmonyos", "arkts", "教程"]
---

> 本文对应官方文档[卡片概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-form-overview)与[卡片创建](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-ui-widget-creation)。

**学习目标**：理解卡片的运行形态，创建一张展示数据的桌面卡片，掌握三种刷新方式。

## 卡片是什么

卡片是**放在桌面上的微型 UI**：用户不用打开应用就能看到一条摘要（今日头条数、天气、待办）。关键认知：**卡片与应用是两个运行体**——卡片由卡片框架渲染并有自己的进程载体（FormExtensionAbility 承载数据逻辑），不与你的 UIAbility 共享页面栈和状态变量。

## 创建一张卡片

DevEco 里"新建 → Service Widget"生成骨架，核心三件套：

1. **卡片页面**（`WidgetCard.ets`）：受限版的 ArkUI——只能用声明式组件与本地状态，不能路由、不能调用大部分系统能力；
2. **FormExtensionAbility**：卡片的生命周期载体，处理添加、更新、点击事件；
3. **form_config.json**：卡片元数据（名称、默认尺寸、刷新策略、入口页面）。

```ts
// 卡片页面：只能展示数据 + 发消息
let storage = new LocalStorage()
@Entry(storage)
@Component
struct LatestCard {
  @LocalStorageProp('title') title: string = '加载中'
  @LocalStorageProp('count') count: number = 0

  build() {
    Column() {
      Text(this.title).fontSize(14)
      Text(`${this.count} 篇更新`).fontSize(12).fontColor('#999')
    }
    .padding(12)
  }
}
```

数据通过 **LocalStorage 映射**（`formProvider.updateForm` 传入的键值对）到达卡片——`@LocalStorageProp` 就是卡片与应用之间唯一的桥梁。

## 数据更新：三种方式

在 FormExtensionAbility 的 `onUpdateForm`（或定时/代理触发）里推数据：

```ts
import { formBindingData, formProvider } from '@kit.FormKit'
import { Want } from '@kit.AbilityKit'

export default class LatestForm extends FormExtensionAbility {
  async onAddForm(want: Want) {
    const data = await PostRepository.shared(this.context).latest()
    return formBindingData.createFormBindingData({ title: '最新文章', count: data.length })
  }

  async onUpdateForm(formId: string) {
    const data = await PostRepository.shared(this.context).latest()
    await formProvider.updateForm(formId,
      formBindingData.createFormBindingData({ title: '最新文章', count: data.length }))
  }
}
```

刷新策略在 form_config.json 里声明：

- **定时刷新**：`scheduledUpdateTime`（每天某时刻）+ `updateDuration`（间隔，最低 30 分钟）；
- **按需刷新**：应用在前台干完活，主动调 `formProvider.updateForm` 推给卡片（最常用——[第 4 章](/posts/harmonyos-app-dev/04-data-layer.md)Repository 更新后顺手刷一次）；
- **代理刷新**：让系统代为请求网络后推给卡片，应用进程都不用起——省电的"后台轻轮询"。

## 点击交互

卡片点击**不进页面栈**，而是 `postCardAction` 消息：`router` 动作带卡片跳进应用指定页面（可携带参数），`message` 动作回调给 FormExtensionAbility 的 `onFormEvent` 处理轻操作（如"打卡 +1"）。

## 踩坑提示

- 卡片页面里用了不支持的组件/接口（如 router、大多数 @kit），运行时静默不渲染——对照官方"卡片支持的组件与能力"清单逐项核对。
- 卡片尺寸多规格（1×2/2×2/2×4），布局要用自适应写法（[第 7 章](/posts/harmonyos-app-dev/07-adaptive-layout.md)的思想）——写死宽高在另一种规格上直接破相。
- 卡片数据即展示、无交互输入——不要试图在卡片里做复杂表单，那是应用页面的活。

## 练习

1. 给资讯 App 做 2×2 卡片：显示最新文章数与标题，点击进列表页。
2. 在 Repository 的 feed() 成功后主动 updateForm 推送，验证前台免定时刷新。
3. 配置 30 分钟定时刷新，飞行模式对比代理刷新与定时刷新的表现。
