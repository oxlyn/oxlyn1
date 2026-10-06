---
title: "TypeScript 核心入门 · 附录：类型速查"
description: "TypeScript 高频语法一页速查：标注、收窄、泛型、工具类型、断言，附学习资源与站内延伸。"
publishDate: 2026-05-31T09:00:00
tags: ["typescript", "教程"]
---

## 语法速查

```ts
// 标注与推断（第 2 章）——边界标注，内部推断
const n = 1                                   // 推断 number
function f(x: string): Promise<number> {}

// 联合与字面量（第 2 章）
type Status = 'draft' | 'published'
type Maybe<T> = T | null

// 对象（第 3 章）
interface Post {
  title: string
  desc?: string                // 可选 → T | undefined
  readonly id: string
  [k: string]: unknown         // 索引签名
}
interface Draft extends Post { status: 'draft' }
type Admin = User & { perms: string[] }

// 收窄与判别联合（第 4 章）
type Req =
  | { state: 'loading' }
  | { state: 'done'; data: string[] }
switch (req.state) { /* 分支自动收窄 */ case 'done': req.data }
const _x: never = req          // 穷尽检查报警器

// 函数（第 5 章）
type Handler = (e: string) => void
function isPost(x: unknown): x is Post { return true }   // 类型谓词
function parse(s: string): Date
function parse(y: number, m: number): Date               // 重载

// 泛型（第 6 章）
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][]
interface Repo<T, ID = string> { get(id: ID): Promise<T | null> }

// 类型级变换（第 7 章）
type Cfg = typeof config       // 值 → 类型
type Keys = keyof Cfg          // 键联合
type Picked = Pick<Cfg, Keys>
type MyPartial<T> = { [K in keyof T]?: T[K] }

// 顶层类型与断言（第 8 章）
const d: unknown = JSON.parse(raw)      // 用前必须收窄
const conf = { env: 'dev' } satisfies Config   // 检查但不拓宽
const t = { a: 1 } as const             // 字面量收窄

// 工程三件（第 10 章）
// strict + noUncheckedIndexedAccess + skipLibCheck
// npx tsc --noEmit     ← CI 类型检查
```

## 十章一图

| 主线 | 章节 | 一句话 |
| --- | --- | --- |
| 标注与收窄 | [1](/posts/typescript-core/01-why-and-setup/) [2](/posts/typescript-core/02-everyday-types/) [3](/posts/typescript-core/03-objects-and-interfaces/) [4](/posts/typescript-core/04-narrowing/) | 类型是逻辑的描述，编译器顺着分支推理 |
| 抽象与变换 | [5](/posts/typescript-core/05-functions-deep/) [6](/posts/typescript-core/06-generics/) [7](/posts/typescript-core/07-type-level-tools/) [8](/posts/typescript-core/08-any-unknown-never/) | 谓词写守卫、泛型做复用、映射做变换、unknown 管逃生 |
| 工程化 | [9](/posts/typescript-core/09-structural-and-declarations.md) [10](/posts/typescript-core/10-in-the-project.md) | 形状即兼容，声明合并做协作，检查与构建各司其职 |

## 学习资源

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)——本系列依据，官方且持续更新
- [tsconfig 参考](https://www.typescriptlang.org/tsconfig/)——每个编译选项的权威解释
- [TS Playground](https://www.typescriptlang.org/play)——浏览器里做类型实验，报错即时可见
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)——社区经典进阶书

## 站内延伸

- 前置：[《JavaScript 核心入门》](/posts/javascript-core/)——TS 的全部运行时语义来自它
- 实战：[《从零实现 Agent》](/posts/agent-from-scratch/)、[《Astro 建站实战》](/posts/astro-from-scratch/)、[《DSH 插件开发》](/posts/dsh-plugin-dev/)——全部是 TS 代码，其中 DSH 系列的 `declare module` 声明合并是[第 9 章](/posts/typescript-core/09-structural-and-declarations/)的活教材
