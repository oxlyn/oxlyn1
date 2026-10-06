---
title: "React 核心入门 · 第 4 章：列表与条件渲染"
description: "key 的身份语义、&& 与三元的选择、按状态切换组件——列表渲染的完整纪律。"
publishDate: 2026-08-04T09:00:00
tags: ["react", "教程"]
---

> 本文对应官方文档[渲染列表](https://zh-hans.react.dev/learn/rendering-lists)与[条件渲染](https://zh-hans.react.dev/learn/conditional-rendering)。

**学习目标**：写对列表渲染的 key，掌握条件渲染的四种模式，理解"位置匹配"带来的坑。

## 列表渲染：map + key

JSX 没有 v-for，列表就是数组的 `.map()`：

```jsx
function PostList({ posts }) {
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <h3>{post.title}</h3>
          <time>{post.date}</time>
        </li>
      ))}
    </ul>
  )
}
```

`key` 是 React diff 算法的**节点身份证**：状态变化时，React 靠 key 判断"这个元素是原来的那个"还是"新的"——key 稳定则复用组件实例与 state，key 变了就销毁重建。与 [Vue 的 :key](/posts/vue-core/03-template-syntax.md)、[ArkUI 的键生成器](/posts/arkts-dev/05-render-control.md)同一角色，三条规则全球统一：

1. **用数据里稳定的唯一 id**（数据库主键、slug）；
2. **永远不用 index 当 key**——中间插入/删除时 index 错位，输入框内容串位、动画错乱（复现一次终身免疫）；
3. **key 在同层数组内唯一即可**，不必全局唯一；key 不传给组件本体（`props.key` 读不到，React 自用）。

**用 key 强制重置组件**是 key 的进阶用法：给同一组件传不同 `key={userId}`，切换用户时内部 state 全部重置——比手写"清空逻辑"干净得多（第 2 章埋的"重置状态"正解）。

## 条件渲染：四种模式

JSX 里没有 v-if，条件渲染全靠 JS 表达式：

```jsx
{/* 1. && 短路：要么渲染要么没有 */}
{error && <p className="text-red-500">{error}</p>}

{/* 2. 三元：二选一 */}
{loading ? <Spinner /> : <Content data={data} />}

{/* 3. 提前 return：整块分支时最可读 */}
function Profile({ user }) {
  if (!user) return <p>请先登录</p>
  return <div>{user.name}</div>       // 早早 return，主体不再嵌套
}

{/* 4. 存变量：复杂条件命名化 */}
const isVIP = user.level >= 3 && !user.banned
{isVIP && <VipBadge />}
```

模式选择：**单元素有/无 → `&&`**（且左值必须是布尔语境——`{items.length && <p>}` 会把 0 渲染出来！写 `{items.length > 0 && ...}`）；**两分支 → 三元**；**分支超过两个或整段 UI → 提前 return / 抽组件**。

## 切换组件 vs 切换内容

条件渲染可以是"换个组件"：

```jsx
{mode === 'edit' ? <EditForm post={post} /> : <PostView post={post} />}
```

**位置相同的不同组件切换 = 完整卸载重建**（内部 state 清零）。要保留 state 的切换用 CSS 显隐（[Tailwind 的 hidden](/posts/tailwind-css/02-core-utilities.md)），要重置 state 的切换反而**利用**这个语义（配合 key）。

## 嵌套数据的渲染

```jsx
{sections.map((section) => (
  <section key={section.id}>
    <h2>{section.title}</h2>
    {section.posts.map((p) => (
      <Article key={p.id} post={p} />     {/* 每层 map 各有各的 key 作用域 */}
    ))}
  </section>
))}
```

每层 map 的直接子元素需要 key；渲染扁平化数据更佳——嵌套 map 超过两层通常是数据形状该调整的信号。

## 踩坑提示

- `&&` 左侧是数字/字符串：`0`/`''` 会被渲染成字面文本——永远转成布尔（`> 0`、`Boolean(x)`）。
- key 用 `Math.random()`：每次渲染身份全变 = 全量重建，比 index 更糟。
- map 返回的 JSX 里忘写 return（箭头函数带了花括号没 return）——列表静默消失，先查 return。

## 练习

1. 给列表加输入框，用 index 当 key 后在头部插入一项，观察内容错位，换 id 修复。
2. 用"key 强制重置"实现：切换选中用户时表单自动清空。
3. 找一个 `&&` 左侧可能是 0 的写法，复现"0 被渲染"，再修复。
