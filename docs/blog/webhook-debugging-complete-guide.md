---
title: "Webhook Debugging: A Complete Guide for Developers"
description: "Everything you need to know about debugging webhooks - from local testing to production troubleshooting. Covers Stripe, GitHub, Shopify, Slack, and more."
published: false
date: 2026-02-18
tags: ["webhooks", "debugging", "api", "development", "tutorial"]
canonical_url: https://github.com/brancogao/webhook-debugger
---

# Webhook Debugging: A Complete Guide for Developers

If you've ever integrated with Stripe, GitHub, Slack, or any modern API, you've dealt with webhooks. And if you've dealt with webhooks, you've probably spent hours debugging why they're not working.

This guide covers everything you need to know about debugging webhooks, from basic concepts to advanced troubleshooting techniques.

## Table of Contents

1. [What Are Webhooks?](#what-are-webhooks)
2. [Common Webhook Problems](#common-webhook-problems)
3. [Webhook Debugging Tools](#webhook-debugging-tools)
4. [Debugging by Platform](#debugging-by-platform)
5. [Best Practices](#best-practices)
6. [Security Considerations](#security-considerations)

---

## What Are Webhooks?

Webhooks are HTTP callbacks - when an event happens in a service, it sends an HTTP POST request to a URL you specify. Think of it like a notification system, but for servers instead of humans.

```text
[Stripe] ---event---> [Your Server]
                      |
                      v
                 Handle the event
                 (update database, send email, etc.)
```

Common webhook use cases:
- **Payment processing**: Stripe, PayPal sending payment notifications
- **Version control**: GitHub, GitLab notifying about pushes, PRs
- **Communication**: Slack, Discord receiving messages from external services
- **E-commerce**: Shopify, WooCommerce order notifications
- **Monitoring**: PagerDuty, Opsgenie alert notifications

---

## Common Webhook Problems

### 1. Webhook Not Received

**Symptoms**: The sending service shows "delivered" but your server never receives it.

**Causes**:
- Firewall blocking incoming requests
- Wrong URL configured
- SSL certificate issues
- Server returning non-200 response

**Solutions**:
```bash
# Test if your endpoint is accessible
curl -X POST https://your-domain.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check SSL certificate
openssl s_client -connect your-domain.com:443
```

### 2. Signature Verification Failed

**Symptoms**: You receive the webhook but signature validation fails.

**Causes**:
- Using wrong secret key
- Payload modified in transit
- Timestamp-based signatures expired
- Encoding issues (raw vs JSON string)

**Solution for Stripe**:
```javascript
const stripe = require('stripe');
const sig = request.headers['stripe-signature'];

try {
  const event = stripe.webhooks.constructEvent(
    request.body, // raw body, not parsed!
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (err) {
  console.log('Signature verification failed:', err.message);
  return response.status(400).send('Webhook Error');
}
```

### 3. Timeout Issues

**Symptoms**: The sending service reports timeouts, but your server logs show success.

**Causes**:
- Processing takes too long before returning 200
- Network latency between services
- Your server is under heavy load

**Solution**:
Always acknowledge webhooks immediately, then process asynchronously:

```javascript
// DON'T do this
app.post('/webhook', async (req, res) => {
  await processPayment(req.body); // Takes 5 seconds
  res.status(200).send('OK');     // Too late!
});

// DO this instead
app.post('/webhook', async (req, res) => {
  // Acknowledge immediately
  res.status(200).send('OK');

  // Process in background
  processPayment(req.body).catch(console.error);
});
```

### 4. Duplicate Webhooks

**Symptoms**: Same webhook received multiple times.

**Causes**:
- Sending service retrying due to earlier failures
- Network issues causing duplicates
- Intentional redundancy from the provider

**Solution**:
Implement idempotency with webhook IDs:

```javascript
const processedIds = new Set();

app.post('/webhook', async (req, res) => {
  const webhookId = req.headers['x-webhook-id'];

  if (processedIds.has(webhookId)) {
    return res.status(200).send('Already processed');
  }

  await processWebhook(req.body);
  processedIds.add(webhookId);

  res.status(200).send('OK');
});
```

---

## Webhook Debugging Tools

### Option 1: Public SaaS Services

Tools like **webhook.site** and **requestbin.com** provide instant webhook URLs.

**Pros**:
- No setup required
- Easy to share URLs
- Good for quick tests

**Cons**:
- **Privacy concerns**: Your webhook data is stored on their servers
- **Retention limits**: Usually 24-48 hours
- **Rate limits**: Limited requests per day
- **Security risks**: Sensitive data exposed to third party

### Option 2: Local Tools

Tools like **ngrok** or **localtunnel** expose your local machine to the internet.

**Pros**:
- Full control over data
- Can debug locally
- Real-time inspection

**Cons**:
- Requires local server running
- URLs change on restart (ngrok free tier)
- Can't receive webhooks when computer is off
- Not suitable for production debugging

### Option 3: Self-Hosted Solutions

Deploy your own webhook receiver like **Webhook Debugger**.

**Pros**:
- **Full data privacy**: Data stays on your infrastructure
- **Long retention**: Keep webhooks for 90+ days
- **Production-ready**: Always online, no local dependency
- **Search capability**: Full-text search across all webhooks
- **Replay**: Forward webhooks to any URL for testing

**Cons**:
- Initial setup required (usually 5-10 minutes)
- Need a hosting provider

---

## Debugging by Platform

### Stripe Webhooks

Stripe sends webhooks for payment events, subscription changes, and more.

**Key Headers**:
- `stripe-signature`: Contains timestamp and signature
- `stripe-event-id`: Unique identifier for the event

**Debugging Tips**:
1. Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/webhook`
2. Always verify signatures using the raw request body
3. Check the Stripe Dashboard for delivery attempts and errors

```bash
# Quick test with Stripe CLI
stripe trigger payment_intent.succeeded
```

### GitHub Webhooks

GitHub sends webhooks for pushes, pull requests, issues, and more.

**Key Headers**:
- `x-github-event`: Type of event (push, pull_request, etc.)
- `x-hub-signature-256`: HMAC signature
- `x-github-delivery`: Unique delivery ID

**Debugging Tips**:
1. Check repository Settings > Webhooks for recent deliveries
2. Use the "Redeliver" button to retry failed webhooks
3. Verify the secret matches your configured secret

### Shopify Webhooks

Shopify sends webhooks for orders, inventory updates, and app events.

**Key Headers**:
- `x-shopify-topic`: Event type (orders/create, etc.)
- `x-shopify-hmac-sha256`: Signature
- `x-shopify-shop-domain`: Store URL

**Debugging Tips**:
1. Use Shopify CLI: `shopify app webhook trigger`
2. Check webhook logs in Shopify Admin
3. Verify app credentials are correct

### Slack Events

Slack sends events for messages, reactions, and app interactions.

**Key Headers**:
- `x-slack-signature`: Request signature
- `x-slack-request-timestamp`: Unix timestamp

**Special Handling**:
```javascript
// Slack requires URL verification
app.post('/slack/events', (req, res) => {
  if (req.body.type === 'url_verification') {
    return res.status(200).send(req.body.challenge);
  }
  // Handle normal events
});
```

---

## Best Practices

### 1. Always Use HTTPS

Never accept webhooks over HTTP. Sensitive data in webhooks should be encrypted in transit.

### 2. Verify Signatures

Never trust webhook data without verifying the signature. This prevents:
- Spoofed webhooks
- Man-in-the-middle attacks
- Replay attacks

### 3. Return 200 Quickly

Acknowledge webhooks within 5 seconds. Process heavy work asynchronously.

### 4. Handle Duplicates

Design your handlers to be idempotent. Same webhook processed twice = same result.

### 5. Log Everything

Keep detailed logs for debugging:
- Timestamp
- Headers
- Payload
- Processing result
- Any errors

### 6. Use a Dedicated Endpoint

Don't mix webhooks with your main API. Use `/webhook/*` or a subdomain.

---

## Security Considerations

### 1. Never Skip Signature Verification

Even in development, always verify signatures. Skipping verification in dev often leads to skipping in production.

### 2. Rotate Secrets Regularly

Change webhook secrets periodically, especially after team member departures.

### 3. Limit Information in Responses

Return minimal information in error responses. Don't expose stack traces or internal details.

### 4. Rate Limit Your Endpoints

Protect against abuse with rate limiting:

```javascript
const rateLimiter = new Map();

app.post('/webhook', (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;

  const requests = rateLimiter.get(ip) || [];
  const recentRequests = requests.filter(t => now - t < windowMs);

  if (recentRequests.length >= maxRequests) {
    return res.status(429).send('Too many requests');
  }

  rateLimiter.set(ip, [...recentRequests, now]);
  // Process webhook
});
```

### 5. Use IP Whitelisting (When Available)

Some services publish their webhook IP ranges. Whitelist them if security is critical.

---

## Getting Started with Self-Hosted Debugging

If you want full control over your webhook data, consider deploying [Webhook Debugger](https://github.com/brancogao/webhook-debugger):

```bash
# Clone and deploy in 5 minutes
git clone https://github.com/brancogao/webhook-debugger.git
cd webhook-debugger
npm install

# Deploy to Cloudflare (free tier)
npx wrangler login
npx wrangler d1 create webhook-debugger-db
npm run deploy
```

Features:
- **Self-hosted**: Your data stays on your Cloudflare account
- **90-day retention**: Keep webhook history for 3 months
- **Full-text search**: Find any webhook by content
- **One-click replay**: Forward webhooks to any URL
- **Auto-detection**: Automatically identifies Stripe, GitHub, Shopify, etc.
- **Free tier friendly**: Cloudflare's free tier covers most use cases

---

## Conclusion

Webhook debugging doesn't have to be painful. With the right tools and practices:

1. **Use proper tools**: Self-hosted for production, local for development
2. **Always verify signatures**: Security first
3. **Handle edge cases**: Duplicates, timeouts, failures
4. **Log everything**: Future you will thank present you

Happy debugging!

---

*Have questions or suggestions? [Open an issue](https://github.com/brancogao/webhook-debugger/issues) or check out the [live demo](https://webhook-debugger.autocompany.workers.dev).*
