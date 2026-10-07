---
title: "Node.js 核心入门 · 第 4 章：文件系统与路径"
description: "fs/promises 的读写与目录操作、node:path 跨平台拼路径、file URL——Node 权力的起点。"
publishDate: 2026-10-09T09:00:00
tags: ["nodejs", "教程"]
---

> 本文对应官方文档 [File system](https://nodejs.org/docs/latest/api/fs.html)与[Path](https://nodejs.org/docs/latest/api/path.html)。

**学习目标**：用 promises API 完成"读、写、列目录、判存在"四件事，掌握 path 拼接规则，开始搭建贯穿本系列的 notes CLI。

浏览器里你碰不到文件系统；Node 里这是第一权力，也是第一责任——写错路径、读错编码、没处理异常，事故立刻发生在真实磁盘上。本章从零搭起贯穿本系列的**notes CLI**（一个命令行笔记工具）：先把"存笔记"的持久层写出来。

## 三套 API，只用 promises

`node:fs` 对同一个功能提供三种风格：同步（`readFileSync`，阻塞事件循环，第 8 章详谈危害）、回调（历史包袱）、**promises**（`node:fs/promises`，现代首选）：

```js
import { readFile, writeFile, mkdir, readdir, stat, rm } from "node:fs/promises"

const text = await readFile("notes.json", "utf8")   // 给了编码 → 字符串
const buf  = await readFile("logo.png")             // 不给 → Buffer（二进制）
await writeFile("out.txt", "内容", "utf8")
await mkdir("data/nested", { recursive: true })     // 父目录不存在也一并创建
const files = await readdir(".")                    // 文件名数组，不含子目录内容
const info  = await stat("notes.json")              // 大小、时间、isFile()/isDirectory()
await rm("tmp/", { recursive: true, force: true })  // 递归删，不存在也不报错
```

全部返回 Promise，直接 `await`，异常用熟悉的 `try/catch` 接（[JS 系列第 9 章](/posts/javascript-core/09-errors-and-debugging/)的错误处理知识原样适用）。

## notes 的持久层

JSON 存取是这个体量工具的正确选择，实现只有十行：

```js
// store.js
import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

const dataDir = path.join(import.meta.dirname, "data")
const dbFile  = path.join(dataDir, "notes.json")

export async function loadNotes() {
  try {
    return JSON.parse(await readFile(dbFile, "utf8"))
  } catch (err) {
    if (err.code === "ENOENT") return []        // 文件还不存在 = 空笔记
    throw err                                    // 其他错误照常抛出
  }
}

export async function saveNotes(notes) {
  await mkdir(dataDir, { recursive: true })
  await writeFile(dbFile, JSON.stringify(notes, null, 2), "utf8")
}
```

注意 `ENOENT` 的处理方式：**按错误码分诊**，"文件不存在"是业务的一部分，其他错误继续往上抛。fs 抛的错误对象带 `code` 属性，常用的还有 `EACCES`（无权限）、`EEXIST`（已存在）、`EISDIR`（是目录）。

## path：路径不是字符串拼接

Windows 用 `\`，POSIX 用 `/`；手写 `dir + "/" + file` 在哪个平台都可能翻车。`node:path` 给的是**当前平台正确**的路径代数：

```js
import path from "node:path"

path.join("/a/b", "../c", "d.txt")   // /a/c/d.txt —— 规整化，自动处理 ..
path.resolve("notes", "data")        // 从 process.cwd() 解析成绝对路径
path.dirname("/a/b/c.txt")           // /a/b
path.basename("/a/b/c.txt")          // c.txt
path.extname("report.tar.gz")        // .gz（最后一个点开始）
path.sep                             // 当前平台的分隔符
```

`join` vs `resolve` 的分界：手里都是**相对片段**用 `join`，要**从相对变绝对**用 `resolve`。相对路径永远相对于 `process.cwd()`（你运行命令的目录），不是脚本所在目录——两者用 `import.meta.dirname`（脚本目录）区分清楚，CLI 从任何目录被调用都不会读错文件。

需要把路径放进 `import()` 或 URL 场景时走 file URL：

```js
import { pathToFileURL } from "node:url"
pathToFileURL("/a/b/我的文件.js").href   // file:///a/b/%E6%88%91%E7%9A%84%E6%96%87%E4%BB%B6.js
```

## 踩坑提示

- 读出乱码或"一串数字"——`readFile` 忘了第二个参数 `"utf8"`，拿到的是 Buffer；文本记得给编码。
- `JSON.parse` 前不 try/catch——手改坏的 JSON 直接把进程崩掉，持久层要接住。
- `writeFile` 是**整文件覆盖**不是追加；追加用 `appendFile`，高频追加用第 5 章的流。
- 并发写同一个文件互相覆盖——本章的 `saveNotes` 足够用；真要并发安全需要锁或队列，先知道有这个坑。

## 练习

1. 扩展 `store.js`：加 `addNote(text)`（自增 id + createdAt）和 `removeNote(id)`，都用 `loadNotes`/`saveNotes` 组合实现。
2. 写 `list-files.mjs`：递归列出某个目录（`readdir` + `stat` 判断目录后继续深入），打印每项的大小。
3. 分别在项目目录和家目录运行你的脚本，打印 `process.cwd()` 与 `import.meta.dirname`，体会两者的差别。
