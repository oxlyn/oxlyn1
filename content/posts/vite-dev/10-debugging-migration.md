---
title: "Vite 工程化入门 · 第 10 章：调试与迁移"
description: "五类高频报错的定位路径、dev/build 差异自查清单、从旧工具迁移与版本升级。"
publishDate: 2026-05-30T09:00:00
tags: ["vite", "前端工程化", "教程"]
---

> 本文对应官方文档[破坏性变更](https://cn.vite.dev/changes/)与[疑难解答](https://cn.vite.dev/guide/troubleshooting)。

**学习目标**：建立报错关键词到根因的映射表，掌握迁移/升级的工作节奏。

## 五类高频报错速查

**1. `Failed to resolve import "xxx"`**——模块解析失败。排查顺序：包没装（`npm ls xxx`）→ 别名漏配（[第 7 章](/posts/vite-dev/07-alias-and-types.md)双轨）→ 路径大小写（macOS 不敏感、Linux 敏感——本地好线上坏的经典案）。

**2. `xxx is not a function` / 顶层 `exports is not defined`**——CJS/ESM 混用。依赖是纯 CJS：交给预构建处理（确认它进了 optimizeDeps）；自己代码里混用：回读 [TS 第 8 章](/posts/typescript-core/08-modules.md)的模块语义。

**3. `Outdated Optimize Dep` / "changed dependencies"**——预构建缓存失效提示。重启 dev server 即愈（[第 9 章](/posts/vite-dev/09-optimization.md)）；反复出现则查 lockfile 是否被 IDE 插件动了。

**4. dev 正常、build 失败（或反之）**——回到[第 3 章](/posts/vite-dev/03-build-and-env.md)的差异表逐项排查：env 前缀、CJS 依赖、动态路径、类型外的语法错误。**`npm run build && npm run preview` 是日常动作不是发布动作**。

**5. 页面白屏且无控制台报错**——大概率 index.html 的脚本引用/挂载点问题：确认 `<div id="app">` 存在、脚本带 `type="module"`、入口路径没被 base 前缀影响（部署在子路径时 `base` 配置与资源引用同步）。

## 报错定位的三段工作流

1. **读第一行错误**：Vite 的错误覆盖层（浏览器内红屏）与终端报错是双份的，第一行定位文件，后续行定位链路；
2. **区分侧别**：报错来自 dev server（终端）还是浏览器（覆盖层/Console）——server 侧多为配置/插件问题，浏览器侧多为模块内容问题；
3. **最小化复现**：注释一半 import 再试（二分），定位到具体模块后看它的"特殊性"（CJS？动态路径？特殊后缀？）。

## 从 webpack 迁移

存量 webpack 项目迁移的路线图：

1. **盘点 loader/plugin**：每个 webpack 专属机制找 Vite 对应物——loader → Vite 插件的 transform；html-webpack-plugin → 原生 index.html 入口；DefinePlugin → `define` 配置或 env；CommonsChunk/SplitChunks → manualChunks；
2. **别名与 env 换名**：`require.context` → `import.meta.glob`（[第 4 章](/posts/vite-dev/04-static-assets.md)）；`process.env.X` → `import.meta.env.X`；
3. **拆 dev 与 build 心智**：不再需要为 dev 性能做的 webpack hack（DllPlugin、cache-loader）——直接删；
4. **渐进迁移**：大型项目可先用 Vite 代理 webpack 产物（微前端/两套构建共存）过渡，再逐模块切换。

迁移的验收清单：dev 可跑、build 可跑、env 齐全、HMR 正常、产物体积对比（通常是净减）。

## 版本升级节奏

Vite 大版本升级（v5→v6→v7）的通用姿势：

1. 读官方 **Changes** 页（[cn.vite.dev/changes](https://cn.vite.dev/changes/)）——每个破坏性变更都有迁移代码对照；
2. 升级后先跑 dev 再跑 build，把[第 3 章](/posts/vite-dev/03-build-and-env.md)差异清单当回归测试；
3. 插件同步升大版本——Vite 升级大多是"内核 + 插件"整组行动（peerDependencies 会拦住错配）；
4. 团队项目锁小版本（`~` 前缀），大版本升级单独立 PR。

## 踩坑提示

- 报错信息链很长时看**最后一段自己代码的帧**（[JS 第 9 章](/posts/javascript-core/09-errors-and-debugging.md)读栈纪律）——node_modules 里的帧通常只是路过。
- 升级后 dev 快了但 build 变慢/产物变了：构建引擎（Rollup→Rolldown）行为差异期，锁定引擎或按官方建议调整配置。
- 迁移期间新旧构建共存时，env/别名两套配置漂移——用一份 JSON 生成两边的配置，单一事实源。

## 练习

1. 手工制造本章五类报错各一次，把"症状→关键词→根因"写成自己项目的速查表。
2. 做一个 mini 迁移实验：建一个 webpack4 老项目（或找现成的），迁移到 Vite，记录每个机制的去向。
3. 升级任意一个 Vite 项目到最新大版本，按 Changes 页逐项核对，形成升级笔记。
