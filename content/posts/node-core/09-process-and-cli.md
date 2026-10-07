---
title: "Node.js 核心入门 · 第 9 章：process、环境变量与 CLI"
description: "process 对象、argv 与 parseArgs、环境变量、退出码与信号、bin 字段——把脚本变成正经命令行工具。"
publishDate: 2026-10-14T09:00:00
tags: ["nodejs", "教程"]
---

> 本文对应官方文档 [process](https://nodejs.org/docs/latest/api/process.html)与[util.parseArgs](https://nodejs.org/docs/latest/api/util.html#utilparseargsargs)。

**学习目标**：掌握 process 对象的核心读写项，用 parseArgs 解析命令行参数，把 notes CLI 做成 `npm link` 之后随处可跑的真命令。

前九章的代码都靠"改文件重跑"；这一章给它们装上**命令行界面**——Node 生态里最成功的软件（Vite、Astro、npm 本身）都是 CLI，套路本章讲全。

## process：进程的仪表盘

```js
process.argv        // 命令行参数数组
process.cwd()       // 当前工作目录（第 4 章反复出现）
process.env         // 环境变量对象
process.exitCode    // 退出码（设 0/1）
process.platform    // darwin / linux / win32
process.version     // v24.x.x
```

**argv 前两项不是你的**：`[node 的路径, 脚本的路径, ...真正的参数]`，业务参数从下标 2 开始。环境变量是配置注入的标准通道：

```bash
NOTES_DB=./data node main.js     # 一次性注入
export NODE_ENV=production       # 会话级
```

```js
const dbPath = process.env.NOTES_DB ?? "./data/notes.json"   // 永远给默认值
```

敏感信息（token、密钥）只走环境变量，**不写进代码不提交 git**；本地开发用 `.env` 文件配合 `node --env-file=.env main.js`（Node 20+ 内置，不用再装 dotenv）。

## parseArgs：参数解析不再手写

参数一多，`process.argv.includes()` 就不够看了，`node:util` 的 `parseArgs` 是官方答案：

```js
// bin/notes.js
import { parseArgs } from "node:util"

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    tag:   { type: "string",  short: "t" },
    done:  { type: "boolean", default: false },
  },
})

// notes add "买牛奶" --tag 生活   →
//   positionals = ["add", "买牛奶"]   values = { tag: "生活", done: false }
```

第一个位置参数当**子命令**分发——CLI 的标准骨架：

```js
const [cmd, ...rest] = positionals
const commands = { add, list, done, help }
const fn = commands[cmd] ?? help
await fn(rest, values)
```

## 退出码与信号：进程怎么走

**退出码**是 CLI 与世界的契约：0 成功、非 0 失败。区别两种写法：

```js
process.exit(1)        // 立刻退出——stdout 是流，可能吞掉未写完的输出！
process.exitCode = 1   // 推荐：设退出码，让进程自然走完再退
```

**信号**是操作系统发给进程的事件：Ctrl+C 发 `SIGINT`、`kill` 默认发 `SIGTERM`。优雅退出的套路——先抢救现场再走：

```js
process.on("SIGINT", async () => {
  await saveNotes(notes)          // 把没落盘的写回去
  process.exit(0)
})
```

## 发布成命令

两步把 `bin/notes.js` 变成全局命令 `notes`：

```js
// package.json
{ "bin": { "notes": "./bin/notes.js" } }
```

```js
// bin/notes.js 首行 —— shebang，告诉 shell 用 node 执行
#!/usr/bin/env node
```

```bash
chmod +x bin/notes.js   # 加执行权限
npm link                # 在全局 bin 目录放一个软链
notes add "写完第 9 章" --tag 教程
notes list
```

`npm link` 是本地开发期的软链；正式分发给用户则走第 3 章的 `npm publish`，装包的人自动得到命令。

## 踩坑提示

- 在 CI 里 `$NODE_ENV` 读不到——环境变量不跨进程继承，部署平台里显式配置。
- `parseArgs` 报 `ERR_PARSE_ARGS_INVALID_OPTION_VALUE`——boolean 选项被传了值，检查 `type` 声明与实际用法。
- Windows 上 shebang 无效——Windows 靠 npm 自动生成的 `.cmd` 垫片，别自己 chmod 之后以为跨平台了。
- 优雅退出没等异步写完进程就没了——`SIGINT` 处理器里 await 的东西要真的 await 到，必要时重复 Ctrl+C 强杀兜底。

## 练习

1. 给 notes CLI 补全 `add/list/done` 三个子命令，`--json` 输出机器可读格式，错误参数时退出码设 1 并打印用法。
2. 用 `--env-file` 加载 `.env` 里的 `NOTES_DB`，验证数据文件位置切换生效。
3. 写一个只在收到 SIGTERM 时打印"收到，正在清理"的常驻脚本，用 `kill` 命令和 Ctrl+C 分别测试。
