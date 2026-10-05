---
title: "DSH 插件开发 · 第 6 章：组合与热重载"
description: "cordis.yml 的高级组合：id 身份、分组与 isolate、HMR 插件，以及 PENDING 插件的诊断方法。"
publishDate: 2026-10-05T12:25:00
tags: ["dsh", "cordis", "教程"]
---

> 本文对应官方教程[第 6 章：组合与 HMR](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/06-composition-and-hmr)，示例代码在其基础上改编。

**学习目标**：掌握 `cordis.yml` 的身份与分组语义，跑通热重载，学会诊断停在 PENDING 的插件。

## entry 的身份：id

前面几章的组合条目都只是模块路径，其实每一项都是完整的 **entry** 对象，支持元数据字段：

```yaml
- id: my-greeter
  disabled: false
  ./greeter.ts:
    config:
      greeting: hi
```

- `id`：entry 的**身份标识**。框架靠 id 判断"两次读到的组合是同一个插件还是新插件"；
- `disabled`：不加载但保留配置（第 5 章的 `!!js` 可以让它随环境变化）。

## 分组与 isolate

多个 entry 可以打包成一个**组**（列表嵌列表），组内插件共享一个生命周期——一起加载、一起卸载，适合"一个功能由几个协作插件构成"的场景。反过来，`isolate` 让 entry 在独立的上下文里运行，与其他插件隔离（多租户/多配置实例时有用）。

这两个特性的日常使用频率不高，但读别人的 `cordis.yml` 时必须认识它们。

## HMR：改完即生效

热重载由官方插件 `@deepseek-ai/cordis-plugin-hmr` 提供，把它加进组合：

```yaml
- @deepseek-ai/cordis-plugin-hmr
- ./greeter.ts
```

之后修改 `greeter.ts` 保存，框架自动对该插件执行 **unload → load**：旧的 effect 全部清理（第 2 章的机制在这里兑现），新代码重新 `apply`。不需要重启进程，也不需要手动 dispose。

**id 在这里变得致命**：HMR 的 diff 以 id 为身份。没有 id 的 entry，每次重新读取组合文件都被视为一个"全新插件"——也就是说你改任何一行，它都会走"卸旧的 + 挂新的"全量重挂载，而不是原位重载。给想热重载的插件配 id，是教程里明确强调的实践。

## 诊断 PENDING

插件永远不加载、日志也不报错？多半是卡在 `PENDING`——依赖的服务没出现（第 3 章）。最常见的原因是 `inject` 里的服务名拼错：框架忠实地等待一个永远不会来的服务。

诊断方法：在任意已加载插件的 `apply` 里（或调试入口）遍历注册表：

```ts
for (const fiber of ctx.registry) {
  if (fiber.state !== 'active') {
    ctx.log(fiber.id, fiber.state) // 例如: my-plugin pending
  }
}
```

把状态不是 `active` 的 fiber 挑出来，再结合它的 `inject` 列表逐个核对服务名，基本都能定位。

## 踩坑提示

- HMR 改了文件没反应：先确认 HMR 插件在组合里，再确认 entry 有 `id`。
- 组合文件本身写错（YAML 语法错误）的表现和"插件没写"一样安静——改完 yml 没效果时先看运行时日志有没有解析告警。
- PENDING 不算错误，默认日志里几乎无感——养成启动后看一眼注册表状态的习惯。

## 练习

1. 给 greeter 插件加上 `id`，接入 HMR 插件，改代码观察免重启生效。
2. 去掉 `id` 再改一行，对比日志里的重挂载行为。
3. 构造一个 `inject: ['no-such-service']` 的插件，用注册表遍历定位它的 PENDING。
