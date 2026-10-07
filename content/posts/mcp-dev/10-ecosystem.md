---
title: "MCP 开发入门 · 第 10 章：生态与实战整合"
description: "把 notes-mcp 接进自研 Agent、官方 Server 生态与 Registry、2026-07-28 规范的新方向。"
publishDate: 2026-10-27T09:00:00
tags: ["mcp", "agent", "教程"]
---

> 本文对应官方[《Example Servers》](https://modelcontextprotocol.io/examples)与[《Registry》](https://modelcontextprotocol.io/registry/about)。

**学习目标**：把本系列的 Server 接进[《从零实现 Agent》](/posts/agent-from-scratch/)的 harness，认识 Server 生态与注册表，看清 2026-07-28 规范把协议带向哪里。

## 接进自研 Agent

Agent 系列第 9 章做了[插件化架构](/posts/agent-from-scratch/09-plugin-architecture/)：工具注册表开放给插件。MCP 是这个思路的**跨进程版**——插件从"同进程函数"升级为"独立协议服务"。对接方式有两种：

**方案 A：适配层**——Agent 的工具注册表不变，MCP 工具经适配变成普通工具：

```ts
// 把 MCP 工具适配成 agent 的工具注册表条目
async function registerMcpTools(agent, client) {
  const { tools } = await client.listTools()
  for (const t of tools) {
    agent.registerTool({
      name: t.name,
      description: t.description,
      schema: t.inputSchema,
      execute: async (args) => {
        const result = await client.callTool({ name: t.name, arguments: args })
        return { text: result.content.map(b => b.text).join("\n"), isError: result.isError }
      },
    })
  }
}
```

**方案 B：原生 MCP Host**——Agent 直接持有 Client（第 6 章），工具调用循环里遇到 MCP 工具就走 `callTool`。改动更大，但审批、通知、elicitation 能力完整继承。

两条路的共同底线（第 8 章）：**MCP 工具与内置工具同权同责**——同样的审批、同样的上下文预算（第 7 章），不要因为来源不同而区别对待。对比一下：Agent 系列里"注册工具"是启动时的静态动作，MCP 化之后则是**动态的**——连上就发现、断开就消失、`list_changed` 会刷新，你的 Agent 从"自带工具箱"变成"随时插拔 USB-C"。

## 生态：用与被用

**用现成 Server**：官方 [examples](https://modelcontextprotocol.io/examples) 收录了文件系统、GitHub、浏览器自动化等参考实现，覆盖三大原语的教科书式用法——读它们的 `registerTool` 描述写法，是提升工具面设计最快的路径。第三方 Server 同样经 `npx` 即插即用。

**被发现**：[MCP Registry](https://modelcontextprotocol.io/registry/about) 是官方的 Server 目录——发布元数据、可发现、可聚合。2026 年的生态里，"写一个 Server"和"让全世界找到它"已经是两步标准流程，[《npm 与包管理》](/posts/node-core/03-npm-and-packages/)的"发布"一章有了协议层的续篇。

## 2026-07-28 规范的新方向

最新版规范值得关注的四个信号：

1. **Web 化的会话与缓存**——新增 server utilities/caching，推动 Streamable HTTP Server 无状态化、可缓存、可路由（第 5 章）；MCP Server 的部署越来越像普通 Web 服务；
2. **发现标准化**——`server/discover` 与 Registry 让"找到合适的 Server"从口口相传变成协议能力；
3. **扩展机制**——官方扩展（MCP Apps、tasks 等）以扩展包形式叠加，核心协议保持克制；
4. **主流客户端全面接入**——Claude、ChatGPT、VSCode、Cursor 均支持（第 2 章接入过其一），"写一次、处处可用"的承诺已兑现。

## 收官：一条完整的链路

```text
node-core（运行时+存储） → mcp-dev（协议门面） → agent（模型决策）
   notes store.js    →    notes-mcp Server  →  任何 MCP Host
```

九个章节走过的路：协议地图（1）→ 跑通第一个 Server（2）→ 工具面设计（3）→ 资源与提示（4）→ 传输选型（5）→ 自研 Host（6）→ 上下文工程（7）→ 安全设防（8）→ 测试发布（9）→ 生态整合（本章）。从此你给 AI 应用添能力，有了两种身份可选：**写 Server 被生态调用，或做 Host 驾驭整个生态**——两种身份用的是同一张协议地图。

## 踩坑提示

- 适配层里丢了 isError——Agent 把失败当成功文本继续推理，错误静默放大；
- Agent 同时连了自己的 Server 和同功能内置工具——模型选择混乱，同一能力只留一个入口；
- 只盯着协议忘了业务——MCP 是门面，[notes 的存储层](/posts/node-core/04-fs-and-path/)质量决定服务上限，工具再漂亮也救不了烂持久层。

## 练习

1. 用方案 A 把 notes-mcp 接进你的 Agent（或 mini-host 扩展版），跑通"对话中自然语言记笔记"。
2. 读官方文件系统 Server 的源码，列出它的工具面清单，对照你的 notes-mcp 找出三处描述写法差异。
3. 给自己的 Server 在 Registry 提交一份元数据（或演练提交流程），补齐发现性最后一环。
