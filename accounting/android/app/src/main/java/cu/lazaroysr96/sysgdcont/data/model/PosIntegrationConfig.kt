package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pos_integration_config")
data class PosIntegrationConfig(
    @PrimaryKey val id: String = DEFAULT_ID,
    val enabled: Boolean = false,
    val ingresoCuentaId: String? = null,
    val gastoCuentaId: String? = null,
    val updatedAt: Long = System.currentTimeMillis()
) {
    companion object {
        const val DEFAULT_ID = "default"
    }
}
