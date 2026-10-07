---
title: "LLM 应用评测入门 · 第 9 章：Agent 的评测"
description: "多步轨迹评测：过程分（工具调用序列）与结果分（任务完成度）、环境回放、notes-mcp 实战。"
publishDate: 2026-12-01T09:00:00
tags: ["agent", "evals", "教程"]
---

> 本文对应 [promptfoo 的 Agent 评测](https://www.promptfoo.dev/docs/configuration/expected-outputs/)与 [OpenAI 评测指南](https://platform.openai.com/docs/guides/evals)中 agent 评估部分；回放机制与[《从零实现 Agent》第 11 章](/posts/agent-from-scratch/11-offline-testing/)衔接。

**学习目标**：把评测从"单轮文本"扩展到"多步 Agent"——评轨迹（工具调用对不对）也评结果（任务完成没），学会用回放环境让评测可重复。

单轮问答的评测在一轮调用内结束；Agent 的产出是**一条轨迹**：多次工具调用、中间观察、最终回答。轨迹评测的核心分歧：**该评过程还是评结果？**答案是分层评两者——但先用对方法。

## 过程分：轨迹即断言对象

Agent 的每一步都有确定形状（工具名 + 参数），第 3 章的确定性断言在这里全面复活：

```js
{ id: "agent-traj-001",
  input: "记一条：周五前还书，并告诉我现在有几条笔记",
  trajAsserts: [
    { step: 1, type: "tool", name: "add_note",
      argsMatch: { text: /周五前还书/ },
      note: "第一步必须先落盘笔记，期限信息不得丢失" },
    { step: 2, type: "tool", name: "list_notes", argsMatch: {},
      note: "第二步清点数量" },
    { step: "final", type: "contains", value: "还书",
      note: "最终回答应提及任务内容" },
  ] }
```

- **步序断言**：第几步调用什么工具、参数匹配什么模式——错序、跳步、多余调用都能定位到步；
- **负向断言**：不得调用写工具（只读任务）、不得重复调用同一工具（死循环检测）；
- 轨迹是结构化数据，全程**零裁判成本**——Agent 评测里性价比最高的部分。

## 结果分：终局对不对

过程全对、结果可能仍错（工具返回异常后 Agent 编了个数）。结果分三类判法：

1. **可验证终局**：查数据库确认笔记真的写进去了——执行类断言（第 3 章天花板）在 Agent 层的用法；
2. **裁判终局**：把"任务 + 最终回答"交给 [LLM-as-judge](/posts/evals-dev/04-llm-as-judge/)（criteria 型用例的主场）；
3. **人工抽检**：新能力的首批用例，人工先标定再自动化。

## 回放：让多步评测可重复

Agent 评测最大的工程障碍是**不确定性**：外部工具（真写库、真请求网络）让同一轨迹两次都走不一样。解法是**回放环境**——[Agent 系列第 11 章](/posts/agent-from-scratch/11-offline-testing/)的"离线测试与回放"在评测视角下的完整形态：

```text
录制：真实/受控会话，把每个工具调用的响应对存成 fixtures
回放：评测时工具调用被拦截，命中 fixture 返回录制响应
效果：轨迹确定化 → 断言稳定 → 回归可进 CI
```

[MCP 系列](/posts/mcp-dev/09-testing-and-publishing/)第 9 章的"mock fs 的单测"与本章的 fixtures 是同一思想的两级粒度：单工具 mock、全轨迹回放。注意 fixtures 要**定期重录**——被依赖的服务升级后，旧回放测的是幻影。

## notes-mcp 轨迹评测实战

贯穿项目收口：第 2 章的单轮用例升级为轨迹用例——

```text
smoke 层  ：3 条主干轨迹（记一条 / 查一条 / 删一条），步序断言 + 回放
regression：10 条混合任务（一步多工具、参数歧义、拒写场景），步序 + 结果双断言
对抗层    ：注入样本（第 10 章），断言"轨迹不出现越权工具调用"
```

跑在[第 5 章 runner](/posts/evals-dev/05-runner/)上，被测方从"单次调用"换成"完整 Agent 循环 + 回放工具层"——runner 代码一行不用改，**这就是第 5 章把 subject 设计成函数的回报**。

## 踩坑提示

- 只评最终文本——中间错序调用同样真实地伤害用户（写了又删、重复扣费），过程必须单独评；
- 轨迹断言写死每一步——对创造性任务过严，合法的替代路径被误杀；断言关键约束而非逐帧复制；
- 回放 fixtures 永不更新——测的是早已不存在的接口行为，重录进维护日程；
- Agent 评测不进 CI——多步评测贵就全留人工，退化无人知晓；回放化后冒烟层照样分钟级。

## 练习

1. 给 notes-mcp 写 3 条步序断言用例，配 fixtures 回放，跑通"轨迹确定化"的完整链路。
2. 构造一个"过程对、结果错"的用例（工具异常后编造数据），验证结果分断言能抓住。
3. 把你的 Agent Skills 回归清单（[第 8 章](/posts/agent-skills-dev/08-debugging/)）中可回放的条目迁进轨迹评测，对比人工回归的时间差。
