-- Votos ("energía") para publicaciones de Descubre.
-- Ya se aplica automáticamente al arrancar el servidor vía initDatabase.ts.
-- Referencia de la migración manual si se necesita ejecutarla a mano en Supabase.

ALTER TABLE descubre_posts
ADD COLUMN IF NOT EXISTS votes_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS descubre_post_votes (
    post_id UUID NOT NULL REFERENCES descubre_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_descubre_post_votes_user ON descubre_post_votes(user_id);
