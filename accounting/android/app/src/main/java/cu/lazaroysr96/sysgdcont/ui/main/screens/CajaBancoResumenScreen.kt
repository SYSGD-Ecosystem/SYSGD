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
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.ArrowDownward
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material.icons.outlined.PhoneAndroid
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.material.icons.outlined.Storefront
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

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

private fun walletColorContainer(tipo: WalletTipo): Color = when (tipo) {
    WalletTipo.EFECTIVO -> Color(0xFFECFDF5)
    WalletTipo.BANCO -> Color(0xFFEFF6FF)
    WalletTipo.MOVIL -> Color(0xFFFFF7ED)
    WalletTipo.MERCANCIA -> Color(0xFFF5F3FF)
    WalletTipo.OTRO -> Color(0xFFF1F5F9)
}

private fun walletIcon(tipo: WalletTipo): ImageVector = when (tipo) {
    WalletTipo.EFECTIVO -> Icons.Outlined.AccountBalanceWallet
    WalletTipo.BANCO -> Icons.Outlined.AccountBalance
    WalletTipo.MOVIL -> Icons.Outlined.PhoneAndroid
    WalletTipo.MERCANCIA -> Icons.Outlined.Storefront
    WalletTipo.OTRO -> Icons.Outlined.AccountBalanceWallet
}

private fun formatCup(value: Double): String =
    "$%,.2f".format(value)

// ---------------------------------------------------------------------------
// Screen de Resumen
// ---------------------------------------------------------------------------

@Composable
fun CajaBancoResumenScreen(
    wallets: List<Wallet>,
    movimientos: List<WalletMovimiento>,
    onNuevaEntrada: () -> Unit = {},
    onNuevaSalida: () -> Unit = {},
    onNuevaTransferencia: () -> Unit = {},
    onNuevaWallet: () -> Unit = {},
) {
    val totalLiquido = wallets.filter { it.tipo != WalletTipo.MERCANCIA }.sumOf { it.saldoInicial }
    val ingresoHoy = movimientos.filter { it.tipo == WalletMovimientoTipo.ENTRADA }.sumOf { it.monto }
    val egresoHoy = movimientos.filter { it.tipo == WalletMovimientoTipo.SALIDA }.sumOf { it.monto }
    val flujoNeto = ingresoHoy - egresoHoy

    var speedDialOpen by remember { mutableStateOf(false) }
    val fabRotation by animateFloatAsState(
        targetValue = if (speedDialOpen) 45f else 0f,
        animationSpec = tween(200),
        label = "fabRotation",
    )

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 100.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // --- Estadísticas del día ---
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    StatCard(
                        modifier = Modifier.weight(1f),
                        label = "Total líquido",
                        value = formatCup(totalLiquido),
                        valueColor = Color(0xFF059669),
                        trend = "activo circulante",
                    )
                    StatCard(
                        modifier = Modifier.weight(1f),
                        label = "Flujo neto hoy",
                        value = formatCup(flujoNeto),
                        valueColor = if (flujoNeto >= 0) Color(0xFF059669) else Color(0xFFE11D48),
                        trend = if (flujoNeto >= 0) "↑ positivo" else "↓ negativo",
                        trendColor = if (flujoNeto >= 0) Color(0xFF059669) else Color(0xFFE11D48),
                    )
                }
            }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    StatCard(
                        modifier = Modifier.weight(1f),
                        label = "Ingresos hoy",
                        value = formatCup(ingresoHoy),
                        valueColor = Color(0xFF059669),
                    )
                    StatCard(
                        modifier = Modifier.weight(1f),
                        label = "Egresos hoy",
                        value = formatCup(egresoHoy),
                        valueColor = Color(0xFFE11D48),
                    )
                }
            }

            // --- Gráfico de flujo ---
            item {
                FlujoCashChart(movimientos = movimientos)
            }

            // --- Wallets ---
            item {
                Text(
                    text = "Wallets",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 2.dp),
                )
            }
            items(wallets) { wallet ->
                WalletRow(wallet = wallet)
            }
            item {
                // Botón añadir wallet
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNuevaWallet() },
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                    ),
                    border = androidx.compose.foundation.BorderStroke(
                        width = 1.dp,
                        color = MaterialTheme.colorScheme.outlineVariant,
                    ),
                    shape = RoundedCornerShape(10.dp),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Add,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Text(
                            "Nueva wallet",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }

        // --- Speed dial ---
        Column(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 16.dp),
            horizontalAlignment = Alignment.End,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            AnimatedVisibility(
                visible = speedDialOpen,
                enter = fadeIn(tween(150)) + expandVertically(tween(150), expandFrom = Alignment.Bottom),
                exit = fadeOut(tween(120)) + shrinkVertically(tween(120), shrinkTowards = Alignment.Bottom),
            ) {
                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    SpeedDialItem(
                        label = "Transferencia entre wallets",
                        icon = Icons.Outlined.SwapHoriz,
                        containerColor = Color(0xFFEFF6FF),
                        iconColor = Color(0xFF1D4ED8),
                        onClick = { speedDialOpen = false; onNuevaTransferencia() },
                    )
                    SpeedDialItem(
                        label = "Salida de dinero",
                        icon = Icons.Outlined.ArrowDownward,
                        containerColor = Color(0xFFFFF1F2),
                        iconColor = Color(0xFFE11D48),
                        onClick = { speedDialOpen = false; onNuevaSalida() },
                    )
                    SpeedDialItem(
                        label = "Entrada de dinero",
                        icon = Icons.Outlined.ArrowUpward,
                        containerColor = Color(0xFFECFDF5),
                        iconColor = Color(0xFF059669),
                        onClick = { speedDialOpen = false; onNuevaEntrada() },
                    )
                }
            }

            FloatingActionButton(
                onClick = { speedDialOpen = !speedDialOpen },
                shape = CircleShape,
                containerColor = Color(0xFF1D4ED8),
                contentColor = Color.White,
            ) {
                Icon(
                    imageVector = if (speedDialOpen) Icons.Filled.Close else Icons.Filled.Add,
                    contentDescription = if (speedDialOpen) "Cerrar" else "Nuevo movimiento",
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
private fun StatCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    valueColor: Color = Color.Unspecified,
    trend: String? = null,
    trendColor: Color = Color(0xFF64748B),
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
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Medium,
                color = valueColor,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            if (trend != null) {
                Text(
                    text = trend,
                    style = MaterialTheme.typography.labelSmall,
                    fontSize = 10.sp,
                    color = trendColor,
                )
            }
        }
    }
}

@Composable
private fun WalletRow(wallet: Wallet) {
    val color = walletColor(wallet.tipo)
    val containerColor = walletColorContainer(wallet.tipo)
    val icon = walletIcon(wallet.tipo)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(10.dp),
        border = androidx.compose.foundation.BorderStroke(
            0.5.dp,
            MaterialTheme.colorScheme.outlineVariant,
        ),
        elevation = CardDefaults.cardElevation(0.dp),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(containerColor),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(17.dp),
                    tint = color,
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = wallet.nombre,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = wallet.tipo.name,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(
                text = formatCup(wallet.saldoInicial),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = color,
            )
        }
    }
}

@Composable
private fun SpeedDialItem(
    label: String,
    icon: ImageVector,
    containerColor: Color,
    iconColor: Color,
    onClick: () -> Unit,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = androidx.compose.foundation.BorderStroke(
                0.5.dp,
                MaterialTheme.colorScheme.outlineVariant,
            ),
            elevation = CardDefaults.cardElevation(0.dp),
        ) {
            Text(
                text = label,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                style = MaterialTheme.typography.labelMedium,
            )
        }
        SmallFloatingActionButton(
            onClick = onClick,
            shape = CircleShape,
            containerColor = containerColor,
            contentColor = iconColor,
        ) {
            Icon(imageVector = icon, contentDescription = label, modifier = Modifier.size(18.dp))
        }
    }
}

// ---------------------------------------------------------------------------
// Gráfico de barras de flujo de efectivo (Canvas puro, sin dependencias)
// ---------------------------------------------------------------------------

@Composable
private fun FlujoCashChart(movimientos: List<WalletMovimiento>) {
    val dias = listOf("L", "M", "X", "J", "V", "S", "D")
    // Datos dummy por día (en producción: agrupar movimientos por fecha)
    val entradas = listOf(1200.0, 3400.0, 0.0, 950.0, 0.0, 5000.0, 0.0)
    val salidas = listOf(0.0, 800.0, 680.0, 0.0, 120.0, 0.0, 0.0)
    val netos = entradas.zip(salidas).map { (e, s) -> e - s }
    val maxVal = netos.map { kotlin.math.abs(it) }.maxOrNull()?.takeIf { it > 0 } ?: 1.0

    val colorEntrada = Color(0xFF059669)
    val colorSalida = Color(0xFFE11D48)
    val colorLinea = Color(0xFFE2E8F0)
    val colorLabel = Color(0xFF94A3B8)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(0.5.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(0.dp),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    "Flujo de efectivo",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Medium,
                )
                Text(
                    "7 días",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Spacer(Modifier.height(10.dp))
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(80.dp),
            ) {
                val w = size.width
                val h = size.height
                val midY = h * 0.5f
                val barW = w / (dias.size * 2f)
                val labelH = 18f

                drawLine(
                    color = colorLinea,
                    start = Offset(0f, midY),
                    end = Offset(w, midY),
                    strokeWidth = 0.8f,
                )

                netos.forEachIndexed { i, neto ->
                    val centerX = (i * w / dias.size) + (w / dias.size / 2f)
                    val barHeight = (kotlin.math.abs(neto) / maxVal * (midY - labelH)).toFloat()
                        .coerceAtLeast(4f)
                    val color = if (neto >= 0) colorEntrada else colorSalida
                    val top = if (neto >= 0) midY - barHeight else midY
                    drawRoundRect(
                        color = color,
                        topLeft = Offset(centerX - barW / 2f, top),
                        size = Size(barW, barHeight),
                        cornerRadius = CornerRadius(4f, 4f),
                        alpha = 0.8f,
                    )
                }
            }
            Spacer(Modifier.height(4.dp))
            Row(modifier = Modifier.fillMaxWidth()) {
                dias.forEach { dia ->
                    Text(
                        text = dia,
                        modifier = Modifier.weight(1f),
                        style = MaterialTheme.typography.labelSmall,
                        fontSize = 10.sp,
                        color = colorLabel,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    )
                }
            }
        }
    }
}
