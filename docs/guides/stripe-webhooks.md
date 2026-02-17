# How to Debug Stripe Webhooks

> A complete guide to testing and debugging Stripe webhooks locally and in production using Webhook Debugger.

Stripe webhooks are critical for payment flows, but debugging them can be frustrating. This guide shows you how to inspect, test, and debug Stripe webhooks effectively.

## Table of Contents

- [Why Stripe Webhook Debugging Matters](#why-stripe-webhook-debugging-matters)
- [Common Stripe Webhook Issues](#common-stripe-webhook-issues)
- [Method 1: Stripe CLI (Local Testing)](#method-1-stripe-cli-local-testing)
- [Method 2: Webhook Debugger (Production Debugging)](#method-2-webhook-debugger-production-debugging)
- [Stripe Webhook Signature Verification](#stripe-webhook-signature-verification)
- [Testing Specific Stripe Events](#testing-specific-stripe-events)

---

## Why Stripe Webhook Debugging Matters

Stripe uses webhooks to notify your application about important payment events:

- **Payment succeeded** - Order fulfillment
- **Payment failed** - Handle declined cards
- **Subscription created/updated/canceled** - SaaS billing
- **Invoice paid** - Recurring billing
- **Dispute created** - Chargeback handling

When these webhooks fail, you lose revenue and customers get frustrated. **Proper debugging tools are essential.**

---

## Common Stripe Webhook Issues

| Issue | Symptom | Debug Approach |
|-------|---------|----------------|
| **Wrong endpoint URL** | 404 errors | Check Stripe dashboard settings |
| **SSL certificate issue** | Connection refused | Verify HTTPS config |
| **Signature mismatch** | 400 bad request | Check webhook secret |
| **Timeout** | 502/504 errors | Profile endpoint performance |
| **Missing event handler** | Events ignored | Check event type routing |
| **JSON parsing error** | 400 bad request | Validate payload structure |

---

## Method 1: Stripe CLI (Local Testing)

The Stripe CLI is great for local development:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger invoice.paid
stripe trigger customer.subscription.created
```

**Limitations:**
- Only works for local development
- Can't debug production webhooks
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
2. Create a new endpoint (e.g., `/hook/stripe-production`)
3. Copy the full URL

### Step 3: Configure Stripe

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-debugger.workers.dev/hook/stripe-production`
3. Select events to listen to
4. Save and copy the signing secret

### Step 4: Debug Real Webhooks

When Stripe sends a webhook, you'll see:
- Full HTTP headers
- Raw JSON payload
- Timestamp
- Signature verification status

**Key features for Stripe debugging:**
- **90-day history** - Review past webhooks anytime
- **Full-text search** - Find webhooks by customer ID, amount, etc.
- **One-click replay** - Resend webhooks to your actual endpoint
- **Auto source detection** - Automatically identifies Stripe webhooks

---

## Stripe Webhook Signature Verification

Stripe signs all webhooks with HMAC-SHA256. Always verify signatures:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    // Verify signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    // Handle event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;
      // ... other events
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

---

## Testing Specific Stripe Events

### Payment Events

```bash
# Successful payment
stripe trigger payment_intent.succeeded

# Failed payment
stripe trigger payment_intent.payment_failed

# Refund
stripe trigger charge.refunded
```

### Subscription Events

```bash
# New subscription
stripe trigger customer.subscription.created

# Subscription updated
stripe trigger customer.subscription.updated

# Subscription canceled
stripe trigger customer.subscription.deleted
```

### Invoice Events

```bash
# Invoice paid
stripe trigger invoice.paid

# Invoice payment failed
stripe trigger invoice.payment_failed
```

---

## Best Practices

1. **Always verify signatures** - Never trust unsigned webhooks
2. **Log all webhooks** - You'll need them for debugging
3. **Handle idempotency** - Stripe may send duplicate events
4. **Return 200 quickly** - Process webhooks asynchronously
5. **Monitor webhook failures** - Set up alerts in Stripe dashboard

---

## Related Guides

- [How to Test GitHub Webhooks Locally](./github-webhooks.md)
- [Shopify Webhook Debugging Guide](./shopify-webhooks.md)
- [Slack Event Debugging](./slack-events.md)

---

**Webhook Debugger** - The self-hosted webhook inspector for developers who value data privacy. [Get started free](https://github.com/brancogao/webhook-debugger).
