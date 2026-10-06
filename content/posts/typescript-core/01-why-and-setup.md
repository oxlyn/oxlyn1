---
title: "TypeScript 核心入门 · 第 1 章：为什么与怎么跑"
description: "类型层的心智模型：编译期检查、运行时擦除，tsc 与 tsx 的分工，strict 模式逐项开启。"
publishDate: 2026-05-21T09:00:00
tags: ["typescript", "教程"]
---

> 本文对应 Handbook [The Basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)。

**学习目标**：建立"类型层"心智模型，跑通第一个 TS 程序，配置一套实用的 tsconfig。

## 一层会消失的类型

先看 TS 到底拦什么：

```ts
const post = { title: 'hello' }
post.titel.toUpperCase()   // 编辑器立刻标红：Property 'titel' does not exist
```

没有类型层时，这个拼写错误要等到运行现场炸出来；有了类型层，**写下的瞬间**就被抓住。关键是理解它的两个特征：

1. **编译期检查**：所有类型错误在构建阶段暴露，配合编辑器就是边写边查；
2. **运行时擦除**：编译产物里没有任何类型信息——`interface`、类型别名、标注全部消失，运行的还是纯 JS。

由此得出本系列最重要的心法：**类型层不会替你做运行时校验**。API 返回的 JSON 标成 `Post`，也只是一个"信任声明"——数据实际长什么样，运行时一无所知（第 10 章讲怎么用校验库补上这一环）。

## 三种跑法

```bash
npx tsc demo.ts              # 编译成 JS 再 node 跑——最正统
npx tsx demo.ts              # 直接运行，省心——本地开发推荐
npx tsc --noEmit             # 只做类型检查、不出产物——CI/编辑器的角色
```

真实项目里往往三者并用：构建器（Astro/Vite/esbuild）负责转译速度，`tsc --noEmit` 负责类型正确性，tsx 负责脚本类代码的即写即跑。本站 Astro 项目就是这个分工——`.astro` 组件脚本里尽是 TS，编译交给 Astro，类型检查交给编辑器和 CI。

## tsconfig 起步配置

`npx tsc --init` 生成的配置几百行，起步只需要这几项：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  }
}
```

`strict: true` 是整套体验的开关——它打开一组子选项（`noImplicitAny`、`strictNullChecks`、`strictFunctionTypes` 等）。**不开 strict 的 TypeScript 只配叫"带注释的 JavaScript"**：null 检查、隐式 any 这些大头收益全部来自它。新项目一律 strict，老项目迁移见第 10 章。

## strictNullChecks：收益最大的一项

它把 `null`/`undefined` 从所有类型里剥离出来——想用一个可能为空的值，必须先处理空：

```ts
function head(list: string[]) {
  return list[0]        // 类型是 string | undefined（配合 noUncheckedIndexedAccess）
}
head([]).length          // 编译错：可能是 undefined
```

被迫处理空值听起来烦，实际是把"运行时的 undefined is not a function"提前变成了编译提示。写两天就离不开它。

## 踩坑提示

- `tsc` 不报错 ≠ 运行没问题：类型检查过，运行时的数据照样可能非法（再读一遍第一节的两个特征）。
- tsconfig 的 `include` 范围漏了文件，检查就漏了文件——"明明有错却没报"先查 include。
- 不要为了消红波浪线随手 `as any`——那是把报警器拆了，第 8 章讲正确的逃生舱。

## 练习

1. 初始化项目，写一个故意拼错属性名的 TS 文件，对比 `tsx` 运行与 `tsc --noEmit` 检查的输出差异。
2. 把 `strict` 关掉再开，观察同一段可空代码的报错变化。
3. 在编译产物（`tsc` 不带 noEmit 的输出）里找找 interface 去哪了——验证"擦除"。
