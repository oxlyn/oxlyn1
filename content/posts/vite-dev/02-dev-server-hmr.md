---
title: "Vite 工程化入门 · 第 2 章：开发服务器与 HMR"
description: "模块图如何驱动热更新、HMR 的边界与失效场景、server 配置的常用项。"
publishDate: 2026-05-22T09:00:00
tags: ["vite", "前端工程化", "教程"]
---

> 本文对应官方文档[Features](https://cn.vite.dev/guide/features)与[server 配置](https://cn.vite.dev/config/server-options.html)。

**学习目标**：理解 HMR 的工作机制与边界，掌握 server 常用配置（端口/代理/网络访问）。

## HMR 在替你做什么

改一行代码保存，浏览器**不刷新**但界面更新——Hot Module Replacement（热模块替换）的流程：

1. 文件变化，Vite 重新编译该模块；
2. Vite 根据依赖图判断**谁受了影响**：受影响的模块在浏览器里失效；
3. 页面里的 HMR 运行时**重新 import 失效模块**，替换旧实现；
4. 如果某个模块声明了 HMR 接受逻辑（`import.meta.hot.accept`），就地替换；没有一路冒泡到顶层——最终退化为整页刷新。

关键概念是**模块图（module graph）**：Vite 维护着"谁引用谁"的完整图。改 `utils.ts` 只影响引用它的两个组件；改 `main.ts`（入口）基本等于全量。所以 HMR 速度取决于**受影响的子图大小**，与项目总体积无关——这就是[第 1 章](/posts/vite-dev/01-why-vite.md)"保存焦虑终结"的机制层解释。

Vue/Astro 等框架插件为组件注册了精确的 accept 逻辑（组件状态保留、只换渲染函数），所以你平时感觉不到第 4 步的兜底刷新。

## HMR 的边界：什么时候会整页刷新

这些情况 HMR 自动降级为 full reload——不是坏了，是边界：

- 修改的模块**无法自接受**且冒泡到入口（如普通工具模块无 HMR 声明）；
- 修改 **vite.config.ts** / `.env` 文件——配置是服务端的根，只能重启（手动 `npm run dev`）；
- 修改 HTML 入口结构本身；
- CSS 与组件一样可热替换（样式模块天然"自接受"），改起来最丝滑。

对照记忆：[ArkTS/Cordis 的热重载](/posts/arkts-dev/06-composition-and-hmr.md)是"卸载旧插件 → 重挂新插件"（运行时实例级），Vite 的 HMR 是"重新请求模块 → 就地替换"（模块级）——同名技术，不同的粒度与代价模型。

## server 配置：最常用的四项

```ts
export default defineConfig({
  server: {
    port: 5173,             // 端口（占用时自动 +1）
    host: true,             // 监听 0.0.0.0：手机真机/局域网可访问（本站 --host 同款需求）
    open: true,             // 启动即开浏览器
    proxy: {
      // 跨域的后端接口代理给 dev server 转发
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

`server.proxy` 是前后端联调的神器：开发期浏览器只认同源（[JS 第 8 章](/posts/javascript-core/08-modules.md)），让 dev server 假装是后端，跨域问题在开发期就不存在（生产环境则靠网关/nginx 同源化）。

## 踩坑提示

- 手机访问不到 dev server：忘了 `host: true`（或命令行 `--host`）——Vite 默认只监听 localhost。
- 代理只对 dev 生效！上线后 `/api` 要在生产环境有真实对应（网关配置），别把"开发能跑"当成"上线能跑"（[第 3 章](/posts/vite-dev/03-build-and-env.md)的环境差异主线）。
- HMR 偶发"改了没反应"：先看终端有没有编译报错；再怀疑文件被两个进程监听（IDE + Vite 的保存行为冲突）。

## 练习

1. 在 vanilla 项目里改 CSS/改 TS/改 vite.config 各一次，观察终端与浏览器反应的差异。
2. 配一个 /api 代理指向任意公开接口，验证 dev 下无跨域、preview 下失效。
3. 用 `host: true` + 局域网 IP 在手机浏览器打开 dev 页面。
