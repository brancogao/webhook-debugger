/**
 * Custom Env type extensions for Webhook Debugger
 * This file extends the generated worker-configuration.d.ts
 */

declare namespace Cloudflare {
	interface Env {
		// D1 Database binding
		DB: D1Database;

		// GitHub OAuth
		GITHUB_CLIENT_ID: string;
		GITHUB_CLIENT_SECRET: string;

		// Session cookie secret
		COOKIE_SECRET: string;

		// Environment (development | production)
		ENVIRONMENT?: string;
	}
}
