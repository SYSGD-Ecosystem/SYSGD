# Plan: activación idempotente de Plan Pro por licencia Apklis (Android)

## Problema
La edición Apklis de "Gestor Contable TCP" (Android, paquete base
`cu.lazaroysr96.sysgdcont`) vende licencias a través de la tienda cubana Apklis
(Console → Grupos de Licencias). Hoy el servidor central NO se entera de esas
compras: el plan del usuario vive en `users.user_data->billing` y solo se
activa por el flujo de transferencia manual (manual-payments) o el trial de
registro. Resultado: un usuario que paga la licencia en Apklis sigue siendo
`free` en la nube.

Síntoma exacto (reportado): "que nuestro servidor se entere y también active el
plan de usuario Pro". El cliente Android detecta la licencia Apklis y desbloquea
los módulos locales; el backend debe activar Pro de forma idempotente.

## Causa raíz
No existe ninguna tabla, endpoint ni servicio relacionado con Apklis
(verificado con grep exhaustivo: `apklis` solo aparece en la detección de
distribución del registro). El plan se guarda como JSONB en
`users.user_data.billing` (tier, plan_validity) y `activatePlanBilling` solo
soporta `duration_months` (1/3/12), no días arbitrarios (3/30/90/365).

## Decisión
Implementar `POST /api/licence/apklis/activate` (autenticado, el llamante es la
app ya logueada con JWT) que activa `tier: "pro"` con vigencia por días,
**idempotente** por `(user_id, apklis_license)`.

Pasos:
1. **Tabla dedupe** `apklis_licence_activations` (patrón
   `crypto_payment_fulfillments`):
   - `UNIQUE (user_id, apklis_license)` → el string de licencia que devuelve
     Apklis es la clave de negocio; PK también protege la carrera si dos
     transacciones insertan a la vez.
   - Guardamos el payload completo (uuid/nombre/días/precio/paquete/usuario/
     purchased_at) para auditoría.
2. **Endpoint** (route delgado → controller valida zod → service transacciona):
   - Flujo espejo de `fulfillOrderIfNeeded`: `BEGIN` → `SELECT` dedupe → si
     existe `COMMIT` + 200 `{ alreadyActivated: true }` → `SELECT user_data FROM
     users WHERE id=$1 FOR UPDATE` → normaliza billing → activa pro con
     `expires_at = now + licence_days` → `UPDATE jsonb_set billing` → `INSERT`
     dedupe → `COMMIT`; `ROLLBACK` en error.
   - `plan_validity`:
     `{ started_at, expires_at, duration_months: 1|3|12|null, duration_days,
     source: "purchase", product: "contability_tcp", apklis: { uuid, name, days,
     license, username } }`.
     (La ruta `GET /api/users/plan` ya lee `duration_days` y `source`.)
   - Validación de entrada (zod): `apklis_license_uuid` ∈ catálogo conocido,
     `apklis_license` no vacío, `apklis_username` no vacío, `package_name` =
     `cu.lazaroysr96.sysgdcont` (normaliza `.pro/.beta` no permitidos aquí),
     `apklis_license_days` > 0 y ≤ 730.
3. **Sin firma RSA server-side** (gap documentado): Apklis firma el string
   `license` con la clave del grupo; el verbo real sería validarlo con
   `license_private_key.pub`. Hoy la app no reenvía la clave pública y sería
   complejo; guardamos el string como prueba y queda el campo `license` para un
   futuro verificador. Contrapartida: un user autenticado puede auto-activarse
   llamando el endpoint con un uuid del catálogo. Se acepta por ahora (mismo
   modelo de confianza que manual-payments provisional), pero se registra como
   mejora pendiente de seguridad.
4. **No acumula**: comprar una licencia mayor reemplaza la vigencia actual
   (comportamiento de `activatePlanBilling`). Tester (3 días) también activa Pro.

## Alcance
- IMPLEMENTADO: tabla + migración manual, service, controller, route, mount.
- Mismo ruta/patrón que `license.routes.ts` (RSA Electron) pero SIN mezclar:
  este es un flujo separado bajo `/api/licence/apklis/activate`.
- Archivos: `src/initDatabase.ts`, `migrations-manual/deploy-apklis-licence.sql`,
  `src/services/licence-apklis.service.ts`, `src/controllers/licence-apklis.controller.ts`,
  `src/routes/licence-apklis.routes.ts`, `src/routes/index.ts`.
- PENDIENTE: `npm run build`, despliegue (`INIT_DB_ON_START=true` o psql manual),
  prueba end-to-end con la app.

## Estado
IMPLEMENTADO (2026-10-09) y `npm run build` OK. Además se extendió
`normalizeBillingState` (PlanValidity) para PRESERVAR `duration_days`, `source`,
`product` y `apklis` — antes los descartaba, por lo que `GET /api/users/plan` siempre
veía `durationDays/source` en null. Pendiente: despliegue en producción
(`migrations-manual/deploy-apklis-licence.sql` o `INIT_DB_ON_START=true`) y prueba
end-to-end con la app.

## Commits sugeridos
1. `feat(licence): activate Pro idempotently from Apklis Android purchases`