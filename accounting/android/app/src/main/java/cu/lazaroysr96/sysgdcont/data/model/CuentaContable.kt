package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.ColumnInfo
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
    val naturaleza: String, // ACREEDORA, DEUDORA, MIXTA (solo contabilidad interna)
    val tipo: String, // ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO, MIXTO
    @ColumnInfo(defaultValue = "'MIXTO'")
    val usoOperativo: String = UsoOperativoCuenta.MIXTO,
    val padreId: String? = null,
    val usaParaTributo: String? = null, // Vinculación a tributo específico
    val activo: Boolean = true,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

object NaturalezaCuenta {
    const val ACREEDORA = "ACREEDORA"
    const val DEUDORA = "DEUDORA"
    const val MIXTA = "MIXTA"
    
    val todos = listOf(ACREEDORA, DEUDORA, MIXTA)
    
    fun label(naturaleza: String): String = when(naturaleza) {
        ACREEDORA -> "Acreedora"
        DEUDORA -> "Deudora"
        MIXTA -> "Mixta"
        else -> naturaleza
    }
}

object TipoCuenta {
    const val ACTIVO = "ACTIVO"
    const val PASIVO = "PASIVO"
    const val PATRIMONIO = "PATRIMONIO"
    const val INGRESO = "INGRESO"
    const val GASTO = "GASTO"
    const val MIXTO = "MIXTO"
    
    val todos = listOf(ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO, MIXTO)
    
    fun label(tipo: String): String = when(tipo) {
        ACTIVO -> "Activo"
        PASIVO -> "Pasivo"
        PATRIMONIO -> "Patrimonio"
        INGRESO -> "Ingreso"
        GASTO -> "Gasto"
        MIXTO -> "Mixto"
        else -> tipo
    }
}

object UsoOperativoCuenta {
    const val INGRESO = "INGRESO"
    const val GASTO = "GASTO"
    const val MIXTO = "MIXTO"
    const val AFT = "AFT"

    val todos = listOf(INGRESO, GASTO, MIXTO, AFT)

    fun label(uso: String): String = when (uso) {
        INGRESO -> "Ingreso"
        GASTO -> "Gasto"
        MIXTO -> "Mixto"
        AFT -> "AFT"
        else -> uso
    }
}

@Suppress("SENSELESS_COMPARISON")
fun CuentaContable.usoOperativoNormalizado(): String =
    usoOperativo?.takeIf { it.isNotBlank() } ?: UsoOperativoCuenta.MIXTO

fun CuentaContable.disponibleParaUso(uso: String): Boolean {
    val actual = usoOperativoNormalizado()
    return activo && (actual == uso || (uso in listOf(UsoOperativoCuenta.INGRESO, UsoOperativoCuenta.GASTO) && actual == UsoOperativoCuenta.MIXTO))
}

fun CuentaContable.conUsoOperativoNormalizado(): CuentaContable =
    copy(usoOperativo = usoOperativoNormalizado())

object CuentasContablesPorDefecto {
    const val CODIGO_INGRESOS_VENTAS = "900"
    const val CODIGO_GASTOS_ACTIVIDAD = "814"
    const val ID_INGRESOS_VENTAS_LEGACY = "cuenta_740_ingresos_ventas_bienes_servicios"
    const val ID_GASTOS_ACTIVIDAD_LEGACY = "cuenta_810_gastos_actividad"

    fun ingresosVentas(): CuentaContable = CuentaContable(
        id = "cuenta_900_ventas",
        codigo = CODIGO_INGRESOS_VENTAS,
        nombre = "Ventas",
        tipo = TipoCuenta.INGRESO,
        usoOperativo = UsoOperativoCuenta.INGRESO,
        naturaleza = NaturalezaCuenta.ACREEDORA
    )

    fun gastosActividad(): CuentaContable = CuentaContable(
        id = "cuenta_814_costo_ventas",
        codigo = CODIGO_GASTOS_ACTIVIDAD,
        nombre = "Costo de Ventas",
        tipo = TipoCuenta.GASTO,
        usoOperativo = UsoOperativoCuenta.GASTO,
        naturaleza = NaturalezaCuenta.DEUDORA
    )

    fun todas(): List<CuentaContable> = listOf(
        ingresosVentas(),
        gastosActividad()
    )
}
