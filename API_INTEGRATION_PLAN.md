# SYSGD API para integraciones externas — API Keys con scopes y ámbito

> Estado: propuesta de diseño (2026-10-04). Nada de esto está implementado todavía.
> Tarea relacionada: SYSGD #32 (documentación de la API), SYSGD #31 (Informe api.ts).

## 1. El problema

Hoy cualquier integración externa (MITCP, scripts, otro cliente) se autentica **a mano**: alguien entrega
correo y contraseña, el integrador hace `POST /api/auth/login` y usa el **JWT de sesión** del usuario.

Eso no sirve como base para una API oficial:

| Problema | Consecuencia |
|---|---|
| El token de la integración **es** el token de la sesión | Si se filtra (log, APK de terceros, repo), se filtró la sesión web completa y hay que cerrar sesión en todas partes |
| Sin caducidad útil | `generateJWT` da 30 días; la app renueva sola en silencio y nadie sabe qué app está usando la cuenta |
| Sin ámbito | Un token de MITCP puede tocar **todos** los proyectos, la contabilidad, el admin y el chat |
| Sin separación lectura/escritura | No se puede dar acceso "solo ver" sin arriesgar que la app modifique datos |
| Sin revocación real | No hay forma de cortar el acceso de una app concreta sin cambiar la contraseña |
| Sin rastro | No se puede saber qué app hizo qué |
| Sin límites por consumidor | El rate limit es por IP/usuario; una app mal escrita tumba la cuenta del usuario |

Ya existe `POST /api/auth/external-token` (`server/src/controllers/auth.ts:693`), pero **no resuelve nada de
esto**: devuelve un `generateJWT` nuevo con los mismos permisos y el mismo expiry de sesión, y la respuesta
anuncia `expiresIn: "7d"` cuando en realidad el token vale 30 días. Además no se puede revocar.

Y ojo con `user_tokens` (`server/schema.sql:210`): esa tabla guarda credenciales de **proveedores de IA**
(`github`, `gemini`, `replicate`, `openrouter`), no tokens de acceso a SYSGD. El diseño nuevo necesita su
propia tabla, con otro nombre.

## 2. Propuesta: API Keys de integración

Una **API Key** es un token opaco, de larga vida, que el usuario genera desde la web ("Configuración →
Integraciones"), le da nombre, marca qué puede hacer y hasta qué proyecto llega. La app externa se
autentica con esa key, no con la contraseña del usuario.

Principio de diseño: **el permiso efectivo es siempre la intersección de tres cosas**

```
permisos del usuario  ∩  scopes de la key  ∩  ámbito (proyecto) de la key
```

Una key nunca amplía lo que el usuario ya puede hacer, ni sale de su proyecto.

### 2.1 Formato del token

```
sysgd_pat_a1b2c3d4_Kq9WvXx7...   (opaco, ~40 chars aleatorios, base64url)
```

- El prefijo `sysgd_pat_` permite **rechazar de inmediato** un token que se confunde con el de sesión,
  y saber en logs que es una integración.
- `a1b2c3d4` es el **prefijo público**: se guarda en claro y se usa para buscar la key sin recorrer la tabla
  (el usuario ve `sysgd_pat_a1b2c3d4…` y las revisa rápido).
- El resto **solo se muestra una vez**, al crearla (igual que GitHub).

### 2.2 Almacenamiento

| Columna | Notas |
|---|---|
| `id` | UUID |
| `user_id` | dueño |
| `name` | etiqueta libre: "MITCP Android", "Script de respaldos" |
| `prefix` | 8 chars públicos, `UNIQUE` |
| `key_hash` | **SHA-256 del token completo**, `UNIQUE`. Nunca el token en claro |
| `scopes` | `text[]` (Postgres ya es el motor) |
| `project_id` | `NULL` = todos los proyectos del usuario; con valor = solo ese proyecto |
| `expires_at` | nullable; por defecto 90 días |
| `last_used_at` / `last_used_ip` | para saber si una key está muerta |
| `revoked_at` | cortar acceso sin borrar el registro (auditoría) |
| `created_at` | |

La comparación es `SELECT ... WHERE key_hash = sha256(token) AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())`.

### 2.3 Scopes

Finos y explícitos, agrupables:

| Grupo | Scopes |
|---|---|
| Proyectos | `projects:read`, `projects:write` |
| Tareas | `tasks:read`, `tasks:write`, `tasks:assign` |
| Notas/ideas | `notes:read`, `notes:write` |
| Chat | `chat:read`, `chat:write` |
| Contabilidad | `accounting:read`, `accounting:write` |
| Archivos | `files:read`, `files:write` |
| GitHub | `github:read`, `github:write` |
| Usuarios | `users:read` |
| Admin | `admin:read`, `admin:write` |

Atajos al crear la key: **solo lectura** (`read` = todos los `:read`), **lectura y escritura** (`read` + `write`),
**personalizado**. `write` implica `read` del mismo recurso.

`admin:*` **nunca** viene incluido en los atajos, y por defecto está excluido de las integraciones.

### 2.4 Autorización

Middleware nuevo `authenticateApiKey` (`server/src/middlewares/`):

1. Si `Authorization` empieza por `Bearer sysgd_pat_` (o viene `X-API-Key`), resuelve la key, valida
   caducidad/revocación y **no** pasa por `jwt.verify`.
2. Si no, sigue el camino normal de `isAuthenticated` (JWT de sesión) → la web y las apps actuales no se rompen.
3. Deja en `req` un contexto: `{ kind: "api-key", keyId, userId, scopes, projectId, isExternal: true }`.

Guards para las rutas:

- `requireScope("tasks:write")` → 403 con el scope que falta.
- `requireProjectScope()` → 403 si la key está atada a un proyecto y la ruta es de otro.

Y en los controladores que ya usan `hasWorkspaceAccess`, se añade el recorte por `project_id` de la key
antes de tocar datos.

### 2.5 Endpoints de gestión (solo sesión web)

```
GET    /api/api-keys                  lista (solo prefijo, uso, caducidad)
POST   /api/api-keys                  crea; devuelve el token COMPLETO una sola vez
PATCH  /api/api-keys/:id              renombra / cambia scopes / renueva caducidad
DELETE /api/api-keys/:id              revoca (revoked_at)
```

Pantalla en el cliente: Configuración → Integraciones, con el patrón "crear → copiar → ocultar", lista de keys
activas con última usada, y botón revocar.

### 2.6 Límites y trazabilidad

- **Rate limit por `keyId`**, no solo por IP (hoy `middlewares/rate-limit.ts` es por IP): una app que se
  descontrola se penaliza a ella, no tumba la cuenta del usuario.
- Cabeceras `X-RateLimit-Limit` / `-Remaining` / `-Reset` para que la app pueda ajustarse.
- Auditoría: registrar `key_id`, método, ruta, status y duración. Se puede reutilizar `activity.service.ts`,
  que ya guarda `x-app-source` de cada petición.

## 3. Endurecimiento (lo no negociable)

- **Nunca** reusar el JWT de sesión para integraciones. Si se filtra una key, caduca la key, no la sesión.
- Hash en reposo; el token completo solo existe en la respuesta de creación.
- Caducidad por defecto (30–90 días), Renovable, con aviso en la UI cuando va a expirar.
- Excluir por defecto de las API keys: `/api/admin/*`, cambio de contraseña, 2FA, facturación y borrado de
  usuario. Requieren un scope explícito y confirmación en la UI.
- Las descargas de archivos (S3/MinIO) siguen pasando por el proxy del server con su token de vida corta;
  `files:read` no significa URL firmada para siempre.
- Versionado de la API desde ya (`/api/v1/...`) para poder evolucionar sin romper a las apps.

## 4. Fases

**Fase 0 — apaño sin migración (1 día).** Arreglar `issueExternalToken`: emitir un JWT con `aud: "external"`,
`scopes` y `projectId` dentro, caducidad **real y corta** (24 h) que no se renueve sola, y `isAuthenticated`
aceptándolo solo para integraciones. Sirve para dejar de entregar credenciales hoy mismo. Limitación: sin
revocación (hay que esperar la caducidad).

**Fase 1 — API Keys de verdad (3–5 días).** Tabla `api_keys` + `authenticateApiKey` + `requireScope` +
endpoints de gestión + pantalla de Integraciones. Es el entregable que hace la API oficial.

**Fase 2 — afinar (1–2 días).** Límites por key, cabeceras `X-RateLimit`, auditoría, docs en Swagger
publicado (`server/src/swagger.ts` existe) y primera app migrada.

## 5. Qué cambia para MITCP

MITCP deja de guardar **correo y contraseña** de la cuenta SYSGD. En su lugar el usuario genera en la web una
key con los scopes que la app necesita (`projects:read/write`, `tasks:read/write`, `chat:read/write`,
`accounting:*`, `files:*`) y opcionalmente atada al proyecto que le interesa.

Ventajas para el usuario: puede revocar el acceso de MITCP sin cerrar su sesión, la key no sirve para entrar
en la web ni para cambiar roles en el chat, y si la pierde solo se genera otra. En Android hay que guardarla
fuera de `BuildConfig` y de los logs (idealmente `EncryptedSharedPreferences`).

## 6. Decisiones que hay que cerrar antes de codificar

1. ¿Ámbito por proyecto **o** solo global? Propuesta: ambos, con `project_id` nullable (no hay coste extra).
2. ¿Caducidad por defecto de 90 días o "sin caducidad con aviso"? El usuario de apps técnicas va a pelearse
   con la caducidad; 90 días con recordatorio en la UI es el punto medio.
3. ¿Los atajos de la UI son `read` / `read+write`, o además un atajo "contabilidad" (el caso de MITCP)?
4. ¿La pantalla de Integraciones entra en el cliente web o de momento solo por API?