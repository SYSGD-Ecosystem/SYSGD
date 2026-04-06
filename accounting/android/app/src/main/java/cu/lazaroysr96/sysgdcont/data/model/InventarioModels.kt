package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

data class ProductoInventario(
    val id: String,
    val nombre: String,
    val unidad: String,
    val emoji: String = "📦",
    val precio: Double = 0.0,
    val tipo: String = ""
)

data class OperacionInventario(
    val id: String,
    val tipo: String,
    val fecha: String,
    val operacionId: String = "",
    val hora: String = "",
    val anulada: Boolean = false,
    val productoId: String,
    val nombreProducto: String,
    val unidad: String,
    val cantidad: Double,
    val precioUnitario: Double,
    val total: Double,
    val almacenId: String = Almacen.DEFAULT_ID
)

data class AlmacenRegistro(
    val id: String,
    val nombre: String,
    val principal: Boolean = false
)

data class StockRegistro(
    val id: String,
    val productoId: String,
    val almacenId: String,
    val stockDisponible: Double = 0.0,
    val modoStock: String = ModoStock.ILIMITADO.name,
    val productosVinculadosIds: String = "[]",
    val ratiosConversion: String = "[]",
    val ultimaActualizacion: String = "",
    val visibleEnVentas: Boolean = false
)

data class InventarioRegistro(
    val productos: List<ProductoInventario> = emptyList(),
    val catalogoVentas: List<CatalogoVentaRegistro> = emptyList(),
    val catalogoCompras: List<CatalogoCompraRegistro> = emptyList(),
    val almacenes: List<AlmacenRegistro> = emptyList(),
    val stock: List<StockRegistro> = emptyList(),
    val operaciones: List<OperacionInventario> = emptyList(),
    val productosVenta: List<ProductoInventario> = emptyList(),
    val productosCompra: List<ProductoInventario> = emptyList()
)

data class CatalogoVentaRegistro(
    val id: String,
    val productoId: String,
    val precioReferencia: Double,
    val almacenId: String = Almacen.DEFAULT_ID,
    val activo: Boolean = true
)

data class CatalogoCompraRegistro(
    val id: String,
    val productoId: String,
    val precioReferencia: Double,
    val almacenDestinoId: String = Almacen.DEFAULT_ID,
    val activo: Boolean = true
)

@Entity(tableName = "productos")
data class Producto(
    @PrimaryKey val id: String,
    val nombre: String,
    val emoji: String = "📦",
    val unidad: String = "und",
    val activo: Boolean = true
)

data class ProductoVenta(
    val id: String,
    val catalogoId: String,
    val nombre: String,
    val precio: Double,
    val emoji: String = "📦",
    val unidad: String = "und",
    val almacenId: String = Almacen.DEFAULT_ID
)

data class ProductoCompra(
    val id: String,
    val catalogoId: String,
    val nombre: String,
    val precio: Double,
    val emoji: String = "📦",
    val unidad: String = "und",
    val activo: Boolean = true,
    val almacenDestinoId: String = Almacen.DEFAULT_ID
)

@Entity(
    tableName = "catalogo_ventas",
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
data class CatalogoVenta(
    @PrimaryKey val id: String,
    val productoId: String,
    val precioReferencia: Double,
    val almacenId: String = Almacen.DEFAULT_ID,
    val activo: Boolean = true
)

@Entity(
    tableName = "catalogo_compras",
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
            childColumns = ["almacenDestinoId"],
            onDelete = ForeignKey.RESTRICT
        )
    ],
    indices = [Index("productoId"), Index("almacenDestinoId")]
)
data class CatalogoCompra(
    @PrimaryKey val id: String,
    val productoId: String,
    val precioReferencia: Double,
    val almacenDestinoId: String = Almacen.DEFAULT_ID,
    val activo: Boolean = true
)

@Entity(tableName = "almacenes")
data class Almacen(
    @PrimaryKey val id: String,
    val nombre: String,
    val principal: Boolean = false,
    val activo: Boolean = true
) {
    companion object {
        const val DEFAULT_ID = "almacen_principal"
    }
}

@Entity(tableName = "ventas")
data class Venta(
    @PrimaryKey val id: String,
    val fecha: String,
    val hora: String,
    val total: Double,
    val almacenOrigenId: String = Almacen.DEFAULT_ID,
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

@Entity(tableName = "compras")
data class Compra(
    @PrimaryKey val id: String,
    val fecha: String,
    val hora: String,
    val total: Double,
    val almacenDestinoId: String = Almacen.DEFAULT_ID,
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
            entity = Producto::class,
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
