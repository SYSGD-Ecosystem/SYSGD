package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "ingreso_gasto_cuenta",
    foreignKeys = [
        ForeignKey(
            entity = CuentaContable::class,
            parentColumns = ["id"],
            childColumns = ["cuentaId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("ingresoGastoId"), Index("cuentaId")]
)
data class IngresoGastoCuenta(
    @PrimaryKey val id: String,
    val ingresoGastoId: String, // ID del DayAmountRow
    val mes: String, //ENE, FEB, etc.
    val tipo: String, // INGRESO o GASTO
    val cuentaId: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "ingreso_gasto_nota",
    indices = [Index("ingresoGastoId")]
)
data class IngresoGastoNota(
    @PrimaryKey val id: String,
    val ingresoGastoId: String, // ID del DayAmountRow
    val mes: String, //ENE, FEB, etc.
    val tipo: String, // INGRESO o GASTO
    val nota: String,
    val createdAt: Long = System.currentTimeMillis()
)