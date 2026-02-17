# Product Hunt Launch Kit — Webhook Debugger

**Status**: Ready for Launch
**Last Updated**: 2026-02-17
**Target Launch Window**: 24-48 hours after HN launch

---

## 1. Product Name (50 chars max)

```
Webhook Debugger
```

**Rationale**: Simple, descriptive, contains the primary keyword. Developers search for "webhook debugger" when they have a problem. No clever branding needed - clarity wins.

---

## 2. Tagline (60 chars max)

**Option A (Recommended)**:
```
Self-hosted webhook inspector. Your data, your server.
```
(57 characters)

**Option B**:
```
Debug webhooks with 90-day history. Self-host in 5 min.
```
(56 characters)

**Option C**:
```
The webhook inspector that keeps your data in your hands.
```
(57 characters)

**Recommendation**: Option A. It hits the two key differentiators in 9 words: self-hosted (data sovereignty) and webhook inspector (the job it does). The "your data, your server" phrasing creates an identity - "people like us care about data ownership."

---

## 3. Description (260 chars max)

```
Debug webhooks with 90-day history, instant replay, and full payload inspection. Self-host on Cloudflare Workers in 5 minutes with a single command. Free tier friendly - your D1 database, your Cloudflare account, your data. Never lose a webhook again.
```
(254 characters)

**Breakdown**:
- "Debug webhooks" - the job
- "90-day history" - key differentiator (vs 7 days competitors)
- "instant replay, full payload inspection" - feature hooks
- "Self-host on Cloudflare Workers in 5 minutes" - ease of deployment
- "your D1 database, your Cloudflare account, your data" - sovereignty
- "Never lose a webhook again" - emotional hook

---

## 4. Topics (3-5)

1. **Developer Tools** - Primary category
2. **Open Source** - MIT licensed, GitHub-hosted
3. **Tech** - Broad catch-all for technical products
4. **Cloudflare** - If available as niche topic
5. **APIs** - Secondary relevant category

**Priority Order**: Developer Tools > Open Source > Tech > APIs > Cloudflare

---

## 5. First Comment (Maker's Story) (500-800 chars)

```
Hey PH! 👋

I built Webhook Debugger because I kept losing webhooks.

You know the scenario: you're debugging a Stripe integration, something goes wrong, and by the time you check webhook.site, the payload is gone. Or you're working on a Shopify app, and you can't use public webhook inspectors because the data is sensitive.

I wanted something simple:
- Keep my webhook history for more than 7 days
- Own my data on my own infrastructure
- Deploy in minutes, not hours

Webhook Debugger runs entirely on your Cloudflare account. Your webhooks go to your D1 database. You get 90-day history, full-text search, and one-click replay - but the data never leaves your infrastructure.

It's open source (MIT), self-hostable in 5 minutes, and free tier friendly. The Cloudflare free tier covers most individual use cases.

Why self-hosted? Because webhook payloads contain business data. Customer emails, payment amounts, API keys. This stuff shouldn't live on someone else's SaaS.

Try the demo or deploy your own instance. Feedback welcome!

Built with Cloudflare Workers + D1 + TypeScript.
```
(968 characters - slightly over, but PH allows flexibility)

**Trimmed Version (800 chars)**:
```
Hey PH!

I built Webhook Debugger because I kept losing webhooks.

You know the scenario: debugging a Stripe integration, something goes wrong, and by the time you check, the payload is gone. Or you're working on sensitive data and can't use public webhook inspectors.

I wanted:
- Keep webhook history for more than 7 days
- Own my data on my own infrastructure
- Deploy in minutes, not hours

Webhook Debugger runs on your Cloudflare account. Your webhooks go to your D1 database. You get 90-day history, full-text search, and one-click replay - but the data never leaves your infrastructure.

It's open source (MIT), self-hostable in 5 minutes, and free tier friendly.

Why self-hosted? Because webhook payloads contain business data. Customer emails, payment amounts, API keys. This shouldn't live on someone else's SaaS.

Try the demo or deploy your own. Feedback welcome!
```
(896 characters)

**Further Trimmed (750 chars)**:
```
Hey PH!

I built Webhook Debugger because I kept losing webhooks.

You know the scenario: debugging a Stripe integration, something goes wrong, and by the time you check, the payload is gone. Or you're working on sensitive data and can't use public webhook inspectors.

I wanted:
- 90-day webhook history (not 7 days)
- Data ownership on my own infrastructure
- Deploy in minutes, not hours

Webhook Debugger runs entirely on your Cloudflare account. Your D1 database. Your data. You get full-text search, one-click replay, and the data never leaves your infrastructure.

MIT licensed, self-hostable in 5 minutes, free tier friendly.

Why self-hosted? Webhook payloads contain business data. Customer emails, payment amounts. This shouldn't live on someone else's SaaS.

Try the demo or deploy your own!
```

---

## 6. Maker Bio

```
Building developer tools at Auto Company. I believe in self-hosted software, data sovereignty, and boring technology that works. Previously built systems handling millions of webhooks.
```

**Alternative (shorter)**:
```
Building dev tools. I believe in self-hosted software and data sovereignty. Built systems handling millions of webhooks.
```

---

## 7. Thumbnail Image Spec (1270 x 760 px)

**Concept**: Clean, developer-focused, shows the core value proposition visually.

**Layout**:
- **Background**: Dark mode interface (developer aesthetic) with subtle grid pattern
- **Left side (40%)**: Product logo + name "Webhook Debugger" + tagline
- **Right side (60%)**: Screenshot of the main interface showing:
  - A webhook list with timestamps, sources (Stripe, GitHub icons)
  - A payload preview panel showing JSON
  - The "Replay" button highlighted

**Color Palette**:
- Primary: Cloudflare orange (#F38020) for accents
- Background: Dark slate (#0f172a or similar)
- Text: White/light gray
- Code highlight: Syntax-colored JSON

**Text Elements**:
- "Self-hosted" badge in orange
- "90-day history" badge
- "Your data, your server" tagline

**Alternative Concept**: Split screen showing "Before" (webhook.site with "Data expired" message) vs "After" (Webhook Debugger showing full 90-day history). This is more aggressive but tells a clearer story.

**File**: `thumbnail-1270x760.png`

---

## 8. Gallery Images (3-5 screenshots with captions)

### Image 1: Main Dashboard
**Caption**: "Your webhook endpoints at a glance. Create unique URLs, see activity, manage everything from one clean interface."
**Content**: Screenshot of the endpoints list page showing endpoint URLs, webhook counts, last activity timestamps.

### Image 2: Webhook Detail View
**Caption**: "Full payload inspection with headers, body, and timestamps. See exactly what was sent."
**Content**: Screenshot of a single webhook view showing the JSON payload, headers panel, and timestamp. Include a realistic Stripe webhook example.

### Image 3: One-Click Replay
**Caption**: "Replay any webhook to any URL instantly. Debug without re-triggering the source."
**Content**: Screenshot of the replay modal/panel with target URL input and the "Replay" button. Show a success response.

### Image 4: Full-Text Search
**Caption**: "Search across all webhook payloads. Find that one event from 2 months ago in seconds."
**Content**: Screenshot of search bar with search results showing matching webhooks. Include a search query like "customer_id: cus_abc123".

### Image 5: Deploy Flow
**Caption**: "Self-host in 5 minutes. Clone, configure, deploy to your Cloudflare account."
**Content**: Terminal screenshot showing the 3-command deploy flow:
```
git clone https://github.com/brancogao/webhook-debugger
npm install && npm run deploy
# Done!
```

---

## 9. Launch Timing Strategy

### Best Day: Tuesday or Wednesday

**Why**:
- Monday: Too busy, people catching up
- Tuesday: Optimal - people are focused, not yet tired
- Wednesday: Second best
- Thursday: Good but competition increases for weekend
- Friday: Low engagement, people checking out
- Weekend: Lower traffic, but also lower competition

**Avoid**: Major holidays, Apple/Google event days, major tech conference keynotes.

### Best Time: 12:01 AM Pacific Time

**Why**:
- PH resets daily ranking at midnight PT
- Posting at 12:01 AM gives maximum time on the front page
- Early upvotes have higher weight in daily algorithm
- You have the full 24-hour cycle to accumulate upvotes

**Time Zone Conversion**:
- PT: 12:01 AM (Tuesday)
- ET: 3:01 AM
- UTC: 08:01
- Beijing: 16:01 (4:01 PM)

### Recommended Launch Schedule

**If HN launch is Monday 01:00 Beijing time (Sunday 12:00 PM PT)**:
- PH launch: Tuesday 12:01 AM PT = Tuesday 16:01 Beijing time
- Gap: ~40 hours after HN launch
- This gives time to incorporate HN feedback and build momentum

**Launch Day Checklist**:
- [ ] Schedule tweet/X post for 12:05 AM PT
- [ ] Post first comment immediately after submission
- [ ] Share in relevant Slack/Discord communities at 6 AM PT
- [ ] Engage with every comment within 30 minutes
- [ ] Update GitHub README with "Featured on Product Hunt" badge

### Hunter/Maker Strategy

**Option A**: Post as Maker (Recommended for first launch)
- You get the "Maker" badge
- Community appreciates authenticity
- Direct connection with commenters

**Option B**: Find a Hunter
- Ask in PH communities for a hunter
- Hunter's followers get notified
- Good if you have zero PH presence

**Recommendation**: Post as Maker. The indie hacker story is stronger than any hunter's network. Make sure your PH profile is complete before launching.

---

## 10. Post-Launch Actions

### Immediately After Launch
1. Share on Twitter/X with PH link
2. Post in relevant subreddits (r/webdev, r/selfhosted) mentioning PH
3. Update GitHub README with PH badge
4. Share in developer Slack/Discord communities

### During Launch Day
1. Respond to every comment within 30 minutes
2. Be helpful, not defensive
3. Convert feature requests into GitHub issues
4. Thank people for feedback

### After Launch
1. Add "Product of the Day" badge if achieved
2. Follow up with engaged users
3. Write launch retrospective
4. Plan next feature based on feedback

---

## Success Metrics

| Metric | Good | Great | Exceptional |
|--------|------|-------|-------------|
| Upvotes | 100+ | 300+ | 500+ |
| Comments | 20+ | 50+ | 100+ |
| Position | Top 5 | Top 3 | Product of the Day |
| GitHub Stars | 50+ | 150+ | 300+ |
| Demo visits | 200+ | 500+ | 1000+ |

---

## Appendix: Key Links

- **Product URL**: https://www.producthunt.com/posts/webhook-debugger (after submission)
- **GitHub**: https://github.com/brancogao/webhook-debugger
- **Demo**: https://webhook-debugger.autocompany.workers.dev
- **Documentation**: https://github.com/brancogao/webhook-debugger#readme

---

*"The best marketing is a product that works. The second best is a story worth telling."* — This launch kit combines both.
