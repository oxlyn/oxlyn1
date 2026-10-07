---
title: "Node.js 核心入门 · 第 5 章：流"
description: "四种流类型、背压与 pipeline、async 迭代与 readline——用恒定内存处理任意大的数据。"
publishDate: 2026-10-10T09:00:00
tags: ["nodejs", "教程"]
---

> 本文对应官方文档 [Stream](https://nodejs.org/docs/latest/api/stream.html)。

**学习目标**：理解"为什么需要流"，掌握 pipeline 组合与 async 迭代两种现代用法，给 notes CLI 加上大文件导入能力。

第 4 章的 `readFile` 把整个文件读进内存——处理 100 KB 的配置没问题，处理 10 GB 的日志就当场去世。**流（stream）**把数据切成小块（chunk）接力传递，内存占用恒定，还能像水管一样拼接：读文件 → 解压 → 按行处理 → 写出，全程不落地。

## 四种流类型

| 类型 | 方向 | 例子 |
| --- | --- | --- |
| Readable | 读 | `fs.createReadStream`、HTTP 的 `req` |
| Writable | 写 | `fs.createWriteStream`、HTTP 的 `res` |
| Duplex | 双向 | 网络套接字 |
| Transform | 读进变换再写出 | `zlib.createGzip()`、加密流 |

很多 Node 对象"本身就是流"——HTTP 请求体、进程的 stdout、WebSocket——这也是第 6、7 章会不断回头引用本章的原因。

## 现代用法一：async 迭代

最直觉的读流方式，像遍历数组一样遍历 chunk：

```js
import { createReadStream } from "node:fs"

const stream = createReadStream("huge.log", "utf8")
for await (const chunk of stream) {
  processLine(chunk)        // 每块约 64 KB，逐块处理
}
```

## 现代用法二：pipeline 组合

流的传统事件式 API（`on('data')` / `pipe`）有个著名陷阱：**pipe 不传播错误**，一环出错整个链条悬死。现代答案是无脑用 `pipeline`——它自动接管错误传播、清理和背压：

```js
import { pipeline } from "node:stream/promises"
import { createReadStream, createWriteStream } from "node:fs"
import { createGzip } from "node:zlib"

await pipeline(
  createReadStream("huge.log"),
  createGzip(),                 // Transform：边读边压
  createWriteStream("huge.log.gz"),
)
console.log("压缩完成")
```

任何一环抛错，`await` 处直接抛出，下游文件句柄自动关闭。**规则可以定死：新代码禁止裸 `pipe`，一律 `pipeline`。**

## 背压：流世界的交通规则

生产快、消费慢时（比如读 500 MB/s、写磁盘只有 80 MB/s），数据会在内存里堆积直到爆掉。流的应对是**背压（backpressure）**：下游写不过来时返回 `false`，上游暂停；写完了发 `drain` 事件，上游继续。手写这套协调很繁琐——`pipeline` 和 async 迭代**内置了背压处理**，这是推荐它们的根本原因。

## 给 notes 加导入：按行处理大文件

按"行"处理是文本流最高频的需求，`node:readline` 配合流开箱即用：

```js
// import-notes.js —— 把纯文本逐行导入 notes
import { createReadStream } from "node:fs"
import { createInterface } from "node:readline"
import { pipeline } from "node:stream/promises"
import { addNote } from "./store.js"

const rl = createInterface({
  input: createReadStream(process.argv[2] ?? "import.txt", "utf8"),
  crlfDelay: Infinity,        // 正确处理 \r\n
})

let count = 0
await pipeline(rl, async function* (lines) {
  for await (const line of lines) {
    if (line.trim()) await addNote(line.trim())   // 非空行变一条笔记
    count++
  }
})
console.log(`已导入 ${count} 行`)
```

这里把 `rl`（可读流）和一个 **async 生成器**（Transform 的轻量写法）接进 pipeline——生成器函数就是最顺手的小型变换环节，[JS 系列第 5 章](/posts/javascript-core/05-iterators-and-generators/)的生成器知识在这里直接变现。

## 踩坑提示

- 流对象**用完即弃**：同一个 Readable 读两遍，第二遍什么都读不到（数据已被消费），需要重读就重新 create。
- `readFile` 换成流后忘了所有下游也要是流——`createReadStream` 的结果不能直接 `JSON.parse`，先攒块再拼。
- async 迭代中途 `break` 不会自动关闭底层文件——用 `stream.destroy()` 或干脆放进 `pipeline` 让它托管。
- 报 `ERR_STREAM_PREMATURE_CLOSE` 多半是生成器里提前 return——确保 for await 循环自然走完。

## 练习

1. 把一个大于 100 MB 的文件用 `readFile` 和流分别读一遍，对比进程内存（`process.memoryUsage()`）。
2. 用 `pipeline` + `createGzip` 给 notes 数据目录做个备份压缩命令。
3. 给 `import-notes.js` 加 `--tag` 参数：导入的笔记自动打上标签（argv 解析第 9 章会系统化，先用 `process.argv.includes()` 凑合）。
