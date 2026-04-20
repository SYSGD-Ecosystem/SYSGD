package cu.lazaroysr96.sysgdcont.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.ProductoVenta
import cu.lazaroysr96.sysgdcont.data.model.Venta
import cu.lazaroysr96.sysgdcont.data.model.ProductoCompra
import cu.lazaroysr96.sysgdcont.data.model.Compra
import cu.lazaroysr96.sysgdcont.data.model.LineaCompra
import cu.lazaroysr96.sysgdcont.data.model.ItemInventario
import cu.lazaroysr96.sysgdcont.data.model.InventarioVinculoEdicion
import cu.lazaroysr96.sysgdcont.data.model.CuentaContable
import cu.lazaroysr96.sysgdcont.data.model.TipoProductoInv
import cu.lazaroysr96.sysgdcont.data.model.ModoStock
import cu.lazaroysr96.sysgdcont.data.model.PosIntegrationConfig
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.repository.ConfiguracionFacturacion
import cu.lazaroysr96.sysgdcont.data.repository.FacturaRepository
import cu.lazaroysr96.sysgdcont.data.repository.InventarioRepository
import cu.lazaroysr96.sysgdcont.data.repository.LedgerRepository
// import cu.lazaroysr96.sysgdcont.data.dao.ItemInventarioDao
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.Job
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale
import javax.inject.Inject



data class InventarioUiState(
    val productos: List<ProductoVenta> = emptyList(),
    val productosBase: List<Producto> = emptyList(),
    val ventasHoy: List<Pair<Venta, List<LineaVenta>>> = emptyList(),
    val totalHoy: Double = 0.0,
    val productosCompra: List<ProductoCompra> = emptyList(),
    val comprasHoy: List<Pair<Compra, List<LineaCompra>>> = emptyList(),
    val totalComprasHoy: Double = 0.0,
    val isLoading: Boolean = false,
    val snackbarMessage: String? = null,
    val showSaleSheet: Boolean = false,
    val showPurchaseSheet: Boolean = false,
    val showCatalog: Boolean = false,
    val showCatalogCompra: Boolean = false,
    val showAddProductDialog: Boolean = false,
    val showAddProductCompraDialog: Boolean = false,
    val selectedProduct: ProductoVenta? = null,
    val cart: Map<ProductoVenta, Double> = emptyMap(),
    val cartCompra: Map<ProductoCompra, Double> = emptyMap(),
    val currentTab: Int = 0,
    val mesActual: YearMonth = YearMonth.now(),
    val ventasDelMes: Map<String, List<Pair<Venta, List<LineaVenta>>>> = emptyMap(),
    val comprasDelMes: Map<String, List<Pair<Compra, List<LineaCompra>>>> = emptyMap(),
    val totalVentasMes: Double = 0.0,
    val cantidadVentasMes: Int = 0,
    val totalComprasMes: Double = 0.0,
    val cantidadComprasMes: Int = 0,
    val fechaTrabajo: LocalDate = LocalDate.now(),
    // Inventario
    val itemsInventarioCompra: List<ItemInventario> = emptyList(),
    val itemsInventarioVenta: List<ItemInventario> = emptyList(),
    val itemsInventarioArchivados: List<ItemInventario> = emptyList(),
    // UI inventario
    val showMoverDialog: Boolean = false,
    val itemMoviendo: ItemInventario? = null,
    val showAjusteStockDialog: Boolean = false,
    val itemAjustando: ItemInventario? = null,
    val vinculadosItemAjustando: List<InventarioVinculoEdicion> = emptyList(),
    val showArchiveDialog: Boolean = false,
    val itemArchivando: ItemInventario? = null,
    val nombreItemArchivando: String = "",
    val nombreEmpresaFactura: String = "",
    val nombreVendedorFactura: String = "",
    val correoVendedorFactura: String = "",
    val telefonoVendedorFactura: String = "",
    val direccionVendedorFactura: String = "",
    val logoFacturaUri: String? = null,
    val firmaVendedorFacturaUri: String? = null,
    val reporteDesde: LocalDate = LocalDate.now().withDayOfMonth(1),
    val reporteHasta: LocalDate = LocalDate.now(),
    val cuentasIngresoContables: List<CuentaContable> = emptyList(),
    val cuentasGastoContables: List<CuentaContable> = emptyList(),
    val posIntegrationConfig: PosIntegrationConfig = PosIntegrationConfig()
)

@HiltViewModel
class InventarioViewModel @Inject constructor(
    private val repo: InventarioRepository,
    private val facturaRepository: FacturaRepository,
    private val ledgerRepository: LedgerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(InventarioUiState())
    val uiState: StateFlow<InventarioUiState> = _uiState.asStateFlow()

    private var ventasDiaJob: Job? = null
    private var totalVentasDiaJob: Job? = null
    private var comprasDiaJob: Job? = null
    private var totalComprasDiaJob: Job? = null

    init {
        viewModelScope.launch {
            repo.getProductos().collect { productos ->
                _uiState.update { it.copy(productos = productos) }
            }
        }

        viewModelScope.launch {
            repo.getProductosBase().collect { productos ->
                _uiState.update { it.copy(productosBase = productos) }
            }
        }

        viewModelScope.launch {
            repo.getProductosCompra().collect { productos ->
                _uiState.update { it.copy(productosCompra = productos) }
            }
        }

        observarDiaTrabajo(_uiState.value.fechaTrabajo)

        cargarVentasDelMes(YearMonth.now())
        cargarComprasDelMes(YearMonth.now())

        viewModelScope.launch {
            repo.getItemsInventarioCompra().collect { items ->
                _uiState.update { it.copy(itemsInventarioCompra = items) }
            }
        }
        viewModelScope.launch {
            repo.getItemsInventarioVenta().collect { items ->
                _uiState.update { it.copy(itemsInventarioVenta = items) }
            }
        }
        viewModelScope.launch {
            repo.getItemsInventarioArchivados().collect { items ->
                _uiState.update { it.copy(itemsInventarioArchivados = items) }
            }
        }
        viewModelScope.launch {
            facturaRepository.configuracionFacturacion.collect { config ->
                _uiState.update {
                    it.copy(
                        nombreEmpresaFactura = config.nombreEmpresa,
                        nombreVendedorFactura = config.nombreVendedor,
                        correoVendedorFactura = config.correoVendedor,
                        telefonoVendedorFactura = config.telefonoVendedor,
                        direccionVendedorFactura = config.direccionVendedor,
                        logoFacturaUri = config.logoUri,
                        firmaVendedorFacturaUri = config.firmaVendedorUri
                    )
                }
            }
        }
        viewModelScope.launch {
            ledgerRepository.cuentasIngreso.collect { cuentas ->
                _uiState.update { it.copy(cuentasIngresoContables = cuentas) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.cuentasGasto.collect { cuentas ->
                _uiState.update { it.copy(cuentasGastoContables = cuentas) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.posIntegrationConfig.collect { config ->
                _uiState.update { it.copy(posIntegrationConfig = config) }
            }
        }
    }

    fun showMoverDialog(item: ItemInventario?) {
        _uiState.update { it.copy(showMoverDialog = item != null, itemMoviendo = item) }
    }

    fun showAjusteStockDialog(item: ItemInventario?) {
        if (item == null) {
            _uiState.update {
                it.copy(
                    showAjusteStockDialog = false,
                    itemAjustando = null,
                    vinculadosItemAjustando = emptyList()
                )
            }
            return
        }

        _uiState.update {
            it.copy(
                showAjusteStockDialog = true,
                itemAjustando = item,
                vinculadosItemAjustando = emptyList()
            )
        }
        viewModelScope.launch {
            val vinculados = repo.getVinculosEdicion(item.id)
            _uiState.update { state ->
                if (state.itemAjustando?.id == item.id) {
                    state.copy(vinculadosItemAjustando = vinculados)
                } else {
                    state
                }
            }
        }
    }

    fun ajustarStockManual(
        id: String,
        cantidad: Double,
        modo: String,
        vinculados: List<String> = emptyList(),
        ratios: List<Double> = emptyList()
    ) {
        viewModelScope.launch {
            try {
                when (modo) {
                    ModoStock.ILIMITADO.name -> {
                        repo.actualizarModoStock(id, ModoStock.ILIMITADO)
                    }
                    ModoStock.VINCULADO.name -> {
                        repo.actualizarModoYVinculados(id, ModoStock.VINCULADO, vinculados, ratios)
                    }
                    else -> {
                        repo.ajustarStock(id, cantidad)
                    }
                }
                _uiState.update {
                    it.copy(
                        snackbarMessage = "Stock actualizado",
                        showAjusteStockDialog = false,
                        itemAjustando = null,
                        vinculadosItemAjustando = emptyList()
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al actualizar stock") }
            }
        }
    }

    fun ponerProductoEnVenta(
        productoId: String,
        precioVenta: Double
    ) {
        viewModelScope.launch {
            try {
                repo.ponerProductoEnVenta(productoId, precioVenta)
                _uiState.update {
                    it.copy(
                        snackbarMessage = "Producto agregado al catalogo de ventas",
                        showMoverDialog = false,
                        itemMoviendo = null
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al publicar producto: ${e.message}") }
            }
        }
    }

    fun activarItemEnInventario(productoId: String, tipo: TipoProductoInv) {
        viewModelScope.launch {
            repo.ensureItemInventario(productoId, tipo)
            _uiState.update { it.copy(snackbarMessage = "Producto agregado al inventario") }
        }
    }

    fun updateNombreEmpresaFactura(nombre: String) {
        _uiState.update { it.copy(nombreEmpresaFactura = nombre) }
    }

    fun updateNombreVendedorFactura(nombre: String) {
        _uiState.update { it.copy(nombreVendedorFactura = nombre) }
    }

    fun updateCorreoVendedorFactura(correo: String) {
        _uiState.update { it.copy(correoVendedorFactura = correo) }
    }

    fun updateTelefonoVendedorFactura(telefono: String) {
        _uiState.update { it.copy(telefonoVendedorFactura = telefono) }
    }

    fun updateDireccionVendedorFactura(direccion: String) {
        _uiState.update { it.copy(direccionVendedorFactura = direccion) }
    }

    fun updateLogoFacturaUri(uri: String?) {
        _uiState.update { it.copy(logoFacturaUri = uri) }
    }

    fun updateFirmaVendedorFacturaUri(uri: String?) {
        _uiState.update { it.copy(firmaVendedorFacturaUri = uri) }
    }

    fun guardarConfiguracionFacturacion() {
        viewModelScope.launch {
            try {
                val state = _uiState.value
                facturaRepository.guardarConfiguracionFacturacion(
                    ConfiguracionFacturacion(
                        nombreEmpresa = state.nombreEmpresaFactura,
                        nombreVendedor = state.nombreVendedorFactura,
                        correoVendedor = state.correoVendedorFactura,
                        telefonoVendedor = state.telefonoVendedorFactura,
                        direccionVendedor = state.direccionVendedorFactura,
                        logoUri = state.logoFacturaUri,
                        firmaVendedorUri = state.firmaVendedorFacturaUri
                    )
                )
                _uiState.update { it.copy(snackbarMessage = "Datos de facturación guardados") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "No se pudo guardar la configuración") }
            }
        }
    }

    fun actualizarIntegracionContable(
        enabled: Boolean,
        ingresoCuentaId: String?,
        gastoCuentaId: String?
    ) {
        viewModelScope.launch {
            ledgerRepository.updatePosIntegrationConfig(enabled, ingresoCuentaId, gastoCuentaId)
            _uiState.update { it.copy(snackbarMessage = "Integración contable actualizada") }
        }
    }

    fun setReporteDesde(fecha: LocalDate) {
        _uiState.update { state ->
            val fechaHasta = if (fecha.isAfter(state.reporteHasta)) fecha else state.reporteHasta
            state.copy(reporteDesde = fecha, reporteHasta = fechaHasta)
        }
    }

    fun setReporteHasta(fecha: LocalDate) {
        _uiState.update { state ->
            val fechaDesde = if (fecha.isBefore(state.reporteDesde)) fecha else state.reporteDesde
            state.copy(reporteDesde = fechaDesde, reporteHasta = fecha)
        }
    }

    fun generarReporteVentasPdf() {
        viewModelScope.launch {
            try {
                val state = _uiState.value
                val path = facturaRepository.generarReporteVentasPdf(state.reporteDesde, state.reporteHasta)
                _uiState.update { it.copy(snackbarMessage = "Reporte de ventas guardado en Documentos de SYSGD: $path") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al generar reporte de ventas") }
            }
        }
    }

    fun generarReporteComprasPdf() {
        viewModelScope.launch {
            try {
                val state = _uiState.value
                val path = facturaRepository.generarReporteComprasPdf(state.reporteDesde, state.reporteHasta)
                _uiState.update { it.copy(snackbarMessage = "Reporte de compras guardado en Documentos de SYSGD: $path") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al generar reporte de compras") }
            }
        }
    }

    fun generarInformeInventarioPdf() {
        viewModelScope.launch {
            try {
                val path = facturaRepository.generarInformeInventarioPdf()
                _uiState.update { it.copy(snackbarMessage = "Informe de inventario guardado en Documentos de SYSGD: $path") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al generar informe de inventario") }
            }
        }
    }

    private fun observarDiaTrabajo(fecha: LocalDate) {
        val fechaIso = fecha.format(DateTimeFormatter.ISO_LOCAL_DATE)

        ventasDiaJob?.cancel()
        ventasDiaJob = viewModelScope.launch {
            repo.getVentasConLineasDelDia(fechaIso).collect { ventas ->
                _uiState.update { it.copy(ventasHoy = ventas) }
            }
        }

        totalVentasDiaJob?.cancel()
        totalVentasDiaJob = viewModelScope.launch {
            repo.getTotalDia(fechaIso).collect { total ->
                _uiState.update { it.copy(totalHoy = total ?: 0.0) }
            }
        }

        comprasDiaJob?.cancel()
        comprasDiaJob = viewModelScope.launch {
            repo.getComprasConLineasDelDia(fechaIso).collect { compras ->
                _uiState.update { it.copy(comprasHoy = compras) }
            }
        }

        totalComprasDiaJob?.cancel()
        totalComprasDiaJob = viewModelScope.launch {
            repo.getTotalComprasDia(fechaIso).collect { total ->
                _uiState.update { it.copy(totalComprasHoy = total ?: 0.0) }
            }
        }
    }

    private fun cargarVentasDelMes(mes: YearMonth) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val mesStr = mes.format(DateTimeFormatter.ofPattern("yyyy-MM"))
            val ventas = repo.getVentasConLineasDelMes(mesStr)
            val (cantidad, total) = repo.getResumenMensual(mesStr)
            
            _uiState.update { 
                it.copy(
                    ventasDelMes = ventas,
                    totalVentasMes = total,
                    cantidadVentasMes = cantidad,
                    mesActual = mes,
                    isLoading = false
                )
            }
        }
    }

    private fun cargarComprasDelMes(mes: YearMonth) {
        viewModelScope.launch {
            val mesStr = mes.format(DateTimeFormatter.ofPattern("yyyy-MM"))
            val compras = repo.getComprasConLineasDelMes(mesStr)
            val (cantidad, total) = repo.getResumenComprasMensual(mesStr)
            
            _uiState.update { 
                it.copy(
                    comprasDelMes = compras,
                    totalComprasMes = total,
                    cantidadComprasMes = cantidad
                )
            }
        }
    }

    fun mesAnterior() {
        val nuevoMes = _uiState.value.mesActual.minusMonths(1)
        cargarVentasDelMes(nuevoMes)
        cargarComprasDelMes(nuevoMes)
    }

    fun mesSiguiente() {
        val nuevoMes = _uiState.value.mesActual.plusMonths(1)
        if (!nuevoMes.isAfter(YearMonth.now())) {
            cargarVentasDelMes(nuevoMes)
            cargarComprasDelMes(nuevoMes)
        }
    }

    fun refreshAfterRestore() {
        val state = _uiState.value
        observarDiaTrabajo(state.fechaTrabajo)
        cargarVentasDelMes(state.mesActual)
        cargarComprasDelMes(state.mesActual)
    }

    fun setCurrentTab(tab: Int) {
        _uiState.update { it.copy(currentTab = tab) }
    }

    fun setFechaTrabajo(fecha: LocalDate) {
        val fechaValida = if (fecha.isAfter(LocalDate.now())) LocalDate.now() else fecha
        if (fechaValida == _uiState.value.fechaTrabajo) return
        _uiState.update { it.copy(fechaTrabajo = fechaValida) }
        observarDiaTrabajo(fechaValida)
    }

    fun getNombreMes(mes: YearMonth): String {
        val mesNombre = mes.month.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
        return "${mesNombre.replaceFirstChar { it.uppercase() }} ${mes.year}"
    }

    fun agregarProducto(nombre: String, precio: Double, emoji: String, unidad: String) {
        viewModelScope.launch {
            try {
                repo.agregarProducto(nombre, precio, emoji, unidad)
                _uiState.update { it.copy(snackbarMessage = "Producto agregado", showAddProductDialog = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al agregar producto") }
            }
        }
    }

    fun agregarProductoExistenteAVentas(productoId: String, precio: Double) {
        viewModelScope.launch {
            try {
                repo.agregarProductoExistenteAVentas(productoId, precio)
                _uiState.update { it.copy(snackbarMessage = "Producto agregado al catalogo de ventas") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al agregar producto") }
            }
        }
    }

    fun agregarProductoCompra(nombre: String, precio: Double, emoji: String, unidad: String) {
        viewModelScope.launch {
            try {
                repo.agregarProductoCompra(nombre, precio, emoji, unidad)
                _uiState.update { it.copy(snackbarMessage = "Insumo agregado", showAddProductCompraDialog = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al agregar insumo") }
            }
        }
    }

    fun agregarProductoExistenteACompras(productoId: String, precio: Double) {
        viewModelScope.launch {
            try {
                repo.agregarProductoExistenteACompras(productoId, precio)
                _uiState.update { it.copy(snackbarMessage = "Producto agregado al catalogo de compras") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al agregar insumo") }
            }
        }
    }

    fun agregarProductoBase(nombre: String, emoji: String, unidad: String) {
        viewModelScope.launch {
            try {
                repo.agregarProductoBase(nombre, emoji, unidad)
                _uiState.update { it.copy(snackbarMessage = "Producto agregado") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al agregar producto") }
            }
        }
    }

    fun actualizarProductoBase(id: String, nombre: String, emoji: String, unidad: String) {
        viewModelScope.launch {
            try {
                repo.actualizarProductoBase(id, nombre, emoji, unidad)
                _uiState.update { it.copy(snackbarMessage = "Producto actualizado") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al actualizar producto") }
            }
        }
    }

    fun eliminarProducto(id: String) {
        viewModelScope.launch {
            try {
                repo.eliminarProducto(id)
                _uiState.update { it.copy(snackbarMessage = "Producto eliminado") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al eliminar") }
            }
        }
    }

    fun eliminarProductoCompra(id: String) {
        viewModelScope.launch {
            try {
                repo.eliminarProductoCompra(id)
                _uiState.update { it.copy(snackbarMessage = "Insumo eliminado") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al eliminar") }
            }
        }
    }

    fun showArchiveDialog(item: ItemInventario?, nombre: String) {
        _uiState.update {
            it.copy(
                showArchiveDialog = item != null,
                itemArchivando = item,
                nombreItemArchivando = nombre
            )
        }
    }

    fun archivarItemInventario(motivo: String) {
        val item = _uiState.value.itemArchivando ?: return
        viewModelScope.launch {
            try {
                repo.archivarItemInventario(item.id, motivo)
                _uiState.update {
                    it.copy(
                        snackbarMessage = "Producto archivado",
                        showArchiveDialog = false,
                        itemArchivando = null,
                        nombreItemArchivando = ""
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "No se pudo archivar") }
            }
        }
    }

    fun restaurarItemInventario(itemId: String) {
        viewModelScope.launch {
            try {
                repo.restaurarItemInventario(itemId)
                _uiState.update { it.copy(snackbarMessage = "Producto restaurado en inventario") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "No se pudo restaurar") }
            }
        }
    }

    fun addToCart(producto: ProductoVenta, cantidad: Double = 1.0) {
        if (cantidad <= 0.0) return
        _uiState.update { state ->
            val currentCart = state.cart.toMutableMap()
            currentCart[producto] = (currentCart[producto] ?: 0.0) + cantidad
            state.copy(cart = currentCart, showSaleSheet = true)
        }
    }

    fun addToCartCompra(producto: ProductoCompra) {
        addToCartCompra(producto, 1.0)
    }

    fun addToCartCompra(producto: ProductoCompra, cantidad: Double) {
        if (cantidad <= 0.0) return
        _uiState.update { state ->
            val currentCart = state.cartCompra.toMutableMap()
            currentCart[producto] = (currentCart[producto] ?: 0.0) + cantidad
            state.copy(cartCompra = currentCart, showPurchaseSheet = true)
        }
    }

    fun removeFromCart(producto: ProductoVenta) {
        _uiState.update { state ->
            val currentCart = state.cart.toMutableMap()
            val currentQty = currentCart[producto] ?: 0.0
            if (currentQty > 1.0) {
                currentCart[producto] = currentQty - 1.0
            } else {
                currentCart.remove(producto)
            }
            state.copy(cart = currentCart)
        }
    }

    fun removeFromCartCompra(producto: ProductoCompra) {
        _uiState.update { state ->
            val currentCart = state.cartCompra.toMutableMap()
            val currentQty = currentCart[producto] ?: 0.0
            if (currentQty > 1.0) {
                currentCart[producto] = currentQty - 1.0
            } else {
                currentCart.remove(producto)
            }
            state.copy(cartCompra = currentCart)
        }
    }

    fun clearCart() {
        _uiState.update { it.copy(cart = emptyMap(), showSaleSheet = false) }
    }

    fun clearCartCompra() {
        _uiState.update { it.copy(cartCompra = emptyMap(), showPurchaseSheet = false) }
    }

    fun registrarVenta() {
        viewModelScope.launch {
            val cart = _uiState.value.cart
            if (cart.isEmpty()) return@launch

            try {
                val fecha = _uiState.value.fechaTrabajo.format(DateTimeFormatter.ISO_LOCAL_DATE)
                repo.registrarVenta(cart, fecha)
                ledgerRepository.registrarIngresoDesdePuntoVenta(
                    fechaIso = fecha,
                    total = cart.entries.sumOf { (producto, cantidad) -> producto.precio * cantidad }
                )
                _uiState.update {
                    it.copy(
                        cart = emptyMap(),
                        showSaleSheet = false,
                        snackbarMessage = "Venta registrada"
                    )
                }
                cargarVentasDelMes(_uiState.value.mesActual)
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al registrar venta") }
            }
        }
    }

    fun registrarCompra() {
        viewModelScope.launch {
            val cart = _uiState.value.cartCompra
            if (cart.isEmpty()) return@launch

            try {
                val fecha = _uiState.value.fechaTrabajo.format(DateTimeFormatter.ISO_LOCAL_DATE)
                repo.registrarCompra(cart, fecha)
                ledgerRepository.registrarGastoDesdePuntoVenta(
                    fechaIso = fecha,
                    total = cart.entries.sumOf { (producto, cantidad) -> producto.precio * cantidad }
                )
                _uiState.update {
                    it.copy(
                        cartCompra = emptyMap(),
                        showPurchaseSheet = false,
                        snackbarMessage = "Compra registrada"
                    )
                }
                cargarComprasDelMes(_uiState.value.mesActual)
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al registrar compra") }
            }
        }
    }

    fun anularVenta(ventaId: String) {
        viewModelScope.launch {
            try {
                val venta = repo.obtenerVenta(ventaId)
                repo.anularVenta(ventaId)
                venta?.let {
                    ledgerRepository.revertirIngresoDesdePuntoVenta(it.fecha, it.total)
                }
                _uiState.update { it.copy(snackbarMessage = "Venta anulada") }
                cargarVentasDelMes(_uiState.value.mesActual)
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al anular") }
            }
        }
    }

    fun anularCompra(compraId: String) {
        viewModelScope.launch {
            try {
                val compra = repo.obtenerCompra(compraId)
                repo.anularCompra(compraId)
                compra?.let {
                    ledgerRepository.revertirGastoDesdePuntoVenta(it.fecha, it.total)
                }
                _uiState.update { it.copy(snackbarMessage = "Compra anulada") }
                cargarComprasDelMes(_uiState.value.mesActual)
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al anular") }
            }
        }
    }

    fun showSaleSheet(show: Boolean) {
        _uiState.update { it.copy(showSaleSheet = show) }
    }

    fun showPurchaseSheet(show: Boolean) {
        _uiState.update { it.copy(showPurchaseSheet = show) }
    }

    fun showCatalog(show: Boolean) {
        _uiState.update { it.copy(showCatalog = show) }
    }

    fun showCatalogCompra(show: Boolean) {
        _uiState.update { it.copy(showCatalogCompra = show) }
    }

    fun showAddProductDialog(show: Boolean) {
        _uiState.update { it.copy(showAddProductDialog = show) }
    }

    fun showAddProductCompraDialog(show: Boolean) {
        _uiState.update { it.copy(showAddProductCompraDialog = show) }
    }

    fun clearSnackbar() {
        _uiState.update { it.copy(snackbarMessage = null) }
    }

    val cartTotal: Double
        get() = _uiState.value.cart.entries.sumOf { (p, qty) -> p.precio * qty }

    val cartItemCount: Int
        get() = _uiState.value.cart.values.sumOf { kotlin.math.ceil(it).toInt() }

    val cartCompraTotal: Double
        get() = _uiState.value.cartCompra.entries.sumOf { (p, qty) -> p.precio * qty }

    val cartCompraItemCount: Int
        get() = _uiState.value.cartCompra.values.sumOf { kotlin.math.ceil(it).toInt() }
}
