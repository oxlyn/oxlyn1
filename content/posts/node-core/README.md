---
title: "Node.js 核心入门：把 JavaScript 带到浏览器之外"
description: "Node.js 系列教程总览：模块与包管理、文件与流、HTTP 服务、事件驱动、事件循环与多线程、CLI 与测试上线。"
publishDate: 2026-10-17T09:00:00
tags: ["nodejs", "教程"]
---

[《JavaScript 核心入门》](/posts/javascript-core/)讲完了语言，但浏览器里那份 JS 只是半张地图：读写文件、起服务、跑命令行——这些"真正的程序"都发生在运行时里。Node 是 JS 运行时的事实标准：[《从零实现 Agent》](/posts/agent-from-scratch/)的 Agent 循环、[《DSH 插件开发》](/posts/dsh-plugin-dev/)的插件宿主，全都跑在它上面。这个系列补上这块地基，也是后续服务端与 AI 工具链系列的前置。

> 内容依据 [Node.js 官方文档](https://nodejs.org/en/learn)与 [API 参考](https://nodejs.org/docs/latest/api/documentation/)整理（基于现行 LTS，兼顾 2026 年 10 月转正的 Node 26），代码示例均为原创，每章附官方文档链接。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：运行时与第一行代码](/posts/node-core/01-what-is-node/) | V8 + libuv + 内置模块、版本策略、--watch | [Introduction to Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs) |
| [第 2 章：模块系统与 ESM](/posts/node-core/02-modules-esm/) | type: module、node: 前缀、解析规则、CJS 互操作 | [ESM](https://nodejs.org/docs/latest/api/esm.html) |
| [第 3 章：npm 与包管理](/posts/node-core/03-npm-and-packages/) | package.json、semver、lockfile、scripts、npx | [npm CLI](https://docs.npmjs.com/cli/v11/commands) |
| [第 4 章：文件系统与路径](/posts/node-core/04-fs-and-path/) | fs/promises、错误码分诊、path 与 cwd | [File system](https://nodejs.org/docs/latest/api/fs.html) |
| [第 5 章：流](/posts/node-core/05-streams/) | 四类流、背压、pipeline、readline | [Stream](https://nodejs.org/docs/latest/api/stream.html) |
| [第 6 章：HTTP 服务](/posts/node-core/06-http-server/) | req/res 模型、手写路由、fetch | [HTTP](https://nodejs.org/docs/latest/api/http.html) |
| [第 7 章：事件与 EventEmitter](/posts/node-core/07-events/) | 统一抽象、error 约定、监听器泄漏 | [Events](https://nodejs.org/docs/latest/api/events.html) |
| [第 8 章：事件循环与并发模型](/posts/node-core/08-event-loop/) | 六阶段、nextTick、线程池与 worker | [Event Loop 指南](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick) |
| [第 9 章：process、环境变量与 CLI](/posts/node-core/09-process-and-cli/) | argv/env、parseArgs、信号、bin 发布 | [process](https://nodejs.org/docs/latest/api/process.html) |
| [第 10 章：测试、调试与上线](/posts/node-core/10-test-debug-ship/) | node:test、--inspect、错误兜底、部署清单 | [Test runner](https://nodejs.org/docs/latest/api/test.html) |
| [附录：命令与 API 速查](/posts/node-core/11-appendix/) | 命令、API、时序口诀 + 进阶路线 | — |

## 贯穿项目：notes CLI

和[《从零实现 Agent》](/posts/agent-from-scratch/)一样，这个系列带着一个项目走完全程：一个命令行笔记工具，每章长出一块——

```text
第 2 章  拆成 ESM 模块、声明 type: module
第 3 章  挂上 npm scripts、声明 bin 字段
第 4 章  有了 JSON 持久层（fs/promises + path）
第 5 章  学会流式导入大文件（readline + pipeline）
第 6 章  长出 HTTP API（GET/POST /api/notes）
第 7 章  存储层发出 changed 事件
第 9 章  parseArgs + 子命令 + 优雅退出，成为真 CLI
第 10 章 node:test 单元测试 + 部署清单
```

每章的"练习"都基于它，代码全部可以跑，建议边读边敲。

## 三条主线

1. **模块与包**（第 2、3 章）——代码怎么拆、依赖怎么来，读懂任何 Node 项目的入口；
2. **I/O 内核**（第 4、5、6、7 章）——文件、流、网络、事件，Node 的权力与责任都在这四章；
3. **运行时模型与工程**（第 8、9、10 章）——单线程怎么并发、什么时候开 worker、怎么测试怎么上线。

## 运行环境

Node 22+ 均可，建议 LTS（Node 24，或本月转正的 Node 26）；编辑器 VSCode 对 `--inspect` 有原生支持。系列刻意只用内置模块——除了第 3 章为演示包管理装过一个着色库，其余零依赖。

## 遗留问题

- 数据库与 ORM（SQLite/Postgres）不在本系列，notes 的 JSON 存储刻意保持极简；
- Web 框架（Express/Fastify/Hono）只点了方向，独立系列展开；
- TypeScript 工程配置（tsconfig、tsup 打包）在[TS 系列](/posts/typescript-core/)基础上后续补充。
