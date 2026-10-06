---
title: "鸿蒙应用开发：从能力到上架"
description: "鸿蒙应用开发系列总览：数据持久化、后台任务、多媒体、一多适配、卡片、性能与上架的完整路线。"
publishDate: 2026-07-19T09:00:00
tags: ["harmonyos", "arkts", "教程"]
---

[《ArkTS 鸿蒙开发入门》](/posts/arkts-dev/)解决了"语言 + UI + 状态"——那是写字。这个系列解决"做应用"：**把数据存下来、在后台干活、拍照选图、适配所有屏幕、放到桌面上、跑到够快、最后签出来上架**。每一章对应真实应用开发绕不开的一项横向能力。

> 内容依据 HarmonyOS/OpenHarmony 官方文档（应用模型、数据管理、后台任务、多媒体、卡片、性能等指南）整理，代码示例均为原创，每章附官方文档链接。

## 章节导航

| 章节 | 内容 | 官方对应 |
| --- | --- | --- |
| [第 1 章：应用模型与模块化工程](/posts/harmonyos-app-dev/01-app-model/) | Stage 模型、HAP/HAR/HSP、多模块拆分 | [应用模型概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/abilitykit-overview) |
| [第 2 章：轻量持久化](/posts/harmonyos-app-dev/02-preferences-files/) | Preferences 用户首选项、沙箱文件 | [用户首选项](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/data-persist-by-preferences) |
| [第 3 章：关系型数据库](/posts/harmonyos-app-dev/03-relational-store/) | RelationalStore 建表 CRUD、事务与升级 | [关系型数据库](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/data-persist-by-relational-store) |
| [第 4 章：数据层架构](/posts/harmonyos-app-dev/04-data-layer/) | Repository 模式：网络 + 缓存 + 状态收口 | ——（实践章） |
| [第 5 章：后台任务与通知](/posts/harmonyos-app-dev/05-background-tasks/) | 短时/长时/延迟任务、通知发布 | [后台任务总览](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/background-task-overview) |
| [第 6 章：多媒体能力](/posts/harmonyos-app-dev/06-media/) | 相机流程、相册 Picker、图片保存 | [相机开发概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/camera-overview) |
| [第 7 章：一多适配](/posts/harmonyos-app-dev/07-adaptive-layout/) | 断点、栅格、自适应布局 | [一多开发概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/multi-device-app-dev-overview) |
| [第 8 章：应用卡片](/posts/harmonyos-app-dev/08-widget/) | ArkTS 卡片创建、配置与刷新 | [卡片概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/arkts-form-overview) |
| [第 9 章：性能与调试](/posts/harmonyos-app-dev/09-performance-debug/) | HiLog、Profiler、卡顿定位 | [性能指南](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/performance-overview) |
| [第 10 章：签名与上架](/posts/harmonyos-app-dev/10-release/) | 证书与 Profile、打包、AGC 上架 | [签名工具](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/hapsigntool-overview) |
| [附录：速查与清单](/posts/harmonyos-app-dev/11-appendix/) | 能力速查、上架检查清单、资源 | — |

## 三条主线

1. **数据**（第 2–4 章）——从 Preferences 到数据库再到 Repository 收口，数据是应用的内存；
2. **系统能力**（第 5–8 章）——后台、多媒体、多端、桌面卡片，每一项都是"申请权限 + 系统 API + 生命周期纪律"的三段式；
3. **质量与发布**（第 9–10 章）——性能靠度量不靠感觉，上架是合规工程不是技术活。

## 学习方式

每章继续沿用站内惯例：**学习目标 → 概念 → 动手实践 → 踩坑提示 → 练习**。系列以"做一个资讯类 App"为暗线：第 2–4 章给它数据层，第 5 章加推送与后台同步，第 7 章适配平板双栏，第 8 章上桌面卡片，第 10 章上架——读完你手里就有一个可提交的作品。

## 遗留问题

- 分布式流转、安全（密钥/证书管理）、ArkWeb 混合开发、AI 能力（如意图框架）未展开。
- 上架流程以 AppGallery Connect 现行规则为准，本章只给骨架，合规细节以华为审核规范最新版为准。
