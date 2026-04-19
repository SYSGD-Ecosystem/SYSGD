package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "precios_producto",
    foreignKeys = [
        ForeignKey(
            entity = Producto::class,
            parentColumns = ["id"],
            childColumns = ["productoId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("productoId")]
)
data class PrecioProducto(
    @PrimaryKey val id: String,
    val productoId: String,
    val tipoPrecio: String, // COMPRA, VENTA
    val precio: Double,
    val moneda: String = "CUP",
    val fechaDesde: String,
    val fechaHasta: String? = null,
    val activo: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)

object TipoPrecio {
    const val COMPRA = "COMPRA"
    const val VENTA = "VENTA"
    
    val todos = listOf(COMPRA, VENTA)
    
    fun label(tipo: String): String = when(tipo) {
        COMPRA -> "Compra"
        VENTA -> "Venta"
        else -> tipo
    }
}