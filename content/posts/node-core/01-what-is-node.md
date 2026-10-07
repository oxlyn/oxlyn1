---
title: "Node.js 核心入门 · 第 1 章：运行时与第一行代码"
description: "Node 是什么（V8 + libuv + 内置模块）、安装与版本策略、REPL 与 --watch、和浏览器 JS 的差异。"
publishDate: 2026-10-06T09:00:00
tags: ["nodejs", "教程"]
---

> 本文对应官方文档[《Introduction to Node.js》](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)与 [API 文档总览](https://nodejs.org/docs/latest/api/documentation/)。

**学习目标**：理解"运行时"比"语言"多了什么，装好环境、跑起第一段代码，弄清 Node 与浏览器 JS 的边界。

《[JavaScript 核心入门](/posts/javascript-core/)》讲的是**语言**——语法、对象模型、事件循环，在浏览器和任何运行时里都成立。本系列讲的是**运行时**：同一个 V8 引擎之外，Node 还提供了什么，让 JS 能读写文件、起 HTTP 服务、跑命令行工具。站里的[《从零实现 Agent》](/posts/agent-from-scratch/)和[《DSH 插件开发》](/posts/dsh-plugin-dev/)全是跑在 Node 上的，这一系列就是它们的地基。

## 拆开 Node.js 这个词

一门语言只规定了"代码怎么解释执行"，**运行时（runtime）**则是让代码真正跑起来的整套环境。Node 的三块积木：

```text
┌─────────────────────────────────────────┐
│  你的 JS 代码                             │
├─────────────────────────────────────────┤
│  V8：解析、编译、执行 JS（Chrome 同款）      │
│  内置模块：fs / http / path / events …    │
├─────────────────────────────────────────┤
│  libuv：事件循环 + 线程池 + 异步 I/O        │
├─────────────────────────────────────────┤
│  操作系统：文件、网络、进程                 │
└─────────────────────────────────────────┘
```

- **V8** 负责 JS 本身，所以在浏览器里学会的语言内核可以原样搬过来；
- **内置模块**是"语言之外的另一半"——浏览器里没有 `fs`，Node 里没有 `document`；
- **libuv** 提供事件循环和线程池，第 8 章会拆开讲它怎么用单线程撑起并发。

## 安装与版本策略

三种主流装法，选一种：

```bash
# 方式一：nvm（推荐，多版本切换）
nvm install --lts && nvm use --lts

# 方式二：fnm（Rust 写的同类工具，更快）
fnm install --lts

# 方式三：官网安装包（https://nodejs.org/）
```

Node 的版本分两条线，规则是**偶数年 4 月发偶数大版本、当年 10 月转 LTS**：

| 线 | 适合 | 现状（2026-10） |
| --- | --- | --- |
| **LTS** | 一切正经项目 | Node 24 是现行 LTS；Node 26（4 月发布）本月转入 LTS，支持到 2029 |
| **Current** | 尝鲜新特性 | 每年 4 月/10 月各发布一个大版本 |

教程代码在 Node 22+ 都能跑，建议直接用 LTS。

## 第一行代码

新建 `hello.mjs`：

```js
// hello.mjs
const who = process.argv[2] ?? "world";
console.log(`你好，${who}！现在是 ${new Date().toLocaleString()}`);
console.log(`运行在 ${process.platform}，Node ${process.version}`);
```

跑起来，顺便认识两个最常用的命令行姿势：

```bash
node hello.mjs            # 你好，world！……
node hello.mjs Node       # 你好，Node！……
node -e "console.log(1+1)"  # 2 —— 单行代码直接执行，不落盘
node --watch hello.mjs    # 文件一保存就自动重跑，本系列全程用它
```

`--watch` 是内置能力，不需要 nodemon 这类第三方工具；[JavaScript 系列 README](/posts/javascript-core/) 推荐的也是它。交互式探索用 **REPL**（终端里直接敲 `node` 回车），适合试一行 API——第 8 章的事件循环实验就在 REPL 里做。

## 和浏览器 JS 的差异

同一个引擎、同一门语言，环境不同：

| | 浏览器 | Node |
| --- | --- | --- |
| 全局对象 | `window` / `globalThis` | `globalThis` / `process` |
| 模块 | `<script>` / 打包器 | 文件级 ESM，`node:` 内置模块 |
| DOM / BOM | 有 | 没有 |
| 能力边界 | 沙箱，碰不到文件系统 | 整个操作系统（文件、网络、子进程） |

两点值得展开：

**都实现了 Web 标准 API**：`fetch`、`URL`、`TextEncoder`、`crypto.subtle` 这些在两边都能用——Node 特意对齐了浏览器，写惯前端的人上手很快。

**Node 能做"有副作用"的事**：浏览器里 JS 最多操作页面；Node 里一行 `fs.unlinkSync` 就能删文件。权力大了，第 4、5 章会反复强调"出错怎么办"。

## 踩坑提示

- `node hello.js` 里写了 `import` 却报错"Cannot use import statement outside a module"——`.js` 默认按 CommonJS 解析，第 2 章讲 `type: module` 与 `.mjs`。
- 用 `window` 报 `ReferenceError`——Node 里没有它，跨环境代码用 `globalThis`。
- 装了 Node 却说命令不存在——检查 PATH；用 nvm 装的，确认 `nvm use` 生效（`which node`）。

## 练习

1. 用 `node -e` 打印 `process.version`、`process.platform`、`process.arch`，弄清自己机器的三元组。
2. 写 `sysinfo.mjs`：输出当前目录（`process.cwd()`）和已运行毫秒数（`process.uptime()`）。
3. 用 `node --watch` 跑一个每秒打印时间的脚本，改代码观察自动重跑。
