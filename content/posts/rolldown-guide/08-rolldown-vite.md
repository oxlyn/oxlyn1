---
title: "Rolldown 入门 · 第 8 章：rolldown-vite"
description: "Vite 7 时代的尝鲜通道：别名安装、原生插件开关、行为差异清单与一键回滚。"
publishDate: 2026-06-21T09:00:00
tags: ["rolldown", "vite", "前端工程化", "教程"]
---

> 本文对应 Vite 官方 [Rolldown 指南（Vite 7）](https://v7.vite.dev/guide/rolldown)。

**学习目标**：在 Vite 7 项目里安全试用 Rolldown 引擎，理解它替换了什么、保留什么，随时能退回。

## 一条命令换引擎

rolldown-vite 是"Rolldown 驱动的 Vite"，作为 **drop-in 替换包**发布——语义化版本随主线 Vite 对齐。Vite 7 项目试用方式：

```json
// package.json —— vite 是直接依赖时：npm 别名
{
  "dependencies": {
    "vite": "npm:rolldown-vite@7.0.0"
  }
}
```

```json
// vite 只是 peer 依赖（VitePress、meta-frameworks）时：override
{
  "overrides": {
    "vite": "npm:rolldown-vite@7.0.0"
  }
}
```

（yarn 用 `resolutions`，pnpm 用 `pnpm.overrides`。）重装依赖后 `npm run dev` / `build` 照常跑——**零配置变更**。文档建议**锁具体版本**而非 `@latest`：rolldown-vite 是实验通道，patch 版也可能带破坏性变更。

## 它替换了什么

| 旧引擎角色 | rolldown-vite 的接替者 |
| --- | --- |
| Rollup（构建打包） | Rolldown |
| esbuild（依赖预构建、配置打包、JS 压缩） | Rolldown + OXC |
| esbuild（JS/TS 语法降级） | OXC（[第 7 章](/posts/rolldown-guide/07-oxc-transforms.md)） |
| CSS 压缩（默认 esbuild） | **Lightning CSS**（默认换人） |
| @rollup/plugin-commonjs | 内建 |

## 已知差异与适配清单

试用前过一遍这份清单（来源：官方迁移文档）：

- **原生插件默认开启**（`'v1'`）：出问题时降级开关 `experimental.enableNativePlugin: 'resolver' | false`（过渡期选项，终将移除）；
- **插件内容转 JS**：插件的 load/transform 若产出非 JS 内容，返回值需声明 `moduleType: 'js'`；
- **transformWithEsbuild**：需自行安装 esbuild，或迁移到 `transformWithOxc`；
- **React 用户**：`@vitejs/plugin-react` v5+ 自动用 OXC 的 refresh 转换；`plugin-react-swc` 若没用 SWC 专属特性可换回 plugin-react；
- **版本探测**：钩子内 `this.meta.rolldownVersion`、导出 `vite.rolldownVersion`——写双引擎兼容逻辑用；
- 未知/无效配置项会收到**校验警告**（如遗留的 `generatedCode`）——按警告清理。

## 原生插件与 withFilter

rolldown-vite 把一批核心内置步骤（解析器等）下沉为**原生插件**（Rust 实现），这是 dev/build 双提速的来源之一；而第三方 JS 插件的开销治理靠 [`withFilter`](/posts/rolldown-guide/04-plugin-hook-filters.md)：

```ts
import { withFilter } from 'rolldown'

plugins: [
  withFilter(svgr(), { load: { id: /\.svg\?react$/ } }),
]
```

## 回滚：三十秒的事

回滚 = 把 package.json 的别名还原成正常版本号（`"vite": "^7.0.0"`）、删掉为 Rolldown 加的 `advancedChunks` 等专属配置、重装依赖。**实验通道的价值就在这里**：进退都便宜，所以放心在非关键分支试。

## 上报问题

报错时去 **vitejs/rolldown-vite** 仓库（不是主 Vite 仓库）按模板提 issue：最小复现 + 环境（OS/Node/包管理器）+ 完整错误日志；实时求助在 Rolldown Discord。

## 踩坑提示

- 别名安装后 `npm ls vite` 显示的是 rolldown-vite 版本——报 issue 时两边版本号都要给。
- 团队项目试水放独立分支 + CI 并跑（[第 5 章](/posts/rolldown-guide/05-rollup-migration.md)的七步验收复用）。
- `@latest` 锁定警告再读一遍：实验通道的 patch 不保证兼容。

## 练习

1. 把一个 Vite 7 项目用别名切到 rolldown-vite，跑通 dev/build/preview 三连。
2. 故意留一个 esbuild 专属配置项，读校验警告并清理。
3. 完整走一遍"切换 → 记录产物 hash → 回滚 → 恢复产物"，验证开关的对称性。
