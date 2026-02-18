package cu.lazaroysr96.sysgdcont.data.model

data class GeneralesData(
    val nombre: String = "",
    val anio: Int = 2026,
    val nit: String = "",
    val actividad: String = "",
    val codigo: String = "",
    val fiscalCalle: String = "",
    val fiscalMunicipio: String = "",
    val fiscalProvincia: String = "",
    val legalCalle: String = "",
    val legalMunicipio: String = "",
    val legalProvincia: String = ""
)

data class DayAmountRow(
    val dia: String = "",
    val importe: String = ""
)

data class TributoRow(
    val mes: String = "",
    val ventas: String = "",
    val fuerza: String = "",
    val sellos: String = "",
    val anuncios: String = "",
    val css20: String = "",
    val css14: String = "",
    val otros: String = "",
    val restauracion: String = "",
    val arrendamiento: String = "",
    val exonerado: String = "",
    val otrosMFP: String = "",
    val cuotaMensual: String = ""
)

data class RegistroTCP(
    val generales: GeneralesData = GeneralesData(),
    val ingresos: Map<String, List<DayAmountRow>> = emptyMap(),
    val gastos: Map<String, List<DayAmountRow>> = emptyMap(),
    val tributos: List<TributoRow> = emptyList()
)

data class SyncResult(
    val success: Boolean,
    val message: String,
    val action: SyncAction,
    val localModified: Boolean = false,
    val remoteModified: Boolean = false
)

enum class SyncAction {
    PULL_ONLY,
    PUSH_ONLY,
    MERGED,
    CONFLICT_RESOLVED,
    NO_CHANGES
}

data class MonthlyTotals(
    val month: String,
    val ingresos: Double,
    val gastos: Double,
    val tributos: Double,
    val otrosDeducibles: Double,
    val neto: Double
)

data class AnnualReport(
    val year: Int,
    val totalIngresos: Double,
    val totalGastos: Double,
    val totalTributos: Double,
    val totalOtrosDeducibles: Double,
    val baseImponible: Double,
    val impuestoEstimado: Double,
    val monthly: List<MonthlyTotals>
)
