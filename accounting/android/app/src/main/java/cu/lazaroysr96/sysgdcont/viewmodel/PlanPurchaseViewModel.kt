package cu.lazaroysr96.sysgdcont.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.model.CreateManualPaymentOrderRequest
import cu.lazaroysr96.sysgdcont.data.model.ManualPaymentCatalogResponse
import cu.lazaroysr96.sysgdcont.data.model.ManualPaymentOrder
import cu.lazaroysr96.sysgdcont.data.model.UserPlanResponse
import cu.lazaroysr96.sysgdcont.data.repository.AuthRepository
import cu.lazaroysr96.sysgdcont.data.repository.ManualPaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PlanPurchaseUiState(
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val catalog: ManualPaymentCatalogResponse? = null,
    val orders: List<ManualPaymentOrder> = emptyList(),
    val currentPlan: UserPlanResponse? = null,
    val error: String? = null,
    val infoMessage: String? = null,
    val lastSubmittedAt: Long = 0L
)

@HiltViewModel
class PlanPurchaseViewModel @Inject constructor(
    private val manualPaymentRepository: ManualPaymentRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PlanPurchaseUiState())
    val uiState: StateFlow<PlanPurchaseUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    fun loadData(force: Boolean = false) {
        if (_uiState.value.isLoading) return
        if (!force && _uiState.value.catalog != null && _uiState.value.currentPlan != null) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val catalogResult = manualPaymentRepository.getCatalog()
            val ordersResult = manualPaymentRepository.getOrders()
            val planResult = authRepository.getCurrentPlan()
            val cachedPlan = authRepository.getCachedPlan()
            val planError = planResult.exceptionOrNull()?.message

            _uiState.update {
                it.copy(
                    isLoading = false,
                    catalog = catalogResult.getOrNull() ?: it.catalog,
                    orders = ordersResult.getOrNull() ?: it.orders,
                    currentPlan = planResult.getOrNull() ?: cachedPlan ?: it.currentPlan,
                    error = catalogResult.exceptionOrNull()?.message
                        ?: ordersResult.exceptionOrNull()?.message
                        ?: if (cachedPlan == null) planError else null
                )
            }
        }
    }

    fun submitOrder(
        productId: String,
        payerPhone: String,
        smsMessage: String,
        confirmationPhoneAcknowledged: Boolean,
        receiverPhoneShared: Boolean
    ) {
        if (_uiState.value.isSubmitting) return

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null, infoMessage = null) }

            manualPaymentRepository.createOrder(
                CreateManualPaymentOrderRequest(
                    productId = productId,
                    payerPhone = payerPhone,
                    smsMessage = smsMessage,
                    confirmationPhoneAcknowledged = confirmationPhoneAcknowledged,
                    receiverPhoneShared = receiverPhoneShared
                )
            ).onSuccess { order ->
                val ordersResult = manualPaymentRepository.getOrders()
                val planResult = authRepository.getCurrentPlan()
                val cachedPlan = authRepository.getCachedPlan()
                val statusMessage = when (order.status) {
                    "provisional" -> "Compra registrada. El plan de prueba ya quedó activado para depuración."
                    else -> "Compra enviada. Quedó pendiente de validación manual."
                }

                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        orders = ordersResult.getOrNull() ?: listOf(order) + it.orders,
                        currentPlan = planResult.getOrNull() ?: cachedPlan ?: it.currentPlan,
                        infoMessage = statusMessage,
                        lastSubmittedAt = System.currentTimeMillis(),
                        error = ordersResult.exceptionOrNull()?.message
                            ?: if (cachedPlan == null) planResult.exceptionOrNull()?.message else null
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        error = error.message ?: "No se pudo registrar la compra"
                    )
                }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun clearInfoMessage() {
        _uiState.update { it.copy(infoMessage = null) }
    }
}
