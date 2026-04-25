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
        ),
        ForeignKey(
            entity = Almacen::class,
            parentColumns = ["id"],
            childColumns = ["almacenId"],
            onDelete = ForeignKey.RESTRICT
        )
    ],
    indices = [Index("productoId"), Index("almacenId")]
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
    val createdAt: Long = System.currentTimeMillis(),
    val almacenId: String = Almacen.DEFAULT_ID
)

data class PrecioProductoDetalle(
    val id: String,
    val productoId: String,
    val tipoPrecio: String,
    val precio: Double,
    val moneda: String,
    val fechaDesde: String,
    val fechaHasta: String? = null,
    val activo: Boolean = true,
    val createdAt: Long = 0L,
    val almacenId: String = Almacen.DEFAULT_ID,
    val almacenNombre: String? = null
)

data class PrecioProductoRegistro(
    val id: String,
    val productoId: String,
    val tipoPrecio: String,
    val precio: Double,
    val moneda: String = "CUP",
    val fechaDesde: String,
    val fechaHasta: String? = null,
    val activo: Boolean = true,
    val createdAt: Long = 0L,
    val almacenId: String = Almacen.DEFAULT_ID
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
