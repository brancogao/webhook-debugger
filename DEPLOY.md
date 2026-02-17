# Webhook Debugger 部署指南

## 前置条件

1. Cloudflare 账号（免费即可）
2. GitHub 账号（用于 OAuth 登录）

## 步骤 1: 登录 Cloudflare

```bash
cd projects/webhook-debugger
wrangler login
```

浏览器会打开 Cloudflare 授权页面，点击 Allow 完成授权。

## 步骤 2: 创建 D1 数据库

```bash
wrangler d1 create webhook-debugger-db
```

输出会包含 `database_id`，复制它。

## 步骤 3: 更新 wrangler.jsonc

将 `wrangler.jsonc` 中的 `database_id` 替换为步骤 2 获取的值：

```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "webhook-debugger-db",
    "database_id": "你的数据库ID"
  }
]
```

## 步骤 4: 初始化数据库 Schema

```bash
wrangler d1 execute webhook-debugger-db --file=./schema.sql
```

## 步骤 5: 创建 GitHub OAuth App

1. 访问 https://github.com/settings/developers
2. 点击 "New OAuth App"
3. 填写信息：
   - Application name: Webhook Debugger
   - Homepage URL: https://webhook-debugger.你的用户名.workers.dev
   - Authorization callback URL: https://webhook-debugger.你的用户名.workers.dev/api/auth/callback
4. 创建后复制 Client ID

## 步骤 6: 配置环境变量

更新 `wrangler.jsonc` 中的 `GITHUB_CLIENT_ID`：

```json
"vars": {
  "GITHUB_CLIENT_ID": "你的GitHub Client ID"
}
```

设置 secrets（敏感信息）：

```bash
# GitHub OAuth Secret
echo "你的GitHub Client Secret" | wrangler secret put GITHUB_CLIENT_SECRET

# Cookie 签名密钥（随机生成）
openssl rand -base64 32 | wrangler secret put COOKIE_SECRET
```

## 步骤 7: 部署

```bash
wrangler deploy
```

部署成功后会显示 Worker URL，例如 `https://webhook-debugger.你的用户名.workers.dev`

## 步骤 8: 更新 GitHub OAuth 回调 URL

如果部署后的 URL 与步骤 5 不同，更新 GitHub OAuth App 的回调 URL。

## 步骤 9: 测试

```bash
# 测试健康检查
curl https://你的域名/health

# 访问首页
open https://你的域名/

# 点击 "Login with GitHub" 测试登录
```

## 本地开发

```bash
# 启动本地开发服务器
npm run dev

# 在另一个终端运行本地 D1
# (首次需要)
wrangler d1 execute webhook-debugger-db --local --file=./schema.sql
```

## 项目结构

```
webhook-debugger/
├── src/
│   ├── index.ts        # 主入口，路由处理
│   ├── auth/           # GitHub OAuth 认证
│   ├── api/            # API 处理器
│   │   ├── webhook.ts  # Webhook 接收
│   │   └── dashboard.ts # Dashboard API
│   ├── db/             # 数据库操作
│   └── utils/          # 工具函数
├── schema.sql          # 数据库 Schema
├── wrangler.jsonc      # Cloudflare 配置
└── package.json
```

## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/auth/github | GitHub OAuth 登录 |
| GET | /api/auth/callback | OAuth 回调 |
| GET | /api/auth/me | 获取当前用户 |
| POST | /api/auth/logout | 登出 |
| GET/POST | /api/endpoints | 列出/创建端点 |
| GET/PUT/DELETE | /api/endpoints/:id | 端点 CRUD |
| GET | /api/endpoints/:id/webhooks | 列出 webhooks |
| GET | /api/endpoints/:id/webhooks/search | 搜索 webhooks |
| GET | /api/webhooks/:id | 获取 webhook 详情 |
| POST | /api/webhooks/:id/replay | 重放 webhook |
| ANY | /hook/:path | 接收 webhook |

## 成本估算

- **Free Plan**: 完全够用 MVP
  - 100K 请求/天
  - 10M 请求/月
- **Paid Plan ($5/月)**:
  - 无限请求
  - 50M D1 rows written/月
  - 25B D1 rows read/月

预期成本：
- 100 用户: $5/月
- 1000 用户: $5/月
- 10000 用户: ~$25/月
