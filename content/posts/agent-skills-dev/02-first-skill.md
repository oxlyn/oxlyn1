---
title: "Agent Skills 开发入门 · 第 2 章：第一个技能"
description: "SKILL.md 骨架、name 与 description 规范、个人级与项目级安装、手动调用与自动触发验证。"
publishDate: 2026-11-12T09:00:00
tags: ["agent", "skills", "教程"]
---

> 本文对应官方标准[《Specification》](https://agentskills.io/specification)与 [Claude Code 技能文档](https://code.claude.com/docs/en/skills)。

**学习目标**：写出第一个规范合法的技能并实机验证，掌握 frontmatter 的字段约束与两种安装层级。

## 最小合法技能

```text
post-frontmatter/
└── SKILL.md
```

````markdown
---
name: post-frontmatter
description: 按博客规范生成或校验文章 frontmatter（title/description/publishDate/tags）。当用户要新建文章、修 frontmatter 报错或问文章元数据规范时使用。
---

# 文章 frontmatter 规范

生成或修复 Markdown 文章头部时遵循以下约定：

1. 五个字段按序：title、description、publishDate、tags；
2. title 一行字符串，"系列名 · 第 N 章：标题" 或 "系列名：副标题"；
3. description 一句话摘要，用顿号列举关键词，不超过 60 字；
4. publishDate 格式 `YYYY-MM-DDTHH:MM:SS`；
5. tags 是小写数组，必含"教程"标签。

示例：

```yaml
---
title: "Node.js 核心入门 · 第 4 章：文件系统与路径"
description: "fs/promises 的读写与目录操作、node:path 跨平台拼路径、file URL。"
publishDate: 2026-10-09T09:00:00
tags: ["nodejs", "教程"]
---
```
````

要点拆解：

- **frontmatter 必须是文件第一行**（`---` 开头），否则整个文件被当正文，元数据为空；
- **name**：小写字母、数字、连字符；省略时默认取目录名——目录名与 name 保持一致最省心；
- **description**：技能的"路由器"，用第三人称写清**做什么 + 什么时候用**（下一章专讲）；
- 正文直接写指令，Markdown 语法，代码块照常。

## 装到哪里

| 层级 | 路径 | 适用 |
| --- | --- | --- |
| **个人级** | `~/.claude/skills/post-frontmatter/SKILL.md` | 你所有项目通用 |
| **项目级** | `<repo>/.claude/skills/post-frontmatter/SKILL.md` | 团队共享，进 git |
| 插件内 | `<plugin>/skills/<name>/SKILL.md` | 以包分发（第 9 章） |

同一技能多层存在时，优先级是**个人 > 项目**（企业策略再压一层）。团队约定走项目级并提交 git——技能从此有了 code review。

> 支持 SKILL.md 的工具安装路径各有差异（Codex、Gemini CLI、Cursor 等），以各家文档为准；文件夹内容本身完全一致——这就是开放标准的意义。

## 两种验证方式

装好后重开会话，先看**发现阶段**：问一句"你有哪些技能可用"，确认列表里出现它且描述完整。然后两种方式触发：

- **手动调用**：`/post-frontmatter`——技能名即命令，确定性触发，适合演示与测试；
- **自动触发**：直接说"帮我新建一篇周记文章"，观察它是否**因为描述匹配**自己加载技能——自动触发才是技能的主战场，也是第 3、8 章调优的对象。

触发后可以直接问它："你刚加载的技能正文讲了什么？"——它复述的内容就是 SKILL.md 的正文，以此确认**激活阶段**真的发生了。

## 贯穿项目启动：博客工作流技能库

本系列的贯穿项目是你眼前这个博客本身。第 2 章产出第一个技能 `post-frontmatter`（如上）；第 5 章给它加 references；第 10 章完成压轴技能 `series-planner`——把"总览+10 章+附录、一天一篇、官方文档链接、踩坑提示+练习"这套站点规范完整编码进去，让 AI 一次生成符合全站体例的新系列大纲。

## 踩坑提示

- 技能列表里看不到——SKILL.md 不在文件夹根（多套了一层目录）、frontmatter 不在首行、或 YAML 语法错（值里冒号后缺空格是重灾区）；
- name 用了大写或下划线——按规范改小写连字符，与目录名对齐；
- 写完不重开会话——发现列表在会话启动时装载，改完记得重启或重载；
- description 里写"我"——第三人称（"当用户……时使用"）才是给路由器看的话术。

## 练习

1. 把上面的 `post-frontmatter` 装到个人级，用 `/post-frontmatter` 手动触发，让它生成一篇示例 frontmatter。
2. 说一句自然的"新建一篇教程文章"，验证自动触发是否命中；没命中就把现象记下来（第 3 章的素材）。
3. 把技能复制到某个项目的 `.claude/skills/`，问 AI 两个层级各是什么内容，验证优先级规则。
