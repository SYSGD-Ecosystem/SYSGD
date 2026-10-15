# SYSGD PHP Cont - Servidor API Respaldo

Servidor PHP de respaldo para la app de contabilidad (GCTCP). Réplica de los endpoints contables del servidor principal Node.js (TypeScript/Express).

## Requisitos

- PHP 8.1+
- Extensiones PHP: `pdo_pgsql`, `pgsql`, `sqlite3`, `openssl`
- Composer
- PostgreSQL 14+ (misma BD que el servidor Node.js)
- SQLite (solo para nomencladores - archivo `assets/database.db` o `assets/filesdata.db`)

## Instalación y Arranque

```bash
cd /home/yunior/Documentos/GitHub/SYSGD/others/php-cont

# Instalar dependencias (solo la primera vez)
composer install

# Crear/actualizar tablas en la BD
php database/migrate.php

# Arrancar servidor (solo localhost)
php -S localhost:8080 -t public

# Arrancar servidor (visible en la red local)
php -S 0.0.0.0:8080 -t public
```

La API queda disponible en `http://localhost:8080/api`.

## Configuración (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sysgd_v2
DB_USER=postgres
DB_PASSWORD=

JWT_SECRET=<misma_que_el_servidor_node>
LEDGER_ENCRYPTION_KEY=<32_caracteres_exactos>

# Opcional - ruta a la DB SQLite de nomencladores
NOMENCLATOR_DB_PATH=/ruta/al/database.db
```

El `JWT_SECRET` y `LEDGER_ENCRYPTION_KEY` deben ser idénticos a los del servidor Node.js para que los tokens y datos cifrados sean compatibles.

## Estructura del Proyecto

```
php-cont/
├── config/database.php          → Singleton PDO (PostgreSQL)
├── public/index.php             → Front controller (aquí se definen las rutas)
├── src/
│   ├── Auth/JwtHandler.php      → Codificar/decodificar JWT
│   ├── Middleware/
│   │   └── AuthMiddleware.php   → Guard de autenticación (Bearer token)
│   ├── Services/
│   │   └── LedgerEncryptionService.php → AES-256-GCM encrypt/decrypt
│   └── Controllers/
│       ├── AuthController.php
│       ├── UserController.php
│       ├── LedgerController.php
│       ├── PdfController.php
│       ├── ContWorkspacesController.php
│       ├── ContTurnosController.php
│       ├── AccountingDocumentsController.php
│       ├── NomenclatorsController.php
│       └── GctcpSpaceController.php
└── database/migrate.php         → Crear tablas en PostgreSQL
```

## Autenticación

Todos los endpoints (excepto login, check-user, status) requieren el header:

```
Authorization: Bearer <token_jwt>
```

El token se obtiene en `POST /api/auth/login`. Dura 7 días para usuarios normales, 30 minutos para admin.

---

## Endpoints

### Status

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/status` | No | Health check |

**Respuesta:** `{"status":"ok","service":"sysgd-php-cont"}`

---

### Auth

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Iniciar sesión |
| POST | `/api/auth/check-user` | No | Verificar si email existe |
| GET | `/api/auth/me` | Sí | Usuario actual |
| POST | `/api/auth/logout` | No | Cerrar sesión (stateless) |

#### POST /api/auth/login

**Request:**
```json
{
  "email": "usuario@correo.com",
  "password": "contraseña123"
}
```

**Respuesta 200:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLC...",
  "user": {
    "id": "uuid",
    "email": "usuario@correo.com",
    "name": "Nombre",
    "privileges": "user"
  }
}
```

**Respuesta 202 (usuario invitado sin contraseña):**
```json
{
  "message": "Usuario invitado detectado",
  "status": "invited",
  "user": { "id": "uuid", "email": "...", "name": "...", "status": "invited" }
}
```

**Respuesta 402 (contraseña incorrecta):**
```json
{ "message": "Contraseña incorrecta" }
```

#### POST /api/auth/check-user

**Request:** `{"email": "correo@ejemplo.com"}`
**Respuesta:** `{"exists": true}`

#### GET /api/auth/me

**Respuesta:**
```json
{
  "id": "uuid",
  "name": "Nombre",
  "email": "correo@ejemplo.com",
  "privileges": "user",
  "status": "active"
}
```

---

### Users

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/users/register` | No | Registrar usuario |
| GET | `/api/users/plan` | Sí | Plan y créditos del usuario |

#### POST /api/users/register

**Request:**
```json
{
  "name": "Nombre Usuario",
  "email": "correo@ejemplo.com",
  "password": "contraseña123"
}
```

#### GET /api/users/plan

**Respuesta:**
```json
{
  "ai_task_credits": 100,
  "pdf_credits": 10,
  "storage_credits": 1000,
  "plan": "free"
}
```

---

### Cont Ledger (Registro contable personal)

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/cont-ledger` | Sí | Obtener registro (descifrado) |
| PUT | `/api/cont-ledger` | Sí | Guardar registro (cifrado AES-256-GCM) |

#### GET /api/cont-ledger

**Respuesta:**
```json
{
  "registro": { "seccion1": {...}, "seccion2": {...} },
  "updatedAt": "2026-10-15T10:30:00Z"
}
```

#### PUT /api/cont-ledger

**Request:**
```json
{
  "registro": {
    "ingresos": [...],
    "gastos": [...],
    "tributos": [...]
  }
}
```

**Respuesta:**
```json
{
  "message": "Registro contable guardado",
  "updatedAt": "2026-10-15T10:30:00Z"
}
```

---

### Cont Workspaces (Espacios de trabajo en la nube)

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/cont-workspaces` | Sí | Listar workspaces (propios + compartidos) |
| POST | `/api/cont-workspaces` | Sí | Crear workspace (máx 10) |
| GET | `/api/cont-workspaces/:id` | Sí | Obtener workspace + rol del usuario |
| PUT | `/api/cont-workspaces/:id/name` | Sí | Renombrar (owner/admin) |
| DELETE | `/api/cont-workspaces/:id` | Sí | Eliminar (owner o admin global) |
| GET | `/api/cont-workspaces/:id/ledger` | Sí | Obtener ledger descifrado |
| PUT | `/api/cont-workspaces/:id/ledger` | Sí | Guardar ledger (owner/admin, concurrencia optimista) |
| GET | `/api/cont-workspaces/:id/members` | Sí | Listar miembros + invitaciones pendientes |
| POST | `/api/cont-workspaces/:id/members/invite` | Sí | Invitar miembro por email (owner/admin) |
| PATCH | `/api/cont-workspaces/:id/members/:userId` | Sí | Cambiar rol (owner/admin) |
| DELETE | `/api/cont-workspaces/:id/members/:userId` | Sí | Quitar miembro (solo owner) |
| GET | `/api/cont-workspaces/:id/vendedores/links` | Sí | Listar vínculos vendedor-miembro |
| PUT | `/api/cont-workspaces/:id/vendedores/:vendedorId/link` | Sí | Vincular vendedor a miembro (owner/admin) |
| DELETE | `/api/cont-workspaces/:id/vendedores/:vendedorId/link` | Sí | Desvincular vendedor (owner/admin) |

#### GET /api/cont-workspaces

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "name": "Mi Negocio",
    "ownerId": "uuid",
    "role": "owner",
    "conversationId": null,
    "createdAt": "2026-10-15T10:30:00Z",
    "updatedAt": "2026-10-15T10:30:00Z"
  }
]
```

#### POST /api/cont-workspaces

**Request:** `{"name": "Mi Negocio"}`
**Respuesta 201:** (objeto workspace con `role: "owner"`)

#### PUT /api/cont-workspaces/:id/ledger

**Request:**
```json
{
  "registro": { "inventario": {...}, "ventas": [...] },
  "expectedVersion": "2026-10-15T10:30:00Z",
  "sections": { "inventario": "v1", "ventas": "v2" }
}
```

**Respuesta 200:** `{"version": "2026-10-15T10:35:00Z"}`
**Respuesta 409 (conflicto de versión):**
```json
{ "error": "version_conflict", "serverVersion": "2026-10-15T10:35:00Z" }
```

#### POST /api/cont-workspaces/:id/members/invite

**Request:** `{"email": "correo@ejemplo.com", "role": "member"}`
Roles válidos: `admin`, `member`, `viewer`, `vendedor`

#### PATCH /api/cont-workspaces/:id/members/:userId

**Request:** `{"role": "vendedor"}`

#### PUT /api/cont-workspaces/:id/vendedores/:vendedorId/link

**Request:** `{"memberUserId": "uuid", "almacenId": "alm-1"}`

---

### Cont Turnos (Reportes de turno de vendedores)

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| PUT | `/api/cont-turnos/:id/informe-disponibilidad` | Sí | Publicar foto del estado (owner) |
| GET | `/api/cont-turnos/:id/informe-disponibilidad` | Sí | Descargar informe |
| POST | `/api/cont-turnos/:id/reportes-turno` | Sí | Subir reporte de turno (vendedor) |
| GET | `/api/cont-turnos/:id/reportes-turno` | Sí | Listar reportes (owner) |
| PATCH | `/api/cont-turnos/:id/reportes-turno/:reporteId`` | Sí | Marcar FUSIONADO/RECHAZADO (owner) |

#### PUT /api/cont-turnos/:id/informe-disponibilidad

**Request:**
```json
{
  "informe": { "productos": [...], "precios": [...] },
  "generadoEn": "2026-10-15T10:30:00Z",
  "huella": "hash-opcional",
  "informeId": "uuid-opcional"
}
```

**Respuesta:** `{"actualizado": true, "informeId": "uuid"}`

#### POST /api/cont-turnos/:id/reportes-turno

**Request:**
```json
{
  "id": "uuid-del-reporte",
  "vendedorId": "vendedor-001",
  "vendedorNombre": "Juan",
  "paquete": { "ventas": [...], "cierre": "2026-10-15" },
  "informeOrigenId": "uuid-opcional",
  "fechaTurno": "2026-10-15"
}
```

**Respuesta 201:** `{"creado": true, "yaExistia": false}`
**Respuesta 200 (duplicado):** `{"creado": false, "yaExistia": true}`

#### GET /api/cont-turnos/:id/reportes-turno

**Query param opcional:** `?estado=PENDIENTE` (PENDIENTE|FUSIONADO|RECHAZADO)

**Respuesta:** `{"reportes": [...]}`

#### PATCH /api/cont-turnos/:id/reportes-turno/:reporteId

**Request:** `{"estado": "FUSIONADO", "nota": "todo ok"}`

---

### Accounting Documents

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/accounting-documents` | Sí | Listar documentos (Pro/VIP) |
| POST | `/api/accounting-documents` | Sí | Crear documento (Pro/VIP) |
| GET | `/api/accounting-documents/:id` | Sí | Obtener documento |
| PUT | `/api/accounting-documents/:id` | Sí | Actualizar payload |
| POST | `/api/accounting-documents/pdf/tcp` | Sí | Generar PDF TCP (consume 1 crédito) |

Todos requieren plan `pro` o `vip` en `user_data.billing.tier`.

#### GET /api/accounting-documents

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "Registro 2026",
    "documentType": "tcp_income_expense",
    "payload": {},
    "createdAt": "2026-10-15T10:30:00Z",
    "updatedAt": "2026-10-15T10:30:00Z"
  }
]
```

#### POST /api/accounting-documents

**Request:** `{"name": "Registro 2026"}`

#### PUT /api/accounting-documents/:id

**Request:** `{"payload": {"ingresos": {...}, "gastos": {...}}}`

#### POST /api/accounting-documents/pdf/tcp

**Request:** `{"generalData": {...}, "ingresos": {...}, "gastos": {...}}`
**Respuesta:** Archivo PDF binario (attachment)

---

### Nomenclators

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/nomenclators/accounting/categories` | Sí | Categorías contables |
| GET | `/api/nomenclators/accounting/subcategories` | Sí | Subcategorías contables |
| GET | `/api/nomenclators/accounting/search` | Sí | Buscar catálogo contable |
| GET | `/api/nomenclators/cnae/search` | Sí | Buscar CNAE |

Estos endpoints usan la base SQLite de nomencladores (`NOMENCLATOR_DB_PATH` o `assets/database.db`).

#### GET /api/nomenclators/accounting/search

**Query params:** `q`, `categoryCode`, `subcategoryCode`, `limit` (1-200, default 50)

**Respuesta:**
```json
[
  {
    "itemType": "Cuenta",
    "categoryCode": "1",
    "categoryName": "Activo",
    "subcategoryCode": "",
    "subcategoryName": "",
    "accountCode": "1001",
    "accountName": "Caja",
    "accountNature": "Deudora",
    "subaccountCode": "",
    "subaccountName": "",
    "subaccountNature": "",
    "displayCode": "1001",
    "displayName": "Caja",
    "displayNature": "Deudora"
  }
]
```

#### GET /api/nomenclators/cnae/search

**Query params:** `q`, `limit`

**Respuesta:**
```json
[
  {
    "section": "A",
    "structure": "01",
    "code": "0111",
    "description": "Cultivo de cereales",
    "notes": ["nota 1", "nota 2"],
    "correlations": [
      {
        "codeCnae": "0111",
        "descriptionCnae": "...",
        "codeNae": "...",
        "descriptionNae": "...",
        "codeCiiu": "...",
        "descriptionCiiu": "..."
      }
    ]
  }
]
```

---

### GCTCP Space (Espacios de datos por usuario)

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/gctcp-space` | Sí | Listar espacios del usuario |
| POST | `/api/gctcp-space` | Sí | Crear/reemplazar espacio |
| GET | `/api/gctcp-space/:spaceId` | Sí | Obtener espacio (descifrado) |
| PUT | `/api/gctcp-space/:spaceId` | Sí | Actualizar espacio |
| DELETE | `/api/gctcp-space/:spaceId` | Sí | Eliminar espacio |

#### POST /api/gctcp-space

**Request:** `{"spaceId": "mi_espacio", "data": {"clave": "valor"}}`
**Respuesta 201:** `{"spaceId": "mi_espacio", "updatedAt": "..."}`

#### GET /api/gctcp-space/:spaceId

**Respuesta:** `{"data": {"clave": "valor"}, "updatedAt": "..."}`

---

## Códigos de Estado

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Creado |
| 204 | Sin contenido (eliminado) |
| 400 | Bad Request (faltan campos o inválidos) |
| 401 | No autenticado |
| 402 | Créditos insuficientes |
| 403 | Sin permisos |
| 404 | No encontrado |
| 409 | Conflicto (versión de ledger) |
| 500 | Error interno |

## Notas

- El servidor es stateless (sin sesiones en el servidor). El token JWT contiene los datos del usuario.
- Los ledgers se cifran con AES-256-GCM usando `LEDGER_ENCRYPTION_KEY` (32 caracteres).
- El nomenclador usa una BD SQLite separada; sin ese archivo los endpoints de nomencladores fallan.
- El límite de workspaces propios es 10.
- Los turnos usan idempotencia por `(workspace_id, id)`.
