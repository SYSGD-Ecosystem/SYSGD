package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

enum class TipoProductoInv { VENTA, COMPRA }
enum class ModoStock { ILIMITADO, MANUAL, VINCULADO }

@Entity(
    tableName = "items_inventario",
    indices = [Index(value = ["productoId"]), Index(value = ["almacenId"])]
)
data class ItemInventario(
    @PrimaryKey val id: String,
    val productoId: String,
    val almacenId: String = Almacen.DEFAULT_ID,
    val tipoProducto: String = TipoProductoInv.VENTA.name,
    @ColumnInfo(defaultValue = "0.0")
    val stockDisponible: Double = 0.0,
    @ColumnInfo(defaultValue = "'ILIMITADO'")
    val modoStock: String = ModoStock.ILIMITADO.name,
    @ColumnInfo(defaultValue = "'[]'")
    val productosVinculadosIds: String = "[]",
    @ColumnInfo(defaultValue = "'[]'")
    val ratiosConversion: String = "[]",
    @ColumnInfo(defaultValue = "''")
    val ultimaActualizacion: String = "",
    @ColumnInfo(defaultValue = "0")
    val visibleEnVentas: Boolean = false
)
