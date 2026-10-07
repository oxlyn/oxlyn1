---
title: "Node.js 核心入门 · 附录：命令与 API 速查"
description: "node 命令行参数、npm 命令、核心模块 API 与事件循环时序的一页速查，附学习资源与进阶路线。"
publishDate: 2026-10-16T09:00:00
tags: ["nodejs", "教程"]
---

本系列出现过的命令、API 与规则，按使用频率浓缩成三张表。看完任何一章忘了细节，回这里查。

## node 命令速查

```bash
node app.js              # 运行脚本
node --watch app.js      # 文件变化自动重跑
node -e "code"           # 单行代码直接执行
node                     # 进入 REPL
node --inspect-brk app.js  # 首行暂停，等调试器连接
node --env-file=.env app.js  # 加载环境变量文件（Node 20+）
node --test              # 运行 *.test.js 测试
node --run <script>      # 跑 package.json scripts（Node 22+，比 npm run 快）
```

## npm 命令速查

```bash
npm init -y              # 生成默认 package.json
npm install / npm i      # 按 package.json 安装（可能更新 lockfile）
npm ci                   # 严格按 lockfile 安装，CI 首选
npm i <pkg> --save       # 装并记入 dependencies
npm i -D <pkg>           # 装并记入 devDependencies
npm run <script>         # 执行 scripts（pre/post 钩子自动跑）
npm outdated / audit     # 检查过期 / 已知漏洞
npm link                 # 本地包软链成全局命令（配合 bin 字段）
npm publish              # 发布包（package.json 勿设 private）
```

## 核心 API 速查

| 模块 | 一句话 | 最常用 |
| --- | --- | --- |
| `node:fs/promises` | 文件系统 | `readFile` `writeFile` `mkdir` `readdir` `stat` `rm` |
| `node:path` | 路径代数 | `join` `resolve` `dirname` `basename` `extname` |
| `node:stream` | 流 | `pipeline`（永远替代 `pipe`） |
| `node:readline` | 按行读 | `createInterface({ input })` |
| `node:http` | HTTP 服务 | `createServer` + `res.writeHead` / `res.end` |
| `node:events` | 发布订阅 | `on` `once` `off` `emit`；`error` 事件必须监听 |
| `node:worker_threads` | 多线程 | `new Worker(new URL(...))` + `parentPort` |
| `node:process` | 进程仪表盘 | `argv` `env` `exitCode` `cwd`；信号 `SIGINT`/`SIGTERM` |
| `node:util` | 工具箱 | `parseArgs` `inspect` |
| `node:test` + `node:assert/strict` | 测试 | `describe/it` + `equal/deepEqual/rejects` |
| 全局 `fetch` | HTTP 客户端 | `AbortSignal.timeout()` 配超时 |

## 事件循环时序速判

同一轮里出现多种回调时，顺序口诀：**nextTick → Promise 微任务 → 事件循环阶段（timers → pending → poll → check → close）**。I/O 回调内部 `setImmediate` 恒先于 `setTimeout(0)`；主模块入口处两者不定。阻塞主线程的三宗罪：同步 fs API、纯 CPU 大循环、worker 该上没上。

## 资源

- 官方入门：[nodejs.org/en/learn](https://nodejs.org/en/learn)（Getting started / Asynchronous work 两条线）
- API 参考：[nodejs.org/docs/latest/api/](https://nodejs.org/docs/latest/api/documentation/)——`node:` 前缀 + Ctrl+F 就是日常查法
- 版本发布：[nodejs.org/en/about/previous-releases](https://nodejs.org/en/about/previous-releases)（LTS 时间表）；Node 26 发布说明见 [NodeSource 博客](https://nodesource.com/blog)
- npm 文档：[docs.npmjs.com](https://docs.npmjs.com/)

## 进阶路线

本系列解决"Node 能做什么、怎么规范地做"。接着走：

1. **TypeScript 工程化**——[TS 系列](/posts/typescript-core/)的语言内核配上 `tsconfig` 与构建，脚本变工程；
2. **服务端框架**——Hono + Cloudflare Workers（筹备中），本章的 req/res 会以中间件形态重逢；
3. **AI 方向**——[从零实现 Agent](/posts/agent-from-scratch/) 把本系列的流、子进程、事件循环全部用上；MCP 入门（筹备中）教你的工具接入标准协议；
4. **测试进阶**——node:test 换 Vitest，加 Playwright 做端到端（筹备中）。
