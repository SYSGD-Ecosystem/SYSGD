-- ============================================================
-- DEPLOY MANUAL PRODUCCIÓN — Vínculo vendedor <-> miembro
-- Una fila por (workspace, vendedor_local) que mapea el vendedor
-- local (UUID generado por el dispositivo) con el usuario miembro
-- del espacio de trabajo. Con esto, el vendedor que inicia sesión
-- con SU cuenta en su propio teléfono aterriza en el POS restringido
-- de su vendedor/almacén.
--
-- La tabla es aditiva e idempotente (no toca cont_workspaces ni los
-- checks polimórficos). `almacen_id` es el almacén asignado al vendedor
-- (opcional; null = usa el principal del negocio).
-- ============================================================

CREATE TABLE IF NOT EXISTS cont_workspace_vendedor_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES cont_workspaces(id) ON DELETE CASCADE,
  vendedor_id TEXT NOT NULL,
  member_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  almacen_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, vendedor_id),
  UNIQUE (workspace_id, member_user_id)
);

CREATE INDEX IF NOT EXISTS idx_cwvl_workspace ON cont_workspace_vendedor_links(workspace_id);

-- Verificación rápida:
-- \d cont_workspace_vendedor_links
-- SELECT * FROM cont_workspace_vendedor_links LIMIT 3;