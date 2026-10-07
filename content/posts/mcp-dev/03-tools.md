---
title: "MCP 开发入门 · 第 3 章：工具设计"
description: "工具的三要素、写给模型看的描述、内容块与 isError 约定、annotations 与审批提示。"
publishDate: 2026-10-20T09:00:00
tags: ["mcp", "agent", "教程"]
---

> 本文对应官方规范[《Tools》](https://modelcontextprotocol.io/docs/2026-07-28/server/tools)。

**学习目标**：掌握工具定义的全部元数据，学会"写给模型看"的描述写法，理解工具失败与协议失败的边界，把 notes 的核心操作补成一套像样的工具面。

工具是 MCP 的 C 位原语——模型自主决定何时调用，是 Agent 拥有"手"的方式。但工具的消费者不是编译器，是**读着描述做决定的 LLM**：工具设计的一半是工程，另一半是提示词。

## 三要素：name、description、inputSchema

```ts
server.registerTool(
  "search_notes",
  {
    title: "搜索笔记",
    description:
      "按关键词搜索笔记，返回匹配的笔记列表。" +
      "当用户询问以前记过的内容时使用；不要用它来添加新笔记。",
    inputSchema: z.object({
      keyword: z.string().describe("搜索关键词，如 'MCP' 或 '购物'"),
      limit: z.number().int().min(1).max(50).default(10)
        .describe("最多返回条数，默认 10"),
    }),
    annotations: {
      title: "搜索笔记",
      readOnlyHint: true,      // 只读：不改变任何状态
      destructiveHint: false,  // 非破坏性
      idempotentHint: true,    // 幂等：查多少次结果一致
      openWorldHint: false,    // 封闭世界：不访问外部未知数据
    },
  },
  async ({ keyword, limit }) => { /* … */ },
)
```

- **name**：给模型看的标识符，用 snake_case 动词短语（`search_notes` 而不是 `doSearch2`）；
- **description**：模型选不选它、传什么参数，全看这几行。写法三问——**干什么、什么时候用、什么时候别用**；
- **inputSchema**：zod 对象转 JSON Schema，`.default()` 给模型省一次决策，`.min()`/`.max()` 当护栏。

[《从零实现 Agent》第 4 章](/posts/agent-from-scratch/04-real-tools/)用类型签名 + 注释干了同样的事，MCP 把它标准化成了可跨进程传输的 schema。

## annotations：给 Host 的元数据

上面例子里的 `annotations` **不是给模型看的**——Host 用它们决定审批 UI 的呈现（只读操作可以自动放行，破坏性操作弹窗确认）。这是第 1 章"Host 管审批"的具体机制，第 8 章安全篇的主角。诚实地声明 hints，就是在帮整个生态做权限。

## 返回：内容块与 isError

工具返回 `{ content: ContentBlock[] }`，支持文本、图片、音频、资源引用四类块：

```ts
// 多块内容：正文 + 说明
return {
  content: [
    { type: "text", text: "找到 3 条匹配笔记：\n1. …\n2. …\n3. …" },
    { type: "text", text: "提示：结果已按时间倒序截取。" },
  ],
}
```

关键约定是**失败的表达**：工具执行了但没成功（文件不存在、搜索无结果、上游 API 超时），**返回 `isError: true` 而不是抛异常**：

```ts
async ({ id }) => {
  const note = await findNote(id)
  if (!note) {
    return {
      isError: true,
      content: [{ type: "text", text: `没有 id 为 ${id} 的笔记，可先用 list_notes 查看` }],
    }
  }
  return { content: [{ type: "text", text: note.text }] }
}
```

模型看到 `isError` 和那段话，会自己修正参数重试（"可先 list_notes 查看"就是给模型的下一步提示）。**协议层错误**（非法参数、方法不存在）由 SDK 在 schema 校验失败时自动回复——两层的分工：schema 管形状，`isError` 管业务。

## notes 工具面收口

至此 notes-mcp 有四个工具：`add_note`（第 2 章）、`search_notes`、`remove_note`（destructiveHint: true）、`update_note`。设计工具面时的两条经验：

- **少而正交**：四个清晰工具好过十二个重叠工具，模型在选项少时决策更准；
- **错误信息写给模型**：带上"下一步该干什么"，错误消息就是工具 UX。

## 踩坑提示

- description 空着或写"do something"——模型要么不选它要么乱传参；写清三问。
- 处理函数里抛异常当业务错误用——SDK 只能回一个笼统的协议错误，模型失去了自我修正的信息；用 `isError`。
- 工具返回巨型列表——上下文（按 token 计费）瞬间撑爆；用 `limit` + 分页（第 7 章），默认值给小一点。
- 只给 `readOnlyHint: true` 却真的写库——Host 可能跳过审批直接执行，hints 是契约不是装饰。

## 练习

1. 给 `search_notes` 补全处理函数（复用 node-core 的 `loadNotes` + `filter`），故意搜索不存在的关键词，验证 `isError` 路径。
2. 为 `remove_note` 写 description 与 annotations，重点写清"什么时候不该用它"。
3. 把一个工具的 description 清空，对比模型调用准确率的变化（这是最直观的提示工程实验）。
