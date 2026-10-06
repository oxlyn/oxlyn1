---
title: "鸿蒙应用开发 · 第 10 章：签名与上架"
description: "调试与发布签名的证书体系、App 包打包流程、AppGallery Connect 上架与审核要点。"
publishDate: 2026-07-05T09:00:00
tags: ["harmonyos", "arkts", "教程"]
---

> 本文对应官方文档[签名工具 HAP Signer](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/hapsigntool-overview)与 AppGallery Connect 发布指南。

**学习目标**：理解鸿蒙签名的证书体系，走通从打包到上架 AppGallery 的全流程。

## 签名体系：三个文件的关系

鸿蒙上每个安装包都必须签名，签名由三样东西构成：

| 文件 | 内容 | 说明 |
| --- | --- | --- |
| `.p12` | 密钥库（私钥） | 本地保管，**丢了要重走发布者身份流程** |
| `.cer` | 数字证书 | 公钥 + 身份，向 AGC 申请，绑定发布者 |
| `.p7b` | Profile | **包名 + 权限授权**的组合清单，打包时进包 |

三者缺一不可，Profile 是最容易被忽略的角色：**它把"这个包叫什么包名、能用哪些受限权限"钉死**——包名或权限对不上，装不上也没有申诉余地。

- **调试签名**：DevEco 的"自动签名"一键搞定（登录华为账号即生成，绑定调试设备列表），日常开发用这个；
- **发布签名**：证书与 Profile 在 AppGallery Connect 申请，需要先用调试包走完开发期。发布签名一旦确定，**应用包名终身绑定**——签名信息变更属于重_identity_级事故。

## 打包与验签

DevEco 的 "Build → Build App(s)" 产出 **APP 包**（上架格式，可含多 HAP/HSP），验签的本地方式：

```bash
# hap-sign-tool 验证签名（官方 hapsigntool）
java -jar hapsigntool.jar verify -inpath entry-signed.hap -outpath verify.log
```

上架前自查三件套：签名信息与 AGC 的 Profile 一致、版本号/版本码递增、包内权限清单与 module.json5 声明一致（多报或谎报权限是审核驳回大户——[第 5、6 章](/posts/harmonyos-app-dev/05-background-tasks.md)的权限最小化在这里兑现）。

## 上架流程骨架

AppGallery Connect（AGC）里的主线：

1. **创建应用**：包名（与 Profile 一致）、应用分类、语言；
2. **完善资料**：图标/截图（按目标设备规格）、简介、**隐私声明**（列全数据收集项——与代码里实际申请的权限必须对得上）；
3. **上传包**：Build 出的 APP 包上传至草稿，勾选发布国家/地区；
4. **提交审核**：审核关注点集中在——权限用途说明是否充分、隐私合规（个人数据收集最小化）、内容合规（含 UGC 的应用要提供举报/审核机制）、卡片与多语言资源完整性（[$r 资源](/posts/arkts-dev/03-declarative-ui.md)没写全会被点名）；
5. **发布**：审核通过后选择全量或分阶段发布，后继版本走版本管理（版本号递增 + 更新说明）。

时间线的现实预期：首次审核通常几天量级，驳回最常见的原因是**权限与功能不匹配**和**隐私声明缺项**——这两项提前自查能省一个来回。

## 版本迭代纪律

- `app.json5` 的 `versionCode` 严格递增，`versionName` 面向用户；
- 数据库/Preferences 的**数据迁移在发版前必须从旧版本覆盖升级验证**（[第 3 章](/posts/harmonyos-app-dev/03-relational-store.md)的版本升级测试就是为今天准备的）；
- 保留每个上架版本的符号文件——线上崩溃堆栈还原（[第 9 章](/posts/harmonyos-app-dev/09-performance-debug.md)）依赖它。

## 踩坑提示

- 发布证书/profile 过期导致无法出包——日历上给证书设到期提醒。
- 用调试签名包做兼容性测试结论：调试签名不含发布 Profile 的权限集，行为可能不同。
- 隐私声明写"可能收集"，代码里实际全量收集——审核双方对不齐直接驳回，如实声明最小化。

## 练习

1. 给自己的工程配置自动签名，装到真机，用 hapsigntool 验签并读一遍 verify 日志。
2. 在 AGC 建一个测试应用，把 APP 包走到"待提交审核"状态（不提交），截图存档整个流程。
3. 审计自己 module.json5 的权限清单：逐条写"哪个功能在用"，删掉说不出用途的。
