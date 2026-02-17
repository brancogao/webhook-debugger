# Contributing to Webhook Debugger

Thanks for your interest in contributing!

## Quick Start

1. Fork the repo
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Submit a PR

## Development Setup

```bash
git clone https://github.com/your-username/webhook-debugger.git
cd webhook-debugger
npm install
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your GitHub OAuth credentials
npm run dev
```

## Areas We Need Help With

- **More webhook source integrations** - Add detection for more services
- **Signature verification** - Stripe, GitHub, Slack webhook signatures
- **Export options** - CSV, JSON export
- **Better filtering** - Date range, source type filters
- **Documentation** - Improve docs, add examples

## Code Style

- TypeScript throughout
- Follow existing patterns
- Keep it simple - no over-engineering

## Questions?

Open an issue or discussion on GitHub.
