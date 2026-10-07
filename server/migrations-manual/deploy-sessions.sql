-- Sesiones de usuario: refresh tokens rotativos con revocacion real.
--
-- Por que NO una lista negra de tokens: un JWT es autocontenido, sigue siendo
-- valido hasta que expira. Invalidarlo exigiria consultar la base en CADA
-- request. Con refresh tokens el access token vive 15 minutos y el logout
-- revoca el refresh, que es lo unico que renueva el acceso.
--
-- Ver plan-sesiones.md
--
-- NO se llama "sessions" a proposito: en Supabase YA existe una tabla
-- public.sessions que pertenece a supabase_auth_admin y la usa su sistema de
-- autenticacion (factor_id, aal, not_after, refresh_token_hmac_key, scopes).
-- Con CREATE TABLE IF NOT EXISTS sessions el CREATE no hace nada, el script
-- sigue como si nada, y los indices y columnas se aplican encima de la tabla
-- ajena. Por eso va con espacio de nombres propio.

CREATE TABLE IF NOT EXISTS user_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- SHA-256 del refresh token. NUNCA el token crudo: si se filtra la base,
    -- los hashes no permiten autenticarse, pero los tokens si.
    token_hash       TEXT NOT NULL,

    -- id estable que genera la app al instalar. Es la unica señal fiable de
    -- identidad de dispositivo: la IP rota en redes moviles.
    device_id        TEXT,
    device_nombre    TEXT,

    ip               INET,
    user_agent       TEXT,

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ventana deslizante: se renueva con cada refresh.
    expires_at       TIMESTAMPTZ NOT NULL,

    -- Tope absoluto, heredado en cada rotacion. SE PARTE de expires_at porque
    -- si no, el deslizamiento no deslizaria: expires_at ya es un valor
    -- deslizante, y take el menor contra si mismo nunca avanza.
    deadline_at      TIMESTAMPTZ NOT NULL,

    revoked_at       TIMESTAMPTZ,
    revoked_reason   TEXT
);

-- Un refresh por sesion activa. Permite que la app rote sin acumular.
CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_token_hash_key
    ON user_sessions (token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_user_device_key
    ON user_sessions (user_id, device_id)
    WHERE revoked_at IS NULL;

-- Para listar los dispositivos activos de un usuario.
CREATE INDEX IF NOT EXISTS user_sessions_user_active_idx
    ON user_sessions (user_id, last_seen_at DESC)
    WHERE revoked_at IS NULL;

-- Para la limpieza periodica.
CREATE INDEX IF NOT EXISTS user_sessions_revoked_idx
    ON user_sessions (revoked_at)
    WHERE revoked_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_sessions_expires_idx
    ON user_sessions (expires_at);

COMMENT ON TABLE  user_sessions IS 'Refresh tokens rotativos. Revocar la fila equivale a cerrar la sesion.';
COMMENT ON COLUMN user_sessions.token_hash IS 'SHA-256 en hex. Nunca almacenar el token en crudo.';
COMMENT ON COLUMN user_sessions.expires_at IS 'Ventana deslizante: LEAST(now + 30d, deadline_at).';
COMMENT ON COLUMN user_sessions.deadline_at IS 'Tope absoluto: created_at de la 1a sesion del dispositivo + 90d. Se hereda al rotar.';