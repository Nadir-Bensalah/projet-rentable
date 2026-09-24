-- Security hardening (audit 2026-09-24)
-- Re-exports of a known document are free only up to the page count first charged,
-- and only a limited number of times per month.
ALTER TABLE usage_events ADD COLUMN reexports integer NOT NULL DEFAULT 0;
-- Ignore out-of-order provider events for a subscription.
ALTER TABLE subscriptions ADD COLUMN last_event_at timestamptz;
-- Referral abuse controls: canonical e-mail and signup IP hash.
ALTER TABLE users ADD COLUMN email_canonical text;
ALTER TABLE users ADD COLUMN signup_ip_hash text;
UPDATE users SET email_canonical = lower(email) WHERE email_canonical IS NULL;
CREATE INDEX users_email_canonical_idx ON users (email_canonical);
