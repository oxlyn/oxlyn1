---
title: "Astro 主题开发 · 附录：主题开发检查清单"
description: "从骨架到分发：主题发布前的七个维度自查清单，以及全系列官方文档索引。"
publishDate: 2026-10-04T17:00:00
tags: ["astro", "主题开发", "教程"]
---

## 发布前自查清单

**结构**（[第 1 章](/posts/astro-theme-dev/01-theme-skeleton/)）

- [ ] 目录按 layout / 内容部件 / UI 部件分层
- [ ] pages 薄：只做取数 + 选布局，无业务逻辑
- [ ] 演示内容齐全，克隆后能直接 `npm run dev` 看到完整效果

**组件**（[第 2 章](/posts/astro-theme-dev/02-components-props.md)）

- [ ] 每个对外组件有 `interface Props`
- [ ] 必填 props 最少化，其余带默认值
- [ ] 包装类组件支持 `class` 转发（重命名解构）

**布局**（[第 3 章](/posts/astro-theme-dev/03-layouts-slots.md)）

- [ ] 外壳布局与内容布局分层，内层复用外层
- [ ] `<meta charset="utf-8" />` 在位
- [ ] 插槽有回退内容，命名插槽有文档

**样式**（[第 4 章](/posts/astro-theme-dev/04-styling-theming.md)）

- [ ] 视觉 token 收敛为 CSS 变量，组件内无具体色值
- [ ] 暗色模式两份变量表字段一一对应
- [ ] 全局样式只在布局导入一次，内容区用 `:global()` 限定范围

**内容**（[第 5 章](/posts/astro-theme-dev/05-content-schema.md)）

- [ ] schema 必填字段最少，全部 optional 字段有默认值或组件显式分支
- [ ] 查询封装为工具函数（含 draft 过滤、排序），页面不裸调 `getCollection`
- [ ] README 的 frontmatter 文档与 schema 一字不差

**配置**（[第 6 章](/posts/astro-theme-dev/06-theme-config.md)）

- [ ] 单一配置文件收敛全部用户可改项，纯数据、带注释
- [ ] `url` 字段显著提醒使用者替换
- [ ] 新增配置项全部可选 + 默认值（向后兼容）

**分发**（[第 7 章](/posts/astro-theme-dev/07-publish-theme.md)）

- [ ] 路线明确：模板仓库（README/截图/一键部署/tag）或 npm 包（exports/files/keywords）
- [ ] npm 包发布前 `npm pack --dry-run` 核对内容
- [ ] schema 与配置的破坏性变更进 CHANGELOG

## 官方文档索引

- [Astro 组件](https://docs.astro.build/zh-cn/basics/astro-components/) / [布局](https://docs.astro.build/zh-cn/basics/layouts/) / [项目结构](https://docs.astro.build/zh-cn/basics/project-structure/)
- [样式与 CSS](https://docs.astro.build/zh-cn/guides/styling/) / [内容集合](https://docs.astro.build/zh-cn/guides/content-collections/)
- [发布到 npm](https://docs.astro.build/zh-cn/guides/publish-to-npm/) / [Blog 官方教程](https://docs.astro.build/zh-cn/tutorials/blog/)

## 系列内交叉引用

- 建站基础（路由、SEO、部署）：[《Astro 建站实战》](/posts/astro-from-scratch/)系列
- 本站主题的实战改造记录：三栏布局、样式覆盖等可参考 astro-from-scratch 各章的"对照本站"小节
