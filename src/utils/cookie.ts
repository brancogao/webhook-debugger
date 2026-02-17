/**
 * Cookie utilities for session management
 */

export interface CookieOptions {
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: 'Strict' | 'Lax' | 'None';
	maxAge?: number;
	path?: string;
}

export function setCookie(
	name: string,
	value: string,
	options: CookieOptions = {}
): string {
	const parts: string[] = [`${name}=${value}`];

	if (options.httpOnly) parts.push('HttpOnly');
	if (options.secure) parts.push('Secure');
	if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
	if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
	if (options.path) parts.push(`Path=${options.path}`);

	return parts.join('; ');
}

export function getCookie(cookieHeader: string | null, name: string): string | null {
	if (!cookieHeader) return null;

	const cookies = cookieHeader.split(';').map(c => c.trim());
	for (const cookie of cookies) {
		const [key, value] = cookie.split('=');
		if (key === name) {
			return decodeURIComponent(value);
		}
	}
	return null;
}

export function deleteCookie(name: string, path = '/'): string {
	return setCookie(name, '', { maxAge: 0, path });
}
