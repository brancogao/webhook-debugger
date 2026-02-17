# Webhook Security Best Practices

> A comprehensive guide to securing webhook endpoints and preventing common attacks.

Webhooks are powerful integration tools, but they also create security risks. Without proper protection, attackers can forge webhooks, inject malicious payloads, or exfiltrate sensitive data. This guide covers essential security practices for production webhook handlers.

## Table of Contents

- [Why Webhook Security Matters](#why-webhook-security-matters)
- [Common Webhook Security Threats](#common-webhook-security-threats)
- [1. Always Verify Signatures](#1-always-verify-signatures)
- [2. Use HTTPS Everywhere](#2-use-https-everywhere)
- [3. Validate Webhook Origins](#3-validate-webhook-origins)
- [4. Implement Idempotency](#4-implement-idempotency)
- [5. Rate Limit and Timeout](#5-rate-limit-and-timeout)
- [6. Log and Monitor](#6-log-and-monitor)
- [7. Handle Sensitive Data Carefully](#7-handle-sensitive-data-carefully)
- [Security Checklist](#security-checklist)

---

## Why Webhook Security Matters

Webhooks expose a public HTTP endpoint that anyone can call. Without security measures:

- **Data injection** - Attackers can inject fake events into your system
- **Replay attacks** - Old webhooks can be resent to trigger actions
- **Timing attacks** - Response timing can leak information
- **Data exposure** - Sensitive data in logs can be compromised
- **DoS attacks** - Overwhelming your endpoint with requests

**The stakes are high:** A forged Stripe webhook could create free subscriptions. A fake GitHub webhook could merge malicious code.

---

## Common Webhook Security Threats

| Threat | Attack Vector | Impact |
|--------|---------------|--------|
| **Forgery** | Attacker sends fake webhook | Fraudulent transactions |
| **Replay** | Resending old webhooks | Duplicate actions |
| **Man-in-the-middle** | Intercepting webhook traffic | Data theft |
| **Injection** | Malicious payload content | SQL injection, XSS |
| **DDoS** | Overwhelming endpoint | Service outage |
| **Timing attack** | Measuring signature check time | Signature bypass |

---

## 1. Always Verify Signatures

Signature verification is the #1 most important webhook security measure. Most webhook providers sign their payloads:

### HMAC-Based Signatures (Stripe, GitHub, Shopify)

```typescript
import crypto from 'crypto';

function verifyHmacSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  const expectedSignature = crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Stripe example
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['stripe-signature'];

  // Verify using Stripe SDK
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    // Event is verified - process it
    res.json({ received: true });
  } catch (err) {
    // Verification failed - reject
    res.status(400).send('Invalid signature');
  }
});
```

### Important: Get Raw Body

**Common mistake:** Using parsed JSON body for signature verification.

```typescript
// ❌ WRONG - parsed body doesn't match original bytes
app.post('/webhook', express.json(), (req, res) => {
  const payload = JSON.stringify(req.body); // This may differ from original!
  // Signature won't match
});

// ✅ CORRECT - get raw body as buffer
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const payload = req.body; // Raw buffer
  // Now signature will match
});
```

### Timestamp-Based Verification (Stripe, Slack)

Some providers include a timestamp to prevent replay attacks:

```typescript
function verifyTimestampedSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string,
  toleranceSeconds: number = 300 // 5 minutes
): boolean {
  // Check timestamp is within tolerance
  const now = Math.floor(Date.now() / 1000);
  const webhookTime = parseInt(timestamp, 10);

  if (Math.abs(now - webhookTime) > toleranceSeconds) {
    return false; // Too old or too new
  }

  // Verify signature with timestamp included
  const signedPayload = `${timestamp}.${payload}`;
  return verifyHmacSignature(signedPayload, signature, secret);
}
```

---

## 2. Use HTTPS Everywhere

**Never use HTTP for webhook endpoints.**

```bash
# ❌ WRONG - unencrypted
http://api.example.com/webhooks/stripe

# ✅ CORRECT - encrypted with TLS
https://api.example.com/webhooks/stripe
```

### SSL/TLS Best Practices

1. **Use valid certificates** - Not self-signed
2. **Enable TLS 1.2+** - Disable older protocols
3. **Use strong cipher suites** - Consult SSL Labs
4. **Enable HSTS** - Force HTTPS

```typescript
// Express example - redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});
```

---

## 3. Validate Webhook Origins

Even with signature verification, add additional origin validation:

### IP Whitelisting

Some providers publish their webhook IP ranges:

```typescript
// GitHub's webhook IP ranges (example)
const GITHUB_IPS = [
  '192.30.252.0/22',
  '185.199.108.0/22',
  '140.82.112.0/20',
  '143.55.64.0/20',
];

function isIpInCIDR(ip: string, cidr: string): boolean {
  // Implementation for CIDR matching
  // Use a library like 'ip' or 'cidr-matcher'
}

app.post('/webhooks/github', (req, res) => {
  const sourceIp = req.ip || req.headers['x-forwarded-for'];

  // Validate IP is from GitHub
  const isFromGitHub = GITHUB_IPS.some(cidr =>
    isIpInCIDR(sourceIp, cidr)
  );

  if (!isFromGitHub) {
    return res.status(403).send('Invalid origin');
  }

  // Continue with signature verification
});
```

### User-Agent Validation

Check the User-Agent header:

```typescript
const ALLOWED_USER_AGENTS = [
  'GitHub-Hookshot/',
  'Stripe/',
  'Shopify/',
  'Twilio/',
];

function isValidUserAgent(userAgent: string): boolean {
  return ALLOWED_USER_AGENTS.some(allowed =>
    userAgent.startsWith(allowed)
  );
}
```

---

## 4. Implement Idempotency

Webhook providers may send the same event multiple times. Your system must handle this gracefully:

```typescript
// Using a database to track processed events
async function processWebhook(eventId: string, eventData: any) {
  // Check if already processed
  const existing = await db.webhookEvents.findUnique({
    where: { id: eventId }
  });

  if (existing) {
    console.log(`Event ${eventId} already processed, skipping`);
    return { status: 'duplicate' };
  }

  // Process in transaction
  await db.$transaction(async (tx) => {
    // Mark as processing
    await tx.webhookEvents.create({
      data: { id: eventId, status: 'processing' }
    });

    // Do the actual work
    await performAction(eventData);

    // Mark as complete
    await tx.webhookEvents.update({
      where: { id: eventId },
      data: { status: 'completed' }
    });
  });

  return { status: 'processed' };
}
```

### Idempotency Key Best Practices

1. **Use provider's event ID** - Stripe's `event.id`, GitHub's `delivery_id`
2. **Set expiration** - Don't keep idempotency keys forever (30-90 days)
3. **Handle concurrent requests** - Use database locks or atomic operations
4. **Return same response** - For duplicates, return the original response

---

## 5. Rate Limit and Timeout

Protect your webhook endpoint from abuse:

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests',
  // Use provider's identifier (IP, signature, etc.)
  keyGenerator: (req) => {
    return req.headers['x-webhook-signature'] || req.ip;
  }
});

app.post('/webhooks/:provider', webhookLimiter, handler);
```

### Request Timeout

```typescript
app.post('/webhooks/:provider', (req, res) => {
  // Set a timeout
  req.setTimeout(5000, () => {
    res.status(408).send('Request timeout');
  });

  // Process webhook
  processWebhookAsync(req.body)
    .then(() => res.status(200).send('OK'))
    .catch(err => res.status(500).send('Error'));
});
```

### Best Practice: Quick Response

Return 200 immediately, process asynchronously:

```typescript
app.post('/webhooks/:provider', express.raw({ type: 'application/json' }), (req, res) => {
  // Verify signature first
  if (!verifySignature(req)) {
    return res.status(400).send('Invalid signature');
  }

  // Quick response
  res.status(200).send('OK');

  // Process in background
  queueWebhookForProcessing(req.body);
});
```

---

## 6. Log and Monitor

Comprehensive logging is essential for security and debugging:

### What to Log

```typescript
interface WebhookLog {
  // Identifiers
  eventId: string;
  provider: string;
  receivedAt: Date;

  // Request details
  sourceIp: string;
  userAgent: string;
  headers: Record<string, string>;

  // Payload (be careful with sensitive data)
  payloadHash: string; // SHA-256 hash, not full payload

  // Processing
  signatureValid: boolean;
  processingTimeMs: number;
  httpStatus: number;

  // Result
  success: boolean;
  errorMessage?: string;
}

function logWebhook(log: WebhookLog) {
  // Log to your monitoring system
  console.log(JSON.stringify(log));

  // Alert on suspicious patterns
  if (!log.signatureValid) {
    alertSecurity(`Invalid signature from ${log.sourceIp}`);
  }
}
```

### Alerting Rules

Set up alerts for:

1. **High failure rate** - More than 5% of webhooks failing
2. **Invalid signatures** - Any signature verification failure
3. **Unusual volume** - Spike in webhook requests
4. **Unknown sources** - Webhooks from unexpected IPs
5. **Slow processing** - Response time > 5 seconds

---

## 7. Handle Sensitive Data Carefully

Webhooks often contain sensitive data. Handle with care:

### What NOT to Log

```typescript
// ❌ NEVER log these:
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'api_key',
  'credit_card',
  'cvv',
  'ssn',
  'email', // Depending on context
  'phone', // Depending on context
];

function sanitizePayload(payload: any): any {
  const sanitized = { ...payload };

  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}
```

### Encrypt at Rest

If you store webhook payloads:

```typescript
import { encrypt, decrypt } from './crypto';

async function storeWebhook(eventId: string, payload: any) {
  const encrypted = encrypt(JSON.stringify(payload));

  await db.webhooks.create({
    data: {
      id: eventId,
      payload: encrypted,
      encrypted: true
    }
  });
}
```

### Use Webhook Debugger for Safe Debugging

Webhook Debugger is designed with privacy in mind:

- **Self-hosted** - Your data stays on your infrastructure
- **Auto-detection** - Identifies sensitive fields automatically
- **90-day retention** - Configurable retention period
- **Access control** - GitHub OAuth authentication

---

## Security Checklist

Before going to production, verify:

| Check | Status |
|-------|--------|
| ✅ All webhooks use HTTPS | |
| ✅ Signature verification enabled | |
| ✅ Using raw body for verification | |
| ✅ Timestamp validation (if available) | |
| ✅ Idempotency implemented | |
| ✅ Rate limiting configured | |
| ✅ Request timeout set | |
| ✅ Sensitive data redacted in logs | |
| ✅ Monitoring and alerting configured | |
| ✅ Error handling doesn't leak info | |

---

## Related Guides

- [How to Debug Stripe Webhooks](./stripe-webhooks.md)
- [How to Test GitHub Webhooks Locally](./github-webhooks.md)
- [Twilio Webhook Testing Guide](./twilio-webhooks.md)
- [SendGrid Webhook Events Guide](./sendgrid-webhooks.md)

---

**Webhook Debugger** - The self-hosted webhook inspector for developers who value data privacy. [Get started free](https://github.com/brancogao/webhook-debugger).
