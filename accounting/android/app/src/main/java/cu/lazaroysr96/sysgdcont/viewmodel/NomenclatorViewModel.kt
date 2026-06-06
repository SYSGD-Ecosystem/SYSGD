package cu.lazaroysr96.sysgdcont.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.model.AccountingCategory
import cu.lazaroysr96.sysgdcont.data.model.AccountingItem
import cu.lazaroysr96.sysgdcont.data.model.AccountingSubcategory
import cu.lazaroysr96.sysgdcont.data.model.CnaeItem
import cu.lazaroysr96.sysgdcont.data.model.NaturalezaCuenta
import cu.lazaroysr96.sysgdcont.data.model.NomenclatorType
import cu.lazaroysr96.sysgdcont.data.model.TipoCuenta
import cu.lazaroysr96.sysgdcont.data.model.UsoOperativoCuenta
import cu.lazaroysr96.sysgdcont.data.repository.LedgerRepository
import cu.lazaroysr96.sysgdcont.data.repository.NomenclatorRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NomenclatorUiState(
    val selectedType: NomenclatorType = NomenclatorType.ACCOUNTING,
    val query: String = "",
    val accountingCategories: List<AccountingCategory> = emptyList(),
    val accountingSubcategories: List<AccountingSubcategory> = emptyList(),
    val selectedCategoryCode: String? = null,
    val selectedSubcategoryCode: String? = null,
    val cnaeItems: List<CnaeItem> = emptyList(),
    val accountingItems: List<AccountingItem> = emptyList(),
    val operationalAccountCodes: Set<String> = emptySet(),
    val operationMessage: String? = null,
    val operationError: String? = null,
    val isLoading: Boolean = false
)

@HiltViewModel
class NomenclatorViewModel @Inject constructor(
    private val repository: NomenclatorRepository,
    private val ledgerRepository: LedgerRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(NomenclatorUiState())
    val uiState: StateFlow<NomenclatorUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch(Dispatchers.IO) {
            val categories = repository.getAccountingCategories()
            val subcategories = repository.getAccountingSubcategories()
            val accountingItems = repository.searchAccounting("", null, null)
            _uiState.update {
                it.copy(
                    accountingCategories = categories,
                    accountingSubcategories = subcategories,
                    accountingItems = accountingItems
                )
            }
        }
        viewModelScope.launch {
            ledgerRepository.cuentasContables.collect { cuentas ->
                _uiState.update {
                    it.copy(operationalAccountCodes = cuentas.map { cuenta -> cuenta.codigo }.toSet())
                }
            }
        }
    }

    fun setType(type: NomenclatorType) {
        _uiState.update {
            it.copy(
                selectedType = type,
                query = "",
                selectedCategoryCode = null,
                selectedSubcategoryCode = null
            )
        }
        refresh()
    }

    fun setQuery(query: String) {
        _uiState.update { it.copy(query = query) }
    }

    fun setCategory(code: String?) {
        _uiState.update { it.copy(selectedCategoryCode = code) }
        refresh()
    }

    fun setSubcategory(code: String?) {
        _uiState.update { it.copy(selectedSubcategoryCode = code) }
        refresh()
    }

    fun search() {
        refresh()
    }

    fun clearFilters() {
        _uiState.update {
            it.copy(
                query = "",
                selectedCategoryCode = null,
                selectedSubcategoryCode = null
            )
        }
        refresh()
    }

    fun useAccountingAccount(item: AccountingItem) {
        viewModelScope.launch(Dispatchers.IO) {
            runCatching {
                ledgerRepository.crearCuentaContable(
                    codigo = item.accountCode,
                    nombre = item.accountName,
                    naturaleza = item.toNaturalezaCuenta(),
                    tipo = item.toTipoCuenta(),
                    usoOperativo = item.toUsoOperativoCuenta()
                )
            }
                .onSuccess {
                    _uiState.update {
                        it.copy(
                            operationMessage = "Cuenta ${item.accountCode} agregada al catálogo operativo.",
                            operationError = null
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            operationMessage = null,
                            operationError =
                                error.message ?: "No se pudo agregar la cuenta al catálogo operativo."
                        )
                    }
                }
        }
    }

    fun clearOperationStatus() {
        _uiState.update { it.copy(operationMessage = null, operationError = null) }
    }

    private fun AccountingItem.toNaturalezaCuenta(): String = when {
        accountNature.contains("acre", ignoreCase = true) -> NaturalezaCuenta.ACREEDORA
        accountNature.contains("deud", ignoreCase = true) -> NaturalezaCuenta.DEUDORA
        accountNature.contains("mixt", ignoreCase = true) -> NaturalezaCuenta.MIXTA
        accountCode.startsWith("9") -> NaturalezaCuenta.ACREEDORA
        accountCode.startsWith("8") -> NaturalezaCuenta.DEUDORA
        else -> NaturalezaCuenta.MIXTA
    }

    private fun AccountingItem.toTipoCuenta(): String = when {
        accountCode.startsWith("9") -> TipoCuenta.INGRESO
        accountCode.startsWith("8") -> TipoCuenta.GASTO
        accountCode.startsWith("1") -> TipoCuenta.ACTIVO
        accountCode.startsWith("2") -> TipoCuenta.PASIVO
        accountCode.startsWith("3") -> TipoCuenta.PATRIMONIO
        else -> TipoCuenta.MIXTO
    }

    private fun AccountingItem.toUsoOperativoCuenta(): String = when (toTipoCuenta()) {
        TipoCuenta.INGRESO -> UsoOperativoCuenta.INGRESO
        TipoCuenta.GASTO -> UsoOperativoCuenta.GASTO
        else -> UsoOperativoCuenta.MIXTO
    }

    private fun refresh() {
        val snapshot = _uiState.value
        viewModelScope.launch(Dispatchers.IO) {
            _uiState.update { it.copy(isLoading = true) }
            when (snapshot.selectedType) {
                NomenclatorType.CNAE -> {
                    val items = repository.searchCnae(snapshot.query)
                    _uiState.update { it.copy(cnaeItems = items, isLoading = false) }
                }
                NomenclatorType.ACCOUNTING -> {
                    val items = repository.searchAccounting(
                        snapshot.query,
                        snapshot.selectedCategoryCode,
                        snapshot.selectedSubcategoryCode
                    )
                    _uiState.update { it.copy(accountingItems = items, isLoading = false) }
                }
            }
        }
    }
}
