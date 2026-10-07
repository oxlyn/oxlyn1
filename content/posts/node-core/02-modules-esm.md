---
title: "Node.js 核心入门 · 第 2 章：模块系统与 ESM"
description: "import/export 与 CommonJS 的双生态、type: module、node: 前缀、模块解析规则与缓存。"
publishDate: 2026-10-07T09:00:00
tags: ["nodejs", "教程"]
---

> 本文对应官方文档 [ESM 模块](https://nodejs.org/docs/latest/api/esm.html)与[模块 API](https://nodejs.org/docs/latest/api/modules.html)。

**学习目标**：以 ESM 为主、CommonJS 为识读，掌握 Node 的模块解析规则、互操作边界和常见的加载报错。

语言层面 `import/export` 的语法在[《JavaScript 核心入门》第 8 章](/posts/javascript-core/08-modules/)讲过了。Node 这边多出的问题是**历史**：Node 靠 CommonJS（`require`）统治了服务端十年，ESM 2015 年才标准化。今天的工程实践是**新代码一律 ESM，读懂 CommonJS 以维护存量**。

## ESM 优先：先把 type 定对

Node 按**文件扩展名 + 最近的 package.json** 判断模块格式：

| 文件 | 格式 | 说明 |
| --- | --- | --- |
| `.mjs` | 永远 ESM | 显式，不依赖配置 |
| `.cjs` | 永远 CommonJS | 显式 |
| `.js` | 看 package.json 的 `type` | 无 `type` 时按 CommonJS |

工程惯例是项目里写 `"type": "module"`，统一用 `.js` 写 ESM：

```json
{
  "name": "notes-cli",
  "version": "0.1.0",
  "type": "module"
}
```

```js
// math.js —— 命名导出
export function add(a, b) { return a + b }
export const VERSION = "1.0"

// main.js —— 导入
import { add, VERSION } from "./math.js"
import cli, { parseArgs } from "./cli.js"  // cli.js 的默认导出 + 一个命名导出

console.log(add(1, 2), VERSION)
```

**默认导出与命名导出**的取舍：一个模块"就是某个东西"（一个类、一个 CLI 主函数）用默认导出，工具函数集合用命名导出——[React 系列的组件导出](/posts/react-core/01-components-and-jsx/)同理。

## node: 前缀与解析规则

导入内置模块一律带 `node:` 前缀：

```js
import { readFile } from "node:fs/promises"  // ✅ 推荐
import { readFile } from "fs/promises"       // 能跑，但不推荐
```

前缀的价值是**消灭歧义**：`node:fs` 只可能是内置模块，绝不会被你 `npm install` 的同名包（或恶意包）劫持——供应链安全的一道闸门。

解析相对路径的规则和浏览器一致，但**扩展名必须写全**：

```js
import { load } from "./store.js"   // ✅
import { load } from "./store"      // ❌ ERR_MODULE_NOT_FOUND
```

浏览器和 Vite 这类打包器会帮你补全扩展名（[Vite 系列第 3 章](/posts/vite-dev/03-build-and-env/)），Node 原生不会——这是前端转 Node 最高频的第一个报错。裸说明符（`"react"`）则去 `node_modules` 里找，规则由第 3 章的包管理接手。

## 顶层 await 与 import.meta

ESM 在 Node 里有两个专属福利。**顶层 await**——模块本身可以是异步的：

```js
// config.js —— 加载完成才允许别人 import 到我
import { readFile } from "node:fs/promises"
const conf = JSON.parse(await readFile("config.json", "utf8"))
export default conf
```

**import.meta**——模块自己的元信息，常用来替代 CommonJS 里的 `__dirname`：

```js
import path from "node:path"
console.log(import.meta.url)          // file:///Users/you/notes/main.js
console.log(import.meta.dirname)      // /Users/you/notes（Node 20.11+）
console.log(path.join(import.meta.dirname, "data"))  // 拼出数据目录
```

## CommonJS：读得懂就够了

存量代码里大量 `require`，识别要点：

```js
const { readFile } = require("node:fs/promises")  // 导入
module.exports = { load }                          // 导出（整块赋值）
exports.load = load                                // 等价的便捷写法
```

它和 ESM 的本质差异：`require` 是**普通函数调用**，可以在 if 里条件加载、可以动态拼路径；ESM 的 `import` 是**语法**，必须写在顶层、路径必须是静态字符串（动态加载要走 `await import()`）。现代版本（Node 22.12+）已经支持在 CJS 里 `require()` 一个 ESM 文件，互操作的墙在变薄，但**ESM 里依然不能 `require`**——新项目别回头。

## 踩坑提示

- `ReferenceError: require is not defined`——你在 ESM 里写了 `require`，改成 `import`，动态需求用 `await import()`。
- `__dirname is not defined`——ESM 没有，用 `import.meta.dirname`。
- 循环依赖（A import B、B import A）在 ESM 里表现为"拿到一半初始化的绑定"——把公共部分抽到第三个模块。
- `import` 路径大小写在 macOS 上能跑、Linux 上炸——大小写要和文件名严格一致，部署到 Linux 容器前本地先过一遍。

## 练习

1. 把第 1 章的 `hello.mjs` 改造成项目：加 `package.json`（`type: module`），把问候逻辑拆成 `greet.js` 导出。
2. 写 `env.js` 用顶层 await 读取并导出一个 JSON 配置，在另一个模块里 import 使用。
3. 故意去掉扩展名触发 `ERR_MODULE_NOT_FOUND`，读一遍报错信息找到文件与行号。
