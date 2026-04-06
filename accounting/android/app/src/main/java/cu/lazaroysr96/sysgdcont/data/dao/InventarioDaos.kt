package cu.lazaroysr96.sysgdcont.data.dao

import androidx.room.*
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Almacen
import cu.lazaroysr96.sysgdcont.data.model.CatalogoCompra
import cu.lazaroysr96.sysgdcont.data.model.CatalogoVenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.model.ProductoVenta
import cu.lazaroysr96.sysgdcont.data.model.Venta
import cu.lazaroysr96.sysgdcont.data.model.ProductoCompra
import cu.lazaroysr96.sysgdcont.data.model.Compra
import cu.lazaroysr96.sysgdcont.data.model.LineaCompra
import cu.lazaroysr96.sysgdcont.data.model.ItemInventario
import kotlinx.coroutines.flow.Flow

@Dao
interface ProductoDao {
    @Query("SELECT * FROM productos ORDER BY nombre ASC")
    suspend fun getAll(): List<Producto>

    @Query("SELECT * FROM productos WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): Producto?

    @Query("SELECT * FROM productos WHERE LOWER(nombre) = LOWER(:nombre) LIMIT 1")
    suspend fun getByNombre(nombre: String): Producto?

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
interface CatalogoVentaDao {
    @Query("""
        SELECT
            p.id AS id,
            cv.id AS catalogoId,
            p.nombre AS nombre,
            cv.precioReferencia AS precio,
            p.emoji AS emoji,
            p.unidad AS unidad,
            cv.almacenId AS almacenId
        FROM catalogo_ventas cv
        INNER JOIN productos p ON p.id = cv.productoId
        WHERE cv.activo = 1 AND p.activo = 1
        ORDER BY p.nombre ASC
    """)
    fun getAllActivos(): Flow<List<ProductoVenta>>

    @Query("SELECT * FROM catalogo_ventas")
    suspend fun getAll(): List<CatalogoVenta>

    @Query("SELECT * FROM catalogo_ventas WHERE productoId = :productoId AND almacenId = :almacenId LIMIT 1")
    suspend fun getByProductoId(productoId: String, almacenId: String): CatalogoVenta?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(catalogo: CatalogoVenta)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(catalogos: List<CatalogoVenta>)

    @Query("UPDATE catalogo_ventas SET activo = 0 WHERE id = :catalogoId")
    suspend fun deactivateById(catalogoId: String)

    @Query("DELETE FROM catalogo_ventas")
    suspend fun deleteAll()
}

@Dao
interface CatalogoCompraDao {
    @Query("""
        SELECT
            p.id AS id,
            cc.id AS catalogoId,
            p.nombre AS nombre,
            cc.precioReferencia AS precio,
            p.emoji AS emoji,
            p.unidad AS unidad,
            p.activo AS activo,
            cc.almacenDestinoId AS almacenDestinoId
        FROM catalogo_compras cc
        INNER JOIN productos p ON p.id = cc.productoId
        WHERE cc.activo = 1 AND p.activo = 1
        ORDER BY p.nombre ASC
    """)
    fun getAllActivos(): Flow<List<ProductoCompra>>

    @Query("SELECT * FROM catalogo_compras")
    suspend fun getAll(): List<CatalogoCompra>

    @Query("SELECT * FROM catalogo_compras WHERE productoId = :productoId AND almacenDestinoId = :almacenId LIMIT 1")
    suspend fun getByProductoId(productoId: String, almacenId: String): CatalogoCompra?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(catalogo: CatalogoCompra)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(catalogos: List<CatalogoCompra>)

    @Query("UPDATE catalogo_compras SET activo = 0 WHERE id = :catalogoId")
    suspend fun deactivateById(catalogoId: String)

    @Query("DELETE FROM catalogo_compras")
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

    @Query("SELECT * FROM ventas WHERE fecha BETWEEN :desde AND :hasta AND anulada = 0 ORDER BY fecha ASC, hora ASC")
    suspend fun getVentasEnRango(desde: String, hasta: String): List<Venta>

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

    @Query("SELECT * FROM compras WHERE fecha BETWEEN :desde AND :hasta AND anulada = 0 ORDER BY fecha ASC, hora ASC")
    suspend fun getComprasEnRango(desde: String, hasta: String): List<Compra>

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


@Dao
interface ItemInventarioDao {

    @Query("SELECT * FROM items_inventario WHERE visibleEnVentas = 0 ORDER BY ultimaActualizacion DESC")
    fun getItemsCompra(): Flow<List<ItemInventario>>

    @Query("SELECT * FROM items_inventario WHERE visibleEnVentas = 1 ORDER BY ultimaActualizacion DESC")
    fun getItemsVenta(): Flow<List<ItemInventario>>

    @Query("SELECT * FROM items_inventario WHERE productoId = :productoId AND almacenId = :almacenId LIMIT 1")
    suspend fun getByProductoId(productoId: String, almacenId: String): ItemInventario?

    @Query("DELETE FROM items_inventario")
    suspend fun deleteAll()

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: ItemInventario)

    @Update
    suspend fun update(item: ItemInventario)

    @Query("UPDATE items_inventario SET stockDisponible = :stock, ultimaActualizacion = :fecha WHERE id = :id")
    suspend fun actualizarStock(id: String, stock: Double, fecha: String)

    @Query("UPDATE items_inventario SET modoStock = :modo, ultimaActualizacion = :fecha WHERE id = :id")
    suspend fun actualizarModo(id: String, modo: String, fecha: String)

    @Query("UPDATE items_inventario SET modoStock = :modo, productosVinculadosIds = :vinculados, ratiosConversion = :ratios, ultimaActualizacion = :fecha WHERE id = :id")
    suspend fun actualizarModoYVinculados(id: String, modo: String, vinculados: String, ratios: String, fecha: String)

    @Query("UPDATE items_inventario SET stockDisponible = stockDisponible + :cantidad, ultimaActualizacion = :fecha WHERE productoId = :productoId AND almacenId = :almacenId")
    suspend fun sumarStock(productoId: String, almacenId: String, cantidad: Double, fecha: String)

    @Query("UPDATE items_inventario SET stockDisponible = stockDisponible - :cantidad, ultimaActualizacion = :fecha WHERE productoId = :productoId AND almacenId = :almacenId")
    suspend fun descontarStock(productoId: String, almacenId: String, cantidad: Double, fecha: String)

    @Query("UPDATE items_inventario SET stockDisponible = stockDisponible - :cantidad, ultimaActualizacion = :fecha WHERE id = :id")
    suspend fun descontarStockPorId(id: String, cantidad: Double, fecha: String)

    @Query("DELETE FROM items_inventario WHERE id = :id")
    suspend fun delete(id: String)
}

@Dao
interface AlmacenDao {
    @Query("SELECT * FROM almacenes WHERE activo = 1 ORDER BY principal DESC, nombre ASC")
    fun getAllActivos(): Flow<List<Almacen>>

    @Query("SELECT * FROM almacenes WHERE principal = 1 LIMIT 1")
    suspend fun getPrincipal(): Almacen?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(almacen: Almacen)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(almacenes: List<Almacen>)

    @Query("DELETE FROM almacenes")
    suspend fun deleteAll()
}
