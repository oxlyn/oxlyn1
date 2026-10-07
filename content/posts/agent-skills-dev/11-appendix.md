---
title: "Agent Skills 开发入门 · 附录：字段与模板速查"
description: "frontmatter 字段两级表、目录模板、description 检查清单、反模式清单与资源链接。"
publishDate: 2026-11-21T09:00:00
tags: ["agent", "skills", "教程"]
---

本系列的约定浓缩成四张表，写技能、调技能、发技能时回查。

## frontmatter 字段速查

| 字段 | 级别 | 作用 |
| --- | --- | --- |
| `name` | 标准 | 技能名，小写连字符，缺省取目录名 |
| `description` | 标准 | 触发路由器：做什么 + 何时用（发布版必须自含全部触发词） |
| `license` | 标准 | 分发许可 |
| `compatibility` | 标准（≤500 字符） | 声明所需工具/环境 |
| `metadata` | 标准（自由 map） | 版本、作者、来源等自管理元数据 |
| `allowed-tools` | 标准 | 允许的工具白名单 |
| `when_to_use` | Claude Code 专属 | 补充触发上下文（与 description 合计约 1536 字符截断） |
| `argument-hint` / `arguments` | 专属 | 手动调用的参数提示与命名参数 |
| `disable-model-invocation` | 专属 | 关闭自动触发（仅手动） |
| `model` / `effort` / `context: fork` 等 | 专属 | 运行参数，跨工具不可假设 |

规则：**发布版收敛到标准字段**；专属字段在别家被静默忽略甚至硬报错。

## 目录模板

```text
my-skill/
├── SKILL.md                 # 首行必须是 ---
│                            # 导航页：概览 + 流程 + 按需加载路标 + 常见错误
├── references/              # 按需阅读的大块资料（两层为限）
├── assets/                  # 模板与样板（复制填充，不逐字读）
└── scripts/                 # 确定性脚本（自包含、幂等、OK/FAIL 输出契约）
```

## description 检查清单

- [ ] 第三人称，一段话回答"做什么 + 何时用"
- [ ] 动词开头，对象与产出具体到可判定
- [ ] 含 3~5 个用户会脱口而出的触发词
- [ ] 含反例（"……不适用，用 xxx 技能"）
- [ ] 有只有本技能才有的独家领域词
- [ ] 无实现细节、无第一人称、无空泛动词（"协助处理"）

## 反模式清单

| 反模式 | 后果 | 解法 |
| --- | --- | --- |
| 千行 SKILL.md | 激活贵、注意力散 | 拆 references，SKILL.md 做导航（<500 行） |
| 描述过宽/过窄 | 误触发 / 永不触发 | 独家领域词 + 排他反例 + 触发词 |
| 指令用"参考/酌情/等等" | 产出漂移 | 改成可验证的祈使句 + 示例 |
| 引用绝对路径 | 换机即断 | 相对 SKILL.md 的路径 |
| 脚本输出无契约 | AI 无法据以行动 | OK/FAIL 前缀 + 每行自包含 |
| 改技能不回归 | 静默劣化 | TESTING.md 四象限全量回归 |
| 发布版带专属字段 | 别家忽略或报错 | 收敛到标准字段 |

## 资源

- 开放标准：[agentskills.io](https://agentskills.io)（[Specification](https://agentskills.io/specification) / [客户端列表](https://agentskills.io/clients)）
- 标准治理：[github.com/agentskills/agentskills](https://github.com/agentskills/agentskills)
- Claude Code 技能文档：[code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)
- 官方示例技能库：[github.com/anthropics/skills](https://github.com/anthropics/skills)

## 进阶路线

1. **组合 MCP**——给本系列技能配上 [notes-mcp](/posts/mcp-dev/02-first-server/)，技能指挥协议（回看第 1 章分工表）；
2. **评测深化**——给技能的回归清单升级成自动化评测（LLM 应用评测系列，筹备中）；
3. **插件化**——技能 + MCP + hooks 打包分发，结构与 [DSH 插件开发](/posts/dsh-plugin-dev/)的思路互证；
4. **回到 Agent**——用[《从零实现 Agent》](/posts/agent-from-scratch/)的运行时读一遍技能文件夹，亲手实现发现→激活→执行。
