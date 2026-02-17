#!/bin/bash
# Webhook Debugger Stats Checker
# Run this after HN launch to check stats

echo "=== Webhook Debugger Stats Check ==="
echo "Time: $(date)"
echo ""

# GitHub Stars
echo "GitHub Stats:"
gh repo view brancogao/webhook-debugger --json stargazerCount,forkCount -q '"Stars: \(.stargazerCount) | Forks: \(.forkCount)"'

# Latest release
echo ""
echo "Latest Release:"
gh release list --repo brancogao/webhook-debugger --limit 1

# Worker status
echo ""
echo "Worker Deployment:"
cd /Users/branco/auto-company/projects/webhook-debugger
wrangler deployments status 2>/dev/null | grep -E "(Created|Version)" | head -2

echo ""
echo "=== End of Report ==="
