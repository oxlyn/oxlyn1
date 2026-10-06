---
title: "鸿蒙应用开发 · 第 2 章：轻量持久化"
description: "Preferences 用户首选项的缓存机制与适用边界，应用沙箱内文件的读写与目录选择。"
publishDate: 2026-06-27T09:00:00
tags: ["harmonyos", "arkts", "教程"]
---

> 本文对应官方文档[通过用户首选项实现数据持久化](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/data-persist-by-preferences)与[应用文件概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/user-file-overview)。

**学习目标**：用 Preferences 存取用户设置，掌握应用沙箱内的文件读写与目录纪律。

## Preferences：小型 KV 存储

用户设置、开关、上次浏览位置这类**小而散**的数据，用 Preferences（用户首选项）——进程内缓存的 KV 存储，异步落盘：

```ts
import { preferences } from '@kit.ArkData'
import { util } from '@kit.ArkTS'

async function getStore(context: Context): Promise<preferences.Preferences> {
  return preferences.getPreferences(context, 'app_settings')
}

// 写：put 只改内存，flush 才落盘
async function saveTheme(context: Context, theme: string) {
  const store = await getStore(context)
  await store.put('theme', theme)
  await store.flush()
}

// 读：默认值要自己兜
async function loadTheme(context: Context): Promise<string> {
  const store = await getStore(context)
  return (await store.get('theme', 'auto')) as string
}
```

三个要点：

- **`flush()` 才持久化**——只 put 不 flush，应用被杀后数据回到解放前；高频写入合并时机（如退出页面时统一 flush）；
- 实例要**复用**：框架把实例缓存进内存，反复 `getPreferences` 同名文件返回同一实例，不必每次新建；
- 值类型支持 number/string/boolean/Array 这些基础形态——**对象要自己序列化**（`JSON.stringify` 成 string 存）。

适用边界很明确：数据量小、键值结构、整存整取。列表数据、需要查询排序的结构化数据，去第 3 章用数据库。Preferences 里塞大 JSON 再反序列化，是常见的"自建烂数据库"。

## 应用沙箱与文件读写

每个应用有独立沙箱，文件自由读写无需任何权限。常用目录两条：

- `context.filesDir`——**持久文件**（用户生成的数据），系统不清理；
- `context.cacheDir`——**缓存文件**（可再生的临时数据），空间紧张时可能被清。

```ts
import { fileIo as fs } from '@kit.CoreFileKit'

async function saveRaw(context: Context, name: string, content: string) {
  const path = `${context.filesDir}/${name}`
  const file = fs.openSync(path, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE)
  fs.writeSync(file.fd, content)
  fs.closeSync(file)
}

async function readRaw(context: Context, name: string): Promise<string> {
  const path = `${context.filesDir}/${name}`
  if (!fs.accessSync(path)) return ''
  const file = fs.openSync(path, fs.OpenMode.READ_ONLY)
  const stat = fs.statSync(path)
  const buf = new Uint8Array(stat.size)
  fs.readSync(file.fd, buf)
  fs.closeSync(file)
  return util.TextDecoder.create('utf-8').decodeToString(buf)
}
```

纪律与[ArkTS 第 6 章](/posts/arkts-dev/06-lifecycle-routing.md)的资源对称原则一致：**open 必有 close**（示例用了同步 API 简化，生产用异步版本避免主线程 I/O）。

## 选型速查

| 数据 | 去处 |
| --- | --- |
| 开关/设置/Token | Preferences |
| 用户生成的文档/图片 | filesDir / 用户文件 |
| 可再生的缓存 | cacheDir |
| 结构化、可查询、会增长 | 第 3 章 RelationalStore |
| 需要跨设备同步 | 分布式数据对象（本系列不展开） |

## 踩坑提示

- `cacheDir` 里存了"重要的临时文件"，被系统清理后崩——重要数据永远放 filesDir。
- Preferences 没有事务：多个键要原子更新时，拼成一个 JSON 键存。
- 沙箱内的文件路径不能当普通路径乱拼——一切以 `context` 给出的目录为根。

## 练习

1. 给资讯 App 加设置页：主题（auto/light/dark）与字号两选项，存 Preferences，重启后生效。
2. 写一个"草稿箱"：输入未发布的内容自动存 filesDir，重新打开恢复。
3. 故意只 put 不 flush，杀进程重启验证数据丢失，理解 flush 的位置该放在哪。
