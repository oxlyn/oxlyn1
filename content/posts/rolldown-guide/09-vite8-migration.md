---
title: "Rolldown 入门 · 第 9 章：升级 Vite 8 实战"
description: "默认引擎时代的迁移清单：装饰器风险项、插件兼容排查、性能验收与回滚预案。"
publishDate: 2026-06-10T09:00:00
tags: ["rolldown", "vite", "前端工程化", "教程"]
---

> 本文对应 Vite 官方 [v7→v8 迁移指南](https://vite.dev/guide/migration)。

**学习目标**：把 Vite 8 的"引擎默认化"变成一份可执行的升级清单，含风险项预案。

## Vite 8 变了什么

2026 年 3 月发布的 Vite 8 完成第 1 章预告的统一：**Rolldown 成为默认构建引擎，OXC 接管转译与压缩**——esbuild 和 Rollup 从 Vite 依赖中移除。对多数项目这是"升级即提速"（社区迁移报告构建耗时最多降约 87%）；对少数项目，几个明确的风险项需要预案。

## 升级清单

```bash
npm i -D vite@^8.0.0        # 前置：Vite 7 上没有历史包袱的项目可直接跳
```

1. **读 [v7→v8 迁移指南](https://vite.dev/guide/migration)**——破坏性变更带代码对照；
2. **删掉 rolldown-vite 别名**（[第 8 章](/posts/rolldown-guide/08-rolldown-vite.md)的试水包）：Vite 8 默认即是它，别名继续存在反而锁住版本；
3. **清理 esbuild 残留**：配置里的 `esbuild` 块、`transformWithEsbuild` 调用——换成 OXC 语义；真需要 esbuild 的项目自行显式安装；
4. **manualChunks → advancedChunks**（[第 6 章](/posts/rolldown-guide/06-code-splitting.md)语法对照）；
5. **CSS 压缩换人**：默认 Lightning CSS——对产物做一次样式回归（伪元素/前缀处理的差异）；
6. **插件清点**：`@rollup/plugin-commonjs` 等内建替代的插件删除；重量级插件加 [withFilter](/posts/rolldown-guide/04-plugin-hook-filters.md)；
7. **跑通三连 + 基线对比**：dev / build / preview 全过，构建耗时与产物体积记录对比（迁移报告的 87% 就是这么测出来的）。

## 风险项：装饰器

最明确的兼容性边界：**OXC 不降级 TC39 装饰器**（proposal 阶段语法）。受影响画像：Angular/Aurelia/Legacy MobX 等重度装饰器代码库。预案：

- 优先升级到标准化装饰器（TypeScript 5+ 标准实现语义不同，需评估）；
- 不可升级时，装饰器模块保留 Babel 外援链（多一道管线，性能收益打折）；
- 都不行且升级紧迫——暂留 Vite 7（LTS 思路：引擎升级与框架升级解耦排期）。

## 插件兼容排查

Vite 插件（Rollup 兼容钩子）绝大多数直接可用；排查顺序：

1. 装了"已被内建"的插件？删（[第 3 章](/posts/rolldown-guide/03-core-features.md)清单）；
2. 插件在 load/transform 里产出非 JS 内容？等它出兼容版或给返回值加 `moduleType`；
3. 压缩相关的插件（terser 类）？内建 minifier 接管，插件删除；
4. 疑难杂症：`vite.rolldownVersion` 探针确认引擎身份，issue 带最小复现走 [rolldown-vite 仓库](https://github.com/vitejs/rolldown-vite)。

## 回滚预案

升级不是单行道：锁回 `"vite": "^7.0.0"` + 还原 manualChunks 配置即回 Vite 7。**升级 PR 里不要顺手做别的重构**——回滚路径干净比什么都重要（[第 8 章](/posts/rolldown-guide/08-rolldown-vite.md)开关对称性的全项目版）。

## 踩坑提示

- "升级后更快了"也要看产物：压缩器换了人，**功能回归测试**比性能数字更优先。
- CI 缓存的 lockfile 别忘了更新——别名包（rolldown-vite）与正主（vite@8）在 lockfile 里是不同条目。
- 多包 monorepo 升级时统一所有包的 Vite 大版本——双引擎混跑的解析差异最难排查。

## 练习

1. 给自己（或示例）项目完整走一遍升级清单，输出"变更点 + 前后耗时/体积"报告。
2. 构造一个使用实验性装饰器的组件，验证警告与 Babel 外援方案。
3. 演练一次回滚：升级 PR 里故意留错，回滚后确认产物与升级前一致。
