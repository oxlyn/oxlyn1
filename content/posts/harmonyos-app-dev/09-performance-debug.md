---
title: "鸿蒙应用开发 · 第 9 章：性能与调试"
description: "HiLog 规范埋点、DevEco Profiler 定位卡顿与内存、启动优化与组件复用的实战清单。"
publishDate: 2026-08-09T09:00:00
tags: ["harmonyos", "arkts", "教程"]
---

> 本文对应官方文档[性能指南](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/performance-overview)与 HiLog 日志指南。

**学习目标**：建立"度量优先"的性能工作流，掌握 Profiler 的基本用法，攒一份可执行的优化清单。

## 性能工作的三段式

性能优化的纪律：**先度量、再定位、后优化**——顺序反了就是玄学调参。三段式在鸿蒙上的对应工具：

1. **度量**：DevEco Profiler（时间线看主线程占用/帧率/内存曲线）；
2. **定位**：HiTrace/时间线上的热点区间 + HiLog 时间戳埋点；
3. **优化**：按本章清单逐项对照。

## HiLog：会说话的日志

用 HiLog 而不是 console.log——它有域/标签/分级，能按 tag 过滤且进系统日志通道：

```ts
import { hilog } from '@kit.PerformanceAnalysisKit'

const DOMAIN = 0x0001
const TAG = 'FeedPage'

hilog.debug(DOMAIN, TAG, 'render cost %{public}d ms', cost)
hilog.info(DOMAIN, TAG, 'load %{public}s posts %{public}d', source, count)
hilog.error(DOMAIN, TAG, 'fetch failed: %{public}s', (e as Error).message)
```

两条纪律：格式串用 `%{public}`（隐私默认打码，真要打印明文才开 public）；**关键路径埋耗时点**（before/after 一对 info），卡顿时 Profiler 缩小区间、日志给出精确耗时，两边互证。

## Profiler：看曲线找病灶

DevEco 的 Profiler 会话抓三张关键图：

- **CPU/线程时间线**：主线程（main thread）上的长条 = 卡顿。把 UI 动画期间的连续长条定位到函数栈，八成是主线程做了重活（大 JSON 解析→[第 9 章 TaskPool](/posts/arkts-dev/09-concurrency.md)、同步 I/O→异步化）；
- **内存**：反复操作页面后曲线不回落 = 泄漏，重点排查没释放的监听/定时器（[ArkTS 第 6 章](/posts/arkts-dev/06-lifecycle-routing.md)的对称纪律）与闭包持有的大对象；
- **帧率**：滑动列表掉帧帧，结合时间线看是渲染（布局层级深）还是数据（ForEach 全量重建）。

## 优化清单（高频项）

- **长列表**：LazyForEach 按需渲染（[ArkTS 第 5 章](/posts/arkts-dev/05-render-control.md)）+ 稳定键 + `@Reusable` 组件复用池（复用组件实例而非重建）；
- **布局层级**：深嵌套 Column/Row 链条摊平——测量（measure）与布局成本随深度增长，能用一个容器别套三层；
- **启动时长**：AbilityStage/首屏里只做"必须"的初始化，非关键 SDK 延迟到首帧后（异步化或空闲触发）；
- **状态粒度**：@State 别把大对象整棵挂在会频繁变的路径上（[ArkTS 第 7 章](/posts/arkts-dev/07-state-deep-and-v2.md)的粒度问题），缩小刷新范围；
- **资源与图片**：图片按显示尺寸解码，不加载原图到列表。

## 崩溃与调试

- 真机调试走 DevEco（断点、变量、调用栈体验与[JS 第 9 章](/posts/javascript-core/09-errors-and-debugging.md)一致）；
- 命令行 `hdc shell hilog | grep FeedPage` 过滤日志、`hdc install` 装包、`hdc file send/recv` 推拉文件；
- 线上崩溃看 faultlogger：JS_ERROR 类崩溃的堆栈指向 .ets 行号，结合 Sourcemap/符号表定位——发布版签名配置里保留符号，否则堆栈是乱的。

## 踩坑提示

- 只在低端真机上测流畅度：模拟器 CPU 太强，主线程的烂都藏起来了。
- 优化前不抓基线数据，优化后无法证明有效——每个优化项配一组前后数字。
- console.log 在发布包里忘删，高频循环里一秒几百条——性能杀手兼日志噪音源，打包前统一替换成 HiLog 并关 debug 级。

## 练习

1. 给 FeedPage 的 load() 埋一对 HiLog 时间戳，Profiler 里同步观察主线程长条是否消失（把解析挪进 TaskPool 前后对比）。
2. 把 1000 条列表从 ForEach 换成 LazyForEach + @Reusable，用帧率图记录提升。
3. 人为写一个定时器泄漏，用内存曲线抓出它，再修复。
