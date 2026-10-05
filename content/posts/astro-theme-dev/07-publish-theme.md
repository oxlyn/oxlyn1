---
title: "Astro 主题开发 · 第 7 章：分发主题"
description: "模板仓库与 npm 包两条路线：workspaces 结构、package.json 关键字段、发布流程与版本管理。"
publishDate: 2026-10-03T17:00:00
tags: ["astro", "主题开发", "教程"]
---

> 本文对应官方文档[发布到 npm](https://docs.astro.build/zh-cn/guides/publish-to-npm/)，示例在其基础上改编。

**学习目标**：把做好的主题发出去——选对分发形态，走通 npm 发布全流程。

## 先选路线

第 0 章提过两种形态，现在到做决定的时候：

**模板仓库**（GitHub Template Repo）：整站代码就是产品，使用者 clone/点 Use this template 后拿到完整项目自己改。优点是自由度最大（想怎么改都行），缺点是**吃不到你的后续更新**——使用者改过代码后，升级 = 手工合并。

**npm 包**：主题以包形式发布，使用者安装后按需引入组件或集成。优点是版本化、可更新（`npm update` 即可），缺点是主题型内容（整个博客站点）很难做成纯包，适合的其实是**主题的部件**：组件库、集成、加载器。

成熟主题常常两者兼顾：仓库按模板仓库运营（README、演示站、一键部署按钮），同时保持包结构干净，需要时发 npm。astro-cactus 就是典型——npm 上有它的包，大多数人却以 fork 方式使用。

## npm 路线：workspaces 结构

官方推荐的工作区布局——包和演示站同仓开发，没有"包模式"，开发就在 demo 里进行：

```
my-theme/
├── demo/                  # 演示站：引入包做开发测试
├── packages/
│   └── my-theme/          # 包本体
│       ├── package.json
│       ├── index.js
│       └── components/…
└── package.json           # workspaces 声明
```

根目录声明工作区：

```json
{
  "name": "my-project",
  "workspaces": ["demo", "packages/*"]
}
```

## package.json 的关键字段

```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./components": "./components/index.js"
  },
  "files": ["index.js", "components/"],
  "keywords": ["astro-component", "withastro", "blog"]
}
```

- **`type: "module"`**：必须，否则 `import/export` 不工作；
- **`exports`**：定义使用者 `import 'my-theme'` 与 `import 'my-theme/components'` 各拿到什么；
- **`files`**：控制发布内容，只列运行必需的文件——**新增文件必须同步更新这里**，否则发布了也装不到，这是官方特别强调的坑；
- **`keywords`**：加 `astro-component`、`withastro` 等特殊关键词，官方集成库每周自动抓取收录，等于免费曝光。

## 发布：没有构建步骤

Astro 原生文件（`.astro`/`.ts`/`.jsx`/`.css`）**可以直接发布**，不需要预先编译——这是 Astro 包生态最省心的一点：

```bash
npm login
npm publish
```

入口文件用命名导出聚合组件：

```js
export { default as PostCard } from './components/PostCard.astro'
export { default as Pagination } from './components/Pagination.astro'
```

测试方式：官方建议在 `demo/src/pages/__fixtures__/` 下为每个用例建测试页面，`astro build` 后对比 `dist/__fixtures__/` 的输出。

## 模板仓库路线的清单

走这条路线，产品力在仓库本身：

- README 放效果截图、特性列表、快速开始（clone → install → dev）、配置说明；
- 演示内容齐全，克隆后十秒能跑；
- 一键部署按钮（Deploy to Netlify/Vercel/CF）；
- 版本 tag + CHANGELOG——即便使用者不合并你的更新，也能对照着手工升级。

## 踩坑提示

- `files` 漏列新增目录，`npm publish` 后使用者 import 报"找不到模块"——发布前用 `npm pack --dry-run` 预览包内容。
- 包内组件写了相对 import 到包外的文件，打包后路径失效——包必须自包含。
- 忘了 bump version 就 publish，npm 会拒绝重复版本号（这反而救了你）；但 GitHub Template 没有这个保护，全靠自觉打 tag。

## 练习

1. 把第 1–6 章的成果按 workspaces 重排成 `demo/ + packages/my-theme/` 结构。
2. 写 `index.js` 聚合导出三个组件，在 demo 里改用包路径 import 验证。
3. `npm pack --dry-run` 检查包内容，确认没有多余文件混进去。
