# How to Debug SendGrid Webhook Events

> A complete guide to testing and debugging SendGrid email event webhooks locally and in production using Webhook Debugger.

SendGrid webhooks (Event Webhooks) deliver real-time email analytics—opens, clicks, bounces, and more. When these webhooks fail, you lose visibility into email deliverability and engagement. This guide shows you how to debug SendGrid webhooks effectively.

## Table of Contents

- [Why SendGrid Webhook Debugging Matters](#why-sendgrid-webhook-debugging-matters)
- [Common SendGrid Webhook Issues](#common-sendgrid-webhook-issues)
- [Method 1: SendGrid Inbound Parse (Local Testing)](#method-1-sendgrid-inbound-parse-local-testing)
- [Method 2: Webhook Debugger (Production Debugging)](#method-2-webhook-debugger-production-debugging)
- [SendGrid Webhook Signature Verification](#sendgrid-webhook-signature-verification)
- [Testing Specific SendGrid Events](#testing-specific-sendgrid-events)

---

## Why SendGrid Webhook Debugging Matters

SendGrid Event Webhooks notify your application about:

- **Email delivered** - Message reached recipient's mail server
- **Email opened** - Recipient opened the email (tracking pixel)
- **Link clicked** - Recipient clicked a tracked link
- **Email bounced** - Delivery failed (hard/soft bounce)
- **Spam report** - Recipient marked as spam
- **Unsubscribed** - Recipient opted out
- **Deferred** - Delivery temporarily delayed

When these webhooks fail, you can't track email performance or respond to deliverability issues.

---

## Common SendGrid Webhook Issues

| Issue | Symptom | Debug Approach |
|-------|---------|----------------|
| **Wrong endpoint URL** | 404 errors | Check SendGrid settings |
| **HTTPS required** | Connection refused | Use SSL/TLS |
| **Missing signature header** | Security bypass | Enable signed events |
| **Batch size too large** | Timeout errors | Adjust batch settings |
| **JSON parsing errors** | 400 bad request | Validate payload format |
| **Firewall blocking** | Connection timeout | Whitelist SendGrid IPs |

---

## Method 1: SendGrid Inbound Parse (Local Testing)

For local development, use ngrok to receive SendGrid webhooks:

```bash
# Start your local server
npm run dev  # Assuming port 3000

# Start ngrok tunnel
ngrok http 3000

# Copy your ngrok URL (e.g., https://abc123.ngrok.io)
```

Configure SendGrid webhook:

1. Go to [SendGrid Settings > Mail Settings](https://app.sendgrid.com/settings/mail_settings)
2. Enable "Event Webhook"
3. Set URL: `https://abc123.ngrok.io/webhooks/sendgrid`
4. Select events to track
5. Enable "Signed Event Webhook" for security

**Send test email:**

```bash
# Using SendGrid API
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "sender@example.com"},
    "subject": "Test Email",
    "content": [{"type": "text/plain", "value": "This is a test"}]
  }'
```

**Limitations:**
- ngrok URL changes on restart (free tier)
- Can't debug production issues retroactively
- No persistent history

---

## Method 2: Webhook Debugger (Production Debugging)

For production webhook debugging, use Webhook Debugger:

### Step 1: Deploy Your Instance

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

### Step 2: Create a Webhook Endpoint

1. Open your Webhook Debugger dashboard
2. Create a new endpoint (e.g., `/hook/sendgrid-events`)
3. Copy the full URL

### Step 3: Configure SendGrid

1. Go to [SendGrid Settings > Mail Settings](https://app.sendgrid.com/settings/mail_settings)
2. Find "Event Webhook" and click "Edit"
3. Set Authorization Method: "Signed Event Webhook" (recommended)
4. Enter your webhook debugger URL
5. Select events: Delivered, Opened, Clicked, Bounced, etc.
6. Save changes

### Step 4: Debug Real Webhooks

When SendGrid sends events, you'll see:
- Full HTTP headers (including `X-Twilio-Email-Event-Webhook-Signature`)
- JSON array of events
- Timestamp
- Event types and categories

**Key features for SendGrid debugging:**
- **90-day history** - Review email events for analytics
- **Full-text search** - Find events by email address, message ID
- **One-click replay** - Resend events to test your handlers
- **Auto source detection** - Automatically identifies SendGrid webhooks

---

## SendGrid Webhook Signature Verification

SendGrid signs webhooks when "Signed Event Webhook" is enabled. Always verify:

```typescript
import crypto from 'crypto';

function verifySendGridSignature(
  payload: string,
  signature: string,
  timestamp: string,
  publicKey: string
): boolean {
  // Create the payload to verify
  const payloadToVerify = timestamp + payload;

  // Verify with ECDSA
  const verify = crypto.createVerify('SHA256');
  verify.update(payloadToVerify);
  verify.end();

  // Convert base64 signature to buffer
  const signatureBuffer = Buffer.from(signature, 'base64');

  // Verify using SendGrid's public key
  return verify.verify(publicKey, signatureBuffer);
}

app.post('/webhooks/sendgrid', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
  const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;

  // Verify signature (when enabled)
  if (signature && timestamp) {
    const isValid = verifySendGridSignature(
      req.body.toString(),
      signature,
      timestamp,
      process.env.SENDGRID_PUBLIC_KEY
    );

    if (!isValid) {
      return res.status(403).send('Invalid signature');
    }
  }

  // Parse events (SendGrid sends arrays)
  const events = JSON.parse(req.body.toString());

  for (const event of events) {
    console.log('Event:', event.event);
    console.log('Email:', event.email);
    console.log('Message ID:', event.sg_message_id);
  }

  res.status(200).send('OK');
});
```

---

## Testing Specific SendGrid Events

SendGrid sends events in batches. Each webhook payload is a JSON array:

### Email Delivery Events

```json
[
  {
    "email": "recipient@example.com",
    "event": "delivered",
    "sg_message_id": "1a2b3c4d5e6f7g8h",
    "timestamp": 1640000000,
    "sg_event_id": "abc123",
    "sg_template_id": "template-123"
  }
]
```

### Engagement Events

```json
[
  {
    "email": "recipient@example.com",
    "event": "open",
    "sg_message_id": "1a2b3c4d5e6f7g8h",
    "timestamp": 1640000100,
    "user-agent": "Mozilla/5.0...",
    "sg_event_id": "def456"
  },
  {
    "email": "recipient@example.com",
    "event": "click",
    "sg_message_id": "1a2b3c4d5e6f7g8h",
    "timestamp": 1640000200,
    "url": "https://example.com/cta",
    "sg_event_id": "ghi789"
  }
]
```

### Bounce and Spam Events

```json
[
  {
    "email": "bounce@example.com",
    "event": "bounce",
    "sg_message_id": "1a2b3c4d5e6f7g8h",
    "timestamp": 1640000300,
    "bounce_classification": "Invalid",
    "reason": "550 5.1.1 User unknown",
    "status": "5.1.1"
  },
  {
    "email": "complain@example.com",
    "event": "spamreport",
    "sg_message_id": "1a2b3c4d5e6f7g8h",
    "timestamp": 1640000400
  }
]
```

### Event Types Reference

| Event | Description | When It Fires |
|-------|-------------|---------------|
| `processed` | Message received by SendGrid | Immediately |
| `delivered` | Accepted by receiving server | After delivery |
| `deferred` | Delivery delayed | On retry |
| `delivered` | Successfully delivered | On success |
| `bounce` | Permanent failure | On hard bounce |
| `dropped` | Message not sent | On suppression |
| `open` | Recipient opened email | On pixel load |
| `click` | Recipient clicked link | On link click |
| `spamreport` | Marked as spam | On spam report |
| `unsubscribe` | Recipient opted out | On unsubscribe |

---

## Best Practices

1. **Enable signed webhooks** - Prevent forgery and injection attacks
2. **Handle batches** - SendGrid sends multiple events per webhook
3. **Respond quickly** - Return 200 within 3 seconds
4. **Process asynchronously** - Don't block the response
5. **Handle duplicates** - Same event may be sent twice (use `sg_event_id`)
6. **Log all events** - Essential for debugging deliverability issues
7. **Monitor bounce rate** - Keep under 5% to maintain sender reputation

---

## Related Guides

- [How to Debug Stripe Webhooks](./stripe-webhooks.md)
- [Twilio Webhook Testing Guide](./twilio-webhooks.md)
- [Webhook Security Best Practices](./webhook-security.md)

---

**Webhook Debugger** - The self-hosted webhook inspector for developers who value data privacy. [Get started free](https://github.com/brancogao/webhook-debugger).
