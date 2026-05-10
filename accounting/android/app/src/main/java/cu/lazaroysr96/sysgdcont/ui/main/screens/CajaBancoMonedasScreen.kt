package cu.lazaroysr96.sysgdcont.ui.main.screens

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
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun CajaBancoMonedasScreen(
    state: CajaBancoState,
    onNuevaMoneda: () -> Unit = {},
    onEditarTasa: (Moneda) -> Unit = {},
    onEliminarMoneda: (Moneda) -> Unit = {},
) {
    val base = state.monedaBase()
    val otras = state.monedas.filter { it.tipo != "CUP" }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Header
        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text("Monedas y tasas", style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Medium)
                    Text("Tasas respecto a ${base?.tipo ?: "CUP"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Box(
                    Modifier.size(36.dp).clip(RoundedCornerShape(10.dp))
                        .background(Color(0xFF1D4ED8)).clickable { onNuevaMoneda() },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Outlined.Add, "Nueva moneda", Modifier.size(18.dp), tint = Color.White)
                }
            }
        }

        // Moneda base
        if (base != null) {
            item {
                MonedaBaseCard(base)
            }
        }

        // Otras monedas
        if (otras.isNotEmpty()) {
            item {
                Text("Otras monedas", style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 2.dp))
            }
            items(otras) { moneda ->
                MonedaCard(
                    moneda = moneda,
                    tasa = state.tasaDe(moneda.id),
                    monedaBase = base,
                    onEditarTasa = { onEditarTasa(moneda) },
                    onEliminar = { onEliminarMoneda(moneda) },
                )
            }
        } else {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                    elevation = CardDefaults.cardElevation(0.dp),
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text("Sin otras monedas",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center)
                        Spacer(Modifier.height(6.dp))
                        Text("Añade divisas como USD, EUR o MLC para\nregistrar movimientos en moneda extranjera.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center)
                        Spacer(Modifier.height(16.dp))
                        Box(
                            Modifier.clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF1D4ED8)).clickable { onNuevaMoneda() }
                                .padding(horizontal = 16.dp, vertical = 8.dp),
                        ) {
                            Text("+ Nueva moneda", style = MaterialTheme.typography.labelMedium,
                                color = Color.White, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Componentes
// ---------------------------------------------------------------------------

@Composable
private fun MonedaBaseCard(moneda: Moneda) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFECFDF5)),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(0.5.dp, Color(0xFF6EE7B7)),
        elevation = CardDefaults.cardElevation(0.dp),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                Modifier.size(40.dp).clip(CircleShape).background(Color(0xFFD1FAE5)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Outlined.Star, null, Modifier.size(20.dp), tint = Color(0xFF059669))
            }
            Column(Modifier.weight(1f)) {
                Text(moneda.nombre, style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium, color = Color(0xFF065F46))
                Text("Moneda base del sistema · tasa 1.0",
                    style = MaterialTheme.typography.labelSmall, color = Color(0xFF059669))
            }
            Box(
                Modifier.clip(RoundedCornerShape(20.dp)).background(Color(0xFFD1FAE5))
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            ) {
                Text(moneda.tipo, style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Medium, color = Color(0xFF065F46))
            }
        }
    }
}

@Composable
private fun MonedaCard(
    moneda: Moneda,
    tasa: Double,
    monedaBase: Moneda?,
    onEditarTasa: () -> Unit,
    onEliminar: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(0.5.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(0.dp),
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Box(
                    Modifier.size(36.dp).clip(CircleShape).background(Color(0xFFEFF6FF)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(moneda.tipo.take(2), style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Medium, color = Color(0xFF1D4ED8))
                }
                Column(Modifier.weight(1f)) {
                    Text(moneda.nombre, style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium)
                    Text(moneda.tipo, style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                // Acciones
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Box(
                        Modifier.size(32.dp).clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .clickable { onEditarTasa() },
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Outlined.Edit, "Editar tasa", Modifier.size(15.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Box(
                        Modifier.size(32.dp).clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFFFF1F2))
                            .clickable { onEliminar() },
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Outlined.Delete, "Eliminar", Modifier.size(15.dp),
                            tint = Color(0xFFE11D48))
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            Row(
                Modifier.fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                    .padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text("Tasa de cambio", style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("1 ${moneda.tipo} =", style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(formatCup(tasa), style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Medium, color = Color(0xFF059669))
                        Text(monedaBase?.tipo ?: "CUP", style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Pantalla de moneda base ausente
// ---------------------------------------------------------------------------

@Composable
fun SinMonedaBaseScreen(onCreate: () -> Unit) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Card(
            modifier = Modifier.padding(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBEB)),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(0.5.dp, Color(0xFFFCD34D)),
            elevation = CardDefaults.cardElevation(0.dp),
        ) {
            Column(
                Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text("Configuración inicial requerida",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium, color = Color(0xFF92400E))
                Text(
                    "Para usar Cajas y Banco necesitas configurar al menos una moneda base. " +
                        "El Peso Cubano (CUP) se usará como moneda de referencia.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF92400E), textAlign = TextAlign.Center,
                )
                Box(
                    Modifier.clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFD97706)).clickable { onCreate() }
                        .padding(horizontal = 20.dp, vertical = 10.dp),
                ) {
                    Text("Crear Peso Cubano (CUP)",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// AlertDialog: eliminar moneda
// ---------------------------------------------------------------------------

@Composable
fun EliminarMonedaDialog(moneda: Moneda, onDismiss: () -> Unit, onConfirm: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Eliminar moneda") },
        text = {
            Text("¿Eliminar \"${moneda.nombre} (${moneda.tipo})\"? " +
                "Los movimientos registrados en esta moneda conservarán la tasa histórica.",
                style = MaterialTheme.typography.bodyMedium)
        },
        confirmButton = {
            TextButton(onClick = onConfirm,
                colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)) {
                Text("Eliminar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        },
    )
}
