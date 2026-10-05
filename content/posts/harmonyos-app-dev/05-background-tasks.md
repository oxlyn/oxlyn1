---
title: "鸿蒙应用开发 · 第 5 章：后台任务与通知"
description: "短时/长时/延迟三类后台任务的申请与边界，通知授权与发布、进度通知的完整流程。"
publishDate: 2026-07-24T09:00:00
tags: ["harmonyos", "arkts", "教程"]
---

> 本文对应官方文档[后台任务总览](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/background-task-overview)、[长时任务](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/continuous-task)与[通知开发](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/notification-overview)。

**学习目标**：分清三类后台任务的适用场景，正确申请与注销，走通通知的授权与发布。

## 退到后台，代码还在跑吗

应用退到后台后进程被**挂起**——定时器停摆、网络回调冻结。想让工作继续，必须向系统"报备"。三类任务的分工：

| 类型 | 适用 | 时长 | 典型场景 |
| --- | --- | --- | --- |
| 短时任务 transient | 退后台的**收尾工作** | 约 3 分钟（可续期一次） | 保存草稿、完成一次上传 |
| 长时任务 continuous | **持续运行**的能力 | 随宿主存活 | 音乐播放、导航、下载 |
| 延迟任务 workScheduler | **不急**、条件触发的批处理 | 系统择机 | 定期同步、清理缓存 |

选型判断就一句：**几分钟内能完事用短时，必须一直跑用长时，什么时候跑都行用延迟**。

## 短时任务：给收尾争取时间

```ts
import { backgroundTaskManager } from '@kit.BackgroundTaskKit'

async function requestOnce() {
  const id = await backgroundTaskManager.requestSuspendDelay('保存草稿')
  // ... 在有效期内完成收尾（id.remainingDelayTime 可查剩余）
  backgroundTaskManager.cancelSuspendDelay(id.requestId)   // 干完主动释放
}
```

短时任务是**默认权利**（无需权限），只是有上限——用它兜住"退后台瞬间没做完的事"，不要指望它长时间干活。

## 长时任务：声明"我在干嘛"

长时任务必须**指定任务类型**（音频播放、位置、数据传输等），且多数类型要求**配一条常驻通知**告诉用户"后台有东西在跑"：

```ts
import { backgroundTaskManager } from '@kit.BackgroundTaskKit'
import { notificationManager } from '@kit.NotificationKit'

async function startSync(context: Context) {
  await notificationManager.requestEnableNotification(context)   // 先拿通知授权
  await notificationManager.publish({
    id: 1001,
    content: { notificationContentType: notificationManager.ContentType.NOTIFICATION_CONTENT_BASIC_TEXT,
      normal: { title: '同步中', text: '正在同步文章数据', additionalText: '3/10' } },
  })
  await backgroundTaskManager.startBackgroundRun(context,
    [backgroundTaskManager.BackgroundMode.DATA_TRANSFER])
}

async function stopSync(context: Context) {
  await backgroundTaskManager.stopBackgroundRun(context,
    [backgroundTaskManager.BackgroundMode.DATA_TRANSFER])
  await notificationManager.cancel(1001)
}
```

生命周期纪律与[ArkTS 第 6 章](/posts/arkts-dev/06-lifecycle-routing.md)同款：**start 与 stop 成对出现**——Ability 的 onBackground 里 start、onForeground 里 stop 是常见锚点。谎报类型（申请 DATA_TRANSFER 干别的事）会被系统回收。

## 延迟任务：交给系统调度

定期同步这种"不急"的活交给 WorkScheduler——**即使应用没在运行也能被拉起**，由系统按条件（网络、充电、时间窗）择机执行：

```ts
import { workScheduler } from '@kit.BackgroundTaskKit'

const workInfo: workScheduler.WorkInfo = {
  workId: 1,
  bundleName: 'com.oxlyn.news',
  abilityName: 'SyncWorkAbility',        // 继承 ExtensionAbility 的回调载体
  networkType: workScheduler.NetworkType.NETWORK_TYPE_WIFI,
  isRepeat: true,
  repeatCycleTime: 4 * 60 * 60 * 1000,   // 每 4 小时
}
workScheduler.startWork(workInfo)
```

回调和执行逻辑放在 ExtensionAbility 里——它是"系统替你跑的定时器"，不是应用内的 setInterval（那种写法退后台就死了，[第 4 章](/posts/harmonyos-app-dev/04-data-layer.md)的同步需求正该用它）。

## 通知的三步纪律

1. **先授权**：`requestEnableNotification` 引导用户打开（授权默认是关的）；
2. **再发布**：content 结构按类型选择（文本/图片/进度），同 id 覆盖更新（下载进度通知就是不断覆盖同一条）；
3. **会取消**：任务结束 cancel 对应 id，别让通知栏积尸。

## 踩坑提示

- 模拟器上长时任务不配通知可能"看起来正常"，真机会被系统限制——开发期就按规范全配。
- 延迟任务的 WorkInfo 不能改成"每分钟"这种高频——系统有最低周期约束，高频轮询请重新审视设计。
- 通知文案绕过字符串资源写死英文/中文，上架[多语言审核](/posts/harmonyos-app-dev/10-release.md)会挂——统一走 `$r('app.string.xxx')`。

## 练习

1. 给第 4 章的 Repository 加"退后台继续同步"：onBackground 申请长时任务 + 常驻通知，同步完 stop。
2. 实现下载进度通知：同一 id 覆盖更新 additionalText，完成后 cancel。
3. 用 WorkScheduler 实现每 6 小时同步一次书签，断网条件下验证不触发（NETWORK_TYPE_WIFI 生效）。
