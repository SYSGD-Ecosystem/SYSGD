package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.ListAlt
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Summarize
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import cu.lazaroysr96.sysgdcont.data.model.AnnualReport
import cu.lazaroysr96.sysgdcont.data.model.GeneralesData

private data class DashboardShortcut(
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val iconTint: Color,
    val iconBackground: Color,
    val onClick: () -> Unit,
)

@Composable
fun DashboardScreen(
    generales: GeneralesData,
    report: AnnualReport?,
    lastSync: String?,
    hasLocalChanges: Boolean,
    onOpenGenerales: () -> Unit,
    onOpenIngresos: () -> Unit,
    onOpenGastos: () -> Unit,
    onOpenTributos: () -> Unit,
    onOpenResumen: () -> Unit,
    onOpenVentas: () -> Unit,
    onOpenCatalogos: () -> Unit,
    onOpenTerceros: () -> Unit,
    onOpenDocumentos: () -> Unit,
) {
    val shortcuts = listOf(
        DashboardShortcut(
            title = "General",
            subtitle = "Datos del contribuyente",
            icon = Icons.Default.Person,
            iconTint = Color(0xFF1177F2),
            iconBackground = Color(0xFFD8EBFF),
            onClick = onOpenGenerales,
        ),
        DashboardShortcut(
            title = "Ingresos",
            subtitle = "Registro diario de entradas",
            icon = Icons.Default.TrendingUp,
            iconTint = Color(0xFF1FA463),
            iconBackground = Color(0xFFDDF6E9),
            onClick = onOpenIngresos,
        ),
        DashboardShortcut(
            title = "Gastos",
            subtitle = "Control de salidas",
            icon = Icons.Default.TrendingDown,
            iconTint = Color(0xFFFF8E3C),
            iconBackground = Color(0xFFFFEDD9),
            onClick = onOpenGastos,
        ),
        DashboardShortcut(
            title = "Tributos",
            subtitle = "Obligaciones y cálculos",
            icon = Icons.Default.AccountBalance,
            iconTint = Color(0xFF7B61FF),
            iconBackground = Color(0xFFEAE4FF),
            onClick = onOpenTributos,
        ),
        DashboardShortcut(
            title = "Resumen",
            subtitle = "Totales y PDF anual",
            icon = Icons.Default.Summarize,
            iconTint = Color(0xFF0A7EA4),
            iconBackground = Color(0xFFD8F4FF),
            onClick = onOpenResumen,
        ),
        DashboardShortcut(
            title = "Punto de venta",
            subtitle = "Ventas y compras",
            icon = Icons.Default.Inventory2,
            iconTint = Color(0xFF118AB2),
            iconBackground = Color(0xFFD6F4FB),
            onClick = onOpenVentas,
        ),
        DashboardShortcut(
            title = "Catálogos",
            subtitle = "Cuentas y productos",
            icon = Icons.Default.ListAlt,
            iconTint = Color(0xFF2864DC),
            iconBackground = Color(0xFFE0E8FF),
            onClick = onOpenCatalogos,
        ),
        DashboardShortcut(
            title = "Terceros",
            subtitle = "Clientes, deudas y cuentas",
            icon = Icons.Default.People,
            iconTint = Color(0xFF9A4DCC),
            iconBackground = Color(0xFFF1E2FF),
            onClick = onOpenTerceros,
        ),
        DashboardShortcut(
            title = "Documentos",
            subtitle = "Archivos y evidencias",
            icon = Icons.Default.Description,
            iconTint = Color(0xFFB77016),
            iconBackground = Color(0xFFFFF0DB),
            onClick = onOpenDocumentos,
        ),
    )

    val nombreContribuyente = generales.nombre.takeIf { it.isNotBlank() } ?: "Tu negocio"
    val anio = generales.anio
    val ingresos = report?.totalIngresos ?: 0.0
    val gastos = report?.totalGastos ?: 0.0
    val neto = report?.baseImponible ?: 0.0
    val latestMonth = report?.monthly
        ?.maxByOrNull { it.ingresos + it.gastos + it.tributos + it.otrosDeducibles }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF2F5FA))
            .verticalScroll(rememberScrollState())
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(Color(0xFF0E7AE6), Color(0xFF34D0BE))
                    ),
                    shape = RoundedCornerShape(bottomStart = 34.dp, bottomEnd = 34.dp)
                )
                .padding(horizontal = 20.dp, vertical = 20.dp)
        ) {
            Column {
                Text(
                    text = "Panel principal",
                    style = MaterialTheme.typography.labelLarge,
                    color = Color.White.copy(alpha = 0.88f)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = nombreContribuyente,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Visión rápida del año $anio y acceso a todas las herramientas.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.92f)
                )
                Spacer(modifier = Modifier.height(20.dp))
                DashboardHeroCard(
                    ingresos = ingresos,
                    gastos = gastos,
                    neto = neto,
                    lastSync = lastSync,
                    hasLocalChanges = hasLocalChanges,
                    latestMonthLabel = latestMonth?.month,
                )
            }
        }

        Column(
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            DashboardInsightsCard(
                actividad = generales.actividad,
                nit = generales.nit,
                codigoOnat = generales.codigo,
                latestMonthLabel = latestMonth?.month,
                latestMonthNet = latestMonth?.neto,
            )

            Text(
                text = "Accesos rápidos",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF162033)
            )

            shortcuts.chunked(2).forEach { rowItems ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    rowItems.forEach { item ->
                        DashboardShortcutCard(
                            shortcut = item,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    if (rowItems.size == 1) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
        }
    }
}

@Composable
private fun DashboardHeroCard(
    ingresos: Double,
    gastos: Double,
    neto: Double,
    lastSync: String?,
    hasLocalChanges: Boolean,
    latestMonthLabel: String?,
) {
    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(Color(0xFF123B6D), Color(0xFF0F5B97), Color(0xFF1A88B5))
                    )
                )
                .padding(20.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Balance acumulado",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White.copy(alpha = 0.88f)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = formatMoney(neto),
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    StatusPill(
                        text = if (hasLocalChanges) "Pendiente de sincronizar" else "Datos al día",
                        background = if (hasLocalChanges) Color(0x33FFB15C) else Color(0x3328D17C),
                        contentColor = Color.White
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    HeroMetric(label = "Ingresos", value = formatMoney(ingresos), modifier = Modifier.weight(1f))
                    HeroMetric(label = "Gastos", value = formatMoney(gastos), modifier = Modifier.weight(1f))
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = lastSync?.takeIf { it.isNotBlank() }?.let { "Última sincronización: $it" }
                            ?: "Aún no hay una sincronización registrada",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.80f),
                        modifier = Modifier.weight(1f)
                    )

                    latestMonthLabel?.let {
                        Spacer(modifier = Modifier.width(12.dp))
                        StatusPill(
                            text = "Mes fuerte: $it",
                            background = Color(0x26FFFFFF),
                            contentColor = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HeroMetric(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = Color.White.copy(alpha = 0.14f)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelLarge,
                color = Color.White.copy(alpha = 0.80f)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

@Composable
private fun DashboardInsightsCard(
    actividad: String,
    nit: String,
    codigoOnat: String,
    latestMonthLabel: String?,
    latestMonthNet: Double?,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(
                text = "Estado del registro",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF162033)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                InsightBlock(
                    title = "Actividad",
                    value = actividad.ifBlank { "Pendiente por completar" },
                    modifier = Modifier.weight(1f)
                )
                InsightBlock(
                    title = "NIT",
                    value = nit.ifBlank { "Sin definir" },
                    modifier = Modifier.weight(1f)
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                InsightBlock(
                    title = "Código ONAT",
                    value = codigoOnat.ifBlank { "Sin definir" },
                    modifier = Modifier.weight(1f)
                )
                InsightBlock(
                    title = "Mes destacado",
                    value = if (latestMonthLabel != null && latestMonthNet != null) {
                        "$latestMonthLabel · ${formatMoney(latestMonthNet)}"
                    } else {
                        "Sin movimiento todavía"
                    },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun InsightBlock(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFFF4F8FD))
            .padding(14.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelMedium,
            color = Color(0xFF5F6D82)
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF162033),
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DashboardShortcutCard(
    shortcut: DashboardShortcut,
    modifier: Modifier = Modifier,
) {
    Card(
        onClick = shortcut.onClick,
        modifier = modifier,
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(58.dp)
                    .background(shortcut.iconBackground, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = shortcut.icon,
                    contentDescription = shortcut.title,
                    tint = shortcut.iconTint,
                    modifier = Modifier.size(28.dp)
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = shortcut.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF162033)
                )
                Text(
                    text = shortcut.subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF64748B),
                    minLines = 2,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
private fun StatusPill(
    text: String,
    background: Color,
    contentColor: Color,
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(background)
            .border(1.dp, Color.White.copy(alpha = 0.14f), RoundedCornerShape(999.dp))
            .padding(horizontal = 12.dp, vertical = 7.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(contentColor, CircleShape)
        )
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            color = contentColor
        )
    }
}

private fun formatMoney(value: Double): String = "${String.format("%.2f", value)} CUP"
