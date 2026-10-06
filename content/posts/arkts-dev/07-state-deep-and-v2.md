---
title: "ArkTS 鸿蒙开发入门 · 第 7 章：深观察与状态 V2"
description: "@Observed/@ObjectLink 嵌套观察、@Track 精细更新，以及 V2 装饰器体系的核心思想。"
publishDate: 2026-06-20T09:00:00
tags: ["arkts", "harmonyos", "教程"]
---

> 本文对应官方文档[@Observed/@ObjectLink](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-observed-and-objectlink)与[状态管理 V2](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-new-observedV2-and-trace)（装饰器全表见[UI 装饰器总览](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-decorator-overview)）。

**学习目标**：解决嵌套对象的观察难题，认识 V2 装饰器体系与 V1 的思想差异。

## 第 4 章遗留的坑：嵌套对象不刷新

@State 只观察第一层，嵌套类对象的属性变化无感。V1 的解法是**让对象自己可观察**：类标 `@Observed`，消费端用 `@ObjectLink` 接住引用：

```ts
@Observed
class Profile {
  name: string = ''
  bio: string = ''
}

@Component
struct ProfileCard {
  @ObjectLink profile: Profile      // 引用同步，不拷贝

  build() {
    Text(this.profile.bio)          // profile.bio 变化 → 这里刷新
  }
}
```

三件事必须成对理解：`@Observed` 标记的类被框架代理，属性写入会被捕获；`@ObjectLink` 只收**引用**（因此父组件传的是实例，不是 @State 的属性路径）；@ObjectLink **只读变量本身**，改它指向的对象的属性才是正确姿势。

列表项场景是标准组合拳：`@State list: Profile[]` 的某一项内部变化，包在 `ProfileCard`（@ObjectLink）里就能刷新——**把嵌套层拆成子组件，是 V1 深观察的唯一正道**。若只需"哪个属性变了"的更细粒度刷新，类属性再加 `@Track`。

## V2：把观察粒度还给属性

V1 的心智负担（@Observed/@ObjectLink 成对、嵌套拆组件）催生了新一代状态管理。V2 的核心变化：**观察从"变量级"下沉到"属性级"**：

```ts
@ObservedV2
class Profile {
  @Trace name: string = ''       // 谁绑定 name，name 变了刷新谁
  @Trace bio: string = ''
  createTime: number = Date.now()  // 不标 @Trace：纯数据，不参与刷新
}

@ComponentV2
struct ProfileView {
  @Local bio: string = ''        // 组件内状态（替代 @State）
  @Param item: Profile = new Profile()   // 外部输入（替代 @Prop，默认只读）
  @Computed get initial(): string { return this.item.name.slice(0, 1) }
}
```

V1 → V2 对照表：

| V1 | V2 | 变化 |
| --- | --- | --- |
| `@State` | `@Local` | 组件内状态 |
| `@Prop` | `@Param`（配 `@Once` 可只同步一次） | 外部输入，默认不可本地修改 |
| `@Link` 双向 | `@Param` + `@Event` 回调 | 双向改显式事件（数据流可追溯） |
| `@Provide/@Consume` | `@Provider/@Consumer` | 跨层同步 |
| `@Watch` | `@Monitor`（可同时监听多个） | 变化回调 |
| `@Observed` + `@ObjectLink` | `@ObservedV2` + `@Trace` | **属性级观察，无需拆子组件** |
| —— | `@Computed` | 计算属性（缓存依赖） |

V2 的观感：更啰嗦一点（改子组件数据要显式 `@Event` 回调），但**数据流全部显式**——这正是 V1 @Link 双向同步在大型应用里"查不到谁改的"的反面。与[DSH 系列第 4 章](/posts/dsh-plugin-dev/04-events.md)的waterfall 纪律异曲同工：显式事件链难写，但永远可追踪。

## 选型与混用

- 新模块优先 **V2**；V1 仍是主干能力，存量代码照常维护；
- **同一个组件内 V1/V2 装饰器不可混用**——迁移按组件为单位进行；
- 深观察的判断口诀（V1）：对象嵌套 + 列表项 → @Observed/@ObjectLink 拆组件；（V2）：类标 @ObservedV2、属性标 @Trace，一层到位。

## 踩坑提示

- `@ObjectLink` 装饰的变量不能本地赋值（引用只读），想整体换对象，换的是它的属性或改父级数据源。
- V2 的 @Param 默认不可在子组件内改，"就地改参数"的旧习惯要改成 @Event 回调。
- @Observed 类的实例若从 JSON 反序列化而来，代理特性不生效——先 `new` 出实例再逐字段赋值（第 8 章的响应式建模衔接这里）。

## 练习

1. 用 V1 重现"嵌套对象改属性不刷新"，再拆成 @Observed/@ObjectLink 修复。
2. 把同一段状态代码分别写成 V1 和 V2 版本，对比改子组件数据的代码路径。
3. 给 V2 类加一个不标 @Trace 的字段并修改它，验证 UI 不刷新——体会"观察粒度"的含义。
