---
title: "DSH 插件开发 · 第 5 章：配置与校验"
description: "用 Schemastery 声明插件配置：apply 前校验、失败即 FAILED、默认值与 !!js 计算值。"
publishDate: 2026-09-22T09:00:00
tags: ["dsh", "cordis", "教程"]
---

> 本文对应官方教程[第 5 章：配置](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/05-config)，示例代码在其基础上改编。

**学习目标**：给插件加配置项，理解"校验失败即加载失败"的设计与 YAML 里的计算值。

## 配置从哪来

`cordis.yml` 里的每个插件条目都可以携带一个 `config` 块：

```yaml
- ./greeter.ts:
    config:
      greeting: 你好
      times: 3
```

插件侧用对象形态，把 `config` 属性声明成 **Schemastery** schema，`apply` 的第二个参数就会拿到校验后的值：

```ts
import { Schema } from 'schemastery'

export default {
  name: 'greeter',
  config: Schema.object({
    greeting: Schema.string().default('hello'),
    times: Schema.number().min(1).max(10).default(1),
  }),
  apply(ctx, config) {
    for (let i = 0; i < config.times; i++) ctx.log(config.greeting)
  },
}
```

Schemastery 的价值不止类型：每个字段都能带默认值、约束（min/max）、描述，同一个 schema 既能校验 YAML，也能在需要时生成配置界面——声明一次，处处可用。

## 校验失败 = 加载失败

这是本章最重要的设计决策：配置校验发生在 `apply` **之前**，校验不过插件直接进入 `FAILED` 状态，抛出带精确位置信息的 `ValidationError`，**根本不会执行你的逻辑**。

对比一下另一种世界：配置错误悄悄溜进 `apply`，运行到一半用 `undefined` 去除——问题离病根十万八千里。"宁可加载失败"把配置错误拦截在最早的时刻，配合第 6 章的 PENDING 诊断，出错位置一目了然。

副作用是：**改配置 = 重载插件**。校验通过则插件带着新配置重载，失败则停在 FAILED，旧实例已卸载。所以别在配置里放"运行时可变"的状态，那是服务的职责。

## !!js：YAML 里的计算值

`cordis.yml` 支持有限的 `!!js` 标签，让某些字段写表达式而不是字面量——**只有 `config` 和 `disabled` 两个字段支持**：

```yaml
- ./listener.ts:
    disabled: !!js "process.env.CI === 'true'"
    config:
      endpoint: !!js "`http://localhost:${process.env.PORT ?? 3000}`"
```

适用面刻意收得很窄：它只是免掉"为了一个环境变量写两个 yml"的胶水，不是让你在配置里写业务逻辑。滥用 `!!js` 会让组合文件变成第二份源码，排查配置问题时mental model 直接翻倍。

## 踩坑提示

- `config` 忘了声明 schema，YAML 里写的配置原样透传——看起来"能用"，实际上没有任何校验和默认值，字段名拼错了也不会有人提醒。
- `Schema.number()` 对 YAML 里的 `"3"`（字符串）不妥协：要么改 schema 用 `Schema.natural()` 系列做转换，要么把 YAML 写对。
- 默认值写在 schema 里，别写在 `apply` 里用 `config.x ?? default` 补——两处默认值迟早漂移。

## 练习

1. 给第 1 章的 hello 插件加 `name`（要问候谁）和 `upper`（是否转大写）两个配置项，含默认值。
2. 故意把 `times` 配成 0，观察 ValidationError 的输出格式与 FAILED 状态。
3. 用 `!!js` 让一个配置项读取环境变量，分别在有/无该变量时启动验证。
