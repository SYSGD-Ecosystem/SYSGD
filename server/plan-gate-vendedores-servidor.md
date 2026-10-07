# Plan: Gate de vendedores por plan en el servidor (Pro = 3, VIP = ilimitado)

**Estado:** DIAGNÓSTICO CONFIRMADO — PENDIENTE DE IMPLEMENTAR Y DEPLOY
**Fecha:** 2026-10-05
**Prioridad:** ALTA (es la frontera de monetización Pro/VIP)

> Nota de despliegue: solo toma efecto al mergear a `github` y correr el cron
> de Railway (aprox. 2-3 AM).

---

## 1. El problema

El límite de 3 vendedores en plan Pro **no existe en el servidor**.

`cont-workspaces.service.ts:323` valida el **rol** contra la lista de roles válidos:

```typescript
if (!ROLES_VALIDOS.includes(role)) { ... }
```

`ROLES_VALIDOS = ["admin", "member", "viewer", "vendedor"]`

Eso dice qué roles existen. **No dice cuántos miembros con rol `vendedor` puede
tener un workspace.** No hay ningún conteo, ningún tope.

Consecuencia: un dueño en plan gratuito puede invitar a 50 vendedores llamando
`POST /api/cont-workspaces/:id/members/invite` con rol `vendedor`. Y también
puede vincularASHombros locales con `PUT /:id/vendedores/:vendedorId/link`,
que **fija el rol `vendedor`** automáticamente (`cont-workspaces.service.ts:433`).

O sea: **hay dos caminos para crear vendedores**, y ninguno valida el plan.

## 2. El fix en Android ya está hecho, pero no alcanza

Se implementó el gate local en `GCTCP` (ver `plan-gate-vendedores.md`):
`MAX_VENDEDORES_PRO = 3`, validado en `VendedorTurnoViewModel.crearVendedor`.

Pero **es decorativo**, porque la restricción vive en el cliente. Un dueño
puede saltárselo sin tocar la app. El servidor es el que manda, y hoy no valida
nada.

## 3. Decisión

Aplicar el mismo gate en el servidor, en **los dos caminos** que crean vendedores:

### Camino 1 — invitar miembro con rol `vendedor`
`POST /api/cont-workspaces/:id/members/invite`

Antes de insertar, contar los miembros del workspace con rol `vendedor` y
comparar con el plan del dueño.

### Camino 2 — vincular vendedor local
`PUT /api/cont-workspaces/:id/vendedores/:vendedorId/link`

Misma validación. Este camino es el más fácil de evadir porque **no requiere
invitación previa**: cualquiera con acceso al workspace puede vincular un
vendedor_id nuevo y quedarse con rol `vendedor`.

### Regla

```typescript
const MAX_VENDEDORES_PRO = 3;

async function puedeAgregarVendedor(workspaceId, ownerId): Promise<{ok, motivo?}> {
    const plan = await getPlanDelDueno(ownerId);
    if (plan === "vip") return { ok: true };
    const actuales = await contarVendedores(workspaceId);
    if (actuales >= MAX_VENDEDORES_PRO) {
        return { ok: false, motivo: "El plan Pro permite hasta 3 vendedores. Para más, necesitas plan VIP." };
    }
    return { ok: true };
}
```

## 4. Detalle que hay que decidir: plan free

El gate en Android quedó así: **free = 0 vendedores**. El servidor debe coincidir
o los usuarios ven mensajes distintos según por dónde llamen.

Sugerencia: replicar exactamente los tres niveles de Android.

| Plan | Vendedores |
|---|---|
| free | 0 |
| Pro | 3 |
| VIP | ilimitado |

## 5. Alternativas descartadas

- **Validar solo en la invitación**: deja abierto el camino del vínculo.
- **Contar `cont_workspace_vendedor_links` en vez de `resource_access`**: son dos
  fuentes distintas de verdad. Hay que definir cuál manda. **Recomendación:**
  contar los `resource_access` con rol `vendedor`, porque es la que el dueño ve y
  la que el gate de Android cuenta del lado local.

## 6. Pendiente

- [ ] Helper `puedeAgregarVendedor()` en el service.
- [ ] Aplicar en `POST /:id/members/invite` cuando `role === "vendedor"`.
- [ ] Aplicar en `PUT /:id/vendedores/:vendedorId/link`.
- [ ] Mensaje de error claro y en español (el usuario final lo ve).
- [ ] Test: plan free + 4º vendedor → 403. Pro + 4º → 403. VIP + 4º → 201.
- [ ] Verificar que invitar con rol `member`/`editor`/`viewer` **no** se bloquea
      (el límite es de vendedores, no de colaboradores).

## 7. Archivos a tocar

- `src/services/cont-workspaces.service.ts` — helper + validaciones.
- `src/routes/cont-workspaces.ts` — pasar el error.
- `pruebas/` — tests de los tres planes.

## 8. Nota sobre el modelo de negocio

Este gate es la frontera entre Pro y VIP. Es de las pocas cosas donde el usuario
puede comprar más. Si queda solo en el cliente, VIP no tiene motivo de existir.