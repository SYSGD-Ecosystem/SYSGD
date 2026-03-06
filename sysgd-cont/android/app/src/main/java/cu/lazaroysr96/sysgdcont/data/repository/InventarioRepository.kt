package cu.lazaroysr96.sysgdcont.data.repository

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
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InventarioRepository @Inject constructor(
    private val productoDao: ProductoDao,
    private val ventaDao: VentaDao,
    private val productoCompraDao: ProductoCompraDao,
    private val compraDao: CompraDao
) {
    private fun hoy(): String = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)

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
    }

    suspend fun eliminarProducto(id: String) = productoDao.deactivate(id)

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

    suspend fun registrarVenta(lineasCarrito: Map<Producto, Int>, fechaTrabajo: String = hoy()) {
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
    }

    suspend fun anularVenta(ventaId: String) {
        ventaDao.anularVenta(ventaId)
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
    }

    suspend fun eliminarProductoCompra(id: String) = productoCompraDao.deactivate(id)

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

    suspend fun registrarCompra(lineasCarrito: Map<ProductoCompra, Int>, fechaTrabajo: String = hoy()) {
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
    }

    suspend fun anularCompra(compraId: String) {
        compraDao.anularCompra(compraId)
    }
}
