-- =============================================================================
-- Informes de disponibilidad (maestro -> vendedor) y reportes de turno
-- (vendedor -> maestro), con estado de fusion.
--
-- El servidor es TONTO a proposito: guarda y devuelve paquetes, no calcula
-- nada. El informe lo genera la app del DUEÑO desde su espacio de trabajo
-- activo y lo sube. El VENDEDOR descarga ese informe, trabaja offline con el,
-- y al cerrar el turno sube su reporte. El DUEÑO lo fusiona en su maestro
-- (en su telefono) y luego marca el reporte como FUSIONADO o RECHAZADO.
--
-- Todo el contenido va cifrado con LedgerEncryptionService, igual que el
-- ledger, para no romper la promesa de privacidad del sistema.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Ranura "master" del informe de disponibilidad: UNO por espacio de trabajo.
-- El dueño lo (re)genera y lo sube; el vendedor solo descarga.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cont_informe_disponibilidad (
    workspace_id UUID PRIMARY KEY REFERENCES cont_workspaces(id) ON DELETE CASCADE,

    -- Identidad del INFORME, distinta del workspace. Cambia cada vez que el
    -- dueño regenera la foto del estado. Es lo que permite al vendedor saber
    -- si lo que ya tiene guardado es el mismo informe o uno nuevo.
    -- Inmutable una vez subido: nunca se reescribe el id.
    informe_id UUID NOT NULL DEFAULT gen_random_uuid(),

    informe JSONB NOT NULL,
    generado_en TIMESTAMPTZ,
    -- Huella del contenido (hash). Permite detectar si el contenido cambio
    -- aunque el id sea el mismo.
    huella TEXT,
    -- Quien lo subio, para auditoria.
    subido_por UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Reportes de turno enviados por los vendedores.
-- Idempotentes por id de turno: reenviar el mismo reporte no duplica.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cont_reportes_turno (
    -- Id del reporte. Lo genera la app del VENDEDOR al cerrar el turno.
    --
    -- REQUISITOS INNEGOCIABLES de este id:
    --   1. Unico e INMUTABLE. Se genera una sola vez al cerrar el turno y jamas
    --      se recalcula ni se reasigna, aunque el reporte viaje por varias vias
    --      (Bluetooth, JSON, nube).
    --   2. Es la clave de idempotencia: si la app del dueño ya aplico este
    --      reporte, volver a recibirlo NO debe duplicar nada.
    id UUID PRIMARY KEY,

    workspace_id UUID NOT NULL REFERENCES cont_workspaces(id) ON DELETE CASCADE,

    -- Trazabilidad contra el maestro: que informe de disponibilidad USO este
    -- turno para trabajar. Permite responder "este turno se hizo sobre el estado
    -- de las 8am", y detectar si el maestro avanzo por debajo.
    informe_origen_id UUID,
    informe_origen_generado_en TIMESTAMPTZ,

    -- Identidad del vendedor dentro del workspace (no es un users.id: el
    -- modulo de vendedores usa PIN, no cuentas propias).
    vendedor_id TEXT NOT NULL,
    vendedor_nombre TEXT NOT NULL DEFAULT '',

    turno_id TEXT,
    fecha_turno TEXT,
    generado_en TIMESTAMPTZ,

    -- PENDIENTE | FUSIONADO | RECHAZADO
    estado TEXT NOT NULL DEFAULT 'PENDIENTE',
    -- Nota opcional del dueño al fusionar o rechazar.
    estado_nota TEXT,
    resuelto_por UUID REFERENCES users(id) ON DELETE SET NULL,
    resuelto_en TIMESTAMPTZ,

    -- Paquete cifrado: los hechos del turno (ventas, movimientos, mermas,
    -- consumos de lotes, deudas). El servidor no lo lee, solo lo guarda.
    paquete JSONB NOT NULL,

    -- quien lo subio (el vendedor) para auditoria
    subido_por UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT cont_reportes_turno_estado_valido
        CHECK (estado IN ('PENDIENTE', 'FUSIONADO', 'RECHAZADO'))
);

-- El dueño lista los pendientes de su workspace.
CREATE INDEX IF NOT EXISTS idx_cont_reportes_turno_workspace_estado
    ON cont_reportes_turno (workspace_id, estado, created_at DESC);

-- No se puede subir dos veces el mismo reporte al mismo workspace.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cont_reportes_turno_workspace_id
    ON cont_reportes_turno (workspace_id, id);