package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

enum class WalletTipo { EFECTIVO, BANCO, MOVIL, MERCANCIA, OTRO }
enum class WalletMovimientoTipo { ENTRADA, SALIDA, TRANSFERENCIA }
enum class WalletReferenciaTipo { INGRESO, GASTO, OPERACION_POS, MANUAL }

@Entity(tableName = "moneda_tasas")
data class MonedaTasa(
    @PrimaryKey val id: String,
    val nombre: String,
    val tasa: Double,
    val createdAt: Long = 0L,
    val updatedAt: Long = 0L,
)

@Entity(
    tableName = "monedas",
    foreignKeys = [
        ForeignKey(
            entity = MonedaTasa::class,
            parentColumns = ["id"],
            childColumns = ["tasaId"],
            onDelete = ForeignKey.CASCADE,
        ),
    ],
    indices = [Index("tasaId"), Index(value = ["tipo"], unique = true)],
)
data class Moneda(
    @PrimaryKey val id: String,
    val nombre: String,
    val tipo: String,
    val tasaId: String,
    val createdAt: Long = 0L,
    val updatedAt: Long = 0L,
)

@Entity(
    tableName = "moneda_tasa_historial",
    foreignKeys = [
        ForeignKey(
            entity = Moneda::class,
            parentColumns = ["id"],
            childColumns = ["monedaId"],
            onDelete = ForeignKey.CASCADE,
        ),
    ],
    indices = [Index("monedaId")],
)
data class MonedaTasaHistorial(
    @PrimaryKey val id: String,
    val monedaId: String,
    val tasa: Double,
    val createdAt: Long = 0L,
)

@Entity(
    tableName = "wallets",
    foreignKeys = [
        ForeignKey(
            entity = Moneda::class,
            parentColumns = ["id"],
            childColumns = ["monedaId"],
            onDelete = ForeignKey.RESTRICT,
        ),
    ],
    indices = [Index("monedaId"), Index("tipo")],
)
data class Wallet2(
    @PrimaryKey val id: String,
    val nombre: String,
    val tipo: WalletTipo,
    val saldoInicial: Double,
    val monedaId: String,
    val activo: Boolean = true,
    val createdAt: Long = 0L,
    val updatedAt: Long = 0L,
)

@Entity(
    tableName = "wallet_movimientos",
    foreignKeys = [
        ForeignKey(
            entity = Wallet2::class,
            parentColumns = ["id"],
            childColumns = ["walletOrigenId"],
            onDelete = ForeignKey.SET_NULL,
        ),
        ForeignKey(
            entity = Wallet2::class,
            parentColumns = ["id"],
            childColumns = ["walletDestinoId"],
            onDelete = ForeignKey.SET_NULL,
        ),
        ForeignKey(
            entity = Moneda::class,
            parentColumns = ["id"],
            childColumns = ["monedaId"],
            onDelete = ForeignKey.RESTRICT,
        ),
    ],
    indices = [
        Index("walletOrigenId"),
        Index("walletDestinoId"),
        Index("monedaId"),
        Index("tipo"),
        Index("fecha"),
    ],
)
data class WalletMovimiento(
    @PrimaryKey val id: String,
    val walletOrigenId: String?,
    val walletDestinoId: String?,
    val monto: Double,
    val tasaAlMomento: Double = 1.0,
    val monedaId: String,
    val tipo: WalletMovimientoTipo,
    val referenciaId: String? = null,
    val referenciaTipo: WalletReferenciaTipo? = null,
    val nota: String = "",
    val fecha: String,
    val createdAt: Long = 0L,
)
