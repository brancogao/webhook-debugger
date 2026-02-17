# Webhook Debugger - Self-Hosted Webhook Inspector for Stripe, GitHub, Shopify & More

> **Debug Stripe webhooks, GitHub hooks, Slack events, Shopify callbacks, and any HTTP webhook integration.** Self-host on Cloudflare Workers with 90-day history and full-text search.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/brancogao/webhook-debugger?style=social)](https://github.com/brancogao/webhook-debugger/stargazers)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![D1 Database](https://img.shields.io/badge/D1-SQLite-4479A1?logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)

**The webhook inspector that keeps your data in your own hands.**

Capture, inspect, and replay webhooks with 90-day history. Self-host on Cloudflare Workers + D1 in 5 minutes.

**[🚀 Quick Deploy](#deployment)** • **[📖 Full Docs](./DEPLOY.md)** • **[🌐 Live Demo](https://webhook-debugger.autocompany.workers.dev)**

## Quick Demo

```bash
# 1. Clone and install
git clone https://github.com/brancogao/webhook-debugger.git
cd webhook-debugger && npm install

# 2. Set up Cloudflare (free tier works)
npx wrangler login
npx wrangler d1 create webhook-debugger-db

# 3. Deploy
npm run deploy

# Done! Your webhook debugger is live.
```

## Why Webhook Debugger?

- **Debug webhooks locally and in production** - See exactly what's being sent
- **90-day history** - Never lose a webhook again (free: 7 days)
- **One-click replay** - Forward webhooks to any URL
- **Full-text search** - Find webhooks by content instantly
- **Auto source detection** - Automatically identifies Stripe, GitHub, Shopify, Slack, etc.
- **Self-hostable** - Deploy to your own Cloudflare account in 5 minutes

## Comparison

| Feature | Webhook Debugger | Webhook.site | RequestBin | Ngrok |
|---------|------------------|--------------|------------|-------|
| **Self-hostable** | ✅ Yes | ❌ No | ❌ Deprecated | ⚠️ Tunnel only |
| **Data privacy** | ✅ Your DB | ❌ Their server | ❌ Public | ⚠️ Local only |
| **History retention** | 90 days | 7 days (paid) | 48 hours | Session only |
| **Full-text search** | ✅ FTS5 | ❌ No | ❌ No | ❌ No |
| **One-click replay** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Edge deployment** | ✅ Global | ❌ Single region | ❌ No | ❌ No |
| **Free tier** | ✅ 1 endpoint | ✅ 1 endpoint | ❌ Gone | ✅ Limited |
| **Cost at scale** | ~$5/mo | $9-49/mo | - | $8-200/mo |

## Features

- **Unique Webhook URLs** - Generate unique endpoints instantly
- **90-Day History** - Pro users retain webhooks for 90 days (free: 7 days)
- **One-Click Replay** - Replay webhooks to any target URL
- **Full-Text Search** - Search across all webhook payloads
- **Auto Source Detection** - Automatically identifies Stripe, GitHub, Shopify, Slack, etc.
- **GitHub OAuth** - No passwords required

## Tech Stack

- **Runtime**: Cloudflare Workers (Edge)
- **Database**: Cloudflare D1 (SQLite)
- **Language**: TypeScript
- **Authentication**: GitHub OAuth + HMAC-signed session tokens
- **Search**: SQLite FTS5 full-text search

## Getting Started

**[📖 Quick Start Guide (3 minutes)](./docs/fullstack/quick-start.md)**

### Prerequisites

- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)

### Local Development

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Create GitHub OAuth App**:
   - Go to https://github.com/settings/developers
   - Create a new OAuth App
   - Set Authorization callback URL to: `http://localhost:8787/api/auth/callback`
   - Copy Client ID and Client Secret

3. **Configure environment variables**:
   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars and fill in:
   # - GITHUB_CLIENT_ID
   # - GITHUB_CLIENT_SECRET
   # - COOKIE_SECRET (generate with: openssl rand -base64 32)
   ```

4. **Initialize database** (first time only):
   ```bash
   wrangler d1 execute webhook-debugger-db --file=./schema.sql --local
   ```

5. **Build frontend**:
   ```bash
   npm run build
   ```

6. **Start dev server**:
   ```bash
   npm run dev
   ```

7. **Open browser**:
   - Visit http://localhost:8787
   - Click "Login with GitHub"

### Frontend Development

To work on the frontend separately:

```bash
cd frontend
npm install
npm run dev
```

This will start a Vite dev server on port 3000 with hot reload and proxy to the backend.

## API Endpoints

### Authentication

- `GET /api/auth/github` - Start GitHub OAuth flow
- `GET /api/auth/callback` - OAuth callback
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Endpoints

- `GET /api/endpoints` - List user's endpoints
- `POST /api/endpoints` - Create new endpoint
- `GET /api/endpoints/:id` - Get endpoint details
- `PUT /api/endpoints/:id` - Update endpoint
- `DELETE /api/endpoints/:id` - Delete endpoint

### Webhooks

- `GET/POST /hook/:path` - Receive webhooks (public endpoint)
- `GET /api/endpoints/:id/webhooks` - List webhooks for endpoint
- `GET /api/endpoints/:id/webhooks/search?q=term` - Search webhooks
- `GET /api/webhooks/:id` - Get webhook details
- `POST /api/webhooks/:id/replay` - Replay webhook

## Deployment

### Quick Deploy (5 minutes)

Deploy your own instance to Cloudflare. You'll need:
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up)
- A [GitHub account](https://github.com) for OAuth

**Step-by-step:**

1. **Fork this repository**

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/webhook-debugger.git
   cd webhook-debugger
   npm install
   ```

3. **Login to Cloudflare:**
   ```bash
   npx wrangler login
   ```

4. **Create D1 database:**
   ```bash
   npx wrangler d1 create webhook-debugger-db
   ```
   Copy the `database_id` from the output.

5. **Update `wrangler.jsonc`:**
   - Replace `database_id` with your database ID
   - Change `name` to something unique (e.g., `webhook-debugger-YOUR_USERNAME`)

6. **Initialize database:**
   ```bash
   npx wrangler d1 execute webhook-debugger-db --file=./schema.sql --remote
   ```

7. **Create GitHub OAuth App:**
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Set Homepage URL to: `https://webhook-debugger-YOUR_USERNAME.workers.dev`
   - Set Callback URL to: `https://webhook-debugger-YOUR_USERNAME.workers.dev/api/auth/callback`
   - Copy Client ID and Client Secret

8. **Configure environment:**
   ```bash
   # Set the Client ID in wrangler.jsonc under vars.GITHUB_CLIENT_ID

   # Set secrets:
   echo "YOUR_GITHUB_CLIENT_SECRET" | npx wrangler secret put GITHUB_CLIENT_SECRET
   openssl rand -base64 32 | npx wrangler secret put COOKIE_SECRET
   ```

9. **Build and deploy:**
   ```bash
   npm run build
   npm run deploy
   ```

10. **Done!** Visit `https://webhook-debugger-YOUR_USERNAME.workers.dev`

For detailed instructions, see [DEPLOY.md](./DEPLOY.md).

### Production Checklist

1. **Create remote D1 database**:
   ```bash
   wrangler d1 create webhook-debugger-db
   # Update wrangler.jsonc with the database_id
   ```

2. **Run migrations**:
   ```bash
   wrangler d1 execute webhook-debugger-db --file=./schema.sql --remote
   ```

3. **Set secrets**:
   ```bash
   wrangler secret put GITHUB_CLIENT_SECRET
   wrangler secret put COOKIE_SECRET
   ```

4. **Update wrangler.jsonc**:
   - Set `GITHUB_CLIENT_ID` in `vars`
   - Update `database_id` from step 1

5. **Build and deploy**:
   ```bash
   npm run deploy
   ```
   This will build the frontend and deploy everything to Cloudflare Workers.

## Plan Limits

| Plan | Endpoints | Webhook History | Price |
|-------|-----------|-----------------|-------|
| Free  | 1         | 7 days          | $0    |
| Pro   | 10        | 90 days         | $9/mo |
| Team  | 50        | 90 days         | $29/mo |

## Database Schema

### users
- `id` (TEXT, PRIMARY KEY) - CUID2
- `github_id` (INTEGER, UNIQUE) - GitHub OAuth ID
- `github_login` (TEXT) - GitHub username
- `email` (TEXT) - Optional email
- `avatar_url` (TEXT) - Profile avatar
- `plan` (TEXT) - free | pro | team
- `created_at`, `updated_at` (DATETIME)

### endpoints
- `id` (TEXT, PRIMARY KEY) - CUID2
- `user_id` (TEXT, FK) - Reference to users
- `name` (TEXT) - User-defined name
- `path` (TEXT, UNIQUE) - `/hook/{uuid}`
- `is_active` (BOOLEAN)
- `created_at` (DATETIME)

### webhooks
- `id` (TEXT, PRIMARY KEY) - CUID2
- `endpoint_id` (TEXT, FK) - Reference to endpoints
- `method` (TEXT) - HTTP method
- `source` (TEXT) - auto-detected: stripe, github, etc.
- `source_verified` (BOOLEAN) - signature verification
- `headers` (TEXT) - JSON string of headers
- `body` (TEXT) - raw body (max 1MB)
- `query_params` (TEXT) - JSON string of query params
- `content_type` (TEXT) - Content-Type header
- `replay_count` (INTEGER) - Number of replays
- `last_replay_at` (DATETIME)
- `last_replay_status` (INTEGER)
- `last_replay_response` (TEXT) - Last replay response (truncated)
- `received_at`, `created_at` (DATETIME)

## Testing

```bash
npm test
```

## Architecture

```
┌─────────────────────────────────────┐
│         Cloudflare Edge             │
│                                     │
│   Webhook Receiver (Workers)        │
│   • POST /hook/{path}              │
│   • Auto-detect source             │
│   • Store to D1                   │
│                                     │
│   Dashboard API (Workers)           │
│   • Auth (GitHub OAuth)            │
│   • Endpoints CRUD                 │
│   • Webhooks list/detail/replay    │
│   • Full-text search              │
│                                     │
│   D1 Database (SQLite)              │
│   • users / endpoints / webhooks    │
│   • FTS5 full-text search         │
│                                     │
└─────────────────────────────────────┘
```

## Contributing

Issues and feature requests welcome! Feel free to open an issue or submit a pull request.

## Support

- **Issues**: https://github.com/brancogao/webhook-debugger/issues
- **Discussions**: https://github.com/brancogao/webhook-debugger/discussions

## License

MIT

---

## Keywords & Related Projects

**Webhook Debugger** is designed for developers who need:

- **Stripe webhook debugging** - Test and inspect Stripe payment webhooks locally
- **GitHub webhook testing** - Debug GitHub App and OAuth App webhooks
- **Shopify webhook inspector** - Monitor Shopify store events and order webhooks
- **Slack event debugging** - Test Slack bot events and slash commands
- **Twilio webhook testing** - Debug SMS and voice call callbacks
- **Generic HTTP webhook inspection** - Capture any POST/GET webhook payload

**Alternatives compared:**
- [webhook.site](https://webhook.site) - Similar but not self-hostable, data on third-party servers
- [RequestBin](https://requestbin.com) - Deprecated, no longer maintained
- [ngrok](https://ngrok.com) - Tunnel tool, not a webhook inspector
- [Beeceptor](https://beeceptor.com) - Mock API, different use case

**Related searches:**
- self-hosted webhook inspector
- webhook debugger cloudflare workers
- stripe webhook testing tool
- github webhook debug
- webhook inspector open source
- webhook viewer self-hosted

---

Built with ❤️ by [Auto Company](https://auto-company.com)
