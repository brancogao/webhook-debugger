/**
 * Dashboard API - endpoints management and webhook viewing
 */

import { cuid } from '../utils';
import { requireAuth, type AuthUser, type AuthEnv } from '../auth';
import {
	getEndpointsByUserId,
	getEndpointById,
	createEndpoint,
	updateEndpoint,
	deleteEndpoint,
	countEndpointsByUserId,
	getWebhooksByEndpointId,
	getWebhookById,
	countWebhooksByEndpointId,
	updateWebhookReplay,
	searchWebhooks,
	type Endpoint,
	type Webhook,
} from '../db';

// Plan limits
const PLAN_LIMITS: Record<string, { endpoints: number }> = {
	free: { endpoints: 1 },
	pro: { endpoints: 10 },
	team: { endpoints: 50 },
};

// JSON response helper
function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

// Error response
function error(message: string, status = 400): Response {
	return json({ error: message }, status);
}

// Generate endpoint path
function generateEndpointPath(): string {
	// Generate a random path like /hook/abc123def456
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	const path = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
	return `/hook/${path}`;
}

// ============ Endpoints API ============

export async function handleListEndpoints(request: Request, env: AuthEnv): Promise<Response> {
	const user = await requireAuth(request, env);
	const endpoints = await getEndpointsByUserId(env.DB, user.id);
	return json({ endpoints });
}

export async function handleCreateEndpoint(request: Request, env: AuthEnv): Promise<Response> {
	const user = await requireAuth(request, env);

	// Check plan limits
	const currentCount = await countEndpointsByUserId(env.DB, user.id);
	const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;

	if (currentCount >= limits.endpoints) {
		return error(`Plan limit reached. ${user.plan} plan allows ${limits.endpoints} endpoints.`, 403);
	}

	// Parse request body
	let body: { name?: string } = {};
	try {
		body = await request.json();
	} catch {
		// Empty body is fine
	}

	// Create endpoint
	const endpointId = cuid();
	const path = generateEndpointPath();

	const endpoint = await createEndpoint(env.DB, {
		id: endpointId,
		user_id: user.id,
		name: body.name || 'Default Endpoint',
		path,
		is_active: true,
	});

	return json({ endpoint }, 201);
}

export async function handleGetEndpoint(request: Request, env: AuthEnv, endpointId: string): Promise<Response> {
	const user = await requireAuth(request, env);
	const endpoint = await getEndpointById(env.DB, endpointId);

	if (!endpoint || endpoint.user_id !== user.id) {
		return error('Endpoint not found', 404);
	}

	return json({ endpoint });
}

export async function handleUpdateEndpoint(request: Request, env: AuthEnv, endpointId: string): Promise<Response> {
	const user = await requireAuth(request, env);
	const endpoint = await getEndpointById(env.DB, endpointId);

	if (!endpoint || endpoint.user_id !== user.id) {
		return error('Endpoint not found', 404);
	}

	let body: {
		name?: string;
		is_active?: boolean;
		verification_secret?: string;
		verification_method?: string;
	} = {};
	try {
		body = await request.json();
	} catch {
		return error('Invalid JSON body');
	}

	// Validate verification_method if provided
	const validMethods = ['none', 'stripe', 'github', 'slack', 'shopify', 'generic-hmac'];
	if (body.verification_method && !validMethods.includes(body.verification_method)) {
		return error(`Invalid verification_method. Must be one of: ${validMethods.join(', ')}`);
	}

	const updated = await updateEndpoint(env.DB, endpointId, body);
	return json({ endpoint: updated });
}

export async function handleDeleteEndpoint(request: Request, env: AuthEnv, endpointId: string): Promise<Response> {
	const user = await requireAuth(request, env);
	const endpoint = await getEndpointById(env.DB, endpointId);

	if (!endpoint || endpoint.user_id !== user.id) {
		return error('Endpoint not found', 404);
	}

	await deleteEndpoint(env.DB, endpointId);
	return json({ success: true });
}

// ============ Webhooks API ============

export async function handleListWebhooks(
	request: Request,
	env: AuthEnv,
	endpointId: string
): Promise<Response> {
	const user = await requireAuth(request, env);
	const endpoint = await getEndpointById(env.DB, endpointId);

	if (!endpoint || endpoint.user_id !== user.id) {
		return error('Endpoint not found', 404);
	}

	const url = new URL(request.url);
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
	const offset = parseInt(url.searchParams.get('offset') || '0');
	const source = url.searchParams.get('source') || undefined;

	const [webhooks, total] = await Promise.all([
		getWebhooksByEndpointId(env.DB, endpointId, { limit, offset, source }),
		countWebhooksByEndpointId(env.DB, endpointId, source),
	]);

	return json({ webhooks, total, limit, offset });
}

export async function handleGetWebhook(
	request: Request,
	env: AuthEnv,
	webhookId: string
): Promise<Response> {
	const user = await requireAuth(request, env);
	const webhook = await getWebhookById(env.DB, webhookId);

	if (!webhook) {
		return error('Webhook not found', 404);
	}

	// Verify ownership
	const endpoint = await getEndpointById(env.DB, webhook.endpoint_id);
	if (!endpoint || endpoint.user_id !== user.id) {
		return error('Webhook not found', 404);
	}

	return json({ webhook });
}

export async function handleSearchWebhooks(
	request: Request,
	env: AuthEnv,
	endpointId: string
): Promise<Response> {
	const user = await requireAuth(request, env);
	const endpoint = await getEndpointById(env.DB, endpointId);

	if (!endpoint || endpoint.user_id !== user.id) {
		return error('Endpoint not found', 404);
	}

	const url = new URL(request.url);
	const query = url.searchParams.get('q');

	if (!query) {
		return error('Missing search query (q parameter)');
	}

	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
	const offset = parseInt(url.searchParams.get('offset') || '0');

	const webhooks = await searchWebhooks(env.DB, endpointId, query, { limit, offset });

	return json({ webhooks, query });
}

export async function handleReplayWebhook(
	request: Request,
	env: AuthEnv,
	webhookId: string
): Promise<Response> {
	const user = await requireAuth(request, env);
	const webhook = await getWebhookById(env.DB, webhookId);

	if (!webhook) {
		return error('Webhook not found', 404);
	}

	// Verify ownership
	const endpoint = await getEndpointById(env.DB, webhook.endpoint_id);
	if (!endpoint || endpoint.user_id !== user.id) {
		return error('Webhook not found', 404);
	}

	// Parse target URL from request body
	let body: { url?: string } = {};
	try {
		body = await request.json();
	} catch {
		return error('Invalid JSON body');
	}

	if (!body.url) {
		return error('Missing target URL');
	}

	// Validate URL
	let targetUrl: URL;
	try {
		targetUrl = new URL(body.url);
	} catch {
		return error('Invalid target URL');
	}

	// Only allow http/https
	if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
		return error('Only HTTP/HTTPS URLs are allowed');
	}

	// Prepare headers from original webhook
	let headers: Record<string, string> = {};
	try {
		headers = JSON.parse(webhook.headers);
	} catch {
		// Ignore parse errors
	}

	// Remove some headers that shouldn't be forwarded
	const headersToRemove = ['host', 'content-length', 'cf-connecting-ip', 'cf-ipcountry', 'x-forwarded-for'];
	for (const h of headersToRemove) {
		delete headers[h.toLowerCase()];
	}

	// Replay the webhook
	try {
		const response = await fetch(body.url, {
			method: webhook.method,
			headers,
			body: webhook.method !== 'GET' && webhook.method !== 'HEAD' ? webhook.body || undefined : undefined,
			redirect: 'follow',
		});

		const responseText = await response.text();

		// Update webhook with replay info
		await updateWebhookReplay(env.DB, webhookId, response.status, responseText);

		return json({
			success: true,
			status: response.status,
			response: responseText.substring(0, 10000),
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';
		return json({
			success: false,
			error: errorMessage,
		}, 500);
	}
}

// ============ User API ============

export async function handleGetCurrentUser(request: Request, env: AuthEnv): Promise<Response> {
	const user = await requireAuth(request, env);
	return json({ user });
}

// ============ Health Check ============

export async function handleHealthCheck(): Promise<Response> {
	return json({ status: 'ok', timestamp: new Date().toISOString() });
}
