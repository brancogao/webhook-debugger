/**
 * Simple HMAC-based session token
 */

async function getKey(secret: string): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	return crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);
}

export async function createToken(data: string, secret: string): Promise<string> {
	const key = await getKey(secret);
	const encoder = new TextEncoder();
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));

	// Format: base64(data).base64(signature)
	const dataB64 = btoa(data);
	const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
	return `${dataB64}.${sigB64}`;
}

export async function verifyToken(token: string, secret: string): Promise<string | null> {
	const parts = token.split('.');
	if (parts.length !== 2) return null;

	const [dataB64, sigB64] = parts;
	const data = atob(dataB64);

	// Decode signature
	const sigBytes = atob(sigB64);
	const signature = new Uint8Array(sigBytes.length);
	for (let i = 0; i < sigBytes.length; i++) {
		signature[i] = sigBytes.charCodeAt(i);
	}

	const key = await getKey(secret);
	const encoder = new TextEncoder();
	const valid = await crypto.subtle.verify(
		'HMAC',
		key,
		signature,
		encoder.encode(data)
	);

	return valid ? data : null;
}
