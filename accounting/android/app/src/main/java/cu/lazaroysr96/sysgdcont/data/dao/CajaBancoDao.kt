package cu.lazaroysr96.sysgdcont.data.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import cu.lazaroysr96.sysgdcont.data.model.Moneda
import cu.lazaroysr96.sysgdcont.data.model.MonedaTasa
import cu.lazaroysr96.sysgdcont.data.model.MonedaTasaHistorial
import cu.lazaroysr96.sysgdcont.data.model.Wallet2
import cu.lazaroysr96.sysgdcont.data.model.WalletMovimiento
import kotlinx.coroutines.flow.Flow

@Dao
interface CajaBancoDao {
    @Query("SELECT * FROM monedas ORDER BY CASE WHEN tipo = 'CUP' THEN 0 ELSE 1 END, tipo ASC")
    fun getMonedas(): Flow<List<Moneda>>

    @Query("SELECT * FROM moneda_tasas ORDER BY nombre ASC")
    fun getMonedaTasas(): Flow<List<MonedaTasa>>

    @Query("SELECT * FROM moneda_tasa_historial ORDER BY createdAt DESC")
    fun getMonedaTasaHistorial(): Flow<List<MonedaTasaHistorial>>

    @Query("SELECT * FROM wallets ORDER BY activo DESC, createdAt ASC, nombre ASC")
    fun getWallets(): Flow<List<Wallet2>>

    @Query("SELECT * FROM wallet_movimientos ORDER BY fecha DESC, createdAt DESC")
    fun getMovimientos(): Flow<List<WalletMovimiento>>

    @Query("SELECT * FROM monedas WHERE tipo = :tipo LIMIT 1")
    suspend fun getMonedaByTipo(tipo: String): Moneda?

    @Query("SELECT COUNT(*) FROM monedas")
    suspend fun countMonedas(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMonedaTasa(tasa: MonedaTasa)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMoneda(moneda: Moneda)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMonedaTasaHistorial(historial: MonedaTasaHistorial)

    @Update
    suspend fun updateMonedaTasa(tasa: MonedaTasa)

    @Delete
    suspend fun deleteMoneda(moneda: Moneda)

    @Delete
    suspend fun deleteMonedaTasa(tasa: MonedaTasa)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWallet(wallet: Wallet2)

    @Update
    suspend fun updateWallet(wallet: Wallet2)

    @Delete
    suspend fun deleteWallet(wallet: Wallet2)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMovimiento(movimiento: WalletMovimiento)

    @Query("UPDATE wallet_movimientos SET nota = :nota WHERE id = :movId")
    suspend fun updateMovimientoNota(movId: String, nota: String)

    @Query("DELETE FROM wallet_movimientos WHERE id = :movId")
    suspend fun deleteMovimiento(movId: String)

    @Transaction
    suspend fun insertMonedaCompleta(moneda: Moneda, tasa: MonedaTasa, historial: MonedaTasaHistorial) {
        insertMonedaTasa(tasa)
        insertMoneda(moneda)
        insertMonedaTasaHistorial(historial)
    }

    @Transaction
    suspend fun deleteMonedaCompleta(moneda: Moneda) {
        deleteMoneda(moneda)
    }
}
