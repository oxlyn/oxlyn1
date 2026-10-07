---
title: "本地与浏览器推理入门 · 第 4 章：WebGPU 入门"
description: "浏览器 GPU 计算的基础：adapter/device、与 WebGL 的区别、为什么 LLM 能在浏览器里跑。"
publishDate: 2026-12-20T09:00:00
tags: ["webgpu", "ai", "教程"]
---

> 本文对应 [MDN WebGPU 文档](https://developer.mozilla.org/docs/Web/API/WebGPU_API)与 [WebGPU 规范](https://www.w3.org/TR/webgpu/)。

**学习目标**：理解 WebGPU 是什么、它与 WebGL 的代差在哪里，掌握适配器与设备的检测模式，明白"LLM 能在浏览器跑"的算力逻辑。

[第 1 章](/posts/local-ai-dev/01-why-local/)说浏览器推理的算力来自"访客的 GPU"——兑现它的浏览器 API 就是 WebGPU。这一章是第 5~6 章的地基，只讲用得上的部分。

## WebGPU：浏览器的下一代 GPU 接口

```ts
// 检测三连：支持 → 适配器 → 设备
if (!navigator.gpu) throw new Error("浏览器不支持 WebGPU")

const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" })
if (!adapter) throw new Error("没有可用的 GPU 适配器")

const device = await adapter.requestDevice()
console.log("GPU 就绪：", adapter.info)
```

三个概念层层递进：`navigator.gpu` 是入口（不支持就到此为止）；**adapter** 是一块具体 GPU（笔记本常有集成/独显两块，`powerPreference` 选高性能）；**device** 是程序与 GPU 的会话（持有缓冲区、管线、命令队列）。`adapter.info` 里的厂商与架构信息是[设备分级](/posts/local-ai-dev/10-performance-and-choice/)的依据。

## 与 WebGL 的代差

浏览器里跑 GPU 程序不是新事（WebGL 十几年了），但 WebGPU 为"计算"而生的设计让它配得上 LLM：

| | WebGL | WebGPU |
| --- | --- | --- |
| 设计目标 | 画图形 | 通用计算 + 图形 |
| 计算模型 | 借用图形管线伪装（fragment shader 算数） | 原生 **compute shader**（GPGPU 一等公民） |
| API 风格 | 全局状态机（易错难并行） | 显式资源 + 命令缓冲（可并行、可预测） |
| 现代特性 | 无 | 存储缓冲区、计算工作组 |

LLM 推理的本质是**海量矩阵乘法**——compute shader 的主场。WebGL 时代在浏览器里跑神经网络是"戴着镣铐跳舞"（TensorFlow.js 的 WebGL 后端）——WebGPU 把镣铐摘了。

## 为什么 LLM 能在浏览器里跑

推理 = 权重（静态，[量化](/posts/local-ai-dev/01-why-local/)后 GB 级）× 一连串矩阵运算。三个条件 WebGPU 时代都成立了：

1. **权重放显存**：GPU 有 4~24GB 显存，Q4 量化的 7B 模型约 4GB——[第 1 章公式](/posts/local-ai-dev/01-why-local/)在访客设备同样成立；
2. **计算在 GPU**：compute shader 做矩阵乘的吞吐量逼近原生应用；
3. **生态补齐**：MLC（第 5 章）等框架把"编译模型到 WebGPU"做成了标准流程，前端开发者不需要写一行 shader。

## 检测与降级：产品视角

```ts
async function detectGPUClass() {
  if (!navigator.gpu) return "unsupported"
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) return "no-adapter"
  const limits = adapter.limits
  // maxBufferSize / maxStorageBufferBindingSize 粗判设备档次
  return limits.maxBufferSize > 1 << 30 ? "capable" : "limited"
}
```

访客设备千差万别：**capable → WebLLM 全量体验；limited → 更小的模型；unsupported → 引导本地服务器或云端**。[第 10 章](/posts/local-ai-dev/10-performance-and-choice/)的决策表以这个检测函数为入口。

## 踩坑提示

- 只在开发机（好显卡）上测试——用户集里三成设备过不了检测，降级路径是功能的一部分；
- 忘了 device 是异步资源——丢失时（`device.lost`）要能重建，长驻页面的必备；
- 拿 WebGPU 与原生 CUDA 比吞吐——同代差约 10~30% 的开销，这个折扣就是"零安装"的价格；
- 用 `powerPreference: "high-performance"` 不做提示——笔记本访客的电量与风扇会抗议，交互前给出预期。

## 练习

1. 在你的页面跑通检测三连，打印 `adapter.info` 与 `limits`，给自己的设备分级。
2. 找三台不同档次的设备（或用户代理模拟）跑检测函数，记下分布。
3. 读 [MDN 的 compute shader 示例](https://developer.mozilla.org/docs/Web/API/WebGPU_API)（不必写完），画出"权重在显存、计算在工作组"的推理图景。
