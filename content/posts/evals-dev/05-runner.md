---
title: "LLM 应用评测入门 · 第 5 章：最小评测运行器"
description: "零依赖自研 100 行 runner：加载用例、并发调用、跑断言、出报告，缓存与成本护栏。"
publishDate: 2026-11-27T09:00:00
tags: ["agent", "evals", "教程"]
---

> 本章是工程实践综合：运行器结构对应 [node:test](https://nodejs.org/docs/latest/api/test.html) 的组织方式（见[《Node.js 核心入门》第 10 章](/posts/node-core/10-test-debug-ship/)）。

**学习目标**：亲手写一个约百行的评测运行器——把第 2~4 章的零件（用例集、断言、裁判）串成"一条命令出报告"的回归设施，理解缓存与成本护栏的设计。

评测生态有现成工具（第 9 章总览），但**先用百行代码亲手串一遍**，你才能在换任何框架时知道每个配置项背后在发生什么——[mini-host](/posts/mcp-dev/06-client/) 教学法的复用。

## 骨架：四步流水线

```text
加载用例(JSONL) → 并发执行(调被测方) → 评分(断言阶梯) → 报告(markdown)
```

```ts
// runner.mjs —— 零依赖
import { readFile } from "node:fs/promises"

// 1. 加载
export async function loadCases(file) {
  const lines = (await readFile(file, "utf8")).trim().split("\n")
  return lines.map((l) => JSON.parse(l))
}

// 2. 执行：被测方是任意 async 函数（模型调用 / MCP client.callTool / 技能触发）
export async function runCase(c, subject) {
  const out = await subject(c.input)                 // { text, toolCall? }
  const results = await Promise.all(
    (c.asserts ?? []).map((a) => evaluate(a, out, c)), // 断言阶梯：代码 → 裁判
  )
  const score = results.filter((r) => r.pass).length / Math.max(results.length, 1)
  return { id: c.id, score, results, out }
}

// 3. 并发 + 成本护栏
export async function runAll(cases, subject, { concurrency = 4, cache } = {}) {
  const queue = [...cases]
  const results = []
  async function worker() {
    for (;;) {
      const c = queue.shift()
      if (!c) return
      if (cache?.has(c.id)) return results.push(cache.get(c.id))  // 缓存命中
      const r = await runCase(c, subject)
      cache?.set(c.id, r)
      results.push(r)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}

// 4. 报告：markdown 一张表 + 失败样本全文
export function report(results) {
  const avg = results.reduce((s, r) => s + r.score, 0) / results.length
  const lines = [
    `# 评测报告`,
    ``,
    `| 用例 | 得分 | 失败断言 |`,
    `| --- | --- | --- |`,
    ...results.map((r) =>
      `| ${r.id} | ${r.score.toFixed(2)} | ${r.results.filter((x) => !x.pass).map((x) => x.note).join("；") || "—"} |`),
    ``,
    `**平均分：${avg.toFixed(3)}**`,
  ]
  return lines.join("\n")
}
```

与 [node:test](/posts/node-core/10-test-debug-ship/) 对照着看：`runCase` 之于 `test()`、`evaluate` 之于 `assert`、`report` 之于测试报告——**同一套心智，换一种被测对象**。差异只有两处：断言可能异步（裁判是模型调用）、结果有分数而非二值。

## 评分器阶梯的接线

`evaluate` 按[第 3 章阶梯](/posts/evals-dev/03-deterministic-assertions/)分发：

```ts
export async function evaluate(a, out, c) {
  if (a.type === "contains") return { pass: out.text.includes(a.value), note: a.note }
  if (a.type === "regex")    return { pass: new RegExp(a.value).test(out.text), note: a.note }
  if (a.type === "judge")    return judge(out, c)     // 第 4 章的裁判提示词 + 解析 SCORE:
  // ……schema / 相似度 / 执行
}
```

裁判调用**最后执行、且带缓存**——同一用例同一产出不重复计费。

## 成本护栏

评测跑的是真金白银的模型调用，运行器内置三道闸：

- **并发上限**（默认 4）——防限流，防账单惊吓；
- **缓存**——同版本被测方 + 同用例直接复用结果；被测方版本号变了缓存整体失效；
- **冒烟模式**——`--tags smoke` 只跑冒烟层（第 2 章的分层在这里兑现为参数）。

## 失败样本是最大的资产

报告里除了表格，**每个失败用例要附完整产出原文**。修复循环（改提示词 → 重跑 → 看失败样本）的效率取决于"看失败有多快"——这一条设计让调试时间从分钟级降到秒级。失败样本同时是第 2 章说的"事故回放用例"的来源，回流进用例集。

## 踩坑提示

- 并发不设限直连生产接口——限流 429 雪崩连累真实用户，评测环境与流量隔离；
- 缓存键忘了版本号——改了提示词还在吃旧缓存，分数纹丝不动还以为没生效；
- 裁判结果不缓存——回归十次，裁判账单十倍；
- 报告只有平均分——平均分掩盖"三条全挂"的结构性退化，永远带失败明细。

## 练习

1. 把四步流水线跑起来：被测方先写死一个"总是回复固定文本"的假函数，确认报告与缓存路径都工作。
2. 接入真被测方（notes-mcp 的 `callTool` 或任意模型 API），跑第 2 章的 10 条用例，得到第一份真实报告。
3. 给 runner 加 `--tags` 参数与"分数低于基线即退出码 1"，为第 7 章的 CI 门禁做准备。
