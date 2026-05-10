package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.ArrowDownward
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material.icons.outlined.MoreVert
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun CajaBancoResumenScreen(
    state: CajaBancoState,
    onNuevaEntrada: () -> Unit = {},
    onNuevaSalida: () -> Unit = {},
    onNuevaTransferencia: () -> Unit = {},
    onNuevaWallet: () -> Unit = {},
    onEditarWallet: (Wallet2) -> Unit = {},
    onEliminarWallet: (Wallet2) -> Unit = {},
) {
    val totalLiquido = state.totalLiquido()
    val ingresos = state.totalEntradas()
    val egresos = state.totalSalidas()
    val neto = ingresos - egresos

    var speedOpen by remember { mutableStateOf(false) }
    val fabRotation by animateFloatAsState(
        targetValue = if (speedOpen) 45f else 0f,
        animationSpec = tween(200),
        label = "fabRot",
    )

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 100.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // Métricas
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatCard(Modifier.weight(1f), "Total líquido", formatCup(totalLiquido),
                        if (totalLiquido >= 0) Color(0xFF059669) else Color(0xFFE11D48))
                    StatCard(Modifier.weight(1f), "Flujo neto", formatCup(neto),
                        if (neto >= 0) Color(0xFF059669) else Color(0xFFE11D48))
                }
            }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatCard(Modifier.weight(1f), "Ingresos", formatCup(ingresos), Color(0xFF059669))
                    StatCard(Modifier.weight(1f), "Egresos", formatCup(egresos), Color(0xFFE11D48))
                }
            }

            // Gráfico de flujo
            item { FlujoCashChart(state) }

            // Wallets
            item {
                Text(
                    "Wallets",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 2.dp),
                )
            }
            items(state.wallets.filter { it.activo }) { wallet ->
                Wallet2Row(
                    wallet = wallet,
                    saldo = state.saldoWallet(wallet.id),
                    moneda = state.monedas.monedaById(wallet.monedaId),
                    onEditar = { onEditarWallet(wallet) },
                    onEliminar = { onEliminarWallet(wallet) },
                )
            }

            // Botón nueva wallet
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { onNuevaWallet() },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                    shape = RoundedCornerShape(10.dp),
                    elevation = CardDefaults.cardElevation(0.dp),
                ) {
                    Row(
                        Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Box(
                            Modifier.size(32.dp).clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(Icons.Filled.Add, null, Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Text("Nueva wallet", style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }

        // Speed dial
        Column(
            modifier = Modifier.align(Alignment.BottomEnd).padding(end = 16.dp, bottom = 16.dp),
            horizontalAlignment = Alignment.End,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AnimatedVisibility(
                visible = speedOpen,
                enter = fadeIn(tween(150)) + expandVertically(tween(150), expandFrom = Alignment.Bottom),
                exit = fadeOut(tween(120)) + shrinkVertically(tween(120), shrinkTowards = Alignment.Bottom),
            ) {
                Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    SpeedDialItem("Transferencia entre wallets", Icons.Outlined.SwapHoriz,
                        Color(0xFFEFF6FF), Color(0xFF1D4ED8)) { speedOpen = false; onNuevaTransferencia() }
                    SpeedDialItem("Salida de dinero", Icons.Outlined.ArrowDownward,
                        Color(0xFFFFF1F2), Color(0xFFE11D48)) { speedOpen = false; onNuevaSalida() }
                    SpeedDialItem("Entrada de dinero", Icons.Outlined.ArrowUpward,
                        Color(0xFFECFDF5), Color(0xFF059669)) { speedOpen = false; onNuevaEntrada() }
                }
            }
            FloatingActionButton(
                onClick = { speedOpen = !speedOpen },
                shape = CircleShape,
                containerColor = Color(0xFF1D4ED8),
                contentColor = Color.White,
            ) {
                Icon(
                    if (speedOpen) Icons.Filled.Close else Icons.Filled.Add,
                    if (speedOpen) "Cerrar" else "Nuevo movimiento",
                    modifier = Modifier.rotate(fabRotation),
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Componentes
// ---------------------------------------------------------------------------

@Composable
fun StatCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    valueColor: Color = Color.Unspecified,
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        ),
        shape = RoundedCornerShape(10.dp),
        elevation = CardDefaults.cardElevation(0.dp),
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Medium, color = valueColor,
                maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
fun Wallet2Row(
    wallet: Wallet2,
    saldo: Double,
    moneda: Moneda?,
    onEditar: () -> Unit = {},
    onEliminar: () -> Unit = {},
) {
    val color = walletColorOf(wallet.tipo)
    val container = walletContainerOf(wallet.tipo)
    val icon = walletIconOf(wallet.tipo)
    var menuOpen by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(10.dp),
        border = androidx.compose.foundation.BorderStroke(0.5.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(0.dp),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Box(
                Modifier.size(32.dp).clip(RoundedCornerShape(8.dp)).background(container),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, null, Modifier.size(17.dp), tint = color)
            }
            Column(Modifier.weight(1f)) {
                Text(wallet.nombre, style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(tipoWalletLabel(wallet.tipo), style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (moneda != null && moneda.tipo != "CUP") {
                        Text("· ${moneda.tipo}", style = MaterialTheme.typography.labelSmall,
                            color = color)
                    }
                }
            }
            Text(formatCup(saldo), style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium, color = if (saldo >= 0) color else Color(0xFFE11D48))
            Box {
                Icon(Icons.Outlined.MoreVert, "Opciones",
                    modifier = Modifier.size(18.dp).clickable { menuOpen = true },
                    tint = MaterialTheme.colorScheme.onSurfaceVariant)
                DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                    DropdownMenuItem(
                        text = { Text("Editar") },
                        onClick = { menuOpen = false; onEditar() },
                        leadingIcon = { Icon(Icons.Outlined.Edit, null, Modifier.size(17.dp)) },
                    )
                    DropdownMenuItem(
                        text = { Text("Eliminar", color = MaterialTheme.colorScheme.error) },
                        onClick = { menuOpen = false; onEliminar() },
                        leadingIcon = {
                            Icon(Icons.Outlined.Delete, null, Modifier.size(17.dp),
                                tint = MaterialTheme.colorScheme.error)
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun SpeedDialItem(
    label: String, icon: ImageVector, container: Color, iconColor: Color, onClick: () -> Unit,
) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = androidx.compose.foundation.BorderStroke(0.5.dp, MaterialTheme.colorScheme.outlineVariant),
            elevation = CardDefaults.cardElevation(0.dp),
        ) {
            Text(label, modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                style = MaterialTheme.typography.labelMedium)
        }
        SmallFloatingActionButton(onClick = onClick, shape = CircleShape,
            containerColor = container, contentColor = iconColor) {
            Icon(icon, label, Modifier.size(18.dp))
        }
    }
}

// ---------------------------------------------------------------------------
// Gráfico de barras — Canvas puro
// ---------------------------------------------------------------------------

@Composable
private fun FlujoCashChart(state: CajaBancoState) {
    // Agrupar últimos 7 días desde movimientos reales
    val dias = listOf("L", "M", "X", "J", "V", "S", "D")
    // Datos demo por día (en producción: agrupar state.movimientos por fecha)
    val entradas = listOf(1200.0, 3400.0, 0.0, 950.0, 0.0, 5000.0, 0.0)
    val salidas = listOf(0.0, 800.0, 680.0, 0.0, 120.0, 0.0, 0.0)
    val netos = entradas.zip(salidas).map { (e, s) -> e - s }
    val maxVal = netos.map { kotlin.math.abs(it) }.maxOrNull()?.takeIf { it > 0 } ?: 1.0

    val colorEnt = Color(0xFF059669)
    val colorSal = Color(0xFFE11D48)
    val colorGrid = Color(0xFFE2E8F0)
    val colorLbl = Color(0xFF94A3B8)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(0.5.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(0.dp),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically) {
                Text("Flujo de efectivo", style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Medium)
                Text("7 días", style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(Modifier.height(10.dp))
            Canvas(modifier = Modifier.fillMaxWidth().height(90.dp)) {
                val w = size.width
                val h = size.height
                val midY = h * 0.5f
                val barW = w / (dias.size * 2.2f)
                val labelH = 18f

                drawLine(colorGrid, Offset(0f, midY), Offset(w, midY), 0.8f)

                netos.forEachIndexed { i, neto ->
                    val cx = (i * w / dias.size) + w / dias.size / 2f
                    val barH = (kotlin.math.abs(neto) / maxVal * (midY - labelH)).toFloat().coerceAtLeast(4f)
                    val top = if (neto >= 0) midY - barH else midY
                    drawRoundRect(
                        color = if (neto >= 0) colorEnt else colorSal,
                        topLeft = Offset(cx - barW / 2, top),
                        size = Size(barW, barH),
                        cornerRadius = CornerRadius(4f),
                        alpha = 0.8f,
                    )
                }
            }
            Spacer(Modifier.height(4.dp))
            Row(Modifier.fillMaxWidth()) {
                dias.forEach { dia ->
                    Text(dia, Modifier.weight(1f), style = MaterialTheme.typography.labelSmall,
                        fontSize = 10.sp, color = colorLbl, textAlign = TextAlign.Center)
                }
            }
        }
    }
}
