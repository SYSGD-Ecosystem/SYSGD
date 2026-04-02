// data/model/ItemInventario.kt
package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class TipoProductoInv { VENTA, COMPRA }
enum class ModoStock { ILIMITADO, MANUAL, VINCULADO }

@Entity(tableName = "items_inventario")
data class ItemInventario(
    @PrimaryKey val id: String,
    val productoId: String,
    val tipoProducto: String,           // TipoProductoInv.name
    val stockDisponible: Double = 0.0,
    val modoStock: String = ModoStock.ILIMITADO.name,
    val productosVinculadosIds: String = "[]",   // JSON array de ids
    val ratiosConversion: String = "[]",          // JSON array de doubles
    val ultimaActualizacion: String = ""
)