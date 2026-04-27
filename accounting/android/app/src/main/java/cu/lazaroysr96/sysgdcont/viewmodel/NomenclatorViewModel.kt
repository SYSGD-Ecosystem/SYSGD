package cu.lazaroysr96.sysgdcont.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.model.AccountingCategory
import cu.lazaroysr96.sysgdcont.data.model.AccountingItem
import cu.lazaroysr96.sysgdcont.data.model.AccountingSubcategory
import cu.lazaroysr96.sysgdcont.data.model.CnaeItem
import cu.lazaroysr96.sysgdcont.data.model.NomenclatorType
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
    val isLoading: Boolean = false
)

@HiltViewModel
class NomenclatorViewModel @Inject constructor(
    private val repository: NomenclatorRepository
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
