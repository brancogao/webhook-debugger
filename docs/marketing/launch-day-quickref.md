# Launch Day Quick Reference

## Timeline (Beijing Time)

### Pre-Launch (Now - 18:00)
- [x] GitHub repo public and complete
- [x] v1.0.0 release created
- [x] Live demo deployed and working
- [x] Documentation complete
- [ ] README polished
- [ ] Test demo site thoroughly

### Launch Night (01:00 - 07:00)
- [ ] **Submit to HN at 01:00** (human action required)
  - Title: `Show HN: Webhook Debugger – Self-host webhook inspector on Cloudflare Workers`
  - URL: https://github.com/brancogao/webhook-debugger
  - First comment: See `docs/marketing/hn-launch.md`
- [ ] Monitor HN thread every 5 minutes for first 2 hours
- [ ] Respond to every comment
- [ ] Be helpful and technical

### Day 1 (07:00 - 18:00)
- [ ] Submit to Reddit (after HN submission):
  - r/selfhosted (1-2 hours after HN)
  - r/cloudflare (same day)
  - r/webdev (same day or next)
  - r/typescript (same day or next)
- [ ] Run stats check: `./scripts/monitor-stats.sh`
- [ ] Create GitHub issues for feature requests from HN
- [ ] Update README with FAQ from HN

## Launch Day Checklist

### Before HN Submission (00:00 - 01:00)
```bash
# 1. Verify demo site is working
curl -I https://webhook-debugger.autocompany.workers.dev

# 2. Run stats check to establish baseline
cd /Users/branco/auto-company/projects/webhook-debugger
./scripts/monitor-stats.sh

# 3. Verify GitHub release is published
gh release view v1.0.0

# 4. Test the demo site manually
# - Visit https://webhook-debugger.autocompany.workers.dev
# - Click "Login with GitHub"
# - Create an endpoint
# - Send a test webhook
# - Search for the webhook
# - Replay the webhook

# 5. Check for any broken links
# - README links
# - Documentation links
# - External links
```

### During HN Launch (01:00 - 07:00)
```bash
# Monitor stats every 30 minutes
./scripts/monitor-stats.sh

# Watch for GitHub issues
gh issue list --repo brancogao/webhook-debugger --limit 10

# Watch for new stars
gh repo view brancogao/webhook-debugger --json stargazerCount -q '.stargazerCount'
```

### After HN Launch (07:00+)
```bash
# Submit to Reddit
# Copy content from docs/marketing/reddit-strategy.md

# Run comprehensive stats check
./scripts/monitor-stats.sh

# Create follow-up GitHub issue for feedback
gh issue create --repo brancogao/webhook-debugger --title "Post-launch feedback and roadmap" --body "$(cat <<'EOF'
## HN Launch Feedback

Launch date: 2026-02-18

### Community Feedback Summary

### Feature Requests

### Bug Reports

### Documentation Improvements

---

This issue tracks feedback from the initial HN/Reddit launch to inform the v1.1 roadmap.
EOF
)"
```

## Quick Commands Reference

### Stats Check
```bash
./scripts/monitor-stats.sh
```

### GitHub Stats
```bash
# Stars
gh repo view brancogao/webhook-debugger --json stargazerCount -q '.stargazerCount'

# Issues
gh issue list --repo brancogao/webhook-debugger --limit 20

# PRs
gh pr list --repo brancogao/webhook-debugger --limit 10
```

### Demo Site Health
```bash
# HTTP status
curl -I https://webhook-debugger.autocompany.workers.dev

# Response time
curl -s -o /dev/null -w "%{time_total}" https://webhook-debugger.autocompany.workers.dev
```

### Create Issue
```bash
gh issue create --repo brancogao/webhook-debugger --title "Title" --body "Body"
```

## HN Launch Copy (Ready to Copy-Paste)

### Title
```
Show HN: Webhook Debugger – Self-host webhook inspector on Cloudflare Workers
```

### URL
```
https://github.com/brancogao/webhook-debugger
```

### First Comment
```
Hi HN!

I built Webhook Debugger because I needed to debug webhooks in production but didn't want to send sensitive data to public SaaS tools like webhook.site.

It's a self-hosted webhook inspector built on Cloudflare Workers + D1:

- Deploy in 5 minutes to your own Cloudflare account
- 90-day webhook history (7 days free)
- Full-text search across all webhooks
- One-click replay to any URL
- Auto-detects Stripe, GitHub, Shopify, Slack, etc.
- GitHub OAuth authentication

The architecture is intentionally simple:
- Cloudflare Workers for the edge runtime
- Cloudflare D1 (SQLite) for storage
- TypeScript throughout
- FTS5 for full-text search

Live demo: https://webhook-debugger.autocompany.workers.dev

GitHub: https://github.com/brancogao/webhook-debugger

Happy to answer questions about the implementation or architecture!
```

## Reddit Copy (Ready to Copy-Paste)

### r/selfhosted
```
Title: Built a self-hosted webhook debugger on Cloudflare Workers + D1

Body: Hi r/selfhosted!

I built Webhook Debugger because I needed to debug webhooks in production but didn't want to send sensitive data to public SaaS tools like webhook.site.

It's a self-hosted webhook inspector built on Cloudflare Workers + D1:

**Key Features:**
- Deploy in 5 minutes to your own Cloudflare account
- 90-day webhook history (7 days free)
- Full-text search across all webhooks
- One-click replay to any URL
- Auto-detects Stripe, GitHub, Shopify, Slack, etc.
- GitHub OAuth authentication

**Tech Stack:**
- Cloudflare Workers (edge runtime)
- Cloudflare D1 (SQLite)
- TypeScript
- FTS5 full-text search

**Demo**: https://webhook-debugger.autocompany.workers.dev
**GitHub**: https://github.com/brancogao/webhook-debugger

The software is open-source and free to self-host. I also offer managed plans if you don't want to deploy it yourself.

Would love feedback from the self-hosted community!
```

## Critical URLs

- **GitHub Repo**: https://github.com/brancogao/webhook-debugger
- **Live Demo**: https://webhook-debugger.autocompany.workers.dev
- **Release**: https://github.com/brancogao/webhook-debugger/releases/tag/v1.0.0
- **Quick Start**: https://github.com/brancogao/webhook-debugger/blob/main/docs/fullstack/quick-start.md
- **Documentation**: https://github.com/brancogao/webhook-debugger/tree/main/docs

## Success Metrics

### Minimum Success
- 50+ GitHub stars in 24 hours
- 20+ HN comments
- Top 20 on HN

### Good Success
- 100+ GitHub stars in 24 hours
- 50+ HN comments
- Top 10 on HN

### Great Success
- 200+ GitHub stars in 24 hours
- 100+ HN comments
- Top 3 on HN

## Response Templates

### For "Great tool!" comments
```
Thanks! Let me know if you deploy it yourself or try the demo. Happy to help with any questions!
```

### For Technical questions
```
Great question! Here's the technical detail:

[Explain]

You can see this in the code here: [link]

Does that help?
```

### For "Why not X?" questions
```
I considered X but decided against it because:

[Explain trade-offs]

However, if this is something the community needs, I'm open to adding it. What's your use case?
```

## Emergency Contacts

### If Demo Site Goes Down
1. Check Cloudflare Dashboard: https://dash.cloudflare.com
2. Check wrangler status: `wrangler deployments list`
3. Redeploy if needed: `npm run deploy`

### If GitHub Issues Explode
1. Triage issues by priority
2. Respond to most upvoted issues first
3. Create umbrella issue for common requests
4. Update README with FAQ

### If HN Post Gets Downvoted
1. Evaluate: Was the title compelling?
2. Consider reposting with different angle in 24-48 hours
3. Pivot to Reddit and other channels

## Day 2 Follow-Up

### Morning Check
```bash
# Run stats check
./scripts/monitor-stats.sh

# Check for new issues
gh issue list --repo brancogao/webhook-debugger --limit 20

# Check HN thread manually
# Visit https://news.ycombinator.com/item?id=<post-id>
```

### Action Items
- Create GitHub issues for top feature requests
- Update README with FAQ from HN/Reddit
- Write follow-up Twitter thread if positive response
- Consider Dev.to blog post if technical interest

---

**Good luck! Remember: Be helpful, be technical, be authentic.**

*This quick reference has everything you need for launch day. Print it out or keep it open in a browser tab.*
