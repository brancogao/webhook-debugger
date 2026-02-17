# How to Debug Discord Webhooks

> A complete guide to testing and debugging Discord webhooks and bot interactions using Webhook Debugger.

Discord webhooks enable automated messaging and bot interactions. This guide shows you how to inspect, test, and debug Discord webhooks effectively.

## Table of Contents

- [Why Discord Webhook Debugging Matters](#why-discord-webhook-debugging-matters)
- [Types of Discord Webhooks](#types-of-discord-webhooks)
- [Common Discord Webhook Issues](#common-discord-webhook-issues)
- [Method 1: Discord Webhook URLs (Simple Messages)](#method-1-discord-webhook-urls-simple-messages)
- [Method 2: Discord Bot Events (Complex Interactions)](#method-2-discord-bot-events-complex-interactions)
- [Method 3: Webhook Debugger (Production Debugging)](#method-3-webhook-debugger-production-debugging)
- [Discord Webhook Security](#discord-webhook-security)
- [Testing Discord Webhooks Locally](#testing-discord-webhooks-locally)

---

## Why Discord Webhook Debugging Matters

Discord webhooks are used for:

- **Notifications** - Deploy complete, build failed, new issue
- **Alerts** - Server monitoring, error tracking
- **Content delivery** - RSS feeds, social media cross-posts
- **Bot interactions** - Slash commands, button clicks, modals

When webhooks fail, users miss critical updates. **Proper debugging ensures reliable notifications.**

---

## Types of Discord Webhooks

Discord has two webhook mechanisms:

### 1. Incoming Webhooks (Simple)

Send messages to a channel via HTTP POST:

```bash
curl -X POST "https://discord.com/api/webhooks/123456789/abc123..." \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from webhook!"}'
```

### 2. Bot Gateway Events (Advanced)

Real-time events via WebSocket or HTTP interactions:

```json
{
  "type": 2,
  "token": "aW50ZXJhY3Rpb246MTIz...",
  "member": {
    "user": {"id": "123456789", "username": "user"},
    "roles": ["987654321"]
  },
  "data": {
    "name": "ping",
    "options": []
  }
}
```

---

## Common Discord Webhook Issues

| Issue | Symptom | Debug Approach |
|-------|---------|----------------|
| **Invalid webhook URL** | 404 Not Found | Regenerate webhook |
| **Missing permissions** | 403 Forbidden | Check bot permissions |
| **Rate limited** | 429 Too Many Requests | Implement backoff |
| **Invalid embed** | 400 Bad Request | Validate embed structure |
| **Message too long** | 400 Bad Request | Split message (max 2000 chars) |
| **Missing content** | 400 Bad Request | Include content or embeds |

---

## Method 1: Discord Webhook URLs (Simple Messages)

### Creating a Webhook

1. Go to your Discord server
2. **Channel Settings** > **Integrations** > **Webhooks**
3. Click **New Webhook**
4. Copy the webhook URL

### Sending Messages

```bash
# Simple message
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "Build completed successfully!"}'

# With embed
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "embeds": [{
      "title": "Deploy Status",
      "description": "Production deploy completed",
      "color": 3066993,
      "fields": [
        {"name": "Branch", "value": "main", "inline": true},
        {"name": "Commit", "value": "abc1234", "inline": true}
      ]
    }]
  }'

# With username and avatar
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Alert!",
    "username": "Alert Bot",
    "avatar_url": "https://example.com/avatar.png"
  }'
```

---

## Method 2: Discord Bot Events (Complex Interactions)

### Setting Up Interaction Endpoints

Discord bots receive interactions via HTTP endpoints (if configured) or WebSocket:

```typescript
import { verifyKey } from 'discord-interactions';

app.post('/interactions', (req, res) => {
  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];
  const body = JSON.stringify(req.body);

  // Verify Discord signature
  const isValid = verifyKey(
    body,
    signature,
    timestamp,
    process.env.DISCORD_PUBLIC_KEY
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  const interaction = req.body;

  // Handle ping
  if (interaction.type === 1) {
    return res.json({ type: 1 }); // PONG
  }

  // Handle slash command
  if (interaction.type === 2) {
    return handleSlashCommand(interaction);
  }

  // Handle button click
  if (interaction.type === 3) {
    return handleButtonInteraction(interaction);
  }

  res.status(400).send('Unknown interaction type');
});
```

### Interaction Types

| Type | Name | Description |
|------|------|-------------|
| 1 | PING | Heartbeat from Discord |
| 2 | APPLICATION_COMMAND | Slash command |
| 3 | MESSAGE_COMPONENT | Button/Select menu |
| 4 | AUTOCOMPLETE | Autocomplete suggestion |
| 5 | MODAL_SUBMIT | Modal form submission |

---

## Method 3: Webhook Debugger (Production Debugging)

For debugging Discord webhooks in production:

### Step 1: Deploy Webhook Debugger

```bash
# Clone and install
git clone https://github.com/brancogao/webhook-debugger.git
cd webhook-debugger && npm install

# Set up Cloudflare (free tier)
npx wrangler login
npx wrangler d1 create webhook-debugger-db

# Deploy
npm run deploy
```

### Step 2: Create a Debugging Endpoint

1. Open your Webhook Debugger dashboard
2. Create a new endpoint (e.g., `/hook/discord-interactions`)
3. Copy the full URL

### Step 3: Configure Discord Bot

For interactions endpoint:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Navigate to **General Information**
4. Set **Interactions Endpoint URL** to your debugger URL

### Step 4: Debug Real Webhooks

When Discord sends an interaction, you'll see:
- **Interaction type** - Command, button, modal, etc.
- **Full payload** - User, guild, channel data
- **Signature headers** - X-Signature-Ed25519, X-Signature-Timestamp
- **Timestamp** - When the interaction occurred

**Key features for Discord debugging:**
- **90-day history** - Review past interactions
- **Full-text search** - Find by user ID, command name, guild
- **One-click replay** - Resend to your bot handler
- **Auto source detection** - Identifies Discord webhooks automatically

---

## Discord Webhook Security

### Ed25519 Signature Verification

Discord signs all interactions with Ed25519:

```typescript
import nacl from 'tweetnacl';

function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string,
  publicKey: string
): boolean {
  const message = Buffer.from(timestamp + body);
  const sig = Buffer.from(signature, 'hex');
  const pubKey = Buffer.from(publicKey, 'hex');

  return nacl.sign.detached.verify(message, sig, pubKey);
}

app.post('/interactions', (req, res) => {
  const signature = req.headers['x-signature-ed25519'] as string;
  const timestamp = req.headers['x-signature-timestamp'] as string;
  const body = JSON.stringify(req.body);

  if (!verifyDiscordSignature(
    body,
    signature,
    timestamp,
    process.env.DISCORD_PUBLIC_KEY
  )) {
    return res.status(401).send('Invalid signature');
  }

  // Process verified interaction
  // ...
});
```

### Webhook URL Security

Webhook URLs contain sensitive tokens:

```bash
# DON'T commit webhook URLs to git
# Use environment variables instead
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123/abc...
```

---

## Testing Discord Webhooks Locally

### Using ngrok

```bash
# Start your bot server
npm run dev  # Runs on port 3000

# Create tunnel
ngrok http 3000

# Use the HTTPS URL in Discord Developer Portal
# Example: https://abc123.ngrok.io/interactions
```

### Sample Interaction Payloads

**Ping (Type 1):**
```json
{
  "type": 1
}
```

**Slash Command (Type 2):**
```json
{
  "type": 2,
  "token": "aW50ZXJhY3Rpb246MTIz...",
  "member": {
    "user": {
      "id": "123456789",
      "username": "testuser",
      "discriminator": "0001"
    },
    "roles": ["987654321"],
    "permissions": "2147483647"
  },
  "guild_id": "111222333",
  "channel_id": "444555666",
  "data": {
    "id": "777888999",
    "name": "ping",
    "options": []
  }
}
```

**Button Click (Type 3):**
```json
{
  "type": 3,
  "token": "aW50ZXJhY3Rpb246...",
  "member": {
    "user": {"id": "123456789", "username": "user"}
  },
  "data": {
    "custom_id": "approve_button",
    "component_type": 2
  },
  "message": {
    "id": "111222333",
    "content": "Review pending"
  }
}
```

### Testing Webhook Messages

```bash
# Quick test with curl
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message from webhook debugger"}'
```

---

## Best Practices

1. **Always verify signatures** - Never process unverified interactions
2. **Respond within 3 seconds** - Discord requires quick ACK
3. **Use deferred responses** - For long-running operations
4. **Handle rate limits** - Discord has strict rate limiting
5. **Don't leak webhook URLs** - They're sensitive credentials
6. **Test embed limits** - Max 6000 characters total

---

## Rate Limits

Discord enforces rate limits on webhooks:

| Endpoint | Limit |
|----------|-------|
| Webhook URL | 30/minute per webhook |
| Global | 50/second |
| Channel | 5/second |

Implement proper retry logic:

```typescript
async function sendWithRetry(url: string, payload: object, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) return response;

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      await new Promise(r => setTimeout(r, parseInt(retryAfter) * 1000));
    } else if (response.status >= 500 && i < retries - 1) {
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    } else {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  }
}
```

---

## Related Guides

- [How to Debug Telegram Bot Webhooks](./telegram-webhooks.md)
- [Slack Event Debugging](./slack-events.md)
- [Webhook Security Best Practices](./webhook-security.md)

---

**Webhook Debugger** - The self-hosted webhook inspector for developers who value data privacy. [Get started free](https://github.com/brancogao/webhook-debugger).
