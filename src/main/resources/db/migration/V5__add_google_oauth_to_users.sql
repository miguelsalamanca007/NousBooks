-- V5: support Google OAuth on the users table.
-- OAuth users don't have a local password, so we drop the NOT NULL constraint.
-- google_id is the Google "sub" claim — stable, unique, never reused. We index
-- it because we look users up by it on every Google login.
-- name is optional; Google provides it but it's not required for the app to work.

ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN name      VARCHAR(255);

ALTER TABLE users ADD CONSTRAINT uq_users_google_id UNIQUE (google_id);
