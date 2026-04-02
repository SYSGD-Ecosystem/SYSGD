package cu.lazaroysr96.sysgdcont.data.dao

import androidx.room.*
import cu.lazaroysr96.sysgdcont.data.model.Tarjeta
import kotlinx.coroutines.flow.Flow

@Dao
interface TarjetaDao {
    @Query("SELECT * FROM tarjetas ORDER BY esFavorita DESC, createdAt DESC")
    fun getAll(): Flow<List<Tarjeta>>

    @Query("SELECT * FROM tarjetas WHERE esFavorita = 1 ORDER BY createdAt DESC")
    fun getFavoritas(): Flow<List<Tarjeta>>

    @Query("SELECT * FROM tarjetas WHERE id = :id")
    suspend fun getById(id: String): Tarjeta?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(tarjeta: Tarjeta)

    @Update
    suspend fun update(tarjeta: Tarjeta)

    @Delete
    suspend fun delete(tarjeta: Tarjeta)

    @Query("DELETE FROM tarjetas WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("UPDATE tarjetas SET esFavorita = :esFavorita WHERE id = :id")
    suspend fun updateFavorita(id: String, esFavorita: Boolean)
}
