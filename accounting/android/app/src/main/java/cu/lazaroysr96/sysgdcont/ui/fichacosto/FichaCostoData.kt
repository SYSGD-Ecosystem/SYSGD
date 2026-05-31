package cu.lazaroysr96.sysgdcont.ui.fichacosto

import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.snapshots.SnapshotStateList

// ─────────────────────────────────────────────
//  Tipos de fila
// ─────────────────────────────────────────────

enum class FilaTipo {
    /** Encabezado: negrita, sin campo editable (ej. "Gasto Material") */
    GRUPO,
    /** Subfila fija o dinámica: normal, campo editable (ej. "1.1 Insumos") */
    SUBFILA,
    /** Fila calculada automáticamente (ej. "COSTO TOTAL") */
    CALCULADA,
}

// ─────────────────────────────────────────────
//  Modelo de una fila
// ─────────────────────────────────────────────

data class FilaCosto(
    /** Identificador único e inmutable de la fila */
    val id: String,
    /** Etiqueta visible (ej. "Gastos Material", "Combustibles y lubricantes") */
    val etiqueta: String,
    /** Número de fila visible (ej. "1", "1.1", "1.2") */
    val numero: String,
    val tipo: FilaTipo,
    /** Si esta fila puede tener subfilas dinámicas añadidas por el usuario */
    val expandible: Boolean = false,
    /** Valor base (Costo Base) — editable cuando tipo != CALCULADA */
    val costoBase: androidx.compose.runtime.MutableState<Double> = mutableStateOf(0.0),
    /** Valor nuevo (Costo Nuevo) — editable cuando tipo != CALCULADA */
    val costoNuevo: androidx.compose.runtime.MutableState<Double> = mutableStateOf(0.0),
    /** Subfilas dinámicas añadidas por el usuario bajo esta fila */
    val subFilasDinamicas: SnapshotStateList<FilaCosto> = mutableStateListOf(),
)

// ─────────────────────────────────────────────
//  Estado global de la pantalla
// ─────────────────────────────────────────────

data class FichaCostoState(
    val productoServicio: androidx.compose.runtime.MutableState<String> = mutableStateOf(""),
    val codigo: androidx.compose.runtime.MutableState<String> = mutableStateOf(""),
    val um: androidx.compose.runtime.MutableState<String> = mutableStateOf(""),
    val nivelProduccion: androidx.compose.runtime.MutableState<String> = mutableStateOf(""),
    val pctCapacidad: androidx.compose.runtime.MutableState<String> = mutableStateOf(""),
)


// ─────────────────────────────────────────────
//  Modelo persistible temporal por producto
// ─────────────────────────────────────────────

data class FichaCostoPersistida(
    val productoServicio: String = "",
    val codigo: String = "",
    val um: String = "",
    val nivelProduccion: String = "",
    val pctCapacidad: String = "",
    val filas: List<FilaCostoPersistida> = emptyList(),
)

data class FilaCostoPersistida(
    val id: String = "",
    val etiqueta: String = "",
    val numero: String = "",
    val tipo: FilaTipo = FilaTipo.SUBFILA,
    val expandible: Boolean = false,
    val costoBase: Double = 0.0,
    val costoNuevo: Double = 0.0,
)

fun FichaCostoState.toPersistida(filas: List<FilaCosto>): FichaCostoPersistida = FichaCostoPersistida(
    productoServicio = productoServicio.value,
    codigo = codigo.value,
    um = um.value,
    nivelProduccion = nivelProduccion.value,
    pctCapacidad = pctCapacidad.value,
    filas = filas.map { it.toPersistida() },
)

fun FilaCosto.toPersistida(): FilaCostoPersistida = FilaCostoPersistida(
    id = id,
    etiqueta = etiqueta,
    numero = numero,
    tipo = tipo,
    expandible = expandible,
    costoBase = costoBase.value,
    costoNuevo = costoNuevo.value,
)

fun FilaCostoPersistida.toFilaCosto(): FilaCosto = FilaCosto(
    id = id,
    etiqueta = etiqueta,
    numero = numero,
    tipo = tipo,
    expandible = expandible,
    costoBase = mutableStateOf(costoBase),
    costoNuevo = mutableStateOf(costoNuevo),
)

// ─────────────────────────────────────────────
//  Construcción inicial de las filas
// ─────────────────────────────────────────────

/** Genera el listado base de filas según el formulario oficial del MFP.
 *  Cada grupo que en el original lleva "(Desglosar)" se marca como expandible.
 */
fun buildFilasIniciales(): List<FilaCosto> = listOf(

    // ── Grupo 1: Gasto Material ──────────────────────────────────────────
    FilaCosto(
        id = "1", numero = "1", tipo = FilaTipo.GRUPO, expandible = false,
        etiqueta = "Gasto Material",
    ),
    FilaCosto(
        id = "1.1", numero = "1.1", tipo = FilaTipo.SUBFILA,
        etiqueta = "De ello: Insumos (Materias primas y materiales)",
    ),
    FilaCosto(
        id = "1.2", numero = "1.2", tipo = FilaTipo.SUBFILA,
        etiqueta = "Combustibles y lubricantes",
    ),
    FilaCosto(
        id = "1.3", numero = "1.3", tipo = FilaTipo.SUBFILA,
        etiqueta = "Energía",
    ),
    FilaCosto(
        id = "1.4", numero = "1.4", tipo = FilaTipo.SUBFILA,
        etiqueta = "Agua",
    ),

    // ── Grupo 2: Salario Directo ────────────────────────────────────────
    FilaCosto(
        id = "2", numero = "2", tipo = FilaTipo.GRUPO, expandible = true,
        etiqueta = "Salario Directo o retribución directa",
    ),

    // ── Grupo 3: Otros Gastos Directos ──────────────────────────────────
    FilaCosto(
        id = "3", numero = "3", tipo = FilaTipo.GRUPO, expandible = true,
        etiqueta = "Otros Gastos Directos (Desglosar)",
    ),

    // ── Grupo 4: Gastos Asociados ────────────────────────────────────────
    FilaCosto(
        id = "4", numero = "4", tipo = FilaTipo.GRUPO, expandible = false,
        etiqueta = "Gastos asociados a la producción",
    ),
    FilaCosto(
        id = "4.1", numero = "4.1", tipo = FilaTipo.SUBFILA,
        etiqueta = "De ello, salarios",
    ),

    // ── Fila 5: Costo Total (auto) ───────────────────────────────────────
    FilaCosto(
        id = "5", numero = "5", tipo = FilaTipo.CALCULADA,
        etiqueta = "COSTO TOTAL (1+2+3+4)",
    ),

    // ── Grupo 6: Gastos Generales ────────────────────────────────────────
    FilaCosto(
        id = "6", numero = "6", tipo = FilaTipo.GRUPO, expandible = true,
        etiqueta = "Gastos Generales y de Administración",
    ),
    FilaCosto(
        id = "6.1", numero = "6.1", tipo = FilaTipo.SUBFILA,
        etiqueta = "De ello, salarios",
    ),

    // ── Grupo 7: Distribución y Venta ───────────────────────────────────
    FilaCosto(
        id = "7", numero = "7", tipo = FilaTipo.GRUPO, expandible = true,
        etiqueta = "Gastos de Distribución y Venta",
    ),
    FilaCosto(
        id = "7.1", numero = "7.1", tipo = FilaTipo.SUBFILA,
        etiqueta = "De ello, salarios",
    ),

    // ── Grupo 8: Gastos Financieros ─────────────────────────────────────
    FilaCosto(
        id = "8", numero = "8", tipo = FilaTipo.GRUPO, expandible = true,
        etiqueta = "Gastos Financieros",
    ),

    // ── Grupo 9: Financiamiento OSDE ────────────────────────────────────
    FilaCosto(
        id = "9", numero = "9", tipo = FilaTipo.GRUPO, expandible = false,
        etiqueta = "Gastos por Financiamiento entregado a la OSDE",
    ),

    // ── Grupo 10: Gastos Tributarios ────────────────────────────────────
    FilaCosto(
        id = "10", numero = "10", tipo = FilaTipo.GRUPO, expandible = true,
        etiqueta = "Gastos Tributarios (Contribución a la Seguridad Social e Impuesto sobre la Utilización de la Fuerza de Trabajo. Otros autorizados)",
    ),

    // ── Fila 11: Total Gastos (auto) ─────────────────────────────────────
    FilaCosto(
        id = "11", numero = "11", tipo = FilaTipo.CALCULADA,
        etiqueta = "TOTAL DE GASTOS (suma de las filas 6, 7, 8, 9 y 10)",
    ),

    // ── Fila 12: Total Costos y Gastos (auto) ───────────────────────────
    FilaCosto(
        id = "12", numero = "12", tipo = FilaTipo.CALCULADA,
        etiqueta = "TOTAL DE COSTOS Y GASTOS (5+11)",
    ),

    // ── Fila 13: Utilidad ────────────────────────────────────────────────
    FilaCosto(
        id = "13", numero = "13", tipo = FilaTipo.GRUPO, expandible = false,
        etiqueta = "Utilidad",
    ),

    // ── Fila 14: Precio o Tarifa ─────────────────────────────────────────
    FilaCosto(
        id = "14", numero = "14", tipo = FilaTipo.GRUPO, expandible = false,
        etiqueta = "PRECIO O TARIFA",
    ),

    // ── Fila 15: Precio Unitario Ajustado ────────────────────────────────
    FilaCosto(
        id = "15", numero = "15", tipo = FilaTipo.GRUPO, expandible = false,
        etiqueta = "PRECIO O TARIFA UNITARIO AJUSTADO",
    ),

    // ── Fila 16: Datos de referencia ─────────────────────────────────────
    FilaCosto(
        id = "16", numero = "16", tipo = FilaTipo.GRUPO, expandible = false,
        etiqueta = "Datos sobre precios de referencia",
    ),
)
