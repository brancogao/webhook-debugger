# How to Test Twilio Webhooks

> A complete guide to testing and debugging Twilio SMS and Voice webhooks locally and in production using Webhook Debugger.

Twilio webhooks power SMS delivery tracking, voice call handling, and messaging analytics. When these webhooks fail, you lose visibility into critical communications. This guide shows you how to debug Twilio webhooks effectively.

## Table of Contents

- [Why Twilio Webhook Debugging Matters](#why-twilio-webhook-debugging-matters)
- [Common Twilio Webhook Issues](#common-twilio-webhook-issues)
- [Method 1: Twilio CLI & ngrok (Local Testing)](#method-1-twilio-cli--ngrok-local-testing)
- [Method 2: Webhook Debugger (Production Debugging)](#method-2-webhook-debugger-production-debugging)
- [Twilio Webhook Signature Verification](#twilio-webhook-signature-verification)
- [Testing Specific Twilio Events](#testing-specific-twilio-events)

---

## Why Twilio Webhook Debugging Matters

Twilio uses webhooks to notify your application about:

- **SMS status updates** - Delivered, failed, undelivered
- **Incoming SMS** - Receive text messages
- **Voice call status** - Call initiated, ringing, completed
- **Call recording** - Recording available for download
- **Conversation events** - WhatsApp, Facebook Messenger

When these webhooks fail, you can't track message delivery or respond to customer communications.

---

## Common Twilio Webhook Issues

| Issue | Symptom | Debug Approach |
|-------|---------|----------------|
| **Wrong webhook URL** | 404 errors | Check Twilio console settings |
| **HTTP vs HTTPS** | Connection refused | Twilio requires HTTPS |
| **Invalid response** | 500 errors | Return valid TwiML |
| **Timeout** | 504 errors | Keep responses under 15 seconds |
| **Missing parameters** | Parse errors | Check required fields |
| **Signature mismatch** | Security rejection | Verify auth token |

---

## Method 1: Twilio CLI & ngrok (Local Testing)

For local development, use ngrok to expose your localhost:

```bash
# Install Twilio CLI
brew install twilio/brew/twilio

# Login to Twilio
twilio login

# Start ngrok tunnel
ngrok http 3000

# Copy your ngrok URL (e.g., https://abc123.ngrok.io)
```

Then configure Twilio webhooks:

1. Go to [Twilio Console > Phone Numbers](https://www.twilio.com/console/phone-numbers)
2. Select your phone number
3. Set webhook URL: `https://abc123.ngrok.io/webhooks/twilio`
4. Save changes

**Trigger test SMS:**

```bash
# Send test SMS
twilio api:core:messages:create \
  --from +1234567890 \
  --to +0987654321 \
  --body "Test message for webhook debugging"
```

**Limitations:**
- ngrok URL changes on restart (free tier)
- Can't debug production issues
- No history persistence

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
2. Create a new endpoint (e.g., `/hook/twilio-production`)
3. Copy the full URL

### Step 3: Configure Twilio

1. Go to [Twilio Console > Phone Numbers](https://www.twilio.com/console/phone-numbers)
2. Select your phone number
3. Under "Messaging", set webhook URL to your debugger
4. Under "Voice", set webhook URL to your debugger
5. Save changes

### Step 4: Debug Real Webhooks

When Twilio sends a webhook, you'll see:
- Full HTTP headers (including `X-Twilio-Signature`)
- URL-encoded form data or JSON payload
- Timestamp
- Request method and path

**Key features for Twilio debugging:**
- **90-day history** - Review past webhooks for audit trails
- **Full-text search** - Find webhooks by phone number, message SID
- **One-click replay** - Resend webhooks to test fixes
- **Auto source detection** - Automatically identifies Twilio webhooks

---

## Twilio Webhook Signature Verification

Twilio signs all webhooks. Always verify signatures in production:

```typescript
import crypto from 'crypto';

function verifyTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
  authToken: string
): boolean {
  // Build the signature string
  const signatureString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [key, value]) => acc + key + value, url);

  // Calculate expected signature
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(signatureString)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

app.post('/webhooks/twilio', (req, res) => {
  const signature = req.headers['x-twilio-signature'] as string;
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  if (!verifyTwilioSignature(signature, url, req.body, process.env.TWILIO_AUTH_TOKEN)) {
    return res.status(403).send('Invalid signature');
  }

  // Process webhook
  console.log('Message SID:', req.body.MessageSid);
  console.log('Status:', req.body.MessageStatus);

  // Return valid TwiML
  res.type('text/xml').send('<Response></Response>');
});
```

---

## Testing Specific Twilio Events

### SMS Status Callbacks

Twilio sends status callbacks for SMS messages:

| Status | Meaning |
|--------|---------|
| `queued` | Message queued by Twilio |
| `sent` | Message sent to carrier |
| `delivering` | Carrier is attempting delivery |
| `delivered` | Successfully delivered |
| `undelivered` | Delivery failed |
| `failed` | Message could not be sent |

**Configure status callback:**

```bash
twilio api:core:messages:create \
  --from +1234567890 \
  --to +0987654321 \
  --body "Test message" \
  --status-callback "https://your-debugger.workers.dev/hook/twilio-status"
```

### Voice Call Webhooks

Handle incoming voice calls:

```typescript
import { VoiceResponse } from 'twilio';

app.post('/webhooks/twilio/voice', (req, res) => {
  const twiml = new VoiceResponse();

  // Log incoming call
  console.log('Call from:', req.body.From);
  console.log('Call to:', req.body.To);

  // Respond with TwiML
  twiml.say('Thanks for calling!');
  twiml.hangup();

  res.type('text/xml').send(twiml.toString());
});
```

### WhatsApp Webhooks

WhatsApp messages come through the same webhook:

```typescript
app.post('/webhooks/twilio', (req, res) => {
  // Check if it's a WhatsApp message
  if (req.body.AccountSid) {
    const from = req.body.From; // whatsapp:+1234567890
    const body = req.body.Body;
    const numMedia = parseInt(req.body.NumMedia || '0');

    // Handle media attachments
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = req.body[`MediaUrl${i}`];
      const mediaType = req.body[`MediaContentType${i}`];
      console.log(`Media ${i}:`, mediaUrl, mediaType);
    }
  }

  res.type('text/xml').send('<Response></Response>');
});
```

---

## Best Practices

1. **Always verify signatures** - Prevent webhook forgery
2. **Respond quickly** - Twilio expects response within 15 seconds
3. **Return valid TwiML** - Empty `<Response></Response>` is valid
4. **Handle retries** - Twilio retries failed webhooks up to 4 hours
5. **Log all webhooks** - Essential for debugging and audits
6. **Use HTTPS** - Required for all production webhooks

---

## Related Guides

- [How to Debug Stripe Webhooks](./stripe-webhooks.md)
- [SendGrid Webhook Events Guide](./sendgrid-webhooks.md)
- [Webhook Security Best Practices](./webhook-security.md)

---

**Webhook Debugger** - The self-hosted webhook inspector for developers who value data privacy. [Get started free](https://github.com/brancogao/webhook-debugger).
