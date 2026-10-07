# Plan: Cerrar la fuga del ledger al vendedor (seguridad del servidor)

**Estado:** DIAGNÓSTICO CONFIRMADO — PENDIENTE DE IMPLEMENTAR Y DEPLOY
**Fecha:** 2026-10-05
**Prioridad:** CRÍTICA (seguridad)

> Nota de despliegue: los cambios al servidor solo toman efecto cuando se
> mergea a `github` y corre el cron que actualiza Railway (aprox. 2-3 AM).
> Este plan no implica tocar producción de inmediato.

---

## 1. El problema

El vendedor entra al espacio de trabajo como **miembro con rol `vendedor`**
(`ROLES_VALIDOS` en `cont-workspaces.service.ts:22`). El middleware
`hasWorkspaceAccess` (`src/middlewares/auth.ts:51-66`) valida:

```sql
WHERE w.id = $1 AND (w.owner_id = $2 OR ra.user_id IS NOT NULL)
```

Como el vendedor tiene fila en `resource_access`, `ra.user_id IS NOT NULL` es
true y **pasa el control de acceso sin importar el rol**.

Consecuencia: el vendedor puede llamar

```
GET /api/cont-workspaces/:id/ledger
PUT /api/cont-workspaces/:id/ledger
```

y **descargar o modificar el registro contable completo del negocio**, aunque la
app Android nunca le ofrezca esa opción.

## 2. Por qué importa aunque "los usuarios no son hackers"

No es un riesgo de ataque, es un riesgo de **exposición accidental**. Cualquiera
de estos casos basta para filtrar el negocio:

- El usuario con rol vendedor ve el endpoint en DevTools o en Postman.
- Un bug futuro en la app que llame al endpoint equivocado.
- Alguien comparte pantalla o dispositivo.
- Un tester con el token de otra persona.

Y el dato que sí es grave: **el diseño anterior ya tenía este problema** y fue
una de las razones para abandonar el modelo de "clonar el workspace al vendedor".
El bug reaparece por el mismo motivo si no se cierra en el servidor.

Además hay una consecuencia de integridad: un vendedor con acceso de escritura al
ledger puede **alterar los registros del dueño**. Hoy el único límite es que la app
no le da el botón.

## 3. Decisión

**El rol `vendedor` no puede leer ni escribir el ledger del workspace.** Se
implementa en el servidor con un middleware nuevo, no modificando
`hasWorkspaceAccess` (que se usa en muchos sitios y rompería otras rutas).

### Middleware nuevo: `puedeLeerLedger`

Rechaza con `403` cuando el usuario tiene rol `vendedor` en ese workspace.
Acepta `owner`, `admin`, `editor`, `viewer`.

Se aplica **solo** en las dos rutas del ledger:

```typescript
// cont-workspaces.ts
router.get("/:id/ledger", hasWorkspaceAccess, puedeLeerLedger, getLedger);
router.put("/:id/ledger", hasWorkspaceAccess, puedeLeerLedger, putLedger);
```

### Rutas que NO se tocan

Las de turnos siguen igual, porque el vendedor **debe** poder operarlas:

```
PUT  /api/cont-turnos/:id/informe-disponibilidad   dueño publica
GET  /api/cont-turnos/:id/informe-disponibilidad   vendedor descarga (su snapshot)
POST /api/cont-turnos/:id/reportes-turno           vendedor sube su turno
GET  /api/cont-turnos/:id/reportes-turno           dueño lista
PATCH /api/cont-turnos/:id/reportes-turno/:id      dueño marca FUSIONADO
```

## 4. Alternativas descartadas

- **No filtrar nada, confiar en la app**: es exactamente el problema actual.
- **Rechazar al vendedor en todo `hasWorkspaceAccess`**: rompería las rutas de
  turnos, que son las que necesita. Demasiado grueso.
- **Crear un workspace separado para cada vendedor**: es el modelo que ya se
  descartó por conflictos de escritura y duplicación de datos.

## 5. Importante: qué NO hace falta cambiar (corrección)

`informe-disponibilidad` es el mecanismo correcto y ya existe. El dueño publica
un snapshot acotado y el vendedor lo descarga. **No hay que crear un endpoint
nuevo de "contexto por vendedor"** — ese endpoint ya es este.

El diseño correcto (el que se quiere) es:

- El dueño publica solo lo que el vendedor necesita: inventario de su almacén
  filtrado por el catálogo de ventas, una wallet de caja, terceros con rol cliente.
- El vendedor **nunca** pide `cont-workspaces/:id/ledger`.
- Al cerrar el turno sube su informe; el dueño lo descarga y lo aplica.

El middleware simplemente hace que el servidor no dependa de que la app cumpla
esa última regla.

## 6. Pendiente

- [ ] Implementar `puedeLeerLedger`.
- [ ] Aplicarlo en las 2 rutas del ledger.
- [ ] Verificar que un usuario con rol `vendedor` recibe 403 en `GET /ledger`.
- [ ] Verificar que un `editor` sigue funcionando (no romper el flujo actual).
- [ ] Verificar que el vendedor sigue pudiendo usar las 5 rutas de turnos.
- [ ] Probar con el único vínculo real que hay en
      `cont_workspace_vendedor_links` (1 fila).

## 7. Archivos a tocar

- `src/middlewares/auth.ts` — nuevo middleware `puedeLeerLedger`.
- `src/routes/cont-workspaces.ts` — aplicarlo en las 2 rutas del ledger.
- `pruebas/` — test de que el vendedor recibe 403 y el editor 200.