package cu.lazaroysr96.sysgdcont.ui.main.screens

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
import androidx.compose.foundation.layout.width
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

// ---------------------------------------------------------------------------
// Colores semánticos por tipo de movimiento
// ---------------------------------------------------------------------------

private fun movColor(tipo: WalletMovimientoTipo): Color = when (tipo) {
    WalletMovimientoTipo.ENTRADA -> Color(0xFF059669)
    WalletMovimientoTipo.SALIDA -> Color(0xFFE11D48)
    WalletMovimientoTipo.TRANSFERENCIA -> Color(0xFF1D4ED8)
}

private fun movContainerColor(tipo: WalletMovimientoTipo): Color = when (tipo) {
    WalletMovimientoTipo.ENTRADA -> Color(0xFFECFDF5)
    WalletMovimientoTipo.SALIDA -> Color(0xFFFFF1F2)
    WalletMovimientoTipo.TRANSFERENCIA -> Color(0xFFEFF6FF)
}

private fun movIcon(tipo: WalletMovimientoTipo): ImageVector = when (tipo) {
    WalletMovimientoTipo.ENTRADA -> Icons.Outlined.ArrowUpward
    WalletMovimientoTipo.SALIDA -> Icons.Outlined.ArrowDownward
    WalletMovimientoTipo.TRANSFERENCIA -> Icons.Outlined.SwapHoriz
}

private fun movSigno(tipo: WalletMovimientoTipo): String = when (tipo) {
    WalletMovimientoTipo.ENTRADA -> "+"
    WalletMovimientoTipo.SALIDA -> "-"
    WalletMovimientoTipo.TRANSFERENCIA -> ""
}

private fun formatCupMov(value: Double): String = "$%,.2f".format(value)

// ---------------------------------------------------------------------------
// Colores semánticos por tipo de wallet
// ---------------------------------------------------------------------------

private fun walletColor(tipo: WalletTipo): Color = when (tipo) {
    WalletTipo.EFECTIVO -> Color(0xFF059669)
    WalletTipo.BANCO -> Color(0xFF1D4ED8)
    WalletTipo.MOVIL -> Color(0xFFD97706)
    WalletTipo.MERCANCIA -> Color(0xFF7C3AED)
    WalletTipo.OTRO -> Color(0xFF64748B)
}

// ---------------------------------------------------------------------------
// Screen de Movimientos (pestaña 2)
// ---------------------------------------------------------------------------

@Composable
fun CajaBancoMovimientosScreen(
    wallets: List<Wallet>,
    movimientos: List<WalletMovimiento>,
) {
    var subTab by remember { mutableIntStateOf(0) }
    val subTabs = listOf("Movimientos", "Transferencias", "Conciliación")

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(
            selectedTabIndex = subTab,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = Color(0xFF1D4ED8),
            divider = { Divider(color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp) },
            indicator = { tabPositions ->
                Box(
                    modifier = Modifier
                        .tabIndicatorOffset(tabPositions[subTab])
                        .height(2.dp)
                        .background(Color(0xFF1D4ED8)),
                )
            },
        ) {
            subTabs.forEachIndexed { i, titulo ->
                Tab(
                    selected = subTab == i,
                    onClick = { subTab = i },
                    text = {
                        Text(
                            text = titulo,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = if (subTab == i) FontWeight.Medium else FontWeight.Normal,
                        )
                    },
                    selectedContentColor = Color(0xFF1D4ED8),
                    unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        when (subTab) {
            0 -> MovimientosTab(wallets = wallets, movimientos = movimientos)
            1 -> TransferenciasTab(wallets = wallets, movimientos = movimientos.filter { it.tipo == WalletMovimientoTipo.TRANSFERENCIA })
            2 -> ConciliacionTab(wallets = wallets)
        }
    }
}

// ---------------------------------------------------------------------------
// Sub-tab: Movimientos con filtros
// ---------------------------------------------------------------------------

@Composable
private fun MovimientosTab(
    wallets: List<Wallet>,
    movimientos: List<WalletMovimiento>,
) {
    var filtroWallet by remember { mutableStateOf<String?>(null) }
    var filtroTipo by remember { mutableStateOf<WalletMovimientoTipo?>(null) }

    val filtrados = movimientos.filter { mov ->
        val walletOk = filtroWallet == null ||
            mov.walletOrigenId == filtroWallet ||
            mov.walletDestinoId == filtroWallet
        val tipoOk = filtroTipo == null || mov.tipo == filtroTipo
        walletOk && tipoOk
    }

    val totalEntradas = filtrados.filter { it.tipo == WalletMovimientoTipo.ENTRADA }.sumOf { it.monto }
    val totalSalidas = filtrados.filter { it.tipo == WalletMovimientoTipo.SALIDA }.sumOf { it.monto }

    Column(modifier = Modifier.fillMaxSize()) {
        // --- Filtro por wallet ---
        Surface(
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 0.dp,
        ) {
            Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                Text(
                    "Wallet",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 5.dp),
                )
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    FilterChip(
                        label = "Todas",
                        selected = filtroWallet == null,
                        selectedColor = Color(0xFF1D4ED8),
                        onClick = { filtroWallet = null },
                    )
                    wallets.forEach { wallet ->
                        FilterChip(
                            label = wallet.nombre,
                            selected = filtroWallet == wallet.id,
                            selectedColor = walletColor(wallet.tipo),
                            onClick = {
                                filtroWallet = if (filtroWallet == wallet.id) null else wallet.id
                            },
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    "Tipo",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 5.dp),
                )
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    FilterChip(
                        label = "Todos",
                        selected = filtroTipo == null,
                        selectedColor = Color(0xFF1D4ED8),
                        onClick = { filtroTipo = null },
                    )
                    WalletMovimientoTipo.entries.forEach { tipo ->
                        FilterChip(
                            label = tipo.name.lowercase().replaceFirstChar { it.uppercase() },
                            selected = filtroTipo == tipo,
                            selectedColor = movColor(tipo),
                            onClick = {
                                filtroTipo = if (filtroTipo == tipo) null else tipo
                            },
                        )
                    }
                }
            }
        }
        Divider(color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp)

        if (filtrados.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    "Sin movimientos para este filtro",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(vertical = 4.dp),
            ) {
                items(filtrados, key = { it.id }) { mov ->
                    val walletLabel = wallets.find { w ->
                        w.id == (mov.walletDestinoId ?: mov.walletOrigenId)
                    }?.nombre ?: "—"
                    MovimientoRow(
                        movimiento = mov,
                        walletLabel = walletLabel,
                    )
                }
            }

            // --- Barra de resumen ---
            Divider(color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp)
            Surface(color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "${filtrados.size} operaciones",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    if (filtroTipo == null || filtroTipo == WalletMovimientoTipo.ENTRADA) {
                        Text(
                            "Entradas: ",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            formatCupMov(totalEntradas),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF059669),
                        )
                    }
                    if (filtroTipo == null || filtroTipo == WalletMovimientoTipo.SALIDA) {
                        Text(
                            "Salidas: ",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            formatCupMov(totalSalidas),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFFE11D48),
                        )
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
private fun TransferenciasTab(
    wallets: List<Wallet>,
    movimientos: List<WalletMovimiento>,
) {
    if (movimientos.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Sin transferencias registradas", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        return
    }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(vertical = 4.dp),
    ) {
        items(movimientos, key = { it.id }) { mov ->
            val origen = wallets.find { it.id == mov.walletOrigenId }?.nombre ?: "—"
            val destino = wallets.find { it.id == mov.walletDestinoId }?.nombre ?: "—"
            TransferenciaRow(movimiento = mov, origen = origen, destino = destino)
        }
    }
}

// ---------------------------------------------------------------------------
// Sub-tab: Conciliación
// ---------------------------------------------------------------------------

private data class EstadoConciliacion(
    val walletNombre: String,
    val periodo: String,
    val pendientes: Int,
    val conciliado: Boolean,
)

@Composable
private fun ConciliacionTab(wallets: List<Wallet>) {
    // En producción esto vendría del ViewModel calculando movimientos sin confirmar
    val estados = wallets.map { wallet ->
        EstadoConciliacion(
            walletNombre = wallet.nombre,
            periodo = "Mayo 2026",
            pendientes = if (wallet.tipo == WalletTipo.EFECTIVO) 3 else 0,
            conciliado = wallet.tipo != WalletTipo.EFECTIVO,
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(estados) { estado ->
            ConciliacionRow(estado = estado)
        }
    }
}

// ---------------------------------------------------------------------------
// Componentes de fila
// ---------------------------------------------------------------------------

@Composable
private fun MovimientoRow(
    movimiento: WalletMovimiento,
    walletLabel: String,
) {
    val color = movColor(movimiento.tipo)
    val container = movContainerColor(movimiento.tipo)
    val icon = movIcon(movimiento.tipo)
    val signo = movSigno(movimiento.tipo)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { }
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(container),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(16.dp),
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = movimiento.nota,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = "$walletLabel · ${movimiento.tipo.name}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = "$signo${formatCupMov(movimiento.monto)}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = color,
            )
            Text(
                text = movimiento.fecha,
                style = MaterialTheme.typography.labelSmall,
                fontSize = 10.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
    Divider(
        modifier = Modifier.padding(horizontal = 14.dp),
        color = MaterialTheme.colorScheme.outlineVariant,
        thickness = 0.5.dp,
    )
}

@Composable
private fun TransferenciaRow(
    movimiento: WalletMovimiento,
    origen: String,
    destino: String,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { }
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Color(0xFFEFF6FF)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Outlined.ArrowForward,
                contentDescription = null,
                tint = Color(0xFF1D4ED8),
                modifier = Modifier.size(16.dp),
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = movimiento.nota,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = origen,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Icon(
                    Icons.Outlined.ArrowForward,
                    contentDescription = null,
                    modifier = Modifier.size(10.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    text = destino,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = formatCupMov(movimiento.monto),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = Color(0xFF1D4ED8),
            )
            Text(
                text = movimiento.fecha,
                style = MaterialTheme.typography.labelSmall,
                fontSize = 10.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
    Divider(
        modifier = Modifier.padding(horizontal = 14.dp),
        color = MaterialTheme.colorScheme.outlineVariant,
        thickness = 0.5.dp,
    )
}

@Composable
private fun ConciliacionRow(estado: EstadoConciliacion) {
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
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "${estado.walletNombre} — ${estado.periodo}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
            )
            Text(
                text = if (estado.conciliado) "Sin movimientos pendientes"
                else "${estado.pendientes} movimientos sin confirmar",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        if (estado.conciliado) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xFFECFDF5))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                Icon(Icons.Outlined.CheckCircle, null, modifier = Modifier.size(12.dp), tint = Color(0xFF065F46))
                Text("Conciliado", style = MaterialTheme.typography.labelSmall, fontSize = 10.sp, color = Color(0xFF065F46), fontWeight = FontWeight.Medium)
            }
        } else {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xFFFFFBEB))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                Icon(Icons.Outlined.HourglassEmpty, null, modifier = Modifier.size(12.dp), tint = Color(0xFF92400E))
                Text("Pendiente", style = MaterialTheme.typography.labelSmall, fontSize = 10.sp, color = Color(0xFF92400E), fontWeight = FontWeight.Medium)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Chip de filtro reutilizable
// ---------------------------------------------------------------------------

@Composable
fun FilterChip(
    label: String,
    selected: Boolean,
    selectedColor: Color,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (selected) selectedColor else MaterialTheme.colorScheme.surfaceVariant)
            .border(
                width = 0.5.dp,
                color = if (selected) selectedColor else MaterialTheme.colorScheme.outline,
                shape = RoundedCornerShape(20.dp),
            )
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 5.dp),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = if (selected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
            fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal,
        )
    }
}
