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
    val cantidad: Double
) {
    val subtotal: Double get() = precioUnitario * cantidad
}

data class VentaConLineas(
    val venta: Venta,
    val lineas: List<LineaVenta>
) {
    val totalCalculado: Double get() = lineas.sumOf { it.subtotal }
}

@Entity(tableName = "productos_compra")
data class ProductoCompra(
    @PrimaryKey val id: String,
    val nombre: String,
    val precio: Double,
    val emoji: String = "📦",
    val unidad: String = "und",
    val activo: Boolean = true
)

@Entity(tableName = "compras")
data class Compra(
    @PrimaryKey val id: String,
    val fecha: String,
    val hora: String,
    val total: Double,
    val anulada: Boolean = false
)

@Entity(
    tableName = "lineas_compra",
    foreignKeys = [
        ForeignKey(
            entity = Compra::class,
            parentColumns = ["id"],
            childColumns = ["compraId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = ProductoCompra::class,
            parentColumns = ["id"],
            childColumns = ["productoId"],
            onDelete = ForeignKey.RESTRICT
        )
    ],
    indices = [Index("compraId"), Index("productoId")]
)
data class LineaCompra(
    @PrimaryKey val id: String,
    val compraId: String,
    val productoId: String,
    val nombreProducto: String,
    val precioUnitario: Double,
    val cantidad: Double
) {
    val subtotal: Double get() = precioUnitario * cantidad
}

data class CompraConLineas(
    val compra: Compra,
    val lineas: List<LineaCompra>
) {
    val totalCalculado: Double get() = lineas.sumOf { it.subtotal }
}
