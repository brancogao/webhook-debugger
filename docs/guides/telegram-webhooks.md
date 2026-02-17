# How to Debug Telegram Bot Webhooks

> A complete guide to testing and debugging Telegram Bot API webhooks using Webhook Debugger.

Telegram bots use webhooks to receive real-time updates. This guide shows you how to inspect, test, and debug Telegram bot webhooks effectively.

## Table of Contents

- [Why Telegram Webhook Debugging Matters](#why-telegram-webhook-debugging-matters)
- [Common Telegram Webhook Issues](#common-telegram-webhook-issues)
- [Telegram Update Types](#telegram-update-types)
- [Method 1: Telegram Bot API (Basic Testing)](#method-1-telegram-bot-api-basic-testing)
- [Method 2: Webhook Debugger (Production Debugging)](#method-2-webhook-debugger-production-debugging)
- [Telegram Webhook Security](#telegram-webhook-security)
- [Testing Telegram Webhooks Locally](#testing-telegram-webhooks-locally)

---

## Why Telegram Webhook Debugging Matters

Telegram bots receive updates via webhooks for:

- **Messages** - User sends text, photo, document
- **Callback queries** - Inline button clicks
- **Inline queries** - User types @bot in chat
- **Edited messages** - User edits their message
- **Channel posts** - Bot added to channel
- **My chat member** - Bot added/removed from chat

When webhooks fail, your bot becomes unresponsive. **Proper debugging ensures reliable bot behavior.**

---

## Common Telegram Webhook Issues

| Issue | Symptom | Debug Approach |
|-------|---------|----------------|
| **Invalid webhook URL** | 400 Bad Request | Use HTTPS URL |
| **Self-signed certificate** | 401 Unauthorized | Use valid SSL cert |
| **Wrong response format** | Bot doesn't respond | Return 200 OK |
| **Timeout** | Repeated delivery | Optimize handler |
| **Port blocked** | Connection refused | Use port 443/80/88/8443 |
| **Rate limiting** | Updates delayed | Process faster |

---

## Telegram Update Types

Telegram sends various update types in webhooks:

### Message Update

```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "John",
      "username": "johndoe"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "date": 1708300000,
    "text": "Hello bot!"
  }
}
```

### Callback Query Update

```json
{
  "update_id": 123456790,
  "callback_query": {
    "id": "123456789012345678",
    "from": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "John"
    },
    "message": {
      "message_id": 10,
      "chat": {"id": 123456789, "type": "private"}
    },
    "data": "button_click_1"
  }
}
```

### Available Update Types

| Type | Description |
|------|-------------|
| `message` | New message received |
| `edited_message` | Message edited |
| `channel_post` | New channel post |
| `edited_channel_post` | Channel post edited |
| `inline_query` | Inline query (@bot query) |
| `callback_query` | Button callback |
| `my_chat_member` | Bot's chat membership changed |
| `chat_member` | Chat member status changed |

---

## Method 1: Telegram Bot API (Basic Testing)

### Set Webhook

```bash
# Set your webhook URL
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/webhook/telegram"}'
```

### Get Webhook Info

```bash
# Check webhook status
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

Response example:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-domain.com/webhook/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": 0
  }
}
```

### Delete Webhook (for testing)

```bash
# Remove webhook to use getUpdates instead
curl "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"
```

---

## Method 2: Webhook Debugger (Production Debugging)

For real-world Telegram bot debugging:

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
2. Create a new endpoint (e.g., `/hook/telegram-bot`)
3. Copy the full URL

### Step 3: Configure Telegram Webhook

```bash
# Set webhook to your debugger
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-debugger.workers.dev/hook/telegram-bot"}'
```

### Step 4: Debug Real Webhooks

When Telegram sends an update, you'll see:
- **update_id** - Sequential update identifier
- **Full message object** - Text, media, entities
- **User information** - Who sent the message
- **Chat details** - Where the message was sent

**Key features for Telegram debugging:**
- **90-day history** - Review past bot interactions
- **Full-text search** - Find updates by user, chat ID, or message content
- **One-click replay** - Resend updates to your bot handler
- **Auto source detection** - Identifies Telegram webhooks automatically

---

## Telegram Webhook Security

### Secret Token (Recommended)

Telegram supports a secret token for webhook verification:

```bash
# Set webhook with secret token
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/webhook/telegram",
    "secret_token": "YOUR_SECRET_TOKEN_HERE"
  }'
```

### Verify Secret Token

```typescript
import crypto from 'crypto';

app.post('/webhook/telegram', (req, res) => {
  // Verify secret token header
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];

  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(401).send('Unauthorized');
  }

  const update = req.body;

  // Process update
  if (update.message) {
    handleMessage(update.message);
  } else if (update.callback_query) {
    handleCallback(update.callback_query);
  }

  // Must return 200 OK
  res.status(200).send('OK');
});
```

### IP Whitelisting (Alternative)

Telegram sends webhooks from specific IP ranges:
- `149.154.160.0/20`
- `91.108.4.0/22`

```typescript
// Middleware to check IP
function telegramIPOnly(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;

  // Check if IP is in Telegram ranges
  if (!isTelegramIP(clientIP)) {
    return res.status(403).send('Forbidden');
  }

  next();
}
```

---

## Testing Telegram Webhooks Locally

### Using ngrok

```bash
# Start your bot server
npm run dev  # Runs on port 3000

# Create tunnel
ngrok http 3000

# Copy HTTPS URL and set as webhook
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d '{"url": "https://abc123.ngrok.io/webhook/telegram"}'
```

### Sample Telegram Webhook Payload

Test your handler with this payload:

```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "Test",
      "last_name": "User",
      "username": "testuser",
      "language_code": "en"
    },
    "chat": {
      "id": 123456789,
      "first_name": "Test",
      "last_name": "User",
      "username": "testuser",
      "type": "private"
    },
    "date": 1708300000,
    "text": "/start"
  }
}
```

### Testing with Telegram CLI

```bash
# Send test message to your bot via user account
# Use @BotFather to get your bot's username
```

---

## Best Practices

1. **Always return 200 OK** - Telegram will retry non-200 responses
2. **Handle duplicates** - Same update_id may be delivered multiple times
3. **Process asynchronously** - Don't block the webhook response
4. **Use secret token** - Verify webhook authenticity
5. **Monitor pending updates** - Check getWebhookInfo regularly
6. **Handle rate limits** - Telegram has message limits per second

---

## Related Guides

- [How to Debug Discord Webhooks](./discord-webhooks.md)
- [Slack Event Debugging](./slack-events.md)
- [Webhook Security Best Practices](./webhook-security.md)

---

**Webhook Debugger** - The self-hosted webhook inspector for developers who value data privacy. [Get started free](https://github.com/brancogao/webhook-debugger).
