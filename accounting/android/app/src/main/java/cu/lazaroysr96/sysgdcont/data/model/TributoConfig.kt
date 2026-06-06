package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "tributo_config")
data class TributoConfig(
    @PrimaryKey val key: String,
    val nombre: String,
    val categoria: String,
    val porcentaje: Double = 0.0,
    val incluido: Boolean = false,
    val autocalcular: Boolean = false,
    val orden: Int = 0,
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "tributo_cuenta_base",
    primaryKeys = ["tributoKey", "cuentaId"],
    foreignKeys = [
        ForeignKey(
            entity = TributoConfig::class,
            parentColumns = ["key"],
            childColumns = ["tributoKey"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = CuentaContable::class,
            parentColumns = ["id"],
            childColumns = ["cuentaId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("tributoKey"), Index("cuentaId")]
)
data class TributoCuentaBase(
    val tributoKey: String,
    val cuentaId: String,
    val createdAt: Long = System.currentTimeMillis()
)

data class TributoDefinition(
    val key: String,
    val nombre: String,
    val categoria: String,
    val porcentaje: Double,
    val incluido: Boolean,
    val autocalcular: Boolean,
    val orden: Int
)

data class TributoEditable(
    val config: TributoConfig,
    val selectedCuentaIds: Set<String> = emptySet(),
    val monto: String = "",
    val baseImponible: Double = 0.0
)

object TributoCategorias {
    const val TRIBUTO = "TRIBUTO"
    const val OTRO_DEDUCIBLE = "OTRO_DEDUCIBLE"
}

object TributoKeys {
    const val VENTAS = "ventas"
    const val FUERZA = "fuerza"
    const val SELLOS = "sellos"
    const val ANUNCIOS = "anuncios"
    const val CSS20 = "css20"
    const val CSS14 = "css14"
    const val CSS_SUBSIDIO = "cssSubsidio"
    const val OTROS = "otros"
    const val RESTAURACION = "restauracion"
    const val ARRENDAMIENTO = "arrendamiento"
    const val EXONERADO = "exonerado"
    const val OTROS_MFP = "otrosMFP"
    const val CUOTA_MENSUAL = "cuotaMensual"
}

object TributoConfigsPorDefecto {
    val definiciones: List<TributoDefinition> = listOf(
        TributoDefinition(
            key = TributoKeys.VENTAS,
            nombre = "Impuesto sobre ventas y servicios",
            categoria = TributoCategorias.TRIBUTO,
            porcentaje = 10.0,
            incluido = true,
            autocalcular = true,
            orden = 0
        ),
        TributoDefinition(
            key = TributoKeys.FUERZA,
            nombre = "Impuesto por la utilización de la fuerza de trabajo",
            categoria = TributoCategorias.TRIBUTO,
            porcentaje = 5.0,
            incluido = false,
            autocalcular = true,
            orden = 1
        ),
        TributoDefinition(
            key = TributoKeys.SELLOS,
            nombre = "Impuesto por documentos y sellos",
            categoria = TributoCategorias.TRIBUTO,
            porcentaje = 0.0,
            incluido = false,
            autocalcular = false,
            orden = 2
        ),
        TributoDefinition(
            key = TributoKeys.ANUNCIOS,
            nombre = "Tasa por radicación de anuncios",
            categoria = TributoCategorias.TRIBUTO,
            porcentaje = 0.0,
            incluido = false,
            autocalcular = false,
            orden = 3
        ),
        TributoDefinition(
            key = TributoKeys.CSS20,
            nombre = "Contribución Especial a la seguridad social 20%",
            categoria = TributoCategorias.TRIBUTO,
            porcentaje = 20.0,
            incluido = false,
            autocalcular = false,
            orden = 4
        ),
        TributoDefinition(
            key = TributoKeys.CSS14,
            nombre = "Contribución a la seguridad social 12.5%",
            categoria = TributoCategorias.TRIBUTO,
            porcentaje = 12.5,
            incluido = false,
            autocalcular = false,
            orden = 5
        ),
        TributoDefinition(
            key = TributoKeys.CSS_SUBSIDIO,
            nombre = "CSS - Retención Para pago de subsidios a trabajadores 1.5%",
            categoria = TributoCategorias.TRIBUTO,
            porcentaje = 1.5,
            incluido = false,
            autocalcular = false,
            orden = 6
        ),
        TributoDefinition(
            key = TributoKeys.OTROS,
            nombre = "Otros tributos",
            categoria = TributoCategorias.TRIBUTO,
            porcentaje = 0.0,
            incluido = false,
            autocalcular = false,
            orden = 7
        ),
        TributoDefinition(
            key = TributoKeys.RESTAURACION,
            nombre = "Contribución territorial para la restauración",
            categoria = TributoCategorias.OTRO_DEDUCIBLE,
            porcentaje = 0.0,
            incluido = false,
            autocalcular = false,
            orden = 8
        ),
        TributoDefinition(
            key = TributoKeys.ARRENDAMIENTO,
            nombre = "Pago de arrendamiento al Estado",
            categoria = TributoCategorias.OTRO_DEDUCIBLE,
            porcentaje = 0.0,
            incluido = false,
            autocalcular = false,
            orden = 9
        ),
        TributoDefinition(
            key = TributoKeys.EXONERADO,
            nombre = "Exonerado por reparaciones constructivas",
            categoria = TributoCategorias.OTRO_DEDUCIBLE,
            porcentaje = 0.0,
            incluido = false,
            autocalcular = false,
            orden = 10
        ),
        TributoDefinition(
            key = TributoKeys.OTROS_MFP,
            nombre = "Otros gastos deducibles autorizados por MFP",
            categoria = TributoCategorias.OTRO_DEDUCIBLE,
            porcentaje = 0.0,
            incluido = false,
            autocalcular = false,
            orden = 11
        ),
        TributoDefinition(
            key = TributoKeys.CUOTA_MENSUAL,
            nombre = "Cuota mensual 5%",
            categoria = TributoCategorias.OTRO_DEDUCIBLE,
            porcentaje = 5.0,
            incluido = false,
            autocalcular = false,
            orden = 12
        )
    )

    fun entidades(): List<TributoConfig> = definiciones.map {
        TributoConfig(
            key = it.key,
            nombre = it.nombre,
            categoria = it.categoria,
            porcentaje = it.porcentaje,
            incluido = it.incluido,
            autocalcular = it.autocalcular,
            orden = it.orden
        )
    }
}
