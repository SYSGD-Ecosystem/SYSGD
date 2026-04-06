package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import cu.lazaroysr96.sysgdcont.data.dao.AlmacenDao
import cu.lazaroysr96.sysgdcont.data.dao.CatalogoCompraDao
import cu.lazaroysr96.sysgdcont.data.dao.CatalogoVentaDao
import cu.lazaroysr96.sysgdcont.data.dao.CompraDao
import cu.lazaroysr96.sysgdcont.data.dao.ItemInventarioDao
import cu.lazaroysr96.sysgdcont.data.dao.ProductoDao
import cu.lazaroysr96.sysgdcont.data.dao.VentaDao
import cu.lazaroysr96.sysgdcont.data.model.Almacen
import cu.lazaroysr96.sysgdcont.data.model.AlmacenRegistro
import cu.lazaroysr96.sysgdcont.data.model.CatalogoCompra
import cu.lazaroysr96.sysgdcont.data.model.CatalogoCompraRegistro
import cu.lazaroysr96.sysgdcont.data.model.CatalogoVenta
import cu.lazaroysr96.sysgdcont.data.model.CatalogoVentaRegistro
import cu.lazaroysr96.sysgdcont.data.model.Compra
import cu.lazaroysr96.sysgdcont.data.model.InventarioRegistro
import cu.lazaroysr96.sysgdcont.data.model.ItemInventario
import cu.lazaroysr96.sysgdcont.data.model.LineaCompra
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.ModoStock
import cu.lazaroysr96.sysgdcont.data.model.OperacionInventario
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.model.ProductoCompra
import cu.lazaroysr96.sysgdcont.data.model.ProductoInventario
import cu.lazaroysr96.sysgdcont.data.model.ProductoVenta
import cu.lazaroysr96.sysgdcont.data.model.StockRegistro
import cu.lazaroysr96.sysgdcont.data.model.TipoProductoInv
import cu.lazaroysr96.sysgdcont.data.model.Venta
import dagger.hilt.android.qualifiers.ApplicationContext
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.inventarioDataStore: DataStore<Preferences> by preferencesDataStore(name = "inventario_prefs")

@Singleton
class InventarioRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val productoDao: ProductoDao,
    private val catalogoVentaDao: CatalogoVentaDao,
    private val catalogoCompraDao: CatalogoCompraDao,
    private val ventaDao: VentaDao,
    private val compraDao: CompraDao,
    private val itemInventarioDao: ItemInventarioDao,
    private val almacenDao: AlmacenDao,
) {
    companion object {
        private val INVENTARIO_LOCAL_MODIFIED_KEY = stringPreferencesKey("inventario_local_modified")
    }

    private fun hoy(): String = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)

    private suspend fun ensureDefaultAlmacen(): Almacen {
        val existente = almacenDao.getPrincipal()
        if (existente != null) return existente
        val almacen = Almacen(
            id = Almacen.DEFAULT_ID,
            nombre = "Almacén principal",
            principal = true
        )
        almacenDao.insert(almacen)
        return almacen
    }

    private suspend fun upsertProductoBase(
        nombre: String,
        emoji: String,
        unidad: String
    ): Producto {
        val existente = productoDao.getByNombre(nombre.trim())
        val producto = if (existente != null) {
            existente.copy(
                emoji = emoji,
                unidad = unidad,
                activo = true
            )
        } else {
            Producto(
                id = UUID.randomUUID().toString(),
                nombre = nombre.trim(),
                emoji = emoji,
                unidad = unidad,
                activo = true
            )
        }
        productoDao.insert(producto)
        return producto
    }

    private suspend fun upsertCatalogoVenta(
        productoId: String,
        precio: Double,
        almacenId: String
    ): CatalogoVenta {
        val existente = catalogoVentaDao.getByProductoId(productoId, almacenId)
        val catalogo = if (existente != null) {
            existente.copy(precioReferencia = precio, activo = true)
        } else {
            CatalogoVenta(
                id = "venta_${almacenId}_$productoId",
                productoId = productoId,
                precioReferencia = precio,
                almacenId = almacenId,
                activo = true
            )
        }
        catalogoVentaDao.insert(catalogo)
        return catalogo
    }

    private suspend fun upsertCatalogoCompra(
        productoId: String,
        precio: Double,
        almacenId: String
    ): CatalogoCompra {
        val existente = catalogoCompraDao.getByProductoId(productoId, almacenId)
        val catalogo = if (existente != null) {
            existente.copy(precioReferencia = precio, activo = true)
        } else {
            CatalogoCompra(
                id = "compra_${almacenId}_$productoId",
                productoId = productoId,
                precioReferencia = precio,
                almacenDestinoId = almacenId,
                activo = true
            )
        }
        catalogoCompraDao.insert(catalogo)
        return catalogo
    }

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

    fun getProductos(): Flow<List<ProductoVenta>> = catalogoVentaDao.getAllActivos()

    suspend fun agregarProducto(
        nombre: String,
        precio: Double,
        emoji: String,
        unidad: String
    ) {
        val almacen = ensureDefaultAlmacen()
        val producto = upsertProductoBase(nombre, emoji, unidad)
        upsertCatalogoVenta(producto.id, precio, almacen.id)
        ensureItemInventario(producto.id, TipoProductoInv.VENTA, almacen.id)
        markLocalModified()
    }

    suspend fun eliminarProducto(id: String) {
        catalogoVentaDao.deactivateByProductoId(id)
        markLocalModified()
    }

    fun getVentasDelDia(fecha: String = hoy()): Flow<List<Venta>> =
        ventaDao.getVentasDelDia(fecha)

    fun getVentasConLineasDelDia(fecha: String = hoy()): Flow<List<Pair<Venta, List<LineaVenta>>>> =
        ventaDao.getVentasConLineasDelDia(fecha).map { ventas ->
            ventas.map { venta -> venta to ventaDao.getLineasDeVenta(venta.id) }
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
            result[dia] = ventas.map { venta -> venta to ventaDao.getLineasDeVenta(venta.id) }
        }
        return result
    }

    suspend fun getVentasConLineasEnRango(desde: String, hasta: String): List<Pair<Venta, List<LineaVenta>>> {
        val ventas = ventaDao.getVentasEnRango(desde, hasta)
        return ventas.map { venta -> venta to ventaDao.getLineasDeVenta(venta.id) }
    }

    suspend fun getResumenMensual(mes: String): Pair<Int, Double> {
        val dias = ventaDao.getDiasConVentas(mes)
        var total = 0.0
        for (dia in dias) {
            total += ventaDao.getTotalDia(dia).first() ?: 0.0
        }
        return dias.size to total
    }

    suspend fun registrarVenta(lineasCarrito: Map<ProductoVenta, Double>, fechaTrabajo: String = hoy()) {
        require(lineasCarrito.isNotEmpty())

        for ((producto, cantidad) in lineasCarrito) {
            val itemInventario = ensureItemInventario(producto.id, TipoProductoInv.VENTA, producto.almacenId)
            if (itemInventario.modoStock != ModoStock.ILIMITADO.name && itemInventario.stockDisponible < cantidad) {
                throw IllegalStateException("Stock insuficiente para ${producto.nombre}. Disponible: ${itemInventario.stockDisponible}")
            }
        }

        val ventaId = UUID.randomUUID().toString()
        val hora = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"))
        val total = lineasCarrito.entries.sumOf { (p, qty) -> p.precio * qty }
        val almacenOrigen = lineasCarrito.keys.firstOrNull()?.almacenId ?: Almacen.DEFAULT_ID

        val venta = Venta(
            id = ventaId,
            fecha = fechaTrabajo,
            hora = hora,
            total = total,
            almacenOrigenId = almacenOrigen
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

        for ((producto, cantidad) in lineasCarrito) {
            val itemInventario = ensureItemInventario(producto.id, TipoProductoInv.VENTA, producto.almacenId)
            if (itemInventario.modoStock != ModoStock.ILIMITADO.name) {
                itemInventarioDao.descontarStockPorId(itemInventario.id, cantidad, fechaTrabajo)
            }
        }

        markLocalModified()
    }

    suspend fun anularVenta(ventaId: String) {
        ventaDao.anularVenta(ventaId)
        markLocalModified()
    }

    fun getProductosCompra(): Flow<List<ProductoCompra>> = catalogoCompraDao.getAllActivos()

    suspend fun agregarProductoCompra(
        nombre: String,
        precio: Double,
        emoji: String,
        unidad: String
    ) {
        val almacen = ensureDefaultAlmacen()
        val producto = upsertProductoBase(nombre, emoji, unidad)
        upsertCatalogoCompra(producto.id, precio, almacen.id)
        ensureItemInventario(producto.id, TipoProductoInv.COMPRA, almacen.id)
        markLocalModified()
    }

    suspend fun eliminarProductoCompra(id: String) {
        catalogoCompraDao.deactivateByProductoId(id)
        markLocalModified()
    }

    fun getComprasDelDia(fecha: String = hoy()): Flow<List<Compra>> =
        compraDao.getComprasDelDia(fecha)

    fun getComprasConLineasDelDia(fecha: String = hoy()): Flow<List<Pair<Compra, List<LineaCompra>>>> =
        compraDao.getComprasConLineasDelDia(fecha).map { compras ->
            compras.map { compra -> compra to compraDao.getLineasDeCompra(compra.id) }
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
            result[dia] = compras.map { compra -> compra to compraDao.getLineasDeCompra(compra.id) }
        }
        return result
    }

    suspend fun getComprasConLineasEnRango(desde: String, hasta: String): List<Pair<Compra, List<LineaCompra>>> {
        val compras = compraDao.getComprasEnRango(desde, hasta)
        return compras.map { compra -> compra to compraDao.getLineasDeCompra(compra.id) }
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
        val hora = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"))
        val total = lineasCarrito.entries.sumOf { (p, qty) -> p.precio * qty }
        val almacenDestino = lineasCarrito.keys.firstOrNull()?.almacenDestinoId ?: ensureDefaultAlmacen().id

        val compra = Compra(
            id = compraId,
            fecha = fechaTrabajo,
            hora = hora,
            total = total,
            almacenDestinoId = almacenDestino
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

        for ((producto, cantidad) in lineasCarrito) {
            ensureItemInventario(producto.id, TipoProductoInv.COMPRA, producto.almacenDestinoId)
            itemInventarioDao.sumarStock(producto.id, producto.almacenDestinoId, cantidad, fechaTrabajo)
        }

        markLocalModified()
    }

    suspend fun anularCompra(compraId: String) {
        compraDao.anularCompra(compraId)
        markLocalModified()
    }

    suspend fun toInventarioRegistro(): InventarioRegistro {
        val productos = productoDao.getAll()
        val catalogoVentas = catalogoVentaDao.getAll()
        val catalogoCompras = catalogoCompraDao.getAll()
        val almacenes = almacenDao.getAllActivos().first()
        val stock = (itemInventarioDao.getItemsVenta().first() + itemInventarioDao.getItemsCompra().first()).distinctBy { it.id }
        val ventas = ventaDao.getAll()
        val lineasVenta = ventaDao.getAllLineas()
        val compras = compraDao.getAll()
        val lineasCompra = compraDao.getAllLineas()

        val productosRegistro = productos.map { p ->
            ProductoInventario(
                id = p.id,
                nombre = p.nombre,
                unidad = p.unidad,
                emoji = p.emoji
            )
        }

        val productosVentaLegacy = catalogoVentas.mapNotNull { catalogo ->
            val producto = productos.find { it.id == catalogo.productoId } ?: return@mapNotNull null
            ProductoInventario(
                id = producto.id,
                nombre = producto.nombre,
                unidad = producto.unidad,
                emoji = producto.emoji,
                precio = catalogo.precioReferencia,
                tipo = "venta"
            )
        }

        val productosCompraLegacy = catalogoCompras.mapNotNull { catalogo ->
            val producto = productos.find { it.id == catalogo.productoId } ?: return@mapNotNull null
            ProductoInventario(
                id = producto.id,
                nombre = producto.nombre,
                unidad = producto.unidad,
                emoji = producto.emoji,
                precio = catalogo.precioReferencia,
                tipo = "compra"
            )
        }

        val operacionesVenta = ventas.flatMap { venta ->
            lineasVenta.filter { it.ventaId == venta.id }.map { linea ->
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
                    total = linea.subtotal,
                    almacenId = venta.almacenOrigenId
                )
            }
        }

        val operacionesCompra = compras.flatMap { compra ->
            lineasCompra.filter { it.compraId == compra.id }.map { linea ->
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
                    total = linea.subtotal,
                    almacenId = compra.almacenDestinoId
                )
            }
        }

        return InventarioRegistro(
            productos = productosRegistro,
            catalogoVentas = catalogoVentas.map {
                CatalogoVentaRegistro(
                    id = it.id,
                    productoId = it.productoId,
                    precioReferencia = it.precioReferencia,
                    almacenId = it.almacenId,
                    activo = it.activo
                )
            },
            catalogoCompras = catalogoCompras.map {
                CatalogoCompraRegistro(
                    id = it.id,
                    productoId = it.productoId,
                    precioReferencia = it.precioReferencia,
                    almacenDestinoId = it.almacenDestinoId,
                    activo = it.activo
                )
            },
            almacenes = almacenes.map { AlmacenRegistro(it.id, it.nombre, it.principal) },
            stock = stock.map {
                StockRegistro(
                    id = it.id,
                    productoId = it.productoId,
                    almacenId = it.almacenId,
                    stockDisponible = it.stockDisponible,
                    modoStock = it.modoStock,
                    productosVinculadosIds = it.productosVinculadosIds,
                    ratiosConversion = it.ratiosConversion,
                    ultimaActualizacion = it.ultimaActualizacion,
                    visibleEnVentas = it.visibleEnVentas
                )
            },
            operaciones = operacionesVenta + operacionesCompra,
            productosVenta = productosVentaLegacy,
            productosCompra = productosCompraLegacy
        )
    }

    suspend fun fromInventarioRegistro(inventario: InventarioRegistro) {
        ventaDao.deleteAllLineas()
        ventaDao.deleteAllVentas()
        compraDao.deleteAllLineas()
        compraDao.deleteAllCompras()
        catalogoVentaDao.deleteAll()
        catalogoCompraDao.deleteAll()
        productoDao.deleteAll()
        itemInventarioDao.deleteAll()
        almacenDao.deleteAll()

        val almacenes = inventario.almacenes.ifEmpty {
            listOf(AlmacenRegistro(Almacen.DEFAULT_ID, "Almacén principal", true))
        }
        almacenDao.insertAll(almacenes.map { Almacen(id = it.id, nombre = it.nombre, principal = it.principal) })

        val productosFuente = inventario.productos.ifEmpty {
            (inventario.productosVenta + inventario.productosCompra).distinctBy { it.id }
        }
        val productos = productosFuente.map { p ->
            Producto(
                id = p.id,
                nombre = p.nombre,
                emoji = p.emoji,
                unidad = p.unidad,
                activo = true
            )
        }
        productoDao.insertAll(productos)

        val catalogoVentas = if (inventario.catalogoVentas.isNotEmpty()) {
            inventario.catalogoVentas.map {
                CatalogoVenta(
                    id = it.id,
                    productoId = it.productoId,
                    precioReferencia = it.precioReferencia,
                    almacenId = it.almacenId,
                    activo = it.activo
                )
            }
        } else {
            inventario.productosVenta.map {
                CatalogoVenta(
                    id = "venta_${Almacen.DEFAULT_ID}_${it.id}",
                    productoId = it.id,
                    precioReferencia = it.precio,
                    almacenId = Almacen.DEFAULT_ID,
                    activo = true
                )
            }
        }
        catalogoVentaDao.insertAll(catalogoVentas)

        val catalogoCompras = if (inventario.catalogoCompras.isNotEmpty()) {
            inventario.catalogoCompras.map {
                CatalogoCompra(
                    id = it.id,
                    productoId = it.productoId,
                    precioReferencia = it.precioReferencia,
                    almacenDestinoId = it.almacenDestinoId,
                    activo = it.activo
                )
            }
        } else {
            inventario.productosCompra.map {
                CatalogoCompra(
                    id = "compra_${Almacen.DEFAULT_ID}_${it.id}",
                    productoId = it.id,
                    precioReferencia = it.precio,
                    almacenDestinoId = Almacen.DEFAULT_ID,
                    activo = true
                )
            }
        }
        catalogoCompraDao.insertAll(catalogoCompras)

        val stockFuente = inventario.stock.ifEmpty {
            inventario.productosVenta.map {
                StockRegistro(
                    id = "stock_${Almacen.DEFAULT_ID}_${it.id}",
                    productoId = it.id,
                    almacenId = Almacen.DEFAULT_ID,
                    modoStock = ModoStock.ILIMITADO.name,
                    visibleEnVentas = true
                )
            } + inventario.productosCompra.map {
                StockRegistro(
                    id = "stock_${Almacen.DEFAULT_ID}_${it.id}",
                    productoId = it.id,
                    almacenId = Almacen.DEFAULT_ID,
                    modoStock = ModoStock.MANUAL.name,
                    visibleEnVentas = false
                )
            }
        }
        stockFuente.forEach { item ->
            itemInventarioDao.insert(
                ItemInventario(
                    id = item.id,
                    productoId = item.productoId,
                    almacenId = item.almacenId,
                    tipoProducto = if (item.visibleEnVentas) TipoProductoInv.VENTA.name else TipoProductoInv.COMPRA.name,
                    stockDisponible = item.stockDisponible,
                    modoStock = item.modoStock,
                    productosVinculadosIds = item.productosVinculadosIds,
                    ratiosConversion = item.ratiosConversion,
                    ultimaActualizacion = item.ultimaActualizacion,
                    visibleEnVentas = item.visibleEnVentas
                )
            )
        }

        data class VentaRestaurada(val venta: Venta, val lineas: MutableList<LineaVenta>)
        data class CompraRestaurada(val compra: Compra, val lineas: MutableList<LineaCompra>)

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
                            almacenOrigenId = op.almacenId.ifBlank { Almacen.DEFAULT_ID },
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
                            almacenDestinoId = op.almacenId.ifBlank { Almacen.DEFAULT_ID },
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

        ventasMap.values.forEach { restaurada ->
            val venta = restaurada.venta.copy(total = restaurada.lineas.sumOf { it.subtotal })
            ventaDao.insertVenta(venta)
            ventaDao.insertLineas(restaurada.lineas)
        }

        comprasMap.values.forEach { restaurada ->
            val compra = restaurada.compra.copy(total = restaurada.lineas.sumOf { it.subtotal })
            compraDao.insertCompra(compra)
            compraDao.insertLineas(restaurada.lineas)
        }

        val defaultAlmacen = ensureDefaultAlmacen()
        catalogoVentas.forEach { catalogo ->
            if (itemInventarioDao.getByProductoId(catalogo.productoId, catalogo.almacenId) == null) {
                itemInventarioDao.insert(
                    ItemInventario(
                        id = "stock_${catalogo.almacenId}_${catalogo.productoId}",
                        productoId = catalogo.productoId,
                        almacenId = catalogo.almacenId,
                        tipoProducto = TipoProductoInv.VENTA.name,
                        modoStock = ModoStock.ILIMITADO.name,
                        ultimaActualizacion = LocalDate.now().toString(),
                        visibleEnVentas = true
                    )
                )
            }
        }
        if (almacenDao.getPrincipal() == null) {
            almacenDao.insert(defaultAlmacen)
        }

        clearLocalModified()
    }

    fun getItemsInventarioCompra(): Flow<List<ItemInventario>> =
        itemInventarioDao.getItemsCompra()

    fun getItemsInventarioVenta(): Flow<List<ItemInventario>> =
        itemInventarioDao.getItemsVenta()

    suspend fun ensureItemInventario(productoId: String, tipo: TipoProductoInv): ItemInventario {
        return ensureItemInventario(productoId, tipo, ensureDefaultAlmacen().id)
    }

    suspend fun ensureItemInventario(productoId: String, tipo: TipoProductoInv, almacenId: String): ItemInventario {
        val existing = itemInventarioDao.getByProductoId(productoId, almacenId)
        if (existing != null) return existing
        val nuevo = ItemInventario(
            id = "stock_${almacenId}_$productoId",
            productoId = productoId,
            almacenId = almacenId,
            tipoProducto = tipo.name,
            modoStock = if (tipo == TipoProductoInv.VENTA) ModoStock.ILIMITADO.name else ModoStock.MANUAL.name,
            ultimaActualizacion = LocalDate.now().toString(),
            visibleEnVentas = tipo == TipoProductoInv.VENTA
        )
        itemInventarioDao.insert(nuevo)
        return nuevo
    }

    suspend fun actualizarModoStock(id: String, modo: ModoStock) {
        itemInventarioDao.actualizarModo(id, modo.name, LocalDate.now().toString())
    }

    suspend fun actualizarModoYVinculados(id: String, modo: ModoStock, vinculados: List<String>, ratios: List<Double>) {
        val fecha = LocalDate.now().toString()
        itemInventarioDao.actualizarModoYVinculados(id, modo.name, vinculados.toJsonStringArray(), ratios.toJsonDoubleArray(), fecha)
    }

    suspend fun ajustarStock(id: String, cantidad: Double) {
        itemInventarioDao.actualizarStock(id, cantidad, LocalDate.now().toString())
    }

    suspend fun moverAVentas(
        productoCompraId: String,
        cantidad: Double,
        nombreProductoVenta: String,
        emojiProductoVenta: String,
        precioVenta: Double
    ) {
        val fecha = LocalDate.now().toString()
        val almacen = ensureDefaultAlmacen()
        val itemCompra = itemInventarioDao.getByProductoId(productoCompraId, almacen.id)
            ?: throw IllegalStateException("No existe item en inventario de compras")

        if (itemCompra.modoStock != ModoStock.ILIMITADO.name) {
            val nuevoStock = itemCompra.stockDisponible - cantidad
            if (nuevoStock < 0) throw IllegalStateException("Stock insuficiente en compras")
            itemInventarioDao.actualizarStock(itemCompra.id, nuevoStock, fecha)
        }

        val productoVenta = upsertProductoBase(
            nombre = nombreProductoVenta,
            emoji = emojiProductoVenta,
            unidad = productoDao.getById(productoCompraId)?.unidad ?: "und"
        )
        upsertCatalogoVenta(productoVenta.id, precioVenta, almacen.id)
        itemInventarioDao.insert(
            ItemInventario(
                id = "stock_${almacen.id}_${productoVenta.id}",
                productoId = productoVenta.id,
                almacenId = almacen.id,
                tipoProducto = TipoProductoInv.VENTA.name,
                stockDisponible = cantidad,
                modoStock = ModoStock.MANUAL.name,
                productosVinculadosIds = "[]",
                ratiosConversion = "[]",
                ultimaActualizacion = fecha,
                visibleEnVentas = true
            )
        )
        markLocalModified()
    }

    private fun List<String>.toJsonStringArray() = "[${joinToString(",") { "\"$it\"" }}]"
    private fun List<Double>.toJsonDoubleArray() = "[${joinToString(",")}]"
}
