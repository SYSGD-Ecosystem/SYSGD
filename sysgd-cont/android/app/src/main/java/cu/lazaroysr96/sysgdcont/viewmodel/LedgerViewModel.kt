package cu.lazaroysr96.sysgdcont.viewmodel

import android.content.Intent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.model.*
import cu.lazaroysr96.sysgdcont.data.repository.LedgerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LedgerUiState(
    val isLoading: Boolean = false,
    val registro: RegistroTCP = RegistroTCP(),
    val annualReport: AnnualReport? = null,
    val lastSync: String? = null,
    val isSyncing: Boolean = false,
    val syncError: String? = null,
    val syncSuccess: Boolean = false,
    val syncMessage: String? = null,
    val isDownloadingPdf: Boolean = false,
    val pdfError: String? = null,
    val pdfIntent: Intent? = null
)

@HiltViewModel
class LedgerViewModel @Inject constructor(
    private val ledgerRepository: LedgerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LedgerUiState())
    val uiState: StateFlow<LedgerUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            ledgerRepository.registro.collect { registro ->
                val report = ledgerRepository.calculateAnnualReport(registro)
                _uiState.update { it.copy(registro = registro, annualReport = report) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.lastSync.collect { sync ->
                _uiState.update { it.copy(lastSync = sync) }
            }
        }
    }

    fun updateGenerales(data: GeneralesData) {
        viewModelScope.launch {
            ledgerRepository.updateGenerales(data)
        }
    }

    fun addIngreso(month: String, dia: Int, importe: Double) {
        viewModelScope.launch {
            ledgerRepository.addIngreso(month, dia, importe)
        }
    }

    fun addGasto(month: String, dia: Int, importe: Double) {
        viewModelScope.launch {
            ledgerRepository.addGasto(month, dia, importe)
        }
    }

    fun updateTributos(month: String, values: TributoRow) {
        viewModelScope.launch {
            ledgerRepository.updateTributos(month, values)
        }
    }

    fun syncPull() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSyncing = true, syncError = null, syncSuccess = false) }
            
            ledgerRepository.pull()
                .onSuccess {
                    _uiState.update { it.copy(isSyncing = false, syncSuccess = true) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isSyncing = false, syncError = e.message) }
                }
        }
    }

    fun syncPush() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSyncing = true, syncError = null, syncSuccess = false) }
            
            ledgerRepository.push()
                .onSuccess {
                    _uiState.update { it.copy(isSyncing = false, syncSuccess = true) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isSyncing = false, syncError = e.message) }
                }
        }
    }

    fun sync() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSyncing = true, syncError = null, syncSuccess = false, syncMessage = null) }
            
            ledgerRepository.sync()
                .onSuccess { result ->
                    // Forzar actualización del registro en la UI
                    val updatedRegistro = ledgerRepository.getRegistro()
                    val updatedReport = ledgerRepository.calculateAnnualReport(updatedRegistro)
                    
                    _uiState.update { 
                        it.copy(
                            isSyncing = false, 
                            syncSuccess = true,
                            syncMessage = result.message,
                            registro = updatedRegistro,
                            annualReport = updatedReport
                        ) 
                    }
                }
                .onFailure { e ->
                    _uiState.update { 
                        it.copy(
                            isSyncing = false, 
                            syncError = e.message
                        ) 
                    }
                }
        }
    }

    fun clearSyncStatus() {
        _uiState.update { it.copy(syncError = null, syncSuccess = false) }
    }

    fun downloadPdf() {
        viewModelScope.launch {
            _uiState.update { it.copy(isDownloadingPdf = true, pdfError = null, pdfIntent = null) }

            ledgerRepository.downloadPdf()
                .onSuccess { intent ->
                    _uiState.update { it.copy(isDownloadingPdf = false, pdfIntent = intent) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isDownloadingPdf = false, pdfError = e.message) }
                }
        }
    }

    fun clearPdfIntent() {
        _uiState.update { it.copy(pdfIntent = null) }
    }
}
