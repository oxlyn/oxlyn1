---
title: "LLM 应用评测入门 · 附录：速查与生态"
description: "用例格式速查、断言类型表、judge 提示词模板、偏差清单、工具生态表与资源链接。"
publishDate: 2026-12-03T09:00:00
tags: ["agent", "evals", "教程"]
---

本系列的格式、断言与流程浓缩成五张表。

## 用例格式速查

```jsonl
{"id": "稳定可读 id",
 "input": "用户输入原文",
 "ideal": "唯一理想产出（配代码断言）",
 "criteria": "判定标准，无唯一答案（配裁判）",
 "asserts": [{"type": "contains|regex|schema|similar|exec|judge", "…": "…"}],
 "trajAsserts": [{"step": 1, "type": "tool", "name": "工具名", "argsMatch": {}}],
 "tags": ["smoke|regression|security", "能力维度"]}
```

分层：冒烟 5~10 条（每次改动）/ 回归 30~100 条（每日）/ 全量 100+（夜间每周）。

## 断言类型表（优先级阶梯）

| 类型 | 适合 | 成本 | 失效场景 |
| --- | --- | --- | --- |
| contains / 正则 | 关键词、格式、编号 | 零 | 语义等价改写 |
| JSON Schema | 工具调用、结构化输出 | 零 | 语义正确性 |
| 相似度（embedding） | 摘要、改写类 | 低 | 事实型精确判断 |
| 执行类（跑代码/查库） | 生成的代码、终局状态 | 低 | 无执行环境的任务 |
| LLM 裁判 | 含义、质量、时机 | 高 | 阶梯下层能判的 |

规则：**下层能判的绝不上层；一条产出叠多条断言出部分分**。

## 裁判提示词模板

```text
[任务背景] …
[用例输入] {input}    [待评回答] {output}    [评分标准] {criteria}
评分量表（1~5，每档一句锚点描述）
先逐条对照标准给出依据（引用原文）→ 最后一行 SCORE: <1-5>
```

校准：20~30 条人工标注 vs 裁判，一致率（±1 分）>85% 才可用；criteria 或量表每改一版重新校准。

## 偏差与缓解清单

| 偏差 | 缓解 |
| --- | --- |
| 位置偏差 | 成对比较换序重评，取一致结果 |
| 冗长偏差 | 量表明写"长度不加分" |
| 自我偏好 | 裁判与被测不同模型族 |
| 格式偏差 | 量表聚焦内容标准 |

## 工具生态表（2026-10）

| 工具 | 定位 | 选它当你需要 |
| --- | --- | --- |
| [promptfoo](https://www.promptfoo.dev/docs/intro/) | CLI 断言驱动，快 | 单元式冒烟、CI 门禁、红队、多模型矩阵 |
| [DeepEval](https://github.com/confident-ai/deepeval) | 代码内 LLM 指标库 | 丰富的裁判型指标、pytest 式集成 |
| [Braintrust](https://www.braintrust.dev) | 托管全生命周期平台 | 实验跟踪、在线评测、团队协作 |
| [RAGAS](https://docs.ragas.io/) | RAG 专项指标 | 检索质量（忠实度、相关性）的现成量表 |
| [OpenAI 评测指南](https://platform.openai.com/docs/guides/evals) | 方法论与自家工具 | 对照官方建议校准自己的流程 |

自研 runner（第 5 章）的定位：理解原理、小团队起步；以上任一工具都能无缝替换它，因为**数据与流程是本系列教的，工具只是外壳**。

## 资源

- 方法论：[OpenAI Evaluation 指南](https://platform.openai.com/docs/guides/evals) / [Anthropic Define success criteria](https://platform.claude.com/docs/en/docs/build-with-claude/define-success-criteria)
- 裁判研究：[LLM-as-judge 指南（OpenLayer）](https://www.openlayer.com/blog/llm-as-judge-evaluation-guide) / [位置偏差与换序一致性](https://mbrenndoerfer.com/writing/position-bias-in-llm-judges)
- 观测标准：OpenTelemetry GenAI 语义约定（trace 字段与第 8 章对齐）

## 进阶路线

1. **测试系列**（筹备中）——Vitest 测确定性代码 + Playwright 测 UI，与本系列的 CI 门禁并轨；
2. **上下文工程深化**——评测分数背后的大头是[上下文质量](/posts/mcp-dev/07-context/)，检索与压缩的优化实验请用第 6 章的 A/B 跑；
3. **红队规模化**——[promptfoo red-team](https://www.promptfoo.dev/docs/red-team/) 的攻击策略库补足手工样本的天花板；
4. **回到 Agent**——给[《从零实现 Agent》](/posts/agent-from-scratch/)接上本章回放评测，完成"从 0 实现 → 从 0 验收"的闭环。
