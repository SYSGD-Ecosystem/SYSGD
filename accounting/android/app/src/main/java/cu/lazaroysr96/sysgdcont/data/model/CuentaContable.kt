package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "catalogo_cuentas",
    indices = [Index(value = ["codigo"], unique = true)]
)
data class CuentaContable(
    @PrimaryKey val id: String,
    val codigo: String,
    val nombre: String,
    val naturaleza: String, // ACREEDORA, DEUDORA
    val tipo: String, // ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO
    val padreId: String? = null,
    val usaParaTributo: String? = null, // Vinculación a tributo específico
    val activo: Boolean = true,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

object NaturalezaCuenta {
    const val ACREEDORA = "ACREEDORA"
    const val DEUDORA = "DEUDORA"
    
    val todos = listOf(ACREEDORA, DEUDORA)
    
    fun label(naturaleza: String): String = when(naturaleza) {
        ACREEDORA -> "Acreedora"
        DEUDORA -> "Deudora"
        else -> naturaleza
    }
}

object TipoCuenta {
    const val ACTIVO = "ACTIVO"
    const val PASIVO = "PASIVO"
    const val PATRIMONIO = "PATRIMONIO"
    const val INGRESO = "INGRESO"
    const val GASTO = "GASTO"
    
    val todos = listOf(ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO)
    
    fun label(tipo: String): String = when(tipo) {
        ACTIVO -> "Activo"
        PASIVO -> "Pasivo"
        PATRIMONIO -> "Patrimonio"
        INGRESO -> "Ingreso"
        GASTO -> "Gasto"
        else -> tipo
    }
}

object CuentasContablesPorDefecto {
    const val CODIGO_INGRESOS_VENTAS = "740"
    const val CODIGO_GASTOS_ACTIVIDAD = "810"

    fun ingresosVentas(): CuentaContable = CuentaContable(
        id = "cuenta_740_ingresos_ventas_bienes_servicios",
        codigo = CODIGO_INGRESOS_VENTAS,
        nombre = "Ingresos por ventas de bienes y servicios",
        tipo = TipoCuenta.INGRESO,
        naturaleza = NaturalezaCuenta.ACREEDORA
    )

    fun gastosActividad(): CuentaContable = CuentaContable(
        id = "cuenta_810_gastos_actividad",
        codigo = CODIGO_GASTOS_ACTIVIDAD,
        nombre = "Gastos de la actividad",
        tipo = TipoCuenta.GASTO,
        naturaleza = NaturalezaCuenta.DEUDORA
    )

    fun todas(): List<CuentaContable> = listOf(
        ingresosVentas(),
        gastosActividad()
    )
}
