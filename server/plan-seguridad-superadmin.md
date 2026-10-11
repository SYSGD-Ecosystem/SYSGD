# Plan: superadmin + alerta de login admin + cierre de escalada de privilegios

## Hueco encontrado (2026-10-11, en producción)
`PUT /api/users/:id` (`updateAdminUser`) no verificaba al llamante: **cualquier
usuario autenticado podía ponerse `privileges: "admin"`** (y `PUT /:id/plan` y
`POST /:id/credits` tampoco pedían admin: cualquiera se regalaba plan o
créditos). Además un admin podía editar/eliminar a otro admin, incluido el dueño.

## Decisión
1. **Superadmin en código, no en BD** (`SUPERADMIN_EMAIL`, por defecto
   `lazaro.salazarr@gmail.com`): solo él cambia `privileges`; nadie salvo él
   modifica o elimina su cuenta. No se puede degradar por API.
2. **Guards**: `PUT /:id`, `PUT /:id/plan`, `POST /:id/credits` exigen caller
   admin; `DELETE /:id` mantiene auto-borrado pero ningún admin borra al
   superadmin.
3. **Alerta de login admin**: en `sendAuthSuccess`, si entra un admin que NO es
   el superadmin → email inmediato al superadmin (quién/cuándo/IP/agente,
   fire-and-forget, nunca bloquea). SMS real a Cuba requiere pasarela
   inexistente: el hook queda en `admin-login-alert.service.ts` para enganchar
   Telegram/SMS cuando haya vía. Se apaga con `ADMIN_LOGIN_ALERT_ENABLED=false`.
4. **2FA admin**: existe por email pero está desactivado (`false &&` en
   `auth.ts:278`) — pendiente decidir si se enciende.

## Archivos
`src/utils/superadmin.ts`, `src/services/admin-login-alert.service.ts`,
`src/controllers/users.ts`, `src/controllers/auth.ts`, `src/routes/users.ts`.
