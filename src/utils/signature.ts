/**
 * Webhook Signature Verification
 * Supports: Stripe, GitHub, Slack, Shopify, Generic HMAC-SHA256
 */

export type VerificationMethod = 'none' | 'stripe' | 'github' | 'slack' | 'shopify' | 'generic-hmac';

export interface VerificationResult {
	verified: boolean;
	method: VerificationMethod;
	reason?: string;
}

/**
 * Verify Stripe webhook signature
 * Stripe sends: Stripe-Signature: t=1234567890,v1=abc123...
 */
async function verifyStripeSignature(
	body: string,
	signatureHeader: string | null,
	secret: string
): Promise<VerificationResult> {
	if (!signatureHeader) {
		return { verified: false, method: 'stripe', reason: 'Missing Stripe-Signature header' };
	}

	// Parse the signature header
	const elements = signatureHeader.split(',');
	let timestamp = '';
	let signature = '';

	for (const element of elements) {
		const [key, value] = element.split('=');
		if (key === 't') timestamp = value;
		if (key === 'v1') signature = value;
	}

	if (!timestamp || !signature) {
		return { verified: false, method: 'stripe', reason: 'Invalid signature format' };
	}

	// Check timestamp (reject if older than 5 minutes)
	const timestampInt = parseInt(timestamp, 10);
	const now = Math.floor(Date.now() / 1000);
	if (Math.abs(now - timestampInt) > 300) {
		return { verified: false, method: 'stripe', reason: 'Signature timestamp expired' };
	}

	// Compute expected signature
	const payload = `${timestamp}.${body}`;
	const encoder = new TextEncoder();
	const key = encoder.encode(secret);

	try {
		const cryptoKey = await crypto.subtle.importKey(
			'raw',
			key,
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign']
		);
		const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
		const expectedSignature = bufferToHex(signatureBuffer);
		const verified = signature === expectedSignature;
		return {
			verified,
			method: 'stripe',
			reason: verified ? undefined : 'Signature mismatch'
		};
	} catch (err) {
		return {
			verified: false,
			method: 'stripe',
			reason: `Verification error: ${err}`
		};
	}
}

/**
 * Verify GitHub webhook signature
 * GitHub sends: X-Hub-Signature-256: sha256=abc123...
 */
async function verifyGitHubSignature(
	body: string,
	signatureHeader: string | null,
	secret: string
): Promise<VerificationResult> {
	if (!signatureHeader) {
		return { verified: false, method: 'github', reason: 'Missing X-Hub-Signature-256 header' };
	}

	// Format: sha256=abc123...
	const match = signatureHeader.match(/^sha256=([a-fA-F0-9]+)$/);
	if (!match) {
		return { verified: false, method: 'github', reason: 'Invalid signature format' };
	}

	const signature = match[1];
	const encoder = new TextEncoder();
	const key = encoder.encode(secret);

	try {
		const cryptoKey = await crypto.subtle.importKey(
			'raw',
			key,
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign']
		);
		const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(body));
		const expectedSignature = bufferToHex(signatureBuffer);

		const verified = signature.toLowerCase() === expectedSignature.toLowerCase();
		return {
			verified,
			method: 'github',
			reason: verified ? undefined : 'Signature mismatch'
		};
	} catch (err) {
		return {
			verified: false,
			method: 'github',
			reason: `Verification error: ${err}`
		};
	}
}

/**
 * Verify Slack webhook signature
 * Slack sends: X-Slack-Signature: v0=abc123...
 * And: X-Slack-Request-Timestamp: 1234567890
 */
async function verifySlackSignature(
	body: string,
	signatureHeader: string | null,
	timestampHeader: string | null,
	secret: string
): Promise<VerificationResult> {
	if (!signatureHeader) {
		return { verified: false, method: 'slack', reason: 'Missing X-Slack-Signature header' };
	}
	if (!timestampHeader) {
		return { verified: false, method: 'slack', reason: 'Missing X-Slack-Request-Timestamp header' };
	}

	// Format: v0=abc123...
	const match = signatureHeader.match(/^v0=([a-fA-F0-9]+)$/);
	if (!match) {
		return { verified: false, method: 'slack', reason: 'Invalid signature format' };
	}

	const signature = match[1];

	// Check timestamp (reject if older than 5 minutes)
	const timestamp = parseInt(timestampHeader, 10);
	const now = Math.floor(Date.now() / 1000);
	if (Math.abs(now - timestamp) > 300) {
		return { verified: false, method: 'slack', reason: 'Signature timestamp expired' };
	}

	// Compute expected signature: v0:timestamp:body
	const basestring = `v0:${timestamp}:${body}`;
	const encoder = new TextEncoder();
	const key = encoder.encode(secret);

	try {
		const cryptoKey = await crypto.subtle.importKey(
			'raw',
			key,
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign']
		);
		const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(basestring));
		const expectedSignature = bufferToHex(signatureBuffer);

		const verified = signature.toLowerCase() === expectedSignature.toLowerCase();
		return {
			verified,
			method: 'slack',
			reason: verified ? undefined : 'Signature mismatch'
		};
	} catch (err) {
		return {
			verified: false,
			method: 'slack',
			reason: `Verification error: ${err}`
		};
	}
}

/**
 * Verify Shopify webhook signature
 * Shopify sends: X-Shopify-Hmac-SHA256: base64 encoded signature
 */
async function verifyShopifySignature(
	body: string,
	signatureHeader: string | null,
	secret: string
): Promise<VerificationResult> {
	if (!signatureHeader) {
		return { verified: false, method: 'shopify', reason: 'Missing X-Shopify-Hmac-SHA256 header' };
	}

	const encoder = new TextEncoder();
	const key = encoder.encode(secret);

	try {
		const cryptoKey = await crypto.subtle.importKey(
			'raw',
			key,
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign']
		);
		const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(body));

		// Shopify uses base64 encoding
		const expectedSignature = bufferToBase64(signatureBuffer);

		const verified = signatureHeader === expectedSignature;
		return {
			verified,
			method: 'shopify',
			reason: verified ? undefined : 'Signature mismatch'
		};
	} catch (err) {
		return {
			verified: false,
			method: 'shopify',
			reason: `Verification error: ${err}`
		};
	}
}

/**
 * Verify generic HMAC-SHA256 signature
 * Expects: X-Hub-Signature: sha256=abc123... or X-Webhook-Signature: sha256=abc123...
 */
async function verifyGenericHmacSignature(
	body: string,
	signatureHeader: string | null,
	secret: string
): Promise<VerificationResult> {
	if (!signatureHeader) {
		return { verified: false, method: 'generic-hmac', reason: 'Missing signature header' };
	}

	// Try to extract hex signature
	let signature = '';
	const hexMatch = signatureHeader.match(/^(?:sha256=)?([a-fA-F0-9]{64})$/);
	if (hexMatch) {
		signature = hexMatch[1];
	} else {
		// Maybe base64?
		const base64Match = signatureHeader.match(/^([A-Za-z0-9+/=]{44})$/);
		if (base64Match) {
			// Handle base64 case
			const encoder = new TextEncoder();
			const key = encoder.encode(secret);

			try {
				const cryptoKey = await crypto.subtle.importKey(
					'raw',
					key,
					{ name: 'HMAC', hash: 'SHA-256' },
					false,
					['sign']
				);
				const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(body));
				const expectedSignature = bufferToBase64(signatureBuffer);

				const verified = signatureHeader === expectedSignature;
				return {
					verified,
					method: 'generic-hmac',
					reason: verified ? undefined : 'Signature mismatch'
				};
			} catch (err) {
				return {
					verified: false,
					method: 'generic-hmac',
					reason: `Verification error: ${err}`
				};
			}
		}
		return { verified: false, method: 'generic-hmac', reason: 'Invalid signature format' };
	}

	const encoder = new TextEncoder();
	const key = encoder.encode(secret);

	try {
		const cryptoKey = await crypto.subtle.importKey(
			'raw',
			key,
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign']
		);
		const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(body));
		const expectedSignature = bufferToHex(signatureBuffer);

		const verified = signature.toLowerCase() === expectedSignature.toLowerCase();
		return {
			verified,
			method: 'generic-hmac',
			reason: verified ? undefined : 'Signature mismatch'
		};
	} catch (err) {
		return {
			verified: false,
			method: 'generic-hmac',
			reason: `Verification error: ${err}`
		};
	}
}

/**
 * Main verification function
 * Detects and verifies webhook signature based on method or auto-detection
 */
export async function verifyWebhookSignature(
	body: string,
	headers: Headers,
	method: VerificationMethod,
	secret: string
): Promise<VerificationResult> {
	if (method === 'none' || !secret) {
		return { verified: false, method: 'none', reason: 'No verification configured' };
	}

	switch (method) {
		case 'stripe':
			return verifyStripeSignature(body, headers.get('Stripe-Signature'), secret);

		case 'github':
			return verifyGitHubSignature(body, headers.get('X-Hub-Signature-256'), secret);

		case 'slack':
			return verifySlackSignature(
				body,
				headers.get('X-Slack-Signature'),
				headers.get('X-Slack-Request-Timestamp'),
				secret
			);

		case 'shopify':
			return verifyShopifySignature(body, headers.get('X-Shopify-Hmac-SHA256'), secret);

		case 'generic-hmac':
			// Try X-Hub-Signature first, then X-Webhook-Signature
			const sigHeader = headers.get('X-Hub-Signature') || headers.get('X-Webhook-Signature');
			return verifyGenericHmacSignature(body, sigHeader, secret);

		default:
			return { verified: false, method, reason: 'Unknown verification method' };
	}
}

/**
 * Auto-detect verification method from headers
 */
export function detectVerificationMethod(headers: Headers): VerificationMethod {
	if (headers.get('Stripe-Signature')) return 'stripe';
	if (headers.get('X-Hub-Signature-256')) return 'github';
	if (headers.get('X-Slack-Signature')) return 'slack';
	if (headers.get('X-Shopify-Hmac-SHA256')) return 'shopify';
	if (headers.get('X-Hub-Signature') || headers.get('X-Webhook-Signature')) return 'generic-hmac';
	return 'none';
}

// Helper functions
function bufferToHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');
}

function bufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}
