package cu.lazaroysr96.sysgdcont.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.model.RolTercero
import cu.lazaroysr96.sysgdcont.data.model.TerceroCuentaListItem
import cu.lazaroysr96.sysgdcont.data.model.TerceroListItem
import cu.lazaroysr96.sysgdcont.data.model.TipoCuentaTercero
import cu.lazaroysr96.sysgdcont.data.repository.TercerosRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class TercerosSection {
    TODOS,
    CLIENTES,
    PROVEEDORES,
    EMPLEADOS,
    DEUDAS,
    PRESTAMOS
}

data class TercerosUiState(
    val terceros: List<TerceroListItem> = emptyList(),
    val cuentas: List<TerceroCuentaListItem> = emptyList(),
    val totalDeudas: Double = 0.0,
    val totalPrestamos: Double = 0.0,
    val isLoading: Boolean = true,
    val snackbarMessage: String? = null,
    val selectedSection: TercerosSection = TercerosSection.TODOS,
    val showAddTerceroDialog: Boolean = false,
    val showAddCuentaDialog: Boolean = false,
    val showEditTerceroDialog: Boolean = false,
    val showEditCuentaDialog: Boolean = false,
    val terceroEnEdicion: TerceroListItem? = null,
    val cuentaEnEdicion: TerceroCuentaListItem? = null,
    val showAbonarDialog: Boolean = false,     // ← NUEVO
    val cuentaAAbonar: TerceroCuentaListItem? = null,  // ← NUEVO
) {
    val totalClientes: Int
        get() = terceros.count { RolTercero.CLIENTE in it.rolesList }

    val totalProveedores: Int
        get() = terceros.count { RolTercero.PROVEEDOR in it.rolesList }

    val totalEmpleados: Int
        get() = terceros.count { RolTercero.EMPLEADO in it.rolesList }

    val cuentasDeuda: List<TerceroCuentaListItem>
        get() = cuentas.filter { it.tipoCuenta == TipoCuentaTercero.DEUDA }

    val cuentasPrestamo: List<TerceroCuentaListItem>
        get() = cuentas.filter { it.tipoCuenta == TipoCuentaTercero.PRESTAMO }
}

@HiltViewModel
class TercerosViewModel @Inject constructor(
    private val repository: TercerosRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TercerosUiState())
    val uiState: StateFlow<TercerosUiState> = _uiState.asStateFlow()

    init {
        observeData()
    }

    private fun observeData() {
        viewModelScope.launch {
            repository.observeTerceros().collect { terceros ->
                _uiState.update {
                    it.copy(
                        terceros = terceros,
                        isLoading = false
                    )
                }
            }
        }
        viewModelScope.launch {
            repository.observeCuentas().collect { cuentas ->
                _uiState.update { it.copy(cuentas = cuentas, isLoading = false) }
            }
        }
        viewModelScope.launch {
            repository.observeTotalDeudas().collect { total ->
                _uiState.update { it.copy(totalDeudas = total, isLoading = false) }
            }
        }
        viewModelScope.launch {
            repository.observeTotalPrestamos().collect { total ->
                _uiState.update { it.copy(totalPrestamos = total, isLoading = false) }
            }
        }
    }

    // 3. TercerosViewModel — agregar métodos nuevos:

   fun showAbonarDialog(cuenta: TerceroCuentaListItem) {
       _uiState.update { it.copy(showAbonarDialog = true, cuentaAAbonar = cuenta) }
   }

   fun dismissAbonarDialog() {
       _uiState.update { it.copy(showAbonarDialog = false, cuentaAAbonar = null) }
   }

    fun registrarAbono(cuentaId: String, monto: String, nota: String) {
        val montoDouble = monto.toDoubleOrNull() ?: run {
            _uiState.update { it.copy(snackbarMessage = "Monto inválido") }
            return
        }
        viewModelScope.launch {
            runCatching {
                repository.abonarCuenta(cuentaId, montoDouble, nota)
            }.onSuccess {
                dismissAbonarDialog()
                _uiState.update { it.copy(snackbarMessage = "Abono registrado") }
            }.onFailure { error ->
                _uiState.update { it.copy(snackbarMessage = error.message ?: "No se pudo registrar el abono") }
            }
        }
    }

    fun archivarCuenta(cuentaId: String) {
        viewModelScope.launch {
            runCatching {
                repository.archivarCuenta(cuentaId)
            }.onSuccess {
                _uiState.update { it.copy(snackbarMessage = "Cuenta archivada") }
            }.onFailure { error ->
                _uiState.update { it.copy(snackbarMessage = error.message ?: "No se pudo archivar la cuenta") }
            }
        }
    }

    fun selectSection(section: TercerosSection) {
        _uiState.update { it.copy(selectedSection = section) }
    }

    fun showAddTerceroDialog(show: Boolean) {
        _uiState.update { it.copy(showAddTerceroDialog = show) }
    }

    fun showAddCuentaDialog(show: Boolean) {
        _uiState.update { it.copy(showAddCuentaDialog = show) }
    }

    fun showEditTerceroDialog(tercero: TerceroListItem?) {
        _uiState.update {
            it.copy(
                showEditTerceroDialog = tercero != null,
                terceroEnEdicion = tercero
            )
        }
    }

    fun showEditCuentaDialog(cuenta: TerceroCuentaListItem?) {
        _uiState.update {
            it.copy(
                showEditCuentaDialog = cuenta != null,
                cuentaEnEdicion = cuenta
            )
        }
    }

    fun crearTercero(
        nombre: String,
        tipoEntidad: String,
        roles: Set<String>,
        telefono: String,
        correo: String,
        direccion: String,
        identificadorFiscal: String,
        numeroTarjeta: String,
        direccionCrypto: String,
        nota: String
    ) {
        viewModelScope.launch {
            runCatching {
                repository.crearTercero(
                    nombre = nombre,
                    tipoEntidad = tipoEntidad,
                    roles = roles,
                    telefono = telefono,
                    correo = correo,
                    direccion = direccion,
                    identificadorFiscal = identificadorFiscal,
                    numeroTarjeta = numeroTarjeta,
                    direccionCrypto = direccionCrypto,
                    nota = nota
                )
            }.onSuccess {
                _uiState.update {
                    it.copy(
                        showAddTerceroDialog = false,
                        snackbarMessage = "Tercero guardado"
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(snackbarMessage = error.message ?: "No se pudo guardar el tercero")
                }
            }
        }
    }

    fun crearCuenta(
        terceroId: String,
        tipoCuenta: String,
        categoria: String,
        concepto: String,
        montoOriginal: String,
        fechaVencimiento: String,
        moneda: String,
        descripcion: String,
        nota: String
    ) {
        viewModelScope.launch {
            val amount = montoOriginal.replace(",", ".").toDoubleOrNull()
            if (amount == null) {
                _uiState.update { it.copy(snackbarMessage = "Monto no válido") }
                return@launch
            }

            runCatching {
                repository.crearCuenta(
                    terceroId = terceroId,
                    tipoCuenta = tipoCuenta,
                    categoria = categoria,
                    concepto = concepto,
                    montoOriginal = amount,
                    fechaVencimiento = fechaVencimiento,
                    moneda = moneda,
                    descripcion = descripcion,
                    nota = nota
                )
            }.onSuccess {
                _uiState.update {
                    it.copy(
                        showAddCuentaDialog = false,
                        snackbarMessage = "Cuenta registrada"
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(snackbarMessage = error.message ?: "No se pudo registrar la cuenta")
                }
            }
        }
    }

    fun actualizarTercero(
        terceroId: String,
        nombre: String,
        tipoEntidad: String,
        roles: Set<String>,
        telefono: String,
        correo: String,
        direccion: String,
        identificadorFiscal: String,
        numeroTarjeta: String,
        direccionCrypto: String,
        nota: String
    ) {
        viewModelScope.launch {
            runCatching {
                repository.actualizarTercero(
                    terceroId = terceroId,
                    nombre = nombre,
                    tipoEntidad = tipoEntidad,
                    roles = roles,
                    telefono = telefono,
                    correo = correo,
                    direccion = direccion,
                    identificadorFiscal = identificadorFiscal,
                    numeroTarjeta = numeroTarjeta,
                    direccionCrypto = direccionCrypto,
                    nota = nota
                )
            }.onSuccess {
                _uiState.update {
                    it.copy(
                        showEditTerceroDialog = false,
                        terceroEnEdicion = null,
                        snackbarMessage = "Tercero actualizado"
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(snackbarMessage = error.message ?: "No se pudo actualizar el tercero")
                }
            }
        }
    }

    fun actualizarCuenta(
        cuentaId: String,
        categoria: String,
        concepto: String,
        descripcion: String,
        fechaVencimiento: String,
        estado: String,
        moneda: String,
        nota: String
    ) {
        viewModelScope.launch {
            runCatching {
                repository.actualizarCuenta(
                    cuentaId = cuentaId,
                    categoria = categoria,
                    concepto = concepto,
                    descripcion = descripcion,
                    fechaVencimiento = fechaVencimiento,
                    estado = estado,
                    moneda = moneda,
                    nota = nota
                )
            }.onSuccess {
                _uiState.update {
                    it.copy(
                        showEditCuentaDialog = false,
                        cuentaEnEdicion = null,
                        snackbarMessage = "Cuenta actualizada"
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(snackbarMessage = error.message ?: "No se pudo actualizar la cuenta")
                }
            }
        }
    }

    fun archiveTercero(terceroId: String) {
        viewModelScope.launch {
            runCatching {
                repository.archivarTercero(terceroId)
            }.onSuccess {
                _uiState.update { it.copy(snackbarMessage = "Tercero archivado") }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(snackbarMessage = error.message ?: "No se pudo archivar")
                }
            }
        }
    }

    fun formatCurrency(amount: Double, currency: String = "CUP"): String {
        return repository.formatCurrency(amount, currency)
    }

    fun clearSnackbar() {
        _uiState.update { it.copy(snackbarMessage = null) }
    }
}
