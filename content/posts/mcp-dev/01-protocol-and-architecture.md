---
title: "MCP 开发入门 · 第 1 章：协议与世界观"
description: "M×N 到 M+N 的连接问题、Host/Client/Server 三角色、JSON-RPC 消息、initialize 握手与三大原语总览。"
publishDate: 2026-10-18T09:00:00
tags: ["mcp", "agent", "教程"]
---

> 本文对应官方文档[《What is MCP?》](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro)与[《Architecture》](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)。

**学习目标**：理解 MCP 解决什么问题、三个角色怎么分工、一条消息长什么样——把"协议地图"装进脑子，后面九章都在这张图上标点。

[《从零实现 Agent》](/posts/agent-from-scratch/04-real-tools/)的"真实工具"一章里，工具是宿主进程里的一个函数注册表——`工具名 → 处理函数`。它好用，但有个天花板：**每写一个 Agent，就要把天气、搜索、数据库……各接一遍**。N 个应用 × M 个数据源 = N×M 份集成代码。MCP（Model Context Protocol）把 N×M 砍成 N+M：应用说一次"MCP"，工具说一次"MCP"，中间就通了。官方的类比是 **USB-C**——一个标准接口，什么设备都能插。

> 内容依据 [modelcontextprotocol.io](https://modelcontextprotocol.io) 官方文档（2026-07-28 规范）整理，代码用 TypeScript SDK，贯穿项目会把[《Node.js 核心入门》](/posts/node-core/)的 notes CLI 变成 AI 可调用的服务。

## 三个角色

```text
┌────────────────── Host ──────────────────┐
│  Claude Desktop / Cursor / 你写的 Agent    │
│  ┌────────┐   ┌────────┐                 │
│  │Client 1│   │Client 2│                 │
└──┴───┬────┘───┴───┬────┴─────────────────┘
       │ 1:1        │ 1:1
  ┌────▼────┐  ┌────▼────┐
  │ Server A│  │ Server B│   ← 独立进程：文件系统、GitHub、你的 notes…
  └─────────┘  └─────────┘
```

- **Host**：用户面对的 AI 应用（Claude Desktop、Cursor、你自己的 Agent）。它持有 LLM、管 UI、管审批；
- **Client**：Host 内部的连接器，**与一个 Server 保持 1:1 会话**，负责协议收发；
- **Server**：独立进程，通过协议暴露能力（工具、数据、模板），不知道也不关心对面是哪个模型。

关键分工在"谁决定什么"：**模型**决定调用哪个工具，**Host** 决定要不要放行（审批）、怎么展示，**Server** 只管把能力定义清楚、把活干完。安全章会回来反复引用这条边界。

## 消息长什么样：JSON-RPC 2.0

MCP 的线上语言是 JSON-RPC 2.0，一共三种消息：

```jsonc
// 请求（要回复，带 id）
{"jsonrpc": "2.0", "id": 1, "method": "tools/call",
 "params": {"name": "add_note", "arguments": {"text": "学 MCP"}}}

// 响应（带同 id）
{"jsonrpc": "2.0", "id": 1,
 "result": {"content": [{"type": "text", "text": "已添加"}]}}

// 通知（不等回复，无 id）
{"jsonrpc": "2.0", "method": "notifications/initialized"}
```

日常开发由 SDK 封装，但这层形状值得记住：**调试 MCP 就是在读这三样东西**（第 9 章的 Inspector 里它们直接可见）。

## 生命周期：initialize 握手

连接建立后第一件事是协商，双方交换**协议版本**与**能力清单**：

```jsonc
// Client → Server
{"jsonrpc": "2.0", "id": 0, "method": "initialize",
 "params": {"protocolVersion": "2026-07-28",
            "capabilities": {"roots": {}},
            "clientInfo": {"name": "mini-host", "version": "0.1.0"}}}
// Server 回应自己的 capabilities：{"tools": {"listChanged": true}, "resources": {}, …}
// Client 发 notifications/initialized → 进入正常工作期
```

能力协商让协议可以渐进演进：双方各自声明"我支持什么"，不认识的部分自动降级——这也是 MCP 版本号是**日期**（2026-07-28）的原因，见第 9 章版本化。

## 三大原语总览

Server 能提供的东西分三类，**按"谁在驱动"区分**——这张表是全系列的骨架：

| 原语 | 谁决定用它 | 典型例子 | 对应章节 |
| --- | --- | --- | --- |
| **Tools**（工具） | 模型自主选择 | 查天气、发消息、写文件 | 第 3 章 |
| **Resources**（资源） | 应用/宿主控制 | 文件内容、API 返回、配置 | 第 4 章 |
| **Prompts**（提示模板） | 用户主动选择 | "/总结这篇笔记"、代码评审模板 | 第 4 章 |

一句话记忆：**Tools 给模型"手"，Resources 给应用"素材"，Prompts 给用户"快捷指令"**。三大原语之外还有 sampling（Server 反过来借 Host 的模型）与 elicitation（Server 向用户要补充输入）两个客户端侧能力，第 8 章安全篇会用到 elicitation。

## 踩坑提示

- 把 MCP 想成"函数调用库"——它同时是**进程间协议**：Server 是独立进程，有自己的生命周期，挂了要重连。
- 把三个原语混为一谈——"要不要让模型看到"决定工具 vs 资源，"谁来发起"决定资源 vs 提示。
- 记具体方法名——方法名（tools/call、resources/read）SDK 都包了，记**能力协商 + 原语分类**这两个模型才是核心。

## 练习

1. 画出你常用 AI 应用（如 Cursor）的 Host/Client/Server 图，标出它内置工具和 MCP 工具分别在哪层。
2. 手写一条 `tools/list` 的 JSON-RPC 请求和它的响应，对照本章三段示例检查格式。
3. 读一遍[官方 Architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)，确认"Client:Server = 1:1"和"Host 可以连多个 Server"两个事实。
