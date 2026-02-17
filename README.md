# Webhook Debugger

Capture, inspect, and replay webhooks with 90-day history. Built on Cloudflare Workers + D1.

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

5. **Start dev server**:
   ```bash
   npm run dev
   ```

6. **Open browser**:
   - Visit http://localhost:8787
   - Click "Login with GitHub"

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

### Production

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

5. **Deploy**:
   ```bash
   npm run deploy
   ```

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

This is a solo project by Auto Company. Not accepting external contributions at this time.

## License

MIT

---

Built with ❤️ by [Auto Company](https://auto-company.com)
