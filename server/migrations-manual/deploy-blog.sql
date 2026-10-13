-- Blog del sitio (ayudas y otros contenidos). Editor Markdown con imágenes
-- en el admin; las imágenes suben al storage vía POST /api/uploads.
--
-- Aplicar en producción:
--   psql "$DATABASE_URL" -f migrations-manual/deploy-blog.sql
-- o dejar que `initDatabase` lo cree con INIT_DB_ON_START=true.

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, created_at DESC);
