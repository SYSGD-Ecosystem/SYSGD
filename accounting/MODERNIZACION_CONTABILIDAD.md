# Plan de Modernización del Sistema de Contabilidad TCP

## Visión General

El objetivo es modernize el sistema de contabilidad para soportar:
1. Catálogo de cuentas contables con naturaleza acreedora/deudora
2. Asociación de cuentas a ingresos/gastos
3. Autocalcular tributos basados en cuentas
4. Conexión automática con el módulo de ventas (POS)
5. Modo estricto para control de inventario

---

## Módulo 1: Catálogo de Cuentas Contables

### objetivo
Permitir definir el plan de cuentas contables que se usarán para clasificar ingresos y gastos, y calcular tributos.

### Modelo de Datos
```kotlin
@Entity(tableName = "catalogo_cuentas")
data class CuentaContable(
    @PrimaryKey val id: String,
    val codigo: String,           // Ej: "4.1.01"
    val nombre: String,          // Ej: "Ventas por servicios"
    val naturaleza: String,      // ACREEDORA | DEUDORA
    val tipo: String,          // ACTIVO | PASIVO | PATRIMONIO | INGRESO | GASTO
    val padreId: String? = null,
    val usaParaTributo: String? = null, // Vinculación a tributo específico
    val activo: Boolean = true
)
```

### Catálogo de Cuentas Sugerido

| Código | Nombre | Naturaleza | Tipo | Uso para Tributo |
|-------|--------|-----------|------|-----------------|
| 4.1.01 | Ventas por productos | Acreedora | Ingreso | Ventas (10%) |
| 4.1.02 | Servicios profesionales | Acreedora | Ingreso | Ventas (10%) |
| 4.2.01 | Otros ingresos | Acreedora | Ingreso | - |
| 5.1.01 | Salarios | Deudora | Gasto | CSS 14%, CSS 20%, Fuerza |
| 5.1.02 | Alquiler de local | Deudora | Gasto | Arrendamiento |
| 5.1.03 | Servicios públicos | Deudora | Gasto | - |
| 5.1.04 | Compra de materiales | Deudora | Gasto | - |
| 5.1.05 | Contribución restauración | Deudora | Gasto | Restauración |

---

## Módulo 2: Association de Cuentas a Ingresos/Gastos

### objective
Cada registro de ingreso/gasto puede tener una cuenta asociada para filtrar por cuenta al calcular tributos.

### Modelo de Datos
```kotlin
// DayAmountRow ya tiene campo 'id' único
data class DayAmountRow(
    val id: String = "",
    val dia: String = "",
    val importe: String = ""
)

// Tabla de vinculación (nueva)
@Entity(tableName = "ingreso_gasto_cuenta")
data class IngresoGastoCuenta(
    @PrimaryKey val id: String,
    val ingresoGastoId: String,  // ID del DayAmountRow
    val mes: String,         // ENE, FEB, etc.
    val tipo: String,       // INGRESO | GASTO
    val cuentaId: String   // FK a CuentaContable
)

@Entity(tableName = "ingreso_gasto_nota")
data class IngresoGastoNota(
    @PrimaryKey val id: String,
    val ingresoGastoId: String,
    val mes: String,
    val tipo: String,
    val nota: String
)
```

### Cambios en UI
- **IngresosScreen**: Agregar dropdown de cuenta + campo nota en dialog
- **GastosScreen**: Agregar dropdown de cuenta + campo nota en dialog

---

## Módulo 3: Precios de Productos

### objective
Gestionar precios de compra y venta por producto con vigencia.

```kotlin
@Entity(tableName = "precios_producto")
data class PrecioProducto(
    @PrimaryKey val id: String,
    val productoId: String,
    val tipoPrecio: String,    // COMPRA | VENTA
    val precio: Double,
    val moneda: String = "CUP",
    val fechaDesde: String,
    val fechaHasta: String? = null,
    val activo: Boolean = true
)
```

---

## Módulo 4: Autocalcular Tributos

### objective
Calcular automáticamente los tributos basados en las cuentas vinculadas.

### Lógica de Cálculo

| Tributo | Cuentas Vinculadas | Fórmula | Condición |
|---------|-----------------|--------|----------|
| **Ventas (10%)** | 4.1.01, 4.1.02 | Sum(cuentas) × 0.10 | Siempre aplica |
| **CSS 14%** | 5.1.01 | Sum(cuentas) × 0.14 | Si hay trabajadores |
| **CSS 20%** | 5.1.01 | Sum(cuentas) × 0.20 | Si hay trabajadores |
| **Fuerza (5%)** | 5.1.01 | Sum(cuentas) × 0.05 | Si hay trabajadores |
| **Sellos** | Según actividad | Variable | Según código actividad |
| **Anuncios** | Según actividad | Fijo | Según código actividad |
| **Cuota 5%** | (Ingresos - Gastos) | Base × 0.05 | Base imponible |
| **Arrendamiento** | 5.1.02 | Según contrato | Solo si alquila |

### UI Propuesta (TributosScreen)

```
┌─────────────────────────────────────────────────────────────────┐
│ Mes: ENE ▼                    [Autocalcular]  [Limpiar]          │
├─────────────────────────────────────────────────────────────────┤
│ ─ TRIBUTOS PAGADOS (Deducibles) ────────────────────────────────│
│                                                                 │
│ ☑ Imp. Ventas (10%)                         Base: 15000 [✏️]      │
│    └ Cuentas: 4.1.01, 4.1.02                            │
│    └ Calculado: 1500.00 CUP                                │
│                                                                 │
│ ☑ CSS 14%                                   Base: 0 [✏️]       │
│    └ Cuenta: 5.1.01                                    │
│    └ ⚠️ Sin datos de nómina                              │
│                                                                 │
│ ☐ CSS 20%                                   Base: 0 [✏️]       │
│    └ Excluido                                                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ─ OTROS GASTOS DEDUCIBLES ──────────────────────────────────────│
│                                                                 │
│ ☑ Cuota Mensual (5%)                      Base: 10000 [✏️]       │
│    └ Base: Ingresos - Gastos = 10000                      │
│    └ Calculado: 500.00 CUP                               │
└─────────────────────────────────────────────────────────────────┘
```

### Botón ✏️ (Editar)
Abre diálogo para configurar:
- Base imponible personalizada (por defecto: suma de cuentas)
- Porcentaje (por defecto: según tipo de tributo)
- Forzar inclusión/exclusión manual

---

## Módulo 5: Conexión con Punto de Venta

### objective
Sincronizar automáticamente las ventas del POS al registro de ingresos contables.

### Flujo
1. Usuario cierra el día en el POS
2. Sistema suma total de ventas del día
3. Crea nuevo registro de ingreso con:
   - Fecha del día
   - Total de ventas
   - Cuenta: 4.1.01 (Ventas por productos)
   - Nota: "Cierre automático POS - [fecha]"

### Preferencias (DataStore)
```kotlin
object PreferencesKeys {
    val POS_VINCULACION_ACTIVA = booleanPreferencesKey("pos_vinculacion_activa")
    val POS_CUENTA_VENTAS = stringPreferencesKey("pos_cuenta_ventas")
    val POS_SINCRO_AUTOMATICA = booleanPreferencesKey("pos_sincro_automatica")
}
```

---

## Módulo 6: Ajustes / Configuración

### objective
Pantalla centralizada para configurar integraciones y modo estricto.

### UI Propuesta

```
┌────────────────────────────────────────────────────────────────┐
│ ← Ajustes                                             │
├────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐  │
│ │ INTEGRACIONES                                 │  │
│ ├──────────────────────────────────────────────────┤  │
│ │                                                 │  │
│ │ ● Conexión con Punto de Venta                  │  │
│ │   sincronizar ventas → ingresos al cerrar     │  │
│ │   [DESACTIVADO]    └─ Cuenta: VENTAS ▼     │  │
│ │                                                 │  │
│ │ ○ Conexión con Terceros                     │  │
│ │   [DESACTIVADO]                              │  │
│ │                                                 │  │
│ └──────────────────────────────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────────────────────┐  │
│ │ MODO ESTRICTO                            │  │
│ ├──────────────────────────────────────────────────┤  │
│ │                                                 │  │
│ │ ○ No permite ventas sin inventario          │  │
│ │ ○ Requiere productos registrados     │  │
│ │ ○ Validar precios de costo           │  │
│ │                                                 │  │
│ │   [DESACTIVADO]                              │  │
│ │                                                 │  │
│ └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## Lista de Archivos a Modificar/Crear

### Nuevos
| Archivo | Descripción |
|---------|-----------|
| `data/model/CuentaContable.kt` | ✓ Creado |
| `data/model/PrecioProducto.kt` | ✓ Creado |
| `data/model/IngresoGastoVinculacion.kt` | ✓ Creado |
| `ui/main/screens/AjustesScreen.kt` | Pendiente |

### Modificados
| Archivo | Cambios |
|---------|---------|
| `data/model/RegistroTCP.kt` | ✓ Campo `id` en DayAmountRow |
| `ui/navigation/Navigation.kt` | ✓ Ruta CATALOGOS_ROUTE |
| `ui/main/MainScreen.kt` | ✓ Opción Catálogo + ruta |
| `viewmodel/LedgerViewModel.kt` | ✓ Funciones con cuenta/nota |
| `data/repository/LedgerRepository.kt` | ✓ Guardar cuenta/nota + ID |
| `ui/main/screens/IngresosScreen.kt` | ✓ Campos cuenta/nota |
| `ui/main/screens/GastosScreen.kt` | ✓ Campos cuenta/nota |
| `ui/main/screens/CatalogosScreen.kt` | ✓ Lista productos + crear |
| `data/repository/InventarioRepository.kt` | ✓ agregarProductoBase |
| `viewmodel/InventarioViewModel.kt` | ✓ agregarProductoBase |

---

## Pendiente de Implementar

1. **Pantalla Cuentas en Catálogo**
   - CRUD completo de cuentas contables
   - Guardar en base de datos (Room)

2. **Precios en Catálogo**
   - CRUD de precios por producto
   - Ver historial de precios

3. **TributosScreen con Autocalcular**
   - Botón autocalcular
   - Checkbox excluir por tributo
   - Selector editar base/porcentaje
   - Conexión con cuentas

4. **Pantalla Ajustes**
   - Toggle integraciones
   - Toggle modo estricto

5. **Sincronización POS → Contabilidad**
   - Función cerrar día automático
   - Guardar preferencia en DataStore

---

## Notas

- Los datos de cuenta y nota actualmente se guardan en el modelo `DayAmountRow` pero no se persiste en la base de datos remota
- Se requiere actualizar el backend (API) para soportar los nuevos campos
- La integración con POS requiere que el módulo de ventas esté configurado