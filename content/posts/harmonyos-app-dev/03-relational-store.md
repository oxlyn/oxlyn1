---
title: "鸿蒙应用开发 · 第 3 章：关系型数据库"
description: "RelationalStore 建库建表、CRUD 与谓词查询、事务与版本升级，以及与 TaskPool 的配合。"
publishDate: 2026-06-28T09:00:00
tags: ["harmonyos", "arkts", "教程"]
---

> 本文对应官方文档[通过关系型数据库实现数据持久化](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/data-persist-by-relational-store)。

**学习目标**：用 RelationalStore 完成建表与 CRUD，掌握谓词查询、事务与数据库版本升级。

## 建库建表

RelationalStore 是基于 SQLite 的关系型数据库封装：

```ts
import { relationalStore } from '@kit.ArkData'

const config: relationalStore.StoreConfig = {
  name: 'app.db',
  securityLevel: relationalStore.SecurityLevel.S1,   // 按数据敏感度定级
}

let store: relationalStore.RdbStore | null = null

export async function getStore(context: Context): Promise<relationalStore.RdbStore> {
  if (store) return store
  store = await relationalStore.getRdbStore(context, config)
  await store.executeSql(
    `CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      savedAt INTEGER
    )`
  )
  return store
}
```

单例化（[第 1 章](/posts/harmonyos-app-dev/01-app-model.md)说过的"需要全局单例的资源"）+ 建表语句幂等（`IF NOT EXISTS`），是初始化的标准姿势。

## CRUD 与谓词

写用 ValuesBucket（键值对象），查用 RdbPredicates——**谓词代替手拼 SQL 的 WHERE，天然防注入**：

```ts
interface PostRow { id?: number; title: string; author: string; savedAt: number }

async function insert(post: PostRow): Promise<number> {
  const bucket: relationalStore.ValuesBucket = { ...post }
  return (await store!.insert('posts', bucket)) as number    // 返回 rowId
}

async function byAuthor(name: string): Promise<PostRow[]> {
  const pred = new relationalStore.RdbPredicates('posts')
  pred.equalTo('author', name).orderByDesc('savedAt').limitAs(20)
  const rs = await store!.query(pred)
  const rows: PostRow[] = []
  while (rs.goToNextRow()) {
    rows.push({
      id: rs.getLong(rs.getColumnIndex('id')),
      title: rs.getString(rs.getColumnIndex('title')),
      author: rs.getString(rs.getColumnIndex('author')),
      savedAt: rs.getLong(rs.getColumnIndex('savedAt')),
    })
  }
  rs.close()                       // 结果集必须关闭
  return rows
}

async function remove(id: number) {
  const pred = new relationalStore.RdbPredicates('posts')
  pred.equalTo('id', id)
  await store!.delete(pred)
}
```

游标遍历的样板（`goToNextRow` + `getColumnIndex`）可以抽成通用 mapper——每个表写一次就够。

## 事务与版本升级

**事务**：多个写入要么全成要么全不成：

```ts
store!.beginTransaction()
try {
  await store!.insert('posts', a)
  await store!.insert('posts', b)
  store!.commit()
} catch (e) {
  store!.rollBack()
} finally {
  store!.endTransaction()
}
```

**版本升级**：`StoreConfig.version` 从 1 开始，每次改表结构递增，`onUpgrade` 回调里按旧版本逐级执行 DDL：

```ts
const config: relationalStore.StoreConfig = {
  name: 'app.db',
  securityLevel: relationalStore.SecurityLevel.S1,
  version: 2,                      // 当前版本
}
// 初始化后比对 store.version，小于 2 时执行 ALTER TABLE ADD COLUMN ...
```

与[主题系列第 5 章](/posts/astro-theme-dev/05-content-schema.md)"schema 变更是 breaking change"同一个道理：**升级逻辑要能从任何旧版本走通**，测试机装老版本再覆盖安装验证。

## 与 TaskPool 配合

数据库操作在主线程执行，大批量插入/复杂查询会卡 UI——批量任务丢给 TaskPool（[ArkTS 第 9 章](/posts/arkts-dev/09-concurrency.md)），注意 RdbStore 实例不跨线程共享，子线程里重新 `getRdbStore`。

## 踩坑提示

- 结果集 `ResultSet` 忘 close 会泄漏游标——封装成"查询返回数组"的工具函数，在内部 close。
- 拼字符串 SQL（`"...WHERE title = '" + input + "'"`）等于注入漏洞——查询一律走谓词，`executeSql` 只用于 DDL 和受控语句。
- SecurityLevel 按最低够用原则定级，标高了系统会限制共享行为。

## 练习

1. 给资讯 App 建 bookmarks 表，实现收藏/取消/列表三个操作，列表页接入。
2. 演示版本升级：v1 建表后新增一列升到 v2，覆盖安装验证旧数据还在。
3. 批量插入 1000 条，对比主线程与 TaskPool 的列表页掉帧表现。
