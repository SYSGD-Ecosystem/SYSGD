package cu.lazaroysr96.sysgdcont.ui.main.screens

import cu.lazaroysr96.sysgdcont.data.model.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ArrowDownward
import androidx.compose.material.icons.outlined.ArrowForward
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.HourglassEmpty
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cu.lazaroysr96.sysgdcont.BuildConfig

@Composable
fun CajaBancoMovimientosScreen(
    state: CajaBancoState,
    onMovimientoClick: (WalletMovimiento) -> Unit = {},
) {
    var subTab by remember { mutableIntStateOf(0) }
    val subTabs = remember {
        if (BuildConfig.DEBUG) {
            listOf("Movimientos", "Transferencias", "Conciliación")
        } else {
            listOf("Movimientos", "Transferencias")
        }
    }

    Column(Modifier.fillMaxSize()) {
        TabRow(
            selectedTabIndex = subTab,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = Color(0xFF1D4ED8),
            divider = { Divider(color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp) },
            indicator = { tabs ->
                Box(
                    Modifier.tabIndicatorOffset(tabs[subTab]).height(2.dp)
                        .background(Color(0xFF1D4ED8))
                )
            },
        ) {
            subTabs.forEachIndexed { i, t ->
                Tab(
                    selected = subTab == i,
                    onClick = { subTab = i },
                    text = {
                        Text(t, style = MaterialTheme.typography.labelMedium,
                            fontWeight = if (subTab == i) FontWeight.Medium else FontWeight.Normal)
                    },
                    selectedContentColor = Color(0xFF1D4ED8),
                    unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        when (subTab) {
            0 -> MovimientosTab(state, onMovimientoClick)
            1 -> TransferenciasTab(state, onMovimientoClick)
            2 -> if (BuildConfig.DEBUG) ConciliacionTab(state)
        }
    }
}

// ---------------------------------------------------------------------------
// Sub-tab: Movimientos con filtros
// ---------------------------------------------------------------------------

@Composable
private fun MovimientosTab(state: CajaBancoState, onMovimientoClick: (WalletMovimiento) -> Unit) {
    var filtroWallet by remember { mutableStateOf<String?>(null) }
    var filtroTipo by remember { mutableStateOf<WalletMovimientoTipo?>(null) }

    val filtrados = state.movimientos.filter { mov ->
        val wOk = filtroWallet == null || mov.walletOrigenId == filtroWallet || mov.walletDestinoId == filtroWallet
        val tOk = filtroTipo == null || mov.tipo == filtroTipo
        wOk && tOk
    }

    val totEnt = filtrados.filter { it.tipo == WalletMovimientoTipo.ENTRADA }.sumOf { it.monto * it.tasaAlMomento }
    val totSal = filtrados.filter { it.tipo == WalletMovimientoTipo.SALIDA }.sumOf { it.monto * it.tasaAlMomento }

    Column(Modifier.fillMaxSize()) {
        // Filtros
        Surface(color = MaterialTheme.colorScheme.surface) {
            Column(Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                Text("Wallet", style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 5.dp))
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    FilterChip2("Todas", filtroWallet == null, Color(0xFF1D4ED8)) { filtroWallet = null }
                    state.wallets.filter { it.activo }.forEach { w ->
                        FilterChip2(w.nombre, filtroWallet == w.id, walletColorOf(w.tipo)) {
                            filtroWallet = if (filtroWallet == w.id) null else w.id
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
                Text("Tipo", style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 5.dp))
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    FilterChip2("Todos", filtroTipo == null, Color(0xFF1D4ED8)) { filtroTipo = null }
                    WalletMovimientoTipo.entries.forEach { tipo ->
                        FilterChip2(
                            tipo.name.lowercase().replaceFirstChar { it.uppercase() },
                            filtroTipo == tipo,
                            movColorOf(tipo),
                        ) { filtroTipo = if (filtroTipo == tipo) null else tipo }
                    }
                }
            }
        }
        Divider(color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp)

        if (filtrados.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Sin movimientos para este filtro",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(vertical = 4.dp)) {
                items(filtrados.sortedByDescending { it.fecha }, key = { it.id }) { mov ->
                    val wLabel = when (mov.tipo) {
                        WalletMovimientoTipo.ENTRADA ->
                            state.wallets.find { it.id == mov.walletDestinoId }?.nombre ?: "—"
                        WalletMovimientoTipo.SALIDA ->
                            state.wallets.find { it.id == mov.walletOrigenId }?.nombre ?: "—"
                        WalletMovimientoTipo.TRANSFERENCIA ->
                            (state.wallets.find { it.id == mov.walletOrigenId }?.nombre ?: "—") +
                                " → " + (state.wallets.find { it.id == mov.walletDestinoId }?.nombre ?: "—")
                    }
                    MovimientoRow2(mov, wLabel, state.nombreMoneda(mov.monedaId)) { onMovimientoClick(mov) }
                }
            }
            // Barra de resumen
            Divider(color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp)
            Surface(color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)) {
                Row(
                    Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("${filtrados.size} ops",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (filtroTipo == null || filtroTipo == WalletMovimientoTipo.ENTRADA) {
                        Text("Ent: ", style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(formatCup(totEnt), style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Medium, color = Color(0xFF059669))
                    }
                    if (filtroTipo == null || filtroTipo == WalletMovimientoTipo.SALIDA) {
                        Text("Sal: ", style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(formatCup(totSal), style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Medium, color = Color(0xFFE11D48))
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Sub-tab: Transferencias
// ---------------------------------------------------------------------------

@Composable
private fun TransferenciasTab(state: CajaBancoState, onMovimientoClick: (WalletMovimiento) -> Unit) {
    val transferencias = state.movimientos.filter { it.tipo == WalletMovimientoTipo.TRANSFERENCIA }
    if (transferencias.isEmpty()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Sin transferencias registradas", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        return
    }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(vertical = 4.dp)) {
        items(transferencias.sortedByDescending { it.fecha }, key = { it.id }) { mov ->
            val origen = state.wallets.find { it.id == mov.walletOrigenId }?.nombre ?: "—"
            val destino = state.wallets.find { it.id == mov.walletDestinoId }?.nombre ?: "—"
            val moneda = state.nombreMoneda(mov.monedaId)
            TransferenciaRow2(mov, origen, destino, moneda) { onMovimientoClick(mov) }
        }
    }
}

// ---------------------------------------------------------------------------
// Sub-tab: Conciliación
// ---------------------------------------------------------------------------

@Composable
private fun ConciliacionTab(state: CajaBancoState) {
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(state.wallets.filter { it.activo }) { wallet ->
            val sinConfirmar = state.movimientos.count {
                (it.walletOrigenId == wallet.id || it.walletDestinoId == wallet.id)
            }.let { if (wallet.tipo == WalletTipo.EFECTIVO) it % 4 else 0 }
            val ok = sinConfirmar == 0
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .border(0.5.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(10.dp))
                    .clickable { }
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Column(Modifier.weight(1f)) {
                    Text("${wallet.nombre} — Mayo 2026",
                        style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                    Text(
                        if (ok) "Sin movimientos pendientes" else "$sinConfirmar movimientos sin confirmar",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                StatusBadge(ok)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Filas de movimiento
// ---------------------------------------------------------------------------

@Composable
fun MovimientoRow2(
    mov: WalletMovimiento,
    walletLabel: String,
    monedaTipo: String,
    onClick: () -> Unit = {},
) {
    val color = movColorOf(mov.tipo)
    val container = movContainerOf(mov.tipo)
    val icon: ImageVector = when (mov.tipo) {
        WalletMovimientoTipo.ENTRADA -> Icons.Outlined.ArrowUpward
        WalletMovimientoTipo.SALIDA -> Icons.Outlined.ArrowDownward
        WalletMovimientoTipo.TRANSFERENCIA -> Icons.Outlined.SwapHoriz
    }
    val signo = movSignoOf(mov.tipo)

    Row(
        modifier = Modifier.fillMaxWidth().clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            Modifier.size(32.dp).clip(RoundedCornerShape(8.dp)).background(container),
            contentAlignment = Alignment.Center,
        ) { Icon(icon, null, Modifier.size(16.dp), tint = color) }
        Column(Modifier.weight(1f)) {
            Text(mov.nota.ifBlank { mov.referenciaTipo?.name ?: mov.tipo.name },
                style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium,
                maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text("$walletLabel · $monedaTipo",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Column(horizontalAlignment = Alignment.End) {
            val montoEnCup = mov.monto * mov.tasaAlMomento
            Text("$signo${formatCup(montoEnCup)}", style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium, color = color)
            if (monedaTipo != "CUP") {
                Text("${mov.monto} $monedaTipo @ ${mov.tasaAlMomento}",
                    style = MaterialTheme.typography.labelSmall, fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                Text(mov.fecha, style = MaterialTheme.typography.labelSmall, fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
    Divider(Modifier.padding(horizontal = 14.dp), color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp)
}

@Composable
private fun TransferenciaRow2(
    mov: WalletMovimiento, origen: String, destino: String, monedaTipo: String, onClick: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            Modifier.size(32.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFFEFF6FF)),
            contentAlignment = Alignment.Center,
        ) { Icon(Icons.Outlined.ArrowForward, null, Modifier.size(16.dp), tint = Color(0xFF1D4ED8)) }
        Column(Modifier.weight(1f)) {
            Text(mov.nota.ifBlank { "Transferencia" }, style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(origen, style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                Icon(Icons.Outlined.ArrowForward, null, Modifier.size(10.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(destino, style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(formatCup(mov.monto * mov.tasaAlMomento), style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium, color = Color(0xFF1D4ED8))
            Text(mov.fecha, style = MaterialTheme.typography.labelSmall, fontSize = 10.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
    Divider(Modifier.padding(horizontal = 14.dp), color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp)
}

// ---------------------------------------------------------------------------
// Chips y badges reutilizables
// ---------------------------------------------------------------------------

@Composable
fun FilterChip2(label: String, selected: Boolean, selectedColor: Color, onClick: () -> Unit) {
    Box(
        Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (selected) selectedColor else MaterialTheme.colorScheme.surfaceVariant)
            .border(0.5.dp, if (selected) selectedColor else MaterialTheme.colorScheme.outline, RoundedCornerShape(20.dp))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 5.dp),
    ) {
        Text(label, style = MaterialTheme.typography.labelSmall,
            color = if (selected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
            fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal)
    }
}

@Composable
private fun StatusBadge(ok: Boolean) {
    val bg = if (ok) Color(0xFFECFDF5) else Color(0xFFFFFBEB)
    val fg = if (ok) Color(0xFF065F46) else Color(0xFF92400E)
    val icon = if (ok) Icons.Outlined.CheckCircle else Icons.Outlined.HourglassEmpty
    val label = if (ok) "Conciliado" else "Pendiente"
    Row(
        Modifier.clip(RoundedCornerShape(20.dp)).background(bg).padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        Icon(icon, null, Modifier.size(12.dp), tint = fg)
        Text(label, style = MaterialTheme.typography.labelSmall, fontSize = 10.sp,
            color = fg, fontWeight = FontWeight.Medium)
    }
}
