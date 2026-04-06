# Modulo De Terceros

Este documento define el plan de ejecucion del modulo de terceros para `accounting/android`.

La idea central es modelar la relacion del negocio con otras personas o entidades y permitir registrar:

- clientes
- proveedores
- empleados
- estado
- cuentas por cobrar
- cuentas por pagar
- compromisos pendientes

En esta app un tercero puede ser una persona natural o una empresa. Un mismo tercero puede cumplir varios roles al mismo tiempo.

## Objetivo

Construir una pantalla con 5 secciones principales:

- Prestamos
- Deudas
- Clientes
- Proveedores
- Empleados

El modulo debe permitir:

- registrar terceros
- asignarles uno o varios roles
- crear obligaciones y prestamos
- registrar cobros y pagos parciales o totales
- saber en todo momento que esta pendiente, vencido, cobrado o pagado

## Enfoque De Modelo

No conviene tener una tabla separada para clientes, otra para proveedores y otra para empleados si el mismo tercero puede aparecer en varias.

La estructura recomendada es:

- una tabla base `terceros`
- una tabla de roles `tercero_roles`
- una tabla de cuentas pendientes `tercero_cuentas`
- una tabla de movimientos de pago/cobro `tercero_movimientos`

Con eso se evita duplicar personas y se hace mas facil mostrar el mismo tercero en varias pantallas.

## Tablas

### `terceros`

Responsabilidad:

- definir la identidad del tercero

Campos sugeridos:

- `id` TEXT UUID PRIMARY KEY
- `nombre` TEXT NOT NULL
- `tipoEntidad` TEXT NOT NULL
  Valores sugeridos: `PERSONA`, `EMPRESA`, `ESTADO`
- `telefono` TEXT NOT NULL DEFAULT ''
- `correo` TEXT NOT NULL DEFAULT ''
- `direccion` TEXT NOT NULL DEFAULT ''
- `identificadorFiscal` TEXT NOT NULL DEFAULT ''
  Puede ser NIT, CI, licencia o similar
- `nota` TEXT NOT NULL DEFAULT ''
- `activo` INTEGER NOT NULL DEFAULT 1
- `createdAt` TEXT NOT NULL
- `updatedAt` TEXT NOT NULL

Notas:

- `nombre` no debe ser unico. Dos terceros pueden tener nombres similares.
- `tipoEntidad` ayuda a personalizar formularios y reportes.

### `tercero_roles`

Responsabilidad:

- indicar que roles cumple cada tercero

Campos sugeridos:

- `id` TEXT UUID PRIMARY KEY
- `terceroId` TEXT NOT NULL
- `rol` TEXT NOT NULL
  Valores sugeridos: `CLIENTE`, `PROVEEDOR`, `EMPLEADO`, `ESTADO`
- `activo` INTEGER NOT NULL DEFAULT 1
- `createdAt` TEXT NOT NULL

Relaciones:

- `terceroId` -> `terceros.id`

Restricciones sugeridas:

- indice unico compuesto por `terceroId + rol`

### `tercero_cuentas`

Responsabilidad:

- representar la cuenta pendiente como tal
- aqui vive la deuda, el prestamo o el compromiso

Campos sugeridos:

- `id` TEXT UUID PRIMARY KEY
- `terceroId` TEXT NOT NULL
- `tipoCuenta` TEXT NOT NULL
  Valores sugeridos: `DEUDA`, `PRESTAMO`
- `categoria` TEXT NOT NULL
  Valores sugeridos: `PROVEEDOR`, `CLIENTE`, `EMPLEADO`, `ESTADO`, `OTRO`
- `concepto` TEXT NOT NULL
- `descripcion` TEXT NOT NULL DEFAULT ''
- `montoOriginal` REAL NOT NULL
- `montoPendiente` REAL NOT NULL
- `fechaCreacion` TEXT NOT NULL
- `fechaVencimiento` TEXT NOT NULL DEFAULT ''
- `estado` TEXT NOT NULL
  Valores sugeridos: `PENDIENTE`, `PAGADO`, `COBRADO`, `VENCIDO`, `CANCELADO`
- `moneda` TEXT NOT NULL DEFAULT 'CUP'
- `origenTipo` TEXT NOT NULL DEFAULT ''
  Sirve para enlazar en el futuro con ventas, compras o nominas
- `origenId` TEXT NOT NULL DEFAULT ''
- `nota` TEXT NOT NULL DEFAULT ''
- `createdAt` TEXT NOT NULL
- `updatedAt` TEXT NOT NULL

Interpretacion:

- `DEUDA`: dinero o compromiso que la empresa debe pagar o cumplir
- `PRESTAMO`: dinero o compromiso que terceros deben pagar o cumplir a la empresa

Ejemplos:

- proveedor pendiente de pago: `DEUDA`
- salario pendiente a empleado: `DEUDA`
- anticipo cobrado a cliente por trabajo aun no entregado: `DEUDA`
- cliente que debe pagar un trabajo: `PRESTAMO`
- proveedor que debe entregar algo ya pagado: `PRESTAMO`

### `tercero_movimientos`

Responsabilidad:

- registrar pagos, cobros y ajustes sobre una cuenta pendiente

Campos sugeridos:

- `id` TEXT UUID PRIMARY KEY
- `cuentaId` TEXT NOT NULL
- `tipoMovimiento` TEXT NOT NULL
  Valores sugeridos: `PAGO`, `COBRO`, `AJUSTE`, `CONDONACION`, `CANCELACION`
- `monto` REAL NOT NULL
- `fecha` TEXT NOT NULL
- `metodo` TEXT NOT NULL DEFAULT ''
  Efectivo, transferencia, etc
- `referencia` TEXT NOT NULL DEFAULT ''
- `nota` TEXT NOT NULL DEFAULT ''
- `createdAt` TEXT NOT NULL

Relaciones:

- `cuentaId` -> `tercero_cuentas.id`

Regla:

- al insertar un movimiento, se recalcula `montoPendiente` en `tercero_cuentas`

## Relaciones Entre Tablas

```text
terceros
  1 --- n tercero_roles
  1 --- n tercero_cuentas

tercero_cuentas
  1 --- n tercero_movimientos
```

## Reglas De Negocio

### Terceros

- un tercero puede ser cliente y proveedor al mismo tiempo
- un tercero puede estar inactivo sin borrar su historial
- no se deben borrar terceros si tienen cuentas o movimientos asociados

### Cuentas

- `montoPendiente` nunca debe ser negativo
- si `montoPendiente == 0`, la cuenta pasa a `PAGADO` o `COBRADO`
- si existe `fechaVencimiento` y ya paso, la cuenta puede mostrarse como `VENCIDO`
- una cuenta cancelada no debe aceptar nuevos movimientos normales

### Movimientos

- un pago o cobro parcial reduce `montoPendiente`
- un ajuste puede subir o bajar `montoPendiente`
- todos los cambios financieros deben quedar auditables por movimientos

## Pantallas

### Clientes

Debe mostrar:

- listado de terceros con rol `CLIENTE`
- resumen de cuentas pendientes
- acceso rapido a crear prestamo o deuda asociada

Casos comunes:

- cliente debe pagar trabajo realizado
- cliente pago por adelantado y queda compromiso pendiente

### Proveedores

Debe mostrar:

- listado de terceros con rol `PROVEEDOR`
- compras o cuentas asociadas
- total pendiente por pagar

Casos comunes:

- proveedor pendiente de cobro
- proveedor pendiente de entregar algo ya abonado

### Empleados

Debe mostrar:

- listado de terceros con rol `EMPLEADO`
- pagos pendientes
- anticipos
- observaciones

### Deudas

Debe mostrar:

- todas las cuentas `DEUDA`
- filtros por rol o categoria
- total pendiente
- vencidas, activas, canceladas

Ejemplos que caen aqui:

- pago pendiente a proveedor
- salario pendiente a empleado
- anticipo cobrado a cliente con trabajo aun pendiente
- compromiso fiscal pendiente con el estado

### Prestamos

Debe mostrar:

- todas las cuentas `PRESTAMO`
- total por cobrar
- vencidas y activas

Ejemplos que caen aqui:

- cliente pendiente de pago
- proveedor pendiente de entrega despues de cobro anticipado

## Flujo Basico De Uso

### Crear Tercero

1. se crea el registro en `terceros`
2. se asigna uno o varios roles en `tercero_roles`

### Crear Cuenta Pendiente

1. el usuario selecciona un tercero
2. define si es `DEUDA` o `PRESTAMO`
3. define categoria, concepto, monto y vencimiento
4. se crea en `tercero_cuentas` con `montoPendiente = montoOriginal`

### Registrar Pago O Cobro

1. el usuario abre una cuenta pendiente
2. registra un movimiento
3. se inserta en `tercero_movimientos`
4. se recalcula `montoPendiente`
5. se actualiza `estado`

## Integracion Con El Resto De La App

Este modulo debe quedar preparado para enlazar con:

- ventas
- compras
- inventario
- facturacion
- nomina futura

Campos previstos para eso:

- `tercero_cuentas.origenTipo`
- `tercero_cuentas.origenId`

Ejemplos:

- una venta a credito puede generar un `PRESTAMO`
- una compra pendiente puede generar una `DEUDA`
- un anticipo de cliente puede generar una `DEUDA` de cumplimiento

## DAO Y Entidades Sugeridas

Archivos probables:

- `data/model/TercerosModels.kt`
- `data/dao/TercerosDao.kt`
- `data/repository/TercerosRepository.kt`
- `viewmodel/TercerosViewModel.kt`
- `ui/main/screens/TercerosScreen.kt`

Entidades sugeridas:

- `Tercero`
- `TerceroRol`
- `TerceroCuenta`
- `TerceroMovimiento`

Enums sugeridos:

- `TipoTerceroEntidad`
- `RolTercero`
- `TipoCuentaTercero`
- `EstadoCuentaTercero`
- `TipoMovimientoTercero`

## Fases De Implementacion

### Fase 1

- crear tablas
- crear DAO
- crear repository
- crear CRUD de terceros
- crear CRUD de cuentas
- listar clientes, proveedores y empleados

### Fase 2

- registrar pagos y cobros parciales
- calcular estados y vencimientos
- pantalla de deudas
- pantalla de prestamos

### Fase 3

- enlazar con compras y ventas
- generar cuentas automaticas desde operaciones
- reportes y filtros avanzados

## Consideraciones De Migracion

- no mezclar este modulo con inventario en la misma migracion si no es necesario
- crear migracion dedicada para terceros cuando se implemente
- preparar defaults seguros para campos de texto vacios
- no hacer borrado fisico de terceros con historial

## Decision Recomendada

La mejor base para este modulo es:

- una tabla base de terceros
- roles separados
- cuentas pendientes separadas
- movimientos separados

Eso permite crecer sin rediseñar despues y soporta correctamente que una misma persona sea cliente, proveedor y empleado al mismo tiempo.
