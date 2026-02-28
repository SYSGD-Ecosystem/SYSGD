package cu.lazaroysr96.sysgdcont.data.dao

import androidx.room.*
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.model.Venta
import kotlinx.coroutines.flow.Flow

@Dao
interface ProductoDao {
    @Query("SELECT * FROM productos WHERE activo = 1 ORDER BY nombre ASC")
    fun getAllActivos(): Flow<List<Producto>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(producto: Producto)

    @Update
    suspend fun update(producto: Producto)

    @Query("UPDATE productos SET activo = 0 WHERE id = :id")
    suspend fun deactivate(id: String)
}

@Dao
interface VentaDao {
    @Query("SELECT * FROM ventas WHERE fecha = :fecha AND anulada = 0 ORDER BY hora DESC")
    fun getVentasDelDia(fecha: String): Flow<List<Venta>>

    @Query("SELECT SUM(total) FROM ventas WHERE fecha = :fecha AND anulada = 0")
    fun getTotalDia(fecha: String): Flow<Double?>

    @Query("SELECT SUM(total) FROM ventas WHERE fecha LIKE :mes || '%' AND anulada = 0")
    suspend fun getTotalMes(mes: String): Double?

    @Insert
    suspend fun insertVenta(venta: Venta)

    @Insert
    suspend fun insertLineas(lineas: List<LineaVenta>)

    @Query("UPDATE ventas SET anulada = 1 WHERE id = :ventaId")
    suspend fun anularVenta(ventaId: String)

    @Transaction
    @Query("SELECT * FROM ventas WHERE fecha = :fecha AND anulada = 0 ORDER BY hora DESC")
    fun getVentasConLineasDelDia(fecha: String): Flow<List<Venta>>

    @Query("SELECT * FROM lineas_venta WHERE ventaId = :ventaId")
    suspend fun getLineasDeVenta(ventaId: String): List<LineaVenta>

    @Transaction
    suspend fun insertVentaCompleta(venta: Venta, lineas: List<LineaVenta>) {
        insertVenta(venta)
        insertLineas(lineas)
    }
}
