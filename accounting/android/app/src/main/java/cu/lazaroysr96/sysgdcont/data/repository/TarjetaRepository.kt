package cu.lazaroysr96.sysgdcont.data.repository

import cu.lazaroysr96.sysgdcont.data.dao.TarjetaDao
import cu.lazaroysr96.sysgdcont.data.model.Tarjeta
import kotlinx.coroutines.flow.Flow
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TarjetaRepository @Inject constructor(
    private val tarjetaDao: TarjetaDao
) {
    fun getAll(): Flow<List<Tarjeta>> = tarjetaDao.getAll()

    fun getFavoritas(): Flow<List<Tarjeta>> = tarjetaDao.getFavoritas()

    suspend fun getById(id: String): Tarjeta? = tarjetaDao.getById(id)

    suspend fun agregarTarjeta(nombre: String, numero: String, telefono: String): Tarjeta {
        val tarjeta = Tarjeta(
            id = UUID.randomUUID().toString(),
            nombre = nombre.trim(),
            numero = numero.trim(),
            telefono = telefono.trim(),
            esFavorita = false,
            createdAt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        )
        tarjetaDao.insert(tarjeta)
        return tarjeta
    }

    suspend fun actualizarTarjeta(tarjeta: Tarjeta) {
        tarjetaDao.update(tarjeta)
    }

    suspend fun eliminarTarjeta(id: String) {
        tarjetaDao.deleteById(id)
    }

    suspend fun toggleFavorita(id: String, esFavorita: Boolean) {
        tarjetaDao.updateFavorita(id, esFavorita)
    }

    fun formatearDatosTarjeta(tarjeta: Tarjeta): String {
        return "Nombre: ${tarjeta.nombre}\nNúmero: ${tarjeta.numero}\nTeléfono: ${tarjeta.telefono}"
    }

    fun generarQRContent(tarjeta: Tarjeta): String {
        return "${tarjeta.nombre}|${tarjeta.numero}|${tarjeta.telefono}"
    }

    fun parseQRContent(content: String): Tarjeta? {
        return try {
            val parts = content.split("|")
            if (parts.size == 3) {
                Tarjeta(
                    id = UUID.randomUUID().toString(),
                    nombre = parts[0],
                    numero = parts[1],
                    telefono = parts[2],
                    esFavorita = false,
                    createdAt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                )
            } else null
        } catch (e: Exception) {
            null
        }
    }
}
