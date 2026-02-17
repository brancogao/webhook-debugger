# Webhook Debugger - Frontend Implementation

## Overview

Simple, direct, fast frontend for Webhook Debugger. Built with vanilla JavaScript + Vite, following DHH principles: clear code, no over-engineering, ship fast.

## Tech Stack

- **Runtime**: Vanilla JavaScript (ES modules)
- **Build**: Vite 6
- **Styling**: Inline CSS (no framework)
- **Fonts**: Inter (UI) + JetBrains Mono (code)
- **Icons**: Inline SVG (no dependencies)

## Architecture

```
frontend/
├── app.js          # Main application + router
├── api.js          # API client (fetch wrapper)
├── utils.js        # Utility functions
├── style.css       # All styles
├── index.html      # Entry point
├── vite.config.js  # Vite config
└── package.json
```

### File Responsibilities

- **app.js**: SPA router, page rendering, event handlers
- **api.js**: Authenticated API calls with error handling
- **utils.js**: Time formatting, clipboard, toast, JSON syntax highlight
- **style.css**: All CSS (no Tailwind, no frameworks)

## Pages & Routes

### `/` - Home
- Product features
- "Login with GitHub" button
- OAuth redirect

### `/dashboard` - Endpoints List
- Display all user endpoints
- Create endpoint button
- Click to view endpoint details

### `/endpoints/:id` - Endpoint Detail
- Endpoint info (name, webhook URL, stats)
- Webhook list with search (debounced 300ms)
- Click webhook to open detail modal

### `/settings` - Settings (placeholder)
- User info
- Plan display
- Logout button

## Key Features

### 1. Authentication
- Cookie-based (HttpOnly, Secure, SameSite=Lax)
- Auto-redirect to `/` on 401
- Check auth on route change

### 2. API Client
```javascript
api('/api/endpoints')              // GET
api('/api/endpoints', { method: 'POST', body: JSON.stringify({ name }) })  // POST
```

Automatic:
- `credentials: 'include'` for cookies
- `Content-Type: application/json`
- 401 handling (redirect to `/`)
- Error parsing

### 3. SPA Routing
```javascript
router()                           // Check auth, render route
window.addEventListener('popstate', router)  // Back button
document.addEventListener('click', ...)     // Intercept links
```

### 4. Webhook Search
- FTS5 full-text search via API
- Debounced (300ms) to avoid spamming
- Real-time results update

### 5. Webhook Replay
- Input target URL
- Click "Replay" button
- Show last replay status (color-coded)
- Store replay count + response in DB

### 6. Copy Features
- Copy webhook URL to clipboard
- Copy as cURL command
- Toast notification on success/error

## Design System

### Colors
- Primary: Indigo (`#6366f1`, `#4f46e5`)
- Background: Slate-50 (`#f8fafc`)
- Cards: White with border (`border-gray-200`)
- Text: Gray-800 (primary), Gray-500 (secondary)

### Typography
- UI: Inter 400/500/600/700
- Code: JetBrains Mono 400/500

### Components
- **Cards**: White bg, rounded-lg, border, hover:shadow-md
- **Buttons**: Indigo-600 bg, white text, rounded-lg
- **Inputs**: border-gray-300, focus:ring-indigo-500
- **Modals**: Fixed backdrop (rgba 0.5), center content
- **Toasts**: Fixed bottom-right, slide-in animation

### Responsiveness
- Sidebar: Fixed on desktop, collapsible on mobile
- Grid: 2 columns on desktop, 1 on mobile
- Modals: Full-width on mobile

## State Management

No framework = manual DOM updates. Simple approach:

```javascript
// Update specific element
const container = document.getElementById('webhooks-list');
container.innerHTML = webhooks.map(renderWebhookCard).join('');
```

This is intentional: clear, predictable, no hidden reactivity.

## Performance

- **Bundle size**: ~24KB (gzipped 6.5KB)
- **No runtime**: Vanilla JS, no framework overhead
- **Fast load**: Single CSS file, minimal HTTP requests
- **Lazy loading**: Only load what you need (route-based)

## Development

### Install
```bash
cd frontend
npm install
```

### Dev Server (hot reload)
```bash
npm run dev
```
Starts Vite dev server on port 3000 with API proxy.

### Production Build
```bash
npm run build
```
Outputs to `../public/` (deployed with Workers).

## Future Improvements (only if needed)

- [ ] Webhook list pagination (load more on scroll)
- [ ] Filter by source (GitHub/Stripe/Slack)
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts (j/k to navigate webhooks)
- [ ] Export webhook as JSON file

## DHH Principles Applied

1. **Simple over clever**: Vanilla JS, no framework magic
2. **Ship first**: MVP in ~500 lines of code
3. **Convention over configuration**: No custom build pipeline
4. **Delete code**: No unused dependencies, minimal CSS
5. **Clear code**: Functions do one thing, names are descriptive

## Notes

- Frontend and backend are deployed together (single Workers project)
- Static files in `public/` served by Workers
- SPA routing handles client-side navigation
- OAuth callback redirects to `/dashboard`
