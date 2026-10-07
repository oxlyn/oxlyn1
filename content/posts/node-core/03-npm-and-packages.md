---
title: "Node.js 核心入门 · 第 3 章：npm 与包管理"
description: "package.json 全解、semver 与 lockfile、scripts 钩子、npx 与依赖树——读懂任何一个 Node 项目的入口。"
publishDate: 2026-10-08T09:00:00
tags: ["nodejs", "教程"]
---

> 本文对应 npm 官方文档 [package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json) 与 [npm CLI](https://docs.npmjs.com/cli/v11/commands)。

**学习目标**：读懂 package.json 的每个常用字段，理解版本号与锁文件的契约，会用 scripts 和 npx 组织项目命令。

模块解决"代码怎么拆"，包管理解决"别人的代码怎么来"。npm 不只是 `npm install`——它是 Node 生态的分发协议，[Vite](/posts/vite-dev/)、[Rolldown](/posts/rolldown-guide/) 的插件体系、[Astro 主题](/posts/astro-theme-dev/)的发布，全部建立在这一章的机制上。

## package.json：项目的身份证

```json
{
  "name": "notes-cli",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "bin": { "notes": "./bin/notes.js" },
  "scripts": {
    "start": "node src/main.js",
    "test": "node --test"
  },
  "dependencies": {
    "picocolors": "^1.1.1"
  },
  "devDependencies": {
    "typescript": "^6.0.3"
  }
}
```

字段分组记忆：**身份**（name/version，发布到 npm 用）、**环境**（type/engines，第 2 章的模块格式在这里声明）、**入口**（bin/main/exports，决定别人 `import` 你时拿到什么）、**任务**（scripts）、**依赖**（dependencies 运行时需要，devDependencies 只在开发时需要——构建器、测试器、类型）。

`private: true` 防止误发布；`engines` 声明 Node 版本门槛（配合 `engine-strict` 才强制，但写上是一种契约）。`bin` 是把包变成命令行工具的钩子，第 9 章会用它。

## semver：版本号是一份契约

`^1.2.3`、`~1.2.3` 不是装饰，是升级许可的范围声明：

| 写法 | 含义 | 升级许可 |
| --- | --- | --- |
| `^1.2.3` | 兼容 1.x | 补丁 + 次版本（1.2.3 → 1.9.0） |
| `~1.2.3` | 兼容 1.2.x | 只要补丁（1.2.3 → 1.2.9） |
| `1.2.3` | 精确锁定 | 不升 |
| `*` / `latest` | 任意 | 别写，等于给依赖开盲盒 |

semver 约定"破坏兼容才升主版本"，但约定靠人守——所以 **package-lock.json 必须存在且提交进 git**：它把"依赖的依赖"的精确版本和下载地址全部钉死，保证你和 CI、和同事装出一模一样的树。日常用 `npm ci`（严格按 lockfile 装，快且可复现）而不是 `npm install`（可能顺手更新 lockfile）。

## scripts：项目命令的统一入口

```bash
npm run test      # 执行 scripts.test
npm test          # 内置简写：test / start / stop 等少数几个
npm run build -- --verbose   # 追加参数给脚本本身
```

scripts 支持 **pre/post 钩子**：`npm run build` 会先跑 `prebuild`、后跑 `postbuild`——[本站的构建](https://github.com/chrismwilliams/astro-cactus-theme)就是这么挂上 Pagefind 索引的（`build` 之后自动 `postbuild`）。Node 22 起还有更快的 `node --run test`，跳过 npm 的配置解析直接跑脚本。

**npx** 临时执行一个包的命令而不全局安装：`npx pagefind --site dist`、`npx create-astro@latest`——想试工具、跑一次性任务时用它，避免污染全局。

## 依赖树与 node_modules

`npm install picocolors` 装的不止一个包——它自己的依赖会被递归拉进 `node_modules/.package-lock.json` 记录的树里。理解三个词就够：

- **直接依赖**：你 package.json 里写的；
- **传递依赖**：它们拉进来的，你在 node_modules 里会看到一堆"没装过"的包；
- **peerDependencies**：插件声明的"宿主必须有"——[Rolldown/Vite 插件](/posts/rolldown-guide/04-plugin-hook-filters/)声明 peer 的就是 Vite/Rolldown 本体，npm 会检查它而不重复安装。

安全习惯：`npm audit` 看已知漏洞，`npm outdated` 看哪些包落后，升级主版本前看 changelog 而不是直接 `update`。

## 踩坑提示

- 装包报网络超时——国内环境切镜像：`npm config set registry https://registry.npmmirror.com/`（本站 README 里就是这么处理的）。
- `npm install` 之后 lockfile 出现大量无关 diff——用了不同 npm 主版本或把 `package.json` 里的范围改了；团队统一 npm 版本（`engines` + `packageManager` 字段）。
- dependencies 里混进了只有开发用的包——生产镜像会白装几百 MB，定期 `npm ls <pkg>` 核对它为什么在。
- 全局安装（`npm i -g`）出权限问题——别用 sudo 硬怼，改用 nvm 管理的 Node 或 `npx` 临时执行。

## 练习

1. 给第 2 章的项目补齐 package.json：scripts 定义 `start`，用 `npm start` 跑起来。
2. 安装 `picocolors` 给输出加颜色，然后打开 package-lock.json 搜索它，找到它的精确版本号。
3. 写一个 `pretest` 脚本打印"准备测试"，验证钩子执行顺序。
