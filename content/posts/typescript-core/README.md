---
title: "TypeScript 核心入门：在 JavaScript 之上加一层类型"
description: "TypeScript 系列教程总览：类型层的价值、三条学习主线、环境准备与章节导航。"
publishDate: 2026-07-31T09:00:00
tags: ["typescript", "教程"]
---

TypeScript 是 JavaScript 加上的一层**类型标注**：代码运行前，编译器按你声明的类型做静态检查，把"undefined 上取属性"这类错误从运行现场提前到编辑器红波浪线。检查通过后，类型层被完整**擦除**——运行的仍是普通 JS。这个系列是[《JavaScript 核心入门》](/posts/javascript-core/)的直接续篇：语言内核讲过了，现在给内核配上类型系统。

> 内容依据 [TypeScript 官方 Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)（暂无官方中文）整理，代码示例均为原创，每章附对应 Handbook 链接。

## 类型层买到了什么

- **重构的胆量**：改一个字段名，所有失配的调用点瞬间标红——没有类型层，这要靠全局搜索和运气；
- **类型即文档**：函数签名就是使用说明书，还不会过期；
- **编辑器全知**：补全、跳转、内联提示全部来自类型信息。

代价是持续的标注与心智开销。本系列的立场：**TypeScript 的收益集中在"数据形状"和"跨文件契约"上**，把类型花在这些地方，别花在给一切事物贴标签上。

## 章节导航

| 章节 | 内容 | Handbook 对应 |
| --- | --- | --- |
| [第 1 章：为什么与怎么跑](/posts/typescript-core/01-why-and-setup/) | 类型层心智模型、tsc/tsx、strict 全家桶 | [The Basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html) |
| [第 2 章：日常类型](/posts/typescript-core/02-everyday-types/) | 标注与推断、联合与字面量类型 | [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) |
| [第 3 章：对象与接口](/posts/typescript-core/03-objects-and-interfaces/) | interface vs type、可选/只读/索引签名 | [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) |
| [第 4 章：类型收窄](/posts/typescript-core/04-narrowing/) | 判别联合、never 穷尽检查 | [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) |
| [第 5 章：函数类型](/posts/typescript-core/05-functions-deep/) | 函数签名、类型谓词、重载 | [More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html) |
| [第 6 章：泛型](/posts/typescript-core/06-generics/) | 类型参数、约束、泛型容器 | [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) |
| [第 7 章：类型级工具](/posts/typescript-core/07-type-level-tools/) | keyof/typeof、映射类型、内置工具类型 | [Creating Types from Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html) |
| [第 8 章：any/unknown/never](/posts/typescript-core/08-any-unknown-never/) | 顶层类型的取舍、as 与 satisfies | [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) |
| [第 9 章：结构化类型与声明合并](/posts/typescript-core/09-structural-and-declarations/) | 鸭子类型、多余属性检查、declare module | [Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) |
| [第 10 章：融入工程](/posts/typescript-core/10-in-the-project/) | tsconfig 实战、构建链分工、渐进迁移 | [Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html) |
| [附录：类型速查](/posts/typescript-core/11-appendix/) | 高频语法一页速查 + 学习资源 | — |

## 三条主线

1. **标注与收窄**（第 1–4 章）——先把"数据长什么样"说清楚，再让编译器顺着联合类型推理分支；
2. **抽象与变换**（第 5–8 章）——函数与泛型做复用，映射类型做类型级变换，顶层类型管逃生舱；
3. **工程化**（第 9–10 章）——结构化类型的兼容规则、声明合并的扩展手法、真实项目里的配置与构建分工。

## 环境准备

```bash
npm init -y
npm i -D typescript tsx
npx tsc --init          # 生成 tsconfig.json
npx tsx demo.ts         # 直接运行 TS（不做完整类型检查）
npx tsc --noEmit        # 纯类型检查（CI 里跑这个）
```

编辑器推荐 VS Code（内置 TS 语言服务）。本站所有系列——Agent、Astro、DSH——的代码都是 TypeScript 写的，读完这个系列再回头看它们，会有第二层收获。

## 遗留问题

- 类（class）的类型侧、条件类型与模板字面量类型的深度体操未展开，够到时翻 Handbook 对应章节。
- 装饰器与实验性语法不涉及。
