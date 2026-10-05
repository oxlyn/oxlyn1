---
title: "从 0 开始实现一个 Coding Agent：教程总览"
description: "一套基于 DeepSeek Harness 代码库的中文学习教程：从一次裸的模型 API 调用开始，一章一章增加能力，最终长成完整的 coding agent。"
publishDate: 2026-10-05T20:30:00
tags: ["教程", "agent"]
---

# 从 0 开始实现一个 Coding Agent

一套基于 DeepSeek Harness 代码库的中文学习教程:从一次裸的模型 API 调用开始,一章一章增加能力,最终长成一个具备工具调用、权限审批、持久化会话、上下文压缩、子代理委托和插件化架构的完整 coding agent——每一步都与本仓库(deepseek-harness)的真实实现逐点对照。

## 这份教程怎么读

- **每章一个可运行快照**:第 1–3 章是三个独立的单文件程序;第 4 章起升级为模块化工程 [code/mini-agent/](code/mini-agent/),后续每章给它增加一个模块;第 9 章用插件内核重组出 [code/mini-agent-plugin/](code/mini-agent-plugin/);第 10–11 章补齐系统提示词与离线测试(第 11 章全程不联网)。全部代码零第三方依赖,可直接运行。
- **每章固定的结构**:学习目标 → 概念 → 完整代码解读 → 运行 → 设计要点与坑 → **对照 DeepSeek Harness**(真实文件路径 + 行号)→ 练习 → 遗留问题(引出下一章)。
- **"对照"是本教程的主菜**:你写的每一段简化实现,都能在真实仓库里找到对应物(更完整、更防御、可组合)。学到第 9 章,你已经能读懂 `docs/architecture.md` 的 Turn flow 全图;第 10–11 章补上提示词与测试两块拼图。

## 环境准备

```sh
# Node ^22.19 || >=24(仓库同款引擎要求)
node -v

# DeepSeek API key(https://platform.deepseek.com)
export DEEPSEEK_API_KEY=sk-...
```

运行方式(任意章节代码,在任意工作目录下执行):

```sh
# Node 22 需要 --experimental-strip-types;Node >= 23.6 直接 node 即可
DEEPSEEK_API_KEY=sk-... node --experimental-strip-types code/01-chat.ts
DEEPSEEK_API_KEY=sk-... node --experimental-strip-types code/mini-agent/main.ts "整理这个目录"
DEEPSEEK_API_KEY=sk-... node --experimental-strip-types code/mini-agent/main.ts --resume .mini-agent/sessions/<file>.jsonl   # 恢复会话
DEEPSEEK_API_KEY=sk-... node --experimental-strip-types code/mini-agent-plugin/main.ts "..."                                # 插件版(MINI_SESSION=<file> 固定会话文件)
```

没有 API key 也可以学:每章的"概念"与"对照"部分都不需要联网;第 6 章的回归测试可直接离线运行(`node --experimental-strip-types code/mini-agent/test-session.ts`),第 9 章的插件装载过程在启动阶段即可离线观察。

## 章节地图

| 章 | 主题 | 新增能力 | 教程代码 | Harness 真实实现 |
|---|---|---|---|---|
| [1[/posts/agent-from-scratch/01-minimal-chat/] | 最简实现 | 一次模型调用、消息角色、多轮对话 | `code/01-chat.ts` | `packages/llm/llm`(消息词汇与适配器接缝) |
| [2[/posts/agent-from-scratch/02-agent-loop/] | Agent 循环 | 工具调用、while 循环、step/turn | `code/02-agent-loop.ts` | `packages/core/agent-loop` |
| [3[/posts/agent-from-scratch/03-streaming/] | 流式输出 | SSE 解析、统一事件词汇、组装器 | `code/03-streaming.ts` | `packages/llm/llm`(StreamChunk / BlockAssembler)+ `llm-deepseek` |
| [4[/posts/agent-from-scratch/04-real-tools/] | 真实工具 | bash 执行器(超时/截断/退出码)、读、写、改 | `mini-agent/tools.ts` | `packages/shell/tool-bash`、`packages/fs/tool-fs` |
| [5[/posts/agent-from-scratch/05-permissions/] | 权限与安全 | 权限门、审批渠道、fail-closed | `mini-agent/permissions.ts` | `packages/core/tools` 管线、`packages/interaction/user-approval`、`packages/sandbox` |
| [6[/posts/agent-from-scratch/06-session-log/] | 会话日志 | append-only JSONL、投影推导、resume 与崩溃修复 | `mini-agent/session.ts` | `packages/core/session`、`packages/session/session-persistence-jsonl` |
| [7[/posts/agent-from-scratch/07-compaction/] | 上下文压缩 | 阈值、缓存友好摘要、replace 投影 | `mini-agent/compaction.ts` | `packages/compaction/compaction-basic`、`packages/llm/token-meter` |
| [8[/posts/agent-from-scratch/08-subagent/] | 子代理 | 委托、三重隔离、深度预算 | `mini-agent/subagent.ts` | `packages/subagent/subagent`、`packages/subagent/tool-subagent` |
| [9[/posts/agent-from-scratch/09-plugin-architecture/] | 插件化 | 服务注册、可逆注册、waterfall 事件 | `mini-agent-plugin/` | `vendor/cordis` + 全仓库的插件体系 |
| [10[/posts/agent-from-scratch/10-system-prompt/] | 系统提示词与运行时上下文 | section 汇编、上下文快照 + replace 刷新 | `mini-agent/prompt.ts` | `packages/core/system-prompt`、`agent-loop/runtime-context` |
| [11[/posts/agent-from-scratch/11-offline-testing/] | 离线测试与回放 | mock 模型、日志断言、样例日志 | `mini-agent-test/` | `snapshots/`(无密钥回放) |

进阶篇之后另有[术语速查表[/posts/agent-from-scratch/appendix-glossary/]:全书术语 ↔ 仓库对应物一页对照。

## mini-agent 的最终形态

```text
 main.ts:sections 汇编 ─▶ systemPrompt;runtimeContext() 注入(每轮 refresh,replace 原地更新)
   │
   ▼
 ┌──────────────────── Agent 循环:turn ──▶ step ×N ────────────────────┐
 │                                                                     │
 │   session.deriveMessages() ──▶ llm.streamChat() ──▶ assemble()      │
 │         ▲ 历史永远从日志投影(不维护平行数组)          │ 流式事件(text/tool-call delta)        │
 │         │                                                ▼          │
 │         │              assistant/message 落账(先落账,再执行)         │
 │         │                                                │ tool_calls?
 │         │                                                ▼          │
 │   tool/result ◀─ 落账(按 callSeq 配对)◀─ tool.run() ◀─ 权限门        │
 │         │                                          allow/deny/ask   │
 │   压缩:压力超阈值 ─▶ 摘要 ─▶ surface replace 改写投影(日志原样)        │
 └─────────┼───────────────────────────────────────────────────────────┘
           ▼
 session.jsonl(append-only;resume/fork/审计/测试都从它出发)
```

第 9 章把这张图里的"权限门、压缩、工具表、模型"全部换成事件监听者与服务,循环只剩流程编排——对照看两个版本的 `agent.ts` 与 `loop.ts` 是全书最好的复习方式。

## 代码目录

```text
agent-from-scratch/
├── code/
│   ├── 01-chat.ts              # 第 1 章:最简多轮对话
│   ├── 02-agent-loop.ts        # 第 2 章:工具调用 + agent 循环
│   ├── 03-streaming.ts         # 第 3 章:SSE + 事件词汇 + 组装器
│   ├── mini-agent/             # 第 4–8 章(+10)的完整工程
│   │   ├── llm.ts              #   模型层:SSE、StreamChunk、组装器、最小重试
│   │   ├── tools.ts            #   工具集:bash / read / write / edit / list / todo_write
│   │   ├── permissions.ts      #   权限门与审批渠道
│   │   ├── session.ts          #   事件日志、投影、resume、崩溃修复
│   │   ├── compaction.ts       #   压缩:阈值、摘要、replace
│   │   ├── subagent.ts         #   子代理工具
│   │   ├── prompt.ts           #   提示词 section 汇编(第 10 章)
│   │   ├── agent.ts            #   turn/step 循环(把以上全部接起来)
│   │   ├── test-session.ts     #   第 6 章离线回归测试(重放/修复/replace/todo)
│   │   └── main.ts             #   CLI 入口(REPL / 一次性任务 / --resume)
│   ├── mini-agent-plugin/      # 第 9 章:插件化重组
│   │   ├── kernel.ts           #   100 行内核:provide/inject + effect + 事件
│   │   ├── plugins.ts          #   session / llm / tools / permissions / compaction 插件
│   │   ├── loop.ts             #   agent-loop 插件(决策点全走事件)
│   │   └── main.ts             #   组装 + 第三方 audit 插件演示
│   ├── mini-agent-test/        # 第 11 章:离线测试
│   │   ├── mock-llm.ts         #   脚本化假模型(与真实 LlmService 同形)
│   │   ├── test-offline.ts     #   不联网跑通完整循环,断言落在日志上
│   │   └── record-sample.ts    #   生成示例会话日志(可复现)
│   └── examples/
│       └── session.sample.jsonl  # 第 6/7 章注解用的示例日志(mock 生成)
└── 01…11-*.md + appendix       # 本教程的十一章 + 术语表
```

mini-agent 的会话日志落在运行目录的 `.mini-agent/sessions/` 下,可随时用 `--resume` 恢复;Ctrl+C 中断当前轮(已产生的输出保留),空闲时 Ctrl+C 退出。

## 贯穿全书的五条设计原则

这些原则在每章反复出现,也刻在 DeepSeek Harness 的每一行代码里:

1. **model-visible ⟺ logged**——模型看到的一切,必须能从会话日志重建;日志里没有的,绝不发给模型(第 2、6 章)。
2. **日志只追加**——改写历史 = 投影 replace;原文永不删除,审计与恢复才有地基(第 6、7 章)。
3. **fail-closed**——审批、沙箱、未知工具、坏渠道:拿不准就拒绝,绝不静默放行(第 5 章)。
4. **策略外挂**——工具本体零权限代码;行为 = 事件监听者的组合,扩展 = 挂新插件(第 5、9 章)。
5. **显式 > 隐式**——缺依赖、缺服务、缺渠道,宁可 fail loud,也不静默给默认值(第 9 章)。

## 学完之后

- 跑一次真实 Harness:`pnpm dsh --profile headless "读取当前目录结构并总结"`(需要 `DEEPSEEK_API_KEY`;profile 与启动机制见 [docs/architecture.md](docs/architecture.md))。
- 通读 [docs/architecture.md](docs/architecture.md):此时它的每个名词——turn/step、surface、attempt、seam、profile——你都已亲手实现过简化版(不认识的词查[术语表[/posts/agent-from-scratch/appendix-glossary/]。
- 想给 Harness 写工具:[docs/cookbook/adding-a-tool.md](docs/cookbook/adding-a-tool.md) 是你做完第 4 章后的自然延续;想写插件:从 [docs/cordis-tutorial/](docs/cordis-tutorial/index.md) 与 [docs/cordis-primer.md](docs/cordis-primer.md) 进入。
- 想看某个子系统的生产级细节:各章"对照"小节里的 `packages/**` 路径就是入口,配套文档在 `docs/subsystems/`。
