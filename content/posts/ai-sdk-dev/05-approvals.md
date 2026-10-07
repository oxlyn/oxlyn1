---
title: "AI SDK 6 实战 · 第 5 章：工具审批"
description: "toolApproval 配置、tool-approval-request/response 消息流、useChat 侧的确认 UI——人工在环的标准件。"
publishDate: 2026-12-09T09:00:00
tags: ["ai-sdk", "agent", "教程"]
---

> 本文对应官方文档[《Tool Approvals》](https://ai-sdk.dev/docs/agents/tool-approvals)。

**学习目标**：掌握 `toolApproval` 的配置形态与"请求-响应"消息流，在 Node 与 useChat 两侧各实现一次人工确认，对照手写权限门禁与 MCP 的审批体系。

[手写权限系统](/posts/agent-from-scratch/05-permissions/)要在工具执行前插入确认逻辑，改一处权限要动循环代码；[MCP 的审批](/posts/mcp-dev/08-security/)靠 Host 与 annotations。AI SDK 6 把"人工在环"做成了 Agent 的标准配置项——**哪些工具需要人点头，声明即可**。

## toolApproval：声明哪些工具要人审

```ts
const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-5.5",
  tools: { searchNotes, addNote, removeNote },
  toolApproval: {
    searchNotes: "not-applicable",                       // 只读，直接放行
    addNote: "approved",                                 // 自动批准
    removeNote: "user-approval",                         // 必须人工确认
  },
})
```

三种粒度：**字符串常量**（每个工具一个策略）、**策略函数**（按输入动态判定，如"删除超过 10 条才要确认"）、**通用函数**（读 `toolCall`/`messages` 做全局策略）。函数返回 `'not-applicable' | 'approved' | 'denied' | 'user-approval'`——**最小权限的静态部分留在这里，[MCP 的 annotations](/posts/mcp-dev/03-tools/) 与之同构**：readonlyHint 对应 not-applicable，destructiveHint 对应 user-approval。

## 消息流：请求与响应

`user-approval` 触发时，循环**暂停**，产出一条待办：

```ts
const result = await agent.generate({ messages })
for (const part of result.content) {
  if (part.type === "tool-approval-request") {
    // part.approvalId, part.isAutomatic —— 呈现给用户确认
  }
}
```

人工决定后，把响应塞回消息继续跑：

```ts
messages.push({
  role: "tool",
  content: [{
    type: "tool-approval-response",
    approvalId: part.approvalId,
    approved: true,
    reason: "用户确认删除",
  }],
})
await agent.generate({ messages })      // 从中断处继续
```

对照[手写门禁](/posts/agent-from-scratch/05-permissions/)：当时是在循环里插 `await confirm()`——同步阻塞、只适合终端。SDK 的方案是**把确认变成消息协议**：中断点可序列化、可存库、可异步等几小时——这正是 Web 场景（用户可能在第二天点确认）必需的形状。

## useChat 侧：确认 UI 的接线

React/Vue 的聊天钩子里，待审工具的 part 带 `state: "approval-requested"`，UI 渲染确认框后一行回传：

```ts
addToolApprovalResponse({ id: part.approval.id, approved: false })
```

配合 `lastAssistantMessageIsCompleteWithApprovalResponses` 的自动发送辅助，"AI 想删文件 → UI 弹窗 → 用户拒绝 → AI 收到拒绝原因换个方案"的完整闭环，前端代码不到十行——**[mini-host 第 3 个练习](/posts/mcp-dev/06-client/)模拟过的审批逻辑，在这里是框架原生的**。

## 三套审批机制的合流

至此本站出现了三套"执行前确认"，值得并排看清：

| 机制 | 层 | 粒度 |
| --- | --- | --- |
| [MCP annotations](/posts/mcp-dev/03-tools/) | 服务器声明 | 给 Host 的提示（提示不拦截） |
| [手写权限门禁](/posts/agent-from-scratch/05-permissions/) | Agent 循环内 | 代码级任意逻辑 |
| AI SDK `toolApproval` | Agent 配置 | 声明式策略 + 消息化中断 |

它们不冲突：MCP 服务器声明"我可能危险"，Host 侧的 SDK 审批决定"要不要问人"。[MCP 第 8 章](/posts/mcp-dev/08-security/)的检查清单在这里落地成配置。

## 踩坑提示

- 策略函数返回 undefined——语义是 not-applicable（放行），想做"默认拒绝"要显式返回 denied；
- 审批响应的 approvalId 与请求对不上——中断点存取消息时要原样保存 content 数组，别只存文本；
- 把敏感操作的 reason 免了——拒绝原因会回给模型，"不批"三个字不如"误操作风险，请改用软删除"，模型需要的是下一步指引（[MCP 第 3 章](/posts/mcp-dev/03-tools/)的 isError 同理）；
- 终端脚本里用 useChat 方案——那是 UI 层 API；Node 侧直接读 `tool-approval-request` part 自己写确认。

## 练习

1. 给 notes Agent 配置三档策略：search 自动放行、add 自动批准、remove 走 user-approval，跑一次完整中断-恢复流程。
2. 写策略函数："批量删除超过 3 条时才要人工确认"，用评测用例验证边界（[evals 第 3 章](/posts/evals-dev/03-deterministic-assertions/)的轨迹断言正好可用）。
3. 把手写权限门禁的规则表翻译成 `toolApproval` 策略函数，对比两版的行为差异与可读性。
