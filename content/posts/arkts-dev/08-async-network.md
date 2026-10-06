---
title: "ArkTS 鸿蒙开发入门 · 第 8 章：异步与网络"
description: "async/await 在 ArkTS 的落地、HTTP 请求与权限声明、响应建模与判别联合的实战。"
publishDate: 2026-06-21T09:00:00
tags: ["arkts", "harmonyos", "教程"]
---

> 本文对应官方文档 [Network Kit - HTTP 数据传输](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/network-http-request)。

**学习目标**：把 JS/TS 的异步知识平移到 ArkTS，跑通带权限、带类型建模的网络请求。

## 异步：直接复用 JS 的心智模型

ArkTS 的异步与 [JS 系列第 6、7 章](/posts/javascript-core/06-event-loop-and-promises.md)完全同构：Promise + 事件循环 + async/await，连"微任务先于宏任务"都一致。JS 那两章的纪律在这里原样生效——**并发别写成串行、await 别丢、错误要接住**。

## 一个带类型的 GET 请求

```ts
import { http } from '@kit.NetworkKit'

interface Post { id: number; title: string }

async function fetchPosts(): Promise<Post[]> {
  const client = http.createHttp()
  try {
    const resp = await client.request(
      'https://api.example.com/posts',
      { method: http.RequestMethod.GET, expectDataType: http.HttpDataType.STRING },
    )
    if (resp.responseCode !== 200) {
      throw new Error(`HTTP ${resp.responseCode}`)
    }
    return JSON.parse(resp.result as string) as Post[]
  } finally {
    client.destroy()          // 有创建必有销毁
  }
}
```

骨架与浏览器 fetch 无本质区别，注意三处鸿蒙特色：**显式销毁连接**（`destroy()`，放 finally）、`expectDataType` 声明期望类型、响应码要自己判断（没有 res.ok 的糖）。

## 权限：别忘了声明

访问网络必须在 `module.json5` 声明 `ohos.permission.INTERNET`，否则请求静默失败——"代码没错但不通"，九成是没声明：

```json
{
  "module": {
    "requestPermissions": [
      { "name": "ohos.permission.INTERNET" }
    ]
  }
}
```

## 响应建模：判别联合的实战

[TS 系列第 4 章](/posts/typescript-core/04-narrowing.md)的判别联合在请求封装里正好落地——把"成功/失败"建成互斥状态，UI 侧 [if 渲染](/posts/arkts-dev/05-render-control.md)直接消费：

```ts
type Result<T> =
  | { state: 'loading' }
  | { state: 'done'; data: T }
  | { state: 'error'; message: string }

@Entry
@Component
struct PostList {
  @State result: Result<Post[]> = { state: 'loading' }

  aboutToAppear() {
    this.load()
  }

  async load() {
    this.result = { state: 'loading' }
    try {
      this.result = { state: 'done', data: await fetchPosts() }
    } catch (e) {
      this.result = { state: 'error', message: (e as Error).message }
    }
  }

  build() {
    if (this.result.state === 'done') {
      ForEach(this.result.data, (p: Post) => Text(p.title))
    } else if (this.result.state === 'error') {
      Text(this.result.message)
    } else {
      LoadingProgress()
    }
  }
}
```

注意 `JSON.parse(...) as T` 仍是信任声明（[TS 第 8 章](/posts/typescript-core/08-any-unknown-never.md)）：生产级代码在中间加一层字段校验，把"非法响应"拦成 error 分支——ArkTS 的名义类型（[第 2 章](/posts/arkts-dev/02-arkts-vs-ts.md)）不会替你检查运行时数据。

## 踩坑提示

- 网络回调里改 @State 没刷新？确认回调走的是 async/await 后的直接赋值（状态代理生效），而不是把响应存进普通变量再改。
- 明文 HTTP 流量默认受限，调试本地接口用 https 或按文档配置例外。
- 每次请求都 `createHttp()` 没销毁，高频调用会积压连接——封装成模块级工具函数统一管理。

## 练习

1. 把 fetchPosts 封装成通用 `request<T>(url): Promise<T>`，用泛型支持任意接口（[TS 第 6 章](/posts/typescript-core/06-generics.md)）。
2. 给 PostList 加下拉重试：error 分支放一个 Button 重新调用 load()。
3. 用 Promise.all 并发请求两组数据，对照[JS 第 7 章](/posts/javascript-core/07-async-await-and-concurrency.md)的并发纪律验证总耗时。
