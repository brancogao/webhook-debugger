# Webhook Debugger Documentation

> Self-hosted webhook inspector for debugging Stripe, GitHub, Shopify, Slack, and any HTTP webhook integration.

## Quick Links

- **[Quick Start Guide](./fullstack/quick-start.md)** - Get running in 3 minutes
- **[Deployment Guide](../DEPLOY.md)** - Production deployment
- **[API Reference](#api-reference)** - Endpoint documentation

---

## Guides by Platform

### Payment & Commerce

- **[How to Debug Stripe Webhooks](./guides/stripe-webhooks.md)** - Test Stripe payment webhooks locally and in production
- **[Shopify Webhook Debugging Guide](./guides/shopify-webhooks.md)** - Debug Shopify store events and orders

### Developer Tools

- **[How to Test GitHub Webhooks Locally](./guides/github-webhooks.md)** - Debug GitHub App and repository webhooks
- **[Slack Event Debugging Guide](./guides/slack-events.md)** - Test Slack events, commands, and interactions

---

## Why Self-Hosted?

| Concern | Webhook.site | Webhook Debugger |
|---------|--------------|------------------|
| Data privacy | Third-party server | Your own database |
| History | 7 days (paid) | 90 days |
| Search | None | Full-text FTS5 |
| Cost | $9-49/mo | ~$5/mo (Cloudflare) |
| Deployment | SaaS only | Self-hosted |

---

## Features

### Core Features

- **Unique Webhook URLs** - Generate unique endpoints instantly
- **90-Day History** - Pro users retain webhooks for 90 days (free: 7 days)
- **One-Click Replay** - Replay webhooks to any target URL
- **Full-Text Search** - Search across all webhook payloads
- **Auto Source Detection** - Automatically identifies Stripe, GitHub, Shopify, Slack, etc.
- **GitHub OAuth** - Secure authentication without passwords

### Supported Platforms

Webhook Debugger auto-detects webhooks from:

- **Stripe** - Payment webhooks
- **GitHub** - Repository and organization events
- **Shopify** - Store events and orders
- **Slack** - Events, commands, interactions
- **Twilio** - SMS and voice callbacks
- **SendGrid** - Email events
- **Mailgun** - Email webhooks
- **Any custom webhook** - Generic HTTP POST/GET

---

## Tech Stack

- **Runtime**: Cloudflare Workers (Edge)
- **Database**: Cloudflare D1 (SQLite)
- **Language**: TypeScript
- **Authentication**: GitHub OAuth + HMAC-signed session tokens
- **Search**: SQLite FTS5 full-text search

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/github` | GET | Start GitHub OAuth flow |
| `/api/auth/callback` | GET | OAuth callback |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Get current user |

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/endpoints` | GET | List user's endpoints |
| `/api/endpoints` | POST | Create new endpoint |
| `/api/endpoints/:id` | GET | Get endpoint details |
| `/api/endpoints/:id` | PUT | Update endpoint |
| `/api/endpoints/:id` | DELETE | Delete endpoint |

### Webhooks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/hook/:path` | GET/POST | Receive webhooks (public) |
| `/api/endpoints/:id/webhooks` | GET | List webhooks |
| `/api/endpoints/:id/webhooks/search` | GET | Search webhooks |
| `/api/webhooks/:id` | GET | Get webhook details |
| `/api/webhooks/:id/replay` | POST | Replay webhook |

---

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

---

## Support

- **Issues**: https://github.com/brancogao/webhook-debugger/issues
- **Discussions**: https://github.com/brancogao/webhook-debugger/discussions

---

## License

MIT

---

Built with ❤️ by [Auto Company](https://auto-company.com)
