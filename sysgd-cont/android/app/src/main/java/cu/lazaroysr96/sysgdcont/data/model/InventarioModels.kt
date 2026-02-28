package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "productos")
data class Producto(
    @PrimaryKey val id: String,
    val nombre: String,
    val precio: Double,
    val emoji: String = "📦",
    val unidad: String = "und",
    val activo: Boolean = true
)

@Entity(tableName = "ventas")
data class Venta(
    @PrimaryKey val id: String,
    val fecha: String,
    val hora: String,
    val total: Double,
    val anulada: Boolean = false
)

@Entity(
    tableName = "lineas_venta",
    foreignKeys = [
        ForeignKey(
            entity = Venta::class,
            parentColumns = ["id"],
            childColumns = ["ventaId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Producto::class,
            parentColumns = ["id"],
            childColumns = ["productoId"],
            onDelete = ForeignKey.RESTRICT
        )
    ],
    indices = [Index("ventaId"), Index("productoId")]
)
data class LineaVenta(
    @PrimaryKey val id: String,
    val ventaId: String,
    val productoId: String,
    val nombreProducto: String,
    val precioUnitario: Double,
    val cantidad: Int
) {
    val subtotal: Double get() = precioUnitario * cantidad
}

data class VentaConLineas(
    val venta: Venta,
    val lineas: List<LineaVenta>
) {
    val totalCalculado: Double get() = lineas.sumOf { it.subtotal }
}
