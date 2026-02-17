# Webhook Debugger - Frontend Implementation Notes

## 实现总结

已完成前端 UI 的实现，采用 **Vanilla JavaScript + Vite** 构建，遵循 DHH 原则：简单、直接、快速迭代。

## 技术选型

### 为什么选择 Vanilla JavaScript？

1. **简单直接** - 不需要学习 React/Vue 框架，代码清晰易懂
2. **快速开发** - 没有构建配置的复杂性，立即开始写代码
3. **小体积** - 打包后仅 24KB（gzip 后 6.5KB），加载极快
4. **易维护** - 没有 React 生命周期、状态管理等复杂概念

### 为什么不用 React/Tailwind？

- **React 是过度工程** - 对于这个项目，React 带来的复杂性超过了收益
- **Tailwind 是运行时依赖** - 内联 CSS 更简单，没有额外请求
- **"简单优先"原则** - 能一个人快速构建的，不要拆分

## 代码结构

```
frontend/
├── app.js          # 主应用 + 路由器（~600 行）
├── api.js          # API 客户端（~80 行）
├── utils.js        # 工具函数（~200 行）
├── style.css       # 所有样式（~150 行）
├── index.html      # 入口文件
├── vite.config.js  # Vite 配置
└── package.json
```

### 职责分离

- **app.js**: 页面渲染、路由管理、事件处理
- **api.js**: API 调用封装、错误处理
- **utils.js**: 时间格式化、剪贴板、JSON 高亮等工具函数
- **style.css**: 所有样式（无 Tailwind，无 CSS-in-JS）

## 关键功能实现

### 1. SPA 路由

```javascript
// 简单的路由器
function router() {
  const path = window.location.pathname;
  // 检查认证
  checkAuth().then(user => {
    if (!user && path !== '/') {
      window.location.href = '/';
      return;
    }
    // 根据路径渲染页面
  });
}

// 拦截链接点击，实现 SPA 导航
document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (link && link.href.startsWith(window.location.origin) && !link.getAttribute('href').startsWith('/api/')) {
    e.preventDefault();
    window.history.pushState({}, '', new URL(link.href).pathname);
    router();
  }
});
```

### 2. API 客户端

```javascript
async function api(url, options = {}) {
  const config = {
    ...options,
    credentials: 'include',  // 携带 cookies
    headers: { 'Content-Type': 'application/json', ...options.headers },
  };

  const response = await fetch(`${API_BASE}${url}`, config);

  // 401 自动跳转
  if (response.status === 401) {
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return response.json();
}
```

### 3. Webhook 搜索（防抖）

```javascript
const debouncedSearch = debounce(async (query) => {
  if (!query.trim()) {
    const data = await webhooksApi.list(endpoint.id);
    renderWebhooksList(data.webhooks);
    return;
  }
  const data = await webhooksApi.search(endpoint.id, query);
  renderWebhooksList(data.webhooks);
}, 300);  // 300ms 防抖

searchInput.addEventListener('input', e => {
  debouncedSearch(e.target.value);
});
```

### 4. 状态管理

**没有框架的状态管理** - 直接操作 DOM：

```javascript
// 更新特定元素
const container = document.getElementById('webhooks-list');
container.innerHTML = webhooks.map(renderWebhookCard).join('');
```

这是有意的：清晰、可预测、没有隐藏的响应式魔法。

## 设计系统

### 颜色

- **主色**: Indigo (`#6366f1`, `#4f46e5`) - 技术感、专业
- **背景**: Slate-50 (`#f8fafc`) - 有温度的灰色
- **卡片**: 白色 + `border-gray-200` - 干净
- **文字**: Gray-800（主）、Gray-500（副）

### 字体

- **UI**: Inter 400/500/600/700
- **代码**: JetBrains Mono 400/500

### 组件

- **卡片**: 白色 bg，rounded-lg，border，hover:shadow-md
- **按钮**: Indigo-600 bg，white text，rounded-lg
- **输入框**: border-gray-300，focus:ring-indigo-500
- **模态框**: 固定 backdrop（rgba 0.5），居中内容
- **Toast**: 固定右下角，slide-in 动画

## 性能

- **包大小**: 24KB（gzip 后 6.5KB）
- **无运行时**: Vanilla JS，无框架开销
- **快速加载**: 单个 CSS 文件，最小 HTTP 请求
- **按需加载**: 基于路由（当前未实现，预留）

## 部署

前端与后端一起部署（单一 Workers 项目）：

1. `npm run build` - 构建前端到 `public/`
2. `wrangler deploy` - 部署 Workers + 静态文件

`wrangler.jsonc` 配置了 `assets.directory: "./public"`，Workers 自动服务静态文件。

## 开发

### 安装
```bash
cd frontend
npm install
```

### 开发服务器（热重载）
```bash
npm run dev
```
启动 Vite 开发服务器（端口 3000）并代理 API 到后端。

### 生产构建
```bash
npm run build
```
输出到 `../public/`（与 Workers 一起部署）。

## 未来改进（仅在需要时）

- [ ] Webhook 列表分页（滚动加载）
- [ ] 按来源过滤（GitHub/Stripe/Slack）
- [ ] 暗色模式切换
- [ ] 键盘快捷键（j/k 导航 webhooks）
- [ ] 导出 webhook 为 JSON 文件

## DHH 原则应用

1. **简单优于聪明** - Vanilla JS，无框架魔法
2. **先发布** - MVP ~600 行代码
3. **约定优于配置** - 无自定义构建管道
4. **删除代码** - 无未使用的依赖，最小化 CSS
5. **清晰代码** - 函数做一件事，名称描述性强

## 文件说明

### /Users/branco/auto-company/projects/webhook-debugger/frontend/app.js
主应用文件，包含：
- SPA 路由器
- 页面渲染函数（Home, Dashboard, EndpointDetail, Settings）
- 事件处理（创建/删除 endpoint，重放 webhook）
- 模态框逻辑

### /Users/branco/auto-company/projects/webhook-debugger/frontend/api.js
API 客户端，包含：
- `authApi`: getCurrentUser, logout
- `endpointsApi`: list, create, get, update, delete
- `webhooksApi`: list, get, search, replay

### /Users/branco/auto-company/projects/webhook-debugger/frontend/utils.js
工具函数，包含：
- `formatRelativeTime`: "2 minutes ago"
- `formatDate`: 完整日期格式
- `copyToClipboard`: 复制到剪贴板 + toast
- `showToast`: 显示通知
- `debounce`: 防抖函数
- `getSourceIcon`: 返回来源图标 SVG
- `generateCurlCommand`: 生成 cURL 命令
- `formatJSON`: JSON 语法高亮
- `parseQueryString`: 解析 URL 参数

### /Users/branco/auto-company/projects/webhook-debugger/frontend/style.css
所有样式：
- 基础样式（字体、颜色）
- 代码块样式
- Loading spinner
- Toast 通知
- Modal backdrop
- Source 图标
- 响应式工具

## 测试

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:8787

# 测试流程：
# 1. 首页 -> 点击 "Login with GitHub"
# 2. GitHub OAuth 授权 -> 重定向到 /dashboard
# 3. 创建 endpoint
# 4. 复制 webhook URL
# 5. 发送测试 webhook（curl 或 Postman）
# 6. 查看 webhook 列表
# 7. 点击 webhook 查看详情
# 8. 重放 webhook
# 9. 搜索 webhooks
```

## 注意事项

1. **前端和后端是同一个 Workers 项目**
   - 静态文件在 `public/` 目录
   - Workers 自动服务静态文件

2. **开发时代理**
   - Vite 开发服务器在 3000 端口
   - 代理 `/api/*` 和 `/hook/*` 到 `localhost:8787`

3. **Cookie 认证**
   - `credentials: 'include'` 自动携带 cookie
   - 401 自动重定向到 `/`

4. **SPA 路由**
   - `window.history.pushState` 改变 URL
   - `popstate` 事件处理浏览器后退按钮
   - 点击链接拦截实现 SPA 导航

## 完成状态

✅ 首页/登录页
✅ Dashboard（Endpoint 列表）
✅ Endpoint 详情页
✅ Webhook 列表（带搜索）
✅ Webhook 详情（模态框）
✅ 重放 webhook
✅ 复制 URL/cURL
✅ 设置页
✅ 响应式设计
✅ Toast 通知
✅ Loading 状态

## 结论

前端实现遵循 DHH 原则：
- **简单**: Vanilla JS，无框架
- **直接**: 直接操作 DOM，无隐藏抽象
- **快速**: ~1000 行代码，2 天完成
- **清晰**: 每个函数职责单一，代码易读
