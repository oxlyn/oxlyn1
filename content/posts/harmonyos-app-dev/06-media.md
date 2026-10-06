---
title: "鸿蒙应用开发 · 第 6 章：多媒体能力"
description: "相机 Kit 的流程骨架、相册 Picker 的免权限取图、图片显示与保存到媒体库。"
publishDate: 2026-07-01T09:00:00
tags: ["harmonyos", "arkts", "教程"]
---

> 本文对应官方文档[相机开发概述](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/camera-overview)与用户文件/相册相关指南。

**学习目标**：理解相机 Kit 的输入输出流模型，用 Picker 免权限取图，把图片显示并存进媒体库。

## 相机：输入输出流的编排

相机开发的心智模型是**管线**：相机设备（输入流）→ 会话配置 → 输出流（预览 Surface / 拍照 / 录像）。骨架五步：

```ts
import { camera } from '@kit.CameraKit'

// 1. 拿相机管理器，选后置相机
const manager = camera.getCameraManager(context)
const device = manager.getSupportedCameras()[0]
// 2. 创建输入流并打开
const input = manager.createCameraInput(device)
await input.open()
// 3. 创建会话，绑输入输出，配置模式
const session = manager.createSession(camera.SceneMode.NORMAL_PHOTO)
session.beginConfig()
session.addInput(input)
// session.addOutput(previewOutput) / addOutput(photoOutput) ...
await session.commitConfig()
await session.start()      // 4. 启动：预览开始流动
// 5. photoOutput.capture() 触发拍照
```

真实项目里这五步各自带错误分支（相机被占用、分辨率协商），官方 Samples 的 Camera 示例是最佳抄写对象。初次使用还需在 module.json5 声明 `ohos.permission.CAMERA`。

**UI 侧**：预览流通过 `XComponent` 挂到界面上——`cameraOutput` 与 Surface 绑定后，预览画面就"长"在组件里。

## 相册取图：优先 Picker

让用户选一张图片，**不要**直接申请相册读取权限——用系统 Picker，用户在系统界面里挑，应用只拿到用户**选中**的那张：

```ts
import { photoAccessHelper } from '@kit.MediaLibraryKit'

async function pickImage(context: Context): Promise<string | null> {
  const picker = new photoAccessHelper.PhotoViewPicker()
  const result = await picker.select({
    MIMEType: photoAccessHelper.PhotoViewMIMETypes.IMAGE_TYPE,
    maxSelectNumber: 1,
  })
  return result.photoUris[0] ?? null     // 用户没选返回 null
}
```

这是权限最小化原则（[第 5 章](/posts/harmonyos-app-dev/05-background-tasks.md)同款精神）：**能借系统 UI 完成的，不申请裸权限**——审核也更顺。

## 显示与保存

拿到的 uri 直接喂给 Image 组件：

```ts
Image(this.pickedUri)
  .width(200).height(200)
  .objectFit(ImageFit.Cover)
```

把一张图**存进媒体库**（让相册 App 能看到）走 PhotoAccessHelper 的写入接口，同样建议通过 Picker 的安全组件（如 "保存" 按钮的临时授权）完成——申请整个相册的写权限属于高射炮打蚊子。

裁剪、压缩等编辑能力走 Image Kit 的 imageSource 解码：`image.createImageSource(uri)` → 解码成 `PixelMap` → `imagePacker` 重新打包——处理后的数据再落盘。

## 踩坑提示

- 相机输入流的生命周期跟着页面走：onPageShow 里 start，onPageHide 里 stop——否则退后台占着摄像头被系统警告。
- Picker 返回的 uri 是**临时授权**的，应用重启后直接读可能失效——需要长期访问就把文件拷进沙箱（[第 2 章](/posts/harmonyos-app-dev/02-preferences-files.md)）或走媒体库的持久授权。
- PixelMap 占内存大，用完 `release()`，长列表缩略图先降采样再显示。

## 练习

1. 实现头像设置：Picker 选图 → 圆形裁剪显示 → 存沙箱 → 重启后恢复。
2. 把相机预览跑起来：XComponent + 五步管线，onPageHide 时正确停流。
3. 对比"申请相册读权限直接查图"与"Picker 选图"两条路在审核视角的差异，写成注释留在代码里。
