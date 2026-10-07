---
title: "MCP 开发入门 · 第 4 章：资源与提示"
description: "Resources 的 URI 模板与订阅、Prompts 的参数化模板、三原语的选择决策表。"
publishDate: 2026-10-21T09:00:00
tags: ["mcp", "agent", "教程"]
---

> 本文对应官方规范[《Resources》](https://modelcontextprotocol.io/docs/2026-07-28/server/resources)与[《Prompts》](https://modelcontextprotocol.io/docs/2026-07-28/server/prompts)。

**学习目标**：掌握 Tools 之外的两个原语，能对"这个能力该做成什么"做出正确选择，给 notes-mcp 补齐资源和提示模板。

工具是模型的手，但一个 Server 只会"动手"是残缺的。**资源**让应用把你的数据当上下文素材读走，**提示**让用户一键触发你预设的整套指令。

## Resources：给应用的素材

资源是**应用控制**的数据源：Host 决定读什么、什么时候读（比如把打开的文件、检索到的笔记塞进上下文），模型只是看到内容。

```ts
import { ResourceTemplate } from "@modelcontextprotocol/server"

// 静态资源：全部笔记索引
server.registerResource(
  "notes-index",
  "notes://index",
  { title: "笔记索引", description: "所有笔记的 id 与标题列表", mimeType: "application/json" },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify((await loadNotes()).map(n => ({ id: n.id, text: n.text }))),
    }],
  }),
)

// 动态资源：URI 模板，一条注册覆盖全部单篇
server.registerResource(
  "note",
  new ResourceTemplate("notes://note/{id}", { list: undefined }),
  { title: "单条笔记", description: "按 id 取一条笔记原文" },
  async (uri, { id }) => {
    const note = await findNote(Number(id))
    if (!note) throw new Error(`笔记 ${id} 不存在`)
    return {
      contents: [{ uri: uri.href, mimeType: "text/plain", text: note.text }],
    }
  },
)
```

要点：

- **URI 是身份**：`notes://index`、`notes://note/42`——Server 自己定义 scheme 与结构，Host 按 URI 缓存与去重；
- 返回 `contents` 数组（一个资源可以多块），`mimeType` 帮 Host 决定怎么呈现；
- 数据变化时发 **`notifications/resources/list_changed`** 或单条 `resources/updated` 通知（配合订阅），Host 才知道该刷新——静态缓存 + 主动通知，是资源比"每次都调工具查"省上下文的根本原因。

## Prompts：给用户的快捷指令

提示是**用户主动选择**的模板：用户在 Host 的斜杠菜单里点它，Server 返回一段现成的 messages 序列。

```ts
server.registerPrompt(
  "summarize-note",
  {
    title: "总结笔记",
    description: "把指定 id 的笔记总结成三个要点",
    argsSchema: z.object({ id: z.string().describe("笔记 id") }),
  },
  async ({ id }) => {
    const note = await findNote(Number(id))
    if (!note) throw new Error(`笔记 ${id} 不存在`)
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `请把下面这条笔记总结成三个要点，每点不超过 20 字：\n\n${note.text}`,
        },
      }],
    }
  },
)
```

注意提示返回的是 **messages（对话序列）**，不是工具那样的结果——它是"预填好的 prompt"，可以组合多条 user/assistant 消息造出 few-shot 结构，纯静态参数没有它做不到的表达力。

## 三原语选择表

| 场景 | 用什么 | 为什么 |
| --- | --- | --- |
| "帮我把这条记下来"（有副作用） | Tool | 模型自主、可审批 |
| "我笔记里有什么"（Host 主动取数据进上下文） | Resource | 可缓存、可订阅、不占模型决策 |
| "帮我总结这条笔记"（固定套路） | Prompt | 用户一键触发、模板可调参 |
| 大文件/长内容按需取 | Resource | 模型先看摘要，需要再读全文 |

判断口诀：**有副作用 → 工具；应用喂给模型的数据 → 资源；用户点一下触发的流程 → 提示**。拿不准时问一句：这个动作发生时，是模型在说话（tool）、应用在组装上下文（resource）、还是用户在点菜单（prompt）？

## 踩坑提示

- 把"查数据"全做成工具——每次都要模型决策 + 占用往返，纯读取且结构稳定的数据做成资源更省；
- 资源内容变了不发通知——Host 拿旧缓存，模型读到过期数据还浑然不觉；
- prompt 模板里硬编码业务文案——`argsSchema` 让用户传参，模板才有复用价值；
- 资源 URI 里塞查询参数当 API 用——资源是"可读状态"，带参数的行为语义请做成工具。

## 练习

1. 注册 `notes://note/{id}` 模板资源与 `notes://index` 静态资源，在 Host 里同时用工具和资源取同一条笔记，观察两者在 UI 里的呈现差异。
2. 写一个 `plan-day` 提示模板：参数 `focus`（今日重点），生成的 prompt 要求模型读取笔记索引后给出当日计划。
3. 给 notes 增加"存档"操作后触发 `resources/list_changed`，验证 Host 侧索引会刷新。
