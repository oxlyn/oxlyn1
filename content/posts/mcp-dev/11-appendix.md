---
title: "MCP 开发入门 · 附录：协议与 SDK 速查"
description: "JSON-RPC 消息与方法表、三原语决策表、TS SDK API 速查、安全检查清单与资源链接。"
publishDate: 2026-10-28T09:00:00
tags: ["mcp", "agent", "教程"]
---

本系列的核心约定浓缩成四张表，调试和设计时回查。

## 消息与方法速查

```jsonc
// 请求（带 id）／响应（同 id）／通知（无 id）
{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {…}}
{"jsonrpc": "2.0", "id": 1, "result": {…}}
{"jsonrpc": "2.0", "method": "notifications/initialized"}
```

| 方法 | 方向 | 作用 |
| --- | --- | --- |
| `initialize` | C→S | 握手：版本 + 能力协商 |
| `ping` | 双向 | 存活探测 |
| `tools/list` / `tools/call` | C→S | 工具发现 / 调用 |
| `resources/list` / `resources/read` | C→S | 资源发现 / 读取 |
| `resources/subscribe` / `updated` | C→S / S→C | 资源订阅与变更通知 |
| `prompts/list` / `prompts/get` | C→S | 提示模板发现 / 取模板 |
| `notifications/tools/list_changed` | S→C | 工具清单变化 |
| `elicitation/create` | S→C | 服务器向用户要确认/输入 |

## 三原语决策表

| | Tools | Resources | Prompts |
| --- | --- | --- | --- |
| 谁驱动 | 模型自主 | 应用/宿主 | 用户主动 |
| 有无副作用 | 通常有 | 只读 | 无（产出消息） |
| 传输形态 | `callTool` → content | `readResource` → contents | `getPrompt` → messages |
| 记忆口诀 | 给模型"手" | 给应用"素材" | 给用户"快捷指令" |

## TS SDK API 速查

```bash
npm install @modelcontextprotocol/server @modelcontextprotocol/client zod
```

| 端 | 导入 | 关键 API |
| --- | --- | --- |
| Server | `@modelcontextprotocol/server` | `new McpServer({ name, version })` |
| | | `registerTool(name, { description, inputSchema, annotations }, handler)` |
| | | `registerResource(name, uri/template, meta, handler)` |
| | | `registerPrompt(name, { argsSchema }, handler)` |
| | `@modelcontextprotocol/server/stdio` | `new StdioServerTransport()` |
| | `…/server`（HTTP） | `new StreamableHTTPServerTransport({ sessionIdGenerator })` |
| Client | `@modelcontextprotocol/client` | `new Client({ name, version })` |
| | | `connect(transport)` → `listTools()` → `callTool({ name, arguments })` → `close()` |
| | `@modelcontextprotocol/client/stdio` | `new StdioClientTransport({ command, args, env })` |

通用规则：处理函数返回 `{ content: [{ type: "text", text }] }`；业务失败加 `isError: true`；stderr 是日志自由区，stdio 下 stdout 是协议禁区。

## 安全检查清单

- 最小权限：每个工具只暴露必需能力与参数
- annotations 如实标注（readOnlyHint / destructiveHint）
- 破坏性操作有确认路径（elicitation 或显式 confirm 参数）
- 返回内容不拼接不可信来源的指令式文本
- 凭据只走 env（stdio）或 OAuth（HTTP），不进代码/日志/错误消息
- Host 侧：工具定义变更重新审批，工具结果与模型指令隔离呈现

## 资源

- 文档首页：[modelcontextprotocol.io](https://modelcontextprotocol.io)——`/llms.txt` 是全站索引
- 本系列对齐的规范版本：[2026-07-28](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro)
- TypeScript SDK：npm 搜 `@modelcontextprotocol/server` / `client`
- 官方示例 Server：[modelcontextprotocol.io/examples](https://modelcontextprotocol.io/examples)
- 调试：[Inspector 文档](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector)（Web / CLI / TUI）

## 进阶路线

1. **Python SDK / 多语言**——协议不变，换语言重写第 2 章的 notes-mcp；
2. **服务端部署**——HTTP 传输的 Server 上云，与筹备中的 Hono + Cloudflare Workers 系列会合；
3. **深入 Agent**——回到[《从零实现 Agent》](/posts/agent-from-scratch/)，用 MCP 重构它的工具层；
4. **OAuth 深水区**——规范 [Authorization](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/authorization) 章节逐条实现。
