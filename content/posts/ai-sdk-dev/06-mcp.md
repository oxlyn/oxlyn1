---
title: "AI SDK 6 实战 · 第 6 章：接入 MCP"
description: "把 notes-mcp 的工具接入 AI SDK Agent：适配模式与内建支持、三套工具形态的合流。"
publishDate: 2026-12-10T09:00:00
tags: ["ai-sdk", "agent", "教程"]
---

> 本章为综合实战：MCP 能力见 [ai-sdk.dev 官方文档](https://ai-sdk.dev/docs/agents/overview)（v6 内建 MCP 支持，具体 API 以文档为准），协议细节回看[《MCP 开发入门》](/posts/mcp-dev/)。

**学习目标**：把 [notes-mcp](/posts/mcp-dev/02-first-server/) 服务器的工具接入 AI SDK 的 Agent——理解"MCP 服务器声明能力、SDK 侧消费能力"的分工，完成本站工具体系的三线合流。

## 两种来源，一个 tools 对象

AI SDK 的 Agent 只认 `tools` 对象（[第 3 章](/posts/ai-sdk-dev/03-tools/)的 `tool()` 产物）；MCP 服务器是**工具的远程来源**。v6 内建了 MCP 支持——把 MCP 服务器的工具清单接进 `tools` 后，调用、审批、轨迹全都走 SDK 的统一路径。内建能力覆盖不到的部署形态，用适配层手动桥接（下节），两种方式的骨架相同：

```text
MCP server（notes-mcp）
   │ listTools → name/description/inputSchema
   │ callTool → content 块
   ▼
适配：tool({ description, inputSchema, execute: () => callTool(...) })
   ▼
ToolLoopAgent 的 tools 对象
```

## 适配层：二十行桥接

即便未来 API 细节变化，适配模式恒定——[评测系列第 9 章](/posts/evals-dev/09-agent-evals/)的"方案 A"同款：

```ts
import { tool } from "ai"
// mcp: 第 6 章（MCP 系列）的 Client，listTools / callTool 可用

async function mcpToolsToSdkTools(mcp) {
  const { tools } = await mcp.listTools()
  const sdkTools = {}
  for (const t of tools) {
    sdkTools[t.name] = tool({
      description: t.description,
      inputSchema: z.object(mcpSchemaToZod(t.inputSchema)),   // JSON Schema → zod
      execute: async (args) => {
        const r = await mcp.callTool({ name: t.name, arguments: args })
        return r.content.map((b) => b.text).join("\n")         // content 块 → 文本
      },
    })
  }
  return sdkTools
}

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-5.5",
  tools: { ...(await mcpToolsToSdkTools(notesMcp)), ...localTools },
})
```

三个转换点（都是[协议形状](/posts/mcp-dev/01-protocol-and-architecture/)的既定映射）：**inputSchema**（JSON Schema → zod，工具参数类型直接恢复）、**callTool 结果**（content 块 → 字符串）、**isError**（转错误说明文本或抛出，按第 3 章的约定）。写完这二十行，notes 的 CLI、MCP、SDK 三种客户端共享**同一份 store 业务层**——[贯穿项目](/posts/mcp-dev/README.md)的最终形态。

## 内建支持与适配的取舍

v6 内建 MCP 后，什么时候还手写适配？决策点有三：

- **连接形态**：内建支持覆盖主流 stdio/HTTP 传输；特殊网络环境（内网网关、自定义鉴权）适配层更灵活；
- **审批与轨迹**：走内建支持的工具自动享受 [toolApproval](/posts/ai-sdk-dev/05-approvals/) 与轨迹记录；自研适配层要自己把 `isError`、审批提示接进 SDK 的约定；
- **依赖预算**：内建支持零额外代码；适配层零额外依赖。按团队口味选，**接口形状已经标准，切换成本只剩实现细节**。

## 安全的接力

MCP 工具进 Agent 后，[MCP 第 8 章](/posts/mcp-dev/08-security/)的防线在 SDK 侧的落点：`toolApproval` 接管审批（annotations 是服务器声明，SDK 策略是执行裁决）；[评测第 10 章](/posts/evals-dev/10-red-team/)的注入用例继续有效——被测方从 MCP Host 换成 AI SDK Agent，攻击面与断言完全同构。

## 踩坑提示

- schema 转换丢了 `.describe()` 的字段说明——模型看到的参数文档消失，调用准确率下降；转换时保留 description；
- 适配层吞掉 isError——失败变成成功文本继续推理（[MCP 第 10 章](/posts/mcp-dev/10-ecosystem/)的同款教训），错误必须显式传递；
- 同一能力既挂 MCP 工具又写本地 tool——模型选择混乱，[一个能力一个入口](/posts/mcp-dev/10-ecosystem/)；
- listTools 缓存永不刷新——服务器发 `list_changed` 时 Agent 拿旧清单（[MCP 第 7 章](/posts/mcp-dev/07-context/)）。

## 练习

1. 用适配层把 notes-mcp 的三个工具接进 ToolLoopAgent，跑通"自然语言记笔记 → MCP 执行 → 验证数据落盘"。
2. 写 `mcpSchemaToZod` 的最小实现（object/string/number/description 四种节点），跑通你的 schema。
3. 给接入的 `removeNote` 配上 `toolApproval: "user-approval"`，验证 MCP 来源的工具同样走审批流。
