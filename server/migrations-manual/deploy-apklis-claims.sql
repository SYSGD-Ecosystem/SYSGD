-- Solicitud de plan Pro para SYSGD Ecosystem por compra de licencia en
-- Apklis (Gestor Contable TCP). Ver plan-licencia-apklis-servidor.md y
-- Decisión 13 en GCTCP/plan-semantica-plan-usuario.md.
--
-- Sustituye a deploy-apklis-licence.sql (auto-activate retirado: la licencia
-- NO es plan). Si la tabla apklis_licence_activations llegó a crearse en algún
-- despliegue, queda huérfana y puede eliminarse a mano tras verificar que está
-- vacía:  DROP TABLE IF EXISTS apklis_licence_activations;
--
-- Aplicar en producción:
--   psql "$DATABASE_URL" -f migrations-manual/deploy-apklis-claims.sql
-- o dejar que `initDatabase` la cree con INIT_DB_ON_START=true.

CREATE TABLE IF NOT EXISTS apklis_claim_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('pro')),
  duration_months INTEGER NOT NULL CHECK (duration_months IN (1, 3, 12)),
  expected_amount_cup NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_review', 'approved', 'rejected', 'expired')),
  apklis_licence_uuid TEXT NOT NULL,
  apklis_licence_name TEXT NOT NULL,
  apklis_licence_days INTEGER NOT NULL,
  apklis_license TEXT,
  apklis_username TEXT,
  id_compra TEXT NOT NULL UNIQUE,
  transaction_no TEXT,
  sms_message TEXT NOT NULL,
  sms_amount_cup NUMERIC(10, 2),
  sms_amount_paid_cup NUMERIC(10, 2),
  sms_payment_date TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apklis_claim_orders_user
  ON apklis_claim_orders(user_id);

CREATE INDEX IF NOT EXISTS idx_apklis_claim_orders_status
  ON apklis_claim_orders(status);
