---
title: "Agent Skills 开发入门 · 第 5 章：渐进披露与资源组织"
description: "references/assets/scripts 三类资源、导航式 SKILL.md、按需加载的 token 经济账与重构手法。"
publishDate: 2026-11-15T09:00:00
tags: ["agent", "skills", "教程"]
---

> 本文对应官方标准[《Specification》](https://agentskills.io/specification)的目录布局与 [Claude Code 技能文档](https://code.claude.com/docs/en/skills)的资源章节。

**学习目标**：掌握三类附属资源的分工，学会把"大而全"的 SKILL.md 重构成"导航 + 按需加载"，让技能库随规模增长而上下文成本不涨。

第 1 章埋的伏笔在这里展开：渐进披露的第三阶段（执行期按需加载）需要**技能作者主动设计加载路径**——SKILL.md 是导航页，资源是分馆的藏书。

## 三类资源，三种加载方式

```text
post-frontmatter/
├── SKILL.md                 # 激活时全文进上下文
├── references/
│   ├── schema.md            # 执行时"读这个文件"才进上下文
│   └── examples-gallery.md
├── assets/
│   └── frontmatter.template.yaml   # 模板：复制/填充，通常不整体阅读
└── scripts/
    └── validate_frontmatter.mjs    # 执行：跑起来看输出，不是读它
```

| 目录 | 内容 | 进上下文的方式 |
| --- | --- | --- |
| `references/` | 大块参考资料、规范细节、更多示例 | AI 用读文件工具**按需阅读** |
| `assets/` | 模板、样板、固定产物 | **复制改造**，不必逐字读完 |
| `scripts/` | 可执行程序 | **运行并消费输出**（第 6 章） |

SKILL.md 里的相对路径引用就是加载入口——**写清楚"什么情况下读哪个文件"**，是导航页的核心职责：

```markdown
## 按需加载

- 需要全部字段的完整 schema（含可选字段与取值约束）→ 读 references/schema.md
- 需要不同类型文章的完整示例（周记/系列章/便签）→ 读 references/examples-gallery.md
- 直接产出文件 → 复制 assets/frontmatter.template.yaml 后按规则填充
```

## token 经济账

算一笔账就明白设计目标：假设规范全文 3000 token——

- **全塞 SKILL.md**：每次激活都付 3000，哪怕任务只需要其中一条；
- **导航式拆分**：SKILL.md 压到 600（概览 + 路标），10% 的任务真正去读 3000 的全文——平均激活成本 ≈ 900。

技能库规模 × 使用频率，决定这笔账的复利：**十个技能的库，导航式能省一半以上的上下文预算**——这些预算留给用户的真实任务（呼应 [MCP 系列第 7 章](/posts/mcp-dev/07-context/)的上下文工程）。

## 重构手法：从大而全到导航式

以 `post-frontmatter` 为例，三步：

1. **切分**：把正文按"每次都要"与"偶尔要"分类——字段五条核心规则留下，完整 schema、全示例清单移出；
2. **写路标**：每个移出文件在 SKILL.md 里有一行"何时读它"（上面的按需加载节）；路径用相对路径，别写绝对路径（技能会被移动与分享）；
3. **回归**：用三个真实任务跑一遍，确认该读的会被读、不读也能完成主路径。

官方指引的 **500 行上限**就是这套方法的触发器：接近上限时不是删，是按上面的手法拆。

## 引用的深度与链条

references/ 里还能再引用更深的文件吗？可以，但**每深一层，AI 多一次"要不要读"的决策**，偏离主路的概率随之上升。实践约定：SKILL.md → references/ 两层为宜；reference 文件自身开头先写一行"本文什么时候该被读"，让被动的文件也有自我介绍。

## 踩坑提示

- references 里放"必读"内容——"必读"说明它属于 SKILL.md，要么压缩后留下，要么接受"经常没被读"的后果；
- 资源文件名用日期或版本号（schema-v2-final.md）——导航页的路标会过时，文件名表达内容不表达历史；
- 资产里嵌业务数据（具体文章列表）——assets 放的是**模板**，数据是运行时输入；
- 引用用了绝对路径或 `~`——换机器即断，一律相对 SKILL.md 的路径。

## 练习

1. 给 `post-frontmatter` 建 references/schema.md（完整字段规范）与 assets 模板，SKILL.md 压到 60 行以内并写好路标。
2. 用"改一个 tag"的小任务跑重构后的技能，确认它**没有**去读全文也能完成；再用"字段校验报错"的任务确认它会去读 schema.md。
3. 统计重构前后两次任务的上下文消耗（问 AI 或看会话详情），把数字记下来——这是你技能库的第一笔经济账。
