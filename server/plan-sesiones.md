# plan-sesiones.md — Refresh tokens y revocación real de sesiones

## Problema

`logout` no invalida nada. Solo borra una cookie; el JWT sigue siendo criptográficamente
válido hasta que expira (30 días para usuarios, 7 para admin). No existe blacklist ni
`token_version`, así que no hay forma de cerrar una sesión desde el servidor.

Con 470 usuarios registrados, 331 con registro contable y 93 con actividad en los últimos
30 días, esto ya no es un detalle: si un teléfono se pierde o se roba, hay 30 días de acceso
a los datos financieros de esa persona y no hay forma de cortarlo.

Además el token se guarda en texto plano en el teléfono (`preferencesDataStore("auth_prefs")`,
`AuthRepository.kt:39`) y el panel de admin lo guarda en `localStorage` (`admin/src/lib/api.ts:23`).

## Causa raíz

`isAuthenticated` (`server/src/middlewares/auth-jwt.ts`) solo verifica la firma del JWT. No
consulta la base, no conoce sesiones y por lo tanto no puede saber si un token fue revocado.

Un JWT es autocontenido: mientras la firma sea válida y no haya expirado, es imposible
invalidarlo sin cambiar el secreto global. Por eso la lista negra de tokens solo funciona
si se consulta en cada request.

## Decisión

**Access token corto + refresh token rotativo con tabla de sesiones.**

- Access token: 15 minutos. Viaja en cada request. Si se filtra, el daño máximo es 15 min.
- Refresh token: 30 días, con extensión deslizante y tope absoluto de 90. Vive cifrado en el
  teléfono. Es el que representa la sesión.

`logout` revoca la fila en `user_sessions`. El access token muere solo en 15 minutos, así que **no
hace falta lista negra**: el refresh es lo único que renueva el acceso.

Se descartó la lista negra de tokens porque obliga a una consulta a la base en cada petición
para validar algo que ya era válido, y no mejora el modelo de revocación.

## Migración obligatoria sin dejar afuera a nadie

Este es el requisito crítico: **la app actual debe seguir funcionando**.

`/api/auth/login` devuelve hoy `{ message, token, user }`. La app vieja lee `token` y lo manda
como `Bearer`. Si se cambia esa forma, los 470 usuarios quedan afuera.

Por eso el rollout es en fases:

- **Fase 1 (aditiva, rompe nada)**: `/login` sigue devolviendo el mismo `token` de 30 días, y
  además agrega `refreshToken` y `sessionId`. La app vieja ignora los campos nuevos y sigue
  funcionando exactamente igual. `isAuthenticated` queda **sin cambios**: sigue aceptando el
  JWT viejo, sin consultar la base.
- **Fase 2 (la app nueva)**: al instalar la actualización, la app usa el refresh token, rota
  el access a 15 minutos y guarda el refresh cifrado. A partir de acá la revocación es real.
- **Fase 3 (a los 30 días)**: los tokens antiguos expiran solos. Quien no haya actualizado deja
  de poder iniciar sesión. Se agrega `minVersion` en `/api/updates` para avisar con un mensaje
  útil en vez de un 401 críptico.

**Limitación honesta de la Fase 1:** durante esos 30 días, un token viejo robado NO se puede
revocar. Es el precio de no dejar afuera a los usuarios actuales, y es una decisión consciente.

## Choque de nombres con Supabase (importante)

La primera versión de esta migración usó el nombre `sessions`. **Supabase ya tiene una
`public.sessions` que pertenece a `supabase_auth_admin`** y la usa su propio sistema de
autenticación (`factor_id`, `aal`, `not_after`, `refresh_token_hmac_key`, `scopes`).

`CREATE TABLE IF NOT EXISTS sessions` no crea nada si la tabla ya existe: el script continúa
como si fuera un éxito, y los índices y columnas se aplican encima de la tabla ajena. Peor: un
refactor posterior dejó `UPDATE sessions` donde debía decir `UPDATE user_sessions`, lo que
habría escrito en la tabla del sistema de autenticación.

Por eso la tabla se llama `user_sessions`. La `public.sessions` quedó como estaba: 0 filas y sin
ninguna columna mía.

## Dos bugs que encontraron los tests

**La ventana deslizante no deslizaba.** Con un solo `expires_at`, la rotación calculaba
`LEAST(now + 30d, expires_at_anterior)`. Como el anterior ya era un valor deslizante, ambos
eran el mismo y la sesión moría siempre a los 30 días del inicio. Se separó en dos columnas:
`expires_at` (ventana, deslizante) y `deadline_at` (tope absoluto de 90 días, se hereda al rotar).

**El índice único reventaba al rotar.** `UNIQUE (user_id, device_id) WHERE revoked_at IS NULL`
chocaba porque se revocaba solo la fila rotada. Ahora la rotación revoca todas las sesiones
activas del dispositivo, con `IS NOT DISTINCT FROM` porque `device_id` es NULL en la app vieja y
`device_id = NULL` nunca es cierto.

## Esquema

```sql
user_sessions (
  id               uuid PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash       text NOT NULL,      -- SHA-256 del refresh. NUNCA el token crudo
  device_id        text,               -- id estable que genera la app al instalar
  device_nombre    text,               -- "Samsung A12", para mostrarlo al usuario
  ip               inet,
  user_agent       text,
  created_at       timestamptz DEFAULT NOW(),
  last_seen_at     timestamptz DEFAULT NOW(),
  expires_at       timestamptz NOT NULL,
  revoked_at       timestamptz,
  revoked_reason   text                -- logout, sustitucion, sospecha, admin
)
```

Solo se guarda el **hash** del refresh. Si se filtra la base, los hashes no sirven para
autenticarse. Guardar el token crudo significaría que una filtración de la base entrega las
sesiones de los 470 usuarios.

`UNIQUE (user_id, device_id)` impide más de una sesión viva por dispositivo, para que la app
pueda rotar en vez de acumular sesiones.

## Detección de anomalías: cuidado con falsos positivos

La idea de detectar un token que aparece de otro lugar es buena, pero **alertar por IP rompe**:
las redes móviles rotan la IP constantemente y en Cuba especialmente. Alertar por "IP nueva"
generaría falsos positivos a los 93 usuarios activos cada pocos días.

Lo que sí es estable es el `device_id`. Por eso:
- La IP y el user_agent se **registran** para auditoría, no para alertar.
- La anomalía real a vigilar es un `device_id` nuevo usado desde un dispositivo ya conocido, o
  un mismo `device_id` conharpuser-agent distinto.

## Limpieza periódica

- Sesiones revocadas hace más de 30 días: borrar, ya no sirven para nada.
- Sesiones sin `last_seen_at` en 90 días: de usuarios que ya no usan la app.
- Ambas por job programado, no a mano.

## Alcance

Implementado:
- [x] Migración `user_sessions`
- [x] `POST /api/auth/refresh` rotativo
- [x] `POST /api/auth/logout` que sí revoca
- [x] `GET /api/auth/sessions` listar dispositivos
- [x] `DELETE /api/auth/sessions/:id` revocar una
- [x] `/login` devuelve `refreshToken` sin cambiar `token`

Pendiente:
- [ ] App Android: guardar refresh cifrado, rotar access a 15 min, pantalla de dispositivos
- [ ] Fase 3: `minVersion` y forzado de actualización a los 30 días
- [ ] Job de limpieza periódica
- [ ] Cifrado del token en el teléfono (`EncryptedSharedPreferences`)

## Nota sobre cifrado en el cliente

Pedido aparte, mucho más grande: que el usuario pueda cifrar su libro mayor **en el teléfono**
para que el servidor nunca pueda leerlo. Se documenta en `plan-cifrado-cliente.md`.

Choca con este trabajo en un punto: los 331 registros actuales están cifrados con una clave
que tiene el servidor. Migrarlos a cifrado de cliente requiere descifrar con la clave del
servidor y re-cifrar con la del usuario, o sea que el servidor tiene que tener la clave vieja
durante la transición.

## Archivos tocados

- `migrations-manual/deploy-sessions.sql` (nuevo, tabla `user_sessions`)
- `src/services/sessions.service.ts` (nuevo)
- `src/controllers/auth.ts` (login augmented, refresh, logout, sessions)
- `src/routes/auth.ts` (rutas nuevas)
- `src/middlewares/auth-jwt.ts` (sin cambios en Fase 1)