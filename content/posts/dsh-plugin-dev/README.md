---
title: "DSH 插件开发：从零写出你的 Cordis 插件"
description: "DeepSeek Harness 插件框架 Cordis 系列教程总览：环境准备、章节导航与学习路线。"
publishDate: 2026-10-05T12:40:00
tags: ["dsh", "cordis", "教程"]
---

[DeepSeek Harness](https://deepseek-harness.github.io/deepseek-harness/)（下文简称 DSH）是一个插件化的 Agent Harness SDK，而支撑它"插件化"三个字的，是底层框架 **Cordis**：插件是普通的 TypeScript 模块，通过统一的上下文对象挂载服务、注册事件、声明工具，再由一个 YAML 文件组合成完整的运行时。

本站[《从零实现 Agent》](/posts/agent-from-scratch/)系列的第 9 章曾经对照过 harness 的插件架构——那是"看懂它在做什么"；这个系列是"亲手做一遍"：跟着官方 Cordis 教程的脉络，从第一个 `apply` 函数写到能被 Agent 调用的自定义工具。

> 系列内容依据官方教程 [Cordis Tutorial](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/)（develop 分支）整理，代码示例在其基础上改编补充，每章开头都给出对应官方章节链接，方便对照阅读。

## 环境准备

```bash
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
npm install
```

官方教程把练习代码放在仓库的 `tmp/cordis-tutorial/` 目录下，每章一个子目录，组合文件是 `cordis.yml`。以第 7 章为例，运行方式是：

```bash
cd tmp/cordis-tutorial/07
node --import tsx ../../vendor/cordis/bin.js
```

`--import tsx` 让 Node 直接跑 TypeScript；`vendor/cordis/bin.js` 是随仓库内置的 Cordis 运行时入口。你不需要全局安装任何东西。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：第一个插件](/posts/dsh-plugin-dev/01-first-plugin/) | `apply` 约定、三种插件形态、`cordis.yml` 组合、两种失败语义 | [1. 你的第一个插件](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/01-first-plugin) |
| [第 2 章：生命周期与 effect](/posts/dsh-plugin-dev/02-lifecycle-and-effects/) | effect 自动清理、fiber 状态机、dispose 的顺序与异步 | [2. 生命周期与 effect](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/02-lifecycle-and-effects) |
| [第 3 章：服务](/posts/dsh-plugin-dev/03-services/) | Service 类、类型合并、inject 依赖注入、动态重连 | [3. 服务](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/03-services) |
| [第 4 章：事件与分发模式](/posts/dsh-plugin-dev/04-events/) | 五种事件分发模式、waterfall 中间件纪律 | [4. 事件](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/04-events) |
| [第 5 章：配置与校验](/posts/dsh-plugin-dev/05-config/) | Schemastery schema、校验失败即 FAILED、`!!js` 计算值 | [5. 配置](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/05-config) |
| [第 6 章：组合与热重载](/posts/dsh-plugin-dev/06-composition-and-hmr/) | id/disabled/分组/isolate、HMR 插件、诊断 PENDING | [6. 组合与 HMR](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/06-composition-and-hmr) |
| [第 7 章：注册工具，进入 Harness](/posts/dsh-plugin-dev/07-into-the-harness/) | defineTool、tools 服务、tools/result 事件、完整组合 | [7. 进入 harness](https://deepseek-harness.github.io/deepseek-harness/develop/cordis-tutorial/07-into-the-harness) |
| [附录：API 速查与排错](/posts/dsh-plugin-dev/08-appendix/) | 常用 API 速查表、六个高频坑位 | — |

## 学习路线建议

- **只想要"能跑"**：读第 1、7 章——会写插件、会注册工具，就够写大多数扩展了。
- **想理解框架**：按顺序读完 1–6 章，重点是第 2 章（effect 是整个框架的心智模型）和第 3 章（服务与 inject 是 harness 内部的组织方式）。
- **想参与贡献**：全部章节 + 官方 [参考文档](https://deepseek-harness.github.io/deepseek-harness/reference/cordis-primer)。

## 遗留问题

- 事件系统五种模式的完整行为矩阵，在第 4 章只讲了语义，源码级分析留待后续。
- harness 自带工具（文件读写、shell 等）的源码走读，可以参考[《从零实现 Agent》第 9 章](/posts/agent-from-scratch/09-plugin-architecture/)的对照笔记。
