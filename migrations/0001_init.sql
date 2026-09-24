-- Relevéo — initial schema.
-- Statement contents are NEVER stored: parsing happens in the user's browser.
-- We only keep account, billing, usage counters and anonymous product analytics.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text NOT NULL,
  password_hash    text NOT NULL,
  name             text,
  email_verified_at timestamptz,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  referral_code    text NOT NULL,
  referred_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  first_touch      jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  last_login_at    timestamptz
);
CREATE UNIQUE INDEX users_email_key ON users (lower(email));
CREATE UNIQUE INDEX users_referral_code_key ON users (referral_code);

CREATE TABLE sessions (
  id          text PRIMARY KEY,               -- sha256(token), the raw token only lives in the cookie
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  user_agent  text,
  ip_hash     text
);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

CREATE TABLE email_tokens (
  id          text PRIMARY KEY,               -- sha256(token)
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose     text NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_tokens_user_idx ON email_tokens (user_id, purpose);

CREATE TABLE subscriptions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider                 text NOT NULL,
  provider_subscription_id text NOT NULL,
  provider_customer_id     text,
  plan                     text NOT NULL,           -- pro | business
  interval                 text NOT NULL,           -- month | year
  status                   text NOT NULL,           -- active | past_due | canceled | expired | paused
  current_period_end       timestamptz,
  cancel_at_period_end     boolean NOT NULL DEFAULT false,
  portal_url               text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subscription_id)
);
CREATE INDEX subscriptions_user_idx ON subscriptions (user_id);

CREATE TABLE orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES users(id) ON DELETE SET NULL,
  provider           text NOT NULL,
  provider_order_id  text NOT NULL,
  kind               text NOT NULL,             -- pack | subscription_payment | refund
  product            text NOT NULL,
  amount_cents       integer NOT NULL,
  currency           text NOT NULL,
  status             text NOT NULL,             -- paid | refunded | failed
  receipt_url        text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_order_id)
);
CREATE INDEX orders_user_idx ON orders (user_id, created_at DESC);

-- Prepaid page credits (packs, referral rewards, goodwill).
CREATE TABLE credit_grants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pages       integer NOT NULL CHECK (pages > 0),
  remaining   integer NOT NULL CHECK (remaining >= 0),
  source      text NOT NULL,                  -- pack | referral | admin
  reference   text NOT NULL,                  -- idempotency key (order id, referral id...)
  expires_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, reference)
);
CREATE INDEX credit_grants_user_idx ON credit_grants (user_id);

-- One row per charged export. The document fingerprint (sha-256 of the PDF bytes,
-- computed in the browser) lets users re-export the same statement without paying twice.
CREATE TABLE usage_events (
  id               bigserial PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period           text NOT NULL,             -- YYYY-MM (UTC)
  pages            integer NOT NULL CHECK (pages >= 0),
  from_allowance   integer NOT NULL DEFAULT 0,
  from_credits     integer NOT NULL DEFAULT 0,
  document_hash    text NOT NULL,
  format           text NOT NULL,
  bank_id          text,
  reconciled       text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX usage_events_user_period_idx ON usage_events (user_id, period);
CREATE UNIQUE INDEX usage_events_user_doc_period_key ON usage_events (user_id, document_hash, period);

CREATE TABLE webhook_events (
  provider      text NOT NULL,
  event_id      text NOT NULL,
  event_type    text NOT NULL,
  received_at   timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz,
  error         text,
  PRIMARY KEY (provider, event_id)
);

CREATE TABLE analytics_events (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  anon_id     text,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  path        text,
  referrer    text,
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  props       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_events_name_time_idx ON analytics_events (name, created_at);
CREATE INDEX analytics_events_time_idx ON analytics_events (created_at);

CREATE TABLE rate_limits (
  key        text PRIMARY KEY,
  count      integer NOT NULL,
  reset_at   timestamptz NOT NULL
);

CREATE TABLE email_log (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  to_address  text NOT NULL,
  template    text NOT NULL,
  dedupe_key  text,
  provider    text NOT NULL,
  provider_id text,
  status      text NOT NULL,                 -- sent | failed
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX email_log_dedupe_key ON email_log (dedupe_key) WHERE dedupe_key IS NOT NULL;

CREATE TABLE contact_messages (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  email       text NOT NULL,
  topic       text NOT NULL,
  message     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Opt-in, anonymised layout reports sent by users when a statement is not read correctly.
-- Contains ONLY structure (column count, detected roles, warnings), never text or amounts.
CREATE TABLE layout_reports (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  bank_id     text,
  summary     jsonb NOT NULL,
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
