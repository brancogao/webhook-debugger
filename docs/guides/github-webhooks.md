# How to Test GitHub Webhooks Locally

> A practical guide to debugging GitHub webhooks for GitHub Apps, OAuth Apps, and repository hooks.

GitHub webhooks power automation workflows, CI/CD pipelines, and bot integrations. This guide covers everything you need to test and debug GitHub webhooks effectively.

## Table of Contents

- [Types of GitHub Webhooks](#types-of-github-webhooks)
- [Method 1: Smee.io (Quick Testing)](#method-1-smeeio-quick-testing)
- [Method 2: Ngrok (Local Development)](#method-2-ngrok-local-development)
- [Method 3: Webhook Debugger (Production Debugging)](#method-3-webhook-debugger-production-debugging)
- [GitHub Webhook Security](#github-webhook-security)
- [Common GitHub Webhook Events](#common-github-webhook-events)

---

## Types of GitHub Webhooks

GitHub offers three webhook types:

| Type | Use Case | Setup Location |
|------|----------|----------------|
| **Repository webhooks** | Per-repo automation | Settings > Webhooks |
| **Organization webhooks** | Org-wide events | Org Settings > Webhooks |
| **GitHub App webhooks** | App events | App settings |

---

## Method 1: Smee.io (Quick Testing)

Smee.io is GitHub's recommended tool for local webhook testing:

```bash
# Install smee-client
npm install -g smee-client

# Create a channel
smee -u https://smee.io/YOUR_CHANNEL --target localhost:3000/webhooks/github
```

**Pros:**
- Free and easy
- No account needed

**Cons:**
- Public URLs (security risk)
- Unreliable for production debugging
- No history persistence

---

## Method 2: Ngrok (Local Development)

Ngrok creates a tunnel to your local machine:

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 3000

# Use the HTTPS URL in GitHub webhook settings
# https://abc123.ngrok.io/webhooks/github
```

**Pros:**
- Reliable tunnel
- Can inspect requests in dashboard

**Cons:**
- URLs change on free tier
- Not suitable for production debugging
- Tunnel-only, no persistence

---

## Method 3: Webhook Debugger (Production Debugging)

For persistent webhook history and production debugging:

### Step 1: Deploy Webhook Debugger

```bash
git clone https://github.com/brancogao/webhook-debugger.git
cd webhook-debugger && npm install

npx wrangler login
npx wrangler d1 create webhook-debugger-db
npm run deploy
```

### Step 2: Create GitHub Webhook Endpoint

1. Open your Webhook Debugger dashboard
2. Create endpoint: `/hook/github-events`
3. Note the full URL

### Step 3: Configure GitHub Webhook

1. Go to repository **Settings > Webhooks > Add webhook**
2. **Payload URL**: `https://your-debugger.workers.dev/hook/github-events`
3. **Content type**: `application/json`
4. **Secret**: Generate a secure random string
5. **Events**: Select events to receive
6. **Active**: Check the box

### Step 4: Debug Webhooks

When GitHub sends events, you'll see:
- Event type (push, pull_request, issues, etc.)
- Full JSON payload
- Headers including signature
- Delivery timestamp

**Key debugging features:**
- **90-day history** - Never lose a webhook
- **Full-text search** - Find webhooks by PR number, commit SHA, etc.
- **One-click replay** - Resend to your local or staging server
- **Auto detection** - Identifies GitHub webhooks automatically

---

## GitHub Webhook Security

GitHub signs webhooks using HMAC-SHA256. Always verify:

```typescript
import crypto from 'crypto';

function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = 'sha256=' +
    crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

app.post('/webhooks/github', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!verifyGitHubSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.headers['x-github-event'];
  const payload = JSON.parse(req.body);

  // Handle event...
  res.status(200).send('OK');
});
```

---

## Common GitHub Webhook Events

### Push Events

```json
{
  "ref": "refs/heads/main",
  "before": "abc123",
  "after": "def456",
  "repository": { "full_name": "owner/repo" },
  "pusher": { "name": "username" },
  "commits": [...]
}
```

### Pull Request Events

```json
{
  "action": "opened",
  "pull_request": {
    "number": 42,
    "title": "Add new feature",
    "state": "open",
    "user": { "login": "username" }
  },
  "repository": { "full_name": "owner/repo" }
}
```

### Issues Events

```json
{
  "action": "opened",
  "issue": {
    "number": 123,
    "title": "Bug report",
    "body": "Description...",
    "user": { "login": "username" }
  }
}
```

### Workflow Run Events (GitHub Actions)

```json
{
  "action": "completed",
  "workflow_run": {
    "id": 123456,
    "name": "CI",
    "status": "completed",
    "conclusion": "success"
  }
}
```

---

## Testing GitHub Webhooks Locally

Use the GitHub API to trigger test events:

```bash
# Using curl to simulate a push event
curl -X POST http://localhost:3000/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d @test-payload.json
```

Or use GitHub's official CLI:

```bash
# Trigger workflow_dispatch
gh workflow run ci.yml -f environment=staging
```

---

## Best Practices

1. **Always verify signatures** - Prevent forged webhook attacks
2. **Handle idempotency** - GitHub may send duplicate deliveries
3. **Process asynchronously** - Return 200 quickly, process in background
4. **Log everything** - You'll need history for debugging
5. **Set up monitoring** - Alert on webhook failures

---

## Related Guides

- [How to Debug Stripe Webhooks](./stripe-webhooks.md)
- [Shopify Webhook Debugging Guide](./shopify-webhooks.md)
- [Slack Event Debugging](./slack-events.md)

---

**Webhook Debugger** - The self-hosted webhook inspector with 90-day history. [Get started free](https://github.com/brancogao/webhook-debugger).
