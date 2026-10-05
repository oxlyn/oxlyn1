---
title: "DSH 插件开发 · 附录：API 速查与排错"
description: "Cordis 常用 API 一页速查，以及系列里出现过的六个高频坑位的统一索引。"
publishDate: 2026-10-05T12:35:00
tags: ["dsh", "cordis", "教程"]
---

## ctx API 速查

| API | 用途 | 所属章节 |
| --- | --- | --- |
| `ctx.log(...)` | 结构化日志 | [1](/posts/dsh-plugin-dev/01-first-plugin/) |
| `ctx.plugin(source)` | 挂载子插件，返回 fiber | [2](/posts/dsh-plugin-dev/02-lifecycle-and-effects/) |
| `ctx.effect(setup, dispose)` | 带自动清理的资源注册 | [2](/posts/dsh-plugin-dev/02-lifecycle-and-effects/) |
| `fiber.dispose()` | 递归 + 异步感知地卸载 | [2](/posts/dsh-plugin-dev/02-lifecycle-and-effects/) |
| `ctx.get(name)` | 可选获取服务（没有则 undefined） | [3](/posts/dsh-plugin-dev/03-services/) |
| `ctx.emit / parallel / serial / bail / waterfall` | 五种事件分发 | [4](/posts/dsh-plugin-dev/04-events/) |
| `ctx.tools.register(tool)` | 注册 Agent 工具（effect） | [7](/posts/dsh-plugin-dev/07-into-the-harness/) |
| `ctx.tools.execute(call)` | 手动执行工具 | [7](/posts/dsh-plugin-dev/07-into-the-harness/) |
| `ctx.registry` | 遍历所有 fiber，诊断状态 | [6](/posts/dsh-plugin-dev/06-composition-and-hmr/) |

## 模块级导出速查

| 导出 | 作用 |
| --- | --- |
| `export function apply(ctx)` | 插件入口（函数形态） |
| `export const name` | 可读标识，强烈建议导出 |
| `export default { name, inject, config, apply }` | 对象形态，需要 inject/配置时用 |
| `inject: ['tools']` | 声明服务依赖，就绪前插件停在 PENDING |
| `declare module` + `interface Context / Events` | 给服务与事件补类型 |

## fiber 状态机

```
PENDING ──→ LOADING ──→ ACTIVE ──→ UNLOADING ──→ DISPOSED
                │                      │
                └──────→ FAILED ←──────┘
```

- `PENDING`：等依赖，`apply` 尚未执行；
- `FAILED`：加载/校验/运行失败，组合问题看日志，依赖问题查 inject。

## 六个高频坑位

1. **`export default` 一个函数当插件**——`apply` 必须命名导出（[第 1 章](/posts/dsh-plugin-dev/01-first-plugin/)）。
2. **绕过 `ctx` 直接 `setInterval` / `addEventListener`**——泄漏，effect 体系管不到（[第 2 章](/posts/dsh-plugin-dev/02-lifecycle-and-effects/)）。
3. **`declare module` 忘写**——服务变 `any`，拼错没人提醒（[第 3 章](/posts/dsh-plugin-dev/03-services/)）。
4. **waterfall 监听器不 `return next()`**——事件链断裂，下游全部失联（[第 4 章](/posts/dsh-plugin-dev/04-events/)）。
5. **无 id 的 entry + HMR**——任何修改都触发全量重挂载（[第 6 章](/posts/dsh-plugin-dev/06-composition-and-hmr/)）。
6. **用 `ctx.tools` 前忘 `inject: ['tools']`**——永久 PENDING（[第 7 章](/posts/dsh-plugin-dev/07-into-the-harness/)）。

## 官方文档索引

- 教程总入口：[Cordis Tutorial](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/)
- 概念先行：[Cordis Primer](https://deepseek-harness.github.io/deepseek-harness/reference/cordis-primer)
- API 参考：[Context API](https://deepseek-harness.github.io/deepseek-harness/reference/cordis-api/context)
- 核心子系统：[Subsystems: core](https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/core)
- 工具开发细节：[Develop: Basic — Tool](https://deepseek-harness.github.io/deepseek-harness/develop/basic/tool)
- 进阶实战：[Dynamic Cordis](https://deepseek-harness.github.io/deepseek-harness/develop/practice/dynamic-cordis)
