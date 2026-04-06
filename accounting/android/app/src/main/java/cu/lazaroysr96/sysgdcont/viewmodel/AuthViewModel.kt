package cu.lazaroysr96.sysgdcont.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.model.AuthUser
import cu.lazaroysr96.sysgdcont.data.model.TwoFactorStatusResponse
import cu.lazaroysr96.sysgdcont.data.repository.AuthRepository
import cu.lazaroysr96.sysgdcont.data.repository.LoginFlowResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject
import android.net.Uri

data class AuthUiState(
    val isLoading: Boolean = false,
    val isWakingUp: Boolean = false,
    val wakeUpProgress: String? = null,
    val isSessionResolved: Boolean = false,
    val isAuthenticated: Boolean = false,
    val availableCredits: Int? = null,
    val currentUser: AuthUser? = null,
    val error: String? = null,
    val infoMessage: String? = null,
    val registerCompleted: Boolean = false,
    val needsAutoSync: Boolean = false,
    val requiresTwoFactor: Boolean = false,
    val pendingTwoFactorToken: String? = null,
    val twoFactorCode: String = "",
    val twoFactorEnabled: Boolean = false,
    val twoFactorMandatory: Boolean = false,
    val emailVerified: Boolean = false,
    val isSecurityLoading: Boolean = false,
    val isSecuritySaving: Boolean = false,
    val accountDeleted: Boolean = false,
    val accessKeyExported: Boolean = false,
    val accessKeyImported: Boolean = false,
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            authRepository.isAuthenticated.collect { isAuth ->
                _uiState.update {
                    it.copy(
                        isAuthenticated = isAuth,
                        isSessionResolved = true,
                        availableCredits = if (isAuth) it.availableCredits else null,
                    )
                }
                if (isAuth) {
                    loadAvailableCredits()
                    loadSecuritySettings()
                }
            }
        }
        viewModelScope.launch {
            authRepository.currentUser.collect { user ->
                _uiState.update { it.copy(currentUser = user) }
            }
        }
    }

    fun login(email: String, password: String) {
        if (_uiState.value.isLoading) return
        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isLoading = true,
                    error = null,
                    infoMessage = null,
                    isWakingUp = true,
                    wakeUpProgress = "Despertando servidor...",
                    requiresTwoFactor = false,
                    pendingTwoFactorToken = null,
                    twoFactorCode = "",
                )
            }

            authRepository.wakeUpServer()
                .onSuccess {
                    _uiState.update { it.copy(isWakingUp = false, wakeUpProgress = null) }
                }
                .onFailure {
                    _uiState.update { it.copy(isWakingUp = false, wakeUpProgress = null) }
                }

            authRepository.loginWithFlow(email, password)
                .onSuccess { result ->
                    when (result) {
                        is LoginFlowResult.Success -> {
                            _uiState.update {
                                it.copy(isLoading = false, isAuthenticated = true, currentUser = result.user)
                            }
                        }
                        is LoginFlowResult.RequiresTwoFactor -> {
                            _uiState.update {
                                it.copy(
                                    isLoading = false,
                                    requiresTwoFactor = true,
                                    pendingTwoFactorToken = result.twoFactorToken,
                                    infoMessage = result.message ?: "Te enviamos un código a tu correo.",
                                )
                            }
                        }
                    }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message ?: "Login failed") }
                }
        }
    }

    fun verifyTwoFactorCode(code: String) {
        val pendingToken = _uiState.value.pendingTwoFactorToken ?: return
        if (code.isBlank()) {
            _uiState.update { it.copy(error = "Escribe el código de verificación") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, infoMessage = null) }
            authRepository.verifyTwoFactor(pendingToken, code.trim())
                .onSuccess { user ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isAuthenticated = true,
                            currentUser = user,
                            requiresTwoFactor = false,
                            pendingTwoFactorToken = null,
                            twoFactorCode = "",
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message ?: "Código inválido") }
                }
        }
    }

    fun resendTwoFactorCode() {
        val pendingToken = _uiState.value.pendingTwoFactorToken ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            authRepository.resendTwoFactor(pendingToken)
                .onSuccess { message ->
                    _uiState.update { it.copy(isLoading = false, infoMessage = message) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message ?: "No se pudo reenviar") }
                }
        }
    }

    fun cancelTwoFactorFlow() {
        _uiState.update {
            it.copy(
                requiresTwoFactor = false,
                pendingTwoFactorToken = null,
                twoFactorCode = "",
                error = null,
                infoMessage = null,
            )
        }
    }

    fun register(name: String, email: String, password: String) {
        if (_uiState.value.isLoading) return
        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isLoading = true,
                    error = null,
                    infoMessage = null,
                    registerCompleted = false,
                    isWakingUp = true,
                    wakeUpProgress = "Despertando servidor...",
                )
            }

            authRepository.wakeUpServer()
                .onSuccess {
                    _uiState.update { it.copy(isWakingUp = false, wakeUpProgress = null) }
                }
                .onFailure {
                    _uiState.update { it.copy(isWakingUp = false, wakeUpProgress = null) }
                }

            authRepository.register(name, email, password)
                .onSuccess {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            registerCompleted = true,
                            infoMessage = "Cuenta creada. Revisa tu correo para verificarla antes de activar 2FA.",
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message ?: "Registration failed") }
                }
        }
    }

    fun requestPasswordReset(email: String) {
        if (email.isBlank()) {
            _uiState.update { it.copy(error = "Escribe tu correo para recuperar contraseña") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, infoMessage = null) }
            authRepository.requestPasswordReset(email.trim())
                .onSuccess { message ->
                    _uiState.update { it.copy(isLoading = false, infoMessage = message) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message ?: "No se pudo recuperar contraseña") }
                }
        }
    }

    fun loadSecuritySettings() {
        if (!_uiState.value.isAuthenticated) return
        viewModelScope.launch {
            _uiState.update { it.copy(isSecurityLoading = true) }

            val twoFactor = authRepository.getTwoFactorStatus()
            val verification = authRepository.getEmailVerificationStatus()

            var nextState = _uiState.value
            twoFactor.onSuccess { status: TwoFactorStatusResponse ->
                nextState = nextState.copy(
                    twoFactorEnabled = status.enabled,
                    twoFactorMandatory = status.mandatory,
                    emailVerified = status.emailVerified,
                )
            }
            verification.onSuccess { verified ->
                nextState = nextState.copy(emailVerified = verified)
            }

            val twoFactorError = twoFactor.exceptionOrNull()?.message
            val verificationError = verification.exceptionOrNull()?.message

            _uiState.update {
                nextState.copy(
                    isSecurityLoading = false,
                    error = twoFactorError ?: verificationError,
                )
            }
        }
    }

    fun resendVerificationEmail() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSecuritySaving = true, error = null, infoMessage = null) }
            authRepository.resendVerificationEmail()
                .onSuccess { message ->
                    _uiState.update { it.copy(isSecuritySaving = false, infoMessage = message) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isSecuritySaving = false, error = e.message ?: "No se pudo enviar") }
                }
        }
    }

    fun updateTwoFactorEnabled(enabled: Boolean, password: String) {
        if (password.isBlank()) {
            _uiState.update { it.copy(error = "Debes confirmar tu contraseña") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSecuritySaving = true, error = null, infoMessage = null) }
            authRepository.updateTwoFactorStatus(enabled, password)
                .onSuccess { message ->
                    _uiState.update {
                        it.copy(
                            isSecuritySaving = false,
                            twoFactorEnabled = enabled || it.twoFactorMandatory,
                            infoMessage = message,
                        )
                    }
                    loadSecuritySettings()
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isSecuritySaving = false, error = e.message ?: "No se pudo actualizar 2FA") }
                }
        }
    }

    fun deleteOwnAccount(password: String) {
        if (password.isBlank()) {
            _uiState.update { it.copy(error = "Escribe tu contraseña para eliminar la cuenta") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSecuritySaving = true, error = null, infoMessage = null) }
            authRepository.deleteOwnAccount(password)
                .onSuccess { message ->
                    _uiState.update {
                        it.copy(
                            isSecuritySaving = false,
                            accountDeleted = true,
                            isAuthenticated = false,
                            infoMessage = message,
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isSecuritySaving = false, error = e.message ?: "No se pudo eliminar la cuenta") }
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.update { AuthUiState() }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun clearInfoMessage() {
        _uiState.update { it.copy(infoMessage = null) }
    }

    fun consumeRegisterCompleted() {
        _uiState.update { it.copy(registerCompleted = false) }
    }

    fun setManualToken(token: String) {
        if (_uiState.value.isLoading) return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            authRepository.setManualToken(token)
                .onSuccess { user ->
                    _uiState.update { it.copy(isLoading = false, isAuthenticated = true, currentUser = user) }
                    loadSecuritySettings()
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message ?: "Token inválido") }
                }
        }
    }

    fun loadAvailableCredits() {
        viewModelScope.launch {
            authRepository.getAvailableCredits()
                .onSuccess { credits ->
                    _uiState.update { it.copy(availableCredits = credits) }
                }
                .onFailure {
                    // No bloqueamos la app si falla la consulta de créditos.
                }
        }
    }

    fun exportAccessKey(uri: Uri, password: String) {
        if (_uiState.value.isLoading) return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, infoMessage = null, accessKeyExported = false) }
            authRepository.exportAccessKeyToUri(uri, password)
                .onSuccess {
                    _uiState.update { it.copy(isLoading = false, accessKeyExported = true, infoMessage = "Llave de acceso creada correctamente") }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message ?: "Error al crear llave de acceso") }
                }
        }
    }

    fun importAccessKey(uri: Uri, password: String) {
        if (_uiState.value.isLoading) return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, infoMessage = null, accessKeyImported = false) }
            authRepository.importAccessKeyFromUri(uri, password)
                .onSuccess { user ->
                    _uiState.update { 
                        it.copy(
                            isLoading = false, 
                            accessKeyImported = true, 
                            isAuthenticated = true, 
                            currentUser = user,
                            infoMessage = "Sesión restaurada sin conexión a internet"
                        ) 
                    }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message ?: "Contraseña incorrecta o archivo inválido") }
                }
        }
    }

    fun consumeAccessKeyExported() {
        _uiState.update { it.copy(accessKeyExported = false) }
    }

    fun consumeAccessKeyImported() {
        _uiState.update { it.copy(accessKeyImported = false) }
    }
}
