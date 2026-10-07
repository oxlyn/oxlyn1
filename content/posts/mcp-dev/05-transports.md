---
title: "MCP 开发入门 · 第 5 章：传输层"
description: "stdio 的进程模型与日志纪律、Streamable HTTP 的会话与无状态化、两种传输的选型决策。"
publishDate: 2026-10-22T09:00:00
tags: ["mcp", "agent", "教程"]
---

> 本文对应官方规范[《Transports》](https://modelcontextprotocol.io/docs/2026-07-28/basic/transports)（[stdio](https://modelcontextprotocol.io/docs/2026-07-28/basic/transports/stdio) / [Streamable HTTP](https://modelcontextprotocol.io/docs/2026-07-28/basic/transports/streamable-http)）。

**学习目标**：理解"协议与传输分离"，掌握两种内置传输的运行模型，能对"我的 Server 该怎么部署"做选型。

前四章代码里反复出现 `StdioServerTransport`——它只是传输的一种。MCP 的分层设计里，**JSON-RPC 消息是恒定的，用什么管道送是可换的**：本地子进程和云端 HTTP 服务，协议层代码一个字不用改。

## stdio：本地的事实标准

```text
Host 进程                          Server 进程
   │ spawn ──────────────────────────▶ node build/index.js
   │ stdin  ◀──── JSON-RPC ────────  stdout
   │ stderr ◀──── 日志（自由写）────
```

- Host 把 Server **当子进程拉起**，stdin/stdout 各自承担一个方向的分帧消息流——和 LSP（语言服务器协议）同款模型，[Astro 主题开发](/posts/astro-theme-dev/)里编辑器与语言服务的相处方式在协议层重现；
- 生命周期即进程生命周期：Host 退出 → 子进程随行，无需连接池；
- 第 2 章的红线在这里再看一眼：stdout 归协议，**一切日志走 stderr**——stdio 下没有第二条路。

适用边界也由此而来：**数据在本地、用户只有一个**的场景（你的笔记、本机文件、私有配置），stdio 是正确答案——零部署、凭据不过网。

## Streamable HTTP：远程的模式

当 Server 要服务**多个用户、跑在云端**（团队共享的数据源、SaaS 的 MCP 端点），stdio 不再成立，Streamable HTTP 上场：

```ts
import { McpServer } from "@modelcontextprotocol/server"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/server"

const httpTransport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() })
await server.connect(httpTransport)
// 配合 node:http / 框架把请求交给 transport.handleRequest(req, res)
```

运行模型：

- 客户端对**单一端点 POST JSON-RPC 消息**；响应可以是普通 JSON，也可以升级成 SSE 流式返回（进度通知、流式结果都有渠道）；
- **会话由 `Mcp-Session-Id` 响应头标识**：initialize 时服务器发号，后续请求带上，服务器凭它找回会话状态；
- 部署形态随之变成标准 Web 服务：放在[第 6 章 HTTP 服务](/posts/node-core/06-http-server/)那样的服务器后面、加 TLS、加认证（第 8 章）。

规范层有个值得注意的演进方向：**2026-07-28 版新增了会话管理与缓存的标准化（server utilities/caching）**，推动 Server 往"无状态、可缓存、可路由"的 Web 架构靠——MCP Server 越来越像"一种特殊的 HTTP API"，而不是一门私有小宇宙。

## 选型决策

| 问题 | stdio | Streamable HTTP |
| --- | --- | --- |
| 用户 | 个人、单机 | 多用户、团队 |
| 数据位置 | 本地磁盘/内网 | 云端 API/数据库 |
| 部署成本 | 零（npm/npx 即用） | 要运维一个 Web 服务 |
| 认证 | 宿主环境（env 注入） | OAuth / token（第 8 章） |
| 典型例子 | 文件系统、notes、本地 git | GitHub、数据库、SaaS 集成 |

两个都做也可以：同一套 `registerTool` 业务代码，stdio 与 HTTP 各 connect 一个 transport 实例——协议层不动，传输层并列。

## 踩坑提示

- 远程调试时还在用 stdio 的直觉往 stdout 打日志——HTTP 模式没这个限制，但统一走日志库更省心；
- 无会话头的 POST——被服务器以"需要 initialize"拒绝，先握手拿 `Mcp-Session-Id`；
- 把 stdio Server 直接挂到公网跑——stdio 的信任模型是"本机子进程"，暴露成网络服务必须走 HTTP + 认证，别拿 stdio 硬撑；
- SSE 断线后不重新 initialize——会话丢了要重来，客户端 SDK 一般已处理，自研传输时留意。

## 练习

1. 给 notes-mcp 加一个 HTTP 入口（`StreamableHTTPServerTransport` + `node:http` 路由），与 stdio 双传输并存。
2. 用 `curl` 手工完成一次 initialize → 拿到 `Mcp-Session-Id` → 调一次 `tools/list`，亲眼看看会话头。
3. 把 stdio 模式的 `console.error` 全部收拢成一个日志函数，体会"输出纪律集中管理"的好处。
