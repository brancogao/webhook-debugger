# Quick Start Guide - Webhook Debugger

## 本地快速启动（3 分钟）

### 1. 安装依赖
```bash
npm install
```

### 2. 配置 GitHub OAuth
```bash
# 复制环境变量模板
cp .dev.vars.example .dev.vars

# 编辑 .dev.vars 文件，填入以下内容：
# GITHUB_CLIENT_ID=your_github_client_id
# GITHUB_CLIENT_SECRET=your_github_client_secret
# COOKIE_SECRET=random_secret_string
```

**获取 GitHub OAuth 凭据：**
1. 访问 https://github.com/settings/developers
2. 点击 "New OAuth App"
3. 填写：
   - Application name: `Webhook Debugger (local)`
   - Homepage URL: `http://localhost:8787`
   - Authorization callback URL: `http://localhost:8787/api/auth/callback`
4. 复制 Client ID 和 Client Secret 到 `.dev.vars`

**生成 COOKIE_SECRET：**
```bash
openssl rand -base64 32
```

### 3. 初始化数据库（首次）
```bash
wrangler d1 execute webhook-debugger-db --file=./schema.sql --local
```

### 4. 构建前端
```bash
npm run build
```

### 5. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:8787

---

## 测试 Webhook 接收

### 创建 Endpoint

1. 登录后点击 "+ New Endpoint"
2. 输入名称（如 "Test Endpoint"）
3. 复制显示的 webhook URL

### 发送测试 Webhook

```bash
# 使用 curl
curl -X POST http://localhost:8787/hook/YOUR_ENDPOINT_PATH \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, Webhook Debugger!"}'

# 使用 HTTPie
http POST http://localhost:8787/hook/YOUR_ENDPOINT_PATH \
  message="Hello, Webhook Debugger!"
```

刷新 Dashboard，你应该能看到收到的 webhook。

---

## 常见问题

### Q: 登录后立即跳回首页？
**A:** Cookie 可能没有正确设置。检查：
1. `.dev.vars` 文件是否正确配置
2. COOKIE_SECRET 是否有效
3. 浏览器是否允许 localhost cookie

### Q: 创建 endpoint 后没有看到 webhook？
**A:** 确保：
1. 你使用的是正确的 webhook URL
2. URL 是 `POST /hook/...` 而不是 `POST /api/...`
3. 检查浏览器控制台是否有错误

### Q: 前端修改不生效？
**A:** 需要重新构建：
```bash
npm run build
# 然后重启开发服务器
npm run dev
```

---

## 部署到 Cloudflare

### 1. 创建生产数据库
```bash
wrangler d1 create webhook-debugger-db
```

复制返回的 `database_id`，更新 `wrangler.jsonc`：
```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "webhook-debugger-db",
    "database_id": "your_database_id_here"
  }
]
```

### 2. 运行数据库迁移
```bash
wrangler d1 execute webhook-debugger-db --file=./schema.sql --remote
```

### 3. 设置生产环境变量

更新 `wrangler.jsonc` 中的 `GITHUB_CLIENT_ID`。

设置 secrets：
```bash
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put COOKIE_SECRET
```

### 4. 构建并部署
```bash
npm run deploy
```

### 5. 更新 GitHub OAuth 回调 URL

在 GitHub OAuth App 设置中：
- 将 Authorization callback URL 改为：`https://your-worker-domain.workers.dev/api/auth/callback`

---

## API 测试

### 健康检查
```bash
curl http://localhost:8787/health
```

### 获取当前用户（需要登录）
```bash
curl http://localhost:8787/api/auth/me \
  --cookie "session=your_session_cookie"
```

### 创建 Endpoint（需要登录）
```bash
curl -X POST http://localhost:8787/api/endpoints \
  -H "Content-Type: application/json" \
  --cookie "session=your_session_cookie" \
  -d '{"name": "My Endpoint"}'
```

---

## 开发技巧

### 前端开发（热重载）
```bash
cd frontend
npm run dev
```
访问 http://localhost:3000（自动代理 API 到后端）

### 查看日志
```bash
npm run dev
# 输出会显示所有请求和错误
```

### 重置数据库
```bash
# 删除本地数据库
rm -rf .wrangler/state/v3/d1/miniflare-D1DatabaseObject

# 重新初始化
wrangler d1 execute webhook-debugger-db --file=./schema.sql --local
```

---

## 架构概览

```
┌─────────────────────────────────────┐
│         Cloudflare Workers          │
│                                     │
│   ┌─────────────────────────────┐  │
│   │  Static Files (frontend/)   │  │
│   │  • index.html              │  │
│   │  • assets/*.js             │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │  API Handlers              │  │
│   │  • Auth (GitHub OAuth)     │  │
│   │  • Endpoints CRUD          │  │
│   │  • Webhooks list/replay    │  │
│   │  • Search (FTS5)          │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │  Webhook Receiver          │  │
│   │  • POST /hook/{path}       │  │
│   │  • Auto-detect source      │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │  D1 Database (SQLite)       │  │
│   │  • users / endpoints        │  │
│   │  • webhooks + FTS5        │  │
│   └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 支持

- 文档：[docs/fullstack/frontend-implementation.md](./frontend-implementation.md)
- 问题：在 GitHub Issues 提交
- Auto Company: https://auto-company.com
