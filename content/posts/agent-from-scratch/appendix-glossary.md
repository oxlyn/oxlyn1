---
title: "从 0 开始实现一个 Coding Agent · 附录：术语速查表"
description: "全书术语与 deepseek-harness 仓库对应物的一页对照。"
publishDate: 2026-09-05T09:00:00
tags: ["教程", "agent"]
---

# 附录 · 术语速查表

全书出现的关键术语,按出场顺序;每条给出仓库对应物,便于与 `docs/` 与源码互查。

| 术语 | 出处 | 一句话定义 | 仓库对应物 |
|---|---|---|---|
| role(消息角色) | 第 1 章 | system/user/assistant(+tool/developer)标识"谁在说话" | `packages/llm/llm/src/message.ts` MessageRoleMap |
| adapter seam(适配器接缝) | 第 1、3 章 | "怎么调模型"的可替换接口,上层只认中立词汇 | `LlmAdapter` / `ctx.llm` |
| tool schema(工具三件套) | 第 2 章 | 模型可见的 name/description/parameters;其余字段永不上 wire | `ToolSchema`(`llm/src/types.ts:473`) |
| turn / step | 第 2 章 | 一轮用户输入的全部工作 / 一次模型请求+其工具 | `agent-loop/src/agent.ts` turn()/step() |
| tool_call 配对 | 第 2、6 章 | 每个调用必须有且只有一个结果,否则 API 拒绝、历史非法 | `tool/call` + `tool/result` + `sourceEventSeqs` |
| SSE / delta | 第 3 章 | 服务端逐帧推送;增量碎片按 index 聚拢 | `llm-deepseek/src/sse.ts` |
| StreamChunk | 第 3 章 | 协议无关的流事件词汇(text-delta/tool-call-delta/usage/finish) | `llm/src/types.ts:452` |
| 组装器 | 第 3 章 | 事件流 → 完整消息;丢弃未完成的调用 | `BlockAssembler`(`llm/src/assembler.ts`) |
| attempt | 第 3 章 | 一次带重试语义的请求封装;失败碎片只落日志不进历史 | `assistant/attempt` + `llm-retry` |
| marker vs isError | 第 4 章 | 业务失败(退出码)给模型看 / 基础设施失败走异常通道 | `tool-bash/src/render.ts` |
| spill(输出落盘) | 第 4 章 | 超长输出存临时文件,历史只留"预览 + 定位符" | `bash-local` + `packages/spill` |
| pre-execute gate | 第 5 章 | 工具执行前的 allow/deny/ask 裁决 | `tools/pre-execute` 瀑布 |
| fail-closed | 第 5 章 | 拿不准就拒绝;渠道坏了也拒绝,绝不静默放行 | `packages/interaction/user-approval` |
| 审批渠道 | 第 5 章 | 注入的"问人"途径;不给渠道 = 全拒 | `ctx.approval` |
| 沙箱 | 第 5 章 | OS 级文件/进程边界,argv 级包裹;与审批正交 | `ctx.sandbox`(Seatbelt/bwrap/ACL) |
| monotonic guard | 第 5 章 | 只能拒绝不能翻案的单调规则 | 工具注册表 guards |
| 提示词注入 | 第 5 章 | 模型读入的"数据"冒充指令;审批与沙箱的盲区 | ——(纵深缓解,无银弹) |
| append-only 日志 | 第 6 章 | 事件只追加;改写历史 = 投影 replace,原文永不删改 | `packages/core/session` |
| seq / 信封 | 第 6 章 | 事件单调序号与 {seq,time,type,data} 信封;跳号即损坏 | `SessionSeq` |
| log-only 事件 | 第 6 章 | 只记审计、不进模型历史的事件 | `tool/call`、`turn/*`、`approval/*` |
| surface / surfaceOp | 第 6 章 | 模型可见投影;append/replace 两种折叠方式 | `session/src/surface.ts` |
| 历史代(generation) | 第 6 章 | 格式版本的不可变文件;迁移生成新文件,旧代永不动 | `session.vN.jsonl` + 硬链接发布 |
| resume / fork | 第 6、8 章 | 从日志重建会话 / 复制前缀开新会话 | `Session.open` / `SessionStore.fork` |
| model-visible ⟺ logged | 第 6 章 | 模型看到的一切必须能从日志重建 | 运行时不变式(`runtime-diagnostics`) |
| 前缀缓存友好 | 第 7 章 | 摘要请求复用会话自身前缀,provider KV cache 命中 | `compaction-basic/src/summarizer.ts` |
| 影子定价 | 第 7 章 | 被压缩区间的 token 记账,保证估算连续 | `packages/compaction` types |
| 委托深度 | 第 8 章 | 子代理递归预算,写进 header,resume 后仍生效 | `delegationDepth` |
| capability seam | 第 9 章 | Service Definition / Provider / Consumer 三角色接缝 | `docs/architecture.md` Capability seams |
| waterfall | 第 9 章 | 环绕事件链:next() 委托,不调即短路 | `vendor/cordis/src/events.ts` |
| effect | 第 9 章 | 可逆注册原语,卸载时逆序回卷 | `fiber.effect()` |
| section 汇编 | 第 10 章 | 提示词由多提供者的段装配而成 | `ctx.systemPrompt.assemble` |
| 运行时上下文快照 | 第 10 章 | 会过期的环境信息以 user 消息进历史并原地刷新 | `runtime-context.ts` |
| 回放测试 | 第 11 章 | 提交的日志既是回放输入又是期望输出 | `snapshots/` + `test:snapshot` |
