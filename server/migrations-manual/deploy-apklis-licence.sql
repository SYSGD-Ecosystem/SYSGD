-- Activación idempotente de Plan Pro por licencia Apklis (Android)
-- Ver plan-licencia-apklis-servidor.md
--
-- Aplicar en producción:
--   psql "$DATABASE_URL" -f migrations-manual/deploy-apklis-licence.sql
-- o dejar que `initDatabase` la cree con INIT_DB_ON_START=true.

CREATE TABLE IF NOT EXISTS apklis_licence_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  apklis_license TEXT NOT NULL,
  apklis_licence_uuid TEXT NOT NULL,
  apklis_licence_name TEXT NOT NULL,
  apklis_licence_days INTEGER NOT NULL,
  apklis_username TEXT,
  package_name TEXT,
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, apklis_license)
);

CREATE INDEX IF NOT EXISTS idx_apklis_licence_activations_user_id
  ON apklis_licence_activations(user_id);
