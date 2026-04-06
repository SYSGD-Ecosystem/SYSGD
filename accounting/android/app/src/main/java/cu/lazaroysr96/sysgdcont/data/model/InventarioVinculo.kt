package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "inventario_vinculos",
    foreignKeys = [
        ForeignKey(
            entity = ItemInventario::class,
            parentColumns = ["id"],
            childColumns = ["itemInventarioId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Producto::class,
            parentColumns = ["id"],
            childColumns = ["productoComponenteId"],
            onDelete = ForeignKey.RESTRICT
        )
    ],
    indices = [
        Index("itemInventarioId"),
        Index("productoComponenteId"),
        Index(value = ["itemInventarioId", "productoComponenteId"], unique = true)
    ]
)
data class InventarioVinculo(
    @PrimaryKey val id: String,
    val itemInventarioId: String,
    val productoComponenteId: String,
    val cantidad: Double,
    val createdAt: String,
    val updatedAt: String
)

data class InventarioVinculoRegistro(
    val id: String,
    val itemInventarioId: String,
    val productoComponenteId: String,
    val cantidad: Double
)

data class InventarioVinculoEdicion(
    val productoId: String,
    val cantidad: Double
)
