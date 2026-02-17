# Product Hunt Image Generation Prompts

Use these prompts with image generation tools (DALL-E, Midjourney, Claude Artifacts, etc.) to create the required assets.

---

## 1. Thumbnail Image (1270 x 760 px)

### Prompt for AI Image Generator

```
Create a professional product thumbnail for a developer tool called "Webhook Debugger".

Layout:
- Dark mode developer interface aesthetic (background: dark slate #0f172a)
- Subtle grid pattern overlay
- Left side (40%): Product name "Webhook Debugger" in modern white sans-serif font, with tagline "Self-hosted webhook inspector. Your data, your server." below it
- Right side (60%): Screenshot mockup showing a webhook list interface with JSON payloads visible
- Orange accent color (#F38020) for "Self-hosted" and "90-day history" badges

Key visual elements:
- Clean, minimal interface design
- Code/JSON syntax highlighting (blue strings, orange numbers, green booleans)
- Small logos of Stripe, GitHub, Shopify in a row (indicating webhook sources)
- Developer-focused, professional aesthetic

Aspect ratio: 1270:760 (landscape)
Style: Modern SaaS product, dark mode, developer tools aesthetic
```

### Alternative Prompt (Simpler)

```
Professional dark-mode developer tool thumbnail. Background: dark slate #0f172a with subtle grid. Center-left: "Webhook Debugger" title in white modern font. Right side: mockup of webhook dashboard with JSON code visible. Orange accents (#F38020). Clean, minimal, professional SaaS aesthetic. 1270x760 pixels.
```

---

## 2. Gallery Image 1: Main Dashboard

### Screenshot Content to Create

Since we can't capture real screenshots (demo site blocked), create mockups showing:

**Content Description:**
```
Dark mode interface showing a list of webhook endpoints. Each row shows:
- Endpoint name (e.g., "Stripe Production", "GitHub Webhooks")
- Endpoint URL (partially masked for security)
- Webhook count (e.g., "1,247 webhooks")
- Last activity timestamp (e.g., "2 minutes ago")
- Status indicator (green dot = active)

Header shows "Webhook Debugger" logo and user avatar
Search bar at top: "Search webhooks..."
```

### Caption for PH
```
Your webhook endpoints at a glance. Create unique URLs, see activity, manage everything from one clean interface.
```

---

## 3. Gallery Image 2: Webhook Detail View

### Screenshot Content to Create

```
Split-view webhook detail page:

Left panel (40%): Webhook metadata
- Source: "Stripe" (with Stripe logo)
- Method: "POST"
- Received: "2026-02-17 15:32:41 UTC"
- Content-Type: "application/json"
- Size: "2.4 KB"

Right panel (60%): JSON payload viewer
{
  "id": "evt_1MtvQaLkdIwHu7ixUEgbFdYF",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3MtvQaLkdIwHu7ix0M1DPdwv",
      "amount": 2000,
      "currency": "usd",
      "customer": "cus_NffrFeUfNV2Hib"
    }
  }
}

Bottom: Action buttons "Replay" "Copy" "Share"
```

### Caption for PH
```
Full payload inspection with headers, body, and timestamps. See exactly what was sent.
```

---

## 4. Gallery Image 3: One-Click Replay

### Screenshot Content to Create

```
Modal dialog titled "Replay Webhook"

Form fields:
- Target URL: [input field with placeholder "https://your-api.com/webhook"]
- Method: POST (dropdown)
- Preserve Headers: [checkbox, checked]
- Preserve Body: [checkbox, checked]

Action buttons:
- [Cancel] [Replay] (orange button)

Below the form, a success message:
✓ Replay successful (200 OK)
Response time: 234ms

```

### Caption for PH
```
Replay any webhook to any URL instantly. Debug without re-triggering the source.
```

---

## 5. Gallery Image 4: Full-Text Search

### Screenshot Content to Create

```
Search interface showing:

Search bar with query: "customer_id: cus_NffrFeUfNV2Hib"

Results list (3 items):
1. "payment_intent.succeeded" - Stripe - 2 hours ago
   Preview: ...customer: "cus_NffrFeUfNV2Hib"...

2. "invoice.paid" - Stripe - 3 days ago
   Preview: ...customer: "cus_NffrFeUfNV2Hib"...

3. "customer.updated" - Stripe - 2 weeks ago
   Preview: ...id: "cus_NffrFeUfNV2Hib"...

Header showing: "Found 3 webhooks matching your search"
```

### Caption for PH
```
Search across all webhook payloads. Find that one event from 2 months ago in seconds.
```

---

## 6. Gallery Image 5: Deploy Flow

### Terminal Screenshot to Create

```bash
$ git clone https://github.com/brancogao/webhook-debugger
Cloning into 'webhook-debugger'...
remote: Enumerating objects: 234, done.
remote: Counting objects: 100% (234/234), done.
remote: Compressing objects: 100% (156/156), done.
remote: Total 234 (delta 78), reused 234 (delta 78), pack-reused 0

$ cd webhook-debugger && npm install
added 127 packages in 4.2s

$ npm run deploy
> webhook-debugger@1.0.0 deploy
> wrangler deploy

⛅️ wrangler 4.65.0
Uploading webhook-debugger...
Deployed webhook-debugger to https://webhook-debugger.YOUR_USERNAME.workers.dev
✓ Success!

Your webhook debugger is live!
```

### Caption for PH
```
Self-host in 5 minutes. Clone, configure, deploy to your Cloudflare account.
```

---

## Quick Generation Commands

### Using DALL-E 3
```
Generate a [description from above], professional SaaS product screenshot style, dark mode interface, 1270x760 aspect ratio
```

### Using Midjourney
```
[description from above], developer tool UI, dark mode, modern SaaS aesthetic, professional product screenshot --ar 1270:760
```

### Using Figma/Canva
Use the descriptions above as a brief to manually create the mockups. Key design elements:
- Dark background (#0f172a)
- Orange accents (#F38020)
- Modern sans-serif font (Inter, SF Pro, or similar)
- Clean, minimal layout
- Realistic JSON/code highlighting

---

## File Naming Convention

Save generated images as:
- `ph-thumbnail-1270x760.png`
- `ph-gallery-1-dashboard.png`
- `ph-gallery-2-detail.png`
- `ph-gallery-3-replay.png`
- `ph-gallery-4-search.png`
- `ph-gallery-5-deploy.png`

Upload to PH in this order (first = most visible).
