-- Withdrawal-waiver consent given before each checkout (art. L221-28 C. conso).
CREATE TABLE checkout_consents (
  id            bigserial PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product       text NOT NULL,
  text_version  text NOT NULL,
  consent_text  text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX checkout_consents_user_idx ON checkout_consents (user_id, product, created_at DESC);
