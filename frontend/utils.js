/**
 * Utility functions
 */

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

/**
 * Format date
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    showToast('Failed to copy', 'error');
    return false;
  }
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get source icon SVG
 */
export function getSourceIcon(source) {
  const icons = {
    github: `<svg class="source-icon" viewBox="0 0 24 24" fill="#1f2937">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>`,
    stripe: `<svg class="source-icon" viewBox="0 0 24 24" fill="#635bff">
      <rect width="24" height="24" rx="4"/>
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 4.515.858l.662-4.097S15.562 1.5 12.44 1.5c-1.801 0-3.312.474-4.417 1.338C6.842 3.748 6.236 4.99 6.236 6.466c0 4.272 5.864 4.512 5.864 6.84 0 .909-.785 1.356-2.069 1.356-2.921 0-5.677-1.427-5.677-1.427l-.705 4.135s2.488 1.408 5.779 1.408c1.906 0 3.49-.453 4.609-1.35 1.272-1.008 1.942-2.482 1.942-4.385 0-4.384-6.003-4.562-6.003-6.893z" fill="white"/>
    </svg>`,
    slack: `<svg class="source-icon" viewBox="0 0 24 24" fill="#4a154b">
      <path d="M5.042 15.165a2.528 2.528 0 1 0 2.528 2.529 2.528 2.528 0 0 0-2.528-2.529zm0-4.288a2.528 2.528 0 1 0 2.528 2.528 2.528 2.528 0 0 0-2.528-2.528zm0-4.288a2.528 2.528 0 1 0 2.528 2.528 2.528 2.528 0 0 0-2.528-2.529zm4.288 8.576a2.528 2.528 0 1 0 2.529 2.529 2.528 2.528 0 0 0-2.529-2.529zm0-4.288a2.528 2.528 0 1 0 2.529 2.528 2.528 2.528 0 0 0-2.529-2.528zm0-4.288a2.528 2.528 0 1 0 2.529 2.528 2.528 0 0 0-2.529-2.529z"/>
      <path d="M18.958 8.835a2.528 2.528 0 1 0-2.528-2.528 2.528 2.528 0 0 0 2.528 2.528zm-4.288 0a2.528 2.528 0 1 0-2.529-2.528 2.528 2.528 0 0 0 2.529 2.528zm0 4.288a2.528 2.528 0 1 0-2.529 2.528 2.528 2.528 0 0 0 2.529-2.528zm0 4.288a2.528 2.528 0 1 0-2.529 2.529 2.528 2.528 0 0 0 2.529-2.529zm4.288-8.576a2.528 2.528 0 1 0-2.528 2.528 2.528 2.528 0 0 0 2.528-2.528z" opacity="0.5"/>
    </svg>`,
    shopify: `<svg class="source-icon" viewBox="0 0 24 24" fill="#95bf47">
      <path d="M18.958 8.835a2.528 2.528 0 1 0-2.528-2.528 2.528 2.528 0 0 0 2.528 2.528z"/>
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"/>
    </svg>`,
  };

  return icons[source] || `<svg class="source-icon" viewBox="0 0 24 24" fill="#64748b">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>`;
}

/**
 * Generate cURL command from webhook
 */
export function generateCurlCommand(webhook, webhookUrl) {
  const headers = JSON.parse(webhook.headers || '{}');
  const headerParts = Object.entries(headers)
    .filter(([key]) => !['host', 'content-length', 'cf-connecting-ip'].includes(key.toLowerCase()))
    .map(([key, value]) => `  -H '${key}: ${value}'`)
    .join(' \\\n');

  const bodyPart = webhook.body && webhook.method !== 'GET' && webhook.method !== 'HEAD'
    ? ` \\\n  -d '${webhook.body}'`
    : '';

  return `curl -X ${webhook.method} ${webhookUrl} \\\n${headerParts}${bodyPart}`;
}

/**
 * Format JSON with syntax highlighting
 */
export function formatJSON(json) {
  try {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    const formatted = JSON.stringify(obj, null, 2);

    // Simple syntax highlighting
    return formatted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'text-purple-600'; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-600'; // key
          } else {
            cls = 'text-green-600'; // string
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-red-600'; // boolean
        } else if (/null/.test(match)) {
          cls = 'text-gray-500'; // null
        }
        return `<span class="${cls}">${match}</span>`;
      });
  } catch (e) {
    return json;
  }
}

/**
 * Parse query string
 */
export function parseQueryString(queryString) {
  const params = new URLSearchParams(queryString);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}
