-- Webhook Debugger Database Schema
-- Run: wrangler d1 execute webhook-debugger-db --file=./schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                    -- cuid2
    github_id INTEGER UNIQUE NOT NULL,      -- GitHub OAuth ID
    github_login TEXT,                      -- GitHub username
    email TEXT,                             -- optional email
    avatar_url TEXT,                        -- avatar URL
    plan TEXT DEFAULT 'free',               -- free | pro | team
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Endpoints table
CREATE TABLE IF NOT EXISTS endpoints (
    id TEXT PRIMARY KEY,                    -- cuid2
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Default Endpoint',   -- user-defined name
    path TEXT UNIQUE NOT NULL,              -- /hook/{uuid}
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Webhooks table (core)
CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,                    -- cuid2
    endpoint_id TEXT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,

    -- Request metadata
    method TEXT NOT NULL,                   -- GET | POST | PUT | DELETE
    source TEXT,                            -- auto-detected: stripe, github, shopify, slack, unknown
    source_verified BOOLEAN DEFAULT FALSE,  -- signature verification result

    -- Request content
    headers TEXT NOT NULL,                  -- JSON format
    body TEXT,                              -- raw body (may be empty)
    query_params TEXT,                      -- JSON format
    content_type TEXT,                      -- Content-Type header

    -- Replay related
    replay_count INTEGER DEFAULT 0,
    last_replay_at DATETIME,
    last_replay_status INTEGER,             -- last replay response status code
    last_replay_response TEXT,              -- last replay response body (truncated)

    -- Timestamps
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhooks_endpoint_time
    ON webhooks(endpoint_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhooks_source
    ON webhooks(endpoint_id, source);

CREATE INDEX IF NOT EXISTS idx_users_github
    ON users(github_id);

CREATE INDEX IF NOT EXISTS idx_endpoints_user
    ON endpoints(user_id);

-- Full-text search (D1 supports FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS webhooks_fts USING fts5(
    body,
    content='webhooks',
    content_rowid='rowid',
    tokenize='unicode61'
);

-- Triggers: auto-sync FTS index
CREATE TRIGGER IF NOT EXISTS webhooks_ai AFTER INSERT ON webhooks BEGIN
    INSERT INTO webhooks_fts(rowid, body) VALUES (new.rowid, new.body);
END;

CREATE TRIGGER IF NOT EXISTS webhooks_ad AFTER DELETE ON webhooks BEGIN
    INSERT INTO webhooks_fts(webhooks_fts, rowid, body)
        VALUES('delete', old.rowid, old.body);
END;

CREATE TRIGGER IF NOT EXISTS webhooks_au AFTER UPDATE ON webhooks BEGIN
    INSERT INTO webhooks_fts(webhooks_fts, rowid, body)
        VALUES('delete', old.rowid, old.body);
    INSERT INTO webhooks_fts(rowid, body) VALUES (new.rowid, new.body);
END;

-- Sessions table for auth
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user
    ON sessions(user_id);
