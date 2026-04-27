package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.ListAlt
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import cu.lazaroysr96.sysgdcont.data.model.AnnualReport
import cu.lazaroysr96.sysgdcont.data.model.CuentaContable
import cu.lazaroysr96.sysgdcont.data.model.GeneralesData
import cu.lazaroysr96.sysgdcont.data.model.WorkspaceProfile
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter


private data class DashboardShortcut(
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val iconTint: Color,
    val iconBackground: Color,
    val onClick: () -> Unit,
)

private enum class DashboardTab {
    GENERAL,
    MODULOS,
    CUENTA
}

@Composable
fun DashboardScreen(
    generales: GeneralesData,
    report: AnnualReport?,
    lastSync: String?,
    hasLocalChanges: Boolean,
    workspaces: List<WorkspaceProfile>,
    currentWorkspaceId: String,
    cuentasIngreso: List<CuentaContable>,
    cuentasGasto: List<CuentaContable>,
    onSwitchWorkspace: (String) -> Unit,
    onCreateWorkspace: (String) -> Unit,
    onOpenRegistro: () -> Unit,
    onOpenVentas: () -> Unit,
    onOpenNomencladores: () -> Unit,
    onOpenCatalogos: () -> Unit,
    onOpenTerceros: () -> Unit,
    onOpenDocumentos: () -> Unit,
    onQuickRegisterOperation: (
        fecha: LocalDate,
        ingreso: Double?,
        ingresoCuentaId: String?,
        gasto: Double?,
        gastoCuentaId: String?,
        nota: String
    ) -> Unit,
        userName: String,
    userEmail: String,
    availableCredits: Int?,
    currentTier: String,
    hasActiveLicense: Boolean,
    onNavigateToLicenses: () -> Unit,
    onNavigateToSecurity: () -> Unit,
    onContactWhatsApp: () -> Unit,
) {
    var showWorkspaceDialog by remember { mutableStateOf(false) }
    var showQuickActions by remember { mutableStateOf(false) }
    var showOperationDialog by remember { mutableStateOf(false) }
    var selectedTab by rememberSaveable { mutableStateOf(DashboardTab.GENERAL) }
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
            title = "Punto de venta",
            subtitle = "Ventas y compras",
            icon = Icons.Default.Inventory2,
            iconTint = shortcutTones[2].second,
            iconBackground = shortcutTones[2].first,
            onClick = onOpenVentas,
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

    val nombreContribuyente = generales.nombre.takeIf { it.isNotBlank() } ?: "Contribuyente sin nombre"
    val currentWorkspace = workspaces.firstOrNull { it.id == currentWorkspaceId }
    // val anio = generales.anio
    val ingresos = report?.totalIngresos ?: 0.0
    val gastos = report?.totalGastos ?: 0.0
    val neto = report?.baseImponible ?: 0.0

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == DashboardTab.GENERAL,
                    onClick = { selectedTab = DashboardTab.GENERAL },
                    icon = { Icon(Icons.Default.Home, contentDescription = null) },
                    label = { Text("General") }
                )
                NavigationBarItem(
                    selected = selectedTab == DashboardTab.MODULOS,
                    onClick = { selectedTab = DashboardTab.MODULOS },
                    icon = { Icon(Icons.Default.Apps, contentDescription = null) },
                    label = { Text("Módulos") }
                )
                NavigationBarItem(
                    selected = selectedTab == DashboardTab.CUENTA,
                    onClick = { selectedTab = DashboardTab.CUENTA },
                    icon = { Icon(Icons.Default.AccountCircle, contentDescription = null) },
                    label = { Text("Cuenta") }
                )
            }
        }
    ) { padding ->
        when (selectedTab) {
            DashboardTab.GENERAL -> {

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding) 
            .background(colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
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
                    WorkspaceOverviewCard(
                    currentWorkspaceName = currentWorkspace?.nombre ?: "Negocio principal",
                    totalWorkspaces = workspaces.size,
                    onManage = { showWorkspaceDialog = true }
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

            
        }

        Column(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp),
            horizontalAlignment = Alignment.End,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            AnimatedVisibility(visible = showQuickActions) {
                QuickDashboardAction(
                    label = "Registrar operación",
                    icon = Icons.Default.EditNote,
                    onClick = {
                        showOperationDialog = true
                        showQuickActions = false
                    }
                )
            }
            AnimatedVisibility(visible = showQuickActions) {
                QuickDashboardAction(
                    label = "Punto de venta",
                    icon = Icons.Default.Inventory2,
                    onClick = {
                        onOpenVentas()
                        showQuickActions = false
                    }
                )
            }
            FloatingActionButton(
                onClick = { showQuickActions = !showQuickActions }
            ) {
                Icon(
                    if (showQuickActions) Icons.Default.Close else Icons.Default.Add,
                    contentDescription = if (showQuickActions) "Cerrar acciones rápidas" else "Abrir acciones rápidas"
                )
            }
        }
    }
}

DashboardTab.MODULOS -> {
        Column(
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
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

                Spacer(modifier = Modifier.height(96.dp))
            }
    }
    
        DashboardTab.CUENTA -> {
    UserProfileTab(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding),
        userName = userName,
        userEmail = userEmail,
        availableCredits = availableCredits,
        currentTier = currentTier,
        hasActiveLicense = hasActiveLicense,
        onNavigateToLicenses = onNavigateToLicenses,
        onNavigateToSecurity = onNavigateToSecurity,
        onContactWhatsApp = onContactWhatsApp,
        isDarkTheme = isDarkTheme,
    )
}
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

    if (showOperationDialog) {
        DashboardOperacionDialog(
            cuentasIngreso = cuentasIngreso,
            cuentasGasto = cuentasGasto,
            onDismiss = { showOperationDialog = false },
            onConfirm = { fecha, ingreso, ingresoCuentaId, gasto, gastoCuentaId, nota ->
                onQuickRegisterOperation(fecha, ingreso, ingresoCuentaId, gasto, gastoCuentaId, nota)
                showOperationDialog = false
            }
        )
    }
}

@Composable
private fun QuickDashboardAction(
    label: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 4.dp,
            shadowElevation = 2.dp
        ) {
            Text(
                text = label,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                style = MaterialTheme.typography.labelLarge
            )
        }
        FloatingActionButton(onClick = onClick) {
            Icon(icon, contentDescription = null)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DashboardOperacionDialog(
    cuentasIngreso: List<CuentaContable>,
    cuentasGasto: List<CuentaContable>,
    onDismiss: () -> Unit,
    onConfirm: (
        fecha: LocalDate,
        ingreso: Double?,
        ingresoCuentaId: String?,
        gasto: Double?,
        gastoCuentaId: String?,
        nota: String
    ) -> Unit
) {
    var fecha by remember { mutableStateOf(LocalDate.now()) }
    var showDatePicker by remember { mutableStateOf(false) }
    var ingreso by remember { mutableStateOf("") }
    var gasto by remember { mutableStateOf("") }
    var nota by remember { mutableStateOf("") }
    var ingresoCuentaId by remember { mutableStateOf(cuentasIngreso.firstOrNull()?.id.orEmpty()) }
    var gastoCuentaId by remember { mutableStateOf(cuentasGasto.firstOrNull()?.id.orEmpty()) }
    val formatter = remember { DateTimeFormatter.ofPattern("dd/MM/yyyy") }
    val ingresoCuenta = cuentasIngreso.firstOrNull { it.id == ingresoCuentaId }
    val gastoCuenta = cuentasGasto.firstOrNull { it.id == gastoCuentaId }
    val ingresoValue = ingreso.toDoubleOrNull()?.takeIf { it > 0.0 }
    val gastoValue = gasto.toDoubleOrNull()?.takeIf { it > 0.0 }
    val canSubmit = (ingresoValue != null || gastoValue != null) &&
        (ingresoValue == null || ingresoCuentaId.isNotBlank()) &&
        (gastoValue == null || gastoCuentaId.isNotBlank())

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Registrar operación") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = fecha.format(formatter),
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Fecha") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showDatePicker = true }
                )
                OutlinedTextField(
                    value = ingreso,
                    onValueChange = { ingreso = it },
                    label = { Text("Ingreso") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
                CuentaSeleccionField(
                    label = "Cuenta de ingreso",
                    cuentas = cuentasIngreso,
                    selectedCuenta = ingresoCuenta,
                    onSelectCuenta = { ingresoCuentaId = it }
                )
                OutlinedTextField(
                    value = gasto,
                    onValueChange = { gasto = it },
                    label = { Text("Gasto") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
                CuentaSeleccionField(
                    label = "Cuenta de gasto",
                    cuentas = cuentasGasto,
                    selectedCuenta = gastoCuenta,
                    onSelectCuenta = { gastoCuentaId = it }
                )
                OutlinedTextField(
                    value = nota,
                    onValueChange = { nota = it },
                    label = { Text("Nota") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = false,
                    minLines = 2
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onConfirm(
                        fecha,
                        ingresoValue,
                        ingresoCuentaId.takeIf { it.isNotBlank() },
                        gastoValue,
                        gastoCuentaId.takeIf { it.isNotBlank() },
                        nota.trim()
                    )
                },
                enabled = canSubmit
            ) {
                Text("Guardar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = fecha.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
        )
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            fecha = Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate()
                        }
                        showDatePicker = false
                    }
                ) {
                    Text("Aceptar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancelar")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CuentaSeleccionField(
    label: String,
    cuentas: List<CuentaContable>,
    selectedCuenta: CuentaContable?,
    onSelectCuenta: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded }
    ) {
        OutlinedTextField(
            value = selectedCuenta?.let { "${it.codigo} · ${it.nombre}" }.orEmpty(),
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.menuAnchor().fillMaxWidth()
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            cuentas.forEach { cuenta ->
                DropdownMenuItem(
                    text = { Text("${cuenta.codigo} · ${cuenta.nombre}") },
                    onClick = {
                        onSelectCuenta(cuenta.id)
                        expanded = false
                    }
                )
            }
        }
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
        // colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.28f)),
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
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                Text(
                    text = "Negocio Activo",
                    style = MaterialTheme.typography.labelLarge,
                    // color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f)
                )

                Button(onClick = onManage) {
                    Icon(
                        imageVector = Icons.Default.AccountTree,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimary
                        // tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                Text("Cambiar")
            }
                }
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
                    //color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            // TextButton(onClick = onManage) {
            //     Text("Cambiar")
            // }
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
                        AnimatedMoney(targetValue = neto)
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
private fun UserProfileTab(
    modifier: Modifier = Modifier,
    userName: String,
    userEmail: String,
    availableCredits: Int?,
    currentTier: String,
    hasActiveLicense: Boolean,
    onNavigateToLicenses: () -> Unit,
    onNavigateToSecurity: () -> Unit,
    onContactWhatsApp: () -> Unit,
    isDarkTheme: Boolean,
) {
    val colorScheme = MaterialTheme.colorScheme

    Column(
        modifier = modifier
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Avatar + nombre
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = colorScheme.primaryContainer),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                       .background(colorScheme.primary, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = userName.firstOrNull()?.uppercaseChar()?.toString() ?: "U",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = colorScheme.onPrimary
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = userName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = colorScheme.onPrimaryContainer
                    )
                    Text(
                        text = userEmail,
                        style = MaterialTheme.typography.bodySmall,
                        color = colorScheme.onPrimaryContainer.copy(alpha = 0.75f)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    // Reutiliza el badge de tier que ya existe en MainScreen
                    val badgeBg = when (currentTier) {
                        "vip" -> colorScheme.tertiaryContainer
                        "pro" -> colorScheme.secondaryContainer
                        else -> colorScheme.surfaceVariant
                    }
                    val badgeFg = when (currentTier) {
                        "vip" -> colorScheme.onTertiaryContainer
                        "pro" -> colorScheme.onSecondaryContainer
                        else -> colorScheme.onSurfaceVariant
                    }
                    Box(
                        modifier = Modifier
                            .background(badgeBg, CircleShape)
                            .padding(horizontal = 10.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = currentTier.uppercase(),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = badgeFg
                        )
                    }
                }
            }
        }

        // Créditos
        Card(
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = colorScheme.secondaryContainer),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "Créditos disponibles",
                        style = MaterialTheme.typography.labelMedium,
                        color = colorScheme.onSecondaryContainer.copy(alpha = 0.75f)
                    )
                    Text(
                        text = availableCredits?.toString() ?: "--",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = colorScheme.onSecondaryContainer
                    )
                }
                Icon(
                    imageVector = Icons.Default.AccountCircle,
                    contentDescription = null,
                    tint = colorScheme.onSecondaryContainer.copy(alpha = 0.5f),
                    modifier = Modifier.size(40.dp)
                )
            }
        }

        // Estado de licencia
        Card(
            shape = RoundedCornerShape(18.dp),
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
                        "Licencia",
                        style = MaterialTheme.typography.labelMedium,
                        color = colorScheme.onSurfaceVariant
                    )
                    Text(
                        if (hasActiveLicense) "Plan ${currentTier.uppercase()} activo"
                        else "Sin licencia activa",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                TextButton(onClick = onNavigateToLicenses) {
                    Text(if (hasActiveLicense) "Ver licencia" else "Comprar")
                }
            }
        }

        // Acciones de cuenta
        Text(
            "Configuración",
            style = MaterialTheme.typography.titleSmall,
            color = colorScheme.onSurfaceVariant
        )

        AccountActionRow(
            label = "Seguridad y cuenta",
            icon = Icons.Default.AccountCircle, // usa el que prefieras
            onClick = onNavigateToSecurity
        )
        AccountActionRow(
            label = "Contactar soporte",
            icon = Icons.Default.People,
            onClick = onContactWhatsApp
        )

        Spacer(modifier = Modifier.height(80.dp))
    }
}

@Composable
private fun AccountActionRow(
    label: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Text(label, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
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

@Composable
fun AnimatedMoney(
    targetValue: Double,
    duration: Int = 800
) {
    val animatedValue by animateFloatAsState(
        targetValue = targetValue.toFloat(),
        animationSpec = tween(durationMillis = duration),
        label = "money_animation"
    )

    Text(
        text = "${String.format("%.2f", animatedValue)} CUP",
        style = MaterialTheme.typography.headlineLarge,
        fontWeight = FontWeight.Bold
    )
}

private fun formatMoney(value: Double): String = "${String.format("%.2f", value)} CUP"
