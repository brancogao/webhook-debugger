# How to Debug Intercom Webhooks

> A complete guide to testing and debugging Intercom webhooks for customer support automation using Webhook Debugger.

Intercom webhooks power real-time customer support automation. This guide shows you how to inspect, test, and debug Intercom webhooks effectively.

## Table of Contents

- [Why Intercom Webhook Debugging Matters](#why-intercom-webhook-debugging-matters)
- [Common Intercom Webhook Issues](#common-intercom-webhook-issues)
- [Intercom Webhook Topics](#intercom-webhook-topics)
- [Method 1: Intercom Developer Hub (Basic Testing)](#method-1-intercom-developer-hub-basic-testing)
- [Method 2: Webhook Debugger (Production Debugging)](#method-2-webhook-debugger-production-debugging)
- [Intercom Webhook Signature Verification](#intercom-webhook-signature-verification)
- [Testing Intercom Webhooks Locally](#testing-intercom-webhooks-locally)

---

## Why Intercom Webhook Debugging Matters

Intercom webhooks notify your system about customer interactions:

- **New conversation started** - Route to the right team
- **User created/updated** - Sync with your CRM
- **Conversation assigned** - Update support metrics
- **Tag added/removed** - Trigger automation workflows
- **Reply received** - Update ticket status

When these webhooks fail, customer support suffers. **Proper debugging tools prevent missed tickets and delayed responses.**

---

## Common Intercom Webhook Issues

| Issue | Symptom | Debug Approach |
|-------|---------|----------------|
| **Invalid signature** | 401 unauthorized | Verify X-Hub-Signature header |
| **Wrong JSON format** | Parsing errors | Check topic_data structure |
| **Missing topic** | Events ignored | Verify webhook subscription |
| **Rate limiting** | 429 errors | Implement backoff strategy |
| **Timeout** | 504 errors | Optimize webhook handler |
| **Duplicate events** | Repeated actions | Implement idempotency |

---

## Intercom Webhook Topics

Intercom sends different topic types based on events:

### Conversation Topics

```json
{
  "type": "notification_event",
  "topic": "conversation.user.created",
  "data": {
    "item": {
      "type": "conversation",
      "id": "12345",
      "conversation_parts": {...}
    }
  }
}
```

### User Topics

```json
{
  "type": "notification_event",
  "topic": "user.created",
  "data": {
    "item": {
      "type": "user",
      "id": "54321",
      "email": "user@example.com"
    }
  }
}
```

### Available Topics

| Topic | Description |
|-------|-------------|
| `conversation.user.created` | User started a conversation |
| `conversation.user.replied` | User replied to conversation |
| `conversation.admin.replied` | Admin replied to conversation |
| `conversation.admin.assigned` | Conversation assigned to admin |
| `conversation.admin.closed` | Conversation closed |
| `user.created` | New user created |
| `user.updated` | User profile updated |
| `user.deleted` | User deleted |
| `contact.created` | New lead/contact created |
| `contact.signed_up` | Lead converted to user |
| `tag.created` | Tag created |
| `tag.deleted` | Tag deleted |

---

## Method 1: Intercom Developer Hub (Basic Testing)

Intercom provides basic webhook testing in their developer hub:

1. Go to [Intercom Developer Hub](https://developers.intercom.com/)
2. Create or select your app
3. Navigate to **Webhooks** > **Configure**
4. Use the "Send test notification" button

**Limitations:**
- Only sends sample data
- Can't test real user events
- No history of webhook deliveries

---

## Method 2: Webhook Debugger (Production Debugging)

For real-world Intercom webhook debugging:

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
2. Create a new endpoint (e.g., `/hook/intercom-production`)
3. Copy the full URL

### Step 3: Configure Intercom Webhook

1. Go to **Intercom Dashboard** > **Developer Hub**
2. Select your app > **Webhooks**
3. Add endpoint: `https://your-debugger.workers.dev/hook/intercom-production`
4. Select topics to subscribe to
5. Save and verify

### Step 4: Debug Real Webhooks

When Intercom sends a webhook, you'll see:
- **Full topic type** - Know exactly what triggered
- **Complete payload** - User/conversation data
- **Headers** - Including X-Hub-Signature
- **Timestamp** - When the event occurred

**Key features for Intercom debugging:**
- **90-day history** - Review past support events
- **Full-text search** - Find webhooks by user email, conversation ID
- **One-click replay** - Resend to your actual handler
- **Auto source detection** - Identifies Intercom webhooks automatically

---

## Intercom Webhook Signature Verification

Intercom signs webhooks with HMAC-SHA1. Always verify:

```typescript
import crypto from 'crypto';

function verifyIntercomWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha1', secret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

app.post('/webhooks/intercom', (req, res) => {
  const signature = req.headers['x-hub-signature'];
  const secret = process.env.INTERCOM_CLIENT_SECRET;

  if (!verifyIntercomWebhook(req.rawBody, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }

  const { topic, data } = req.body;

  switch (topic) {
    case 'conversation.user.created':
      handleNewConversation(data.item);
      break;
    case 'user.created':
      syncUserToCRM(data.item);
      break;
    // ... handle other topics
  }

  res.status(200).send('OK');
});
```

---

## Testing Intercom Webhooks Locally

### Using ngrok + Webhook Debugger

```bash
# Start your local server
npm run dev  # Assuming it runs on port 3000

# Create ngrok tunnel
ngrok http 3000

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Use this URL in Intercom webhook config
```

### Sample Intercom Webhook Payload

Use this to test your handler locally:

```json
{
  "type": "notification_event",
  "topic": "conversation.user.created",
  "created_at": 1708300000,
  "delivery_attempts": 1,
  "first_delivery_at": 1708300000,
  "data": {
    "type": "notification_event_data",
    "item": {
      "type": "conversation",
      "id": "123456789",
      "created_at": 1708300000,
      "updated_at": 1708300000,
      "source": {
        "type": "conversation",
        "id": "123456789",
        "delivered_as": "email"
      },
      "contacts": {
        "type": "contact.list",
        "contacts": [
          {
            "type": "contact",
            "id": "987654321",
            "external_id": "ext_123",
            "email": "customer@example.com"
          }
        ]
      }
    }
  }
}
```

---

## Best Practices

1. **Verify all signatures** - Don't trust unverified webhooks
2. **Handle topic routing** - Different topics need different handlers
3. **Implement idempotency** - Intercom may resend failed webhooks
4. **Log everything** - Essential for support debugging
5. **Return 200 quickly** - Intercom has a 10-second timeout
6. **Use the right secret** - Client secret, not API key

---

## Related Guides

- [How to Debug Stripe Webhooks](./stripe-webhooks.md)
- [Slack Event Debugging](./slack-events.md)
- [Webhook Security Best Practices](./webhook-security.md)

---

**Webhook Debugger** - The self-hosted webhook inspector for developers who value data privacy. [Get started free](https://github.com/brancogao/webhook-debugger).
