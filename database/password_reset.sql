-- Run once in pgAdmin Query Tool on the SAME database used by Backend/.env.
-- Adds only a password-reset table; does not delete or modify existing accounts.
CREATE TABLE IF NOT EXISTS password_reset_token (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at
    ON password_reset_token (expires_at);
