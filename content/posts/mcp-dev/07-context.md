---
title: "MCP 开发入门 · 第 7 章：上下文工程"
description: "工具结果即上下文、分页 cursor、返回体积控制、通知与订阅——一切按 token 计费的协议。"
publishDate: 2026-10-24T09:00:00
tags: ["mcp", "agent", "教程"]
---

> 本文对应官方规范[《Pagination》](https://modelcontextprotocol.io/docs/2026-07-28/server/utilities/pagination)与[《Caching》](https://modelcontextprotocol.io/docs/2026-07-28/server/utilities/caching)。

**学习目标**：把"工具结果是上下文的一部分"内化成设计直觉，掌握分页、体积控制与通知机制，为长会话守住上下文预算。

[《从零实现 Agent》第 7 章](/posts/agent-from-scratch/07-compaction/)讲过：Agent 的生死在于上下文预算。MCP 是这个战场的前线——**工具返回的每个字节都会变成 token 进上下文**。MCP 因此内置了一整套"上下文经济学"设施，本章把它们用对。

## 分页：cursor 模式

所有"列表"操作（`tools/list`、`resources/list`、`prompts/list`）都遵循统一的 cursor 分页：

```jsonc
// 客户端第一页
{"jsonrpc": "2.0", "id": 1, "method": "resources/list"}
// 服务器响应：结果 + 下一页游标（opaque，别解析它）
{"result": {"resources": […], "nextCursor": "eyJvZmZzZXQiOjIwfQ"}}
// 客户端带 cursor 取下一页
{"jsonrpc": "2.0", "id": 2, "method": "resources/list", "params": {"cursor": "eyJvZmZzZXQiOjIwfQ"}}
```

规则：有 `nextCursor` 就还有下一页，没有就到底了。SDK 的 `listTools()` 默认帮你翻完——**Server 侧在工具/资源成百时务必实现分页**，Host 侧尊重 cursor 而不是试图一口气全拉。

## 体积控制：Server 的责任

工具返回 500 KB 的 JSON，Host 只能硬吞。控制权在 Server 手里：

```ts
async ({ keyword, limit = 10 }) => {
  const notes = await searchNotes(keyword)
  if (!notes.length) {
    return { isError: true, content: [{ type: "text", text: `没有包含"${keyword}"的笔记` }] }
  }
  const total = notes.length
  const shown = notes.slice(0, limit)
  return {
    content: [{
      type: "text",
      text: shown.map(n => `#${n.id} ${n.text}`).join("\n")
        + (total > limit ? `\n（共 ${total} 条，仅显示前 ${limit} 条，可用 limit 参数调整）` : ""),
    }],
  }
}
```

四条经验：**默认 limit 给小**（10 不是 1000）；**长文本给摘要 + 按需取全文**（配合资源：列表给 id，`notes://note/{id}` 给原文）；**结构化数据给精简字段**而不是整包 JSON dump；**告诉模型"还有更多"**，让它自己决定要不要再取。

## 通知与订阅：上下文保鲜

会话是长的，世界是动的。MCP 的通知机制让"变化"流动起来：

```ts
// 工具/提示清单变化时（动态注册场景）
await server.sendToolListChanged()

// 资源变化：Host 订阅后，服务器逐条通知
// Host: resources/subscribe { uri: "notes://note/42" }
// Server: notifications/resources/updated { uri: "notes://note/42" }
```

没有通知，Host 只能轮询——每轮轮询都是一次上下文刷新成本。设计 Server 时问自己：**哪些状态变化值得让 Host 知道？**变化频率低、影响判断的（工具清单、关键资源）发通知；高频噪音不要发。

## 上下文预算的一笔账

一次典型交互的 token 开销：工具清单（每次对话都带）+ 每次调用的结果。这解释了三个"第 3 章规定"的深层原因——description 要精炼（清单重复计费）、工具要少而正交（清单本身占预算）、结果要克制（每个字节都进上下文）。**MCP 开发的尽头是上下文工程**：协议只是搬运工，省 token 才是设计目标。

## 踩坑提示

- Server 返回流式大结果不切块——超过 Host 的消息上限直接断连；大数据走资源分页读。
- 把日志当结果返回——`sendLoggingMessage`（stderr/logging 通道）才是日志，别混进 content；
- 通知风暴——状态每秒变十次还每次都发，Host 侧要么限流要么拉黑；合并变更再发；
- Host 侧缓存了 schema 却不更新——模型拿着旧参数形状调用必失败，订阅 `list_changed` 或定期重拉。

## 练习

1. 给 notes-mcp 造 30 条测试笔记，实现 `resources/list` 的分页，用 cursor 翻三页验证。
2. 把 `search_notes` 的返回改成"id + 摘要前 30 字 + 总数提示"，对比改造前后两次调用的返回体积。
3. 在添加/删除笔记后发资源变更通知，配合第 4 章的订阅机制跑通"改了 → Host 知道"。
