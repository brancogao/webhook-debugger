# Hacker News Launch Playbook

## Timing

**Launch Time**: Beijing 2026-02-18 01:00 (US 2026-02-17 12:00 EST)

**Why this time?**
- US East Coast: Lunch time (12pm EST)
- US West Coast: 9am PST (starting work day)
- Europe: Evening (less competition)
- Asia: Late night (minimal competition)

## HN Submission

### Title
```
Show HN: Webhook Debugger – Self-host webhook inspector on Cloudflare Workers
```

### URL
```
https://github.com/brancogao/webhook-debugger
```

### First Comment (Pre-written)

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

## Expected HN Questions & Answers

### Q: Why not use webhook.site / RequestBin?
A: Those are great for quick testing, but they're SaaS services that hold your data. Webhook Debugger is self-hosted on YOUR Cloudflare account. You have full control over your data, retention policies, and can delete it anytime. Plus, you get 90-day history vs 24-48 hours on most free tiers.

### Q: What's the difference between the demo and self-hosting?
A: The demo is a shared instance for evaluation. Self-hosting gives you your own dedicated database, authentication, and unlimited capacity (within Cloudflare's free tier). You can fork the repo, deploy to your own Cloudflare account, and have full control.

### Q: How does the pricing work?
A: The software is open-source and free to self-host. I offer managed plans on the demo instance if you don't want to deploy yourself:
- Free: 1 endpoint, 7-day history
- Pro: 10 endpoints, 90-day history ($9/mo)
- Team: 50 endpoints, 90-day history ($29/mo)

But you can deploy your own unlimited version on Cloudflare's free tier.

### Q: Why Cloudflare Workers + D1?
A: Cloudflare Workers is incredibly fast (runs at the edge) and has a generous free tier. D1 is their SQLite-based database that's perfect for this use case. Together, they're much simpler than AWS Lambda + DynamoDB or other serverless stacks. Plus, the free tier is very generous for webhook workloads.

### Q: Can I use this for Stripe/GitHub webhooks?
A: Yes! It auto-detects common webhook sources. I currently detect Stripe, GitHub, Shopify, Slack, and more based on user-agent and headers. You can also manually tag webhooks.

### Q: What's the tech stack?
A: TypeScript, Cloudflare Workers (edge runtime), Cloudflare D1 (SQLite), GitHub OAuth for auth, and vanilla JS for the frontend (no frameworks, keeps it small at ~6KB gzipped).

### Q: Is this production-ready?
A: Yes! I'm using it in production for my own projects. It's been battle-tested with Stripe, GitHub, and custom webhooks. The architecture is simple and robust.

### Q: Any plans for signature verification?
A: Yes! It's on the roadmap. Currently, it just receives and stores webhooks. Future versions will verify signatures from Stripe, GitHub, etc. for added security.

### Q: Can I contribute?
A: Absolutely! Check out the CONTRIBUTING.md or just open an issue or PR. I'd love help with:
- More webhook source integrations
- Signature verification
- Export options (CSV, JSON)
- Better filtering and search

## Anti-Gameplay Checklist

- [ ] Don't upvote your own submission
- [ ] Don't ask friends to upvote
- [ ] Don't submit to multiple subs (just Show HN)
- [ ] Be humble and transparent
- [ ] Don't delete negative comments
- [ ] Respond to criticism constructively

## Engagement Strategy

### First Hour (Critical)
- Monitor thread every 5 minutes
- Respond to every comment
- Be helpful and technical
- Link to demo, docs, or code as needed

### First 6 Hours (Main Engagement)
- Continue monitoring
- Answer all technical questions
- Share insights about architecture decisions
- Mention future roadmap based on interest

### First 24 Hours (Wrap-up)
- Summarize key discussion points
- Create GitHub issues for feature requests
- Update README with FAQ from HN
- Follow up on interesting leads

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

## Contingency Plans

### If No One Engages
- Evaluate: Was the title compelling enough?
- Consider: Repost with different angle after 24-48 hours
- Pivot: Focus on Reddit and Dev.to communities

### If Negative Feedback
- Identify common criticisms
- Acknowledge valid concerns
- Create GitHub issues to address
- Show that you're listening and iterating

### If Tons of Traffic
- Ensure demo site can handle load (Cloudflare Workers should handle it)
- Monitor Cloudflare quotas
- Add disclaimer that demo is for evaluation only
- Encourage self-hosting for production use

## Post-HN Actions

1. **Immediate (Within 24h)**
   - Create GitHub issue summarizing HN feedback
   - Update README with FAQ from discussion
   - Thank commenters who provided valuable feedback

2. **Short-term (Week 1)**
   - Implement top-requested features from HN
   - Write follow-up blog posts on hot topics
   - Engage with users who starred/forked

3. **Long-term (Month 1)**
   - Release v1.1.0 with HN-requested features
   - Share progress in GitHub Discussions
   - Build on community momentum

## Copy Variations (If needed)

### Alternative Title 1
```
Show HN: I built a self-hosted webhook debugger because I didn't want to use webhook.site
```

### Alternative Title 2
```
Show HN: Debug webhooks with your own Cloudflare Workers instance (90-day history)
```

### Alternative Title 3
```
Show HN: Webhook Debugger – Deploy in 5 minutes, keep your data forever
```

## Resources

- GitHub: https://github.com/brancogao/webhook-debugger
- Live Demo: https://webhook-debugger.autocompany.workers.dev
- Quick Start: https://github.com/brancogao/webhook-debugger/blob/main/docs/fullstack/quick-start.md
- Release: https://github.com/brancogao/webhook-debugger/releases/tag/v1.0.0

---

*Remember: HN is about curiosity and interesting technology. Focus on the "why" and the technical details, not just the product pitch.*
