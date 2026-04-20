package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.ListAlt
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.People
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import cu.lazaroysr96.sysgdcont.data.model.AnnualReport
import cu.lazaroysr96.sysgdcont.data.model.GeneralesData
import cu.lazaroysr96.sysgdcont.data.model.WorkspaceProfile

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
    workspaces: List<WorkspaceProfile>,
    currentWorkspaceId: String,
    onSwitchWorkspace: (String) -> Unit,
    onCreateWorkspace: (String) -> Unit,
    onOpenRegistro: () -> Unit,
    onOpenTributos: () -> Unit,
    onOpenResumen: () -> Unit,
    onOpenVentas: () -> Unit,
    onOpenNomencladores: () -> Unit,
    onOpenCatalogos: () -> Unit,
    onOpenTerceros: () -> Unit,
    onOpenDocumentos: () -> Unit,
) {
    var showWorkspaceDialog by remember { mutableStateOf(false) }
    val colorScheme = MaterialTheme.colorScheme
    val isDarkTheme = colorScheme.background.luminance() < 0.5f
    val shortcutTones = listOf(
        colorScheme.primaryContainer to colorScheme.onPrimaryContainer,
        colorScheme.secondaryContainer to colorScheme.onSecondaryContainer,
        colorScheme.tertiaryContainer to colorScheme.onTertiaryContainer,
        colorScheme.surfaceVariant to colorScheme.onSurfaceVariant,
        colorScheme.errorContainer to colorScheme.onErrorContainer,
    )
    val shortcuts = listOf(
        DashboardShortcut(
            title = "Registro DJ",
            subtitle = "Ingresos y gastos",
            icon = Icons.Default.MenuBook,
            iconTint = shortcutTones[0].second,
            iconBackground = shortcutTones[0].first,
            onClick = onOpenRegistro,
        ),
        DashboardShortcut(
            title = "Nomencladores",
            subtitle = "CNAE y cuentas contables",
            icon = Icons.Default.AccountTree,
            iconTint = shortcutTones[1].second,
            iconBackground = shortcutTones[1].first,
            onClick = onOpenNomencladores,
        ),
        DashboardShortcut(
            title = "Punto de venta",
            subtitle = "Ventas y compras",
            icon = Icons.Default.Inventory2,
            iconTint = shortcutTones[2].second,
            iconBackground = shortcutTones[2].first,
            onClick = onOpenVentas,
        ),
        DashboardShortcut(
            title = "Catálogos",
            subtitle = "Cuentas y productos",
            icon = Icons.Default.ListAlt,
            iconTint = shortcutTones[3].second,
            iconBackground = shortcutTones[3].first,
            onClick = onOpenCatalogos,
        ),
        DashboardShortcut(
            title = "Terceros",
            subtitle = "Clientes, deudas y cuentas",
            icon = Icons.Default.People,
            iconTint = shortcutTones[4].second,
            iconBackground = shortcutTones[4].first,
            onClick = onOpenTerceros,
        ),
        DashboardShortcut(
            title = "Documentos",
            subtitle = "Archivos y evidencias",
            icon = Icons.Default.Description,
            iconTint = shortcutTones[0].second,
            iconBackground = shortcutTones[0].first,
            onClick = onOpenDocumentos,
        ),
    )

    val nombreContribuyente = generales.nombre.takeIf { it.isNotBlank() } ?: "Tu negocio"
    val currentWorkspace = workspaces.firstOrNull { it.id == currentWorkspaceId }
    val anio = generales.anio
    val ingresos = report?.totalIngresos ?: 0.0
    val gastos = report?.totalGastos ?: 0.0
    val neto = report?.baseImponible ?: 0.0

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorScheme.background)
            .verticalScroll(rememberScrollState())
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(
                            colorScheme.secondary,
                            colorScheme.primary,
                            colorScheme.secondary.copy(alpha = if (isDarkTheme) 0.82f else 0.92f)
                        )
                    ),
                    shape = RoundedCornerShape(bottomStart = 34.dp, bottomEnd = 34.dp)
                )
                .padding(horizontal = 20.dp, vertical = 20.dp)
        ) {
            Column {
                Text(
                    text = "Panel principal",
                    style = MaterialTheme.typography.labelLarge,
                    color = colorScheme.onPrimary.copy(alpha = 0.88f)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = nombreContribuyente,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = colorScheme.onPrimary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Visión rápida del año $anio y acceso a todas las herramientas.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = colorScheme.onPrimary.copy(alpha = 0.92f)
                )
                Spacer(modifier = Modifier.height(20.dp))
                DashboardHeroCard(
                    ingresos = ingresos,
                    gastos = gastos,
                    neto = neto,
                    lastSync = lastSync,
                    hasLocalChanges = hasLocalChanges,
                    isDarkTheme = isDarkTheme,
                )
            }
        }

        Column(
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            WorkspaceOverviewCard(
                currentWorkspaceName = currentWorkspace?.nombre ?: nombreContribuyente,
                totalWorkspaces = workspaces.size,
                onManage = { showWorkspaceDialog = true }
            )

            Text(
                text = "Accesos rápidos",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = colorScheme.onBackground
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

    if (showWorkspaceDialog) {
        WorkspaceSwitcherDialog(
            workspaces = workspaces,
            currentWorkspaceId = currentWorkspaceId,
            onDismiss = { showWorkspaceDialog = false },
            onSelectWorkspace = { workspaceId ->
                onSwitchWorkspace(workspaceId)
                showWorkspaceDialog = false
            },
            onCreateWorkspace = { nombre ->
                onCreateWorkspace(nombre)
                showWorkspaceDialog = false
            }
        )
    }
}

@Composable
private fun WorkspaceOverviewCard(
    currentWorkspaceName: String,
    totalWorkspaces: Int,
    onManage: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Negocio activo",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = currentWorkspaceName,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "$totalWorkspaces espacio(s) de trabajo configurado(s)",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            TextButton(onClick = onManage) {
                Text("Cambiar")
            }
        }
    }
}

@Composable
private fun WorkspaceSwitcherDialog(
    workspaces: List<WorkspaceProfile>,
    currentWorkspaceId: String,
    onDismiss: () -> Unit,
    onSelectWorkspace: (String) -> Unit,
    onCreateWorkspace: (String) -> Unit
) {
    var newWorkspaceName by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Espacios de trabajo") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                if (workspaces.isEmpty()) {
                    Text(
                        "Todavía no hay negocios configurados.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    workspaces.forEach { workspace ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelectWorkspace(workspace.id) },
                            colors = CardDefaults.cardColors(
                                containerColor = if (workspace.id == currentWorkspaceId) {
                                    MaterialTheme.colorScheme.primaryContainer
                                } else {
                                    MaterialTheme.colorScheme.surfaceVariant
                                }
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        workspace.nombre,
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    if (workspace.id == currentWorkspaceId) {
                                        Text(
                                            "Activo ahora",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                if (workspace.id == currentWorkspaceId) {
                                    Text(
                                        "Actual",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }

                OutlinedTextField(
                    value = newWorkspaceName,
                    onValueChange = { newWorkspaceName = it },
                    label = { Text("Nuevo negocio") },
                    placeholder = { Text("Ej: Cafetería Centro") },
                    singleLine = true
                )
                Button(
                    onClick = { onCreateWorkspace(newWorkspaceName.trim()) },
                    enabled = newWorkspaceName.trim().isNotBlank(),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Crear y abrir negocio")
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cerrar")
            }
        }
    )
}

@Composable
private fun DashboardHeroCard(
    ingresos: Double,
    gastos: Double,
    neto: Double,
    lastSync: String?,
    hasLocalChanges: Boolean,
    isDarkTheme: Boolean,
) {
    val colorScheme = MaterialTheme.colorScheme
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
                        colors = listOf(
                            colorScheme.secondary.copy(alpha = if (isDarkTheme) 0.85f else 1f),
                            colorScheme.primary.copy(alpha = if (isDarkTheme) 0.80f else 0.95f),
                            colorScheme.secondaryContainer.copy(alpha = if (isDarkTheme) 0.70f else 0.92f)
                        )
                    )
                )
                .padding(16.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Balance acumulado",
                            style = MaterialTheme.typography.labelLarge,
                            color = colorScheme.onPrimary.copy(alpha = 0.88f)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = formatMoney(neto),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = colorScheme.onPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                StatusPill(
                        text = if (hasLocalChanges) "Pendiente de sincronizar" else "Datos al día",
                        background = if (hasLocalChanges) {
                            colorScheme.tertiary.copy(alpha = if (isDarkTheme) 0.30f else 0.22f)
                        } else {
                            colorScheme.primary.copy(alpha = if (isDarkTheme) 0.28f else 0.20f)
                        },
                        contentColor = colorScheme.onPrimary
                    )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    HeroMetric(label = "Ingresos", value = formatMoney(ingresos), modifier = Modifier.weight(1f))
                    HeroMetric(label = "Gastos", value = formatMoney(gastos), modifier = Modifier.weight(1f))
                }

                Text(
                    text = lastSync?.takeIf { it.isNotBlank() }?.let { "Última sincronización: $it" }
                        ?: "Aún no hay una sincronización registrada",
                    style = MaterialTheme.typography.bodySmall,
                    color = colorScheme.onPrimary.copy(alpha = 0.80f),
                )
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
    val colorScheme = MaterialTheme.colorScheme
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = colorScheme.surface.copy(alpha = 0.16f)
    ) {
        Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = colorScheme.onPrimary.copy(alpha = 0.80f)
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = colorScheme.onPrimary
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DashboardShortcutCard(
    shortcut: DashboardShortcut,
    modifier: Modifier = Modifier,
) {
    val colorScheme = MaterialTheme.colorScheme
    Card(
        onClick = shortcut.onClick,
        modifier = modifier,
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(50.dp)
                    .background(shortcut.iconBackground, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = shortcut.icon,
                    contentDescription = shortcut.title,
                    tint = shortcut.iconTint,
                    modifier = Modifier.size(24.dp)
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = shortcut.title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = colorScheme.onSurface
                )
                Text(
                    text = shortcut.subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = colorScheme.onSurfaceVariant,
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
            .border(1.dp, contentColor.copy(alpha = 0.18f), RoundedCornerShape(999.dp))
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
