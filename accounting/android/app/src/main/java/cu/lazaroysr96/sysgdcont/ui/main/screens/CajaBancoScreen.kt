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

// ---------------------------------------------------------------------------
// Tipos de dominio
// ---------------------------------------------------------------------------

enum class WalletTipo { EFECTIVO, BANCO, MOVIL, MERCANCIA, OTRO }
enum class WalletMovimientoTipo { ENTRADA, SALIDA, TRANSFERENCIA }
enum class WalletReferenciaTipo { INGRESO, GASTO, OPERACION_POS, MANUAL }

data class MonedaTasa(
    val id: String,
    val nombre: String,
    val tasa: Double,
    val createdAt: Long = 0L,
    val updatedAt: Long = 0L,
)

data class Moneda(
    val id: String,
    val nombre: String,
    val tipo: String, // "CUP" | "USD" | "EUR" | "MLC" | ...
    val tasaId: String,
    val createdAt: Long = 0L,
    val updatedAt: Long = 0L,
)

data class MonedaTasaHistorial(
    val id: String,
    val monedaId: String,
    val tasa: Double,
    val createdAt: Long = 0L,
)

data class Wallet2(
    val id: String,
    val nombre: String,
    val tipo: WalletTipo,
    val saldoInicial: Double,
    val monedaId: String,
    val activo: Boolean = true,
    val createdAt: Long = 0L,
    val updatedAt: Long = 0L,
)


data class WalletMovimiento(
    val id: String,
    val walletOrigenId: String?,
    val walletDestinoId: String?,
    val monto: Double,
    val tasaAlMomento: Double = 1.0,
    val monedaId: String,
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

val dummyMonedaTasas = listOf(
    MonedaTasa("t1", "Tasa CUP", 1.0),
    MonedaTasa("t2", "Tasa USD", 350.0),
    MonedaTasa("t3", "Tasa MLC", 280.0),
)

val dummyMonedas = listOf(
    Moneda("c1", "Peso Cubano", "CUP", "t1"),
    Moneda("c2", "Dólar Estadounidense", "USD", "t2"),
    Moneda("c3", "Moneda Libremente Convertible", "MLC", "t3"),
)

val dummyWallets2 = listOf(
    Wallet2("w1", "Caja efectivo", WalletTipo.EFECTIVO, 2300.0, "c1"),
    Wallet2("w2", "BPA 9201", WalletTipo.BANCO, 12490.0, "c1"),
    Wallet2("w3", "Saldo móvil", WalletTipo.MOVIL, 540.0, "c1"),
)

val dummyMovimientos2 = listOf(
    WalletMovimiento("m1", null, "w1", 1200.0, 1.0, "c1", WalletMovimientoTipo.ENTRADA, referenciaTipo = WalletReferenciaTipo.OPERACION_POS, nota = "Cobro venta POS", fecha = "2026-05-01"),
    WalletMovimiento("m2", "w1", null, 800.0, 1.0, "c1", WalletMovimientoTipo.SALIDA, referenciaTipo = WalletReferenciaTipo.GASTO, nota = "Pago proveedor", fecha = "2026-05-02"),
    WalletMovimiento("m3", null, "w2", 10.0, 350.0, "c2", WalletMovimientoTipo.ENTRADA, referenciaTipo = WalletReferenciaTipo.INGRESO, nota = "Cobro cliente (USD)", fecha = "2026-05-02"),
    WalletMovimiento("m4", "w2", null, 680.0, 1.0, "c1", WalletMovimientoTipo.SALIDA, referenciaTipo = WalletReferenciaTipo.GASTO, nota = "Pago de servicios", fecha = "2026-05-02"),
    WalletMovimiento("m5", null, "w1", 950.0, 1.0, "c1", WalletMovimientoTipo.ENTRADA, referenciaTipo = WalletReferenciaTipo.OPERACION_POS, nota = "Venta mostrador", fecha = "2026-05-03"),
    WalletMovimiento("m6", "w2", "w1", 500.0, 1.0, "c1", WalletMovimientoTipo.TRANSFERENCIA, referenciaTipo = WalletReferenciaTipo.MANUAL, nota = "Retiro para caja", fecha = "2026-05-01"),
    WalletMovimiento("m7", "w1", "w3", 200.0, 1.0, "c1", WalletMovimientoTipo.TRANSFERENCIA, referenciaTipo = WalletReferenciaTipo.MANUAL, nota = "Recarga móvil", fecha = "2026-05-02"),
    WalletMovimiento("m8", "w3", null, 120.0, 1.0, "c1", WalletMovimientoTipo.SALIDA, referenciaTipo = WalletReferenciaTipo.GASTO, nota = "Pago Transfermóvil", fecha = "2026-05-03"),
    WalletMovimiento("m9", null, "w2", 5000.0, 1.0, "c1", WalletMovimientoTipo.ENTRADA, referenciaTipo = WalletReferenciaTipo.INGRESO, nota = "Depósito bancario", fecha = "2026-05-03"),
)

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
// Estado compuesto del módulo (reemplazar con ViewModel)
// ---------------------------------------------------------------------------

data class CajaBancoState(
    val monedas: List<Moneda> = dummyMonedas,
    val monedaTasas: List<MonedaTasa> = dummyMonedaTasas,
    val wallets: List<Wallet2> = dummyWallets2,
    val movimientos: List<WalletMovimiento> = dummyMovimientos2,
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
fun CajaBancoScreen(modifier: Modifier = Modifier) {
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    var state by remember { mutableStateOf(CajaBancoState()) }
    var sheetActivo by remember { mutableStateOf<SheetActivo?>(null) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    fun nuevoId() = System.currentTimeMillis().toString()

    // ---------- Monedas ----------
    fun crearMonedaBase() {
        val tasa = MonedaTasa(nuevoId(), "Tasa CUP", 1.0)
        state = state.copy(
            monedaTasas = state.monedaTasas + tasa,
            monedas = state.monedas + Moneda(nuevoId(), "Peso Cubano", "CUP", tasa.id),
        )
        sheetActivo = null
    }

    fun crearMoneda(nombre: String, tipo: String, tasaValor: Double) {
        val tasa = MonedaTasa(nuevoId(), "Tasa $tipo", tasaValor)
        state = state.copy(
            monedaTasas = state.monedaTasas + tasa,
            monedas = state.monedas + Moneda(nuevoId(), nombre, tipo.uppercase(), tasa.id),
        )
        sheetActivo = null
    }

    fun actualizarTasa(moneda: Moneda, nuevaTasa: Double) {
        state = state.copy(
            monedaTasas = state.monedaTasas.map {
                if (it.id == moneda.tasaId) it.copy(tasa = nuevaTasa) else it
            },
        )
        sheetActivo = null
    }

    fun eliminarMoneda(moneda: Moneda) {
        state = state.copy(
            monedas = state.monedas.filter { it.id != moneda.id },
            monedaTasas = state.monedaTasas.filter { it.id != moneda.tasaId },
        )
        sheetActivo = null
    }

    // ---------- Wallets ----------
    fun crearWallet(nombre: String, tipo: WalletTipo, saldo: Double, monedaId: String) {
        state = state.copy(wallets = state.wallets + Wallet2(nuevoId(), nombre, tipo, saldo, monedaId))
        sheetActivo = null
    }

    fun editarWallet(orig: Wallet2, nombre: String, tipo: WalletTipo, saldo: Double, monedaId: String) {
        state = state.copy(wallets = state.wallets.map {
            if (it.id == orig.id) it.copy(nombre = nombre, tipo = tipo, saldoInicial = saldo, monedaId = monedaId) else it
        })
        sheetActivo = null
    }

    fun eliminarWallet(wallet: Wallet2) {
        state = state.copy(wallets = state.wallets.filter { it.id != wallet.id })
        sheetActivo = null
    }

    // ---------- Movimientos ----------
    fun registrar(
        tipo: WalletMovimientoTipo,
        wOrig: String?, wDest: String?,
        monto: Double, monedaId: String, tasa: Double,
        ref: WalletReferenciaTipo, nota: String, fecha: String,
    ) {
        state = state.copy(movimientos = listOf(
            WalletMovimiento(nuevoId(), wOrig, wDest, monto, tasa, monedaId, tipo, referenciaTipo = ref, nota = nota, fecha = fecha)
        ) + state.movimientos)
        sheetActivo = null
    }

    fun editarNota(movId: String, nota: String) {
        state = state.copy(movimientos = state.movimientos.map {
            if (it.id == movId) it.copy(nota = nota) else it
        })
        sheetActivo = null
    }

    fun eliminarMov(movId: String) {
        state = state.copy(movimientos = state.movimientos.filter { it.id != movId })
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
                        Wallet2(it.id, it.nombre, it.tipo, it.saldoInicial, "CUP", it.activo)
                    })
                }
            }
        }
    }
}
