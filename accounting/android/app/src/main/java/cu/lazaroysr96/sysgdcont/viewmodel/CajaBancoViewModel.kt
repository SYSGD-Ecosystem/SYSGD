package cu.lazaroysr96.sysgdcont.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.model.Moneda
import cu.lazaroysr96.sysgdcont.data.model.Wallet2
import cu.lazaroysr96.sysgdcont.data.model.WalletMovimientoTipo
import cu.lazaroysr96.sysgdcont.data.model.WalletReferenciaTipo
import cu.lazaroysr96.sysgdcont.data.model.WalletTipo
import cu.lazaroysr96.sysgdcont.data.repository.CajaBancoRepository
import cu.lazaroysr96.sysgdcont.ui.main.screens.CajaBancoState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CajaBancoViewModel @Inject constructor(
    private val repository: CajaBancoRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(CajaBancoState())
    val uiState: StateFlow<CajaBancoState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.ensureConfiguracionInicial()
        }
        viewModelScope.launch {
            repository.monedas.collect { monedas ->
                _uiState.update { it.copy(monedas = monedas) }
            }
        }
        viewModelScope.launch {
            repository.monedaTasas.collect { tasas ->
                _uiState.update { it.copy(monedaTasas = tasas) }
            }
        }
        viewModelScope.launch {
            repository.wallets.collect { wallets ->
                _uiState.update { it.copy(wallets = wallets) }
            }
        }
        viewModelScope.launch {
            repository.movimientos.collect { movimientos ->
                _uiState.update { it.copy(movimientos = movimientos) }
            }
        }
    }

    fun crearMonedaBase() {
        viewModelScope.launch {
            repository.crearMoneda("Peso Cubano", "CUP", 1.0)
        }
    }

    fun crearMoneda(nombre: String, tipo: String, tasaValor: Double) {
        viewModelScope.launch {
            repository.crearMoneda(nombre, tipo, tasaValor)
        }
    }

    fun actualizarTasa(moneda: Moneda, nuevaTasa: Double) {
        val tasaActual = uiState.value.monedaTasas.find { it.id == moneda.tasaId }
        viewModelScope.launch {
            repository.actualizarTasa(moneda, nuevaTasa, tasaActual)
        }
    }

    fun eliminarMoneda(moneda: Moneda) {
        viewModelScope.launch {
            repository.eliminarMoneda(moneda)
        }
    }

    fun crearWallet(nombre: String, tipo: WalletTipo, saldo: Double, monedaId: String) {
        viewModelScope.launch {
            repository.crearWallet(nombre, tipo, saldo, monedaId)
        }
    }

    fun editarWallet(orig: Wallet2, nombre: String, tipo: WalletTipo, saldo: Double, monedaId: String) {
        viewModelScope.launch {
            repository.editarWallet(orig, nombre, tipo, saldo, monedaId)
        }
    }

    fun eliminarWallet(wallet: Wallet2) {
        viewModelScope.launch {
            repository.eliminarWallet(wallet)
        }
    }

    fun registrar(
        tipo: WalletMovimientoTipo,
        wOrig: String?,
        wDest: String?,
        monto: Double,
        monedaId: String,
        tasa: Double,
        ref: WalletReferenciaTipo,
        nota: String,
        fecha: String,
    ) {
        viewModelScope.launch {
            repository.registrarMovimiento(tipo, wOrig, wDest, monto, monedaId, tasa, ref, nota, fecha)
        }
    }

    fun editarNota(movId: String, nota: String) {
        viewModelScope.launch {
            repository.editarNota(movId, nota)
        }
    }

    fun eliminarMovimiento(movId: String) {
        viewModelScope.launch {
            repository.eliminarMovimiento(movId)
        }
    }
}
