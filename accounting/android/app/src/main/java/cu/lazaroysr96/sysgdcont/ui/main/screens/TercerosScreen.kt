@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package cu.lazaroysr96.sysgdcont.ui.main.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Sell
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.EstadoCuentaTercero
import cu.lazaroysr96.sysgdcont.data.model.RolTercero
import cu.lazaroysr96.sysgdcont.data.model.TerceroCuentaListItem
import cu.lazaroysr96.sysgdcont.data.model.TerceroListItem
import cu.lazaroysr96.sysgdcont.data.model.TipoCuentaTercero
import cu.lazaroysr96.sysgdcont.data.model.TipoEntidadTercero
import cu.lazaroysr96.sysgdcont.viewmodel.TarjetaViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.TercerosViewModel

// ─── Enums de filtro ──────────────────────────────────────────────────────────

private enum class TercerosTab { PERSONAS, CUENTAS, TARJETAS }

private enum class PersonasFilter {
    TODOS, TCP, PARTICULAR, ESTATAL, MIPYME;
    val label get() = when (this) {
        TODOS -> "Todos"; TCP -> "TCP"; PARTICULAR -> "Particular"
        ESTATAL -> "Estatal"; MIPYME -> "MIPYME"
    }
}

private enum class CuentasFilter {
    TODAS, DEUDAS, PRESTAMOS, PENDIENTES, VENCIDAS, PARCIALES, SALDADAS;
    val label get() = when (this) {
        TODAS -> "Todas"; DEUDAS -> "Deudas"; PRESTAMOS -> "Préstamos"
        PENDIENTES -> "Pendientes"; VENCIDAS -> "Vencidas"
        PARCIALES -> "Parciales"; SALDADAS -> "Saldadas"
    }
}

// ─── Screen principal ─────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TercerosScreen(
    viewModel: TercerosViewModel,
    tarjetaViewModel: TarjetaViewModel
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val tarjetaUiState by tarjetaViewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    var selectedTab by rememberSaveable { mutableStateOf(TercerosTab.PERSONAS) }
    var personasFilter by rememberSaveable { mutableStateOf(PersonasFilter.TODOS) }
    var cuentasFilter by rememberSaveable { mutableStateOf(CuentasFilter.TODAS) }

    LaunchedEffect(uiState.snackbarMessage) {
        uiState.snackbarMessage?.let { snackbarHostState.showSnackbar(it); viewModel.clearSnackbar() }
    }
    LaunchedEffect(tarjetaUiState.snackbarMessage) {
        tarjetaUiState.snackbarMessage?.let { snackbarHostState.showSnackbar(it); tarjetaViewModel.clearSnackbar() }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                when (selectedTab) {
                    TercerosTab.PERSONAS -> FloatingActionButton(onClick = { viewModel.showAddTerceroDialog(true) }) {
                        Icon(Icons.Default.Add, contentDescription = "Agregar tercero")
                    }
                    TercerosTab.CUENTAS -> if (uiState.terceros.isNotEmpty()) {
                        FloatingActionButton(onClick = { viewModel.showAddCuentaDialog(true) }) {
                            Icon(Icons.Default.AccountBalance, contentDescription = "Agregar cuenta")
                        }
                    }
                    TercerosTab.TARJETAS -> {
                        SmallFloatingActionButton(
                            onClick = { tarjetaViewModel.showScanDialog(true) },
                            containerColor = MaterialTheme.colorScheme.secondaryContainer
                        ) { Icon(Icons.Default.QrCodeScanner, contentDescription = "Escanear QR") }
                        FloatingActionButton(onClick = { tarjetaViewModel.showAddDialog(true) }) {
                            Icon(Icons.Default.Add, contentDescription = "Agregar tarjeta")
                        }
                    }
                }
            }
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == TercerosTab.PERSONAS,
                    onClick = { selectedTab = TercerosTab.PERSONAS },
                    icon = { Icon(Icons.Default.People, null) },
                    label = { Text("Personas") }
                )
                NavigationBarItem(
                    selected = selectedTab == TercerosTab.CUENTAS,
                    onClick = { selectedTab = TercerosTab.CUENTAS },
                    icon = { Icon(Icons.Default.AccountBalance, null) },
                    label = { Text("Cuentas") }
                )
                NavigationBarItem(
                    selected = selectedTab == TercerosTab.TARJETAS,
                    onClick = { selectedTab = TercerosTab.TARJETAS },
                    icon = { Icon(Icons.Default.CreditCard, null) },
                    label = { Text("Tarjetas") }
                )
            }
        }
    ) { padding ->
        when (selectedTab) {
            TercerosTab.PERSONAS -> PersonasContent(
                terceros = uiState.terceros,
                filter = personasFilter,
                onFilterChange = { personasFilter = it },
                formatCurrency = viewModel::formatCurrency,
                onEdit = { viewModel.showEditTerceroDialog(it) },
                onArchive = { viewModel.archiveTercero(it.id) },
                contentPadding = padding
            )
            TercerosTab.CUENTAS -> CuentasContent(
                cuentas = uiState.cuentas,
                filter = cuentasFilter,
                onFilterChange = { cuentasFilter = it },
                formatCurrency = viewModel::formatCurrency,
                onEdit = { viewModel.showEditCuentaDialog(it) },
                onAbonar = { viewModel.showAbonarDialog(it) },
                onArchivar = { viewModel.archivarCuenta(it.id) },
                contentPadding = padding
            )
            TercerosTab.TARJETAS -> TarjetaContent(
                viewModel = tarjetaViewModel,
                contentPadding = padding
            )
        }
    }

    // ── Diálogos ──────────────────────────────────────────────────────────────

    if (uiState.showAddTerceroDialog) {
        AddTerceroDialog(
            onDismiss = { viewModel.showAddTerceroDialog(false) },
            onConfirm = viewModel::crearTercero
        )
    }
    if (uiState.showAddCuentaDialog) {
        AddCuentaDialog(
            terceros = uiState.terceros,
            onDismiss = { viewModel.showAddCuentaDialog(false) },
            onConfirm = viewModel::crearCuenta
        )
    }
    uiState.terceroEnEdicion?.let { tercero ->
        if (uiState.showEditTerceroDialog) {
            EditTerceroDialog(
                tercero = tercero,
                onDismiss = { viewModel.showEditTerceroDialog(null) },
                onConfirm = viewModel::actualizarTercero
            )
        }
    }
    uiState.cuentaEnEdicion?.let { cuenta ->
        if (uiState.showEditCuentaDialog) {
            EditCuentaDialog(
                cuenta = cuenta,
                onDismiss = { viewModel.showEditCuentaDialog(null) },
                onConfirm = viewModel::actualizarCuenta
            )
        }
    }
    // Diálogo de abono parcial — el ViewModel expone showAbonarDialog y cuentaAAbona
    uiState.cuentaAAbonar?.let { cuenta ->
        if (uiState.showAbonarDialog) {
            AbonarCuentaDialog(
                cuenta = cuenta,
                formatCurrency = viewModel::formatCurrency,
                onDismiss = { viewModel.dismissAbonarDialog() },
                onConfirm = { monto, nota -> viewModel.registrarAbono(cuenta.id, monto, nota) }
            )
        }
    }
}

// ─── Contenido: Personas ──────────────────────────────────────────────────────

@Composable
private fun PersonasContent(
    terceros: List<TerceroListItem>,
    filter: PersonasFilter,
    onFilterChange: (PersonasFilter) -> Unit,
    formatCurrency: (Double, String) -> String,
    onEdit: (TerceroListItem) -> Unit,
    onArchive: (TerceroListItem) -> Unit,
    contentPadding: PaddingValues
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding)
    ) {
        // Chips de filtro horizontales
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            PersonasFilter.entries.forEach { f ->
                FilterChip(label = f.label, selected = f == filter, onClick = { onFilterChange(f) })
            }
        }

        val personas = filterPersonas(terceros, filter)
        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (personas.isEmpty()) {
                item { EmptyState("Sin terceros", "Agrega tu primer cliente o proveedor.") }
            } else {
                items(personas, key = { it.id }) { tercero ->
                    TerceroCard(
                        tercero = tercero,
                        formatCurrency = formatCurrency,
                        onEdit = { onEdit(tercero) },
                        onArchive = { onArchive(tercero) }
                    )
                }
            }
        }
    }
}

// ─── Contenido: Cuentas ───────────────────────────────────────────────────────

@Composable
private fun CuentasContent(
    cuentas: List<TerceroCuentaListItem>,
    filter: CuentasFilter,
    onFilterChange: (CuentasFilter) -> Unit,
    formatCurrency: (Double, String) -> String,
    onEdit: (TerceroCuentaListItem) -> Unit,
    onAbonar: (TerceroCuentaListItem) -> Unit,
    onArchivar: (TerceroCuentaListItem) -> Unit,
    contentPadding: PaddingValues
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            CuentasFilter.entries.forEach { f ->
                FilterChip(label = f.label, selected = f == filter, onClick = { onFilterChange(f) })
            }
        }

        val filtered = filterCuentas(cuentas, filter)
        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (filtered.isEmpty()) {
                item { EmptyState("Sin cuentas", "Registra una deuda o préstamo.") }
            } else {
                items(filtered, key = { it.id }) { cuenta ->
                    CuentaCard(
                        cuenta = cuenta,
                        formatCurrency = formatCurrency,
                        onEdit = { onEdit(cuenta) },
                        onAbonar = { onAbonar(cuenta) },
                        onArchivar = { onArchivar(cuenta) }
                    )
                }
            }
        }
    }
}

// ─── Card: Tercero ────────────────────────────────────────────────────────────

@Composable
private fun TerceroCard(
    tercero: TerceroListItem,
    formatCurrency: (Double, String) -> String,
    onEdit: () -> Unit,
    onArchive: () -> Unit
) {
    val context = LocalContext.current
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth().animateContentSize(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column {
            // ── Cabecera ──────────────────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded }
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                TerceroAvatar(nombre = tercero.nombre)
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        tercero.nombre,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        buildString {
                            append(tipoEntidadLabel(tercero.tipoEntidad))
                            if (tercero.rolesList.isNotEmpty()) {
                                append(" · ")
                                append(tercero.rolesList.joinToString(", ") { it.lowercase().replaceFirstChar { c -> c.uppercase() } })
                            }
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Icon(
                    if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // ── Detalle expandido ─────────────────────────────────────────────
            AnimatedVisibility(visible = expanded, enter = expandVertically(), exit = shrinkVertically()) {
                Column(modifier = Modifier.padding(horizontal = 14.dp)) {
                    Divider()
                    Spacer(Modifier.height(10.dp))
                    ContactLine(Icons.Default.Call, tercero.telefono) { callPhone(context, tercero.telefono) }
                    ContactLine(Icons.Default.Email, tercero.correo) { sendEmail(context, tercero.correo) }
                    ContactLine(Icons.Default.CreditCard, tercero.numeroTarjeta) { copyToClipboard(context, "Tarjeta", tercero.numeroTarjeta) }
                    ContactLine(Icons.Default.Sell, tercero.direccionCrypto) { copyToClipboard(context, "Wallet", tercero.direccionCrypto) }
                    if (tercero.direccion.isNotBlank()) Text("Dirección: ${tercero.direccion}", style = MaterialTheme.typography.bodySmall)
                    if (tercero.identificadorFiscal.isNotBlank()) Text("Id. fiscal: ${tercero.identificadorFiscal}", style = MaterialTheme.typography.bodySmall)
                    if (tercero.nota.isNotBlank()) Text("Nota: ${tercero.nota}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(10.dp))
                }
            }

            // ── Resumen financiero ────────────────────────────────────────────
            Divider()
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                FinancialSummaryItem(label = "Por pagar", amount = formatCurrency(tercero.totalDeudas, "CUP"), isDebt = tercero.totalDeudas > 0)
                FinancialSummaryItem(label = "Por cobrar", amount = formatCurrency(tercero.totalPrestamos, "CUP"), isDebt = false, alignEnd = true)
            }

            // ── Acciones ──────────────────────────────────────────────────────
            Divider()
            Row(modifier = Modifier.fillMaxWidth()) {
                TextButton(onClick = onEdit, modifier = Modifier.weight(1f)) { Text("Editar") }
                VerticalDivider()
                TextButton(
                    onClick = onArchive,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) { Text("Archivar") }
            }
        }
    }
}

// ─── Card: Cuenta (deuda / préstamo) ─────────────────────────────────────────

@Composable
private fun CuentaCard(
    cuenta: TerceroCuentaListItem,
    formatCurrency: (Double, String) -> String,
    onEdit: () -> Unit,
    onAbonar: () -> Unit,
    onArchivar: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    val isSaldada = cuenta.estado == EstadoCuentaTercero.PAGADO || cuenta.estado == EstadoCuentaTercero.COBRADO
    val isParcial = (cuenta.montoPendiente < cuenta.montoOriginal) && !isSaldada
    val progress = if (cuenta.montoOriginal > 0) ((cuenta.montoOriginal - cuenta.montoPendiente) / cuenta.montoOriginal).toFloat().coerceIn(0f, 1f) else 0f

    Card(
        modifier = Modifier.fillMaxWidth().animateContentSize(),
        colors = CardDefaults.cardColors(
            containerColor = if (isSaldada) MaterialTheme.colorScheme.surface.copy(alpha = 0.6f)
                             else MaterialTheme.colorScheme.surface
        )
    ) {
        Column {
            // ── Cabecera ──────────────────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded }
                    .padding(14.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        cuenta.concepto,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        "${cuenta.terceroNombre} · ${cuenta.categoria.lowercase().replaceFirstChar { it.uppercase() }}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                EstadoBadge(estado = when {
                    isSaldada -> cuenta.estado
                    isParcial -> "PARCIAL"
                    cuenta.estado == EstadoCuentaTercero.VENCIDO -> EstadoCuentaTercero.VENCIDO
                    else -> cuenta.estado
                })
                Icon(
                    if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // ── Barra de progreso de pago ─────────────────────────────────────
            if (cuenta.montoOriginal > 0) {
                Column(modifier = Modifier.padding(horizontal = 14.dp).padding(bottom = 12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            "Pagado: ${formatCurrency(cuenta.montoOriginal - cuenta.montoPendiente, cuenta.moneda)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            "Total: ${formatCurrency(cuenta.montoOriginal, cuenta.moneda)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                    LinearProgressIndicator(
                        progress = progress,
                        modifier = Modifier.fillMaxWidth().height(5.dp).clip(RoundedCornerShape(99.dp)),
                        strokeCap = StrokeCap.Round,
                        color = if (isSaldada) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.primary,
                        trackColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                    Spacer(Modifier.height(4.dp))
                    if (!isSaldada) {
                        val pendiente = cuenta.montoPendiente
                        val vencimientoText = if (cuenta.fechaVencimiento.isNotBlank()) " · Vence ${cuenta.fechaVencimiento}" else ""
                        Text(
                            "Pendiente: ${formatCurrency(pendiente, cuenta.moneda)}$vencimientoText",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (cuenta.estado == EstadoCuentaTercero.VENCIDO)
                                MaterialTheme.colorScheme.error
                            else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        Text(
                            "Saldada completamente",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.tertiary
                        )
                    }
                }
            }

            // ── Detalle expandido ─────────────────────────────────────────────
            AnimatedVisibility(visible = expanded, enter = expandVertically(), exit = shrinkVertically()) {
                Column(modifier = Modifier.padding(horizontal = 14.dp)) {
                    Divider()
                    Spacer(Modifier.height(8.dp))
                    val tipoCuentaLabel = when (cuenta.tipoCuenta) {
                        TipoCuentaTercero.DEUDA -> "Deuda"
                        TipoCuentaTercero.PRESTAMO -> "Préstamo"
                        else -> cuenta.tipoCuenta
                    }
                    Text("Tipo: $tipoCuentaLabel", style = MaterialTheme.typography.bodySmall)
                    if (cuenta.descripcion.isNotBlank()) Text(cuenta.descripcion, style = MaterialTheme.typography.bodySmall)
                    if (cuenta.nota.isNotBlank()) Text("Nota: ${cuenta.nota}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(8.dp))
                }
            }

            // ── Acciones ──────────────────────────────────────────────────────
            Divider()
            Row(modifier = Modifier.fillMaxWidth()) {
                if (!isSaldada) {
                    TextButton(onClick = onAbonar, modifier = Modifier.weight(1f)) { Text("Abonar") }
                    VerticalDivider()
                    TextButton(onClick = onEdit, modifier = Modifier.weight(1f)) { Text("Editar") }
                    VerticalDivider()
                    TextButton(
                        onClick = onArchivar,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.tertiary)
                    ) { Text("Saldar") }
                } else {
                    TextButton(onClick = onEdit, modifier = Modifier.weight(1f)) { Text("Ver historial") }
                    VerticalDivider()
                    TextButton(
                        onClick = onArchivar,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                    ) { Text("Archivar") }
                }
            }
        }
    }
}

// ─── Diálogo de abono parcial ─────────────────────────────────────────────────

@Composable
private fun AbonarCuentaDialog(
    cuenta: TerceroCuentaListItem,
    formatCurrency: (Double, String) -> String,
    onDismiss: () -> Unit,
    onConfirm: (monto: String, nota: String) -> Unit
) {
    var monto by rememberSaveable { mutableStateOf("") }
    var nota by rememberSaveable { mutableStateOf("") }
    val pendiente = cuenta.montoPendiente

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Registrar abono") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    "${cuenta.concepto} · ${formatCurrency(pendiente, cuenta.moneda)} pendiente",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = monto,
                    onValueChange = { monto = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Monto a abonar (${cuenta.moneda})") },
                    singleLine = true,
                    supportingText = { Text("Máximo: ${formatCurrency(pendiente, cuenta.moneda)}") }
                )
                OutlinedTextField(
                    value = nota,
                    onValueChange = { nota = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Nota (opcional)") }
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { if (monto.isNotBlank()) onConfirm(monto, nota) },
                enabled = monto.isNotBlank()
            ) { Text("Registrar abono") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

// ─── Componentes menores ──────────────────────────────────────────────────────

@Composable
private fun TerceroAvatar(nombre: String) {
    val initials = nombre.split(" ")
        .take(2)
        .mapNotNull { it.firstOrNull()?.uppercaseChar() }
        .joinToString("")
        .ifBlank { "?" }

    Box(
        modifier = Modifier
            .size(40.dp)
            .background(MaterialTheme.colorScheme.secondaryContainer, CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Text(
            initials,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSecondaryContainer
        )
    }
}

@Composable
private fun EstadoBadge(estado: String) {
    val (bg, fg, label) = when (estado) {
        EstadoCuentaTercero.PENDIENTE -> Triple(
            MaterialTheme.colorScheme.tertiaryContainer,
            MaterialTheme.colorScheme.onTertiaryContainer,
            "Pendiente"
        )
        EstadoCuentaTercero.VENCIDO -> Triple(
            MaterialTheme.colorScheme.errorContainer,
            MaterialTheme.colorScheme.onErrorContainer,
            "Vencida"
        )
        EstadoCuentaTercero.PAGADO, EstadoCuentaTercero.COBRADO -> Triple(
            MaterialTheme.colorScheme.surfaceVariant,
            MaterialTheme.colorScheme.onSurfaceVariant,
            if (estado == EstadoCuentaTercero.PAGADO) "Pagada" else "Cobrada"
        )
        "PARCIAL" -> Triple(
            MaterialTheme.colorScheme.primaryContainer,
            MaterialTheme.colorScheme.onPrimaryContainer,
            "Parcial"
        )
        EstadoCuentaTercero.CANCELADO -> Triple(
            MaterialTheme.colorScheme.surfaceVariant,
            MaterialTheme.colorScheme.onSurfaceVariant,
            "Cancelada"
        )
        else -> Triple(
            MaterialTheme.colorScheme.surfaceVariant,
            MaterialTheme.colorScheme.onSurfaceVariant,
            estado
        )
    }
    Box(
        modifier = Modifier
            .background(bg, RoundedCornerShape(99.dp))
            .padding(horizontal = 10.dp, vertical = 3.dp)
    ) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = fg, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun FilterChip(label: String, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .background(
                if (selected) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.surface,
                RoundedCornerShape(99.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 7.dp)
    ) {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium,
            color = if (selected) MaterialTheme.colorScheme.surface else MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun FinancialSummaryItem(label: String, amount: String, isDebt: Boolean, alignEnd: Boolean = false) {
    Column(horizontalAlignment = if (alignEnd) Alignment.End else Alignment.Start) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(
            amount,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = if (isDebt) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun ContactLine(icon: ImageVector, value: String, onAction: () -> Unit) {
    if (value.isBlank()) return
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
        IconButton(onClick = onAction, modifier = Modifier.size(32.dp)) {
            Icon(Icons.Default.ContentCopy, contentDescription = "Copiar", modifier = Modifier.size(16.dp))
        }
    }
}

@Composable
private fun VerticalDivider() {
    Box(modifier = Modifier.width(0.5.dp).height(36.dp).background(MaterialTheme.colorScheme.outlineVariant))
}

@Composable
private fun EmptyState(title: String, subtitle: String) {
    Box(
        modifier = Modifier.fillMaxWidth().padding(vertical = 32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(Icons.Default.Inventory2, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(32.dp))
            Text(title, style = MaterialTheme.typography.titleSmall)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

private fun filterPersonas(terceros: List<TerceroListItem>, filter: PersonasFilter) = when (filter) {
    PersonasFilter.TODOS -> terceros
    PersonasFilter.TCP -> terceros.filter { it.tipoEntidad == TipoEntidadTercero.TCP }
    PersonasFilter.PARTICULAR -> terceros.filter { it.tipoEntidad in listOf(TipoEntidadTercero.PARTICULAR, TipoEntidadTercero.PERSONA) }
    PersonasFilter.ESTATAL -> terceros.filter { it.tipoEntidad in listOf(TipoEntidadTercero.ESTATAL, TipoEntidadTercero.ESTADO) }
    PersonasFilter.MIPYME -> terceros.filter { it.tipoEntidad in listOf(TipoEntidadTercero.MIPYME, TipoEntidadTercero.EMPRESA) }
}

private fun filterCuentas(cuentas: List<TerceroCuentaListItem>, filter: CuentasFilter) = when (filter) {
    CuentasFilter.TODAS -> cuentas
    CuentasFilter.DEUDAS -> cuentas.filter { it.tipoCuenta == TipoCuentaTercero.DEUDA }
    CuentasFilter.PRESTAMOS -> cuentas.filter { it.tipoCuenta == TipoCuentaTercero.PRESTAMO }
    CuentasFilter.PENDIENTES -> cuentas.filter { it.estado == EstadoCuentaTercero.PENDIENTE && it.montoPendiente == it.montoOriginal }
    CuentasFilter.VENCIDAS -> cuentas.filter { it.estado == EstadoCuentaTercero.VENCIDO }
    CuentasFilter.PARCIALES -> cuentas.filter { it.montoPendiente < it.montoOriginal && it.montoPendiente > 0 }
    CuentasFilter.SALDADAS -> cuentas.filter { it.estado == EstadoCuentaTercero.PAGADO || it.estado == EstadoCuentaTercero.COBRADO }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

private const val TIPO_ENTIDAD_OTRO = "__OTRO__"

private fun tipoEntidadLabel(value: String) = when (value) {
    TipoEntidadTercero.TCP -> "TCP"
    TipoEntidadTercero.PARTICULAR, TipoEntidadTercero.PERSONA -> "Particular"
    TipoEntidadTercero.ESTATAL, TipoEntidadTercero.ESTADO -> "Estatal"
    TipoEntidadTercero.MIPYME, TipoEntidadTercero.EMPRESA -> "MIPYME"
    else -> value
}

private fun tipoEntidadOpcionesBase() = listOf(
    TipoEntidadTercero.TCP to "TCP",
    TipoEntidadTercero.PARTICULAR to "Particular",
    TipoEntidadTercero.ESTATAL to "Estatal",
    TipoEntidadTercero.MIPYME to "MIPYME",
    TIPO_ENTIDAD_OTRO to "Otro (crear nuevo)"
)

private fun callPhone(context: Context, value: String) {
    val phone = value.filter { it.isDigit() || it == '+' }
    if (phone.isBlank()) return
    runCatching { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))) }
}

private fun sendEmail(context: Context, value: String) {
    val email = value.trim()
    if (email.isBlank()) return
    runCatching { context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$email"))) }
}

private fun copyToClipboard(context: Context, label: String, value: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    clipboard.setPrimaryClip(ClipData.newPlainText(label, value))
    Toast.makeText(context, "$label copiado", Toast.LENGTH_SHORT).show()
}

// ─── Diálogos (Add/Edit — sin cambios funcionales, solo referencia) ────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddTerceroDialog(
    onDismiss: () -> Unit,
    onConfirm: (nombre: String, tipoEntidad: String, roles: Set<String>, telefono: String, correo: String, direccion: String, identificadorFiscal: String, numeroTarjeta: String, direccionCrypto: String, nota: String) -> Unit
) {
    var nombre by rememberSaveable { mutableStateOf("") }
    var telefono by rememberSaveable { mutableStateOf("") }
    var correo by rememberSaveable { mutableStateOf("") }
    var direccion by rememberSaveable { mutableStateOf("") }
    var identificadorFiscal by rememberSaveable { mutableStateOf("") }
    var numeroTarjeta by rememberSaveable { mutableStateOf("") }
    var direccionCrypto by rememberSaveable { mutableStateOf("") }
    var nota by rememberSaveable { mutableStateOf("") }
    val tipoOptions = remember { tipoEntidadOpcionesBase() }
    var tipoEntidad by rememberSaveable { mutableStateOf(TipoEntidadTercero.TCP) }
    var tipoEntidadSeleccionado by rememberSaveable { mutableStateOf(TipoEntidadTercero.TCP) }
    var customTipoEntidad by rememberSaveable { mutableStateOf("") }
    var roles by rememberSaveable { mutableStateOf(setOf(RolTercero.CLIENTE)) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nuevo tercero") },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                item { OutlinedTextField(value = nombre, onValueChange = { nombre = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Nombre") }, singleLine = true) }
                item {
                    SingleSelectDropdown(label = "Tipo de tercero", options = tipoOptions, selected = tipoEntidadSeleccionado, onSelected = { selected ->
                        tipoEntidadSeleccionado = selected
                        if (selected != TIPO_ENTIDAD_OTRO) { tipoEntidad = selected; customTipoEntidad = "" }
                    })
                }
                if (tipoEntidadSeleccionado == TIPO_ENTIDAD_OTRO) {
                    item { OutlinedTextField(value = customTipoEntidad, onValueChange = { customTipoEntidad = it; tipoEntidad = it.trim().uppercase() }, modifier = Modifier.fillMaxWidth(), label = { Text("Nuevo tipo") }, singleLine = true) }
                }
                item {
                    MultiSelectDropdown(label = "Roles", options = listOf(RolTercero.CLIENTE to "Cliente", RolTercero.PROVEEDOR to "Proveedor", RolTercero.EMPLEADO to "Empleado"), selected = roles, onSelected = { roles = it })
                }
                item { OutlinedTextField(value = telefono, onValueChange = { telefono = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Teléfono") }, singleLine = true) }
                item { OutlinedTextField(value = correo, onValueChange = { correo = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Correo") }, singleLine = true) }
                item { OutlinedTextField(value = numeroTarjeta, onValueChange = { numeroTarjeta = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Número de tarjeta") }, singleLine = true) }
                item { OutlinedTextField(value = direccionCrypto, onValueChange = { direccionCrypto = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Dirección cripto") }, singleLine = true) }
                item { OutlinedTextField(value = direccion, onValueChange = { direccion = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Dirección") }) }
                item { OutlinedTextField(value = identificadorFiscal, onValueChange = { identificadorFiscal = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Identificador fiscal") }, singleLine = true) }
                item { OutlinedTextField(value = nota, onValueChange = { nota = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Nota") }) }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val tipoFinal = if (tipoEntidadSeleccionado == TIPO_ENTIDAD_OTRO) customTipoEntidad.trim().uppercase() else tipoEntidad
                if (tipoFinal.isBlank()) return@TextButton
                val rolesFinal = roles.toMutableSet().apply {
                    if (tipoFinal == TipoEntidadTercero.ESTATAL || tipoFinal == TipoEntidadTercero.ESTADO) add(RolTercero.ESTADO) else remove(RolTercero.ESTADO)
                }
                onConfirm(nombre, tipoFinal, rolesFinal, telefono, correo, direccion, identificadorFiscal, numeroTarjeta, direccionCrypto, nota)
            }) { Text("Guardar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddCuentaDialog(
    terceros: List<TerceroListItem>,
    onDismiss: () -> Unit,
    onConfirm: (terceroId: String, tipoCuenta: String, categoria: String, concepto: String, montoOriginal: String, fechaVencimiento: String, moneda: String, descripcion: String, nota: String) -> Unit
) {
    var terceroId by rememberSaveable { mutableStateOf(terceros.firstOrNull()?.id.orEmpty()) }
    var tipoCuenta by rememberSaveable { mutableStateOf(TipoCuentaTercero.DEUDA) }
    var categoria by rememberSaveable { mutableStateOf(RolTercero.PROVEEDOR) }
    var concepto by rememberSaveable { mutableStateOf("") }
    var montoOriginal by rememberSaveable { mutableStateOf("") }
    var fechaVencimiento by rememberSaveable { mutableStateOf("") }
    var moneda by rememberSaveable { mutableStateOf("CUP") }
    var descripcion by rememberSaveable { mutableStateOf("") }
    var nota by rememberSaveable { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nueva deuda o préstamo") },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                item {
                    SingleSelectDropdown(
                        label = "Tercero",
                        options = if (terceros.isEmpty()) listOf("" to "Sin terceros") else terceros.map { it.id to it.nombre },
                        selected = terceroId, enabled = terceros.isNotEmpty(), onSelected = { terceroId = it }
                    )
                }
                item {
                    SingleSelectDropdown(label = "Tipo", options = listOf(TipoCuentaTercero.DEUDA to "Deuda", TipoCuentaTercero.PRESTAMO to "Préstamo"), selected = tipoCuenta, onSelected = {
                        tipoCuenta = it
                        categoria = if (it == TipoCuentaTercero.DEUDA) RolTercero.PROVEEDOR else RolTercero.CLIENTE
                    })
                }
                item {
                    SingleSelectDropdown(label = "Categoría", options = listOf(RolTercero.CLIENTE to "Cliente", RolTercero.PROVEEDOR to "Proveedor", RolTercero.EMPLEADO to "Empleado", RolTercero.ESTADO to "Estado"), selected = categoria, onSelected = { categoria = it })
                }
                item { OutlinedTextField(value = concepto, onValueChange = { concepto = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Concepto") }) }
                item { OutlinedTextField(value = montoOriginal, onValueChange = { montoOriginal = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Monto") }, singleLine = true) }
                item { OutlinedTextField(value = fechaVencimiento, onValueChange = { fechaVencimiento = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Vencimiento (YYYY-MM-DD)") }, singleLine = true) }
                item { OutlinedTextField(value = moneda, onValueChange = { moneda = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Moneda") }, singleLine = true) }
                item { OutlinedTextField(value = descripcion, onValueChange = { descripcion = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Descripción") }) }
                item { OutlinedTextField(value = nota, onValueChange = { nota = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Nota") }) }
            }
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(terceroId, tipoCuenta, categoria, concepto, montoOriginal, fechaVencimiento, moneda, descripcion, nota) }, enabled = terceros.isNotEmpty()) { Text("Guardar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EditTerceroDialog(
    tercero: TerceroListItem,
    onDismiss: () -> Unit,
    onConfirm: (terceroId: String, nombre: String, tipoEntidad: String, roles: Set<String>, telefono: String, correo: String, direccion: String, identificadorFiscal: String, numeroTarjeta: String, direccionCrypto: String, nota: String) -> Unit
) {
    var nombre by rememberSaveable { mutableStateOf(tercero.nombre) }
    var telefono by rememberSaveable { mutableStateOf(tercero.telefono) }
    var correo by rememberSaveable { mutableStateOf(tercero.correo) }
    var direccion by rememberSaveable { mutableStateOf(tercero.direccion) }
    var identificadorFiscal by rememberSaveable { mutableStateOf(tercero.identificadorFiscal) }
    var numeroTarjeta by rememberSaveable { mutableStateOf(tercero.numeroTarjeta) }
    var direccionCrypto by rememberSaveable { mutableStateOf(tercero.direccionCrypto) }
    var nota by rememberSaveable { mutableStateOf(tercero.nota) }
    val tipoOptions = remember { tipoEntidadOpcionesBase() }
    val tipoConocidoInicial = remember(tercero.tipoEntidad) {
        tercero.tipoEntidad in listOf(TipoEntidadTercero.TCP, TipoEntidadTercero.PARTICULAR, TipoEntidadTercero.PERSONA, TipoEntidadTercero.ESTATAL, TipoEntidadTercero.ESTADO, TipoEntidadTercero.MIPYME, TipoEntidadTercero.EMPRESA)
    }
    var tipoEntidad by rememberSaveable { mutableStateOf(tercero.tipoEntidad) }
    var tipoEntidadSeleccionado by rememberSaveable {
        mutableStateOf(if (tipoConocidoInicial) when (tercero.tipoEntidad) {
            TipoEntidadTercero.PERSONA -> TipoEntidadTercero.PARTICULAR
            TipoEntidadTercero.EMPRESA -> TipoEntidadTercero.MIPYME
            TipoEntidadTercero.ESTADO -> TipoEntidadTercero.ESTATAL
            else -> tercero.tipoEntidad
        } else TIPO_ENTIDAD_OTRO)
    }
    var customTipoEntidad by rememberSaveable { mutableStateOf(if (tipoConocidoInicial) "" else tercero.tipoEntidad) }
    var roles by rememberSaveable { mutableStateOf(tercero.rolesList.toSet()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Editar tercero") },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                item { OutlinedTextField(value = nombre, onValueChange = { nombre = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Nombre") }, singleLine = true) }
                item {
                    SingleSelectDropdown(label = "Tipo de tercero", options = tipoOptions, selected = tipoEntidadSeleccionado, onSelected = { selected ->
                        tipoEntidadSeleccionado = selected
                        if (selected != TIPO_ENTIDAD_OTRO) { tipoEntidad = selected; customTipoEntidad = "" }
                    })
                }
                if (tipoEntidadSeleccionado == TIPO_ENTIDAD_OTRO) {
                    item { OutlinedTextField(value = customTipoEntidad, onValueChange = { customTipoEntidad = it; tipoEntidad = it.trim().uppercase() }, modifier = Modifier.fillMaxWidth(), label = { Text("Nuevo tipo") }, singleLine = true) }
                }
                item { MultiSelectDropdown(label = "Roles", options = listOf(RolTercero.CLIENTE to "Cliente", RolTercero.PROVEEDOR to "Proveedor", RolTercero.EMPLEADO to "Empleado"), selected = roles, onSelected = { roles = it }) }
                item { OutlinedTextField(value = telefono, onValueChange = { telefono = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Teléfono") }, singleLine = true) }
                item { OutlinedTextField(value = correo, onValueChange = { correo = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Correo") }, singleLine = true) }
                item { OutlinedTextField(value = numeroTarjeta, onValueChange = { numeroTarjeta = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Número de tarjeta") }, singleLine = true) }
                item { OutlinedTextField(value = direccionCrypto, onValueChange = { direccionCrypto = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Dirección cripto") }, singleLine = true) }
                item { OutlinedTextField(value = direccion, onValueChange = { direccion = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Dirección") }) }
                item { OutlinedTextField(value = identificadorFiscal, onValueChange = { identificadorFiscal = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Identificador fiscal") }, singleLine = true) }
                item { OutlinedTextField(value = nota, onValueChange = { nota = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Nota") }) }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val tipoFinal = if (tipoEntidadSeleccionado == TIPO_ENTIDAD_OTRO) customTipoEntidad.trim().uppercase() else tipoEntidad
                if (tipoFinal.isBlank()) return@TextButton
                val rolesFinal = roles.toMutableSet().apply {
                    if (tipoFinal == TipoEntidadTercero.ESTATAL || tipoFinal == TipoEntidadTercero.ESTADO) add(RolTercero.ESTADO) else remove(RolTercero.ESTADO)
                }
                onConfirm(tercero.id, nombre, tipoFinal, rolesFinal, telefono, correo, direccion, identificadorFiscal, numeroTarjeta, direccionCrypto, nota)
            }) { Text("Guardar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EditCuentaDialog(
    cuenta: TerceroCuentaListItem,
    onDismiss: () -> Unit,
    onConfirm: (cuentaId: String, categoria: String, concepto: String, descripcion: String, fechaVencimiento: String, estado: String, moneda: String, nota: String) -> Unit
) {
    var categoria by rememberSaveable { mutableStateOf(cuenta.categoria) }
    var concepto by rememberSaveable { mutableStateOf(cuenta.concepto) }
    var descripcion by rememberSaveable { mutableStateOf(cuenta.descripcion) }
    var fechaVencimiento by rememberSaveable { mutableStateOf(cuenta.fechaVencimiento) }
    var estado by rememberSaveable { mutableStateOf(cuenta.estado) }
    var moneda by rememberSaveable { mutableStateOf(cuenta.moneda) }
    var nota by rememberSaveable { mutableStateOf(cuenta.nota) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Editar cuenta") },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                item { SingleSelectDropdown(label = "Categoría", options = listOf(RolTercero.CLIENTE to "Cliente", RolTercero.PROVEEDOR to "Proveedor", RolTercero.EMPLEADO to "Empleado", RolTercero.ESTADO to "Estado"), selected = categoria, onSelected = { categoria = it }) }
                item { SingleSelectDropdown(label = "Estado", options = listOf(EstadoCuentaTercero.PENDIENTE to "Pendiente", EstadoCuentaTercero.VENCIDO to "Vencido", EstadoCuentaTercero.PAGADO to "Pagado", EstadoCuentaTercero.COBRADO to "Cobrado", EstadoCuentaTercero.CANCELADO to "Cancelado"), selected = estado, onSelected = { estado = it }) }
                item { OutlinedTextField(value = concepto, onValueChange = { concepto = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Concepto") }) }
                item { OutlinedTextField(value = fechaVencimiento, onValueChange = { fechaVencimiento = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Vencimiento (YYYY-MM-DD)") }, singleLine = true) }
                item { OutlinedTextField(value = moneda, onValueChange = { moneda = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Moneda") }, singleLine = true) }
                item { OutlinedTextField(value = descripcion, onValueChange = { descripcion = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Descripción") }) }
                item { OutlinedTextField(value = nota, onValueChange = { nota = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Nota") }) }
            }
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(cuenta.id, categoria, concepto, descripcion, fechaVencimiento, estado, moneda, nota) }) { Text("Guardar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun <T> SingleSelectDropdown(
    label: String,
    options: List<Pair<T, String>>,
    selected: T,
    enabled: Boolean = true,
    onSelected: (T) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedLabel = options.firstOrNull { it.first == selected }?.second.orEmpty()
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { if (enabled) expanded = it }) {
        OutlinedTextField(value = selectedLabel, onValueChange = {}, readOnly = true, enabled = enabled, label = { Text(label) }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) }, modifier = Modifier.fillMaxWidth().menuAnchor())
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { (value, title) ->
                DropdownMenuItem(text = { Text(title) }, onClick = { onSelected(value); expanded = false })
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MultiSelectDropdown(
    label: String,
    options: List<Pair<String, String>>,
    selected: Set<String>,
    onSelected: (Set<String>) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedLabel = options.filter { selected.contains(it.first) }.joinToString(", ") { it.second }.ifBlank { "Seleccionar" }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
        OutlinedTextField(value = selectedLabel, onValueChange = {}, readOnly = true, label = { Text(label) }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) }, modifier = Modifier.fillMaxWidth().menuAnchor())
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { (value, title) ->
                val isSelected = selected.contains(value)
                DropdownMenuItem(
                    text = { Text(title) },
                    trailingIcon = { if (isSelected) Icon(Icons.Default.Edit, null, modifier = Modifier.size(16.dp)) },
                    onClick = { onSelected(selected.toMutableSet().apply { if (isSelected) remove(value) else add(value) }) }
                )
            }
        }
    }
}