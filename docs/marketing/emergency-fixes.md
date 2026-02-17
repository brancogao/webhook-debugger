# Emergency Launch Fixes

## Demo Site URL Issues

If the demo site at `https://webhook-debugger.autocompany.workers.dev` is not accessible by launch time, take these actions:

### Option 1: Remove Demo URL (Quickest)

Use these commands to replace/remove demo URLs:

```bash
cd /Users/branco/auto-company/projects/webhook-debugger

# Remove from README.md
sed -i '' 's|Live Demo](https://webhook-debugger.autocompany.workers.dev)||g' README.md
sed -i '' 's|\*\*[🌐 Live Demo](https://webhook-debugger.autocompany.workers.dev)\*\*||g' README.md

# Or replace with "Deploy Your Own" CTA
sed -i '' 's|Live Demo](https://webhook-debugger.autocompany.workers.dev)|Deploy Your Own](#deployment)|g' README.md
```

### Option 2: Use Different URL Format

If the workers.dev URL works (need to test externally), update to:

```
https://webhook-debugger.9b2118aa04c8796b79dd213b3cf52423.workers.dev
```

```bash
cd /Users/branco/auto-company/projects/webhook-debugger

# Replace old URL with workers.dev URL
find . -type f \( -name "*.md" -o -name "*.ts" \) -exec sed -i '' \
  's|webhook-debugger\.autocompany\.workers\.dev|webhook-debugger.9b2118aa04c8796b79dd213b3cf52423.workers.dev|g' {} \;
```

### Option 3: Remove Demo from Launch Copy

If demo can't be fixed, use this HN title and comment:

**Title**:
```
Show HN: Webhook Debugger – Self-host webhook inspector on Cloudflare Workers
```

**First Comment** (remove demo URL):
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

GitHub: https://github.com/brancogao/webhook-debugger

Happy to answer questions about the implementation or architecture!
```

## Quick Fix Commands

### Before Launch (10 minutes to fix)

```bash
# 1. Check all demo URLs
grep -r "webhook-debugger.autocompany.workers.dev" . --include="*.md" | grep -v node_modules | grep -v ".git"

# 2. If demo is broken, remove it from README
sed -i '' '/Live Demo]/d' README.md
sed -i '' '/webhook-debugger.autocompany.workers.dev/d' README.md

# 3. Commit and push
git add .
git commit -m "emergency: remove broken demo URL for launch"
git push
```

## Priority Actions

### 30 Minutes Before Launch
1. Test demo URL from external network (phone, different WiFi)
2. If working: No action needed
3. If not working: Run fix commands above
4. Update HN copy (remove demo link)
5. Update Reddit copy (remove demo link)
6. Commit and push changes

### 10 Minutes Before Launch
1. Final verification: Does GitHub URL work? Yes
2. Final verification: Does README make sense without demo? Yes
3. Final verification: Are all docs consistent? Yes
4. Ready to launch

---

**Remember**: A broken demo is worse than no demo. It's better to remove it and let people deploy their own than to have a broken link.
