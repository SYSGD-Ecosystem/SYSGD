# Plan: Cifrado en el cliente (zero-knowledge) para el ledger contable

> **BORRADOR — pendiente de decisión de arquitectura.**
> Este documento fue prometido en `plan-sesiones.md` (nota del 2026-10-04) pero
> nunca se escribió. Se escribe ahora para dejar constancia del pedido.
>
> **Nada implementado. El cambio es grande y tiene dependencias sin resolver.**

**Fecha:** 2026-10-05
**Origen:** pedido del usuario (conversación del 2026-10-04)
**Prioridad:** ALTA como argumento de confianza / DIFERENCIACIÓN. Media como
prioridad técnica (rompe funciones existentes).

---

## 0. DECISIÓN TOMADA (2026-10-05): cifrado de cliente OPCIONAL

El usuario decidió lo siguiente, y esto **cierra los bloqueos** que tenía el
diseño original:

1. El cifrado/descifrado ocurre **íntegramente en el dispositivo del usuario**.
2. El servidor es **solo un gestor de paquetes**: guarda lo que le llega y aplica
   su **propio** cifrado sobre lo almacenado.
3. La función de cifrado de cliente es **OPCIONAL** para el usuario.
4. Quien la activa **entiende que nadie más que él puede descifrar sus datos**.
5. Quien no la activa sigue con el flujo actual (servidor con su propia clave).

Es el mismo modelo que usan Signal y WhatsApp con el cifrado de extremo a
extremo: **opt-in, explícito y consciente.**

### Por qué esta decisión resuelve todo

| Problema del diseño original | Cómo se resuelve |
|---|---|
| Los 331 registros hay que migrarlos | **No hace falta.** Cada quien activa cuando quiere. |
| El servidor pierde funciones (informes, agregaciones) | **Solo las pierde para quien activó.** Los demás siguen igual. |
| El soporte no puede recuperar datos | **Solo para quien activó.** Y es el precio consciente de esa opción. |
| Recuperación por email imposible | **Igual, pero es opt-in y está avisado.** |
| Doble verificación / doble factor | **No hay doble clave.** Solo doble derivada (auth y cifrado). |

## 0.1 Lo que sí hay que resolver: el modo dual

El servidor tiene que **saber en qué modo está cada usuario**. Sin un flag, no
puede interpretar el payload.

```
cont_ledger_records
  + modo_cifrado: 'servidor' | 'cliente'   ← nuevo, default 'servidor'
  + parametros_cifrado: jsonb              ← solo si modo='cliente'
       { kdf, iteraciones, memoria, salt_derivacion, version }
```

Con eso el servidor:
- Si `servidor` → sigue descifrando y calculando como hoy. Cero cambios.
- Si `cliente` → guarda el blob opaco, **no lo toca**, y sabe que no puede
  agregarlo ni indexar.

### Consecuencias honestas del modo cliente

Cuando un usuario activa el cifrado de cliente, pierde en el servidor:

- Informes calculados en el servidor.
- Agregaciones, filtros y búsqueda sobre sus datos.
- Cualquier verificación automática de contenido.

**No es una limitación de la implementación, es la consecuencia lógica de que el
servidor no pueda leer los datos.** Tiene que estar escrito en la UI, sin adornos.

## 0.2 Cómo se deriva la clave (decidido)

**Derivación desde la contraseña del usuario, con sal separada para cifrado.**
La contraseña nunca se guarda: se deriva en memoria y se descarta.

```
contraseña → Argon2id(password, salt_cifrado, coste alto) → clave de cifrado
           → AES-GCM sobre el ledger
           → la contraseña se descarta
```

**Dos derivadas distintas, dos sales distintas:**

| Uso | KDF | Sal | Para qué |
|---|---|---|---|
| Autenticación | `Argon2id` | `salt_auth` | Login (el servidor ya usa bcrypt hoy) |
| Cifrado | `Argon2id` | `salt_cifrado` | Cifrar el ledger |

**Por qué las sales deben ser distintas:** el hash de autenticación está en el
servidor. Si compartiera sal con la derivación de cifrado, alguien con acceso a
la base podría derivar la clave de cifrado a partir del hash de auth y volver a
leer los datos. Separadas, el hash de auth **no sirve para descifrar nada**.

**Por qué Argon2id y no bcrypt** (que es lo que usa el servidor hoy):
- bcrypt trunca a 72 bytes.
- bcrypt está diseñado para **velocidad**: se prueban millones por segundo. Para
  cifrado eso deja el ledger vulnerable a fuerza bruta.
- Argon2id es lento y *memory-hard* a propósito. Coste típico: 64 MB, 3
  iteraciones, ~1 segundo. Se paga **una vez por login**, y hace inútil el
  ataque.

**Los parámetros de derivación sí son públicos** y se guardan junto al ledger.
No son secretos: lo que protege los datos es la contraseña, no el algoritmo.

## 0.3 El cambio de contraseña: el punto que hay que diseñar con cuidado

Si el usuario cambia su contraseña, **la clave de cifrado cambia y los datos se
vuelven ilegibles.** Flujo obligatorio:

```
cambiar contraseña
  → pedir la contraseña VIEJA
  → descifrar con la clave vieja
  → re-cifrar con la clave nueva
  → actualizar el registro cifrado
  → recién entonces actualizar la contraseña de auth
```

Tiene que ser una transacción: si falla a mitad, el usuario pierde sus datos.

**Consecuencia:** el **reset por email no puede recuperar datos cifrados**. Hay
que exigir la contraseña anterior. Si se olvidó, se perdió — y la UI debe
decirlo sin eufemismos.

## 0.4 "Recuperar mis datos" en modo cliente

Imposible recuperar por email, por diseño. Lo que sí es útil y honesto: **un
botón que muestre el código de la clave de cifrado para que el usuario lo
guarde antes de perder el teléfono.** Preventivo, no curativo.

Si el usuario pierde la clave y la contraseña, no hay rescate. Prometer
recuperación y no poder cumplir es peor que no ofrecerla.

## 0.5 Lo que falta decidir antes de implementar

1. **¿Cómo se comunica la elección?** Un interruptor en Ajustes con una
   explicación clara de las dos consecuencias. Con palabras del usuario:
   *"nadie más que tú puede desencriptarlos"* y *"no es obligatorio"*.
2. **¿Se puede volver atrás?** Desactivar el cifrado de cliente requiere la
   contraseña para descifrar en el cliente y volver a subir en claro. Es
   reversible, pero hay que decidirlo.
3. **¿Aplica también a otros módulos?** Inventario, terceros, productos, turnos.
   Hoy el ledger es una fila JSONB por usuario; los inventarios también.
4. **¿Y el módulo de vendedores?** El snapshot que el dueño publica, y los
   reportes que el vendedor sube, **no pueden ir cifrados de cliente** si el
   servidor tiene que validarlos. Hay que decidir si quedan fuera del opt-in.

---

## 1. Lo que se pidió originalmente

Que el usuario **cifre sus propios datos en el teléfono, antes de que lleguen al
servidor**. Resultado: el desarrollador (nosotros) sería incapaz de leer los datos
del negocio del usuario.

Más un botón de **"recuperar mis datos"** asociado a la cuenta, para que el
usuario pueda recuperar su información si cambia de teléfono.

Motivo declarado: **más seguridad, privacidad y confianza.**

## 2. El estado actual (verificado)

El ledger se guarda cifrado, pero **la clave la tiene el servidor**.

Nota de `plan-sesiones.md:151`:
> "los 331 registros actuales están cifrados con una clave que tiene el
> servidor. Migrarlos a cifrado de cliente requiere descifrar con la clave del
> servidor y re-cifrar con la del usuario"

Es decir: hoy el cifrado protege contra accesos no autorizados a la base, pero
**no protege contra nosotros**. Si alguien de tu equipo tiene acceso al servidor,
puede descifrar el ledger de cualquier cliente.

## 3. Cómo funciona el modelo

```
ANTES:
  App → (cifra con clave del servidor) → Servidor guarda
  Servidor tiene la clave → puede descifrar

DESPUÉS:
  App → cifra con clave derivada del usuario → Servidor guarda (no sabe la clave)
  Nadie salvo el usuario puede leer
```

Es **zero-knowledge**: el servidor almacena datos que no puede leer.

## 4. Qué clave: DECIDIDO

**Se usa la contraseña del usuario, derivada. No hay frase de cifrado separada.**

Detalle completo en §0.2. Resumen:

- `Argon2id(password, salt_cifrado)` → clave de cifrado del ledger.
- La contraseña **nunca se guarda**: se deriva en memoria y se descarta.
- Sal distinta de la de autenticación, para que el hash de auth que vive en el
  servidor no sirva para descifrar nada.
- Sin doble factor: no hay dos claves que recordar, solo dos derivadas de la
  misma contraseña.

### Por qué se descartó la frase separada

Era la opción que se recomendaba en el borrador original de este plan. Se
descartó porque:

- Añade fricción: el usuario tiene que **crear una clave nueva** aparte de la
  que ya tiene.
- La contraseña sola ya cumple: es lo que hacen los gestores de contraseñas
  (modelo de clave maestra de Bitwarden).
- El único beneficio de separarlas —que cambiar la contraseña de la cuenta no
  rompa el cifrado— se compensa con flujo de re-cifrado en §0.3.

**Costo aceptado a cambio:** el cambio de contraseña y el reset por email
requieren la contraseña anterior. Es el precio consciente de una clave única.

## 5. El problema serio: qué se rompe

Esta es la parte que hay que entender antes de decidir.

El ledger no es solo un texto que se guarda. Si el servidor no puede leerlo,
**pierde toda función que requiera calcular sobre los datos**:

| Función | ¿Requiere que el servidor lea? |
|---|---|
| Guardar / descargar el ledger | No |
| Sincronización entre dispositivos | No (sigue siendo copiar bytes) |
| Informes y PDF | **Depende**: si los genera el servidor, sí |
| Reportes de turnos fusionados | **Sí**, si el servidor compara |
| Búsqueda, filtros, estadísticas del servidor | **Sí** |
| Cualquier agregación en el servidor | **Sí** |

Hoy el servidor ya es "tonto a propósito" en el módulo de turnos (guarda
paquetes cifrados y no calcula). **Esa decisión de diseño es la que hace posible
el zero-knowledge.** Si todo se calcula en la app, el servidor puede ser ciego.

**Con el opt-in esto no es una migración: es una consecuencia del estado de cada
usuario.** Quien está en modo `servidor` no pierde nada. Quien está en modo
`cliente` ya no tiene esos cálculos, y no hay transición global que gestionar.

## 6. Los 331 registros: no hay migración obligatoria

**Este punto cambió con la decisión de hacerlo opcional.**

En el diseño original (obligatorio) había que migrar los 331 registros, y eso
obligaba al servidor a tener la clave vieja durante la transición. **Con el
opt-in, ese problema desaparece:**

- Los 331 siguen en modo `servidor`, sin tocar. Cero riesgo.
- Cada usuario migra **cuando él quiera** — de hecho, en el momento en que
  activa la opción, porque el cifrado de cliente se aplica en el cliente.
- Nadie está obligado, nadie pierde nada, y no hay una ventana de transición
  donde el servidor tiene claves dobles.

Queda una sola decisión menor: **¿se puede volver atrás?** Desactivar exige que
el cliente descifre localmente y vuelva a subir en claro. Es reversible en la
teoría, pero hay que decidirlo y probarlo.

## 7. "Recuperar mis datos" — el botón

Pedido explícito: un botón para recuperar los datos si cambia de teléfono.

**Solo aplica a quien activó el cifrado de cliente.** Con el opt-in, el resto de
los usuarios sigue con la recuperación por email de siempre.

Con cifrado de cliente, **recuperar es imposible sin la clave del usuario**. Eso
es la propiedad buscada, pero hay que diseñarlo bien:

| Lo que el usuario espera | Lo que se puede hacer |
|---|---|
| "Recuperé mis datos con mi email" | **No**, sin la clave no se puede |
| "Los descargué antes y los restauré" | Sí, si tiene el archivo |
| "Se me olvidó la contraseña" | **No.** Se perdió (ver §0.3) |

La opción robusta y honesta: **el botón "recuperar" muestra el QR o el código de
su clave de cifrado para que la guarde antes de perder el teléfono.** Es
preventivo, no curativo.

Si el usuario pierde la clave, no hay soporte que valga. Hay que decirlo claro
en la UI, porque prometer recuperación y no poder cumplir es peor que no
ofrecerla.

## 8. Alternativas descartadas

- **Cifrado en el servidor con clave por usuario, guardada por el servidor**:
  no es zero-knowledge. El servidor sigue pudiendo leer. Descartado porque no
  cumple el objetivo.
- **Cifrado híbrido** (servidor con clave propia, cliente con la suya): duplica
  complejidad sin eliminar el riesgo del servidor.
- **No hacerlo**: es el argumento de confianza más fuerte que se puede tener con
  una app contable, en un contexto donde el usuario tiene miedo de que le miren
  los números. Descartado, pero es una decisión legítima si el costo es alto.

## 9. Lo que queda por decidir

Ya decidido (no volver a preguntar):

- **Clave:** derivada de la contraseña, con sal separada. → §0.2, §4
- **Opcionalidad:** opt-in explícito, no obligatorio. → §0
- **Migración:** nadie migra obligado, los 331 no se tocan. → §6
- **Recuperación:** imposible por email; botón preventivo. → §0.4, §7

Pendiente de decidir:

1. **¿Se puede volver atrás?** Desactivar el cifrado de cliente, o es de ida.
2. **¿Qué pasa con el módulo de vendedores?** El snapshot que publica el dueño y
   los reportes que sube el vendedor **no pueden ir cifrados de cliente**, porque
   el servidor tiene que validarlos y fusionarlos. Quedan fuera del opt-in, o
   cambian de diseño.
3. **¿Qué módulos entran en el opt-in?** Inventario, productos, terceros, turnos —
   además del ledger. Cada uno con datos que el servidor hoy lee.
4. **¿Cómo se comunica la elección al usuario?** Con qué palabras se explica que
   pierde los informes calculados por el servidor.
5. **¿El cifrado de cliente es gratis o de pago?** Es un argumento de venta
   fuerte, pero también da soporte a un plan superior.

## 10. Argumento de negocio (el más fuerte de este plan)

Un dueño de negocio en Cuba tiene un miedo concreto: **que alguien le mire los
números**. El estado, un inspector, un proveedor.

Si la app dice "yo no puedo ver tus datos, ni siquiera el desarrollador", eso es
una ventaja que ninguna de las otras apps de la plataforma tiene. **Y es
verificable**, que es lo que hace que un argumento de confianza funcione.

Es probablemente el mejor diferenciador posible para vender a un negocio pequeño
que tiene tanto que perder con sus números.