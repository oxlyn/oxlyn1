---
title: "React 核心入门 · 附录：Hook 速查与资源"
description: "React Hooks 与高频模式一页速查，附十条纪律、资源与站内对照索引。"
publishDate: 2026-08-11T09:00:00
tags: ["react", "教程"]
---

## 基础 Hook（第 1–6 章）

```jsx
const [state, setState] = useState(0)
setState((prev) => prev + 1)            // 函数式：基于最新值（第 2 章）
setUser({ ...user, name })              // 不可变替换（第 2 章）
setState([...list, item])               // 数组追加
setList(list.filter((i) => i.id !== id))// 删除

<button onClick={() => fn(arg)}>        // 事件：传函数不是调用
value + onChange                        // 受控组件（第 6 章，React 版 v-model）
```

## 渲染纪律（第 3 章）

```jsx
const sorted = [...props.items].sort(...)   // 渲染期派生：造新引用，别突变
if (!user) return <Login />                 // 提前 return：条件渲染首选
<li key={item.id}>                          // 稳定 id，别用 index（第 4 章）
{items.length > 0 && <Badge />}             // && 左值必须布尔化
```

## Effect 与 Ref（第 5、8 章）

```jsx
useEffect(() => {
  const conn = connect(id)
  return () => conn.disconnect()        // 清理成对出现
}, [id])                                // 依赖诚实列出

let ignore = false                      // 请求竞态守卫
return () => { ignore = true }

const timerRef = useRef(null)           // 不触发渲染的盒子（DOM/定时器）
```

## 复用与共享（第 7、8 章）

```jsx
const ThemeContext = createContext(null)
<ThemeContext value={{ theme, toggle }}>…</ThemeContext>   // value 别在渲染期新造
const { theme } = useContext(ThemeContext)

export function useOnline() { /* use 开头：useState+useEffect 闭包封装 */ }
const memoVal = useMemo(() => heavy(a), [a])       // 缓存昂贵计算
const stableFn = useCallback((id) => go(id), [])   // 稳定引用给 memo 子组件
const MemoList = memo(PostList)                    // props 浅比较跳过渲染（第 9 章）
```

## 十条纪律

1. 组件即纯函数：渲染期不突变、不副作用（[第 3 章](/posts/react-core/03-render-and-purity.md)）；
2. 派生值渲染期算，"你可能不需要 Effect"（[第 5 章](/posts/react-core/05-lifecycle-and-effects.md)）；
3. state 不可变更新，依赖旧值用函数式 setter（[第 2 章](/posts/react-core/02-state-and-events.md)）；
4. key 用稳定 id，index 永不上岗（[第 4 章](/posts/react-core/04-lists-keys-conditional.md)）；
5. Effect 的清理成对出现，StrictMode 双挂载当免费测试（[第 5 章](/posts/react-core/05-lifecycle-and-effects.md)）；
6. 状态放最低层，兄弟共享提升，跨层低频才 Context（[第 7 章](/posts/react-core/07-sharing-state-context.md)）；
7. 自定义 Hook use 前缀 + 顶层调用（[第 8 章](/posts/react-core/08-custom-hooks.md)）；
8. 闭包陷阱三解：函数式 setter / 依赖数组 / useRef（[第 8 章](/posts/react-core/08-custom-hooks.md)）；
9. 优化先 Profiler 后 memo，状态先下放（[第 9 章](/posts/react-core/09-performance.md)）；
10. 静态归静态、交互归交互——岛屿与 RSC 的共同哲学（[第 10 章](/posts/react-core/10-ecosystem-integration.md)）。

## 十章一图

| 主线 | 章节 | 一句话 |
| --- | --- | --- |
| 模型 | [1](/posts/react-core/01-components-and-jsx/) [2](/posts/react-core/02-state-and-events/) [3](/posts/react-core/03-render-and-purity/) | 组件即函数，state 是快照，渲染必须纯 |
| UI | [4](/posts/react-core/04-lists-keys-conditional/) [6](/posts/react-core/06-forms-and-controlled.md) | 列表靠 map+key，表单靠受控 |
| 同步 | [5](/posts/react-core/05-lifecycle-and-effects.md) | Effect 只管"与外部系统同步" |
| 复用与性能 | [7](/posts/react-core/07-sharing-state-context.md) [8](/posts/react-core/08-custom-hooks.md) [9](/posts/react-core/09-performance.md) | 提升与 Context 分层，Hook 复用，先测量再 memo |
| 落地 | [10](/posts/react-core/10-ecosystem-integration.md) | React 19 方向与 Astro 岛屿集成 |

## 资源

- [React 官方中文文档](https://zh-hans.react.dev/learn)——本系列依据（官方维护中文版）
- [API 参考](https://zh-hans.react.dev/reference/react)——全量 Hook 手册
- [React DevTools](https://zh-hans.react.dev/learn/react-developer-tools)——Profiler 是第 9 章的眼睛
- [Playground](https://react.dev/playground)——在线实验

## 站内对照索引

- 平行系列：[《Vue 核心入门》](/posts/vue-core/)——每章概念一一对应（ref↔useState、watch↔useEffect、composable↔自定义 Hook）
- 底座：[《JavaScript 核心入门》](/posts/javascript-core/)（闭包↔Hook 快照）· [《CSS 核心入门》](/posts/css-core/) · [《Tailwind CSS 实战入门》](/posts/tailwind-css/)（className 与组件抽取）
- 出口：[《Astro 主题开发》](/posts/astro-theme-dev/)的岛屿与 [Vite 系列](/posts/vite-dev/)的工程底座
