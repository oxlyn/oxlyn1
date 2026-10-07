---
title: "Agent Skills 开发入门：给 AI 写技能"
description: "Agent Skills 系列教程总览：SKILL.md 规范、触发设计、渐进披露、脚本化、团队复用、调试回归与发布兼容。"
publishDate: 2026-11-22T09:00:00
tags: ["agent", "skills", "教程"]
---

你每次让 AI 干固定的事，都要把同样的要求重新讲一遍——技能（Agent Skills）把这份"重复交付的知识"变成一个文件夹：**一个 SKILL.md，AI 按需加载**。2025 年底 Anthropic 将其开放为标准后，2026 年它已成为跨工具的事实规范——Claude Code、Codex、Gemini CLI、Cursor、VS Code 等数十家工具认同一个格式。写技能是当下投入产出比最高的 AI 工程技能：不需要 API、不需要部署，会写 Markdown 就能开始。

> 内容依据 [agentskills.io 开放标准](https://agentskills.io)与 [Claude Code 官方文档](https://code.claude.com/docs/en/skills)（2026 年 10 月状态）整理，示例均为原创，每章附官方文档链接。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：技能是什么](/posts/agent-skills-dev/01-what-is-a-skill/) | 文件夹即技能、渐进披露三阶段、与 MCP 的分工 | [Overview](https://agentskills.io) |
| [第 2 章：第一个技能](/posts/agent-skills-dev/02-first-skill/) | SKILL.md 骨架、安装层级、手动与自动触发验证 | [Specification](https://agentskills.io/specification) |
| [第 3 章：描述的艺术](/posts/agent-skills-dev/03-description-art/) | 触发路由器、黄金结构、1536 字符预算 | [Specification](https://agentskills.io/specification) |
| [第 4 章：指令写作](/posts/agent-skills-dev/04-instructions/) | 祈使句任务书、示例与防呆清单、500 行上限 | [官方技能仓库](https://github.com/anthropics/skills) |
| [第 5 章：渐进披露与资源组织](/posts/agent-skills-dev/05-progressive-disclosure/) | references/assets/scripts、导航式重构、token 经济账 | [Specification](https://agentskills.io/specification) |
| [第 6 章：脚本化](/posts/agent-skills-dev/06-scripts/) | 输出契约、幂等、动态上下文注入、与 MCP 选型 | [Claude Code Skills](https://code.claude.com/docs/en/skills) |
| [第 7 章：组合与复用](/posts/agent-skills-dev/07-composability/) | 粒度原则、三级安装优先级、团队 git 化 | [Claude Code Skills](https://code.claude.com/docs/en/skills) |
| [第 8 章：调试与评测](/posts/agent-skills-dev/08-debugging/) | 三层归因、描述撞车、回归任务清单 | [Claude Code Skills](https://code.claude.com/docs/en/skills) |
| [第 9 章：发布与跨工具](/posts/agent-skills-dev/09-publishing/) | 标准字段 vs 专属字段、打包检查单、双工具回归 | [Clients](https://agentskills.io/clients) |
| [第 10 章：实战整合——博客工作流](/posts/agent-skills-dev/10-blog-workflow/) | 把本站规范编码成 series-planner 技能库 | 全系列综合 |
| [附录：字段与模板速查](/posts/agent-skills-dev/11-appendix/) | 字段两级表、目录模板、检查清单、反模式 | — |

## 贯穿项目：博客工作流技能库

本系列的贯穿项目就是本站自己：从第 2 章的 `post-frontmatter`（元数据规范）起步，第 5 章拆出 references，第 6 章配上校验脚本，第 10 章完成压轴的 `series-planner`——**把"总览+10 章+附录、一天一篇、官方文档链接"这套站点规范完整编码进技能**，AI 一次生成符合全站体例的系列大纲，格式零漂移。你正在读的这个系列，写作流程本身就是它的第一份测试用例。

## 三条主线

1. **格式与触发**（第 1、2、3 章）——SKILL.md 规范、安装层级、description 路由设计；
2. **内容工程**（第 4、5、6 章）——指令文风、渐进披露的 token 经济、确定性脚本；
3. **资产管理**（第 7、8、9、10 章）——组合复用、调试回归、发布兼容、真实工作流落地。

## 运行环境

任意支持 SKILL.md 的 Agent 工具（Claude Code / Codex CLI / Gemini CLI / Cursor 等，开放标准通用）；章节操作以通用写法为主，工具专属字段会明确标注。零 API key、零部署——技能是文件，git 就是分发。

## 遗留问题

- 各工具专属字段的细节差异以[各家文档](https://agentskills.io/clients)为准，本系列只覆盖标准面；
- 技能的自动化评测（评测集、LLM-as-judge）在筹备中的评测系列展开；
- 多技能编排的进阶模式（总控技能、条件分支）第 7 章点到为止，实战篇见第 10 章。
