-- Normaliza correos y elimina cuentas duplicadas por email.
--
-- Caso típico: una cuenta activa (con contraseña) y otra creada por una
-- invitación con el mismo correo pero distinto uso de mayúsculas/espacios.
-- La cuenta activa se conserva y la invitada se fusiona en ella.
--
-- Si un mismo correo tiene MÁS DE UNA cuenta no invitada, el script aborta
-- para que se resuelva manualmente: no borra cuentas reales automáticamente.
--
-- Uso:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f deploy-users-email-unique.sql
--
-- Antes de ejecutar, revisar duplicados con:
--   SELECT LOWER(BTRIM(email)) AS email, COUNT(*)
--   FROM users
--   WHERE email IS NOT NULL AND BTRIM(email) <> ''
--   GROUP BY 1
--   HAVING COUNT(*) > 1;

BEGIN;

-- 1) Quitar temporalmente el índice/restricción único antiguo (sensible a
--    mayúsculas) para poder normalizar los correos sin chocar con él.
DO $$
DECLARE
  con RECORD;
  email_attnum SMALLINT;
BEGIN
  SELECT attnum INTO email_attnum
  FROM pg_attribute
  WHERE attrelid = 'users'::regclass AND attname = 'email';

  FOR con IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND contype = 'u'
      AND conkey = ARRAY[email_attnum]
  LOOP
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

DROP INDEX IF EXISTS idx_users_email_unique;

-- 2) Auditoría de las cuentas que se fusionan.
--    Después de validar la migración puedes eliminar esta tabla:
--    DROP TABLE users_merge_backup;
CREATE TABLE IF NOT EXISTS users_merge_backup (
  id BIGSERIAL PRIMARY KEY,
  merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  canonical_user_id UUID NOT NULL,
  duplicate_user JSONB NOT NULL
);

-- 3) Fusionar duplicados. Se conserva la cuenta real (con contraseña y/o
--    estado distinto de 'invited') y se mueven todas sus referencias.
DO $$
DECLARE
  dup RECORD;
  canonical_id UUID;
  duplicate_id UUID;
  duplicate_ids UUID[];
  real_count INTEGER;
  fk RECORD;
BEGIN
  FOR dup IN
    SELECT LOWER(BTRIM(email)) AS normalized_email
    FROM users
    WHERE email IS NOT NULL AND BTRIM(email) <> ''
    GROUP BY 1
    HAVING COUNT(*) > 1
  LOOP
    SELECT COUNT(*) INTO real_count
    FROM users
    WHERE LOWER(BTRIM(email)) = dup.normalized_email
      AND (password IS NOT NULL OR status <> 'invited');

    IF real_count > 1 THEN
      RAISE EXCEPTION
        'El correo % tiene % cuentas no invitadas. Resuelve el duplicado manualmente antes de aplicar esta migración.',
        dup.normalized_email, real_count;
    END IF;

    SELECT id INTO canonical_id
    FROM users
    WHERE LOWER(BTRIM(email)) = dup.normalized_email
    ORDER BY
      CASE
        WHEN password IS NOT NULL AND status <> 'invited' THEN 0
        WHEN password IS NOT NULL THEN 1
        WHEN status <> 'invited' THEN 2
        ELSE 3
      END,
      created_at ASC NULLS LAST,
      id ASC
    LIMIT 1;

    SELECT array_agg(id) INTO duplicate_ids
    FROM users
    WHERE LOWER(BTRIM(email)) = dup.normalized_email
      AND id <> canonical_id;

    FOREACH duplicate_id IN ARRAY duplicate_ids
    LOOP
      INSERT INTO users_merge_backup (canonical_user_id, duplicate_user)
      SELECT canonical_id, to_jsonb(u)
      FROM users u
      WHERE u.id = duplicate_id;

      -- Reasignar todas las claves foráneas que apuntan a users(id).
      -- Si al mover una fila choca una restricción única (p. ej. dos filas
      -- de resource_access para el mismo recurso), se descarta la fila de
      -- la cuenta duplicada y se conserva la de la cuenta canónica.
      FOR fk IN
        SELECT c.conrelid::regclass AS child_table,
               a.attname AS child_column
        FROM pg_constraint c
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid
         AND a.attnum = c.conkey[1]
        WHERE c.contype = 'f'
          AND c.confrelid = 'users'::regclass
          AND array_length(c.conkey, 1) = 1
      LOOP
        BEGIN
          EXECUTE format(
            'UPDATE %s SET %I = $1 WHERE %I = $2',
            fk.child_table, fk.child_column, fk.child_column
          ) USING canonical_id, duplicate_id;
        EXCEPTION
          WHEN unique_violation THEN
            EXECUTE format(
              'DELETE FROM %s WHERE %I = $1',
              fk.child_table, fk.child_column
            ) USING duplicate_id;
        END;
      END LOOP;

      -- Columnas user_id sin clave foránea declarada.
      UPDATE email_verification_tokens
      SET user_id = canonical_id
      WHERE user_id = duplicate_id;

      UPDATE email_notifications
      SET user_id = canonical_id
      WHERE user_id = duplicate_id;

      DELETE FROM users WHERE id = duplicate_id;
    END LOOP;
  END LOOP;
END $$;

-- 4) Normalizar correos existentes.
UPDATE users
SET email = NULL
WHERE email IS NOT NULL AND BTRIM(email) = '';

UPDATE users
SET email = LOWER(BTRIM(email))
WHERE email IS NOT NULL AND email <> LOWER(BTRIM(email));

UPDATE invitations
SET receiver_email = LOWER(BTRIM(receiver_email))
WHERE receiver_email IS NOT NULL
  AND receiver_email <> LOWER(BTRIM(receiver_email));

UPDATE conversation_invitations
SET receiver_email = LOWER(BTRIM(receiver_email))
WHERE receiver_email IS NOT NULL
  AND receiver_email <> LOWER(BTRIM(receiver_email));

UPDATE email_notifications
SET recipient_email = LOWER(BTRIM(recipient_email))
WHERE recipient_email IS NOT NULL
  AND recipient_email <> LOWER(BTRIM(recipient_email));

-- 5) Restaurar el índice antiguo y crear el índice único real.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower_unique
ON users (LOWER(BTRIM(email)));

COMMIT;
