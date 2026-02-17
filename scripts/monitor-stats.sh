#!/bin/bash
# Webhook Debugger Comprehensive Stats Checker
# Run this regularly after HN launch to track metrics

set -e

REPO="brancogao/webhook-debugger"
DEMO_URL="https://webhook-debugger.autocompany.workers.dev"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REPORT_FILE="$PROJECT_DIR/docs/marketing/stats-report.md"

echo "=== Webhook Debugger Comprehensive Stats Check ==="
echo "Time: $(date)"
echo "Location: $PROJECT_DIR"
echo ""

# Initialize report
cat > "$REPORT_FILE" << EOF
# Webhook Debugger Stats Report

**Generated**: $(date)

## GitHub Stats

EOF

# GitHub Stats
echo "=== GitHub Stats ==="
STARS=$(gh repo view "$REPO" --json stargazerCount -q '.stargazerCount')
FORKS=$(gh repo view "$REPO" --json forkCount -q '.forkCount')
OPEN_ISSUES=$(gh issue list --repo "$REPO" --limit 100 --json number --jq 'length')
OPEN_PRS=$(gh pr list --repo "$REPO" --limit 100 --json number --jq 'length')

echo "Stars: $STARS"
echo "Forks: $FORKS"
echo "Open Issues: $OPEN_ISSUES"
echo "Open PRs: $OPEN_PRS"

cat >> "$REPORT_FILE" << EOF
- **Stars**: $STARS
- **Forks**: $FORKS
- **Open Issues**: $OPEN_ISSUES
- **Open PRs**: $OPEN_PRS

## Recent Activity

EOF

# Recent Issues (top 5)
echo ""
echo "=== Recent Issues ==="
gh issue list --repo "$REPO" --limit 5 --state open --json number,title,author,createdAt,labels --jq '.[] | "- [#\(.number)] \(.title) by @\(.author.login) (\(.createdAt | fromdate | strftime("%Y-%m-%d")))"' | tee -a "$REPORT_FILE"

# Recent PRs (top 5)
echo ""
echo "=== Recent PRs ==="
gh pr list --repo "$REPO" --limit 5 --state open --json number,title,author,createdAt --jq '.[] | "- [#\(.number)] \(.title) by @\(.author.login) (\(.createdAt | fromdate | strftime("%Y-%m-%d")))"' | tee -a "$REPORT_FILE"

# Latest Release
echo ""
echo "=== Latest Release ==="
LATEST_RELEASE=$(gh release list --repo "$REPO" --limit 1 --json tagName,name,publishedAt --jq '.[0] | "- \(.name) (\(.tagName)) published on \(.publishedAt | fromdate | strftime("%Y-%m-%d"))"' 2>/dev/null || echo "No release found")
echo "$LATEST_RELEASE" | tee -a "$REPORT_FILE"

cat >> "$REPORT_FILE" << EOF

## GitHub Issues by Label

EOF

# Issues by label
echo ""
echo "=== Issues by Label ==="
for label in "enhancement" "bug" "documentation" "help wanted"; do
  count=$(gh issue list --repo "$REPO" --label "$label" --limit 100 --json number --jq 'length' 2>/dev/null || echo "0")
  echo "- $label: $count" | tee -a "$REPORT_FILE"
done

cat >> "$REPORT_FILE" << EOF

## Demo Site Health

EOF

# Demo site health
echo ""
echo "=== Demo Site Health ==="
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEMO_URL")
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$DEMO_URL")

echo "HTTP Status: $HTTP_STATUS"
echo "Response Time: ${RESPONSE_TIME}s"

cat >> "$REPORT_FILE" << EOF
- **HTTP Status**: $HTTP_STATUS
- **Response Time**: ${RESPONSE_TIME}s

EOF

# Worker deployment status
echo ""
echo "=== Worker Deployment Status ==="
cd "$PROJECT_DIR"
if wrangler deployments list 2>/dev/null | grep -q .; then
  wrangler deployments list 2>/dev/null | head -5 | tee -a "$REPORT_FILE"
else
  echo "Unable to fetch deployment status (may need to run wrangler login)" | tee -a "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

## Growth Since Last Check

*Note: Track these metrics over time to see growth trends.*

EOF

# Calculate growth (if previous report exists)
if [ -f "$PROJECT_DIR/docs/marketing/last-stars.txt" ]; then
  LAST_STARS=$(cat "$PROJECT_DIR/docs/marketing/last-stars.txt")
  STAR_GROWTH=$((STARS - LAST_STARS))
  echo "Star growth since last check: +$STAR_GROWTH" | tee -a "$REPORT_FILE"
else
  echo "(First run - establishing baseline)" | tee -a "$REPORT_FILE"
fi

# Save current stats for next comparison
echo "$STARS" > "$PROJECT_DIR/docs/marketing/last-stars.txt"

cat >> "$REPORT_FILE" << EOF

---

*This report is auto-generated. Manual checks needed for:*
- *Hacker News upvotes and comments (check news.ycombinator.com)*
- *Reddit engagement (check individual subreddits)*
- *Cloudflare Analytics (check dash.cloudflare.com)*

---

**Next Actions**:
EOF

# Suggest next actions based on metrics
if [ "$OPEN_ISSUES" -gt 5 ]; then
  echo "- Review and prioritize $OPEN_ISSUES open issues" | tee -a "$REPORT_FILE"
fi

if [ "$OPEN_PRS" -gt 0 ]; then
  echo "- Review and merge $OPEN_PRS open PRs" | tee -a "$REPORT_FILE"
fi

if [ "$STAR_GROWTH" ] && [ "$STAR_GROWTH" -gt 10 ]; then
  echo "- Consider posting about growth on social media" | tee -a "$REPORT_FILE"
fi

if [ "$HTTP_STATUS" != "200" ]; then
  echo "- **URGENT**: Demo site not healthy (HTTP $HTTP_STATUS)" | tee -a "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

- Engage with community on GitHub Discussions
- Check HN/Reddit for new mentions
- Update documentation based on common questions
EOF

echo ""
echo "=== Report saved to: $REPORT_FILE ==="
echo ""
echo "=== Manual Checks Required ==="
echo "1. Hacker News: Check https://news.ycombinator.com/item?id=<post-id>"
echo "2. Reddit: Check individual subreddit posts for engagement"
echo "3. Cloudflare Analytics: https://dash.cloudflare.com"
echo "4. GitHub Discussions: https://github.com/$REPO/discussions"
echo ""
echo "=== End of Report ==="
