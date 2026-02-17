/**
 * Main Application Router
 */

import { authApi, endpointsApi, webhooksApi } from './api.js';
import { showToast, debounce, formatRelativeTime } from './utils.js';

const app = document.getElementById('app');

// Router
function router() {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  // Check auth state first
  checkAuth()
    .then((user) => {
      if (!user && path !== '/') {
        window.location.href = '/';
        return;
      }

      if (path === '/') {
        renderHomePage();
      } else if (path === '/dashboard') {
        renderDashboard(user);
      } else if (path.startsWith('/endpoints/')) {
        const endpointId = path.split('/')[2];
        renderEndpointDetail(user, endpointId, params);
      } else if (path === '/settings') {
        renderSettings(user);
      } else {
        render404();
      }
    })
    .catch((err) => {
      console.error('Auth check failed:', err);
      window.location.href = '/';
    });
}

// Check authentication
async function checkAuth() {
  try {
    const data = await authApi.getCurrentUser();
    return data.user;
  } catch (err) {
    return null;
  }
}

// ==================== HOME PAGE ====================
function renderHomePage() {
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div class="text-center max-w-lg px-4">
        <h1 class="text-5xl font-bold text-indigo-600 mb-4">Webhook Debugger</h1>
        <p class="text-xl text-gray-600 mb-8">
          Capture, inspect, and replay webhooks with 90-day history
        </p>

        <div class="bg-white rounded-lg shadow-lg p-6 mb-8 text-left">
          <h3 class="font-semibold text-gray-800 mb-4">Features</h3>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-center gap-2">
              <span class="text-green-500">✓</span>
              Unique webhook URLs generated instantly
            </li>
            <li class="flex items-center gap-2">
              <span class="text-green-500">✓</span>
              Auto-detect GitHub, Stripe, Slack, Shopify & more
            </li>
            <li class="flex items-center gap-2">
              <span class="text-green-500">✓</span>
              One-click replay to any URL
            </li>
            <li class="flex items-center gap-2">
              <span class="text-green-500">✓</span>
              Full-text search across all payloads
            </li>
          </ul>
        </div>

        <a href="/api/auth/github"
           class="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors text-lg">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Login with GitHub
        </a>

        <p class="mt-4 text-sm text-gray-500">
          Free plan: 1 endpoint, 7-day history
        </p>
      </div>
    </div>
  `;
}

// ==================== LAYOUT ====================
function renderLayout(user, content) {
  return `
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-gray-200 p-4">
        <h1 class="text-xl font-bold text-indigo-600 mb-6">Webhook Debugger</h1>

        <nav class="space-y-1">
          <a href="/dashboard" class="block px-3 py-2 rounded-lg ${window.location.pathname === '/dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}">
            Endpoints
          </a>
          <a href="/settings" class="block px-3 py-2 rounded-lg ${window.location.pathname === '/settings' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}">
            Settings
          </a>
        </nav>

        <div class="mt-auto pt-6 border-t border-gray-200">
          <div class="flex items-center gap-3 mb-4">
            ${user.avatar_url
              ? `<img src="${user.avatar_url}" class="w-8 h-8 rounded-full" alt="${user.github_login}"/>`
              : `<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">${user.github_login?.[0] || 'U'}</div>`
            }
            <span class="text-sm font-medium text-gray-700">${user.github_login}</span>
          </div>
          <button onclick="logout()" class="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Logout
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 bg-gray-50 overflow-y-auto">
        ${content}
      </main>
    </div>
  `;
}

// ==================== DASHBOARD ====================
async function renderDashboard(user) {
  app.innerHTML = renderLayout(user, `
    <div class="p-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Endpoints</h2>
        <button onclick="createEndpoint()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          + New Endpoint
        </button>
      </div>

      <div id="endpoints-list" class="space-y-4">
        <div class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  `);

  try {
    const data = await endpointsApi.list();
    const endpointsList = document.getElementById('endpoints-list');

    if (data.endpoints.length === 0) {
      endpointsList.innerHTML = `
        <div class="text-center py-16">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-700 mb-2">No endpoints yet</h3>
          <p class="text-gray-500 mb-4">Create your first endpoint to start receiving webhooks</p>
          <button onclick="createEndpoint()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Create Endpoint
          </button>
        </div>
      `;
      return;
    }

    endpointsList.innerHTML = data.endpoints.map((ep) => renderEndpointCard(ep)).join('');
  } catch (err) {
    console.error('Failed to load endpoints:', err);
    showToast('Failed to load endpoints', 'error');
  }
}

function renderEndpointCard(endpoint) {
  const webhookUrl = `${window.location.origin}/hook/${endpoint.path.replace('/hook/', '')}`;

  return `
    <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-semibold text-lg text-gray-800">${endpoint.name}</h3>
          <p class="text-sm text-gray-500 mt-1">Created ${formatRelativeTime(endpoint.created_at)}</p>
        </div>
        <div class="flex gap-2">
          <button onclick="deleteEndpoint('${endpoint.id}')" class="text-gray-400 hover:text-red-600 p-1" title="Delete">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="bg-gray-50 rounded-lg p-3 mb-3">
        <div class="flex items-center justify-between">
          <code class="text-sm text-gray-700 font-mono">${webhookUrl}</code>
          <button onclick="copyToClipboard('${webhookUrl}')" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Copy
          </button>
        </div>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-500">
          <span class="font-medium text-gray-700">${endpoint.webhook_count || 0}</span> webhooks received
        </span>
        <a href="/endpoints/${endpoint.id}" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          View Details →
        </a>
      </div>
    </div>
  `;
}

// ==================== ENDPOINT DETAIL ====================
async function renderEndpointDetail(user, endpointId, params) {
  app.innerHTML = renderLayout(user, `
    <div class="p-8">
      <div id="endpoint-detail">
        <div class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  `);

  try {
    const [endpointData, webhooksData] = await Promise.all([
      endpointsApi.get(endpointId),
      webhooksApi.list(endpointId, { limit: 50 }),
    ]);

    const endpoint = endpointData.endpoint;
    const { webhooks } = webhooksData;

    renderEndpointDetailContent(endpoint, webhooks);
  } catch (err) {
    console.error('Failed to load endpoint:', err);
    showToast('Failed to load endpoint', 'error');
  }
}

function renderEndpointDetailContent(endpoint, webhooks) {
  const webhookUrl = `${window.location.origin}/hook/${endpoint.path.replace('/hook/', '')}`;
  const container = document.getElementById('endpoint-detail');
  const verificationMethod = endpoint.verification_method || 'none';
  const hasSecret = endpoint.verification_secret && endpoint.verification_secret.length > 0;

  container.innerHTML = `
    <!-- Header -->
    <div class="mb-8">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 mb-1">${endpoint.name}</h2>
          <p class="text-gray-500">Created ${formatRelativeTime(endpoint.created_at)}</p>
        </div>
        <button onclick="deleteEndpoint('${endpoint.id}')" class="text-red-600 hover:text-red-800 text-sm font-medium">
          Delete Endpoint
        </button>
      </div>

      <div class="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-100">
        <label class="block text-sm font-medium text-indigo-700 mb-2">Webhook URL</label>
        <div class="flex items-center gap-2">
          <code class="flex-1 bg-white px-4 py-2 rounded-lg text-gray-800 font-mono text-sm">${webhookUrl}</code>
          <button onclick="copyToClipboard('${webhookUrl}')" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Copy
          </button>
        </div>
      </div>

      <!-- Signature Verification Config -->
      <div class="bg-white rounded-lg border border-gray-200 p-4 mt-4">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-semibold text-gray-800">Signature Verification</h3>
          <span class="px-2 py-1 rounded text-xs font-medium ${verificationMethod !== 'none' && hasSecret ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
            ${verificationMethod !== 'none' && hasSecret ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <p class="text-sm text-gray-600 mb-3">
          Verify incoming webhooks are from trusted sources using HMAC signatures.
        </p>
        <button onclick="showVerificationConfig('${endpoint.id}', '${verificationMethod}', ${hasSecret})"
                class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          ${verificationMethod !== 'none' && hasSecret ? 'Update Configuration' : 'Configure Verification'}
        </button>
      </div>

      <div class="flex gap-6 mt-4">
        <div>
          <span class="text-2xl font-bold text-gray-800">${webhooks.length}</span>
          <p class="text-sm text-gray-500">Total</p>
        </div>
        <div>
          <span class="text-2xl font-bold text-green-600">${webhooks.filter(w => w.source_verified).length}</span>
          <p class="text-sm text-gray-500">Verified</p>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative">
        <input
          type="text"
          id="webhook-search"
          placeholder="Search webhooks..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
    </div>

    <!-- Webhooks List -->
    <div id="webhooks-list" class="space-y-3">
      ${webhooks.length === 0
        ? `<div class="text-center py-16">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-700 mb-2">No webhooks yet</h3>
            <p class="text-gray-500">Send a webhook to the URL above to get started</p>
          </div>`
        : webhooks.map((w) => renderWebhookCard(w)).join('')}
    </div>
  `;

  // Setup search with debounce
  const searchInput = document.getElementById('webhook-search');
  const debouncedSearch = debounce(async (query) => {
    if (!query.trim()) {
      // Reload all webhooks
      const data = await webhooksApi.list(endpoint.id, { limit: 50 });
      renderWebhooksList(data.webhooks);
      return;
    }

    try {
      const data = await webhooksApi.search(endpoint.id, query, { limit: 50 });
      renderWebhooksList(data.webhooks);
    } catch (err) {
      console.error('Search failed:', err);
      showToast('Search failed', 'error');
    }
  }, 300);

  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });
}

function renderWebhooksList(webhooks) {
  const container = document.getElementById('webhooks-list');
  container.innerHTML = webhooks.length === 0
    ? `<div class="text-center py-8 text-gray-500">No webhooks found</div>`
    : webhooks.map((w) => renderWebhookCard(w)).join('');
}

function renderWebhookCard(webhook) {
  const sourceIcon = getSourceIcon(webhook.source);
  const methodColors = {
    GET: 'bg-blue-100 text-blue-800',
    POST: 'bg-green-100 text-green-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    PATCH: 'bg-orange-100 text-orange-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  return `
    <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
         onclick="showWebhookDetail('${webhook.id}')">
      <div class="flex items-center gap-3">
        <div class="source-icon">${sourceIcon}</div>
        <span class="px-2 py-1 rounded text-xs font-medium ${methodColors[webhook.method] || 'bg-gray-100 text-gray-800'}">
          ${webhook.method}
        </span>
        <span class="text-sm text-gray-500 flex-1">
          ${webhook.source || 'Unknown'}
        </span>
        ${webhook.source_verified
          ? `<span class="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800" title="Signature verified">
              ✓ Verified
            </span>`
          : ''}
        <span class="text-sm text-gray-500">
          ${formatRelativeTime(webhook.received_at)}
        </span>
        ${webhook.replay_count > 0
          ? `<span class="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
              Replayed ${webhook.replay_count}x
            </span>`
          : ''}
      </div>
    </div>
  `;
}

// ==================== WEBHOOK DETAIL MODAL ====================
async function showWebhookDetail(webhookId) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  document.body.appendChild(backdrop);

  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4';
  modal.innerHTML = `
    <div class="p-6">
      <div class="flex justify-between items-start mb-6">
        <h2 class="text-xl font-bold text-gray-800">Webhook Details</h2>
        <button onclick="closeWebhookModal()" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div id="webhook-detail-content">
        <div class="flex justify-center py-8">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  `;
  backdrop.appendChild(modal);

  // Close on backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeWebhookModal();
    }
  });

  try {
    const data = await webhooksApi.get(webhookId);
    renderWebhookDetailContent(data.webhook);
  } catch (err) {
    console.error('Failed to load webhook:', err);
    document.getElementById('webhook-detail-content').innerHTML = `
      <p class="text-red-600">Failed to load webhook details</p>
    `;
  }
}

function renderWebhookDetailContent(webhook) {
  const container = document.getElementById('webhook-detail-content');
  const headers = JSON.parse(webhook.headers || '{}');
  const queryParams = webhook.query_params ? JSON.parse(webhook.query_params) : {};
  const body = webhook.body ? JSON.parse(webhook.body) : null;

  container.innerHTML = `
    <!-- Metadata -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Method</label>
        <span class="text-lg font-semibold text-gray-800">${webhook.method}</span>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Received</label>
        <span class="text-lg font-semibold text-gray-800">${formatDate(webhook.received_at)}</span>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Source</label>
        <span class="text-lg font-semibold text-gray-800">${webhook.source || 'Unknown'}</span>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Verification</label>
        ${webhook.source_verified
          ? `<span class="inline-flex items-center gap-1 text-lg font-semibold text-green-600">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              Verified
            </span>`
          : `<span class="inline-flex items-center gap-1 text-lg font-semibold text-gray-400">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              Not Verified
            </span>`
        }
      </div>
    </div>

    <!-- Replay Section -->
    <div class="bg-gray-50 rounded-lg p-4 mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">Replay to URL</label>
      <div class="flex gap-2">
        <input
          type="text"
          id="replay-url"
          placeholder="https://your-server.com/webhook"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <button onclick="replayWebhook('${webhook.id}')" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Replay
        </button>
      </div>
      ${webhook.last_replay_status ? `
        <div class="mt-3">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Last replay:</span>
            <span class="px-2 py-1 rounded text-xs font-medium ${webhook.last_replay_status < 300 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
              ${webhook.last_replay_status}
            </span>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Copy cURL -->
    <div class="mb-6">
      <button onclick="copyCurlCommand('${webhook.id}')" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
        Copy as cURL
      </button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 mb-4">
      <nav class="flex gap-4">
        <button onclick="showTab('headers')" class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600" data-tab="headers">
          Headers
        </button>
        ${body ? `
          <button onclick="showTab('body')" class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-800" data-tab="body">
            Body
          </button>
        ` : ''}
        ${Object.keys(queryParams).length > 0 ? `
          <button onclick="showTab('query')" class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-800" data-tab="query">
            Query Params
          </button>
        ` : ''}
      </nav>
    </div>

    <!-- Tab Content -->
    <div id="tab-headers" class="tab-content">
      <pre><code>${formatJSON(JSON.stringify(headers, null, 2))}</code></pre>
    </div>
    ${body ? `
      <div id="tab-body" class="tab-content hidden">
        <pre><code>${formatJSON(JSON.stringify(body, null, 2))}</code></pre>
      </div>
    ` : ''}
    ${Object.keys(queryParams).length > 0 ? `
      <div id="tab-query" class="tab-content hidden">
        <pre><code>${formatJSON(JSON.stringify(queryParams, null, 2))}</code></pre>
      </div>
    ` : ''}
  `;
}

function showTab(tabName) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('border-indigo-600', 'text-indigo-600');
      btn.classList.remove('border-transparent', 'text-gray-600');
    } else {
      btn.classList.remove('border-indigo-600', 'text-indigo-600');
      btn.classList.add('border-transparent', 'text-gray-600');
    }
  });

  // Update content
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.add('hidden');
  });
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
}

function closeWebhookModal() {
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.remove();
  }
}

async function replayWebhook(webhookId) {
  const urlInput = document.getElementById('replay-url');
  const targetUrl = urlInput.value.trim();

  if (!targetUrl) {
    showToast('Please enter a target URL', 'error');
    return;
  }

  try {
    const result = await webhooksApi.replay(webhookId, targetUrl);
    if (result.success) {
      showToast(`Replay successful: ${result.status}`, 'success');
      // Refresh the modal
      showWebhookDetail(webhookId);
    } else {
      showToast(`Replay failed: ${result.error}`, 'error');
    }
  } catch (err) {
    console.error('Replay failed:', err);
    showToast('Replay failed', 'error');
  }
}

async function copyCurlCommand(webhookId) {
  try {
    const data = await webhooksApi.get(webhookId);
    const webhook = data.webhook;
    const webhookUrl = `${window.location.origin}/hook/${webhook.path?.replace('/hook/', '')}`;
    const curlCommand = generateCurlCommand(webhook, webhookUrl);
    await copyToClipboard(curlCommand);
  } catch (err) {
    console.error('Failed to copy cURL:', err);
    showToast('Failed to copy cURL', 'error');
  }
}

// ==================== SETTINGS ====================
function renderSettings(user) {
  app.innerHTML = renderLayout(user, `
    <div class="p-8">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

      <div class="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
        <div class="flex items-center gap-4 mb-6">
          ${user.avatar_url
            ? `<img src="${user.avatar_url}" class="w-16 h-16 rounded-full" alt="${user.github_login}"/>`
            : `<div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl">${user.github_login?.[0] || 'U'}</div>`
          }
          <div>
            <h3 class="font-semibold text-lg text-gray-800">${user.github_login}</h3>
            <p class="text-gray-500">Joined ${formatRelativeTime(user.created_at)}</p>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-sm font-medium ${
                user.plan === 'free' ? 'bg-gray-100 text-gray-800' :
                user.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }">
                ${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
              </span>
              ${user.plan === 'free' ? `
                <button class="text-sm text-indigo-600 hover:text-indigo-800">Upgrade to Pro</button>
              ` : ''}
            </div>
          </div>

          <div class="pt-4">
            <button onclick="logout()" class="text-red-600 hover:text-red-800 text-sm font-medium">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  `);
}

// ==================== 404 ====================
function render404() {
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p class="text-gray-600 mb-4">Page not found</p>
        <a href="/dashboard" class="text-indigo-600 hover:text-indigo-800">Go to Dashboard</a>
      </div>
    </div>
  `;
}

// ==================== GLOBAL ACTIONS ====================
window.createEndpoint = async function () {
  const name = prompt('Enter endpoint name:');
  if (!name) return;

  try {
    await endpointsApi.create(name);
    showToast('Endpoint created successfully', 'success');
    window.location.reload();
  } catch (err) {
    console.error('Failed to create endpoint:', err);
    showToast('Failed to create endpoint', 'error');
  }
};

window.deleteEndpoint = async function (id) {
  if (!confirm('Are you sure you want to delete this endpoint? This will also delete all associated webhooks.')) {
    return;
  }

  try {
    await endpointsApi.delete(id);
    showToast('Endpoint deleted successfully', 'success');
    window.location.href = '/dashboard';
  } catch (err) {
    console.error('Failed to delete endpoint:', err);
    showToast('Failed to delete endpoint', 'error');
  }
};

window.logout = async function () {
  try {
    await authApi.logout();
    window.location.href = '/';
  } catch (err) {
    console.error('Logout failed:', err);
    window.location.href = '/';
  }
};

// Export for inline handlers
window.showWebhookDetail = showWebhookDetail;
window.closeWebhookModal = closeWebhookModal;
window.replayWebhook = replayWebhook;
window.copyCurlCommand = copyCurlCommand;
window.showTab = showTab;
window.copyToClipboard = copyToClipboard;
window.getSourceIcon = getSourceIcon;
window.formatDate = formatDate;
window.showVerificationConfig = showVerificationConfig;
window.closeVerificationModal = closeVerificationModal;
window.saveVerificationConfig = saveVerificationConfig;

// Verification Configuration Modal
function showVerificationConfig(endpointId, currentMethod, hasSecret) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'verification-modal-backdrop';
  document.body.appendChild(backdrop);

  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-lg shadow-xl max-w-lg w-full m-4';
  modal.innerHTML = `
    <div class="p-6">
      <div class="flex justify-between items-start mb-6">
        <h2 class="text-xl font-bold text-gray-800">Signature Verification</h2>
        <button onclick="closeVerificationModal()" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Verification Method</label>
          <select id="verification-method" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="none" ${currentMethod === 'none' ? 'selected' : ''}>Disabled</option>
            <option value="stripe" ${currentMethod === 'stripe' ? 'selected' : ''}>Stripe</option>
            <option value="github" ${currentMethod === 'github' ? 'selected' : ''}>GitHub</option>
            <option value="slack" ${currentMethod === 'slack' ? 'selected' : ''}>Slack</option>
            <option value="shopify" ${currentMethod === 'shopify' ? 'selected' : ''}>Shopify</option>
            <option value="generic-hmac" ${currentMethod === 'generic-hmac' ? 'selected' : ''}>Generic HMAC-SHA256</option>
          </select>
        </div>

        <div id="secret-field" class="${currentMethod === 'none' ? 'hidden' : ''}">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Signing Secret ${hasSecret ? '(leave empty to keep current)' : ''}
          </label>
          <input
            type="password"
            id="verification-secret"
            placeholder="${hasSecret ? '••••••••••••••••' : 'Enter your webhook secret'}"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <p class="mt-1 text-xs text-gray-500">
            The secret key used to sign webhooks. Get this from your service's dashboard.
          </p>
        </div>

        <div id="method-help" class="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          ${getVerificationHelpText(currentMethod)}
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button onclick="closeVerificationModal()" class="px-4 py-2 text-gray-700 hover:text-gray-900">
          Cancel
        </button>
        <button onclick="saveVerificationConfig('${endpointId}')" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Save Configuration
        </button>
      </div>
    </div>
  `;
  backdrop.appendChild(modal);

  // Close on backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeVerificationModal();
    }
  });

  // Update help text when method changes
  document.getElementById('verification-method').addEventListener('change', (e) => {
    const method = e.target.value;
    const secretField = document.getElementById('secret-field');
    const helpText = document.getElementById('method-help');

    if (method === 'none') {
      secretField.classList.add('hidden');
    } else {
      secretField.classList.remove('hidden');
    }
    helpText.innerHTML = getVerificationHelpText(method);
  });
}

function getVerificationHelpText(method) {
  const helpTexts = {
    none: 'Verification is disabled. All webhooks will be accepted without signature validation.',
    stripe: '<strong>Stripe</strong> uses HMAC-SHA256 with a timestamp. Get your signing secret from the Stripe Dashboard → Developers → Webhooks → Signing secret.',
    github: '<strong>GitHub</strong> uses HMAC-SHA256 (sha256=). Get your secret from your repository\'s Webhooks settings → Secret.',
    slack: '<strong>Slack</strong> uses HMAC-SHA256 with a version prefix (v0=). Get your signing secret from your Slack App\'s Basic Information page.',
    shopify: '<strong>Shopify</strong> uses HMAC-SHA256 in base64 format. Get your secret from your app\'s webhook settings.',
    'generic-hmac': '<strong>Generic HMAC-SHA256</strong> for custom webhooks. Expects a signature in X-Hub-Signature or X-Webhook-Signature header.',
  };
  return helpTexts[method] || helpTexts.none;
}

function closeVerificationModal() {
  const backdrop = document.getElementById('verification-modal-backdrop');
  if (backdrop) {
    backdrop.remove();
  }
}

async function saveVerificationConfig(endpointId) {
  const method = document.getElementById('verification-method').value;
  const secretInput = document.getElementById('verification-secret');
  const secret = secretInput.value;

  // If method is not 'none' and no secret provided (and not updating existing), show error
  if (method !== 'none' && !secret && !secretInput.placeholder.includes('••••')) {
    showToast('Please enter a signing secret', 'error');
    return;
  }

  try {
    const updateData = { verification_method: method };
    if (secret) {
      updateData.verification_secret = secret;
    }

    await endpointsApi.update(endpointId, updateData);
    showToast('Verification configuration saved', 'success');
    closeVerificationModal();
    window.location.reload();
  } catch (err) {
    console.error('Failed to save verification config:', err);
    showToast('Failed to save configuration', 'error');
  }
}

// Initialize app
router();

// Handle navigation (SPA routing)
window.addEventListener('popstate', router);

// Intercept link clicks for SPA routing
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && link.href.startsWith(window.location.origin) && !link.getAttribute('href').startsWith('/api/') && !link.getAttribute('href').startsWith('/hook/')) {
    e.preventDefault();
    const path = new URL(link.href).pathname;
    window.history.pushState({}, '', path);
    router();
  }
});
