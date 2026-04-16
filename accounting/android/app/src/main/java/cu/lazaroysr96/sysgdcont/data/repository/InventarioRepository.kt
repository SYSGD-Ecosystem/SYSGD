package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Context
import androidx.room.withTransaction
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
import cu.lazaroysr96.sysgdcont.data.dao.InventarioVinculoDao
import cu.lazaroysr96.sysgdcont.data.dao.ProductoDao
import cu.lazaroysr96.sysgdcont.data.dao.VentaDao
import cu.lazaroysr96.sysgdcont.data.AppDatabase
import cu.lazaroysr96.sysgdcont.data.model.Almacen
import cu.lazaroysr96.sysgdcont.data.model.AlmacenRegistro
import cu.lazaroysr96.sysgdcont.data.model.CatalogoCompra
import cu.lazaroysr96.sysgdcont.data.model.CatalogoCompraRegistro
import cu.lazaroysr96.sysgdcont.data.model.CatalogoVenta
import cu.lazaroysr96.sysgdcont.data.model.CatalogoVentaRegistro
import cu.lazaroysr96.sysgdcont.data.model.Compra
import cu.lazaroysr96.sysgdcont.data.model.InventarioRegistro
import cu.lazaroysr96.sysgdcont.data.model.ItemInventario
import cu.lazaroysr96.sysgdcont.data.model.InventarioVinculo
import cu.lazaroysr96.sysgdcont.data.model.InventarioVinculoEdicion
import cu.lazaroysr96.sysgdcont.data.model.InventarioVinculoRegistro
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
    private val appDatabase: AppDatabase,
    private val productoDao: ProductoDao,
    private val catalogoVentaDao: CatalogoVentaDao,
    private val catalogoCompraDao: CatalogoCompraDao,
    private val ventaDao: VentaDao,
    private val compraDao: CompraDao,
    private val itemInventarioDao: ItemInventarioDao,
    private val inventarioVinculoDao: InventarioVinculoDao,
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

    private suspend fun crearProductoBase(
        nombre: String,
        emoji: String,
        unidad: String
    ): Producto {
        val producto = Producto(
            id = UUID.randomUUID().toString(),
            nombre = nombre.trim(),
            emoji = emoji,
            unidad = unidad,
            activo = true
        )
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

    fun getProductosBase(): Flow<List<Producto>> = productoDao.observeAll()

    suspend fun agregarProducto(
        nombre: String,
        precio: Double,
        emoji: String,
        unidad: String
    ) {
        val almacen = ensureDefaultAlmacen()
        val producto = crearProductoBase(nombre, emoji, unidad)
        upsertCatalogoVenta(producto.id, precio, almacen.id)
        ensureItemInventario(producto.id, TipoProductoInv.VENTA, almacen.id)
        markLocalModified()
    }

    suspend fun eliminarProducto(catalogoId: String) {
        catalogoVentaDao.deactivateById(catalogoId)
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
            val disponible = calcularStockDisponible(itemInventario)
            if (disponible.isFinite() && disponible < cantidad) {
                throw IllegalStateException("Stock insuficiente para ${producto.nombre}. Disponible: $disponible")
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
            descontarSegunModo(itemInventario, cantidad, fechaTrabajo)
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
        val producto = crearProductoBase(nombre, emoji, unidad)
        upsertCatalogoCompra(producto.id, precio, almacen.id)
        markLocalModified()
    }

    suspend fun eliminarProductoCompra(catalogoId: String) {
        catalogoCompraDao.deactivateById(catalogoId)
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
            val itemInventario = ensureItemInventario(producto.id, TipoProductoInv.COMPRA, producto.almacenDestinoId)
            if (itemInventario.archivado) {
                itemInventarioDao.restoreById(itemInventario.id, fechaTrabajo)
            }
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
        val vinculos = stock.flatMap { item -> obtenerVinculos(item) }

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
            vinculos = vinculos.map {
                InventarioVinculoRegistro(
                    id = it.id,
                    itemInventarioId = it.itemInventarioId,
                    productoComponenteId = it.productoComponenteId,
                    cantidad = it.cantidad
                )
            },
            operaciones = operacionesVenta + operacionesCompra,
            productosVenta = productosVentaLegacy,
            productosCompra = productosCompraLegacy
        )
    }

    suspend fun fromInventarioRegistro(inventario: InventarioRegistro) {
        appDatabase.withTransaction {
            ventaDao.deleteAllLineas()
            ventaDao.deleteAllVentas()
            compraDao.deleteAllLineas()
            compraDao.deleteAllCompras()
            inventarioVinculoDao.deleteAll()
            itemInventarioDao.deleteAll()
            catalogoVentaDao.deleteAll()
            catalogoCompraDao.deleteAll()
            productoDao.deleteAll()
            almacenDao.deleteAll()

            val almacenes = inventario.almacenes.ifEmpty {
                listOf(AlmacenRegistro(Almacen.DEFAULT_ID, "Almacén principal", true))
            }
                .map { it.copy(id = it.id.ifBlank { Almacen.DEFAULT_ID }) }
                .distinctBy { it.id }
            val almacenesIds = almacenes.map { it.id }.toSet()
            almacenDao.insertAll(almacenes.map { Almacen(id = it.id, nombre = it.nombre, principal = it.principal) })

            val productosMap = linkedMapOf<String, ProductoInventario>()
            fun upsertProductoBase(id: String, nombre: String, unidad: String, emoji: String) {
                if (id.isBlank()) return
                val existente = productosMap[id]
                if (existente == null) {
                    productosMap[id] = ProductoInventario(
                        id = id,
                        nombre = nombre.ifBlank { "Producto" },
                        unidad = unidad.ifBlank { "und" },
                        emoji = emoji.ifBlank { "📦" }
                    )
                } else {
                    productosMap[id] = existente.copy(
                        nombre = if (existente.nombre == "Producto" && nombre.isNotBlank()) nombre else existente.nombre,
                        unidad = if (existente.unidad == "und" && unidad.isNotBlank()) unidad else existente.unidad,
                        emoji = if (existente.emoji == "📦" && emoji.isNotBlank()) emoji else existente.emoji
                    )
                }
            }

            inventario.productos.forEach { p -> upsertProductoBase(p.id, p.nombre, p.unidad, p.emoji) }
            inventario.productosVenta.forEach { p -> upsertProductoBase(p.id, p.nombre, p.unidad, p.emoji) }
            inventario.productosCompra.forEach { p -> upsertProductoBase(p.id, p.nombre, p.unidad, p.emoji) }
            inventario.catalogoVentas.forEach { c -> upsertProductoBase(c.productoId, "", "", "") }
            inventario.catalogoCompras.forEach { c -> upsertProductoBase(c.productoId, "", "", "") }
            inventario.stock.forEach { s -> upsertProductoBase(s.productoId, "", "", "") }
            inventario.operaciones.forEach { op -> upsertProductoBase(op.productoId, op.nombreProducto, op.unidad, "") }
            inventario.vinculos.forEach { v -> upsertProductoBase(v.productoComponenteId, "", "", "") }

            val productos = productosMap.values.map { p ->
                Producto(
                    id = p.id,
                    nombre = p.nombre,
                    emoji = p.emoji,
                    unidad = p.unidad,
                    activo = true
                )
            }
            val productosIds = productos.map { it.id }.toSet()
            productoDao.insertAll(productos)

            val catalogoVentas = if (inventario.catalogoVentas.isNotEmpty()) {
                inventario.catalogoVentas.map {
                    CatalogoVenta(
                        id = it.id,
                        productoId = it.productoId,
                        precioReferencia = it.precioReferencia,
                        almacenId = it.almacenId.ifBlank { Almacen.DEFAULT_ID },
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
            }.filter { it.productoId in productosIds && it.almacenId in almacenesIds }
            catalogoVentaDao.insertAll(catalogoVentas)

            val catalogoCompras = if (inventario.catalogoCompras.isNotEmpty()) {
                inventario.catalogoCompras.map {
                    CatalogoCompra(
                        id = it.id,
                        productoId = it.productoId,
                        precioReferencia = it.precioReferencia,
                        almacenDestinoId = it.almacenDestinoId.ifBlank { Almacen.DEFAULT_ID },
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
            }.filter { it.productoId in productosIds && it.almacenDestinoId in almacenesIds }
            catalogoCompraDao.insertAll(catalogoCompras)

            val stockFuente = inventario.stock.ifEmpty {
                val productosVentaIds = inventario.productosVenta.map { it.id }.toSet()
                val stockComprasRestaurado = inventario.operaciones
                    .filter { it.tipo == "compra" && !it.anulada }
                    .groupBy { (it.almacenId.ifBlank { Almacen.DEFAULT_ID }) to it.productoId }
                    .map { (key, operaciones) ->
                        val (almacenId, productoId) = key
                        StockRegistro(
                            id = "stock_${almacenId}_$productoId",
                            productoId = productoId,
                            almacenId = almacenId,
                            stockDisponible = operaciones.sumOf { it.cantidad },
                            modoStock = ModoStock.MANUAL.name,
                            visibleEnVentas = productoId in productosVentaIds
                        )
                    }

                val stockVentasPorDefecto = inventario.productosVenta.mapNotNull {
                    val stockId = "stock_${Almacen.DEFAULT_ID}_${it.id}"
                    if (stockComprasRestaurado.any { stock -> stock.id == stockId }) {
                        null
                    } else {
                        StockRegistro(
                            id = stockId,
                            productoId = it.id,
                            almacenId = Almacen.DEFAULT_ID,
                            modoStock = ModoStock.ILIMITADO.name,
                            visibleEnVentas = true
                        )
                    }
                }

                stockComprasRestaurado + stockVentasPorDefecto
            }
            stockFuente
                .filter { it.productoId in productosIds && it.almacenId in almacenesIds }
                .forEach { item ->
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

            val vinculosFuente = if (inventario.vinculos.isNotEmpty()) {
                inventario.vinculos
            } else {
                stockFuente.flatMap { item ->
                    val vinculados = item.productosVinculadosIds.toProductoIds()
                    val ratios = item.ratiosConversion.toRatios()
                    vinculados.mapIndexedNotNull { index, productoId ->
                        val cantidad = ratios.getOrElse(index) { 1.0 }
                        if (productoId.isBlank() || cantidad <= 0.0) {
                            null
                        } else {
                            InventarioVinculoRegistro(
                                id = UUID.randomUUID().toString(),
                                itemInventarioId = item.id,
                                productoComponenteId = productoId,
                                cantidad = cantidad
                            )
                        }
                    }
                }
            }

        data class VentaRestaurada(val venta: Venta, val lineas: MutableList<LineaVenta>)
        data class CompraRestaurada(val compra: Compra, val lineas: MutableList<LineaCompra>)

        val ventasMap = mutableMapOf<String, VentaRestaurada>()
        val comprasMap = mutableMapOf<String, CompraRestaurada>()

            inventario.operaciones
                .filter { it.productoId in productosIds }
                .forEach { op ->
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

            val itemIdsExistentes = (itemInventarioDao.getItemsVenta().first() + itemInventarioDao.getItemsCompra().first())
                .map { it.id }
                .toSet()
            val productosExistentes = productoDao.getAll().map { it.id }.toSet()
            val vinculos = vinculosFuente.filter {
                it.itemInventarioId in itemIdsExistentes &&
                    it.productoComponenteId in productosExistentes &&
                    it.cantidad > 0.0
            }.distinctBy { it.itemInventarioId to it.productoComponenteId }
            if (vinculos.isNotEmpty()) {
                val fecha = LocalDate.now().toString()
                inventarioVinculoDao.insertAll(
                    vinculos.map {
                        InventarioVinculo(
                            id = it.id.ifBlank { UUID.randomUUID().toString() },
                            itemInventarioId = it.itemInventarioId,
                            productoComponenteId = it.productoComponenteId,
                            cantidad = it.cantidad,
                            createdAt = fecha,
                            updatedAt = fecha
                        )
                    }
                )
            }
        }

        clearLocalModified()
    }

    fun getItemsInventarioCompra(): Flow<List<ItemInventario>> =
        itemInventarioDao.getItemsCompra().map { items ->
            items.map { item -> enriquecerItemInventario(item) }
        }

    fun getItemsInventarioVenta(): Flow<List<ItemInventario>> =
        itemInventarioDao.getItemsVenta().map { items ->
            items.map { item -> enriquecerItemInventario(item) }
        }

    fun getItemsInventarioArchivados(): Flow<List<ItemInventario>> =
        itemInventarioDao.getItemsArchivados().map { items ->
            items.map { item -> enriquecerItemInventario(item) }
        }

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
        val fecha = LocalDate.now().toString()
        inventarioVinculoDao.deleteByItemInventarioId(id)
        itemInventarioDao.actualizarModoYVinculados(id, modo.name, "[]", "[]", fecha)
        markLocalModified()
    }

    suspend fun actualizarModoYVinculados(id: String, modo: ModoStock, vinculados: List<String>, ratios: List<Double>) {
        require(modo == ModoStock.VINCULADO) { "Solo el modo vinculado admite componentes" }
        require(vinculados.size == ratios.size) { "La cantidad de productos y ratios no coincide" }

        val item = itemInventarioDao.getById(id)
            ?: throw IllegalStateException("No existe el item de inventario")
        val itemProductoId = item.productoId
        val componentes = vinculados.zip(ratios)
            .map { (productoId, cantidad) -> productoId.trim() to cantidad }
            .filter { (productoId, cantidad) -> productoId.isNotBlank() && cantidad > 0.0 }

        require(componentes.isNotEmpty()) { "Debes seleccionar al menos un producto vinculado" }
        require(componentes.map { it.first }.distinct().size == componentes.size) { "No se puede repetir un producto vinculado" }
        require(componentes.none { it.first == itemProductoId }) { "Un producto no puede vincularse consigo mismo" }

        componentes.forEach { (productoId, _) ->
            if (productoDependeDe(productoId, itemProductoId, item.almacenId, mutableSetOf())) {
                throw IllegalStateException("La vinculación crea un ciclo entre productos")
            }
        }

        val fecha = LocalDate.now().toString()
        itemInventarioDao.actualizarModoYVinculados(
            id,
            modo.name,
            componentes.map { it.first }.toJsonStringArray(),
            componentes.map { it.second }.toJsonDoubleArray(),
            fecha
        )
        inventarioVinculoDao.deleteByItemInventarioId(id)
        inventarioVinculoDao.insertAll(
            componentes.map { (productoId, cantidad) ->
                InventarioVinculo(
                    id = UUID.randomUUID().toString(),
                    itemInventarioId = id,
                    productoComponenteId = productoId,
                    cantidad = cantidad,
                    createdAt = fecha,
                    updatedAt = fecha
                )
            }
        )
        markLocalModified()
    }

    suspend fun archivarItemInventario(itemId: String, motivo: String) {
        val item = itemInventarioDao.getById(itemId)
            ?: throw IllegalStateException("No existe el item de inventario")
        val catalogoVenta = catalogoVentaDao.getByProductoId(item.productoId, item.almacenId)
        if (catalogoVenta?.activo == true) {
            throw IllegalStateException("No se puede archivar un producto que está en venta")
        }
        val fecha = LocalDate.now().toString()
        itemInventarioDao.archiveById(itemId, motivo.trim(), fecha)
        markLocalModified()
    }

    suspend fun restaurarItemInventario(itemId: String) {
        val item = itemInventarioDao.getById(itemId)
            ?: throw IllegalStateException("No existe el item de inventario")
        val fecha = LocalDate.now().toString()
        itemInventarioDao.restoreById(item.id, fecha)
        markLocalModified()
    }

    suspend fun ajustarStock(id: String, cantidad: Double) {
        itemInventarioDao.actualizarStockYModo(id, cantidad, ModoStock.MANUAL.name, LocalDate.now().toString())
        inventarioVinculoDao.deleteByItemInventarioId(id)
        markLocalModified()
    }

    suspend fun ponerProductoEnVenta(
        productoId: String,
        precioVenta: Double
    ) {
        val almacen = ensureDefaultAlmacen()
        productoDao.getById(productoId)
            ?: throw IllegalStateException("No existe el producto a publicar en ventas")
        upsertCatalogoVenta(productoId, precioVenta, almacen.id)
        markLocalModified()
    }

    suspend fun getVinculosEdicion(itemId: String): List<InventarioVinculoEdicion> =
        obtenerVinculos(
            itemInventarioDao.getById(itemId)
                ?: throw IllegalStateException("No existe el item de inventario")
        ).map {
            InventarioVinculoEdicion(
                productoId = it.productoComponenteId,
                cantidad = it.cantidad
            )
        }

    suspend fun getProductosPorIds(ids: Collection<String>): Map<String, Producto> {
        if (ids.isEmpty()) return emptyMap()
        return productoDao.getByIds(ids.toList()).associateBy { it.id }
    }

    private suspend fun enriquecerItemInventario(item: ItemInventario): ItemInventario {
        if (item.modoStock != ModoStock.VINCULADO.name) return item
        return item.copy(stockDisponible = calcularStockDisponible(item))
    }

    private suspend fun calcularStockDisponible(
        item: ItemInventario,
        visitados: MutableSet<String> = mutableSetOf()
    ): Double {
        if (!visitados.add(item.id)) return 0.0

        return when (runCatching { ModoStock.valueOf(item.modoStock) }.getOrElse { ModoStock.ILIMITADO }) {
            ModoStock.ILIMITADO -> Double.POSITIVE_INFINITY
            ModoStock.MANUAL -> item.stockDisponible.coerceAtLeast(0.0)
            ModoStock.VINCULADO -> {
                val vinculos = obtenerVinculos(item)
                if (vinculos.isEmpty()) {
                    0.0
                } else {
                    vinculos.minOf { vinculo ->
                        val itemComponente = itemInventarioDao.getByProductoId(vinculo.productoComponenteId, item.almacenId)
                        val disponible = itemComponente?.let { calcularStockDisponible(it, visitados.toMutableSet()) } ?: 0.0
                        if (vinculo.cantidad <= 0.0) 0.0 else disponible / vinculo.cantidad
                    }
                }
            }
        }
    }

    private suspend fun descontarSegunModo(
        item: ItemInventario,
        cantidad: Double,
        fecha: String,
        visitados: MutableSet<String> = mutableSetOf()
    ) {
        if (!visitados.add(item.id)) {
            throw IllegalStateException("Se detectó un ciclo en el inventario vinculado")
        }

        when (runCatching { ModoStock.valueOf(item.modoStock) }.getOrElse { ModoStock.ILIMITADO }) {
            ModoStock.ILIMITADO -> Unit
            ModoStock.MANUAL -> itemInventarioDao.descontarStockPorId(item.id, cantidad, fecha)
            ModoStock.VINCULADO -> {
                val vinculos = obtenerVinculos(item)
                if (vinculos.isEmpty()) {
                    throw IllegalStateException("El producto vinculado no tiene componentes configurados")
                }
                vinculos.forEach { vinculo ->
                    val itemComponente = itemInventarioDao.getByProductoId(vinculo.productoComponenteId, item.almacenId)
                        ?: throw IllegalStateException("Falta inventario para un producto vinculado")
                    descontarSegunModo(itemComponente, vinculo.cantidad * cantidad, fecha, visitados.toMutableSet())
                }
            }
        }
    }

    private suspend fun productoDependeDe(
        productoOrigenId: String,
        productoObjetivoId: String,
        almacenId: String,
        visitados: MutableSet<String>
    ): Boolean {
        if (!visitados.add(productoOrigenId)) return false
        if (productoOrigenId == productoObjetivoId) return true

        val item = itemInventarioDao.getByProductoId(productoOrigenId, almacenId) ?: return false
        val vinculos = obtenerVinculos(item)
        return vinculos.any { vinculo ->
            vinculo.productoComponenteId == productoObjetivoId ||
                productoDependeDe(vinculo.productoComponenteId, productoObjetivoId, almacenId, visitados)
        }
    }

    private suspend fun obtenerVinculos(item: ItemInventario): List<InventarioVinculo> {
        val persistidos = inventarioVinculoDao.getByItemInventarioId(item.id)
        if (persistidos.isNotEmpty()) return persistidos

        val vinculados = item.productosVinculadosIds.toProductoIds()
        if (vinculados.isEmpty()) return emptyList()
        val ratios = item.ratiosConversion.toRatios()
        val fecha = item.ultimaActualizacion.ifBlank { LocalDate.now().toString() }
        return vinculados.mapIndexedNotNull { index, productoId ->
            val cantidad = ratios.getOrElse(index) { 1.0 }
            if (productoId.isBlank() || cantidad <= 0.0) {
                null
            } else {
                InventarioVinculo(
                    id = "legacy_${item.id}_$index",
                    itemInventarioId = item.id,
                    productoComponenteId = productoId,
                    cantidad = cantidad,
                    createdAt = fecha,
                    updatedAt = fecha
                )
            }
        }
    }

    private fun List<String>.toJsonStringArray() = "[${joinToString(",") { "\"$it\"" }}]"
    private fun List<Double>.toJsonDoubleArray() = "[${joinToString(",")}]"
    private fun String.toProductoIds(): List<String> =
        removePrefix("[")
            .removeSuffix("]")
            .split(",")
            .map { it.trim().removeSurrounding("\"") }
            .filter { it.isNotBlank() }

    private fun String.toRatios(): List<Double> =
        removePrefix("[")
            .removeSuffix("]")
            .split(",")
            .mapNotNull { it.trim().toDoubleOrNull() }
}
