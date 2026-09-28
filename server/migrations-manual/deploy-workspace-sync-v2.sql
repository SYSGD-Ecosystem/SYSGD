-- ============================================================
-- DEPLOY MANUAL PRODUCCIÓN — Sincronización inteligente + roles
-- Columnas aditivas y seguras. Idempotente.
--
-- 1) `sections`: metadatos de versión por sección (clave -> epoch-millis o
--    ISO que el cliente decide). Permite al cliente hacer merge por sección
--    sin depender del blob completo. Datos NO sensibles (solo versiones),
--    por eso no se cifran junto al `registro`.
--
-- 2) Roles: NO existe CHECK sobre `role` en `resource_access` ni
--    `invitations`, así que el rol 'vendedor' ya es aceptable; la validación
--    vive en el código (ROLES_VALIDOS). No se altera ningún constraint.
-- ============================================================

ALTER TABLE cont_workspaces
  ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Verificación rápida:
-- \d cont_workspaces
-- SELECT id, name, sections FROM cont_workspaces LIMIT 3;