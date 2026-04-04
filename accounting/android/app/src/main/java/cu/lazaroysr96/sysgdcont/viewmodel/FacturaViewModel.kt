package cu.lazaroysr96.sysgdcont.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.model.FormaPago
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Venta
import cu.lazaroysr96.sysgdcont.data.repository.FacturaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FacturaUiState(
    val showDialog: Boolean = false,
    val venta: Venta? = null,
    val lineasVenta: List<LineaVenta> = emptyList(),
    val snackbarMessage: String? = null,
    val pdfPath: String? = null
)

@HiltViewModel
class FacturaViewModel @Inject constructor(
    private val facturaRepository: FacturaRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(FacturaUiState())
    val uiState: StateFlow<FacturaUiState> = _uiState.asStateFlow()

    fun showFacturaDialog(venta: Venta, lineas: List<LineaVenta>) {
        _uiState.update { it.copy(showDialog = true, venta = venta, lineasVenta = lineas) }
    }

    fun hideDialog() {
        _uiState.update { it.copy(showDialog = false, pdfPath = null) }
    }

    fun generarFactura(
        nombreCliente: String,
        ciCliente: String,
        direccionCliente: String,
        telefonoCliente: String,
        formaPago: FormaPago,
        idTransaccion: String?
    ) {
        val state = _uiState.value
        val venta = state.venta ?: return

        viewModelScope.launch {
            try {
                val pdfPath = facturaRepository.generarFacturaPdf(
                    venta = venta,
                    lineasVenta = state.lineasVenta,
                    nombreCliente = nombreCliente,
                    ciCliente = ciCliente,
                    direccionCliente = direccionCliente,
                    telefonoCliente = telefonoCliente,
                    formaPago = formaPago,
                    idTransaccion = idTransaccion
                )
                _uiState.update { 
                    it.copy(
                        snackbarMessage = "Factura generada: $pdfPath",
                        pdfPath = pdfPath,
                        showDialog = false
                    ) 
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error: ${e.message}") }
            }
        }
    }

    fun clearSnackbar() {
        _uiState.update { it.copy(snackbarMessage = null) }
    }
}
