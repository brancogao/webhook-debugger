/**
 * Webhook receiver - handles incoming webhooks
 */

import { cuid } from '../utils';
import { getEndpointByPath, createWebhook, getEndpointById, type Webhook, type Endpoint } from '../db';
import { verifyWebhookSignature, type VerificationMethod } from '../utils/signature';

// Extended Endpoint type with verification fields
interface EndpointWithVerification extends Endpoint {
	verification_secret?: string | null;
	verification_method?: string | null;
}

// Detect webhook source from headers
function detectSource(headers: Headers): string {
	const userAgent = headers.get('User-Agent')?.toLowerCase() || '';
	const contentType = headers.get('Content-Type')?.toLowerCase() || '';

	// Check for specific headers
	if (headers.get('Stripe-Signature')) return 'stripe';
	if (headers.get('X-GitHub-Event')) return 'github';
	if (headers.get('X-Shopify-Topic')) return 'shopify';
	if (headers.get('X-Slack-Signature')) return 'slack';
	if (headers.get('X-Telegram-Bot-Api-Secret-Token')) return 'telegram';
	if (headers.get('Twilio-Signature')) return 'twilio';
	if (headers.get('X-Hub-Signature')) return 'generic-hmac';
	if (headers.get('X-Webhook-Signature')) return 'generic-signature';

	// Check User-Agent
	if (userAgent.includes('stripe')) return 'stripe';
	if (userAgent.includes('github')) return 'github';
	if (userAgent.includes('shopify')) return 'shopify';
	if (userAgent.includes('slack')) return 'slack';
	if (userAgent.includes('twilio')) return 'twilio';
	if (userAgent.includes('paypal')) return 'paypal';
	if (userAgent.includes('square')) return 'square';
	if (userAgent.includes('sendgrid')) return 'sendgrid';
	if (userAgent.includes('mailgun')) return 'mailgun';
	if (userAgent.includes('twilio')) return 'twilio';

	// Check content type for hints
	if (contentType.includes('application/json')) {
		// Generic JSON webhook
	}

	return 'unknown';
}

// Convert headers to JSON string
function headersToJson(headers: Headers): string {
	const obj: Record<string, string> = {};
	headers.forEach((value, key) => {
		obj[key] = value;
	});
	return JSON.stringify(obj);
}

// Convert URLSearchParams to JSON string
function paramsToJson(params: URLSearchParams): string {
	const obj: Record<string, string> = {};
	params.forEach((value, key) => {
		obj[key] = value;
	});
	return JSON.stringify(obj);
}

export interface ReceiveWebhookResult {
	success: boolean;
	webhookId?: string;
	sourceVerified?: boolean;
	error?: string;
}

export async function receiveWebhook(
	request: Request,
	path: string,
	db: D1Database
): Promise<ReceiveWebhookResult> {
	// Find endpoint by path (with verification fields)
	const endpoint = await getEndpointByPath(db, `/hook/${path}`) as EndpointWithVerification | null;

	if (!endpoint) {
		return { success: false, error: 'Endpoint not found' };
	}

	if (!endpoint.is_active) {
		return { success: false, error: 'Endpoint is inactive' };
	}

	try {
		// Parse request
		const method = request.method;
		const headers = request.headers;
		const url = new URL(request.url);
		const queryParams = url.searchParams;
		const contentType = headers.get('Content-Type');

		// Get body
		let body: string | null = null;
		if (method !== 'GET' && method !== 'HEAD') {
			try {
				body = await request.text();
				// Limit body size to 1MB
				if (body.length > 1024 * 1024) {
					body = body.substring(0, 1024 * 1024) + '... [truncated]';
				}
			} catch {
				body = '[Failed to read body]';
			}
		}

		// Detect source
		const source = detectSource(headers);

		// Verify signature if configured
		let sourceVerified = false;
		const verificationMethod = endpoint.verification_method as VerificationMethod;
		const verificationSecret = endpoint.verification_secret;

		if (verificationMethod && verificationMethod !== 'none' && verificationSecret && body) {
			try {
				const result = await verifyWebhookSignature(
					body,
					headers,
					verificationMethod,
					verificationSecret
				);
				sourceVerified = result.verified;
				console.log(`Signature verification: ${result.verified ? 'passed' : 'failed'}`, result.reason);
			} catch (err) {
				console.error('Signature verification error:', err);
				sourceVerified = false;
			}
		}

		// Create webhook record
		const webhookId = cuid();
		await createWebhook(db, {
			id: webhookId,
			endpoint_id: endpoint.id,
			method,
			source,
			source_verified: sourceVerified,
			headers: headersToJson(headers),
			body,
			query_params: paramsToJson(queryParams),
			content_type: contentType,
			last_replay_at: null,
			last_replay_status: null,
			last_replay_response: null,
		});

		return { success: true, webhookId, sourceVerified };
	} catch (error) {
		console.error('Error receiving webhook:', error);
		return { success: false, error: 'Internal server error' };
	}
}

export interface WebhookResponse {
	status: string;
	webhook_id: string;
	endpoint: string;
	received_at: string;
}

export async function handleWebhookRequest(
	request: Request,
	path: string,
	db: D1Database
): Promise<Response> {
	const result = await receiveWebhook(request, path, db);

	if (!result.success) {
		// Always return 200 to not reveal system info
		// But log the error
		console.error('Webhook receive failed:', result.error);
		return new Response(JSON.stringify({ status: 'error' }), {
			status: 200, // Intentional: don't reveal errors to senders
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({
		status: 'captured',
		webhook_id: result.webhookId,
		endpoint: path,
		verified: result.sourceVerified ?? false,
		received_at: new Date().toISOString(),
	}), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
