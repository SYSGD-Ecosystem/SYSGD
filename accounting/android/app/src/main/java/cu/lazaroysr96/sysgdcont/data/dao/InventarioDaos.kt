package cu.lazaroysr96.sysgdcont.data.dao

import androidx.room.*
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.model.Venta
import cu.lazaroysr96.sysgdcont.data.model.ProductoCompra
import cu.lazaroysr96.sysgdcont.data.model.Compra
import cu.lazaroysr96.sysgdcont.data.model.LineaCompra
import kotlinx.coroutines.flow.Flow

@Dao
interface ProductoDao {
    @Query("SELECT * FROM productos WHERE activo = 1 ORDER BY nombre ASC")
    fun getAllActivos(): Flow<List<Producto>>

    @Query("SELECT * FROM productos ORDER BY nombre ASC")
    suspend fun getAll(): List<Producto>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(producto: Producto)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(productos: List<Producto>)

    @Update
    suspend fun update(producto: Producto)

    @Query("UPDATE productos SET activo = 0 WHERE id = :id")
    suspend fun deactivate(id: String)

    @Query("UPDATE productos SET activo = 1 WHERE id = :id")
    suspend fun activate(id: String)

    @Query("DELETE FROM productos")
    suspend fun deleteAll()
}

@Dao
interface VentaDao {
    @Query("SELECT * FROM ventas WHERE fecha = :fecha AND anulada = 0 ORDER BY hora DESC")
    fun getVentasDelDia(fecha: String): Flow<List<Venta>>

    @Query("SELECT SUM(total) FROM ventas WHERE fecha = :fecha AND anulada = 0")
    fun getTotalDia(fecha: String): Flow<Double?>

    @Query("SELECT SUM(total) FROM ventas WHERE fecha LIKE :mes || '%' AND anulada = 0")
    suspend fun getTotalMes(mes: String): Double?

    @Query("SELECT DISTINCT fecha FROM ventas WHERE fecha LIKE :mes || '%' AND anulada = 0 ORDER BY fecha DESC")
    suspend fun getDiasConVentas(mes: String): List<String>

    @Query("SELECT * FROM ventas ORDER BY fecha DESC, hora DESC")
    suspend fun getAll(): List<Venta>

    @Query("SELECT * FROM lineas_venta ORDER BY ventaId")
    suspend fun getAllLineas(): List<LineaVenta>

    @Insert
    suspend fun insertVenta(venta: Venta)

    @Insert
    suspend fun insertLineas(lineas: List<LineaVenta>)

    @Insert
    suspend fun insertVentas(ventas: List<Venta>)

    @Insert
    suspend fun insertAllLineas(lineas: List<LineaVenta>)

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

    @Query("DELETE FROM lineas_venta")
    suspend fun deleteAllLineas()

    @Query("DELETE FROM ventas")
    suspend fun deleteAllVentas()
}

@Dao
interface ProductoCompraDao {
    @Query("SELECT * FROM productos_compra WHERE activo = 1 ORDER BY nombre ASC")
    fun getAllActivos(): Flow<List<ProductoCompra>>

    @Query("SELECT * FROM productos_compra ORDER BY nombre ASC")
    suspend fun getAll(): List<ProductoCompra>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(producto: ProductoCompra)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(productos: List<ProductoCompra>)

    @Update
    suspend fun update(producto: ProductoCompra)

    @Query("UPDATE productos_compra SET activo = 0 WHERE id = :id")
    suspend fun deactivate(id: String)

    @Query("UPDATE productos_compra SET activo = 1 WHERE id = :id")
    suspend fun activate(id: String)

    @Query("DELETE FROM productos_compra")
    suspend fun deleteAll()
}

@Dao
interface CompraDao {
    @Query("SELECT * FROM compras WHERE fecha = :fecha AND anulada = 0 ORDER BY hora DESC")
    fun getComprasDelDia(fecha: String): Flow<List<Compra>>

    @Query("SELECT SUM(total) FROM compras WHERE fecha = :fecha AND anulada = 0")
    fun getTotalDia(fecha: String): Flow<Double?>

    @Query("SELECT SUM(total) FROM compras WHERE fecha LIKE :mes || '%' AND anulada = 0")
    suspend fun getTotalMes(mes: String): Double?

    @Query("SELECT DISTINCT fecha FROM compras WHERE fecha LIKE :mes || '%' AND anulada = 0 ORDER BY fecha DESC")
    suspend fun getDiasConCompras(mes: String): List<String>

    @Query("SELECT * FROM compras ORDER BY fecha DESC, hora DESC")
    suspend fun getAll(): List<Compra>

    @Query("SELECT * FROM lineas_compra ORDER BY compraId")
    suspend fun getAllLineas(): List<LineaCompra>

    @Insert
    suspend fun insertCompra(compra: Compra)

    @Insert
    suspend fun insertLineas(lineas: List<LineaCompra>)

    @Insert
    suspend fun insertCompras(compras: List<Compra>)

    @Insert
    suspend fun insertAllLineas(lineas: List<LineaCompra>)

    @Query("UPDATE compras SET anulada = 1 WHERE id = :compraId")
    suspend fun anularCompra(compraId: String)

    @Transaction
    @Query("SELECT * FROM compras WHERE fecha = :fecha AND anulada = 0 ORDER BY hora DESC")
    fun getComprasConLineasDelDia(fecha: String): Flow<List<Compra>>

    @Query("SELECT * FROM lineas_compra WHERE compraId = :compraId")
    suspend fun getLineasDeCompra(compraId: String): List<LineaCompra>

    @Transaction
    suspend fun insertCompraCompleta(compra: Compra, lineas: List<LineaCompra>) {
        insertCompra(compra)
        insertLineas(lineas)
    }

    @Query("DELETE FROM lineas_compra")
    suspend fun deleteAllLineas()

    @Query("DELETE FROM compras")
    suspend fun deleteAllCompras()
}
