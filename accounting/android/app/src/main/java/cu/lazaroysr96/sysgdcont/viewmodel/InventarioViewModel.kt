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
import cu.lazaroysr96.sysgdcont.data.model.Almacen
import cu.lazaroysr96.sysgdcont.data.model.CuentaContable
import cu.lazaroysr96.sysgdcont.data.model.FormaPago
import cu.lazaroysr96.sysgdcont.data.model.RolTercero
import cu.lazaroysr96.sysgdcont.data.model.TerceroListItem
import cu.lazaroysr96.sysgdcont.data.model.TipoCuentaTercero
import cu.lazaroysr96.sysgdcont.data.model.TipoProductoInv
import cu.lazaroysr96.sysgdcont.data.model.ModoStock
import cu.lazaroysr96.sysgdcont.data.model.MovimientoInventario
import cu.lazaroysr96.sysgdcont.data.model.PosIntegrationConfig
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.model.PrecioProductoDetalle
import cu.lazaroysr96.sysgdcont.data.repository.ConfiguracionFacturacion
import cu.lazaroysr96.sysgdcont.data.repository.FacturaRepository
import cu.lazaroysr96.sysgdcont.data.repository.InventarioRepository
import cu.lazaroysr96.sysgdcont.data.repository.LedgerRepository
import cu.lazaroysr96.sysgdcont.data.repository.DatosClienteFactura
import cu.lazaroysr96.sysgdcont.data.repository.TercerosRepository
// import cu.lazaroysr96.sysgdcont.data.dao.ItemInventarioDao
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.Job
import org.json.JSONObject
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
    val showVentaCheckoutDialog: Boolean = false,
    val showCompraCheckoutDialog: Boolean = false,
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
    val almacenes: List<Almacen> = emptyList(),
    val selectedVentaAlmacenId: String = Almacen.DEFAULT_ID,
    val selectedCompraAlmacenId: String = Almacen.DEFAULT_ID,
    val selectedInventarioAlmacenId: String = Almacen.DEFAULT_ID,
    val movimientosInventario: List<MovimientoInventario> = emptyList(),
    val terceros: List<TerceroListItem> = emptyList(),
    val ventaPendienteFactura: Venta? = null,
    val lineasVentaPendienteFactura: List<LineaVenta> = emptyList(),
    val datosFacturaPrefill: DatosClienteFactura? = null,
    val formaPagoFacturaPrefill: FormaPago = FormaPago.EFECTIVO,
    val idTransaccionFacturaPrefill: String? = null,
    val notaFacturaPrefill: String = "",
    // UI inventario
    val showMoverDialog: Boolean = false,
    val itemMoviendo: ItemInventario? = null,
    val showTransferDialog: Boolean = false,
    val itemTransfiriendo: ItemInventario? = null,
    val showWarehouseDialog: Boolean = false,
    val almacenEditando: Almacen? = null,
    val showAjusteStockDialog: Boolean = false,
    val itemAjustando: ItemInventario? = null,
    val vinculadosItemAjustando: List<InventarioVinculoEdicion> = emptyList(),
    val showArchiveDialog: Boolean = false,
    val itemArchivando: ItemInventario? = null,
    val nombreItemArchivando: String = "",
    val nombreEmpresaFactura: String = "",
    val nombreVendedorFactura: String = "",
    val nitVendedorFactura: String = "",
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

enum class EstadoCobroOperacion { INMEDIATO, PENDIENTE }

data class VentaCheckoutOptions(
    val emitirFactura: Boolean = true,
    val estadoCobro: EstadoCobroOperacion = EstadoCobroOperacion.INMEDIATO,
    val formaPago: FormaPago = FormaPago.EFECTIVO,
    val idTransaccion: String = "",
    val nota: String = "",
    val documentoUri: String? = null,
    val terceroId: String? = null
)

data class CompraCheckoutOptions(
    val registrarFacturaProveedor: Boolean = false,
    val estadoPago: EstadoCobroOperacion = EstadoCobroOperacion.INMEDIATO,
    val nota: String = "",
    val documentoUri: String? = null,
    val terceroId: String? = null
)

data class OperacionDetalleResumen(
    val terceroNombre: String? = null,
    val terceroId: String? = null,
    val estadoPago: String? = null,
    val formaPago: String? = null,
    val idTransaccion: String? = null,
    val nota: String? = null,
    val documentoAdjunto: String = "",
    val facturaEmitida: Boolean = false,
    val facturaProveedor: Boolean = false
)

@HiltViewModel
class InventarioViewModel @Inject constructor(
    private val repo: InventarioRepository,
    private val facturaRepository: FacturaRepository,
    private val ledgerRepository: LedgerRepository,
    private val tercerosRepository: TercerosRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(InventarioUiState())
    val uiState: StateFlow<InventarioUiState> = _uiState.asStateFlow()

    private var ventasDiaJob: Job? = null
    private var totalVentasDiaJob: Job? = null
    private var comprasDiaJob: Job? = null
    private var totalComprasDiaJob: Job? = null

    init {
        viewModelScope.launch {
            repo.ensureDefaultWarehouse()
        }

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
        viewModelScope.launch {
            repo.getAlmacenes().collect { almacenes ->
                if (almacenes.isEmpty()) {
                    repo.ensureDefaultWarehouse()
                    return@collect
                }
                val principalId = almacenes.firstOrNull { it.principal }?.id ?: Almacen.DEFAULT_ID
                _uiState.update { state ->
                    fun validar(id: String): String =
                        almacenes.firstOrNull { it.id == id }?.id ?: principalId

                    state.copy(
                        almacenes = almacenes,
                        selectedVentaAlmacenId = validar(state.selectedVentaAlmacenId),
                        selectedCompraAlmacenId = validar(state.selectedCompraAlmacenId),
                        selectedInventarioAlmacenId = validar(state.selectedInventarioAlmacenId)
                    )
                }
            }
        }
        viewModelScope.launch {
            repo.getMovimientosInventario().collect { movimientos ->
                _uiState.update { it.copy(movimientosInventario = movimientos) }
            }
        }
        viewModelScope.launch {
            tercerosRepository.observeTerceros().collect { terceros ->
                _uiState.update { it.copy(terceros = terceros) }
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
                        nitVendedorFactura = config.nitVendedor,
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

    fun showTransferDialog(item: ItemInventario?) {
        _uiState.update { it.copy(showTransferDialog = item != null, itemTransfiriendo = item) }
    }

    fun showWarehouseDialog(show: Boolean, almacen: Almacen? = null) {
        _uiState.update { it.copy(showWarehouseDialog = show, almacenEditando = almacen) }
    }

    fun seleccionarAlmacenVenta(almacenId: String) {
        _uiState.update { it.copy(selectedVentaAlmacenId = almacenId, cart = emptyMap(), showSaleSheet = false) }
    }

    fun seleccionarAlmacenCompra(almacenId: String) {
        _uiState.update { it.copy(selectedCompraAlmacenId = almacenId, cartCompra = emptyMap(), showPurchaseSheet = false) }
    }

    fun seleccionarAlmacenInventario(almacenId: String) {
        _uiState.update { it.copy(selectedInventarioAlmacenId = almacenId) }
    }

    fun guardarAlmacen(nombre: String, almacenId: String? = null) {
        viewModelScope.launch {
            try {
                if (almacenId == null) {
                    val creado = repo.crearAlmacen(nombre)
                    _uiState.update {
                        it.copy(
                            selectedVentaAlmacenId = creado.id,
                            selectedCompraAlmacenId = creado.id,
                            selectedInventarioAlmacenId = creado.id,
                            showWarehouseDialog = false,
                            almacenEditando = null,
                            snackbarMessage = "Almacén creado"
                        )
                    }
                } else {
                    repo.editarAlmacen(almacenId, nombre)
                    _uiState.update {
                        it.copy(
                            showWarehouseDialog = false,
                            almacenEditando = null,
                            snackbarMessage = "Almacén actualizado"
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "No se pudo guardar el almacén") }
            }
        }
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
                repo.ponerProductoEnVenta(productoId, precioVenta, _uiState.value.selectedInventarioAlmacenId)
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

    fun updateNitVendedorFactura(nit: String) {
        _uiState.update { it.copy(nitVendedorFactura = nit) }
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
                        nitVendedor = state.nitVendedorFactura,
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
        viewModelScope.launch {
            repo.ensureDefaultWarehouse()
        }
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

    fun agregarProducto(nombre: String, precio: Double, emoji: String, unidad: String, descripcion: String = "") {
        viewModelScope.launch {
            try {
                repo.agregarProducto(nombre, precio, emoji, unidad, descripcion, _uiState.value.selectedVentaAlmacenId)
                _uiState.update { it.copy(snackbarMessage = "Producto agregado", showAddProductDialog = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al agregar producto") }
            }
        }
    }

    fun agregarProductoExistenteAVentas(productoId: String, precio: Double) {
        viewModelScope.launch {
            try {
                repo.agregarProductoExistenteAVentas(productoId, precio, _uiState.value.selectedVentaAlmacenId)
                _uiState.update { it.copy(snackbarMessage = "Producto agregado al catalogo de ventas") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al agregar producto") }
            }
        }
    }

    fun agregarProductoCompra(nombre: String, precio: Double, emoji: String, unidad: String, descripcion: String = "") {
        viewModelScope.launch {
            try {
                repo.agregarProductoCompra(nombre, precio, emoji, unidad, descripcion, _uiState.value.selectedCompraAlmacenId)
                _uiState.update { it.copy(snackbarMessage = "Insumo agregado", showAddProductCompraDialog = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al agregar insumo") }
            }
        }
    }

    fun agregarProductoExistenteACompras(productoId: String, precio: Double) {
        viewModelScope.launch {
            try {
                repo.agregarProductoExistenteACompras(productoId, precio, _uiState.value.selectedCompraAlmacenId)
                _uiState.update { it.copy(snackbarMessage = "Producto agregado al catalogo de compras") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al agregar insumo") }
            }
        }
    }

    fun agregarProductoBase(nombre: String, emoji: String, unidad: String, descripcion: String) {
        viewModelScope.launch {
            try {
                repo.agregarProductoBase(nombre, emoji, unidad, descripcion)
                _uiState.update { it.copy(snackbarMessage = "Producto agregado") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al agregar producto") }
            }
        }
    }

    fun actualizarProductoBase(id: String, nombre: String, emoji: String, unidad: String, descripcion: String) {
        viewModelScope.launch {
            try {
                repo.actualizarProductoBase(id, nombre, emoji, unidad, descripcion)
                _uiState.update { it.copy(snackbarMessage = "Producto actualizado") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al actualizar producto") }
            }
        }
    }

    suspend fun obtenerHistorialPreciosProducto(productoId: String): List<PrecioProductoDetalle> =
        repo.getHistorialPreciosProducto(productoId)

    fun deleteProductoBase(id: String) {
        viewModelScope.launch {
            try {
                repo.deleteProductoBase(id)
                _uiState.update { it.copy(snackbarMessage = "Producto eliminado permanentemente") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al eliminar producto") }
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

    fun actualizarPrecioProductoVenta(productoId: String, precio: Double) {
        viewModelScope.launch {
            try {
                repo.actualizarPrecioProductoVenta(productoId, precio, _uiState.value.selectedVentaAlmacenId)
                _uiState.update { it.copy(snackbarMessage = "Precio de venta actualizado") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al actualizar precio") }
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

    fun actualizarPrecioProductoCompra(productoId: String, precio: Double) {
        viewModelScope.launch {
            try {
                repo.actualizarPrecioProductoCompra(productoId, precio, _uiState.value.selectedCompraAlmacenId)
                _uiState.update { it.copy(snackbarMessage = "Precio de compra actualizado") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al actualizar precio") }
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

    fun transferirStock(almacenDestinoId: String, cantidad: Double, nota: String) {
        val item = _uiState.value.itemTransfiriendo ?: return
        viewModelScope.launch {
            try {
                repo.transferirStock(
                    productoId = item.productoId,
                    almacenOrigenId = item.almacenId,
                    almacenDestinoId = almacenDestinoId,
                    cantidad = cantidad,
                    nota = nota
                )
                _uiState.update {
                    it.copy(
                        showTransferDialog = false,
                        itemTransfiriendo = null,
                        snackbarMessage = "Transferencia registrada"
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "No se pudo transferir el stock") }
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

    fun setCartCantidad(producto: ProductoVenta, cantidad: Double) {
        if (cantidad <= 0.0) return
        _uiState.update { state ->
            val currentCart = state.cart.toMutableMap()
            currentCart[producto] = cantidad
            state.copy(cart = currentCart, showSaleSheet = true)
        }
    }

    fun setCartCompraCantidad(producto: ProductoCompra, cantidad: Double) {
        if (cantidad <= 0.0) return
        _uiState.update { state ->
            val currentCart = state.cartCompra.toMutableMap()
            currentCart[producto] = cantidad
            state.copy(cartCompra = currentCart, showPurchaseSheet = true)
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

    fun registrarVentaConDetalles(options: VentaCheckoutOptions) {
        viewModelScope.launch {
            val cart = _uiState.value.cart
            if (cart.isEmpty()) return@launch

            try {
                val tercero = _uiState.value.terceros.firstOrNull { it.id == options.terceroId }
                if (options.estadoCobro == EstadoCobroOperacion.PENDIENTE && tercero == null) {
                    throw IllegalStateException("Debes seleccionar un cliente si la venta queda pendiente")
                }
                val fecha = _uiState.value.fechaTrabajo.format(DateTimeFormatter.ISO_LOCAL_DATE)
                val totalOperacion = cart.entries.sumOf { (producto, cantidad) -> producto.precio * cantidad }
                val notaOperacion = encodeOperacionDetalle(
                    terceroNombre = tercero?.nombre,
                    terceroId = tercero?.id,
                    estadoPago = if (options.estadoCobro == EstadoCobroOperacion.INMEDIATO) "COBRADA" else "PENDIENTE",
                    formaPago = if (options.formaPago == FormaPago.EFECTIVO) "EFECTIVO" else "TARJETA",
                    idTransaccion = options.idTransaccion.trim().ifBlank { null },
                    nota = options.nota.trim().ifBlank { null },
                    documentoAdjunto = options.documentoUri ?: "",
                    facturaEmitida = options.emitirFactura
                )
                val (venta, lineas) = repo.registrarVenta(cart, fecha, notaOperacion)
                if (options.estadoCobro == EstadoCobroOperacion.PENDIENTE && tercero != null) {
                    tercerosRepository.crearCuentaDesdeOperacion(
                        terceroId = tercero.id,
                        tipoCuenta = TipoCuentaTercero.PRESTAMO,
                        categoria = RolTercero.CLIENTE,
                        concepto = "Venta pendiente de cobro",
                        montoOriginal = totalOperacion,
                        origenTipo = "VENTA",
                        origenId = venta.id,
                        descripcion = "Venta registrada desde el punto de venta",
                        nota = options.nota
                    )
                }
                ledgerRepository.registrarIngresoDesdePuntoVenta(
                    fechaIso = fecha,
                    total = totalOperacion
                )
                _uiState.update {
                    it.copy(
                        cart = emptyMap(),
                        showSaleSheet = false,
                        showVentaCheckoutDialog = false,
                        snackbarMessage = "Venta registrada con detalles",
                        ventaPendienteFactura = venta.takeIf { options.emitirFactura },
                        lineasVentaPendienteFactura = lineas.takeIf { options.emitirFactura }.orEmpty(),
                        datosFacturaPrefill = tercero?.let { terceroSeleccionado ->
                            DatosClienteFactura(
                                nombre = terceroSeleccionado.nombre,
                                ci = terceroSeleccionado.identificadorFiscal,
                                correo = terceroSeleccionado.correo,
                                direccion = terceroSeleccionado.direccion,
                                telefono = terceroSeleccionado.telefono
                            )
                        },
                        formaPagoFacturaPrefill = options.formaPago,
                        idTransaccionFacturaPrefill = options.idTransaccion.trim().ifBlank { null },
                        notaFacturaPrefill = options.nota.trim()
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

    fun registrarCompraConDetalles(options: CompraCheckoutOptions) {
        viewModelScope.launch {
            val cart = _uiState.value.cartCompra
            if (cart.isEmpty()) return@launch

            try {
                val tercero = _uiState.value.terceros.firstOrNull { it.id == options.terceroId }
                if (options.estadoPago == EstadoCobroOperacion.PENDIENTE && tercero == null) {
                    throw IllegalStateException("Debes seleccionar un proveedor si la compra queda pendiente")
                }
                val fecha = _uiState.value.fechaTrabajo.format(DateTimeFormatter.ISO_LOCAL_DATE)
                val totalOperacion = cart.entries.sumOf { (producto, cantidad) -> producto.precio * cantidad }
                val notaOperacion = encodeOperacionDetalle(
                    terceroNombre = tercero?.nombre,
                    terceroId = tercero?.id,
                    estadoPago = if (options.estadoPago == EstadoCobroOperacion.INMEDIATO) "PAGADA" else "PENDIENTE",
                    nota = options.nota.trim().ifBlank { null },
                    documentoAdjunto = options.documentoUri ?: "",
                    facturaProveedor = options.registrarFacturaProveedor
                )
                val (compra, _) = repo.registrarCompra(cart, fecha, notaOperacion)
                if (options.estadoPago == EstadoCobroOperacion.PENDIENTE && tercero != null) {
                    tercerosRepository.crearCuentaDesdeOperacion(
                        terceroId = tercero.id,
                        tipoCuenta = TipoCuentaTercero.DEUDA,
                        categoria = RolTercero.PROVEEDOR,
                        concepto = "Compra pendiente de pago",
                        montoOriginal = totalOperacion,
                        origenTipo = "COMPRA",
                        origenId = compra.id,
                        descripcion = "Compra registrada desde el punto de venta",
                        nota = options.nota
                    )
                }
                ledgerRepository.registrarGastoDesdePuntoVenta(
                    fechaIso = fecha,
                    total = totalOperacion
                )
                _uiState.update {
                    it.copy(
                        cartCompra = emptyMap(),
                        showPurchaseSheet = false,
                        showCompraCheckoutDialog = false,
                        snackbarMessage = "Compra registrada con detalles"
                    )
                }
                cargarComprasDelMes(_uiState.value.mesActual)
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = e.message ?: "Error al registrar compra") }
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

    fun showVentaCheckoutDialog(show: Boolean) {
        _uiState.update { it.copy(showVentaCheckoutDialog = show) }
    }

    fun showCompraCheckoutDialog(show: Boolean) {
        _uiState.update { it.copy(showCompraCheckoutDialog = show) }
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

    fun clearVentaPendienteFactura() {
        _uiState.update {
            it.copy(
                ventaPendienteFactura = null,
                lineasVentaPendienteFactura = emptyList(),
                datosFacturaPrefill = null,
                formaPagoFacturaPrefill = FormaPago.EFECTIVO,
                idTransaccionFacturaPrefill = null,
                notaFacturaPrefill = ""
            )
        }
    }

    fun getDetalleOperacion(referenciaId: String): OperacionDetalleResumen? {
        val raw = _uiState.value.movimientosInventario.firstOrNull { it.referenciaId == referenciaId }?.nota
        return decodeOperacionDetalle(raw)
    }

    private fun encodeOperacionDetalle(
        terceroNombre: String? = null,
        terceroId: String? = null,
        estadoPago: String? = null,
        formaPago: String? = null,
        idTransaccion: String? = null,
        nota: String? = null,
        documentoAdjunto: String = "",
        facturaEmitida: Boolean = false,
        facturaProveedor: Boolean = false
    ): String {
        val json = JSONObject()
        terceroNombre?.takeIf { it.isNotBlank() }?.let { json.put("terceroNombre", it) }
        terceroId?.takeIf { it.isNotBlank() }?.let { json.put("terceroId", it) }
        estadoPago?.takeIf { it.isNotBlank() }?.let { json.put("estadoPago", it) }
        formaPago?.takeIf { it.isNotBlank() }?.let { json.put("formaPago", it) }
        idTransaccion?.takeIf { it.isNotBlank() }?.let { json.put("idTransaccion", it) }
        nota?.takeIf { it.isNotBlank() }?.let { json.put("nota", it) }
        documentoAdjunto.takeIf { it.isNotBlank() }?.let { json.put("documentoAdjunto", it) }
        if (facturaEmitida) json.put("facturaEmitida", true)
        if (facturaProveedor) json.put("facturaProveedor", true)
        return if (json.length() == 0) "" else "detalle_operacion::${json}"
    }

    private fun decodeOperacionDetalle(raw: String?): OperacionDetalleResumen? {
        if (raw.isNullOrBlank() || !raw.startsWith("detalle_operacion::")) return null
        return runCatching {
            val json = JSONObject(raw.removePrefix("detalle_operacion::"))
            OperacionDetalleResumen(
                terceroNombre = json.optString("terceroNombre").ifBlank { null },
                terceroId = json.optString("terceroId").ifBlank { null },
                estadoPago = json.optString("estadoPago").ifBlank { null },
                formaPago = json.optString("formaPago").ifBlank { null },
                idTransaccion = json.optString("idTransaccion").ifBlank { null },
                nota = json.optString("nota").ifBlank { null },
                documentoAdjunto = json.optString("documentoAdjunto", "").ifBlank { "" },
                facturaEmitida = json.optBoolean("facturaEmitida", false),
                facturaProveedor = json.optBoolean("facturaProveedor", false)
            )
        }.getOrNull()
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
