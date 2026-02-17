/**
 * API Client for Webhook Debugger
 * Simple fetch wrapper with auth and error handling
 */

const API_BASE = window.location.origin;

/**
 * Make an authenticated API request
 */
async function api(url, options = {}) {
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${url}`, config);

  // Handle 401 Unauthorized - redirect to home
  if (response.status === 401) {
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  // Handle other errors
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Auth API
 */
export const authApi = {
  getCurrentUser: () => api('/api/auth/me'),
  logout: () => api('/api/auth/logout', { method: 'POST' }),
};

/**
 * Endpoints API
 */
export const endpointsApi = {
  list: () => api('/api/endpoints'),
  create: (name) =>
    api('/api/endpoints', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  get: (id) => api(`/api/endpoints/${id}`),
  update: (id, data) =>
    api(`/api/endpoints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    api(`/api/endpoints/${id}`, {
      method: 'DELETE',
    }),
  // Configure signature verification
  configureVerification: (id, method, secret) =>
    api(`/api/endpoints/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        verification_method: method,
        verification_secret: secret,
      }),
    }),
};

/**
 * Webhooks API
 */
export const webhooksApi = {
  list: (endpointId, options = {}) => {
    const params = new URLSearchParams({
      limit: options.limit || '50',
      offset: options.offset || '0',
    });
    if (options.source) params.set('source', options.source);
    return api(`/api/endpoints/${endpointId}/webhooks?${params}`);
  },
  get: (id) => api(`/api/webhooks/${id}`),
  search: (endpointId, query, options = {}) => {
    const params = new URLSearchParams({
      q: query,
      limit: options.limit || '50',
      offset: options.offset || '0',
    });
    return api(`/api/endpoints/${endpointId}/webhooks/search?${params}`);
  },
  replay: (id, targetUrl) =>
    api(`/api/webhooks/${id}/replay`, {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl }),
    }),
};

export default api;
