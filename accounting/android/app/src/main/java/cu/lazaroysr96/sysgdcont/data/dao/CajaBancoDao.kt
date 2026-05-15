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

    @Query("SELECT * FROM monedas ORDER BY CASE WHEN tipo = 'CUP' THEN 0 ELSE 1 END, tipo ASC")
    suspend fun getMonedasList(): List<Moneda>

    @Query("SELECT * FROM moneda_tasas ORDER BY nombre ASC")
    fun getMonedaTasas(): Flow<List<MonedaTasa>>

    @Query("SELECT * FROM moneda_tasas ORDER BY nombre ASC")
    suspend fun getMonedaTasasList(): List<MonedaTasa>

    @Query("SELECT * FROM moneda_tasa_historial ORDER BY createdAt DESC")
    fun getMonedaTasaHistorial(): Flow<List<MonedaTasaHistorial>>

    @Query("SELECT * FROM moneda_tasa_historial ORDER BY createdAt DESC")
    suspend fun getMonedaTasaHistorialList(): List<MonedaTasaHistorial>

    @Query("SELECT * FROM wallets ORDER BY activo DESC, createdAt ASC, nombre ASC")
    fun getWallets(): Flow<List<Wallet2>>

    @Query("SELECT * FROM wallets ORDER BY activo DESC, createdAt ASC, nombre ASC")
    suspend fun getWalletsList(): List<Wallet2>

    @Query("SELECT * FROM wallet_movimientos ORDER BY fecha DESC, createdAt DESC")
    fun getMovimientos(): Flow<List<WalletMovimiento>>

    @Query("SELECT * FROM wallet_movimientos ORDER BY fecha DESC, createdAt DESC")
    suspend fun getMovimientosList(): List<WalletMovimiento>

    @Query("SELECT * FROM monedas WHERE tipo = :tipo LIMIT 1")
    suspend fun getMonedaByTipo(tipo: String): Moneda?

    @Query("SELECT COUNT(*) FROM monedas")
    suspend fun countMonedas(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMonedaTasa(tasa: MonedaTasa)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMonedaTasas(tasas: List<MonedaTasa>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMoneda(moneda: Moneda)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMonedas(monedas: List<Moneda>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMonedaTasaHistorial(historial: MonedaTasaHistorial)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMonedaTasaHistorial(historial: List<MonedaTasaHistorial>)

    @Update
    suspend fun updateMonedaTasa(tasa: MonedaTasa)

    @Delete
    suspend fun deleteMoneda(moneda: Moneda)

    @Delete
    suspend fun deleteMonedaTasa(tasa: MonedaTasa)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWallet(wallet: Wallet2)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWallets(wallets: List<Wallet2>)

    @Update
    suspend fun updateWallet(wallet: Wallet2)

    @Delete
    suspend fun deleteWallet(wallet: Wallet2)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMovimiento(movimiento: WalletMovimiento)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMovimientos(movimientos: List<WalletMovimiento>)

    @Query("UPDATE wallet_movimientos SET nota = :nota WHERE id = :movId")
    suspend fun updateMovimientoNota(movId: String, nota: String)

    @Query("DELETE FROM wallet_movimientos WHERE id = :movId")
    suspend fun deleteMovimiento(movId: String)

    @Query("DELETE FROM wallet_movimientos")
    suspend fun deleteMovimientos()

    @Query("DELETE FROM wallets")
    suspend fun deleteWallets()

    @Query("DELETE FROM moneda_tasa_historial")
    suspend fun deleteMonedaTasaHistorial()

    @Query("DELETE FROM monedas")
    suspend fun deleteMonedas()

    @Query("DELETE FROM moneda_tasas")
    suspend fun deleteMonedaTasas()

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
