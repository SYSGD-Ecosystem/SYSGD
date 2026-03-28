package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import cu.lazaroysr96.sysgdcont.data.dao.ProductoDao
import cu.lazaroysr96.sysgdcont.data.dao.VentaDao
import cu.lazaroysr96.sysgdcont.data.dao.ProductoCompraDao
import cu.lazaroysr96.sysgdcont.data.dao.CompraDao
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.model.Venta
import cu.lazaroysr96.sysgdcont.data.model.ProductoCompra
import cu.lazaroysr96.sysgdcont.data.model.Compra
import cu.lazaroysr96.sysgdcont.data.model.LineaCompra
import cu.lazaroysr96.sysgdcont.data.model.InventarioRegistro
import cu.lazaroysr96.sysgdcont.data.model.ProductoInventario
import cu.lazaroysr96.sysgdcont.data.model.OperacionInventario
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

private val Context.inventarioDataStore: DataStore<Preferences> by preferencesDataStore(name = "inventario_prefs")

@Singleton
class InventarioRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val productoDao: ProductoDao,
    private val ventaDao: VentaDao,
    private val productoCompraDao: ProductoCompraDao,
    private val compraDao: CompraDao
) {
    companion object {
        private val INVENTARIO_LOCAL_MODIFIED_KEY = stringPreferencesKey("inventario_local_modified")
    }

    private fun hoy(): String = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)

    val localModified: Flow<Boolean> = context.inventarioDataStore.data.map { prefs ->
        prefs[INVENTARIO_LOCAL_MODIFIED_KEY] == "true"
    }

    private suspend fun markLocalModified() {
        context.inventarioDataStore.edit { prefs ->
            prefs[INVENTARIO_LOCAL_MODIFIED_KEY] = "true"
        }
    }

    suspend fun clearLocalModified() {
        context.inventarioDataStore.edit { prefs ->
            prefs[INVENTARIO_LOCAL_MODIFIED_KEY] = "false"
        }
    }

    fun getProductos(): Flow<List<Producto>> = productoDao.getAllActivos()

    suspend fun agregarProducto(
        nombre: String,
        precio: Double,
        emoji: String,
        unidad: String
    ) {
        productoDao.insert(
            Producto(
                id = UUID.randomUUID().toString(),
                nombre = nombre.trim(),
                precio = precio,
                emoji = emoji,
                unidad = unidad
            )
        )
        markLocalModified()
    }

    suspend fun eliminarProducto(id: String) {
        productoDao.deactivate(id)
        markLocalModified()
    }

    fun getVentasDelDia(fecha: String = hoy()): Flow<List<Venta>> =
        ventaDao.getVentasDelDia(fecha)

    fun getVentasConLineasDelDia(fecha: String = hoy()): Flow<List<Pair<Venta, List<LineaVenta>>>> =
        ventaDao.getVentasConLineasDelDia(fecha).map { ventas ->
            ventas.map { venta ->
                venta to ventaDao.getLineasDeVenta(venta.id)
            }
        }

    fun getTotalDia(fecha: String = hoy()): Flow<Double?> =
        ventaDao.getTotalDia(fecha)

    suspend fun getTotalMes(mes: String): Double? =
        ventaDao.getTotalMes(mes)

    suspend fun getVentasConLineasDelMes(mes: String): Map<String, List<Pair<Venta, List<LineaVenta>>>> {
        val dias = ventaDao.getDiasConVentas(mes)
        val result = mutableMapOf<String, List<Pair<Venta, List<LineaVenta>>>>()
        
        for (dia in dias) {
            val ventas = ventaDao.getVentasDelDia(dia).first()
            val ventasConLineas = ventas.map { venta ->
                venta to ventaDao.getLineasDeVenta(venta.id)
            }
            result[dia] = ventasConLineas
        }
        
        return result
    }

    suspend fun getResumenMensual(mes: String): Pair<Int, Double> {
        val dias = ventaDao.getDiasConVentas(mes)
        var total = 0.0
        for (dia in dias) {
            total += ventaDao.getTotalDia(dia).first() ?: 0.0
        }
        return dias.size to total
    }

    suspend fun registrarVenta(lineasCarrito: Map<Producto, Double>, fechaTrabajo: String = hoy()) {
        require(lineasCarrito.isNotEmpty())

        val ventaId = UUID.randomUUID().toString()
        val now = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"))
        val total = lineasCarrito.entries.sumOf { (p, qty) -> p.precio * qty }

        val venta = Venta(
            id = ventaId,
            fecha = fechaTrabajo,
            hora = now,
            total = total
        )

        val lineas = lineasCarrito.map { (producto, cantidad) ->
            LineaVenta(
                id = UUID.randomUUID().toString(),
                ventaId = ventaId,
                productoId = producto.id,
                nombreProducto = producto.nombre,
                precioUnitario = producto.precio,
                cantidad = cantidad
            )
        }

        ventaDao.insertVentaCompleta(venta, lineas)
        markLocalModified()
    }

    suspend fun anularVenta(ventaId: String) {
        ventaDao.anularVenta(ventaId)
        markLocalModified()
    }

    fun getProductosCompra(): Flow<List<ProductoCompra>> = productoCompraDao.getAllActivos()

    suspend fun agregarProductoCompra(
        nombre: String,
        precio: Double,
        emoji: String,
        unidad: String
    ) {
        productoCompraDao.insert(
            ProductoCompra(
                id = UUID.randomUUID().toString(),
                nombre = nombre.trim(),
                precio = precio,
                emoji = emoji,
                unidad = unidad
            )
        )
        markLocalModified()
    }

    suspend fun eliminarProductoCompra(id: String) {
        productoCompraDao.deactivate(id)
        markLocalModified()
    }

    fun getComprasDelDia(fecha: String = hoy()): Flow<List<Compra>> =
        compraDao.getComprasDelDia(fecha)

    fun getComprasConLineasDelDia(fecha: String = hoy()): Flow<List<Pair<Compra, List<LineaCompra>>>> =
        compraDao.getComprasConLineasDelDia(fecha).map { compras ->
            compras.map { compra ->
                compra to compraDao.getLineasDeCompra(compra.id)
            }
        }

    fun getTotalComprasDia(fecha: String = hoy()): Flow<Double?> =
        compraDao.getTotalDia(fecha)

    suspend fun getTotalComprasMes(mes: String): Double? =
        compraDao.getTotalMes(mes)

    suspend fun getComprasConLineasDelMes(mes: String): Map<String, List<Pair<Compra, List<LineaCompra>>>> {
        val dias = compraDao.getDiasConCompras(mes)
        val result = mutableMapOf<String, List<Pair<Compra, List<LineaCompra>>>>()
        
        for (dia in dias) {
            val compras = compraDao.getComprasDelDia(dia).first()
            val comprasConLineas = compras.map { compra ->
                compra to compraDao.getLineasDeCompra(compra.id)
            }
            result[dia] = comprasConLineas
        }
        
        return result
    }

    suspend fun getResumenComprasMensual(mes: String): Pair<Int, Double> {
        val dias = compraDao.getDiasConCompras(mes)
        var total = 0.0
        for (dia in dias) {
            total += compraDao.getTotalDia(dia).first() ?: 0.0
        }
        return dias.size to total
    }

    suspend fun registrarCompra(lineasCarrito: Map<ProductoCompra, Double>, fechaTrabajo: String = hoy()) {
        require(lineasCarrito.isNotEmpty())

        val compraId = UUID.randomUUID().toString()
        val now = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"))
        val total = lineasCarrito.entries.sumOf { (p, qty) -> p.precio * qty }

        val compra = Compra(
            id = compraId,
            fecha = fechaTrabajo,
            hora = now,
            total = total
        )

        val lineas = lineasCarrito.map { (producto, cantidad) ->
            LineaCompra(
                id = UUID.randomUUID().toString(),
                compraId = compraId,
                productoId = producto.id,
                nombreProducto = producto.nombre,
                precioUnitario = producto.precio,
                cantidad = cantidad
            )
        }

        compraDao.insertCompraCompleta(compra, lineas)
        markLocalModified()
    }

    suspend fun anularCompra(compraId: String) {
        compraDao.anularCompra(compraId)
        markLocalModified()
    }

    suspend fun toInventarioRegistro(): InventarioRegistro {
        val productos = productoDao.getAll()
        val productosVenta = productos.map { p ->
            ProductoInventario(
                id = p.id,
                nombre = p.nombre,
                precio = p.precio,
                unidad = p.unidad,
                tipo = "venta"
            )
        }

        val productosCompra = productoCompraDao.getAll().map { p ->
            ProductoInventario(
                id = p.id,
                nombre = p.nombre,
                precio = p.precio,
                unidad = p.unidad,
                tipo = "compra"
            )
        }

        val todasVentas = ventaDao.getAll()
        val todasLineasVenta = ventaDao.getAllLineas()
        val todasCompras = compraDao.getAll()
        val todasLineasCompra = compraDao.getAllLineas()

        val operacionesVenta = todasVentas.flatMap { venta ->
            val lineas = todasLineasVenta.filter { it.ventaId == venta.id }
            lineas.map { linea ->
                OperacionInventario(
                    id = linea.id,
                    tipo = "venta",
                    fecha = venta.fecha,
                    operacionId = venta.id,
                    hora = venta.hora,
                    anulada = venta.anulada,
                    productoId = linea.productoId,
                    nombreProducto = linea.nombreProducto,
                    unidad = "",
                    cantidad = linea.cantidad,
                    precioUnitario = linea.precioUnitario,
                    total = linea.subtotal
                )
            }
        }

        val operacionesCompra = todasCompras.flatMap { compra ->
            val lineas = todasLineasCompra.filter { it.compraId == compra.id }
            lineas.map { linea ->
                OperacionInventario(
                    id = linea.id,
                    tipo = "compra",
                    fecha = compra.fecha,
                    operacionId = compra.id,
                    hora = compra.hora,
                    anulada = compra.anulada,
                    productoId = linea.productoId,
                    nombreProducto = linea.nombreProducto,
                    unidad = "",
                    cantidad = linea.cantidad,
                    precioUnitario = linea.precioUnitario,
                    total = linea.subtotal
                )
            }
        }

        return InventarioRegistro(
            productosVenta = productosVenta,
            productosCompra = productosCompra,
            operaciones = operacionesVenta + operacionesCompra
        )
    }

    suspend fun fromInventarioRegistro(inventario: InventarioRegistro) {
        ventaDao.deleteAllLineas()
        ventaDao.deleteAllVentas()
        compraDao.deleteAllLineas()
        compraDao.deleteAllCompras()
        productoDao.deleteAll()
        productoCompraDao.deleteAll()

        val productos = inventario.productosVenta.map { p ->
            Producto(
                id = p.id,
                nombre = p.nombre,
                precio = p.precio,
                unidad = p.unidad,
                activo = true
            )
        }
        productoDao.insertAll(productos)

        val productosCompra = inventario.productosCompra.map { p ->
            ProductoCompra(
                id = p.id,
                nombre = p.nombre,
                precio = p.precio,
                unidad = p.unidad,
                activo = true
            )
        }
        productoCompraDao.insertAll(productosCompra)

        data class VentaRestaurada(
            val venta: Venta,
            val lineas: MutableList<LineaVenta>
        )

        data class CompraRestaurada(
            val compra: Compra,
            val lineas: MutableList<LineaCompra>
        )

        val ventasMap = mutableMapOf<String, VentaRestaurada>()
        val comprasMap = mutableMapOf<String, CompraRestaurada>()

        inventario.operaciones.forEach { op ->
            if (op.tipo == "venta") {
                val ventaId = op.operacionId.ifBlank { UUID.randomUUID().toString() }
                val ventaRestaurada = ventasMap.getOrPut(ventaId) {
                    VentaRestaurada(
                        venta = Venta(
                            id = ventaId,
                            fecha = op.fecha,
                            hora = op.hora.ifBlank { "00:00" },
                            total = 0.0,
                            anulada = op.anulada
                        ),
                        lineas = mutableListOf()
                    )
                }
                ventaRestaurada.lineas.add(
                    LineaVenta(
                        id = op.id,
                        ventaId = ventaId,
                        productoId = op.productoId,
                        nombreProducto = op.nombreProducto,
                        precioUnitario = op.precioUnitario,
                        cantidad = op.cantidad
                    )
                )
            } else {
                val compraId = op.operacionId.ifBlank { UUID.randomUUID().toString() }
                val compraRestaurada = comprasMap.getOrPut(compraId) {
                    CompraRestaurada(
                        compra = Compra(
                            id = compraId,
                            fecha = op.fecha,
                            hora = op.hora.ifBlank { "00:00" },
                            total = 0.0,
                            anulada = op.anulada
                        ),
                        lineas = mutableListOf()
                    )
                }
                compraRestaurada.lineas.add(
                    LineaCompra(
                        id = op.id,
                        compraId = compraId,
                        productoId = op.productoId,
                        nombreProducto = op.nombreProducto,
                        precioUnitario = op.precioUnitario,
                        cantidad = op.cantidad
                    )
                )
            }
        }

        val ventasRestauradas = ventasMap.values.map { restaurada ->
            val total = restaurada.lineas.sumOf { it.subtotal }
            restaurada.venta.copy(total = total) to restaurada.lineas
        }

        ventasRestauradas.forEach { (venta, lineas) ->
            ventaDao.insertVenta(venta)
            ventaDao.insertLineas(lineas)
        }

        val comprasRestauradas = comprasMap.values.map { restaurada ->
            val total = restaurada.lineas.sumOf { it.subtotal }
            restaurada.compra.copy(total = total) to restaurada.lineas
        }

        comprasRestauradas.forEach { (compra, lineas) ->
            compraDao.insertCompra(compra)
            compraDao.insertLineas(lineas)
        }

        clearLocalModified()
    }
}
