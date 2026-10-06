---
title: "鸿蒙应用开发 · 第 4 章：数据层架构"
description: "用 Repository 模式把网络、数据库、Preferences 收口成单一数据源，UI 只认状态。"
publishDate: 2026-06-29T09:00:00
tags: ["harmonyos", "arkts", "教程"]
---

> 本章为实践章，把前两章的存储能力与 [ArkTS 第 8 章](/posts/arkts-dev/08-async-network.md)的网络请求组装成完整数据层。

**学习目标**：建立"单一数据源"的 Repository 层，让 UI 与数据来源解耦，缓存策略有条不紊。

## 为什么需要数据层

前几章的能力拼起来已经能跑，但把 `fetchPosts`、`getStore`、`@State` 散在页面里，三笔债很快到期：

- **换数据源要动 UI**：接口换分页方式、本地加缓存，每个页面都要改；
- **状态自相矛盾**：两个页面各自请求同一份数据，版本错乱；
- **无法测试**：逻辑黏在组件里，测不了。

解法是教科书式的 **Repository 模式**：UI 只跟 Repository 说话，Repository 决定"数据从网络来、从数据库来、还是从缓存来"。

## Repository 的形状

用[TS 判别联合](/posts/typescript-core/04-narrowing.md)定义接口，用 HSP/HAR 承载实现（[第 1 章](/posts/harmonyos-app-dev/01-app-model.md)的 common 模块）：

```ts
// common/src/main/ets/data/PostRepository.ets
export type FeedResult =
  | { state: 'remote'; data: Post[] }       // 网络新鲜数据
  | { state: 'cache'; data: Post[] }        // 缓存兜底
  | { state: 'error'; message: string }

export class PostRepository {
  private static instance: PostRepository | null = null
  static shared(context: Context): PostRepository { /* 单例，略 */ }

  async feed(): Promise<FeedResult> {
    try {
      const data = await request<Post[]>('/posts')
      await this.saveAll(data)              // 网络成功 → 回写缓存
      return { state: 'remote', data }
    } catch (e) {
      const cached = await this.loadAll()   // 网络失败 → 缓存兜底
      if (cached.length > 0) return { state: 'cache', data: cached }
      return { state: 'error', message: (e as Error).message }
    }
  }

  private async saveAll(posts: Post[]) { /* 覆盖式写入 posts 表 */ }
  private async loadAll(): Promise<Post[]> { /* 查本地表 */ }
}
```

三种结果互斥且**信息完整**：UI 不仅知道"显示什么"，还知道"数据从哪来"（cache 态可以显示"离线内容"角标）。

## UI 只消费状态

```ts
@Entry
@Component
struct FeedPage {
  @State result: FeedResult = { state: 'error', message: '' }
  private repo: PostRepository = PostRepository.shared(getContext(this))

  aboutToAppear() { this.refresh() }

  async refresh() { this.result = await this.repo.feed() }

  build() {
    if (this.result.state === 'error') {
      ErrorView({ message: this.result.message, onRetry: () => this.refresh() })
    } else {
      PostList({ posts: this.result.data, offline: this.result.state === 'cache' })
    }
  }
}
```

页面从"编排者"退化成"绑定器"——正是[主题系列第 1 章](/posts/astro-theme-dev/01-theme-skeleton.md)"pages 要薄"原则在应用端的复刻。

## 进阶策略

- **先缓存后网络**（cache-then-network）：立即用缓存渲染，网络回来再覆盖——首屏零等待的标配；实现上 Repository 先同步返回 cache 态，再发第二个结果；
- **写入路径单一**：所有写操作（收藏、发布）也走 Repository，写完同步更新内存状态，多页面自然一致；
- **接口先于实现**：先定 `interface PostRepo`，网络实现与假数据实现可切换——预览器和 UI 测试用假数据，一秒出图。

## 踩坑提示

- Repository 里持有 UI 状态（@State 不能出现在这里）——它是纯数据层，返回值说话。
- 缓存没有过期策略会显示陈年旧文——表里存 fetchedAt，feed 时判断新鲜度决定 state。
- 单例初始化依赖 context：用 AbilityStage 里的 context 初始化一次，别在每个页面传。

## 练习

1. 按 FeedResult 三态重构 PostList 页，断网（模拟器飞行模式）验证 cache 兜底。
2. 实现 cache-then-network：先渲染缓存，两秒后网络数据覆盖，对比首屏时间。
3. 给 Repository 写一个 FakePostRepository，页面在预览器里用假数据出图。
