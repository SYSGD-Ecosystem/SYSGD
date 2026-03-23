CREATE TABLE IF NOT EXISTS updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  youtube_url TEXT,
  publish_date DATE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE updates ADD COLUMN IF NOT EXISTS youtube_url TEXT;

CREATE INDEX IF NOT EXISTS idx_updates_publish_date_desc ON updates(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_updates_created_at_desc ON updates(created_at DESC);
