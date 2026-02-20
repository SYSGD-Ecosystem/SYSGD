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
    val hasLocalChanges: Boolean = false,
    val isSyncing: Boolean = false,
    val syncError: String? = null,
    val syncSuccess: Boolean = false,
    val syncMessage: String? = null,
    val pendingSyncDecision: SyncResult? = null,
    val isDownloadingPdf: Boolean = false,
    val pdfError: String? = null,
    val pdfIntent: Intent? = null,
    val pdfRetryMessage: String? = null
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
        viewModelScope.launch {
            ledgerRepository.localModified.collect { modified ->
                _uiState.update { it.copy(hasLocalChanges = modified) }
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

    fun editIngreso(month: String, oldDia: Int, newDia: Int, importe: Double) {
        viewModelScope.launch {
            ledgerRepository.updateIngreso(month, oldDia, newDia, importe)
        }
    }

    fun editGasto(month: String, oldDia: Int, newDia: Int, importe: Double) {
        viewModelScope.launch {
            ledgerRepository.updateGasto(month, oldDia, newDia, importe)
        }
    }

    fun deleteIngreso(month: String, dia: Int) {
        viewModelScope.launch {
            ledgerRepository.deleteIngreso(month, dia)
        }
    }

    fun deleteGasto(month: String, dia: Int) {
        viewModelScope.launch {
            ledgerRepository.deleteGasto(month, dia)
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
                    if (result.needsUserDecision) {
                        _uiState.update {
                            it.copy(
                                isSyncing = false,
                                syncMessage = result.message,
                                pendingSyncDecision = result
                            )
                        }
                    } else {
                        val updatedRegistro = ledgerRepository.getRegistro()
                        val updatedReport = ledgerRepository.calculateAnnualReport(updatedRegistro)

                        _uiState.update {
                            it.copy(
                                isSyncing = false,
                                syncSuccess = true,
                                syncMessage = result.message,
                                pendingSyncDecision = null,
                                registro = updatedRegistro,
                                annualReport = updatedReport
                            )
                        }
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

    fun dismissSyncDecision() {
        _uiState.update { it.copy(pendingSyncDecision = null) }
    }

    fun confirmUseRemote() {
        val decision = _uiState.value.pendingSyncDecision ?: return
        val remote = decision.remoteRegistro ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(isSyncing = true, syncError = null, pendingSyncDecision = null) }
            ledgerRepository.resolveWithRemote(remote, decision.remoteVersion)
                .onSuccess { result -> applySyncResult(result) }
                .onFailure { e ->
                    _uiState.update { it.copy(isSyncing = false, syncError = e.message) }
                }
        }
    }

    fun confirmUseLocal() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSyncing = true, syncError = null, pendingSyncDecision = null) }
            ledgerRepository.resolveWithLocal()
                .onSuccess { result -> applySyncResult(result) }
                .onFailure { e ->
                    _uiState.update { it.copy(isSyncing = false, syncError = e.message) }
                }
        }
    }

    fun confirmUseMerge() {
        val merged = _uiState.value.pendingSyncDecision?.mergedRegistro ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(isSyncing = true, syncError = null, pendingSyncDecision = null) }
            ledgerRepository.resolveWithMerge(merged)
                .onSuccess { result -> applySyncResult(result) }
                .onFailure { e ->
                    _uiState.update { it.copy(isSyncing = false, syncError = e.message) }
                }
        }
    }

    private suspend fun applySyncResult(result: SyncResult) {
        val updatedRegistro = ledgerRepository.getRegistro()
        val updatedReport = ledgerRepository.calculateAnnualReport(updatedRegistro)
        _uiState.update {
            it.copy(
                isSyncing = false,
                syncSuccess = true,
                syncMessage = result.message,
                pendingSyncDecision = null,
                registro = updatedRegistro,
                annualReport = updatedReport
            )
        }
    }

    fun clearSyncStatus() {
        _uiState.update { it.copy(syncError = null, syncSuccess = false, syncMessage = null) }
    }

    fun downloadPdf() {
        viewModelScope.launch {
            _uiState.update { it.copy(isDownloadingPdf = true, pdfError = null, pdfIntent = null, pdfRetryMessage = null) }

            ledgerRepository.downloadPdf { message ->
                _uiState.update { it.copy(pdfRetryMessage = message) }
            }
                .onSuccess { intent ->
                    _uiState.update { it.copy(isDownloadingPdf = false, pdfIntent = intent, pdfRetryMessage = null) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isDownloadingPdf = false, pdfError = e.message, pdfRetryMessage = null) }
                }
        }
    }

    fun clearPdfIntent() {
        _uiState.update { it.copy(pdfIntent = null) }
    }
}
