---
title: "Agent Skills 开发入门 · 第 6 章：脚本化"
description: "确定性工作交给代码：scripts/ 的输出契约、动态上下文注入、技能脚本与 MCP 工具的选型边界。"
publishDate: 2026-11-16T09:00:00
tags: ["agent", "skills", "教程"]
---

> 本文对应官方标准[《Specification》](https://agentskills.io/specification)的 scripts 布局与 [Claude Code 技能文档](https://code.claude.com/docs/en/skills)的动态上下文章节。

**学习目标**：学会把"每次都要做对"的机械步骤写成脚本，掌握脚本与 AI 的输出契约，理解技能内脚本与 [MCP 工具](/posts/mcp-dev/03-tools/)的选型边界。

LLM 是概率机器，日期计算、字段校验、批量改名这类**确定性操作**让它现场发挥既慢又险。技能的隐藏大招：文件夹里可以带**可执行脚本**——AI 读指令后用它的 shell 工具运行脚本，只消费输出。**判断力交给模型，计算力交给代码。**

## 第一个脚本

```js
// scripts/validate_frontmatter.mjs —— 校验文章 frontmatter
import { readFileSync } from "node:fs"

const file = process.argv[2]
if (!file) {
  console.error("用法：node validate_frontmatter.mjs <文章路径>")
  process.exit(2)
}
const raw = readFileSync(file, "utf8")
const m = raw.match(/^---\n([\s\S]*?)\n---/)
if (!m) {
  console.error(`FAIL: ${file} 缺少 frontmatter`)
  process.exit(1)
}
// ……逐字段校验，违规逐行输出 FAIL: 原因
console.log(`OK: ${file} 通过校验`)
```

SKILL.md 里的接入方式是把**调用方法写进指令**：

````markdown
## 校验

产出或修改 frontmatter 后，运行：

```bash
node scripts/validate_frontmatter.mjs <文章路径>
```

- 输出 OK → 通过；
- 输出 FAIL 行 → 按 FAIL 指明的问题修复后重跑，直到 OK；
- 退出码非 0 时不要提交。
````

## 输出契约：写给"下游是 AI"的接口

脚本与 AI 的接口就是 stdout/stderr/退出码，三条契约让协作可靠：

1. **每行输出自包含**——`FAIL: publishDate 格式错误，应为 YYYY-MM-DDTHH:MM:SS`——AI 拿到单行就能行动，不用回读代码；
2. **机器结论 + 人话原因**——前缀 OK/FAIL 定状态，后半句说为什么（[node-core 第 10 章](/posts/node-core/10-test-debug-ship/)的 assert 语句同款风格）；
3. **错误也走 stdout 或带结构**——AI 的 shell 捕获通常拿到合并输出，别把关键判定只写进 stderr 的堆栈里。

**幂等**是第四条隐性契约：脚本可能被 AI 重跑多次，副作用必须可重复（校验可以，"追加一行日志"不行）。

## 动态上下文：把环境信息注入指令

一类特殊脚本不产出文件，而是**在技能加载前把自己的输出注入上下文**：

````markdown
---
name: series-planner
---

# 系列大纲规划

当前站点已有序列（自动注入）：

```!`ls content/posts/`
```

规划新系列时避开以上目录名，时间线顺延其最后日期之后。
````

在指令里写"```!`command`"形式的注入块（反引号内包命令），AI 读到 SKILL.md **之前**命令就会执行、输出被替换进来——技能因此能携带"当下的事实"（目录列表、当前分支、git 状态），而不是一份会过期的静态清单。注意：命令失败会让整个技能调用中止，注入命令要选稳定、快速、无副作用的。

## 与 MCP 工具的选型边界

| | 技能内脚本 | MCP 工具 |
| --- | --- | --- |
| 本质 | 本地文件里的代码，AI 用 bash 跑 | 独立进程暴露的标准接口 |
| 适合 | 一次性、本地、随技能走的小逻辑 | 多工具共用、需连接外部系统 |
| 分发 | 跟着技能文件夹走（git 即分发） | 装 Server、管进程与授权 |
| 修改 | 改文件即生效 | 改代码重部署 |

口诀：**逻辑长在技能里，连接长在 MCP 上**。校验一个 md 文件，写脚本；读写你的笔记库给所有 AI 用，做 [MCP Server](/posts/mcp-dev/02-first-server/)（notes 家族两种形态正好各占其一）。技能还能反过来**编排 MCP**：指令里写"调用 xxx 工具前先跑校验脚本"——两层机制是组合关系（第 1 章）。

## 踩坑提示

- 脚本里塞业务逻辑正文——脚本管确定性计算，"怎么写文章"的判断留在指令；
- 输出一堆调试日志污染结论行——结论放最后且带 OK/FAIL 前缀，日志归日志；
- 用了依赖环境强假设的命令（特定 shell、特定路径）——技能会跨机器跑，node:fs 与相对路径是安全区；
- 注入命令读敏感文件（.env）——它进上下文且可能随日志留存，注入只放无害的元信息。

## 练习

1. 补全校验脚本（title 格式、日期格式、tags 必含"教程"三条规则），故意喂坏数据看输出契约是否够 AI 修复。
2. 给 `series-planner` 加上"当前目录列表"的动态上下文注入（形如 `!`ls content/posts/`` 的一行），观察加载时上下文里出现目录清单。
3. 把"校验 frontmatter"同时设想成 MCP 工具，写出两种方案的三条利弊对比（可参考 notes 家族的分工）。
