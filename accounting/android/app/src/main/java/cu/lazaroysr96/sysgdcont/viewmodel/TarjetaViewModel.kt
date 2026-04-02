package cu.lazaroysr96.sysgdcont.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.model.Tarjeta
import cu.lazaroysr96.sysgdcont.data.repository.TarjetaRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TarjetaUiState(
    val tarjetas: List<Tarjeta> = emptyList(),
    val isLoading: Boolean = false,
    val snackbarMessage: String? = null,
    val showAddDialog: Boolean = false,
    val showQRDialog: Boolean = false,
    val showScanDialog: Boolean = false,
    val tarjetaSeleccionada: Tarjeta? = null
)

@HiltViewModel
class TarjetaViewModel @Inject constructor(
    private val repo: TarjetaRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TarjetaUiState())
    val uiState: StateFlow<TarjetaUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repo.getAll().collect { tarjetas ->
                _uiState.update { it.copy(tarjetas = tarjetas, isLoading = false) }
            }
        }
    }

    fun agregarTarjeta(nombre: String, numero: String, telefono: String) {
        viewModelScope.launch {
            try {
                repo.agregarTarjeta(nombre, numero, telefono)
                _uiState.update { it.copy(snackbarMessage = "Tarjeta guardada", showAddDialog = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al guardar tarjeta") }
            }
        }
    }

    fun eliminarTarjeta(id: String) {
        viewModelScope.launch {
            try {
                repo.eliminarTarjeta(id)
                _uiState.update { it.copy(snackbarMessage = "Tarjeta eliminada") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al eliminar") }
            }
        }
    }

    fun toggleFavorita(tarjeta: Tarjeta) {
        viewModelScope.launch {
            try {
                repo.toggleFavorita(tarjeta.id, !tarjeta.esFavorita)
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al actualizar") }
            }
        }
    }

    fun showAddDialog(show: Boolean) {
        _uiState.update { it.copy(showAddDialog = show) }
    }

    fun showQRDialog(tarjeta: Tarjeta?) {
        _uiState.update { it.copy(showQRDialog = tarjeta != null, tarjetaSeleccionada = tarjeta) }
    }

    fun showScanDialog(show: Boolean) {
        _uiState.update { it.copy(showScanDialog = show) }
    }

    fun guardarDesdeQR(content: String) {
        viewModelScope.launch {
            val tarjeta = repo.parseQRContent(content)
            if (tarjeta != null) {
                repo.agregarTarjeta(tarjeta.nombre, tarjeta.numero, tarjeta.telefono)
                _uiState.update { it.copy(snackbarMessage = "Tarjeta escaneada guardada", showScanDialog = false) }
            } else {
                _uiState.update { it.copy(snackbarMessage = "QR no válido") }
            }
        }
    }

    fun getQRContent(tarjeta: Tarjeta): String = repo.generarQRContent(tarjeta)

    fun clearSnackbar() {
        _uiState.update { it.copy(snackbarMessage = null) }
    }
}
