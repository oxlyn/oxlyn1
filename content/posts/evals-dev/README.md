---
title: "LLM 应用评测入门：把 AI 产出变成可回归的工程"
description: "Evals 系列教程总览：用例集、确定性断言、LLM-as-judge、评测运行器、A/B 对比、CI 门禁、可观测性与安全红队。"
publishDate: 2026-12-04T09:00:00
tags: ["agent", "evals", "教程"]
---

"改了提示词，好像更好了"——这句话是 AI 工程里最贵的错觉。评测（Evals）把它变成工程：固定的用例、分层的评分、可重复的回归。2026 年评测驱动开发已是 AI 工程的共识纪律：Agent 从尝鲜走向生产，可靠性的差距不在模型，在**有没有一套跑得起来的评测**。本系列从零建成一套能跑、能比、能进 CI 的评测工程。

> 内容依据 [OpenAI Evaluation 指南](https://platform.openai.com/docs/guides/evals)、[Anthropic 成功标准](https://platform.claude.com/docs/en/docs/build-with-claude/define-success-criteria)与 2026 年评测生态实践整理，代码示例均为原创（TypeScript 零依赖 runner），每章附官方文档链接。前置：[《Node.js 核心入门》](/posts/node-core/)的测试章。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：为什么评测](/posts/evals-dev/01-why-evals/) | 概率产出 vs 断言、评测三要素、EDD 循环 | [OpenAI Evaluation](https://platform.openai.com/docs/guides/evals) |
| [第 2 章：用例集](/posts/evals-dev/02-dataset/) | 黄金用例、字段设计、冒烟/回归/全量分层 | [OpenAI Evaluation](https://platform.openai.com/docs/guides/evals) |
| [第 3 章：确定性断言](/posts/evals-dev/03-deterministic-assertions/) | 五类代码断言、优先级阶梯、部分分 | [promptfoo Assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/) |
| [第 4 章：LLM-as-judge](/posts/evals-dev/04-llm-as-judge/) | 裁判模板、锚点量表、四大偏差与缓解 | [裁判最佳实践](https://www.openlayer.com/blog/llm-as-judge-evaluation-guide) |
| [第 5 章：最小评测运行器](/posts/evals-dev/05-runner/) | 百行 runner、并发与缓存、成本护栏、报告 | [node:test](https://nodejs.org/docs/latest/api/test.html) |
| [第 6 章：A/B 对比](/posts/evals-dev/06-ab-compare/) | 换序成对、胜率与样本量、留出集防过拟合 | — |
| [第 7 章：接入 CI](/posts/evals-dev/07-ci/) | 双轨触发、基线门禁、报告产物 | [promptfoo CI](https://www.promptfoo.dev/docs/integration/ci-cd/) |
| [第 8 章：可观测性与数据飞轮](/posts/evals-dev/08-observability/) | trace 结构、采样回流、在线指标 | — |
| [第 9 章：Agent 的评测](/posts/evals-dev/09-agent-evals/) | 轨迹过程分、终局结果分、fixtures 回放 | [Agent 离线测试](/posts/agent-from-scratch/11-offline-testing/) |
| [第 10 章：安全评测与红队](/posts/evals-dev/10-red-team/) | 注入/越狱/幻觉/过拒四类用例、模型更新门禁 | [promptfoo red-team](https://www.promptfoo.dev/docs/red-team/) |
| [附录：速查与生态](/posts/evals-dev/11-appendix/) | 格式表、断言表、模板、偏差清单、工具表 | — |

## 贯穿项目：notes 家族的评测基线

老朋友的最后一程——给前三条线的产物建立质量设施：

```text
第 2 章  notes-mcp 的黄金用例集（主干 + 边界 + 事故回放）
第 5 章  零依赖 runner 跑出第一份回归报告
第 7 章  双轨 CI 门禁上线（PR 冒烟 + 夜间全量）
第 9 章  轨迹评测 + fixtures 回放（Agent 循环全面接入）
第 10 章 安全对抗集与零容忍基线
```

连同 [series-planner 技能](/posts/agent-skills-dev/10-blog-workflow/)的评测，本站整个 AI 工作流从此"改动必回归、回归必门禁"。

## 三条主线

1. **标准与判分**（第 2、3、4 章）——用例集怎么攒、断言怎么分层、裁判怎么可信；
2. **设施**（第 5、6、7 章）——runner、A/B 对比、CI 双轨门禁；
3. **生产闭环**（第 8、9、10 章）——数据飞轮、Agent 轨迹评测、安全红队。

## 运行环境

Node 22+，零依赖起步（第 5 章自研 runner 只用标准库）；跑真实评测需一个模型 API key 或本地端点（[Ollama](/posts/nuxt-dev/10-modules-and-deploy/) 风格的 OpenAI 兼容接口即可）；CI 章以 GitHub Actions 为例，任何平台等价。

## 遗留问题

- 多模态评测（图像、语音产出）未覆盖，方法学同源但断言生态差异大；
- RAG 专项指标（忠实度、检索命中率）只在 [RAGAS](https://docs.ragas.io/) 处点到为止，深挖属于筹备中的上下文工程系列；
- 统计检验的严格数学（显著性、置信区间）以工程常识呈现，学术深水区见各章引用的研究。
