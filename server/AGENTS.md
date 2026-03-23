# AGENTS.md - Reglas para IA (Node Server)

Este archivo define reglas obligatorias para cualquier IA que modifique `server/node-server`.

## 1) Arquitectura por capas (obligatoria)

Flujo permitido:

`Route -> Controller -> Service -> DB/Integración`

Responsabilidad por capa:

- `routes/`: solo define endpoint, middlewares y qué controller se ejecuta.
- `controllers/`: parsea `req`, valida entrada básica, llama servicios, responde `res`.
- `services/`: contiene la lógica de negocio, reglas del dominio, transacciones y orquestación.
- `db`/consultas externas: acceso a datos e integraciones (S3, OpenRouter, etc.) encapsulado fuera de `routes`.

## 2) Prohibido en `routes/*`

- SQL o `pool.query(...)`.
- Lógica de negocio (cálculo de estado, validaciones de dominio, reglas de permisos complejas).
- Construcción de payloads complejos para integraciones externas.
- Manejo de transacciones.
- Bloques `try/catch` largos con más de una responsabilidad.

Si un endpoint crece, se debe mover a `controller` + `service`.

## 3) Regla específica para módulos como `time-entries`

- `routes/time-entries.ts` no debe contener lógica de cronómetro.
- Reglas como `start/pause/resume/stop`, validaciones de estado y cómputo de duración deben vivir en `services/`.
- El router solo enruta y aplica middlewares (`isAuthenticated`, límites, etc.).

## 4) Validación de datos

- Validación de esquema (body/query/params) antes de llegar a lógica de negocio.
- Respuestas 4xx claras para errores de entrada.
- No mezclar validación con persistencia en el mismo bloque.

## 5) Manejo de errores

- Centralizar el formato de errores en controllers/middleware.
- No filtrar trazas internas al cliente.
- Mensajes de error consistentes y accionables.

## 6) TypeScript y calidad

- `any` prohibido.
- Tipar `Request`, `Response`, DTOs y respuestas de servicio.
- Evitar castings inseguros sin justificación.

## 7) Seguridad

- Toda ruta privada debe usar middleware de autenticación.
- No confiar en IDs del cliente sin verificar propiedad/permisos en servicio.
- Sanitizar entradas que se persisten o se usan en integraciones.

## 8) Criterios de revisión obligatorios (antes de cerrar cambios)

Checklist mínimo:

- ¿El router quedó delgado?
- ¿La lógica de negocio vive en service?
- ¿No hay SQL en routes?
- ¿Hay validación de entrada?
- ¿Se tipó todo sin `any`?
- ¿Se ejecutó `npm run build` del server cuando aplique?

Si alguna respuesta es "no", el cambio no está listo.

## 9) Regla de bloqueo

Se rechaza cualquier PR/cambio de IA que agregue lógica de negocio en `routes/`, aunque funcione.
