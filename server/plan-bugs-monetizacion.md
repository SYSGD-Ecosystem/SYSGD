# Plan: Dos bugs de monetización (provisional que no expira + trial invisible)

**Estado:** DIAGNÓSTICO CONFIRMADO EN AMBOS — PENDIENTE DE IMPLEMENTAR
**Fecha:** 2026-10-05
**Prioridad:** ALTA (fraude abierto + conversión no comunicada)

> Nota de despliegue: solo toma efecto al mergear a `github` y correr el cron
> de Railway (aprox. 2-3 AM).

Estos dos bugs son independientes. Se pueden hacer por separado.

---

# BUG 1: La orden `provisional` nunca expira

## 1.1 Qué pasa

`manual-payment.service.ts:220` calcula la fecha y la guarda:

```typescript
const graceExpiresAt = status === "provisional"
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;
```

La columna `grace_expires_at` existe en producción (`manual_payment_orders`).

Pero se busca en todo el servidor y `grace_expires_at` **solo aparece en el
SELECT, el INSERT y el UPDATE de la orden**. No hay ningún
`WHERE grace_expires_at < NOW()`, no hay cron, no hay job, no hay interval.

**Una orden `provisional` nunca expira sola.** Se queda indefinidamente hasta que
alguien revise el panel a mano.

## 1.2 Las dos consecuencias

**1. El fraude no se corta.** Un usuario que paga una vez puede crear órdenes
provisionales nuevas cada mes. Como nunca expiran, todas quedan activas. Plan Pro
gratis indefinido con solo evitar la revisión manual.

**2. El plazo de 7 días no existe.** El diseño que se quiere es "7 días y se
revoca". Lo que hay es "hasta que el dueño revise". La revisión manual lo tapa, y
por eso con 13 pagos nunca se notó.

## 1.3 La decisión

Un job que marque como `expired` las órdenes vencidas. **Nunca tocar `approved`.**

```sql
UPDATE manual_payment_orders
   SET status = 'expired', updated_at = NOW()
 WHERE status = 'provisional'
   AND grace_expires_at IS NOT NULL
   AND grace_expires_at < NOW();
```

Y hay que revocar el plan del usuario que quedó con la orden vencida. Ojo: solo
si su plan actual proviene de esa orden. Si tiene otra compra vigente, no se toca.

### Dónde vive el job — decisión pendiente

No verifiqué si Railway tiene algún cron/servicio de background configurado.
Tres opciones:

| Opción | Pros | Contras |
|---|---|---|
| Worker con cron propio | Limpio, exacto | Railway cobra por proceso |
| Check lazy en el login | Sin proceso extra | El plan sobrevive hasta el siguiente login |
| Endpoint que llama el front | Simple | Depende de que alguien abra la app |

**Pendiente de verificar** qué hay configurado antes de elegir.

## 1.4 Comunicar la revocación

Revocar sin avisar es el peor caso: el usuario usó la app 7 días y un día
perdió el acceso sin explicación.

Por eso el mensaje de confirmación debe decir explícitamente que los 7 días son
de verificación. Texto propuesto para la app:

```
Tu plan Pro está activo desde ahora mismo ✅

Tienes 7 días para completar la transferencia. Durante esos 7 días
puedes usar la app completa, sin ninguna restricción.

Al pasar los 7 días verificamos que la transferencia se haya recibido.
Si está todo correcto, tu licencia queda activa y no vuelves a ver
este mensaje.

Si no recibimos la transferencia, el plan se desactiva. Puedes
volver a enviarla cuando quieras.

Ver estado de mi licencia →   |   ¿Problemas? Soporte: ...
```

El mejor caso explícito ("no vuelves a ver este mensaje") reduce la ansiedad del
que ya pagó y cree que quedó en un limbo.

## 1.5 Pendiente

- [ ] Verificar si hay cron en Railway.
- [ ] Job que marque `expired`.
- [ ] Revocar el plan del usuario solo si viene de esa orden.
- [ ] Mensaje de confirmación en la app (texto de arriba).
- [ ] Mensaje de revocación al usuario.
- [ ] Pantalla "estado de mi licencia" (existe el dato: `status`).
- [ ] Test: orden provisional con `grace_expires_at` pasada → `expired`.

---

# BUG 2: El trial es invisible (y no distingue producto)

## 2.1 Qué pasa

El servidor **sí** sabe que es un trial. `routes/users.ts:107`:

```typescript
const DIAS_PRUEBA_POR_DISTRIBUCION = {
    apklis: 30, tienda: 7, freemium: 7, unknown: 7
};
```

Y `construirPrueba()` graba en el `user_data`:

```typescript
plan_validity: {
    expires_at,      // fecha real
    duration_days,   // 7 o 30
    source: "trial"  // ← el dato clave
}
```

El problema: **`source: "trial"` se escribe y nadie lo consulta.** Busqué en todo
el servidor y no hay ningún `WHERE source = 'trial'`, ni endpoint que devuelva
"esto es una prueba", ni flag que la app pueda preguntar.

Distribución real en producción (472 de 472 con plan):

| source | días | usuarios |
|---|---|---|
| `trial` | 30 | 66 |
| `trial` | 7 | 34 |
| (null) | — | 372 |

**Cero usuarios con `source: "purchase"`.** Los 13 pagos aprobados no pasan por
ahí: entran por `manual_payment_orders`, que llama a `userService.updatePlan()`
directamente. Ese camino **no escribe `source: "purchase"`**.

Resultado: **el sistema no tiene forma de distinguir un plan comprado de un
regalo.** Por eso la app muestra "Pro · 1 mes" y el usuario no sabe que le
regalaron.

## 2.2 Un problema más: hay dos productos mezclados

El backend sirve a dos sistemas distintos:

- **SYSGD web**: gestión de proyectos, facturación en **cripto para clientes
  internacionales** (`client/src/components/billing/`).
- **Gestor Contable TCP**: Android, distribución por Apklis, cobro en **CUP**.

El `activatePlanBilling(baseUserData.billing, "pro", 1, ...)` es la **misma
función** para ambos. Un trial de TCP y un trial del sistema de proyectos se
guardan igual: mismo `tier`, mismo `source`.

Peor: la ruta de registro del **sistema web** cae en la línea final de
`buildRegistrationUserData()` y recibe un trial de Pro de 7 días que **nunca
pidió**. De ahí los 372 con `(null)` y la mezcla de datos.

## 2.3 Contexto histórico que hay que respetar

La app **antes del 21 de febrero de 2026** no registraba procedencia. Antes de esa
fecha los usuarios son del sistema web. Después, entraron por la app — y
**todos con Pro automático de un año** (política que cambió después a 30 días).

Hay ~160 usuarios con plan hasta 2027, casi todos venciendo el mismo día de mayo
2027.

**Consecuencia para el análisis:** cualquier métrica de conversión debe filtrar
por `created_at >= '2026-02-21'`. Los anteriores son ruido. Y el "año gratis"
explica por qué la tasa de 13/518 subestima la conversión real: esos usuarios
tuvieron un año completo antes de que el regalo terminara.

## 2.4 La decisión

**Añadir `source` al camino de compra** para que exista el valor `purchase`:

- En `reviewManualPaymentOrder` → `userService.updatePlan()` debe escribir
  `source: "purchase"` (hoy no lo hace).
- Los trials siguen escribiendo `source: "trial"`.

**Añadir el producto** para poder separar los dos sistemas:

```
plan_validity: {
    source: "trial" | "purchase",
    product: "contability_tcp" | "sysgd_web",
    duration_days, expires_at
}
```

Se infiere en el registro (`isContabilidadSource(registrationSource)`) y se fija
al momento del alta, porque después no se puede saber.

**Exponer el dato a la app** y **mostrarlo distinto**:

```
Plan Pro — PRUEBA GRATUITA        |  Plan Pro — ACTIVO
Te quedan 23 días.                 |  Renueva el 30 de noviembre · Pagado
Al terminar, elige un plan.        |
```

Esa diferencia visual **es el mecanismo de venta**. Un usuario que no sabe que
está en prueba no siente que deba pagar.

## 2.5 Pendiente

- [ ] `updatePlan()` escribe `source: "purchase"` (y en lascrypto, `purchase` ya).
- [ ] Añadir `product` a `plan_validity`, fijado en el registro.
- [ ] Endpoint o campo que exponga `source` al login (o extender el actual).
- [ ] La app lee `source` y muestra prueba vs comprado.
- [ ] Pantalla de licencia muestra trial vs compra + días restantes.
- [ ] Aviso de expiración coherente ("tu prueba terminó", no "tu plan venció").
- [ ] **Métrica nueva:** contar trials que nunca compraron. Es el dato de
      conversión que falta para saber si el problema es el precio o el producto.
- [ ] Test: cuenta de usuarios con `source='purchase'` > 0 tras una compra.

---

# Dependencias

Los dos tocan `manual-payment.service.ts` y `routes/users.ts`. Se pueden hacer en
el mismo ciclo o por separado. Bug 1 es más urgente (fraude). Bug 2 mueve
conversión, que es el problema de negocio actual.