---
title: "MCP 开发入门：把工具接进大模型"
description: "MCP 系列教程总览：协议架构、TS SDK 开发 Server、三大原语、传输与客户端、上下文工程、安全与生态整合。"
publishDate: 2026-10-29T09:00:00
tags: ["mcp", "agent", "教程"]
---

[《从零实现 Agent》](/posts/agent-from-scratch/)里，工具是 Agent 进程内的函数注册表——能用，但每个应用都要把同一批能力各接一遍。MCP（Model Context Protocol）用"USB-C 接口"解决了这个问题：应用实现一次 Host，工具实现一次 Server，中间全部打通。2026 年它已是 AI 应用连接外部系统的事实标准（Claude、ChatGPT、VSCode、Cursor 全面支持）。这个系列从协议讲到生态，带你从两边都做一遍。

> 内容依据 [modelcontextprotocol.io 官方文档](https://modelcontextprotocol.io)（2026-07-28 规范）与官方 TS SDK 整理，代码示例均为原创，每章附官方文档链接。前置知识：[《Node.js 核心入门》](/posts/node-core/)的模块、测试与 CLI 章。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：协议与世界观](/posts/mcp-dev/01-protocol-and-architecture/) | 三角色、JSON-RPC、initialize 握手、三原语总览 | [Architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture) |
| [第 2 章：第一个 MCP 服务器](/posts/mcp-dev/02-first-server/) | TS SDK、registerTool、stdio 红线、接入 Host | [Build an MCP server](https://modelcontextprotocol.io/docs/2026-07-28/develop/build-server) |
| [第 3 章：工具设计](/posts/mcp-dev/03-tools/) | 描述写给模型看、内容块与 isError、annotations | [Tools](https://modelcontextprotocol.io/docs/2026-07-28/server/tools) |
| [第 4 章：资源与提示](/posts/mcp-dev/04-resources-and-prompts/) | URI 模板、订阅通知、三原语选择表 | [Resources](https://modelcontextprotocol.io/docs/2026-07-28/server/resources) / [Prompts](https://modelcontextprotocol.io/docs/2026-07-28/server/prompts) |
| [第 5 章：传输层](/posts/mcp-dev/05-transports/) | stdio 进程模型、Streamable HTTP、选型 | [Transports](https://modelcontextprotocol.io/docs/2026-07-28/basic/transports) |
| [第 6 章：客户端](/posts/mcp-dev/06-client/) | SDK Client、无 LLM 的 mini-host、Host 责任清单 | [Build an MCP client](https://modelcontextprotocol.io/docs/2026-07-28/develop/build-client) |
| [第 7 章：上下文工程](/posts/mcp-dev/07-context/) | cursor 分页、体积控制、通知与订阅 | [Pagination](https://modelcontextprotocol.io/docs/2026-07-28/server/utilities/pagination) |
| [第 8 章：安全与权限](/posts/mcp-dev/08-security/) | 提示注入、混淆代理、elicitation、OAuth | [Security Best Practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices) |
| [第 9 章：测试、调试与发布](/posts/mcp-dev/09-testing-and-publishing/) | Inspector、协议冒烟测试、日期版本号、npm 发布 | [Inspector](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector) |
| [第 10 章：生态与实战整合](/posts/mcp-dev/10-ecosystem/) | 接进自研 Agent、官方生态、Registry 与新规范方向 | [Examples](https://modelcontextprotocol.io/examples) |
| [附录：协议与 SDK 速查](/posts/mcp-dev/11-appendix/) | 方法表、决策表、SDK API、安全清单 | — |

## 贯穿项目：notes-mcp

[《Node.js 核心入门》](/posts/node-core/)的笔记 CLI 在这个系列里完成蜕变——存储层（`store.js`）一行不改，外面套上协议门面：

```text
第 2 章  add_note 工具上线，接入 Claude Desktop
第 3 章  补齐 search/remove/update 工具面
第 4 章  长出 notes:// 资源与 summarize 提示模板
第 5 章  加 HTTP 传输，本地与远程双形态
第 9 章  Inspector 调试 + node:test 冒烟测试 + npm 发布
第 10 章 接进《从零实现 Agent》的 harness
```

一套存储、两种客户端（人敲的 CLI、模型调的 MCP）、任意 Host——这就是"写一次、处处能用"的具体形状。

## 三条主线

1. **协议地基**（第 1、2 章）——三角色与握手、跑通第一个 Server；
2. **能力设计**（第 3、4、5、6 章）——三大原语怎么选怎么写，传输怎么选，Host 侧怎么写；
3. **工程化**（第 7、8、9、10 章）——上下文预算、安全设防、测试发布、生态整合。

## 运行环境

Node 20+ 与 TypeScript（SDK 要求 Node16 模块解析）；一个支持 MCP 的 Host（Claude Desktop / Cursor / VSCode 任选）用于第 2 章实机接入；第 6 章起自研 Host，无需任何模型 API key——mini-host 刻意不调 LLM，把协议学得干干净净。

## 遗留问题

- 只覆盖 TypeScript SDK；Python/Rust/Kotlin SDK 的对应写法见官方各仓库；
- sampling（Server 借用 Host 的模型）与 roots 浅提到为止，完整规范见 [client concepts](https://modelcontextprotocol.io/docs/2026-07-28/learn/client-concepts)；
- OAuth 授权流点到为止，生产级实现建议从[规范授权章节](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/authorization)出发。
