-- Confidencialidad por tarea: public (defecto, comporta como antes) vs private
-- (solo dueño, creador, asignados y lista explícita). Ver
-- plan-tareas-confidencialidad.md.
--
-- Aplicar en producción:
--   psql "$DATABASE_URL" -f migrations-manual/deploy-task-confidentiality.sql
-- o dejar que `initDatabase` lo aplique con INIT_DB_ON_START=true.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';

DO $$
BEGIN
  ALTER TABLE tasks
    ADD CONSTRAINT tasks_visibility_check CHECK (visibility IN ('public', 'private'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END
$$;

CREATE TABLE IF NOT EXISTS task_visible_to (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_visible_to_user
  ON task_visible_to(user_id);
