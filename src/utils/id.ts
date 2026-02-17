/**
 * CUID2 generator - collision-safe, URL-friendly IDs
 */

const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const length = 24;

function random(): string {
	let result = '';
	const values = crypto.getRandomValues(new Uint8Array(length));
	for (let i = 0; i < length; i++) {
		result += alphabet[values[i] % alphabet.length];
	}
	return result;
}

export function cuid(): string {
	// Timestamp (base36) + random
	const timestamp = Date.now().toString(36);
	return timestamp + random();
}
