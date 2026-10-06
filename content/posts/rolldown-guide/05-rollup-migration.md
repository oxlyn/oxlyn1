---
title: "Rolldown 入门 · 第 5 章：从 Rollup 迁移"
description: "兼容范围、配置对照表、行为差异清单——把 Rollup 项目切到 Rolldown 的完整路径。"
publishDate: 2026-06-06T09:00:00
tags: ["rolldown", "vite", "前端工程化", "教程"]
---

> 本文对应官方文档[Troubleshooting](https://rolldown.rs/guide/troubleshooting)与各 in-depth 章节。

**学习目标**：掌握"哪些能直接换、哪些要改"的判断框架，完成一次真实迁移。

## 兼容性框架：三层判断

迁移前先给存量资产分类：

| 资产 | 迁移成本 | 说明 |
| --- | --- | --- |
| 配置（input/output/format） | 近零 | 与 Rollup 同构，改名即用 |
| **Rollup 插件** | 低 | 接口兼容，多数直接可用；重量级插件加 filter（[第 4 章](/posts/rolldown-guide/04-plugin-hook-filters.md)） |
| **官方 commonjs/replace/inject 等插件** | 负成本 | **删掉**——内建（[第 3 章](/posts/rolldown-guide/03-core-features.md)） |
| `manualChunks` | 低 | 已废弃，换 `advancedChunks`（[第 6 章](/posts/rolldown-guide/06-code-splitting.md)） |
| esbuild 转译钩子/配置 | 中 | 换 OXC 语义（[第 7 章](/posts/rolldown-guide/07-oxc-transforms.md)），`transformWithEsbuild` 需自装 esbuild |
| webpack 专属（loader/运行时特性） | 高 | 不在兼容目标——走 Vite 化路线（[Vite 第 10 章](/posts/vite-dev/10-debugging-migration.md)） |

## 迁移七步

```bash
npm uninstall rollup @rollup/plugin-commonjs @rollup/plugin-replace @rollup/plugin-json
npm i -D rolldown
mv rollup.config.ts rolldown.config.ts
```

1. **换包**：卸 Rollup 与"已被内建"的官方插件，装 rolldown；
2. **改配置名**：`rollup.config` → `rolldown.config`（defineConfig 来源换成 rolldown）；
3. **清 manualChunks**：改写为 advancedChunks（第 6 章的语法对照）；
4. **过一遍 esbuild 专属项**：`transformWithEsbuild` → `transformWithOxc`；esbuild options 兼容层只在过渡期存在，别依赖；
5. **跑构建**：第一遍构建的报错多为"未知选项警告"（rolldown-vite 会对未知/无效项发警告）与个别插件钩子差异；
6. **对比产物**：chunk 数量、体积、`npm pack --dry-run`（库项目）——行为差异通常在这一步现形；
7. **CI 并跑一段**：新旧构建并行出包对比一两个迭代，确认无静默差异再删旧管线。

## 已知行为差异清单

- **CJS 处理内建**：删除 commonjs 插件后，个别"深度依赖 CJS 动态特性"的包行为可能微调（官方 in-depth 有 [Bundling CJS](https://rolldown.rs/in-depth/bundling-cjs) 专文）；
- **压缩器换了**：从 esbuild minify/terser 换成内建 minifier——产物字节级不同是正常的，功能等价即可；
- **TLA（顶层 await）**：cjs 输出格式下受限（[专文](https://rolldown.rs/in-depth/tla-in-rolldown)），[Vite 第 8 章](/posts/vite-dev/08-ssr-and-lib.md)提过的"顶层 await 别进 cjs"在这里是硬规则；
- **懒桶优化**（lazy barrel optimization）：barrel 文件（index 桶导出）的模块图展开策略不同，极端情况下 tree-shaking 结果有差异（[专文](https://rolldown.rs/in-depth/lazy-barrel-optimization)）；
- 插件里判断版本：钩子内 `this.meta.rolldownVersion`——写兼容双引擎的插件时用它分岔。

## 库项目的迁移验收

[Vite 第 8 章](/posts/vite-dev/08-ssr-and-lib.md)的 lib 模式用户额外验收三项：双格式产物齐全（es/cjs）、`exports` 条件字段指向正确、TLA 没混进 cjs。`npm pack --dry-run` + 在一个空项目里安装试用，是最终闭环。

## 踩坑提示

- "内建了，但插件还挂着"——双份处理未必报错，行为却可能互相覆盖（[第 3 章](/posts/rolldown-guide/03-core-features.md)踩坑的再现）：迁移的第一刀永远是删旧插件。
- 差异类问题别硬猜：官方 [Troubleshooting](https://rolldown.rs/guide/troubleshooting) 按症状索引，Rolldown Discord 实时答疑。
- 迁移 PR 与功能 PR 分开——出问题时能干净回滚（回滚 = 换回包名，[第 8 章](/posts/rolldown-guide/08-rolldown-vite.md)的开关思路同源）。

## 练习

1. 找一个 Rollup 库项目完整走七步，记录每一步的报错与处置。
2. 把 manualChunks 迁移成 advancedChunks，对比 chunk 划分结果。
3. 写一个 `this.meta.rolldownVersion` 的探针插件，验证双引擎下的行为分岔。
