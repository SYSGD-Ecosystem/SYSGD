# Plan De Implementacion De Inventario Vinculado

Este documento deja por escrito el plan detallado para completar la logica de inventario vinculado en `accounting/android`.

La meta es que la app pueda salir a produccion con:

- un unico almacen por defecto
- productos de compra y de venta claramente separados por catalogo
- inventario manual, ilimitado y vinculado funcionando correctamente
- ventas capaces de descontar stock real segun el modo del producto

## Estado Actual

Ya esta resuelto:

- migracion `3 -> 4`
- estructura base con `productos`, `catalogo_compras`, `catalogo_ventas`, `almacenes`, `items_inventario`
- flujo de creacion de productos nuevo para compras y ventas
- compras crean inventario al registrar la compra, no al crear producto
- un producto del almacen puede ponerse a la venta sin duplicar stock
- restauracion legacy mejorada

Todavia pendiente:

- tabla relacional para vinculos
- calculo real de disponibilidad vinculada
- descuento real de componentes al vender un producto vinculado
- prevencion de ciclos
- eliminacion de inventario con motivo

## Problema Que Debe Resolver El Inventario Vinculado

Un producto con stock vinculado no tiene stock propio fijo.

Su disponibilidad depende del stock de otros productos.

Ejemplo:

- `Pan con jamon`
- requiere `Pan = 1`
- requiere `Jamon = 0.05`

Si hay:

- `20` panes
- `1` libra de jamon

Entonces el sistema debe calcular cuantas unidades de `Pan con jamon` pueden venderse segun el minimo fabricable con esos ingredientes.

Cuando se venda `Pan con jamon`, no se descuenta el stock del propio `Pan con jamon`.
Se descuenta:

- `1` pan
- `0.05` jamon

## Principios Del Modelo

### Regla 1

El stock vinculado no debe seguir guardandose como arrays JSON en `items_inventario`.

Eso solo sirvio como aproximacion temporal.

### Regla 2

Los vinculos deben ser una tabla SQL separada.

### Regla 3

La disponibilidad de un producto vinculado debe calcularse dinamicamente.

### Regla 4

La logica de descuento debe soportar recursion.

Si un producto vinculado depende de otro producto vinculado, la venta debe resolver los componentes reales finales.

### Regla 5

No se pueden permitir ciclos.

Ejemplo invalido:

- A depende de B
- B depende de A

## Modelo De Datos Objetivo

### Tabla Existente: `items_inventario`

Se mantiene como definicion del inventario de un producto en un almacen.

Responsabilidad:

- producto
- almacen
- modo de stock
- stock manual cuando aplique

Debe seguir soportando:

- `ILIMITADO`
- `MANUAL`
- `VINCULADO`

### Nueva Tabla: `inventario_vinculos`

Responsabilidad:

- definir de que productos depende un producto vinculado

Campos sugeridos:

- `id` TEXT UUID PRIMARY KEY
- `itemInventarioId` TEXT NOT NULL
- `productoComponenteId` TEXT NOT NULL
- `cantidad` REAL NOT NULL
- `createdAt` TEXT NOT NULL
- `updatedAt` TEXT NOT NULL

Relaciones:

- `itemInventarioId` -> `items_inventario.id`
- `productoComponenteId` -> `productos.id`

Indices recomendados:

- indice por `itemInventarioId`
- indice por `productoComponenteId`
- indice unico compuesto `itemInventarioId + productoComponenteId`

## Relaciones

```text
productos
  1 --- n items_inventario

almacenes
  1 --- n items_inventario

items_inventario
  1 --- n inventario_vinculos

inventario_vinculos
  n --- 1 productos (producto componente)
```

## Significado Exacto De Cada Modo

### `ILIMITADO`

- se puede vender sin restricciones
- no se descuenta stock
- disponibilidad mostrada: infinita

### `MANUAL`

- se vende si `stockDisponible >= cantidad`
- se descuenta del propio item
- disponibilidad mostrada: `stockDisponible`

### `VINCULADO`

- se vende si todos sus componentes tienen disponibilidad suficiente
- no se descuenta del propio item vinculado
- se descuentan los productos componentes
- disponibilidad mostrada: calculada dinamicamente

## Casos De Uso A Cubrir

### Caso 1: Crear Producto De Venta Normal

1. el usuario crea producto en ventas
2. se crea `Producto`
3. se crea `ItemInventario` con modo `ILIMITADO`
4. se crea entrada en `catalogo_ventas`

### Caso 2: Cambiar Un Producto A Modo Vinculado

1. el usuario entra a almacen
2. abre `Ajustar stock`
3. selecciona `VINCULADO`
4. selecciona productos componentes
5. define cantidades requeridas
6. se limpia cualquier vinculo anterior
7. se insertan nuevos registros en `inventario_vinculos`
8. el item queda con `modoStock = VINCULADO`

### Caso 3: Calcular Disponibilidad Vinculada

1. obtener todos los vinculos del item
2. para cada componente, resolver disponibilidad real
3. dividir disponibilidad del componente entre `cantidad` requerida
4. tomar el minimo
5. ese minimo es la disponibilidad fabricable

### Caso 4: Vender Producto Vinculado

1. resolver componentes reales finales
2. comprobar disponibilidad suficiente
3. registrar venta
4. descontar componentes reales

### Caso 5: Vinculo Sobre Otro Vinculado

Ejemplo:

- `Combo desayuno` depende de:
  - `Cafe`
  - `Pan con jamon`
- `Pan con jamon` depende de:
  - `Pan`
  - `Jamon`

La venta de `Combo desayuno` debe terminar descontando:

- `Cafe` si es manual
- `Pan`
- `Jamon`

## Arquitectura Recomendada

### Entidades

Archivo sugerido:

- `data/model/InventarioVinculo.kt`

Entidad sugerida:

- `InventarioVinculo`

### DAO

Archivo sugerido:

- `data/dao/InventarioVinculoDao.kt`

Funciones necesarias:

- `getByItemInventarioId(itemId)`
- `getByProductoComponenteId(productoId)`
- `insert(link)`
- `insertAll(links)`
- `deleteByItemInventarioId(itemId)`
- `deleteById(id)`

### Repository

Responsabilidad nueva dentro de `InventarioRepository`:

- actualizar vinculos
- calcular disponibilidad real
- validar ciclos
- resolver descuento de componentes

## Funciones Necesarias

### 1. `actualizarVinculos(itemId, componentes)`

Responsabilidad:

- borrar vinculos previos del item
- guardar nuevos
- cambiar modo del item a `VINCULADO`

Debe validar:

- que la lista no este vacia
- que no haya cantidades `<= 0`
- que no haya componentes repetidos
- que el producto no se vincule a si mismo

### 2. `calcularDisponibilidad(itemId)`

Debe devolver:

- `Double.POSITIVE_INFINITY` para `ILIMITADO`
- `stockDisponible` para `MANUAL`
- calculo dinamico para `VINCULADO`

### 3. `resolverComponentesFinales(itemId, cantidadVenta)`

Responsabilidad:

- convertir una venta de un producto vinculado en una lista final de descuentos reales

Resultado esperado:

- mapa `itemInventarioId -> cantidadADescontar`

Ejemplo:

Si se venden `2` unidades de un producto que requiere:

- `Harina = 0.5`
- `Azucar = 0.25`

El resultado debe ser:

- `Harina = 1.0`
- `Azucar = 0.5`

Si alguno de esos componentes es a su vez `VINCULADO`, se expande recursivamente.

### 4. `validarSinCiclos(itemId, componentes)`

Responsabilidad:

- asegurar que al guardar nuevos vinculos no se forme un ciclo

Enfoque:

- DFS o recorrido recursivo
- si el item origen vuelve a aparecer en el recorrido, hay ciclo

### 5. `descontarStockSegunModo(itemId, cantidad)`

Comportamiento:

- `ILIMITADO`: no hace nada
- `MANUAL`: descuenta del mismo item
- `VINCULADO`: resuelve componentes finales y descuenta en cascada

## Cambios En La UI

### Dialogo De Ajuste De Stock

Hoy existe y ya permite modo `VINCULADO`, pero usa arrays JSON temporales.

Debe cambiar para:

- leer vinculos desde `inventario_vinculos`
- guardar vinculos en `inventario_vinculos`
- mostrar productos componentes ya configurados

### Lista De Inventario

Debe mostrar:

- si es `ILIMITADO`: icono infinito
- si es `MANUAL`: cantidad actual
- si es `VINCULADO`: cantidad calculada y alguna pista visual de que es calculada

Texto sugerido:

- `Stock vinculado`
- `Disponible para fabricar: X`

### Venta

Al agregar un producto al carrito:

- no hace falta calcular aun

Al confirmar venta:

- validar stock para todos los items
- si uno falla, impedir la venta completa

## Estrategia De Implementacion

### Fase 1: Persistencia Relacional

1. crear entidad `InventarioVinculo`
2. crear DAO
3. registrar entidad y DAO en Room
4. crear migracion `4 -> 5` solo para agregar tabla de vinculos

Nota:

- esta migracion ya seria para la siguiente salida, no para el fix de `3 -> 4`

### Fase 2: Repository

1. reemplazar arrays JSON por DAO de vinculos
2. crear metodos:
   - guardar vinculos
   - leer vinculos
   - borrar vinculos
3. agregar validacion de ciclos

### Fase 3: Calculo

1. implementar `calcularDisponibilidad`
2. implementar recursion
3. implementar resolucion de componentes finales
4. cubrir mezclas de modos `MANUAL`, `ILIMITADO`, `VINCULADO`

### Fase 4: Venta

1. integrar calculo de disponibilidad en `registrarVenta`
2. integrar descuento real por componentes
3. asegurar transaccion atomica

### Fase 5: UI

1. actualizar dialogo de ajuste
2. mostrar disponibilidad calculada
3. mensajes de error claros

### Fase 6: Pruebas

1. producto manual simple
2. producto ilimitado simple
3. producto vinculado a manuales
4. producto vinculado a otro vinculado
5. ciclo invalido
6. venta parcial
7. venta con stock insuficiente
8. restauracion de backup sin vinculos
9. migracion con tabla nueva

## Reglas De Validacion

- no permitir cantidad cero o negativa en un vinculo
- no permitir componentes duplicados
- no permitir auto referencia
- no permitir ciclos directos o indirectos
- si falta un componente, disponibilidad vinculada es cero
- si un componente es ilimitado, no limita el calculo

## Riesgos

### Riesgo 1

Descuentos parciales inconsistentes si se valida stock y se descuenta fuera de transaccion.

Mitigacion:

- hacer la venta y el descuento dentro de una transaccion

### Riesgo 2

Recursion infinita por ciclos.

Mitigacion:

- validacion al guardar
- proteccion adicional durante el calculo

### Riesgo 3

Mostrar `stockDisponible` guardado para vinculados puede confundir.

Mitigacion:

- para vinculados, la UI debe mostrar disponibilidad calculada, no stock crudo

## Decisiones Que Deben Mantenerse

- un solo almacen por defecto en esta version
- soporte preparado para varios almacenes despues
- productos de venta y compra siguen existiendo via catalogos
- inventario es unico por producto y almacen
- stock vinculado es logica de fabricacion, no stock independiente

## Resultado Final Esperado

Cuando esto este terminado:

- el usuario crea productos de venta
- algunos quedan ilimitados
- otros se ajustan a manual
- otros se ajustan a vinculado
- el sistema sabe cuantos se pueden vender
- las ventas descuentan lo correcto
- el almacen refleja disponibilidad real

Ese es el ultimo bloque importante que falta para dejar el sistema de inventario listo para produccion.
