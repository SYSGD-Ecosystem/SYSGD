package cu.lazaroysr96.sysgdcont.ui.main.screens

import cu.lazaroysr96.sysgdcont.data.model.*
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Assessment
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.TableChart
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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

// ---------------------------------------------------------------------------
// Modelo de reporte
// ---------------------------------------------------------------------------

private data class TipoReporte(
    val id: String,
    val nombre: String,
    val descripcion: String,
    val icon: ImageVector,
    val iconColor: Color,
    val iconContainer: Color,
)

private val tiposReporte = listOf(
    TipoReporte(
        id = "flujo",
        nombre = "Flujo de efectivo",
        descripcion = "Entradas, salidas y saldo neto por período",
        icon = Icons.Outlined.Assessment,
        iconColor = Color(0xFF1D4ED8),
        iconContainer = Color(0xFFEFF6FF),
    ),
    TipoReporte(
        id = "estado_wallet",
        nombre = "Estado por wallet",
        descripcion = "Saldo inicial, movimientos y saldo final de cada wallet",
        icon = Icons.Outlined.Description,
        iconColor = Color(0xFF059669),
        iconContainer = Color(0xFFECFDF5),
    ),
    TipoReporte(
        id = "resumen_mensual",
        nombre = "Resumen mensual",
        descripcion = "Tabla consolidada para declaración TCP",
        icon = Icons.Outlined.TableChart,
        iconColor = Color(0xFFD97706),
        iconContainer = Color(0xFFFFF7ED),
    ),
    TipoReporte(
        id = "conciliaciones",
        nombre = "Historial de conciliaciones",
        descripcion = "Cierre contable por wallet y mes",
        icon = Icons.Outlined.History,
        iconColor = Color(0xFF993556),
        iconContainer = Color(0xFFFBEAF0),
    ),
)

// Períodos disponibles (en producción: generados dinámicamente desde los datos)
private val periodos = listOf(
    "Mayo 2026",
    "Abril 2026",
    "Marzo 2026",
    "Febrero 2026",
    "Enero 2026",
)

// ---------------------------------------------------------------------------
// Screen de Reportes (pestaña 3)
// ---------------------------------------------------------------------------

@Composable
fun CajaBancoReportesScreen(
    wallets: List<Wallet2>,
    onGenerarPdf: (periodoLabel: String, tipoId: String) -> Unit = { _, _ -> },
) {
    var periodoSeleccionado by remember { mutableStateOf(periodos.first()) }
    var tipoSeleccionado by remember { mutableStateOf<TipoReporte?>(null) }
    var expandirPeriodos by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // --- Selector de período ---
        item {
            Text(
                "Período",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 2.dp),
            )
        }
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .border(0.5.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(10.dp))
                    .background(MaterialTheme.colorScheme.surface),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { expandirPeriodos = !expandirPeriodos }
                        .padding(horizontal = 12.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        Icons.Outlined.CalendarMonth,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        text = periodoSeleccionado,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 10.dp),
                    )
                    Icon(
                        Icons.Outlined.ExpandMore,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                if (expandirPeriodos) {
                    Divider(color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp)
                    periodos.forEach { periodo ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    periodoSeleccionado = periodo
                                    expandirPeriodos = false
                                }
                                .background(
                                    if (periodo == periodoSeleccionado)
                                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                    else Color.Transparent
                                )
                                .padding(horizontal = 12.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = periodo,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = if (periodo == periodoSeleccionado) FontWeight.Medium else FontWeight.Normal,
                                color = if (periodo == periodoSeleccionado)
                                    Color(0xFF1D4ED8)
                                else MaterialTheme.colorScheme.onSurface,
                            )
                        }
                        if (periodo != periodos.last()) {
                            Divider(
                                modifier = Modifier.padding(horizontal = 12.dp),
                                color = MaterialTheme.colorScheme.outlineVariant,
                                thickness = 0.5.dp,
                            )
                        }
                    }
                }
            }
        }

        // --- Tipo de reporte ---
        item {
            Text(
                "Tipo de reporte",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 2.dp),
            )
        }
        items(tiposReporte) { tipo ->
            ReporteOpcion(
                tipo = tipo,
                selected = tipoSeleccionado?.id == tipo.id,
                onClick = {
                    tipoSeleccionado = if (tipoSeleccionado?.id == tipo.id) null else tipo
                },
            )
        }

        // --- Botón generar ---
        item {
            Spacer(Modifier.height(4.dp))
            Button(
                onClick = {
                    tipoSeleccionado?.let { tipo ->
                        onGenerarPdf(periodoSeleccionado, tipo.id)
                    }
                },
                enabled = tipoSeleccionado != null,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF1D4ED8),
                    disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                ),
                contentPadding = PaddingValues(vertical = 13.dp),
            ) {
                Text(
                    text = if (tipoSeleccionado != null)
                        "Generar PDF · ${tipoSeleccionado!!.nombre}"
                    else "Selecciona un tipo de reporte",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Componente: opción de reporte seleccionable
// ---------------------------------------------------------------------------

@Composable
private fun ReporteOpcion(
    tipo: TipoReporte,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(
                width = if (selected) 1.5.dp else 0.5.dp,
                color = if (selected) Color(0xFF1D4ED8) else MaterialTheme.colorScheme.outlineVariant,
                shape = RoundedCornerShape(10.dp),
            )
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(9.dp))
                .background(tipo.iconContainer),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = tipo.icon,
                contentDescription = null,
                tint = tipo.iconColor,
                modifier = Modifier.size(18.dp),
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = tipo.nombre,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal,
                color = if (selected) Color(0xFF1D4ED8) else MaterialTheme.colorScheme.onSurface,
            )
            Text(
                text = tipo.descripcion,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
        if (selected) {
            Box(
                modifier = Modifier
                    .size(18.dp)
                    .clip(RoundedCornerShape(50.dp))
                    .background(Color(0xFF1D4ED8)),
                contentAlignment = Alignment.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(7.dp)
                        .clip(RoundedCornerShape(50.dp))
                        .background(Color.White),
                )
            }
        }
    }
}
