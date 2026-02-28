package cu.lazaroysr96.sysgdcont.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.model.Venta
import cu.lazaroysr96.sysgdcont.data.repository.InventarioRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import javax.inject.Inject

data class InventarioUiState(
    val productos: List<Producto> = emptyList(),
    val ventasHoy: List<Pair<Venta, List<LineaVenta>>> = emptyList(),
    val totalHoy: Double = 0.0,
    val isLoading: Boolean = false,
    val snackbarMessage: String? = null,
    val showSaleSheet: Boolean = false,
    val showCatalog: Boolean = false,
    val showAddProductDialog: Boolean = false,
    val selectedProduct: Producto? = null,
    val cart: Map<Producto, Int> = emptyMap()
)

@HiltViewModel
class InventarioViewModel @Inject constructor(
    private val repo: InventarioRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(InventarioUiState())
    val uiState: StateFlow<InventarioUiState> = _uiState.asStateFlow()

    private val hoy = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)

    init {
        viewModelScope.launch {
            repo.getProductos().collect { productos ->
                _uiState.update { it.copy(productos = productos) }
            }
        }

        viewModelScope.launch {
            repo.getVentasConLineasDelDia(hoy).collect { ventas ->
                _uiState.update { it.copy(ventasHoy = ventas) }
            }
        }

        viewModelScope.launch {
            repo.getTotalDia(hoy).collect { total ->
                _uiState.update { it.copy(totalHoy = total ?: 0.0) }
            }
        }
    }

    fun agregarProducto(nombre: String, precio: Double, emoji: String, unidad: String) {
        viewModelScope.launch {
            try {
                repo.agregarProducto(nombre, precio, emoji, unidad)
                _uiState.update { it.copy(snackbarMessage = "Producto agregado", showAddProductDialog = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al agregar producto") }
            }
        }
    }

    fun eliminarProducto(id: String) {
        viewModelScope.launch {
            try {
                repo.eliminarProducto(id)
                _uiState.update { it.copy(snackbarMessage = "Producto eliminado") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al eliminar") }
            }
        }
    }

    fun addToCart(producto: Producto) {
        _uiState.update { state ->
            val currentCart = state.cart.toMutableMap()
            currentCart[producto] = (currentCart[producto] ?: 0) + 1
            state.copy(cart = currentCart, showSaleSheet = true)
        }
    }

    fun removeFromCart(producto: Producto) {
        _uiState.update { state ->
            val currentCart = state.cart.toMutableMap()
            val currentQty = currentCart[producto] ?: 0
            if (currentQty > 1) {
                currentCart[producto] = currentQty - 1
            } else {
                currentCart.remove(producto)
            }
            state.copy(cart = currentCart)
        }
    }

    fun clearCart() {
        _uiState.update { it.copy(cart = emptyMap(), showSaleSheet = false) }
    }

    fun registrarVenta() {
        viewModelScope.launch {
            val cart = _uiState.value.cart
            if (cart.isEmpty()) return@launch

            try {
                repo.registrarVenta(cart)
                _uiState.update {
                    it.copy(
                        cart = emptyMap(),
                        showSaleSheet = false,
                        snackbarMessage = "Venta registrada"
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al registrar venta") }
            }
        }
    }

    fun anularVenta(ventaId: String) {
        viewModelScope.launch {
            try {
                repo.anularVenta(ventaId)
                _uiState.update { it.copy(snackbarMessage = "Venta anulada") }
            } catch (e: Exception) {
                _uiState.update { it.copy(snackbarMessage = "Error al anular") }
            }
        }
    }

    fun showSaleSheet(show: Boolean) {
        _uiState.update { it.copy(showSaleSheet = show) }
    }

    fun showCatalog(show: Boolean) {
        _uiState.update { it.copy(showCatalog = show) }
    }

    fun showAddProductDialog(show: Boolean) {
        _uiState.update { it.copy(showAddProductDialog = show) }
    }

    fun clearSnackbar() {
        _uiState.update { it.copy(snackbarMessage = null) }
    }

    val cartTotal: Double
        get() = _uiState.value.cart.entries.sumOf { (p, qty) -> p.precio * qty }

    val cartItemCount: Int
        get() = _uiState.value.cart.values.sum()
}
