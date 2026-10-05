---
title: "从 0 开始实现一个 Coding Agent · 第 4 章：真实工具"
description: "bash 执行器（超时/截断/退出码）、读、写、改，对照 tool-bash 与 tool-fs。"
publishDate: 2026-08-28T09:00:00
tags: ["教程", "agent"]
---

# 第 4 章 · 真实工具:bash、读、写、改

> 对应代码:[code/mini-agent/tools.ts](code/mini-agent/tools.ts)(同时被 mini-agent 工程引用)

## 学习目标

- 把"能跑命令的玩具"升级成一套真实可用的工具集:`bash / read_file / write_file / edit_file / list_dir`。
- 掌握 bash 执行器的工程细节:超时、进程组击杀、输出截断、退出码 marker。
- 理解工具结果的两条失败通道:**marker(业务失败,给模型看)** 与 **isError(基础设施失败,给系统看)**。

从本章起,教程代码从单文件升级为模块化工程 [code/mini-agent/](code/mini-agent/),后续章节每章给这个工程增加一个模块。

## 学习目标外的第一件事:工具定义的结构

每个工具 = 模型面(三件套)+ 执行面(一个函数):

```ts
export interface Tool {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema,给模型看
  run: (args: Record<string, unknown>) => Promise<string> // 给程序跑
}
```

**模型面要窄**。超时上限、并发安全性、展示逻辑……这些都不该出现在发往模型的 schema 里:模型面越大,提示词越贵、模型分心越多。工具定义里可以有十个字段,但 `toolSchemas()` 只投影 `name/description/parameters` 三个。

## bash 执行器:细节决定成败

`runBash` 的完整实现在 [tools.ts](code/mini-agent/tools.ts),四个关键点:

**1. 超时 + 进程组击杀**。`bash -c` 启动的命令会派生子进程孙进程,只 kill 直接子进程会留下孤儿。解法:`detached: true` 建立独立进程组,超时时 `process.kill(-pid, 'SIGTERM')` 整组击杀,再留 3 秒宽限后 `SIGKILL` 兜底:

```ts
const child = spawn('bash', ['-c', command], {
  detached: true, // 独立进程组,超时时能整组杀掉
  env: { ...process.env, NO_COLOR: '1', TERM: 'dumb', PAGER: 'cat', GIT_PAGER: 'cat' },
  stdio: ['ignore', 'pipe', 'pipe'],
})
```

**2. 模型可见环境变量**。`NO_COLOR=1`、`TERM=dumb`、`PAGER=cat`:不给模型的环境里留 ANSI 转义码和交互式分页器——模型读到 `\x1b[32m` 只会困惑,遇到 `(END)` 会卡住。

**3. 输出截断**。单次命令可能输出几十 MB,直接塞进历史就是烧钱 + 爆上下文。超过上限就停止累积,并打上 `[output truncated]` marker——模型知道被截了,会主动用 `head`/`grep` 收窄查询。

**4. 退出码是 marker,不是异常**。命令退出码非零是**正常的业务事实**(`grep` 没找到匹配也是退出码 1!):

```ts
if (timedOut) markers.push(`[timed out after ${timeoutMs}ms]`)
if (exit.signal !== null) markers.push(`[killed by signal: ${exit.signal}]`)
else if (exit.code !== null && exit.code !== 0) markers.push(`[exit code: ${exit.code}]`)
if (truncated) markers.push('[output truncated]')
```

stdout 先出,`[stderr]` 段其次,marker 收尾。**只有 spawn 失败这类基础设施故障才走异常通道**,由执行器转成 `isError` 的工具结果。

**5. 一个诚实的局限:取消没有接入工具执行**。教程的 Ctrl+C 只中断流式请求,已派发的命令会跑到自然结束(或超时)。真实 harness 把调用者的 abort signal 融合进执行器,中断时连进程组一起终止(`agent.ts` 的 `executeToolCall` 注释标明了这个简化)。

## read / write / edit:防误伤三件套

- **read_file**:带行号输出(`cat -n` 风格),支持 1 起始的 `offset`/`limit`。行号不是装饰——模型汇报"第 42 行有问题"就靠它,下一章的编辑工具也靠它定位。
- **write_file**:整文件覆盖,自动创建父目录,末尾补换行。
- **edit_file**:精确字符串替换,并且**不唯一就报错**——`old_string` 出现多次而没有 `replace_all: true` 时拒绝执行,逼模型扩大上下文锚点。这是把"改错地方"这类事故挡在执行前:

```ts
const second = text.indexOf(oldString, first + 1)
if (second >= 0 && !replaceAll) throw new Error('old_string 出现多次且不唯一,请扩大上下文或传 replace_all')
```

### todo_write:把任务状态记进日志

多步骤任务里,模型需要一个地方维护"计划与进度"。`TODO_TOOL`([tools.ts](code/mini-agent/tools.ts))是覆盖式写入:每次传**完整列表**,工具校验后渲染成稳定的文本格式:

```text
任务清单已更新,共 3 项:
- [x] 调查目录结构
- [~] 修复 bug
- [ ] 写回归测试
```

真正值得注意的是**状态存在哪**:不在内存、不在单独的文件,就在会话日志里。`currentTodos(session)` 找最后一条 `todo_write` 的 `tool/call`,按 callId 配对出它的 `tool/result`,解析回结构化清单——第 6 章"日志是唯一事实源"的直接应用:`--resume` 之后零额外存储即可恢复。`prompt.ts` 的 `todoSection`(第 10 章)再把它注入提示词,模型睁眼就知道"做到哪一步了"。

诚实地说一个权衡:教程的"存储格式 = 渲染格式"靠正则解析,脆弱;真实 harness 保存**结构化 canonical 值**、按需渲染成文本(第 4 章对照的 `output: { schema, render }`)——两层分离后,状态重建不依赖措辞。

## 接入循环

第 2 章的循环只需要把 `run_command` 换成整个工具表。执行骨架(完整版在 [agent.ts](code/mini-agent/agent.ts) 的 `executeToolCall`,那里还叠加了第 5 章的权限门和第 6 章的落账):

```ts
const tool = tools.find((candidate) => candidate.name === call.function.name)
if (tool === undefined) return deny(`unknown tool ${call.function.name}`)
let args: Record<string, unknown>
try {
  args = JSON.parse(call.function.arguments) as Record<string, unknown>
} catch {
  return deny('参数不是合法 JSON')
}
try {
  const content = await tool.run(args)
  return { role: 'tool', tool_call_id: call.id, content }
} catch (error) {
  return { role: 'tool', tool_call_id: call.id, content: `Error: ${msg(error)}` } // isError
}
```

## 对照 DeepSeek Harness

- **模型可见工具的完整清单**见 `docs/tool-catalog.md`:`bash`(`packages/shell/tool-bash`)、`read/write/edit/read_image`(`packages/fs/tool-fs`)、`glob/grep`(`packages/fs/tool-fs-search`,走打包的 ripgrep)、`todo_write`(`packages/todo`,状态同样存于会话日志)、`web_search/web_fetch`、`skill`、`subagent` 等。教程的六件套(bash/读/写/改/列目录/任务清单)是它们的骨干子集。
- **定义结构多一层输出投影**。真实工具定义里还有 `output: { schema, render }`:工具先产出**结构化的 canonical 值**,再由 `render` 投影成模型可见文本(如 `read` 工具返回 `{path, offset, lines, totalLines}` 再渲染成行号文本,`packages/fs/tool-fs/src/read.ts:77-145`)。结构化值给 UI 复用(渲染卡片),文本给模型——一鱼两吃。教程直接返回字符串,丢掉的是 UI 那一半。
- **bash 工具与执行器分离**。工具定义(`tool-bash/src/index.ts:373-533`)只管 schema 和结果渲染;真正 spawn 进程的是 `bash-local` 执行器(`packages/shell/bash-local/src/index.ts`):默认超时 120s、模型传值被 `clampTimeout` 封顶到 600s;每流 64KB 内存上限,溢出落 spill 临时文件(上限 64MB),返回 `truncated + spillPath`——比教程的"直接丢掉"更完整。超时前台命令还会被"晋升"为后台任务而不是杀掉,模型可以稍后用 `job_output` 查看。
- **沙箱是另一章的主角**。真实 bash 在 spawn 前还会经过沙箱包裹(`ctx.sandbox.confine(['bash', '-c', command], policy)`),以及超时/审批等策略——第 5 章展开。

## 练习

1. 实现 `grep_file` 工具(参数:`pattern`、`file_path`),要求输出带行号且默认截断到 200 条匹配。
2. 给 `read_file` 加"图片检测":读到二进制内容时返回一条明确的错误,而不是让模型看到乱码。
3. (思考)为什么 `edit_file` 用"唯一字符串替换"而不是"行号区间替换"两种都提供?提示:模型数错行号的概率,和模型抄错上下文的概率哪个高?

## 本章留下的问题

现在工具能改文件、跑命令了——**谁来拦住模型跑 `rm -rf`**?下一章:权限与审批。
