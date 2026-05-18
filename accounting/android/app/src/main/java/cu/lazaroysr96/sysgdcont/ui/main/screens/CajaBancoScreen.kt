package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AttachMoney
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.List
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.Moneda
import cu.lazaroysr96.sysgdcont.data.model.MonedaTasa
import cu.lazaroysr96.sysgdcont.data.model.Wallet2
import cu.lazaroysr96.sysgdcont.data.model.WalletMovimiento
import cu.lazaroysr96.sysgdcont.data.model.WalletMovimientoTipo
import cu.lazaroysr96.sysgdcont.data.model.WalletReferenciaTipo
import cu.lazaroysr96.sysgdcont.data.model.WalletTipo
import cu.lazaroysr96.sysgdcont.viewmodel.CajaBancoViewModel

// ---------------------------------------------------------------------------
// Helpers globales
// ---------------------------------------------------------------------------

fun formatCup(value: Double): String = "$%,.2f".format(value)

fun List<Moneda>.monedaBase(): Moneda? = find { it.tipo == "CUP" }
fun List<Moneda>.monedaById(id: String): Moneda? = find { it.id == id }
fun Moneda?.tasaActual(tasas: List<MonedaTasa>): Double =
    tasas.find { it.id == this?.tasaId }?.tasa ?: 1.0

fun walletColorOf(tipo: WalletTipo): androidx.compose.ui.graphics.Color = when (tipo) {
    WalletTipo.EFECTIVO -> androidx.compose.ui.graphics.Color(0xFF059669)
    WalletTipo.BANCO -> androidx.compose.ui.graphics.Color(0xFF1D4ED8)
    WalletTipo.MOVIL -> androidx.compose.ui.graphics.Color(0xFFD97706)
    WalletTipo.MERCANCIA -> androidx.compose.ui.graphics.Color(0xFF7C3AED)
    WalletTipo.OTRO -> androidx.compose.ui.graphics.Color(0xFF64748B)
}

fun walletContainerOf(tipo: WalletTipo): androidx.compose.ui.graphics.Color = when (tipo) {
    WalletTipo.EFECTIVO -> androidx.compose.ui.graphics.Color(0xFFECFDF5)
    WalletTipo.BANCO -> androidx.compose.ui.graphics.Color(0xFFEFF6FF)
    WalletTipo.MOVIL -> androidx.compose.ui.graphics.Color(0xFFFFF7ED)
    WalletTipo.MERCANCIA -> androidx.compose.ui.graphics.Color(0xFFF5F3FF)
    WalletTipo.OTRO -> androidx.compose.ui.graphics.Color(0xFFF1F5F9)
}

fun walletIconOf(tipo: WalletTipo): ImageVector = when (tipo) {
    WalletTipo.EFECTIVO -> Icons.Outlined.Home        // sustituir por Banknote si tienes extended icons
    WalletTipo.BANCO -> Icons.Outlined.AttachMoney
    WalletTipo.MOVIL -> Icons.Outlined.List
    WalletTipo.MERCANCIA -> Icons.Outlined.Description
    WalletTipo.OTRO -> Icons.Outlined.AttachMoney
}

fun movColorOf(tipo: WalletMovimientoTipo): androidx.compose.ui.graphics.Color = when (tipo) {
    WalletMovimientoTipo.ENTRADA -> androidx.compose.ui.graphics.Color(0xFF059669)
    WalletMovimientoTipo.SALIDA -> androidx.compose.ui.graphics.Color(0xFFE11D48)
    WalletMovimientoTipo.TRANSFERENCIA -> androidx.compose.ui.graphics.Color(0xFF1D4ED8)
}

fun movContainerOf(tipo: WalletMovimientoTipo): androidx.compose.ui.graphics.Color = when (tipo) {
    WalletMovimientoTipo.ENTRADA -> androidx.compose.ui.graphics.Color(0xFFECFDF5)
    WalletMovimientoTipo.SALIDA -> androidx.compose.ui.graphics.Color(0xFFFFF1F2)
    WalletMovimientoTipo.TRANSFERENCIA -> androidx.compose.ui.graphics.Color(0xFFEFF6FF)
}

fun movSignoOf(tipo: WalletMovimientoTipo): String = when (tipo) {
    WalletMovimientoTipo.ENTRADA -> "+"
    WalletMovimientoTipo.SALIDA -> "-"
    WalletMovimientoTipo.TRANSFERENCIA -> ""
}

fun tipoWalletLabel(tipo: WalletTipo): String = when (tipo) {
    WalletTipo.EFECTIVO -> "Efectivo"
    WalletTipo.BANCO -> "Banco"
    WalletTipo.MOVIL -> "Móvil"
    WalletTipo.MERCANCIA -> "Mercancía"
    WalletTipo.OTRO -> "Otro"
}

fun refLabel(ref: WalletReferenciaTipo): String = when (ref) {
    WalletReferenciaTipo.INGRESO -> "Ingreso"
    WalletReferenciaTipo.GASTO -> "Gasto"
    WalletReferenciaTipo.OPERACION_POS -> "Operación POS"
    WalletReferenciaTipo.MANUAL -> "Manual"
}

// ---------------------------------------------------------------------------
// Estado compuesto del módulo
// ---------------------------------------------------------------------------

data class CajaBancoState(
    val monedas: List<Moneda> = emptyList(),
    val monedaTasas: List<MonedaTasa> = emptyList(),
    val wallets: List<Wallet2> = emptyList(),
    val movimientos: List<WalletMovimiento> = emptyList(),
) {
    fun saldoWallet(walletId: String): Double {
        val w = wallets.find { it.id == walletId } ?: return 0.0
        val ent = movimientos.filter { it.walletDestinoId == walletId }
            .sumOf { it.monto * it.tasaAlMomento }
        val sal = movimientos.filter { it.walletOrigenId == walletId }
            .sumOf { it.monto * it.tasaAlMomento }
        return w.saldoInicial + ent - sal
    }

    fun totalLiquido(): Double = wallets
        .filter { it.activo && it.tipo != WalletTipo.MERCANCIA }
        .sumOf { saldoWallet(it.id) }

    fun totalEntradas(): Double = movimientos
        .filter { it.tipo == WalletMovimientoTipo.ENTRADA }
        .sumOf { it.monto * it.tasaAlMomento }

    fun totalSalidas(): Double = movimientos
        .filter { it.tipo == WalletMovimientoTipo.SALIDA }
        .sumOf { it.monto * it.tasaAlMomento }

    fun monedaBase(): Moneda? = monedas.monedaBase()
    fun tasaDe(monedaId: String): Double = monedas.monedaById(monedaId).tasaActual(monedaTasas)
    fun nombreMoneda(monedaId: String): String = monedas.monedaById(monedaId)?.tipo ?: "CUP"
}

// ---------------------------------------------------------------------------
// Sheets activos
// ---------------------------------------------------------------------------

sealed interface SheetActivo {
    data object NuevaWallet : SheetActivo
    data class EditarWallet(val wallet: Wallet2) : SheetActivo
    data class EliminarWallet(val wallet: Wallet2) : SheetActivo
    data object NuevaEntrada : SheetActivo
    data object NuevaSalida : SheetActivo
    data object NuevaTransferencia : SheetActivo
    data class DetalleMovimiento(val movimiento: WalletMovimiento) : SheetActivo
    data object NuevaMoneda : SheetActivo
    data class EditarTasa(val moneda: Moneda) : SheetActivo
    data class EliminarMoneda(val moneda: Moneda) : SheetActivo
    data object CrearMonedaBase : SheetActivo
}

// ---------------------------------------------------------------------------
// Nav destinos
// ---------------------------------------------------------------------------

private enum class CajaBancoTab(val label: String, val icon: ImageVector) {
    RESUMEN("Resumen", Icons.Outlined.Home),
    MOVIMIENTOS("Movimientos", Icons.Outlined.List),
    MONEDAS("Monedas", Icons.Outlined.AttachMoney),
    REPORTES("Reportes", Icons.Outlined.Description),
}

// ---------------------------------------------------------------------------
// Screen raíz
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CajaBancoScreen(
    modifier: Modifier = Modifier,
    viewModel: CajaBancoViewModel = hiltViewModel(),
) {
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var sheetActivo by remember { mutableStateOf<SheetActivo?>(null) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    fun crearMonedaBase() {
        viewModel.crearMonedaBase()
        sheetActivo = null
    }

    fun crearMoneda(nombre: String, tipo: String, tasaValor: Double) {
        viewModel.crearMoneda(nombre, tipo, tasaValor)
        sheetActivo = null
    }

    fun actualizarTasa(moneda: Moneda, nuevaTasa: Double) {
        viewModel.actualizarTasa(moneda, nuevaTasa)
        sheetActivo = null
    }

    fun eliminarMoneda(moneda: Moneda) {
        viewModel.eliminarMoneda(moneda)
        sheetActivo = null
    }

    fun crearWallet(nombre: String, tipo: WalletTipo, saldo: Double, monedaId: String) {
        viewModel.crearWallet(nombre, tipo, saldo, monedaId)
        sheetActivo = null
    }

    fun editarWallet(orig: Wallet2, nombre: String, tipo: WalletTipo, saldo: Double, monedaId: String) {
        viewModel.editarWallet(orig, nombre, tipo, saldo, monedaId)
        sheetActivo = null
    }

    fun eliminarWallet(wallet: Wallet2) {
        viewModel.eliminarWallet(wallet)
        sheetActivo = null
    }

    fun registrar(
        tipo: WalletMovimientoTipo,
        wOrig: String?, wDest: String?,
        monto: Double, monedaId: String, tasa: Double,
        ref: WalletReferenciaTipo, nota: String, fecha: String,
    ) {
        viewModel.registrar(tipo, wOrig, wDest, monto, monedaId, tasa, ref, nota, fecha)
        sheetActivo = null
    }

    fun editarNota(movId: String, nota: String) {
        viewModel.editarNota(movId, nota)
        sheetActivo = null
    }

    fun eliminarMov(movId: String) {
        viewModel.eliminarMovimiento(movId)
        sheetActivo = null
    }

    // ---------- Render de sheets / dialogs ----------
    when (val s = sheetActivo) {
        is SheetActivo.CrearMonedaBase -> CrearMonedaBaseDialog(
            onDismiss = { sheetActivo = null },
            onConfirm = ::crearMonedaBase,
        )
        is SheetActivo.NuevaMoneda -> MonedaFormSheet(
            sheetState = sheetState, monedaBase = state.monedaBase(),
            onDismiss = { sheetActivo = null },
            onConfirm = { n, t, v -> crearMoneda(n, t, v) },
        )
        is SheetActivo.EditarTasa -> EditarTasaSheet(
            moneda = s.moneda, tasaActual = state.tasaDe(s.moneda.id),
            monedaBase = state.monedaBase(), sheetState = sheetState,
            onDismiss = { sheetActivo = null },
            onConfirm = { t -> actualizarTasa(s.moneda, t) },
        )
        is SheetActivo.EliminarMoneda -> EliminarMonedaDialog(
            moneda = s.moneda, onDismiss = { sheetActivo = null },
            onConfirm = { eliminarMoneda(s.moneda) },
        )
        is SheetActivo.NuevaWallet -> Wallet2FormSheet(
            monedas = state.monedas, sheetState = sheetState,
            onDismiss = { sheetActivo = null },
            onConfirm = { n, t, sl, m -> crearWallet(n, t, sl, m) },
        )
        is SheetActivo.EditarWallet -> Wallet2FormSheet(
            walletInicial = s.wallet, monedas = state.monedas, sheetState = sheetState,
            onDismiss = { sheetActivo = null },
            onConfirm = { n, t, sl, m -> editarWallet(s.wallet, n, t, sl, m) },
        )
        is SheetActivo.EliminarWallet -> EliminarWallet2Dialog(
            wallet = s.wallet, onDismiss = { sheetActivo = null },
            onConfirm = { eliminarWallet(s.wallet) },
        )
        is SheetActivo.NuevaEntrada -> Entrada2Sheet(
            wallets = state.wallets, monedas = state.monedas,
            monedaTasas = state.monedaTasas, sheetState = sheetState,
            onDismiss = { sheetActivo = null },
            onConfirm = { wd, mo, mid, ta, ref, no, fe ->
                registrar(WalletMovimientoTipo.ENTRADA, null, wd, mo, mid, ta, ref, no, fe)
            },
        )
        is SheetActivo.NuevaSalida -> Salida2Sheet(
            wallets = state.wallets, monedas = state.monedas,
            monedaTasas = state.monedaTasas, sheetState = sheetState,
            onDismiss = { sheetActivo = null },
            onConfirm = { wo, mo, mid, ta, ref, no, fe ->
                registrar(WalletMovimientoTipo.SALIDA, wo, null, mo, mid, ta, ref, no, fe)
            },
        )
        is SheetActivo.NuevaTransferencia -> Transferencia2Sheet(
            wallets = state.wallets, monedas = state.monedas,
            monedaTasas = state.monedaTasas, sheetState = sheetState,
            onDismiss = { sheetActivo = null },
            onConfirm = { wo, wd, mo, mid, ta, no, fe ->
                registrar(WalletMovimientoTipo.TRANSFERENCIA, wo, wd, mo, mid, ta, WalletReferenciaTipo.MANUAL, no, fe)
            },
        )
        is SheetActivo.DetalleMovimiento -> Movimiento2DetalleSheet(
            movimiento = s.movimiento, wallets = state.wallets,
            monedas = state.monedas, sheetState = sheetState,
            onDismiss = { sheetActivo = null },
            onEditarNota = { nota -> editarNota(s.movimiento.id, nota) },
            onEliminar = { eliminarMov(s.movimiento.id) },
        )
        null -> Unit
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                CajaBancoTab.entries.forEachIndexed { i, tab ->
                    NavigationBarItem(
                        selected = selectedTab == i,
                        onClick = { selectedTab = i },
                        icon = { Icon(tab.icon, tab.label) },
                        label = {
                            Text(
                                tab.label,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = if (selectedTab == i) FontWeight.Medium else FontWeight.Normal,
                            )
                        },
                    )
                }
            }
        },
    ) { inner ->
        Column(modifier = Modifier.padding(inner).fillMaxSize()) {
            if (state.monedaBase() == null) {
                SinMonedaBaseScreen(onCreate = { sheetActivo = SheetActivo.CrearMonedaBase })
            } else {
                when (selectedTab) {
                    0 -> CajaBancoResumenScreen(
                        state = state,
                        onNuevaEntrada = { sheetActivo = SheetActivo.NuevaEntrada },
                        onNuevaSalida = { sheetActivo = SheetActivo.NuevaSalida },
                        onNuevaTransferencia = { sheetActivo = SheetActivo.NuevaTransferencia },
                        onNuevaWallet = { sheetActivo = SheetActivo.NuevaWallet },
                        onEditarWallet = { sheetActivo = SheetActivo.EditarWallet(it) },
                        onEliminarWallet = { sheetActivo = SheetActivo.EliminarWallet(it) },
                    )
                    1 -> CajaBancoMovimientosScreen(
                        state = state,
                        onMovimientoClick = { sheetActivo = SheetActivo.DetalleMovimiento(it) },
                    )
                    2 -> CajaBancoMonedasScreen(
                        state = state,
                        onNuevaMoneda = { sheetActivo = SheetActivo.NuevaMoneda },
                        onEditarTasa = { sheetActivo = SheetActivo.EditarTasa(it) },
                        onEliminarMoneda = { sheetActivo = SheetActivo.EliminarMoneda(it) },
                    )
                    3 -> CajaBancoReportesScreen(wallets = state.wallets.map {
                        Wallet2(it.id, it.nombre, it.tipo, it.saldoInicial, it.monedaId, it.activo)
                    })
                }
            }
        }
    }
}
