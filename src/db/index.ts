/**
 * Database operations
 */

export interface User {
	id: string;
	github_id: number;
	github_login: string | null;
	email: string | null;
	avatar_url: string | null;
	plan: 'free' | 'pro' | 'team';
	created_at: string;
	updated_at: string;
}

export interface Endpoint {
	id: string;
	user_id: string;
	name: string;
	path: string;
	is_active: boolean;
	created_at: string;
}

export interface Webhook {
	id: string;
	endpoint_id: string;
	method: string;
	source: string | null;
	source_verified: boolean;
	headers: string;
	body: string | null;
	query_params: string | null;
	content_type: string | null;
	replay_count: number;
	last_replay_at: string | null;
	last_replay_status: number | null;
	last_replay_response: string | null;
	received_at: string;
	created_at: string;
}

export interface Session {
	id: string;
	user_id: string;
	expires_at: string;
	created_at: string;
}

// User operations
export async function getUserByGithubId(db: D1Database, githubId: number): Promise<User | null> {
	const result = await db.prepare('SELECT * FROM users WHERE github_id = ?')
		.bind(githubId)
		.first<User>();
	return result;
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
	const result = await db.prepare('SELECT * FROM users WHERE id = ?')
		.bind(id)
		.first<User>();
	return result;
}

export async function createUser(
	db: D1Database,
	user: Omit<User, 'created_at' | 'updated_at'>
): Promise<User> {
	await db.prepare(`
		INSERT INTO users (id, github_id, github_login, email, avatar_url, plan)
		VALUES (?, ?, ?, ?, ?, ?)
	`).bind(user.id, user.github_id, user.github_login, user.email, user.avatar_url, user.plan)
		.run();

	return (await getUserById(db, user.id))!;
}

export async function updateUser(
	db: D1Database,
	id: string,
	updates: Partial<Pick<User, 'github_login' | 'email' | 'avatar_url' | 'plan'>>
): Promise<User | null> {
	const fields: string[] = [];
	const values: unknown[] = [];

	if (updates.github_login !== undefined) {
		fields.push('github_login = ?');
		values.push(updates.github_login);
	}
	if (updates.email !== undefined) {
		fields.push('email = ?');
		values.push(updates.email);
	}
	if (updates.avatar_url !== undefined) {
		fields.push('avatar_url = ?');
		values.push(updates.avatar_url);
	}
	if (updates.plan !== undefined) {
		fields.push('plan = ?');
		values.push(updates.plan);
	}

	if (fields.length === 0) return getUserById(db, id);

	fields.push("updated_at = datetime('now')");
	values.push(id);

	await db.prepare(`
		UPDATE users SET ${fields.join(', ')} WHERE id = ?
	`).bind(...values).run();

	return getUserById(db, id);
}

// Endpoint operations
export async function getEndpointByPath(db: D1Database, path: string): Promise<Endpoint | null> {
	const result = await db.prepare('SELECT * FROM endpoints WHERE path = ?')
		.bind(path)
		.first<Endpoint>();
	return result;
}

export async function getEndpointById(db: D1Database, id: string): Promise<Endpoint | null> {
	const result = await db.prepare('SELECT * FROM endpoints WHERE id = ?')
		.bind(id)
		.first<Endpoint>();
	return result;
}

export async function getEndpointsByUserId(db: D1Database, userId: string): Promise<Endpoint[]> {
	const result = await db.prepare('SELECT * FROM endpoints WHERE user_id = ? ORDER BY created_at')
		.bind(userId)
		.all<Endpoint>();
	return result.results;
}

export async function countEndpointsByUserId(db: D1Database, userId: string): Promise<number> {
	const result = await db.prepare('SELECT COUNT(*) as count FROM endpoints WHERE user_id = ?')
		.bind(userId)
		.first<{ count: number }>();
	return result?.count ?? 0;
}

export async function createEndpoint(
	db: D1Database,
	endpoint: Omit<Endpoint, 'created_at'>
): Promise<Endpoint> {
	await db.prepare(`
		INSERT INTO endpoints (id, user_id, name, path, is_active)
		VALUES (?, ?, ?, ?, ?)
	`).bind(endpoint.id, endpoint.user_id, endpoint.name, endpoint.path, endpoint.is_active ? 1 : 0)
		.run();

	return (await getEndpointById(db, endpoint.id))!;
}

export async function updateEndpoint(
	db: D1Database,
	id: string,
	updates: Partial<Pick<Endpoint, 'name' | 'is_active'>>
): Promise<Endpoint | null> {
	const fields: string[] = [];
	const values: unknown[] = [];

	if (updates.name !== undefined) {
		fields.push('name = ?');
		values.push(updates.name);
	}
	if (updates.is_active !== undefined) {
		fields.push('is_active = ?');
		values.push(updates.is_active ? 1 : 0);
	}

	if (fields.length === 0) return getEndpointById(db, id);

	values.push(id);

	await db.prepare(`
		UPDATE endpoints SET ${fields.join(', ')} WHERE id = ?
	`).bind(...values).run();

	return getEndpointById(db, id);
}

export async function deleteEndpoint(db: D1Database, id: string): Promise<void> {
	await db.prepare('DELETE FROM endpoints WHERE id = ?').bind(id).run();
}

// Webhook operations
export async function getWebhookById(db: D1Database, id: string): Promise<Webhook | null> {
	const result = await db.prepare('SELECT * FROM webhooks WHERE id = ?')
		.bind(id)
		.first<Webhook>();
	return result;
}

export async function getWebhooksByEndpointId(
	db: D1Database,
	endpointId: string,
	options: {
		limit?: number;
		offset?: number;
		source?: string;
	} = {}
): Promise<Webhook[]> {
	const { limit = 50, offset = 0, source } = options;

	let sql = 'SELECT * FROM webhooks WHERE endpoint_id = ?';
	const params: unknown[] = [endpointId];

	if (source) {
		sql += ' AND source = ?';
		params.push(source);
	}

	sql += ' ORDER BY received_at DESC LIMIT ? OFFSET ?';
	params.push(limit, offset);

	const result = await db.prepare(sql).bind(...params).all<Webhook>();
	return result.results;
}

export async function countWebhooksByEndpointId(
	db: D1Database,
	endpointId: string,
	source?: string
): Promise<number> {
	let sql = 'SELECT COUNT(*) as count FROM webhooks WHERE endpoint_id = ?';
	const params: unknown[] = [endpointId];

	if (source) {
		sql += ' AND source = ?';
		params.push(source);
	}

	const result = await db.prepare(sql).bind(...params).first<{ count: number }>();
	return result?.count ?? 0;
}

export async function createWebhook(
	db: D1Database,
	webhook: Omit<Webhook, 'created_at' | 'received_at' | 'replay_count' | 'source_verified'>
): Promise<Webhook> {
	await db.prepare(`
		INSERT INTO webhooks (id, endpoint_id, method, source, headers, body, query_params, content_type)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`).bind(
		webhook.id,
		webhook.endpoint_id,
		webhook.method,
		webhook.source,
		webhook.headers,
		webhook.body,
		webhook.query_params,
		webhook.content_type
	).run();

	return (await getWebhookById(db, webhook.id))!;
}

export async function updateWebhookReplay(
	db: D1Database,
	id: string,
	status: number,
	response: string
): Promise<void> {
	await db.prepare(`
		UPDATE webhooks
		SET replay_count = replay_count + 1,
		    last_replay_at = datetime('now'),
		    last_replay_status = ?,
		    last_replay_response = ?
		WHERE id = ?
	`).bind(status, response.substring(0, 10000), id).run();
}

// Search webhooks using FTS5
export async function searchWebhooks(
	db: D1Database,
	endpointId: string,
	query: string,
	options: { limit?: number; offset?: number } = {}
): Promise<Webhook[]> {
	const { limit = 50, offset = 0 } = options;

	const result = await db.prepare(`
		SELECT w.*
		FROM webhooks w
		JOIN webhooks_fts fts ON w.rowid = fts.rowid
		WHERE w.endpoint_id = ? AND webhooks_fts MATCH ?
		ORDER BY w.received_at DESC
		LIMIT ? OFFSET ?
	`).bind(endpointId, query, limit, offset).all<Webhook>();

	return result.results;
}

// Session operations
export async function createSession(
	db: D1Database,
	session: Omit<Session, 'created_at'>
): Promise<Session> {
	await db.prepare(`
		INSERT INTO sessions (id, user_id, expires_at)
		VALUES (?, ?, ?)
	`).bind(session.id, session.user_id, session.expires_at).run();

	const result = await db.prepare('SELECT * FROM sessions WHERE id = ?')
		.bind(session.id)
		.first<Session>();
	return result!;
}

export async function getSessionById(db: D1Database, id: string): Promise<Session | null> {
	const result = await db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")')
		.bind(id)
		.first<Session>();
	return result;
}

export async function deleteSession(db: D1Database, id: string): Promise<void> {
	await db.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
}

export async function cleanExpiredSessions(db: D1Database): Promise<void> {
	await db.prepare('DELETE FROM sessions WHERE expires_at < datetime("now")').run();
}

// Cleanup old webhooks (run via cron)
export async function cleanupOldWebhooks(db: D1Database): Promise<{ freeDeleted: number; proDeleted: number }> {
	// Free users: 7 days retention
	const freeResult = await db.prepare(`
		DELETE FROM webhooks
		WHERE received_at < datetime('now', '-7 days')
		AND endpoint_id IN (
			SELECT e.id FROM endpoints e
			JOIN users u ON e.user_id = u.id
			WHERE u.plan = 'free'
		)
	`).run();

	// Pro/Team users: 90 days retention
	const proResult = await db.prepare(`
		DELETE FROM webhooks
		WHERE received_at < datetime('now', '-90 days')
		AND endpoint_id IN (
			SELECT e.id FROM endpoints e
			JOIN users u ON e.user_id = u.id
			WHERE u.plan != 'free'
		)
	`).run();

	return {
		freeDeleted: freeResult.meta.changes,
		proDeleted: proResult.meta.changes,
	};
}
