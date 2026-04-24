package cu.lazaroysr96.sysgdcont.viewmodel

import android.content.Intent
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.model.*
import cu.lazaroysr96.sysgdcont.data.repository.InsufficientCreditsException
import cu.lazaroysr96.sysgdcont.data.repository.LedgerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LedgerUiState(
    val isLoading: Boolean = false,
    val registro: RegistroTCP = RegistroTCP(),
    val annualReport: AnnualReport? = null,
    val cuentasContables: List<CuentaContable> = emptyList(),
    val cuentasIngreso: List<CuentaContable> = emptyList(),
    val cuentasGasto: List<CuentaContable> = emptyList(),
    val saldoPorCuentaId: Map<String, Double> = emptyMap(),
    val cuentaPorAsientoId: Map<String, String> = emptyMap(),
    val notaPorAsientoId: Map<String, String> = emptyMap(),
    val tributoConfigs: List<TributoConfig> = emptyList(),
    val tributoCuentaBases: List<TributoCuentaBase> = emptyList(),
    val workspaceProfiles: List<WorkspaceProfile> = emptyList(),
    val currentWorkspaceId: String = "",
    val posIntegrationConfig: PosIntegrationConfig = PosIntegrationConfig(
        ingresoCuentaId = CuentasContablesPorDefecto.ingresosVentas().id,
        gastoCuentaId = CuentasContablesPorDefecto.gastosActividad().id
    ),
    val lastSync: String? = null,
    val hasLocalChanges: Boolean = false,
    val experimentalFeaturesEnabled: Boolean = false,
    val hideInventarioDisclaimer: Boolean = false,
    val isSyncing: Boolean = false,
    val syncError: String? = null,
    val syncSuccess: Boolean = false,
    val syncMessage: String? = null,
    val pendingSyncDecision: SyncResult? = null,
    val isDownloadingPdf: Boolean = false,
    val isDownloadingOfflinePdf: Boolean = false,
    val pdfError: String? = null,
    val pdfIntent: Intent? = null,
    val pdfRetryMessage: String? = null,
    val showNoCreditsDialog: Boolean = false,
    val noCreditsMessage: String? = null,
    val backupMessage: String? = null,
    val backupError: String? = null
)

@HiltViewModel
class LedgerViewModel @Inject constructor(
    private val ledgerRepository: LedgerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LedgerUiState())
    val uiState: StateFlow<LedgerUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            ledgerRepository.ensureDefaultAccounts()
        }
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
        viewModelScope.launch {
            ledgerRepository.experimentalFeaturesEnabled.collect { enabled ->
                _uiState.update { it.copy(experimentalFeaturesEnabled = enabled) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.hideInventarioDisclaimer.collect { hide ->
                _uiState.update { it.copy(hideInventarioDisclaimer = hide) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.cuentasContables.collect { cuentas ->
                _uiState.update { it.copy(cuentasContables = cuentas) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.cuentasIngreso.collect { cuentas ->
                _uiState.update { it.copy(cuentasIngreso = cuentas) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.cuentasGasto.collect { cuentas ->
                _uiState.update { it.copy(cuentasGasto = cuentas) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.ingresoGastoCuentas.collect { links ->
                _uiState.update { it.copy(cuentaPorAsientoId = links.associate { link -> link.ingresoGastoId to link.cuentaId }) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.ingresoGastoNotas.collect { notas ->
                _uiState.update { it.copy(notaPorAsientoId = notas.associate { nota -> nota.ingresoGastoId to nota.nota }) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.saldoPorCuenta.collect { saldos ->
                _uiState.update { it.copy(saldoPorCuentaId = saldos) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.tributoConfigs.collect { configs ->
                _uiState.update { it.copy(tributoConfigs = configs) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.tributoCuentaBases.collect { relaciones ->
                _uiState.update { it.copy(tributoCuentaBases = relaciones) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.posIntegrationConfig.collect { config ->
                _uiState.update { it.copy(posIntegrationConfig = config) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.workspaceProfiles.collect { workspaces ->
                _uiState.update { it.copy(workspaceProfiles = workspaces) }
            }
        }
        viewModelScope.launch {
            ledgerRepository.currentWorkspaceId.collect { workspaceId ->
                _uiState.update { it.copy(currentWorkspaceId = workspaceId) }
            }
        }
    }

    fun updateGenerales(data: GeneralesData) {
        viewModelScope.launch {
            ledgerRepository.updateGenerales(data)
        }
    }

    fun addIngreso(month: String, dia: Int, importe: Double, cuenta: String = "", nota: String = "") {
        viewModelScope.launch {
            ledgerRepository.addIngreso(month, dia, importe, cuenta, nota)
        }
    }

    fun addGasto(month: String, dia: Int, importe: Double, cuenta: String = "", nota: String = "") {
        viewModelScope.launch {
            ledgerRepository.addGasto(month, dia, importe, cuenta, nota)
        }
    }

    fun registrarOperacionRapida(
        month: String,
        dia: Int,
        ingreso: Double?,
        ingresoCuentaId: String = "",
        gasto: Double?,
        gastoCuentaId: String = "",
        nota: String = ""
    ) {
        viewModelScope.launch {
            ledgerRepository.registrarOperacionRapida(
                month = month,
                dia = dia,
                ingreso = ingreso,
                ingresoCuentaId = ingresoCuentaId,
                gasto = gasto,
                gastoCuentaId = gastoCuentaId,
                nota = nota
            )
        }
    }

    fun editIngreso(month: String, oldDia: Int, newDia: Int, importe: Double, cuenta: String = "", nota: String = "") {
        viewModelScope.launch {
            ledgerRepository.updateIngreso(month, oldDia, newDia, importe, cuenta, nota)
        }
    }

    fun editIngresoById(entryId: String, month: String, newDia: Int, importe: Double, cuenta: String = "", nota: String = "") {
        viewModelScope.launch {
            ledgerRepository.updateIngresoById(entryId, month, newDia, importe, cuenta, nota)
        }
    }

    fun editGasto(month: String, oldDia: Int, newDia: Int, importe: Double, cuenta: String = "", nota: String = "") {
        viewModelScope.launch {
            ledgerRepository.updateGasto(month, oldDia, newDia, importe, cuenta, nota)
        }
    }

    fun editGastoById(entryId: String, month: String, newDia: Int, importe: Double, cuenta: String = "", nota: String = "") {
        viewModelScope.launch {
            ledgerRepository.updateGastoById(entryId, month, newDia, importe, cuenta, nota)
        }
    }

    fun deleteIngreso(month: String, dia: Int) {
        viewModelScope.launch {
            ledgerRepository.deleteIngreso(month, dia)
        }
    }

    fun deleteIngresoById(month: String, entryId: String) {
        viewModelScope.launch {
            ledgerRepository.deleteIngresoById(month, entryId)
        }
    }

    fun deleteGasto(month: String, dia: Int) {
        viewModelScope.launch {
            ledgerRepository.deleteGasto(month, dia)
        }
    }

    fun deleteGastoById(month: String, entryId: String) {
        viewModelScope.launch {
            ledgerRepository.deleteGastoById(month, entryId)
        }
    }

    fun setHideInventarioDisclaimer(hide: Boolean) {
        viewModelScope.launch {
            ledgerRepository.setHideInventarioDisclaimer(hide)
        }
    }

    fun crearCuentaContable(
        codigo: String,
        nombre: String,
        naturaleza: String,
        tipo: String
    ) {
        viewModelScope.launch {
            ledgerRepository.crearCuentaContable(codigo, nombre, naturaleza, tipo)
        }
    }

    fun actualizarConfiguracionPos(
        enabled: Boolean,
        ingresoCuentaId: String?,
        gastoCuentaId: String?
    ) {
        viewModelScope.launch {
            ledgerRepository.updatePosIntegrationConfig(enabled, ingresoCuentaId, gastoCuentaId)
        }
    }

    fun updateTributos(month: String, values: TributoRow) {
        viewModelScope.launch {
            ledgerRepository.updateTributos(month, values)
        }
    }

    fun actualizarTributoConfig(
        key: String,
        incluido: Boolean,
        autocalcular: Boolean,
        porcentaje: Double,
        cuentaIds: List<String>
    ) {
        viewModelScope.launch {
            ledgerRepository.updateTributoConfig(
                key = key,
                incluido = incluido,
                autocalcular = autocalcular,
                porcentaje = porcentaje,
                cuentaIds = cuentaIds
            )
        }
    }

    fun createWorkspace(nombre: String) {
        viewModelScope.launch {
            ledgerRepository.createWorkspace(nombre)
        }
    }

    fun switchWorkspace(workspaceId: String) {
        viewModelScope.launch {
            ledgerRepository.switchWorkspace(workspaceId)
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

    fun autoSyncOnFirstLogin() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSyncing = true, syncError = null, syncSuccess = false, syncMessage = null) }
            
            ledgerRepository.autoSyncOnFirstLogin()
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
                                syncSuccess = result.action != cu.lazaroysr96.sysgdcont.data.model.SyncAction.NO_CHANGES,
                                syncMessage = if (result.action == cu.lazaroysr96.sysgdcont.data.model.SyncAction.NO_CHANGES) null else result.message,
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

    fun exportBackup(uri: Uri) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, backupMessage = null, backupError = null) }
            ledgerRepository.exportBackupToUri(uri)
                .onSuccess {
                    _uiState.update { it.copy(isLoading = false, backupMessage = "Backup JSON exportado correctamente.") }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, backupError = e.message ?: "No se pudo exportar el backup.") }
                }
        }
    }

    fun importBackup(uri: Uri, onSuccess: (() -> Unit)? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, backupMessage = null, backupError = null) }
            ledgerRepository.importBackupFromUri(uri)
                .onSuccess { registro ->
                    val report = ledgerRepository.calculateAnnualReport(registro)
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            registro = registro,
                            annualReport = report,
                            backupMessage = "Backup JSON importado correctamente."
                        )
                    }
                    onSuccess?.invoke()
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, backupError = e.message ?: "No se pudo importar el backup.") }
                }
        }
    }

    fun clearBackupStatus() {
        _uiState.update { it.copy(backupMessage = null, backupError = null) }
    }

    fun downloadPdf() {
        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isDownloadingPdf = true,
                    isDownloadingOfflinePdf = false,
                    pdfError = null,
                    pdfIntent = null,
                    pdfRetryMessage = null,
                    showNoCreditsDialog = false,
                    noCreditsMessage = null
                )
            }

            ledgerRepository.downloadPdf { message ->
                _uiState.update { it.copy(pdfRetryMessage = message) }
            }
                .onSuccess { intent ->
                    _uiState.update { it.copy(isDownloadingPdf = false, pdfIntent = intent, pdfRetryMessage = null) }
                }
                .onFailure { e ->
                    if (e is InsufficientCreditsException) {
                        _uiState.update {
                            it.copy(
                                isDownloadingPdf = false,
                                pdfRetryMessage = null,
                                showNoCreditsDialog = true,
                                noCreditsMessage = e.message
                            )
                        }
                    } else {
                        _uiState.update { it.copy(isDownloadingPdf = false, pdfError = e.message, pdfRetryMessage = null) }
                    }
                }
        }
    }

    fun downloadPdfOffline() {
        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isDownloadingPdf = false,
                    isDownloadingOfflinePdf = true,
                    pdfError = null,
                    pdfIntent = null,
                    pdfRetryMessage = "Modo experimental: generando PDF offline con la plantilla local.",
                    showNoCreditsDialog = false,
                    noCreditsMessage = null
                )
            }

            ledgerRepository.downloadPdfOffline()
                .onSuccess { intent ->
                    _uiState.update {
                        it.copy(
                            isDownloadingOfflinePdf = false,
                            pdfIntent = intent,
                            pdfRetryMessage = null
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(
                            isDownloadingOfflinePdf = false,
                            pdfError = e.message,
                            pdfRetryMessage = null
                        )
                    }
                }
        }
    }

    fun clearPdfIntent() {
        _uiState.update { it.copy(pdfIntent = null) }
    }

    fun setExperimentalFeaturesEnabled(enabled: Boolean) {
        viewModelScope.launch {
            ledgerRepository.setExperimentalFeaturesEnabled(enabled)
        }
    }

    fun dismissNoCreditsDialog() {
        _uiState.update { it.copy(showNoCreditsDialog = false, noCreditsMessage = null) }
    }
}
