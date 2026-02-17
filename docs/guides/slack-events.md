# Slack Event Debugging Guide

> Complete guide to testing and debugging Slack events, slash commands, and interactive components.

Slack apps use webhooks for events, commands, and interactions. This guide covers debugging all Slack webhook types effectively.

## Table of Contents

- [Types of Slack Webhooks](#types-of-slack-webhooks)
- [Setting Up Slack App Webhooks](#setting-up-slack-app-webhooks)
- [Method 1: ngrok (Local Development)](#method-1-ngrok-local-development)
- [Method 2: Webhook Debugger (Production)](#method-2-webhook-debugger-production)
- [Slack Request Verification](#slack-request-verification)
- [Debugging Common Slack Events](#debugging-common-slack-events)

---

## Types of Slack Webhooks

| Type | Purpose | Content-Type |
|------|---------|--------------|
| **Events API** | Channel messages, reactions, etc. | `application/json` |
| **Slash Commands** | Custom `/command` handlers | `application/x-www-form-urlencoded` |
| **Interactive Components** | Button clicks, menu selections | `application/x-www-form-urlencoded` |
| **Shortcuts** | Global/message shortcuts | `application/x-www-form-urlencoded` |

---

## Setting Up Slack App Webhooks

### Step 1: Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App**
3. Choose **From scratch**
4. Name your app and select workspace

### Step 2: Enable Events

1. Go to **Event Subscriptions**
2. Enable events
3. Enter your Request URL
4. Subscribe to bot events

### Step 3: Add Slash Commands

1. Go to **Slash Commands**
2. Click **Create New Command**
3. Enter command, URL, and description

### Step 4: Enable Interactivity

1. Go to **Interactivity & Shortcuts**
2. Enable interactivity
3. Enter Request URL

---

## Method 1: ngrok (Local Development)

For local development with Slack:

```bash
# Start ngrok
ngrok http 3000

# Copy HTTPS URL
# https://abc123.ngrok.io
```

Use this URL in Slack app settings:
- Events: `https://abc123.ngrok.io/slack/events`
- Slash Commands: `https://abc123.ngrok.io/slack/commands`
- Interactivity: `https://abc123.ngrok.io/slack/interactions`

**Limitations:**
- URL changes on restart (free tier)
- Not suitable for production debugging
- No webhook history

---

## Method 2: Webhook Debugger (Production)

For persistent webhook history and production debugging:

### Step 1: Deploy Webhook Debugger

```bash
git clone https://github.com/brancogao/webhook-debugger.git
cd webhook-debugger && npm install

npx wrangler login
npx wrangler d1 create webhook-debugger-db
npm run deploy
```

### Step 2: Create Slack Endpoints

Create separate endpoints for each webhook type:

- `/hook/slack-events` - Events API
- `/hook/slack-commands` - Slash commands
- `/hook/slack-interactions` - Interactive components

### Step 3: Configure Slack App

Update your Slack app URLs:
- Events: `https://your-debugger.workers.dev/hook/slack-events`
- Commands: `https://your-debugger.workers.dev/hook/slack-commands`
- Interactions: `https://your-debugger.workers.dev/hook/slack-interactions`

### Step 4: Debug Webhooks

View all Slack webhooks with:
- Full payload (JSON or form-encoded)
- Headers including signature
- Auto-detected Slack source
- 90-day history

---

## Slack Request Verification

Slack signs all requests. Always verify:

```typescript
import crypto from 'crypto';

function verifySlackRequest(
  body: string,
  timestamp: string,
  signature: string,
  signingSecret: string
): boolean {
  // Check timestamp (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  // Verify signature
  const basestring = `v0:${timestamp}:${body}`;
  const hmac = crypto
    .createHmac('sha256', signingSecret)
    .update(basestring)
    .digest('hex');

  const expectedSignature = `v0=${hmac}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

app.post('/slack/events', (req, res) => {
  const timestamp = req.headers['x-slack-request-timestamp'];
  const signature = req.headers['x-slack-signature'];
  const secret = process.env.SLACK_SIGNING_SECRET;

  if (!verifySlackRequest(req.rawBody, timestamp, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }

  // Handle event...
});
```

---

## Debugging Common Slack Events

### URL Verification (Initial Setup)

When you first enable events, Slack sends a challenge:

```json
{
  "token": "Jhj5dZrVaK7ZwHHjRyZWjbDl",
  "challenge": "3eZbrw1aBm2rZgRNFdxV2595E9CY3gmdALWMmHkvFXO7tYXAYM8P",
  "type": "url_verification"
}
```

Respond with the challenge:

```typescript
if (req.body.type === 'url_verification') {
  return res.status(200).send(req.body.challenge);
}
```

### Message Events

```json
{
  "type": "event_callback",
  "event": {
    "type": "message",
    "channel": "C024BE91L",
    "user": "U2147483697",
    "text": "Hello world",
    "ts": "1355517523.000005"
  }
}
```

### Slash Command Payload

Form-encoded payload:

```
token=gIkuvaNzQIHg97ATvDxqgjtO
&team_id=T0001
&team_domain=example
&enterprise_id=E0001
&enterprise_name=Globular%20Construct%20Inc
&channel_id=C2147483705
&channel_name=test
&user_id=U2147483697
&user_name=Steve
&command=/weather
&text=94070
&response_url=https://hooks.slack.com/commands/1234/5678
&trigger_id=13345224609.738474920.8088930838d88f008e0
```

### Interactive Component Payload

JSON-encoded payload inside form field:

```json
{
  "type": "block_actions",
  "user": { "id": "U01234567", "username": "alice" },
  "channel": { "id": "C01234567" },
  "actions": [{
    "action_id": "button_click",
    "block_id": "button_block",
    "type": "button",
    "text": { "type": "plain_text", "text": "Click Me" },
    "value": "click_me_123"
  }]
}
```

---

## Common Debugging Scenarios

### Event Not Received

| Cause | Solution |
|-------|----------|
| Wrong URL | Check Request URL in app settings |
| Not subscribed | Add event to Bot Events |
| Bot not in channel | Invite bot to channel |
| Scope missing | Add required OAuth scopes |

### Signature Verification Failing

| Cause | Solution |
|-------|----------|
| Raw body modified | Don't parse body before verification |
| Wrong secret | Check Signing Secret in app settings |
| Timestamp expired | Check server time sync |

### Slash Command Timeout

Slack expects response within 3 seconds:

```typescript
app.post('/slack/commands', async (req, res) => {
  // Acknowledge immediately
  res.status(200).send('Processing...');

  // Process in background
  await processCommand(req.body);

  // Send follow-up via response_url
  await fetch(req.body.response_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Done!' })
  });
});
```

---

## Best Practices

1. **Always verify signatures** - Prevent forged requests
2. **Respond quickly** - Use response_url for long operations
3. **Handle retries** - Slack may retry failed requests
4. **Log everything** - History is essential for debugging
5. **Test in development workspace** - Don't test in production

---

## Related Guides

- [How to Debug Stripe Webhooks](./stripe-webhooks.md)
- [How to Test GitHub Webhooks Locally](./github-webhooks.md)
- [Shopify Webhook Debugging Guide](./shopify-webhooks.md)

---

**Webhook Debugger** - Self-hosted webhook inspector for Slack app developers. 90-day history with full-text search. [Get started free](https://github.com/brancogao/webhook-debugger).
