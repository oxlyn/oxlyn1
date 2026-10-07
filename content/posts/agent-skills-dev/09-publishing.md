---
title: "Agent Skills 开发入门 · 第 9 章：发布与跨工具"
description: "标准字段与工具专属字段的边界、打包分享、跨工具兼容检查、GitHub 技能库的组织与许可。"
publishDate: 2026-11-19T09:00:00
tags: ["agent", "skills", "教程"]
---

> 本文对应 [agentskills.io 规范](https://agentskills.io/specification)与[客户端列表](https://agentskills.io/clients)。

**学习目标**：分清"标准字段"与"工具专属字段"，把技能发布成可分享、可跨工具、可长期维护的资产。

写给自己用的技能，文件夹就是全部；要让**别人（或别的工具）**用，就得考虑标准的严格边界。

## 字段的两级体制

SKILL.md 的 frontmatter 字段分两级，**发布前必须收敛到标准级**：

| 级别 | 字段 | 说明 |
| --- | --- | --- |
| **标准字段**（跨工具） | `name`、`description`、`license`、`compatibility`、`metadata`、`allowed-tools` | 所有兼容工具都认识 |
| **工具专属** | `when_to_use`、`argument-hint`、`disable-model-invocation`、`model`、`context: fork`、`hooks`、`paths` 等 | 各家自行扩展，互不通用 |

三条规则：

- 专属字段在别家工具里通常被**静默忽略**——被忽略的 `when_to_use` 意味着触发词丢失，所以**发布版把触发词全部写进 description**（它属于标准字段，也是全局硬约束：Claude 系工具对 description 区约 1536 字符截断）；
- `compatibility` 字段（≤500 字符）专门用来声明"我需要哪些工具/环境"，发布时写清；
- 有些严格场景（如 claude.ai 上传、官方打包脚本）遇到多余专属字段会**直接报错**——发布版干净，开发版随意。

**metadata 是标准的逃生舱**：自由 YAML map，把版本、作者、来源链接放这里，既跨工具可读又不污染字段名空间。

## 打包与分享

技能是纯文件，分享协议任选：

- **GitHub 仓库**（主流做法）：一个技能一个目录，README 挂使用说明；官方维护着[示例技能仓库](https://github.com/anthropics/skills)，文档类、设计类、办公文档处理类技能都在里面，是最好的结构参考；
- **直接复制目录**：发给同事，扔进各自的技能目录即用；
- **插件市场**：技能 + MCP + 命令打包成插件时走插件渠道（第 7 章）。

发布前检查单：

- [ ] frontmatter 只剩标准字段，description 自含全部触发词
- [ ] SKILL.md 首行是 `---`，YAML 无语法错误
- [ ] 正文内引用全部是相对路径（第 5 章），无绝对路径、无本机用户名
- [ ] scripts/ 在干净机器上可跑（无全局依赖、无硬编码路径）
- [ ] 有 license 与 compatibility 声明
- [ ] 用另一个兼容工具实测一遍核心任务

## 跨工具兼容的现实

开放标准的兼容性不是 100% 等价，三类差异要有预期：

1. **触发机制**：自动触发的判定细节各家不同（模型不同、描述截断点不同）——你的 description 要在"最笨"的客户端上也能命中；
2. **专属能力**：`context: fork`、`hooks` 这类能力别家没有，技能里做了假设的指令在别家会降级——核心流程别依赖专属字段；
3. **调用方式**：手动调用的入口（斜杠菜单等）各家叫法不同，但"AI 读文件夹执行指令"的核心语义一致。

实践建议：**双工具回归**——发布前至少在两个不同厂商的工具上跑一遍回归清单（第 8 章），差异记进 compatibility。

## 收录与可见性

标准由 [agentskills/agentskills](https://github.com/agentskills/agentskills) 开放治理，工具厂商的兼容实现汇总在[官方客户端列表](https://agentskills.io/clients)。想让技能被生态发现：仓库写清安装方式与触发示例、提交到社区技能索引、或在兼容性确认后向客户端列表提收录——2026 年的技能生态正在复制早年 npm 的路径：**先有格式标准，再有分发网络**。

## 踩坑提示

- 发布版留着 `when_to_use` 里的关键触发词——别家工具读不到，触发率腰斩；发布前合并进 description；
- 正文里教 AI 调用你机器上的工具（`open`、特定路径的 node）——别人跑不通，脚本依赖写进 compatibility；
- 把公司内部流程技能公开发布——先脱敏：环境名、密钥名、内网 URL 全部参数化；
- 没写 license——别人法律上无权复用，技能库再好也传播不动。

## 练习

1. 把 `post-frontmatter` 的 `when_to_use` 合并进 description，加 `compatibility` 与 `metadata`，完成一份"可发布版"。
2. 在另一个支持 SKILL.md 的工具上跑你的回归清单，把行为差异记进 compatibility 字段。
3. 给你的技能仓库补 README（安装、触发示例、许可）并开源，完成一次真实的生态投放。
