---
title: "鸿蒙应用开发 · 附录：能力速查与上架清单"
description: "鸿蒙应用开发一页速查：存储选型、任务选型、权限与生命周期纪律，附上架自查清单与资源。"
publishDate: 2026-08-23T09:00:00
tags: ["harmonyos", "arkts", "教程"]
---

## 选型速查

**数据存储**（第 2–3 章）：

| 数据 | 去处 |
| --- | --- |
| 开关/Token/小设置 | Preferences（记得 flush） |
| 结构化可查询数据 | RelationalStore（谓词查询 + 版本升级） |
| 用户文档/大文件 | filesDir / 媒体库 |
| 可再生缓存 | cacheDir（随时会被清） |

**后台任务**（第 5 章）：

| 场景 | 方案 |
| --- | --- |
| 退后台收尾（< 3 分钟） | 短时任务 transient |
| 持续运行（播放/导航/传输） | 长时任务 + 常驻通知 |
| 择机批处理（同步/清理） | 延迟任务 WorkScheduler |
| 桌面轻展示 | 卡片代理刷新 |

**取图与保存**（第 6 章）：优先系统 Picker（免裸权限），需要长期访问再拷沙箱或持久授权。

## 纪律清单（来自前九章）

- [ ] open/close、start/stop、add/remove 成对出现（资源对称）
- [ ] 权限逐条能说出用途，能走 Picker/系统能力的不申请裸权限
- [ ] 数据库迁移能从任意旧版本升级通过（覆盖安装实测）
- [ ] 主线程无重活：解析/排序进 TaskPool，I/O 全异步
- [ ] 长列表：LazyForEach + 稳定键 + @Reusable
- [ ] 发布日志替换 console.log，HiLog 分级 + `%{public}` 收敛
- [ ] 断点适配：状态不因窗口切换丢失，布局无写死 px
- [ ] 每个上架版本保留符号文件与基线性能数据

## 上架自查清单（第 10 章）

- [ ] 发布证书 / Profile 有效期内，包名一致
- [ ] versionCode 递增，APP 包内权限与 module.json5 一致
- [ ] 隐私声明与实际数据收集逐项对齐
- [ ] 图标/截图按目标设备规格齐全，多语言资源完整
- [ ] 从旧版本覆盖安装验证数据迁移与首屏启动
- [ ] 卡片多规格布局正常（1×2 / 2×2 / 2×4）

## 十章一图

| 主线 | 章节 | 一句话 |
| --- | --- | --- |
| 模型与数据 | [1](/posts/harmonyos-app-dev/01-app-model/) [2](/posts/harmonyos-app-dev/02-preferences-files/) [3](/posts/harmonyos-app-dev/03-relational-store/) [4](/posts/harmonyos-app-dev/04-data-layer/) | Stage 模型分层，数据经 Repository 单点收口 |
| 系统能力 | [5](/posts/harmonyos-app-dev/05-background-tasks/) [6](/posts/harmonyos-app-dev/06-media/) [7](/posts/harmonyos-app-dev/07-adaptive-layout/) [8](/posts/harmonyos-app-dev/08-widget/) | 报备才能后台，最小权限，断点定形态，卡片是第二门面 |
| 质量与发布 | [9](/posts/harmonyos-app-dev/09-performance-debug.md) [10](/posts/harmonyos-app-dev/10-release/) | 先度量再优化，签名与合规是上架的门槛 |

## 官方资源

- [HarmonyOS 应用开发指南](https://developer.huawei.com/consumer/cn/doc/)——按 Kit 组织的权威文档
- [OpenHarmony Samples](https://gitee.com/openharmony/applications_app_samples)——官方特性示例仓库
- [DevEco Studio 下载](https://developer.huawei.com/consumer/cn/deveco-studio/)——IDE 与工具链
- [AppGallery Connect](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html)——签名、上架、数据看板

## 站内延伸

- 前置：[《JavaScript 核心入门》](/posts/javascript-core/) → [《TypeScript 核心入门》](/posts/typescript-core/) → [《ArkTS 鸿蒙开发入门》](/posts/arkts-dev/)
- 对照：数据层的 Repository 思想与 [DSH 系列的服务与 inject](/posts/dsh-plugin-dev/03-services.md) 同源；一多适配与 [Astro 主题的 token 化](/posts/astro-theme-dev/04-styling-theming.md) 思路一致
