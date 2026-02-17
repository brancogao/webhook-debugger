# Shopify Webhook Debugging Guide

> Complete guide to testing and debugging Shopify webhooks for store events, orders, and app integrations.

Shopify webhooks notify your app about store events like new orders, inventory changes, and customer actions. This guide covers everything you need to debug Shopify webhooks effectively.

## Table of Contents

- [Why Shopify Webhook Debugging Matters](#why-shopify-webhook-debugging-matters)
- [Shopify Webhook Topics](#shopify-webhook-topics)
- [Setting Up Shopify Webhooks](#setting-up-shopify-webhooks)
- [Method 1: Shopify CLI (Local Testing)](#method-1-shopify-cli-local-testing)
- [Method 2: Webhook Debugger (Production)](#method-2-webhook-debugger-production)
- [Shopify Webhook Verification](#shopify-webhook-verification)
- [Common Issues and Solutions](#common-issues-and-solutions)

---

## Why Shopify Webhook Debugging Matters

Shopify webhooks are critical for:

- **Order fulfillment** - Trigger shipping, inventory updates
- **Payment processing** - Handle payment events
- **Customer management** - Sync customer data
- **App integrations** - Keep your app in sync with store data

Failed webhooks mean missed orders, unhappy customers, and lost revenue.

---

## Shopify Webhook Topics

### Order Events

| Topic | Trigger |
|-------|---------|
| `orders/create` | New order placed |
| `orders/updated` | Order modified |
| `orders/cancelled` | Order canceled |
| `orders/fulfilled` | Order shipped |
| `orders/paid` | Payment received |

### Product Events

| Topic | Trigger |
|-------|---------|
| `products/create` | New product added |
| `products/update` | Product modified |
| `products/delete` | Product removed |

### Inventory Events

| Topic | Trigger |
|-------|---------|
| `inventory_levels/update` | Stock level changed |
| `inventory_items/create` | New inventory item |

### Customer Events

| Topic | Trigger |
|-------|---------|
| `customers/create` | New customer signup |
| `customers/update` | Customer info changed |

---

## Setting Up Shopify Webhooks

### Via Admin Dashboard

1. Go to **Settings > Notifications > Webhooks**
2. Click **Create webhook**
3. Select event topic
4. Enter callback URL
5. Choose format (JSON recommended)
6. Save

### Via API

```bash
curl -X POST "https://{shop}.myshopify.com/admin/api/2024-01/webhooks.json" \
  -H "X-Shopify-Access-Token: {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "topic": "orders/create",
      "address": "https://your-server.com/webhooks/shopify",
      "format": "json"
    }
  }'
```

---

## Method 1: Shopify CLI (Local Testing)

Shopify CLI can forward webhooks to your local machine:

```bash
# Install Shopify CLI
npm install -g @shopify/cli @shopify/app

# Login to Shopify
shopify auth login --store your-store.myshopify.com

# Develop with webhook forwarding
shopify app dev
```

**Limitations:**
- Only works during active development session
- Requires Shopify Partner account
- No persistent history

---

## Method 2: Webhook Debugger (Production)

For production webhook debugging with full history:

### Step 1: Deploy Webhook Debugger

```bash
git clone https://github.com/brancogao/webhook-debugger.git
cd webhook-debugger && npm install

npx wrangler login
npx wrangler d1 create webhook-debugger-db
npm run deploy
```

### Step 2: Create Shopify Endpoint

1. Open Webhook Debugger dashboard
2. Create endpoint: `/hook/shopify-orders`
3. Copy the URL

### Step 3: Register in Shopify

1. **Settings > Notifications > Webhooks**
2. Add webhook with your endpoint URL
3. Select topics to receive
4. Save and verify

### Step 4: Debug Webhooks

View all incoming Shopify webhooks with:
- Full JSON payload
- HTTP headers including HMAC signature
- Timestamp and delivery status
- Auto-detected Shopify source

**Key features:**
- **90-day history** - Review past orders anytime
- **Full-text search** - Find webhooks by order ID, customer email, etc.
- **One-click replay** - Resend to your app for testing
- **Auto detection** - Identifies Shopify webhooks automatically

---

## Shopify Webhook Verification

Shopify signs all webhooks with HMAC-SHA256. Always verify:

```typescript
import crypto from 'crypto';

function verifyShopifyWebhook(
  body: string,
  hmacHeader: string,
  secret: string
): boolean {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(hmacHeader)
  );
}

app.post('/webhooks/shopify', (req, res) => {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!verifyShopifyWebhook(req.rawBody, hmac, secret)) {
    return res.status(401).send('Invalid HMAC');
  }

  const topic = req.headers['x-shopify-topic'];
  const shop = req.headers['x-shopify-shop-domain'];
  const payload = req.body;

  // Process webhook...
  res.status(200).send('OK');
});
```

---

## Common Issues and Solutions

### Webhook Not Received

| Cause | Solution |
|-------|----------|
| Wrong URL | Verify callback URL in Shopify settings |
| SSL issues | Ensure valid HTTPS certificate |
| Firewall blocking | Whitelist Shopify IPs |
| App uninstalled | Re-register webhooks |

### Verification Failing

| Cause | Solution |
|-------|----------|
| Wrong secret | Check client secret in app settings |
| Body parsing | Use raw body for HMAC calculation |
| Encoding issues | Ensure UTF-8 encoding |

### Duplicate Deliveries

Shopify may send duplicate webhooks. Handle idempotency:

```typescript
const processedOrders = new Set();

app.post('/webhooks/shopify/orders', async (req, res) => {
  const orderId = req.body.id;

  if (processedOrders.has(orderId)) {
    return res.status(200).send('Already processed');
  }

  processedOrders.add(orderId);
  await processOrder(req.body);
  res.status(200).send('OK');
});
```

---

## Testing Shopify Webhooks

### From Admin Dashboard

1. Go to **Settings > Notifications > Webhooks**
2. Click **Send test notification**
3. Select the webhook to test

### Using cURL

```bash
# Generate test payload
curl -X POST https://your-server.com/webhooks/shopify \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/create" \
  -H "X-Shopify-Hmac-Sha256: ..." \
  -H "X-Shopify-Shop-Domain: test-store.myshopify.com" \
  -d '{"id": 12345, "email": "test@example.com", ...}'
```

---

## Best Practices

1. **Always verify HMAC** - Never trust unsigned webhooks
2. **Return 200 quickly** - Process asynchronously
3. **Handle retries** - Shopify retries failed webhooks
4. **Log everything** - You need history for debugging
5. **Monitor failures** - Set up alerts

---

## Related Guides

- [How to Debug Stripe Webhooks](./stripe-webhooks.md)
- [How to Test GitHub Webhooks Locally](./github-webhooks.md)
- [Slack Event Debugging](./slack-events.md)

---

**Webhook Debugger** - Self-hosted webhook inspector with 90-day history. Perfect for Shopify app developers. [Get started free](https://github.com/brancogao/webhook-debugger).
