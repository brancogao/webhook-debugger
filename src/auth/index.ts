/**
 * GitHub OAuth authentication
 */

import { cuid, createToken, verifyToken, setCookie, getCookie, deleteCookie } from '../utils';
import {
	getUserByGithubId,
	getUserById,
	createUser,
	updateUser,
	createSession,
	getSessionById,
	deleteSession,
	type User,
} from '../db';

const SESSION_DURATION_DAYS = 30;
const SESSION_DURATION_SECONDS = SESSION_DURATION_DAYS * 24 * 60 * 60;

export interface AuthEnv {
	DB: D1Database;
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
	COOKIE_SECRET: string;
}

export interface AuthUser {
	id: string;
	github_login: string | null;
	avatar_url: string | null;
	plan: string;
}

// GitHub OAuth URLs
export function getGitHubOAuthUrl(env: AuthEnv, redirectUri: string, state: string): string {
	const params = new URLSearchParams({
		client_id: env.GITHUB_CLIENT_ID,
		redirect_uri: redirectUri,
		scope: 'read:user user:email',
		state: state,
	});
	return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

// Exchange code for access token
async function exchangeCodeForToken(code: string, env: AuthEnv, redirectUri: string): Promise<string> {
	const response = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: JSON.stringify({
			client_id: env.GITHUB_CLIENT_ID,
			client_secret: env.GITHUB_CLIENT_SECRET,
			code: code,
			redirect_uri: redirectUri,
		}),
	});

	const data = await response.json() as { access_token?: string; error?: string };
	if (data.error || !data.access_token) {
		throw new Error(data.error || 'Failed to get access token');
	}

	return data.access_token;
}

// Get GitHub user info
async function getGitHubUser(accessToken: string): Promise<{
	id: number;
	login: string;
	email: string | null;
	avatar_url: string;
}> {
	const response = await fetch('https://api.github.com/user', {
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Accept': 'application/vnd.github.v3+json',
			'User-Agent': 'Webhook-Debugger',
		},
	});

	if (!response.ok) {
		throw new Error('Failed to fetch GitHub user');
	}

	return response.json();
}

// Complete OAuth flow
export async function handleOAuthCallback(
	code: string,
	env: AuthEnv,
	redirectUri: string
): Promise<{ user: User; sessionId: string }> {
	// Exchange code for token
	const accessToken = await exchangeCodeForToken(code, env, redirectUri);

	// Get GitHub user info
	const githubUser = await getGitHubUser(accessToken);

	// Check if user exists
	let user = await getUserByGithubId(env.DB, githubUser.id);

	if (!user) {
		// Create new user
		user = await createUser(env.DB, {
			id: cuid(),
			github_id: githubUser.id,
			github_login: githubUser.login,
			email: githubUser.email,
			avatar_url: githubUser.avatar_url,
			plan: 'free',
		});
	} else {
		// Update user info
		user = await updateUser(env.DB, user.id, {
			github_login: githubUser.login,
			email: githubUser.email,
			avatar_url: githubUser.avatar_url,
		}) ?? user;
	}

	// Create session
	const sessionId = cuid();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

	await createSession(env.DB, {
		id: sessionId,
		user_id: user.id,
		expires_at: expiresAt,
	});

	return { user, sessionId };
}

// Get current user from request
export async function getCurrentUser(request: Request, env: AuthEnv): Promise<AuthUser | null> {
	const cookieHeader = request.headers.get('Cookie');
	const sessionId = getCookie(cookieHeader, 'session');

	if (!sessionId) return null;

	// Verify session token
	const sessionData = await verifyToken(sessionId, env.COOKIE_SECRET);
	if (!sessionData) return null;

	const [sessionIdFromToken, userId] = sessionData.split(':');
	if (sessionIdFromToken !== sessionId.split('.')[0]) return null;

	// Check session in database
	const session = await getSessionById(env.DB, sessionIdFromToken);
	if (!session) return null;

	// Get user
	const user = await getUserById(env.DB, session.user_id);
	if (!user) return null;

	return {
		id: user.id,
		github_login: user.github_login,
		avatar_url: user.avatar_url,
		plan: user.plan,
	};
}

// Create session cookie
export async function createSessionCookie(sessionId: string, env: AuthEnv): Promise<string> {
	const token = await createToken(sessionId, env.COOKIE_SECRET);
	return setCookie('session', token, {
		httpOnly: true,
		secure: true,
		sameSite: 'Lax',
		maxAge: SESSION_DURATION_SECONDS,
		path: '/',
	});
}

// Logout
export async function logout(request: Request, env: AuthEnv): Promise<string> {
	const cookieHeader = request.headers.get('Cookie');
	const sessionId = getCookie(cookieHeader, 'session');

	if (sessionId) {
		const sessionData = await verifyToken(sessionId, env.COOKIE_SECRET);
		if (sessionData) {
			const [sessionIdFromToken] = sessionData.split(':');
			await deleteSession(env.DB, sessionIdFromToken);
		}
	}

	return deleteCookie('session', '/');
}

// Require authentication middleware
export async function requireAuth(request: Request, env: AuthEnv): Promise<AuthUser> {
	const user = await getCurrentUser(request, env);
	if (!user) {
		throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	return user;
}
