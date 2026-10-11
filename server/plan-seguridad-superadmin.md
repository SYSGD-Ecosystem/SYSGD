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
   el superadmin → **SMS a su teléfono** (pasarela OTP NOXCREATION,
   `POST /api/v2/sms/send`, 6 CUP por aviso) **+ email** (Resend). Fire-and-forget,
   nunca bloquea. Variables en Railway: `SMS_API_TOKEN` (x-token-secret,
   OBLIGATORIA o el SMS se omite), opcionales `SMS_API_URL`, `SUPERADMIN_PHONE`
   (defecto +5351158544), `SUPERADMIN_EMAIL`, `ADMIN_LOGIN_ALERT_ENABLED=false`
   para apagar.
4. **2FA admin**: existe por email pero está desactivado (`false &&` en
   `auth.ts:278`) — pendiente decidir si se enciende.

## Archivos
`src/utils/superadmin.ts`, `src/services/admin-login-alert.service.ts`,
`src/controllers/users.ts`, `src/controllers/auth.ts`, `src/routes/users.ts`.
