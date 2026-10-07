---
title: "本地与浏览器推理入门 · 第 2 章：Ollama 本地起步"
description: "安装与模型拉取、ollama run 与参数量化标签、OpenAI 兼容端点、notes 本地版的第一步。"
publishDate: 2026-12-18T09:00:00
tags: ["webgpu", "ai", "教程"]
---

> 本文对应 [Ollama 官网](https://ollama.com)与[模型库](https://ollama.com/library)。

**学习目标**：装好 Ollama、拉下第一个模型、用命令行跑通对话，读懂模型标签里的参数量与量化信息。

Ollama 是本地推理的"npm"——一条命令装模型、一条命令跑、自带 OpenAI 兼容服务端。本系列本地路线的全部基础设施就是它。

## 安装与第一次对话

```bash
# macOS / Windows：官网下载安装包；Linux 一行脚本
curl -fsSL https://ollama.com/install.sh | sh

ollama pull qwen3:8b      # 拉取模型（按网速几分钟到几小时）
ollama run qwen3:8b       # 进入交互对话
>>> 用一句话解释什么是量化
```

`pull` 下载的是**量化好的权重**（几 GB）；`run` 交互验证模型能跑；`Ctrl+D` 退出。模型列表与细节见 [ollama.com/library](https://ollama.com/library)——每个模型页都标着参数量、量化等级与体积，下载前先对一遍[第 1 章](/posts/local-ai-dev/01-why-local/)的显存公式。

## 读懂模型标签

```text
qwen3:8b        ← 8B 参数
qwen3:8b-q4_K_M ← 8B + Q4_K_M 量化（4bit 系，体积与质量的主流平衡）
llama3.1:70b    ← 70B：消费级设备请绕行
```

选择常识：**先看显存再选参数量**，8B/Q4 是 8GB 显存的甜点；同参数量下新版本模型通常更强；中文任务优先试 Qwen 系。**别追大**——7B 的"够用"在本地场景里远比 70B 的"跑不动"有价值，质量差距用[提示词与评测](/posts/evals-dev/)补。

## 服务端：OpenAI 兼容端点

Ollama 常驻一个本地服务，默认监听 `http://localhost:11434`，关键端点：

```bash
# 原生 API
curl http://localhost:11434/api/generate -d '{"model":"qwen3:8b","prompt":"hi"}'

# OpenAI 兼容端点（v1 前缀）——本系列的推荐用法
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3:8b","messages":[{"role":"user","content":"hi"}]}'
```

**`/v1` 前缀意味着任何会说"OpenAI 方言"的客户端都能直连**——下一章把 AI SDK 与[评测 runner](/posts/evals-dev/05-runner/) 指过来，代码零改动。模型管理常用命令：

```bash
ollama list          # 已装模型与体积
ollama ps            # 正在运行的模型（显存占用）
ollama rm qwen3:8b   # 删除，回收磁盘
```

## notes 本地版的第一块拼图

[Node 版 store](/posts/node-core/04-fs-and-path/) + Ollama 端点 = **零 key 的本地 Agent 底座**。验证三件事：模型能跑（`run`）、服务能调（`/v1` 端点）、显存够用（`ollama ps` 的数字对照第 1 章公式）。下一章写真正的客户端代码。

## 踩坑提示

- 拉了 70B 模型机器卡死——显存不够会溢出到内存/CPU，速度掉一到两个数量级；先 `ps` 看 swap 情况；
- 端口被占或服务没起——`ollama serve` 手动前台跑，看日志；默认只监听本机（`OLLAMA_HOST` 可改）；
- 模型名不带量化标签时拉的是默认量化——体积与预期不符时核对 library 页；
- 磁盘悄悄满了——模型动辄 5~50 GB，`list` + `rm` 定期清理，别等系统报警。

## 练习

1. 按显存公式选出你能跑的最大模型，拉下来并用 `run` 做五轮中文对话，主观记一下速度。
2. 用 curl 分别打 `/api/generate` 与 `/v1/chat/completions`，对比两种响应形状。
3. `ollama ps` 观察一次对话前后的显存占用，验证第 1 章的估算公式。
