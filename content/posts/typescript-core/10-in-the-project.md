---
title: "TypeScript 核心入门 · 第 10 章：融入工程"
description: "tsconfig 实战清单、类型检查与构建转译的分工、@types 体系与渐进迁移。"
publishDate: 2026-05-30T09:00:00
tags: ["typescript", "教程"]
---

> 本文对应 Handbook [Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html) 与 [tsconfig 参考文档](https://www.typescriptlang.org/tsconfig/)。

**学习目标**：配一套经得起真实项目的 tsconfig，理解类型检查与构建的分工，掌握渐进迁移路线。

## tsconfig 实战清单

[第 1 章](/posts/typescript-core/01-why-and-setup.md)给了起步配置，真实项目再补四组：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,   // 索引访问结果带 undefined——最大防护单项
    "noUnusedLocals": true,             // 未用变量报错
    "exactOptionalPropertyTypes": true, // 可选属性不接受显式 undefined（可选）
    "skipLibCheck": true,               // 跳过 node_modules 内部的检查（提速）
    "paths": { "@/*": ["./src/*"] }     // 路径别名
  }
}
```

- `noUncheckedIndexedAccess`：`list[0]` 的类型变成 `T | undefined`——数组越界从运行时事故变成编译提示，值得承受随之而来的 `!`/收窄成本；
- `skipLibCheck`：第三方 d.ts 的内部错误不检查——几乎必开，省下的时间远多于漏掉的真问题；
- `paths` 别名**只是类型层的重定向**，运行时解析要靠打包器（Vite/Astro 的 resolve.alias）配合——两边不同步，编辑器能跳转、运行时找不到模块，是新手期最迷惑的报错之一。

## 类型检查与构建的分工

现代工具链把 TS 拆成两个角色，理解分工能解开一堆"为什么我改了类型没生效/为什么构建不报类型错"：

| 角色 | 谁来做 | 特点 |
| --- | --- | --- |
| 转译（TS → JS） | esbuild / SWC（Vite、Astro 内置） | 快，**不做类型检查** |
| 类型检查 | `tsc --noEmit` / 编辑器语言服务 | 慢，只管类型 |

所以：**构建通过 ≠ 类型正确**。CI 里永远单独跑 `tsc --noEmit`，本站 Astro 项目正是这个结构——`astro build` 用 Vite 秒级转译，类型问题由编辑器与单独的检查步骤兜底。

## @types：社区类型从哪来

第三方库的类型有三种来源：自带（现代库的主流，`import` 即有）、社区包（`@types/xxx`，DefinitelyTyped 仓库维护，`npm i -D` 即装）、都没有（自己写 d.ts，[第 9 章](/posts/typescript-core/09-structural-and-declarations.md)的 declare module）。装了 @types 但编辑器没反应，先查它覆盖的包版本是否与实装版本匹配——类型错版本比没类型更误导。

## 渐进迁移：从 JS 项目出发

存量 JS 项目不必一步到位，官方给的阶梯：

1. `allowJs: true`——TS 项目接纳 .js 文件，混着来；
2. `checkJs: true` + 文件头 `// @ts-check`——JS 文件也开始检查；
3. 关键文件逐个改名 .ts，用 JSDoc 注释（`/** @type {Post} */`）在 JS 里先写类型；
4. tsconfig 从 `strict: false` 起步，按目录逐步打开——**迁移是持续交付，不是大爆炸**。

## 常见报错三大件

| 错误码 | 典型文案 | 一句话根因 |
| --- | --- | --- |
| TS2304 | Cannot find name 'X' | 名字不存在：没 import / 类型没装 / d.ts 没生效 |
| TS2339 | Property 'x' does not exist on type 'Y' | 形状不符：拼错 / 联合没收窄 / 版本不一致 |
| TS2345 | Argument of type 'A' is not assignable to 'B' | 兼容性失败：对着 A、B 的结构差异找根因 |

读错误的方法：**先看被赋值的两个类型长什么样**（错误信息里通常都贴出来了），对着结构找差异，比改代码碰运气快得多。

## 练习

1. 给自己的项目开启 `noUncheckedIndexedAccess`，修复暴露出的索引访问点，数一数拦住几处潜在越界。
2. 在 Astro/Vite 项目里验证 paths 双轨：只配 tsconfig 不配打包器，观察运行时报错。
3. 把一个 200 行的 JS 文件改名为 .ts，用 JSDoc + 收窄一路修到 `tsc --noEmit` 通过，记录耗时。
