package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.ui.graphics.vector.ImageVector

// ---------------------------------------------------------------------------
// Tipos de dominio (idealmente en un archivo de modelos separado)
// ---------------------------------------------------------------------------

enum class WalletTipo { EFECTIVO, BANCO, MOVIL, MERCANCIA, OTRO }

data class Wallet(
    val id: String,
    val nombre: String,
    val tipo: WalletTipo,
    val saldoInicial: Double,
    val moneda: String = "CUP",
    val activo: Boolean = true,
    val createdAt: Long = 0L,
    val updatedAt: Long = 0L,
)

enum class WalletMovimientoTipo { ENTRADA, SALIDA, TRANSFERENCIA }
enum class WalletReferenciaTipo { INGRESO, GASTO, OPERACION_POS, MANUAL }

data class WalletMovimiento(
    val id: String,
    val walletOrigenId: String?,
    val walletDestinoId: String?,
    val monto: Double,
    val tipo: WalletMovimientoTipo,
    val referenciaId: String? = null,
    val referenciaTipo: WalletReferenciaTipo? = null,
    val nota: String = "",
    val fecha: String,
    val createdAt: Long = 0L,
)

// ---------------------------------------------------------------------------
// Datos dummy (reemplazar con ViewModel + Room)
// ---------------------------------------------------------------------------

val dummyWallets = listOf(
    Wallet("1", "Caja efectivo", WalletTipo.EFECTIVO, 2300.0),
    Wallet("2", "BPA 9201", WalletTipo.BANCO, 12490.0),
    Wallet("3", "Saldo móvil", WalletTipo.MOVIL, 540.0),
)

val dummyMovimientos = listOf(
    WalletMovimiento("m1", null, "1", 1200.0, WalletMovimientoTipo.ENTRADA, referenciaTipo = WalletReferenciaTipo.OPERACION_POS, nota = "Cobro venta POS", fecha = "2026-05-01"),
    WalletMovimiento("m2", "1", null, 800.0, WalletMovimientoTipo.SALIDA, referenciaTipo = WalletReferenciaTipo.GASTO, nota = "Pago proveedor", fecha = "2026-05-02"),
    WalletMovimiento("m3", null, "2", 3400.0, WalletMovimientoTipo.ENTRADA, referenciaTipo = WalletReferenciaTipo.INGRESO, nota = "Cobro a cliente", fecha = "2026-05-02"),
    WalletMovimiento("m4", "2", null, 680.0, WalletMovimientoTipo.SALIDA, referenciaTipo = WalletReferenciaTipo.GASTO, nota = "Pago de servicios", fecha = "2026-05-02"),
    WalletMovimiento("m5", null, "1", 950.0, WalletMovimientoTipo.ENTRADA, referenciaTipo = WalletReferenciaTipo.OPERACION_POS, nota = "Venta mostrador", fecha = "2026-05-03"),
    WalletMovimiento("m6", "2", "1", 500.0, WalletMovimientoTipo.TRANSFERENCIA, referenciaTipo = WalletReferenciaTipo.MANUAL, nota = "Retiro para caja", fecha = "2026-05-01"),
    WalletMovimiento("m7", "1", "3", 200.0, WalletMovimientoTipo.TRANSFERENCIA, referenciaTipo = WalletReferenciaTipo.MANUAL, nota = "Recarga móvil", fecha = "2026-05-02"),
    WalletMovimiento("m8", "3", null, 120.0, WalletMovimientoTipo.SALIDA, referenciaTipo = WalletReferenciaTipo.GASTO, nota = "Pago Transfermóvil", fecha = "2026-05-03"),
    WalletMovimiento("m9", null, "2", 5000.0, WalletMovimientoTipo.ENTRADA, referenciaTipo = WalletReferenciaTipo.INGRESO, nota = "Depósito bancario", fecha = "2026-05-03"),
)

// ---------------------------------------------------------------------------
// Destinos del nav interno
// ---------------------------------------------------------------------------

// private enum class CajaBancoDestino(val label: String, val iconRes: Int) {
//     RESUMEN("Resumen", android.R.drawable.ic_menu_today),
//     MOVIMIENTOS("Movimientos", android.R.drawable.ic_menu_agenda),
//     REPORTES("Reportes", android.R.drawable.ic_menu_save),
// }

private enum class CajaBancoDestino(val label: String, val icon: ImageVector) {
    RESUMEN("Resumen", Icons.Outlined.Home),
    MOVIMIENTOS("Movimientos", Icons.Outlined.List),
    REPORTES("Reportes", Icons.Outlined.BarChart),
}

// ---------------------------------------------------------------------------
// Screen raíz
// ---------------------------------------------------------------------------

@Composable
fun CajaBancoScreen(modifier: Modifier = Modifier) {
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    val destinos = CajaBancoDestino.entries

    Scaffold(
        modifier = modifier.fillMaxSize(),
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = androidx.compose.ui.unit.Dp(0f),
            ) {
                destinos.forEachIndexed { index, destino ->
                    NavigationBarItem(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        icon = {
                            Icon(
                                imageVector = destino.icon,
                                contentDescription = destino.label,
                                )
                        },
                        label = {
                            Text(
                                text = destino.label,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = if (selectedTab == index) FontWeight.Medium else FontWeight.Normal,
                            )
                        },
                    )
                }
            }
        },
    ) { innerPadding ->
        Column(modifier = Modifier.padding(innerPadding).fillMaxSize()) {
            when (selectedTab) {
                0 -> CajaBancoResumenScreen(
                    wallets = dummyWallets,
                    movimientos = dummyMovimientos,
                )
                1 -> CajaBancoMovimientosScreen(
                    wallets = dummyWallets,
                    movimientos = dummyMovimientos,
                )
                2 -> CajaBancoReportesScreen(
                    wallets = dummyWallets,
                )
            }
        }
    }
}