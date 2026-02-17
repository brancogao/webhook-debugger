# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-18

### Added
- **Webhook Signature Verification** - Verify webhook authenticity for popular services
  - Stripe: HMAC-SHA256 with timestamp verification (`Stripe-Signature` header)
  - GitHub: HMAC-SHA256 with `sha256=` prefix (`X-Hub-Signature-256` header)
  - Slack: HMAC-SHA256 with `v0=` prefix (`X-Slack-Signature` header)
  - Shopify: HMAC-SHA256 Base64 encoded (`X-Shopify-Hmac-SHA256` header)
  - Generic: HMAC-SHA256 (`X-Hub-Signature` / `X-Webhook-Signature` header)
- **Endpoint Configuration UI** - Manage verification secrets per endpoint
- **Verification Status Display** - See verification status on webhook cards and detail pages
- Database migration for endpoint configuration storage

### Security
- All signature verification happens server-side
- Secrets are stored securely in Cloudflare D1 database

## [1.0.0] - 2026-02-17

### Added
- Initial release of Webhook Debugger
- Real-time webhook receiving and inspection
- 90-day webhook history storage
- Multiple endpoint support (create unique endpoints on demand)
- Pretty JSON formatting with syntax highlighting
- Request details display (headers, body, query params)
- SEO-optimized technical documentation for:
  - Stripe webhooks
  - GitHub webhooks
  - Shopify webhooks
  - Slack webhooks
  - Twilio webhooks
  - SendGrid webhooks
  - Intercom webhooks
  - Telegram bot webhooks
  - Discord webhooks
  - Webhook security best practices
- Cloudflare Workers deployment
- Cloudflare D1 database for persistent storage

[1.1.0]: https://github.com/brancogao/webhook-debugger/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/brancogao/webhook-debugger/releases/tag/v1.0.0
