/**
 * Webhook Debugger - Cloudflare Workers Entry Point
 *
 * A tool for debugging webhooks with 90-day history and one-click replay.
 */

import {
	getGitHubOAuthUrl,
	handleOAuthCallback,
	getCurrentUser,
	logout,
	createSessionCookie,
	type AuthEnv,
} from './auth';
import {
	handleWebhookRequest,
	handleListEndpoints,
	handleCreateEndpoint,
	handleGetEndpoint,
	handleUpdateEndpoint,
	handleDeleteEndpoint,
	handleListWebhooks,
	handleGetWebhook,
	handleSearchWebhooks,
	handleReplayWebhook,
	handleGetCurrentUser,
	handleHealthCheck,
} from './api';
import { cuid } from './utils';

// Extend Env type
interface Env extends AuthEnv {
	ENVIRONMENT: string;
	ASSETS: Fetcher;
}

// CORS headers for API
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// JSON response helper
function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...corsHeaders, ...headers },
	});
}

// Route matching helper
function matchRoute(pathname: string, pattern: string): Record<string, string> | null {
	const params: Record<string, string> = {};
	const pathParts = pathname.split('/').filter(Boolean);
	const patternParts = pattern.split('/').filter(Boolean);

	if (pathParts.length !== patternParts.length) return null;

	for (let i = 0; i < patternParts.length; i++) {
		if (patternParts[i].startsWith(':')) {
			params[patternParts[i].slice(1)] = pathParts[i];
		} else if (patternParts[i] !== pathParts[i]) {
			return null;
		}
	}

	return params;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		// ========== Static Assets ==========
		// Try to serve from ASSETS binding first
		if (env.ASSETS) {
			try {
				const assetResponse = await env.ASSETS.fetch(request);
				// If asset exists (status 200), return it
				if (assetResponse.status === 200) {
					return assetResponse;
				}
			} catch {
				// Fall through to Workers routes
			}
		}

		// For SPA routes (non-API, non-webhook), return index.html
		if (!pathname.startsWith('/api/') && !pathname.startsWith('/hook/')) {
			if (env.ASSETS) {
				try {
					const indexResponse = await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
					if (indexResponse.status === 200) {
						return indexResponse;
					}
				} catch {
					// Fallback to Workers response
				}
			}
		}

		// ========== Health Check ==========
		if (pathname === '/health' || pathname === '/api/health') {
			return handleHealthCheck();
		}

		// ========== Auth Routes ==========
		// GitHub OAuth - redirect to GitHub
		if (pathname === '/api/auth/github' && request.method === 'GET') {
			const state = cuid();
			// In production, you'd want to validate state
			const redirectUri = `${url.origin}/api/auth/callback`;
			const githubUrl = getGitHubOAuthUrl(env, redirectUri, state);

			// Store state in cookie for validation
			const stateCookie = `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;

			return new Response(null, {
				status: 302,
				headers: {
					'Location': githubUrl,
					'Set-Cookie': stateCookie,
				},
			});
		}

		// GitHub OAuth callback
		if (pathname === '/api/auth/callback' && request.method === 'GET') {
			const code = url.searchParams.get('code');
			const state = url.searchParams.get('state');

			if (!code) {
				return json({ error: 'Missing authorization code' }, 400);
			}

			try {
				const redirectUri = `${url.origin}/api/auth/callback`;
				const { user, sessionId } = await handleOAuthCallback(code, env, redirectUri);

				// Create session cookie
				const cookieHeader = await createSessionCookie(sessionId, env);

				// Redirect to dashboard
				return new Response(null, {
					status: 302,
					headers: {
						'Location': '/dashboard',
						'Set-Cookie': cookieHeader,
					},
				});
			} catch (error) {
				console.error('OAuth callback error:', error);
				return new Response(null, {
					status: 302,
					headers: { 'Location': '/?error=auth_failed' },
				});
			}
		}

		// Logout
		if (pathname === '/api/auth/logout' && request.method === 'POST') {
			const cookieHeader = await logout(request, env);
			return json({ success: true }, 200, { 'Set-Cookie': cookieHeader });
		}

		// Get current user
		if (pathname === '/api/auth/me' && request.method === 'GET') {
			return handleGetCurrentUser(request, env);
		}

		// ========== Webhook Receiver ==========
		// Match /hook/{path} - this must be before other routes
		const hookMatch = matchRoute(pathname, '/hook/:path');
		if (hookMatch) {
			// Accept any method for webhooks
			return handleWebhookRequest(request, hookMatch.path, env.DB);
		}

		// ========== API Routes (require auth) ==========
		// Endpoints
		if (pathname === '/api/endpoints') {
			if (request.method === 'GET') {
				return handleListEndpoints(request, env);
			}
			if (request.method === 'POST') {
				return handleCreateEndpoint(request, env);
			}
		}

		let match;

		// Single endpoint
		match = matchRoute(pathname, '/api/endpoints/:id');
		if (match) {
			if (request.method === 'GET') {
				return handleGetEndpoint(request, env, match.id);
			}
			if (request.method === 'PUT' || request.method === 'PATCH') {
				return handleUpdateEndpoint(request, env, match.id);
			}
			if (request.method === 'DELETE') {
				return handleDeleteEndpoint(request, env, match.id);
			}
		}

		// Webhooks for an endpoint
		match = matchRoute(pathname, '/api/endpoints/:endpointId/webhooks');
		if (match && request.method === 'GET') {
			return handleListWebhooks(request, env, match.endpointId);
		}

		// Search webhooks
		match = matchRoute(pathname, '/api/endpoints/:endpointId/webhooks/search');
		if (match && request.method === 'GET') {
			return handleSearchWebhooks(request, env, match.endpointId);
		}

		// Single webhook
		match = matchRoute(pathname, '/api/webhooks/:id');
		if (match && request.method === 'GET') {
			return handleGetWebhook(request, env, match.id);
		}

		// Replay webhook
		match = matchRoute(pathname, '/api/webhooks/:id/replay');
		if (match && request.method === 'POST') {
			return handleReplayWebhook(request, env, match.id);
		}

		// ========== Fallback ==========
		// API 404
		if (pathname.startsWith('/api/')) {
			return json({ error: 'Not found' }, 404);
		}

		// Return simple HTML as fallback
		return new Response(
			`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Webhook Debugger</title>
	<style>
		body { font-family: system-ui, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
		h1 { color: #4F46E5; }
		code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
		.endpoint { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0; }
	</style>
</head>
<body>
	<h1>Webhook Debugger</h1>
	<p>Capture, inspect, and replay webhooks with 90-day history.</p>

	<div class="endpoint">
		<h3>API Endpoints</h3>
		<ul>
			<li><code>GET /api/auth/github</code> - GitHub OAuth login</li>
			<li><code>GET /api/auth/callback</code> - OAuth callback</li>
			<li><code>GET /api/auth/me</code> - Get current user</li>
			<li><code>POST /api/auth/logout</code> - Logout</li>
			<li><code>GET/POST /api/endpoints</code> - List/Create endpoints</li>
			<li><code>GET/PUT/DELETE /api/endpoints/:id</code> - Endpoint CRUD</li>
			<li><code>GET /api/endpoints/:id/webhooks</code> - List webhooks</li>
			<li><code>GET /api/webhooks/:id</code> - Get webhook details</li>
			<li><code>POST /api/webhooks/:id/replay</code> - Replay webhook</li>
		</ul>
	</div>

	<div class="endpoint">
		<h3>Webhook Receiver</h3>
		<p>Send webhooks to: <code>POST /hook/{your-endpoint-path}</code></p>
	</div>

	<p><a href="/api/auth/github">Login with GitHub</a> to get started.</p>
</body>
</html>`,
			{
				headers: { 'Content-Type': 'text/html' },
			}
		);
	},

	// Scheduled cleanup of old webhooks
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		const { cleanupOldWebhooks } = await import('./db');
		const result = await cleanupOldWebhooks(env.DB);
		console.log(`Cleanup complete: ${result.freeDeleted} free, ${result.proDeleted} pro webhooks deleted`);
	},
} satisfies ExportedHandler<Env>;
