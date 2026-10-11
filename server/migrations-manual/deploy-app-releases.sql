-- Versiones publicadas de las apps (sección Aplicaciones de la web + aviso de
-- actualización en la app). Una fila por app_key con la ÚLTIMA release.
--
-- Aplicar en producción:
--   psql "$DATABASE_URL" -f migrations-manual/deploy-app-releases.sql
-- o dejar que `initDatabase` la cree con INIT_DB_ON_START=true.

CREATE TABLE IF NOT EXISTS app_releases (
  app_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  download_url TEXT NOT NULL,
  changelog TEXT NOT NULL DEFAULT '',
  version_name TEXT NOT NULL,
  version_code INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);
