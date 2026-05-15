package cu.lazaroysr96.sysgdcont.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import cu.lazaroysr96.sysgdcont.data.model.CuentaContable
import cu.lazaroysr96.sysgdcont.data.model.IngresoGastoCuenta
import cu.lazaroysr96.sysgdcont.data.model.IngresoGastoNota
import cu.lazaroysr96.sysgdcont.data.model.PosIntegrationConfig
import cu.lazaroysr96.sysgdcont.data.model.TributoConfig
import cu.lazaroysr96.sysgdcont.data.model.TributoCuentaBase
import kotlinx.coroutines.flow.Flow

@Dao
interface CuentaContableDao {
    @Query("SELECT * FROM catalogo_cuentas WHERE activo = 1 ORDER BY codigo ASC, nombre ASC")
    fun observeActivas(): Flow<List<CuentaContable>>

    @Query("SELECT * FROM catalogo_cuentas WHERE activo = 1 ORDER BY codigo ASC, nombre ASC")
    suspend fun getActivas(): List<CuentaContable>

    @Query(
            """
        SELECT * FROM catalogo_cuentas
        WHERE activo = 1 AND tipo = :tipo AND naturaleza = :naturaleza
        ORDER BY codigo ASC, nombre ASC
        """
    )
    fun observeByTipoNaturaleza(tipo: String, naturaleza: String): Flow<List<CuentaContable>>

    @Query(
            """
        SELECT * FROM catalogo_cuentas
        WHERE activo = 1 AND tipo = :tipo OR tipo = 'MIXTO'
        ORDER BY codigo ASC, nombre ASC
        """
    )
    fun observeByTipoCuenta(tipo: String): Flow<List<CuentaContable>>

    @Query("SELECT * FROM catalogo_cuentas WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): CuentaContable?

    @Query("SELECT * FROM catalogo_cuentas WHERE codigo = :codigo LIMIT 1")
    suspend fun getByCodigo(codigo: String): CuentaContable?

    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(cuenta: CuentaContable)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(cuentas: List<CuentaContable>)

    @Query("DELETE FROM catalogo_cuentas") suspend fun deleteAll()
}

@Dao
interface IngresoGastoCuentaDao {
    @Query("SELECT * FROM ingreso_gasto_cuenta") fun observeAll(): Flow<List<IngresoGastoCuenta>>

    @Query("SELECT * FROM ingreso_gasto_cuenta") suspend fun getAll(): List<IngresoGastoCuenta>

    @Query("SELECT * FROM ingreso_gasto_cuenta WHERE ingresoGastoId = :entryId LIMIT 1")
    suspend fun getByEntryId(entryId: String): IngresoGastoCuenta?

    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(link: IngresoGastoCuenta)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(links: List<IngresoGastoCuenta>)

    @Query("DELETE FROM ingreso_gasto_cuenta WHERE ingresoGastoId = :entryId")
    suspend fun deleteByEntryId(entryId: String)

    @Query("DELETE FROM ingreso_gasto_cuenta") suspend fun deleteAll()
}

@Dao
interface IngresoGastoNotaDao {
    @Query("SELECT * FROM ingreso_gasto_nota") fun observeAll(): Flow<List<IngresoGastoNota>>

    @Query("SELECT * FROM ingreso_gasto_nota") suspend fun getAll(): List<IngresoGastoNota>

    @Query("SELECT * FROM ingreso_gasto_nota WHERE ingresoGastoId = :entryId LIMIT 1")
    suspend fun getByEntryId(entryId: String): IngresoGastoNota?

    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(nota: IngresoGastoNota)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(notas: List<IngresoGastoNota>)

    @Query("DELETE FROM ingreso_gasto_nota WHERE ingresoGastoId = :entryId")
    suspend fun deleteByEntryId(entryId: String)

    @Query("DELETE FROM ingreso_gasto_nota") suspend fun deleteAll()
}

@Dao
interface PosIntegrationConfigDao {
    @Query("SELECT * FROM pos_integration_config WHERE id = :id LIMIT 1")
    fun observeById(id: String = PosIntegrationConfig.DEFAULT_ID): Flow<PosIntegrationConfig?>

    @Query("SELECT * FROM pos_integration_config WHERE id = :id LIMIT 1")
    suspend fun getById(id: String = PosIntegrationConfig.DEFAULT_ID): PosIntegrationConfig?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(config: PosIntegrationConfig)

    @Query("DELETE FROM pos_integration_config") suspend fun deleteAll()
}

@Dao
interface TributoConfigDao {
    @Query("SELECT * FROM tributo_config ORDER BY orden ASC, nombre ASC")
    fun observeAll(): Flow<List<TributoConfig>>

    @Query("SELECT * FROM tributo_config ORDER BY orden ASC, nombre ASC")
    suspend fun getAll(): List<TributoConfig>

    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(config: TributoConfig)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(configs: List<TributoConfig>)

    @Query("DELETE FROM tributo_config") suspend fun deleteAll()
}

@Dao
interface TributoCuentaBaseDao {
    @Query("SELECT * FROM tributo_cuenta_base") fun observeAll(): Flow<List<TributoCuentaBase>>

    @Query("SELECT * FROM tributo_cuenta_base") suspend fun getAll(): List<TributoCuentaBase>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(relaciones: List<TributoCuentaBase>)

    @Query("DELETE FROM tributo_cuenta_base WHERE tributoKey = :tributoKey")
    suspend fun deleteByTributoKey(tributoKey: String)

    @Query("DELETE FROM tributo_cuenta_base") suspend fun deleteAll()
}
