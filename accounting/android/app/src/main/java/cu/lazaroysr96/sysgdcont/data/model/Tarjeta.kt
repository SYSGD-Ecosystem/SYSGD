package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tarjetas")
data class Tarjeta(
    @PrimaryKey val id: String,
    val nombre: String,
    val numero: String,
    val telefono: String,
    val esFavorita: Boolean = false,
    val createdAt: String
)
