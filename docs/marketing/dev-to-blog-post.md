---
title: "Building a Self-Hosted Webhook Debugger on Cloudflare Workers + D1"
published: true
description: "How I built a self-hosted webhook inspector using Cloudflare Workers, D1 database, and TypeScript"
tags: ["cloudflare", "webhooks", "typescript", "d1", "serverless"]
cover_image: https://webhook-debugger.autocompany.workers.dev/images/cover.png
canonical_url: https://webhook-debugger.autocompany.workers.dev/blog
---

# Building a Self-Hosted Webhook Debugger on Cloudflare Workers + D1

As developers, we've all been there: you're debugging a webhook from Stripe, GitHub, or some third-party service, and you need to see exactly what's being sent. You try webhook.site or RequestBin, but there's a nagging thought: *what if this data is sensitive?*

I built [Webhook Debugger](https://github.com/brancogao/webhook-debugger) to solve this problem by giving you full control over your webhook data. It's a self-hosted webhook inspector built entirely on Cloudflare Workers + D1.

## The Problem

Existing webhook debugging tools fall into two categories:

1. **SaaS services** (webhook.site, RequestBin, etc.) - convenient but they hold your data
2. **Local tools** - great for testing but can't receive real webhooks from external services

I wanted something that:
- Could receive webhooks from anywhere on the internet
- Kept my data on my own infrastructure
- Had meaningful retention (not 24-48 hours)
- Was simple to deploy and manage

## Why Cloudflare?

I chose Cloudflare Workers + D1 for several reasons:

### Edge Performance
Cloudflare Workers run at the edge, meaning your webhooks are received as close to the sender as possible. This results in fast, reliable webhook reception.

### Generous Free Tier
Cloudflare's free tier is incredibly generous for this use case:
- Workers: 100,000 requests/day free
- D1: 5GB storage, 5M reads/day, 100K writes/day free

This is more than enough for most webhook debugging scenarios.

### Simple Deployment
Deploy to Cloudflare in 5 minutes with `npm run deploy`. No AWS/GCP complexity.

### SQLite Familiarity
D1 is SQLite-based, so you get full SQL support without learning a new query language.

## Architecture Overview

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

## Database Schema

I kept the schema simple and focused:

### Users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  github_id INTEGER UNIQUE,
  github_login TEXT,
  email TEXT,
  avatar_url TEXT,
  plan TEXT,
  created_at DATETIME,
  updated_at DATETIME
);
```

### Endpoints
```sql
CREATE TABLE endpoints (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  path TEXT UNIQUE,
  is_active BOOLEAN,
  created_at DATETIME
);
```

### Webhooks
```sql
CREATE TABLE webhooks (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT,
  method TEXT,
  source TEXT,
  headers TEXT,
  body TEXT,
  query_params TEXT,
  content_type TEXT,
  replay_count INTEGER,
  received_at DATETIME
);
```

## Full-Text Search with FTS5

One of the most useful features is full-text search across all webhook payloads. I implemented this using SQLite's FTS5 extension:

```sql
CREATE VIRTUAL TABLE webhooks_fts USING fts5(
  webhook_id,
  body,
  headers,
  query_params,
  content=webhooks,
  content_rowid=rowid
);
```

This lets users search for specific content across thousands of webhooks in milliseconds.

## Authentication Flow

I chose GitHub OAuth for authentication because:
1. No password management
2. Familiar authentication flow for developers
3. Easy to implement with Workers

The flow is straightforward:

1. User clicks "Login with GitHub"
2. Worker redirects to GitHub OAuth page
3. User authorizes the app
4. GitHub redirects back with a code
5. Worker exchanges code for access token
6. Worker fetches user profile
7. Worker creates session token (HMAC-signed)
8. Worker sets secure cookie with session token

## Webhook Reception

The core webhook receiver is a simple Worker that:

1. Receives the webhook at `/hook/{path}`
2. Looks up the endpoint by path
3. Auto-detects the source (Stripe, GitHub, etc.) based on headers
4. Stores the webhook in D1
5. Returns 200 OK

```typescript
export async function handleWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace('/hook/', '');

  const endpoint = await getEndpointByPath(env.DB, path);
  if (!endpoint) {
    return new Response('Endpoint not found', { status: 404 });
  }

  const webhook = await createWebhook(env.DB, {
    endpoint_id: endpoint.id,
    method: request.method,
    headers: JSON.stringify(Object.fromEntries(request.headers)),
    body: await request.text(),
    // ... other fields
  });

  return new Response('OK');
}
```

## Frontend: Keep It Simple

I considered using React, Vue, or another framework, but decided to stick with vanilla JavaScript. Why?

1. **Small bundle size**: The entire frontend is ~24KB (6KB gzipped)
2. **Fast load time**: No framework overhead
3. **Simple deployment**: Just a static file served by Workers
4. **Easy to understand**: Less code to maintain

The frontend is a simple SPA with client-side routing:
- `/` - Login page
- `/dashboard` - List of endpoints
- `/endpoint/:id` - Webhook list for an endpoint
- `/webhook/:id` - Webhook details

## One-Click Replay

Another key feature is the ability to replay webhooks to any URL. This is incredibly useful for:
- Testing local endpoints with production webhooks
- Verifying fixes for webhook issues
- Developing integrations

The replay endpoint takes a webhook ID and a target URL, then forwards the original webhook payload with the original headers.

## Deployment in 5 Minutes

The deployment process is intentionally simple:

1. Clone the repository
2. Install dependencies
3. Login to Cloudflare
4. Create a D1 database
5. Configure GitHub OAuth
6. Deploy

```bash
git clone https://github.com/brancogao/webhook-debugger.git
cd webhook-debugger && npm install
npx wrangler login
npx wrangler d1 create webhook-debugger-db
# Configure wrangler.jsonc and secrets
npm run deploy
```

## What's Next?

I have several features planned for v1.1:

1. **Signature Verification**: Verify Stripe/GitHub signatures for added security
2. **Webhook Filtering**: Filter by status code, source, or custom tags
3. **Export Options**: Export webhooks as CSV or JSON
4. **Team Collaboration**: Share endpoints with team members

## Try It Out

Live demo: https://webhook-debugger.autocompany.workers.dev

GitHub repository: https://github.com/brancogao/webhook-debugger

The software is open-source (MIT) and free to self-host on your own Cloudflare account.

---

What's your webhook debugging workflow? I'd love to hear how you solve this problem. Drop a comment or open an issue on GitHub!
