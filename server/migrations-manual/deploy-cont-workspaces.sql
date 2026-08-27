-- ============================================================
-- DEPLOY MANUAL PRODUCCIÓN — Espacios de trabajo colaborativos
-- Commit: f34585a (feat/server: espacios de trabajo contables)
-- Ejecutar ANTES de desplegar el código. Idempotente.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabla de workspaces (aditiva: NO toca cont_ledger_records)
CREATE TABLE IF NOT EXISTS cont_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  registro JSONB NOT NULL DEFAULT '{}'::jsonb,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cont_workspaces_owner ON cont_workspaces(owner_id);

-- 2. Ampliar CHECK polimórficos para admitir 'workspace'
ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_resource_type_check;
ALTER TABLE invitations
  ADD CONSTRAINT invitations_resource_type_check
  CHECK (resource_type IN ('project', 'archive', 'workspace'));

ALTER TABLE resource_access
  DROP CONSTRAINT IF EXISTS resource_access_resource_type_check;
ALTER TABLE resource_access
  ADD CONSTRAINT resource_access_resource_type_check
  CHECK (resource_type IN ('project', 'archive', 'workspace'));

-- Verificación rápida:
-- \d cont_workspaces
-- SELECT conname FROM pg_constraint WHERE conname LIKE '%resource_type%';
