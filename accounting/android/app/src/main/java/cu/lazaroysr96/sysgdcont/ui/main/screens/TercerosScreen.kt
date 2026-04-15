@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package cu.lazaroysr96.sysgdcont.ui.main.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Sell
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Divider
import androidx.compose.material3.ElevatedAssistChip
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.RolTercero
import cu.lazaroysr96.sysgdcont.data.model.TerceroCuentaListItem
import cu.lazaroysr96.sysgdcont.data.model.TerceroListItem
import cu.lazaroysr96.sysgdcont.data.model.EstadoCuentaTercero
import cu.lazaroysr96.sysgdcont.data.model.TipoCuentaTercero
import cu.lazaroysr96.sysgdcont.data.model.TipoEntidadTercero
import cu.lazaroysr96.sysgdcont.viewmodel.TercerosViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.TarjetaViewModel

private enum class TercerosTab {
    PERSONAS,
    CUENTAS,
    TARJETAS
}

private enum class PersonasFilter {
    TODOS,
    TCP,
    PARTICULAR,
    ESTATAL,
    MIPYME
}

private enum class CuentasFilter {
    TODAS,
    DEUDAS,
    PRESTAMOS
}

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
        uiState.snackbarMessage?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.clearSnackbar()
        }
    }

    LaunchedEffect(tarjetaUiState.snackbarMessage) {
        tarjetaUiState.snackbarMessage?.let { message ->
            snackbarHostState.showSnackbar(message)
            tarjetaViewModel.clearSnackbar()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                when (selectedTab) {
                    TercerosTab.PERSONAS -> {
                        FloatingActionButton(onClick = { viewModel.showAddTerceroDialog(true) }) {
                            Icon(Icons.Default.Add, contentDescription = "Agregar tercero")
                        }
                    }
                    TercerosTab.CUENTAS -> {
                        if (uiState.terceros.isNotEmpty()) {
                            FloatingActionButton(onClick = { viewModel.showAddCuentaDialog(true) }) {
                                Icon(Icons.Default.AccountBalance, contentDescription = "Agregar cuenta")
                            }
                        }
                    }
                    TercerosTab.TARJETAS -> {
                        SmallFloatingActionButton(
                            onClick = { tarjetaViewModel.showScanDialog(true) },
                            containerColor = MaterialTheme.colorScheme.secondaryContainer
                        ) {
                            Icon(Icons.Default.QrCodeScanner, contentDescription = "Escanear QR")
                        }
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
                    icon = { Icon(Icons.Default.People, contentDescription = null) },
                    label = { Text("Personas") }
                )
                NavigationBarItem(
                    selected = selectedTab == TercerosTab.CUENTAS,
                    onClick = { selectedTab = TercerosTab.CUENTAS },
                    icon = { Icon(Icons.Default.AccountBalance, contentDescription = null) },
                    label = { Text("Deudas") }
                )
                NavigationBarItem(
                    selected = selectedTab == TercerosTab.TARJETAS,
                    onClick = { selectedTab = TercerosTab.TARJETAS },
                    icon = { Icon(Icons.Default.CreditCard, contentDescription = null) },
                    label = { Text("Tarjetas") }
                )
            }
        }
    ) { padding ->
        when (selectedTab) {
            TercerosTab.PERSONAS -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        SectionTitle(
                            title = "Personas",
                            subtitle = "Clientes, proveedores o empleados con sus datos principales."
                        )
                    }
                    item {
                        PersonasFilterRow(
                            selected = personasFilter,
                            onSelected = { personasFilter = it }
                        )
                    }
                    val personas = filterPersonas(uiState.terceros, personasFilter)
                    if (personas.isEmpty()) {
                        item { EmptyState("Todavía no hay terceros", "Crea tu primera persona o empresa.") }
                    } else {
                        items(personas, key = { it.id }) { tercero ->
                            TerceroCard(
                                tercero = tercero,
                                formatCurrency = viewModel::formatCurrency,
                                onEdit = { viewModel.showEditTerceroDialog(tercero) },
                                onArchive = { viewModel.archiveTercero(tercero.id) }
                            )
                        }
                    }
                }
            }
            TercerosTab.CUENTAS -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        SectionTitle(
                            title = "Deudas y préstamos",
                            subtitle = "Filtra por tipo y revisa lo pendiente."
                        )
                    }
                    item {
                        CuentasFilterRow(
                            selected = cuentasFilter,
                            onSelected = { cuentasFilter = it }
                        )
                    }
                    val cuentas = filterCuentas(uiState.cuentas, cuentasFilter)
                    if (cuentas.isEmpty()) {
                        item { EmptyState("Sin cuentas pendientes", "Registra una deuda o un préstamo.") }
                    } else {
                        items(cuentas, key = { it.id }) { cuenta ->
                            CuentaCard(
                                cuenta = cuenta,
                                formatCurrency = viewModel::formatCurrency,
                                onEdit = { viewModel.showEditCuentaDialog(cuenta) }
                            )
                        }
                    }
                }
            }
            TercerosTab.TARJETAS -> {
                TarjetaContent(
                    viewModel = tarjetaViewModel,
                    contentPadding = padding
                )
            }
        }
    }

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

    val terceroEnEdicion = uiState.terceroEnEdicion
    if (uiState.showEditTerceroDialog && terceroEnEdicion != null) {
        EditTerceroDialog(
            tercero = terceroEnEdicion,
            onDismiss = { viewModel.showEditTerceroDialog(null) },
            onConfirm = viewModel::actualizarTercero
        )
    }

    val cuentaEnEdicion = uiState.cuentaEnEdicion
    if (uiState.showEditCuentaDialog && cuentaEnEdicion != null) {
        EditCuentaDialog(
            cuenta = cuentaEnEdicion,
            onDismiss = { viewModel.showEditCuentaDialog(null) },
            onConfirm = viewModel::actualizarCuenta
        )
    }
}

@Composable
private fun PersonasFilterRow(
    selected: PersonasFilter,
    onSelected: (PersonasFilter) -> Unit
) {
    FilterDropdown(
        label = "Tipo de persona",
        options = listOf(
            PersonasFilter.TODOS to "Todos",
            PersonasFilter.TCP to "TCP",
            PersonasFilter.PARTICULAR to "Particular",
            PersonasFilter.ESTATAL to "Estatal",
            PersonasFilter.MIPYME to "MIPYME"
        ),
        selected = selected,
        onSelected = onSelected
    )
}

@Composable
private fun CuentasFilterRow(
    selected: CuentasFilter,
    onSelected: (CuentasFilter) -> Unit
) {
    FilterDropdown(
        label = "Tipo de cuenta",
        options = listOf(
            CuentasFilter.TODAS to "Todas",
            CuentasFilter.DEUDAS to "Deudas",
            CuentasFilter.PRESTAMOS to "Préstamos"
        ),
        selected = selected,
        onSelected = onSelected
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun <T> FilterDropdown(
    label: String,
    options: List<Pair<T, String>>,
    selected: T,
    onSelected: (T) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedLabel = options.firstOrNull { it.first == selected }?.second.orEmpty()

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = it }
    ) {
        OutlinedTextField(
            value = selectedLabel,
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor()
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { (value, title) ->
                DropdownMenuItem(
                    text = { Text(title) },
                    onClick = {
                        onSelected(value)
                        expanded = false
                    }
                )
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String, subtitle: String) {
    Column {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun EmptyState(title: String, subtitle: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                Icons.Default.Inventory2,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

private fun filterPersonas(
    terceros: List<TerceroListItem>,
    filter: PersonasFilter
): List<TerceroListItem> {
    return when (filter) {
        PersonasFilter.TODOS -> terceros
        PersonasFilter.TCP -> terceros.filter { it.tipoEntidad == TipoEntidadTercero.TCP }
        PersonasFilter.PARTICULAR -> terceros.filter { it.tipoEntidad == TipoEntidadTercero.PARTICULAR || it.tipoEntidad == TipoEntidadTercero.PERSONA }
        PersonasFilter.ESTATAL -> terceros.filter { it.tipoEntidad == TipoEntidadTercero.ESTATAL || it.tipoEntidad == TipoEntidadTercero.ESTADO }
        PersonasFilter.MIPYME -> terceros.filter { it.tipoEntidad == TipoEntidadTercero.MIPYME || it.tipoEntidad == TipoEntidadTercero.EMPRESA }
    }
}

private const val TIPO_ENTIDAD_OTRO = "__OTRO__"

private fun tipoEntidadOpcionesBase(): List<Pair<String, String>> = listOf(
    TipoEntidadTercero.TCP to "TCP",
    TipoEntidadTercero.PARTICULAR to "Particular",
    TipoEntidadTercero.ESTATAL to "Estatal",
    TipoEntidadTercero.MIPYME to "MIPYME",
    TIPO_ENTIDAD_OTRO to "Otro (crear nuevo)"
)

private fun tipoEntidadLabel(value: String): String {
    return when (value) {
        TipoEntidadTercero.TCP -> "TCP"
        TipoEntidadTercero.PARTICULAR, TipoEntidadTercero.PERSONA -> "Particular"
        TipoEntidadTercero.ESTATAL, TipoEntidadTercero.ESTADO -> "Estatal"
        TipoEntidadTercero.MIPYME, TipoEntidadTercero.EMPRESA -> "MIPYME"
        else -> value
    }
}

private fun filterCuentas(
    cuentas: List<TerceroCuentaListItem>,
    filter: CuentasFilter
): List<TerceroCuentaListItem> {
    return when (filter) {
        CuentasFilter.TODAS -> cuentas
        CuentasFilter.DEUDAS -> cuentas.filter { it.tipoCuenta == TipoCuentaTercero.DEUDA }
        CuentasFilter.PRESTAMOS -> cuentas.filter { it.tipoCuenta == TipoCuentaTercero.PRESTAMO }
    }
}

@Composable
private fun TerceroCard(
    tercero: TerceroListItem,
    formatCurrency: (Double, String) -> String,
    onEdit: () -> Unit,
    onArchive: () -> Unit
) {
    val context = LocalContext.current
    var expanded by remember { mutableStateOf(false) }

    Card(colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(tercero.nombre, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(
                        text = tipoEntidadLabel(tercero.tipoEntidad),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (expanded) {
                    IconButton(onClick = onEdit) {
                        Icon(Icons.Default.Edit, contentDescription = "Editar tercero")
                    }
                    IconButton(onClick = onArchive) {
                        Icon(Icons.Default.DeleteOutline, contentDescription = "Archivar tercero")
                    }
                }
                IconButton(onClick = { expanded = !expanded }) {
                    Icon(
                        if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (expanded) "Colapsar" else "Expandir"
                    )
                }
            }

            AnimatedVisibility(
                visible = expanded,
                enter = expandVertically(),
                exit = shrinkVertically()
            ) {
                Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                    if (tercero.rolesList.isNotEmpty()) {
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            tercero.rolesList.forEach { rol ->
                                AssistChip(onClick = {}, label = { Text(rol.lowercase().replaceFirstChar { it.uppercase() }) })
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    ContactLine(
                        icon = Icons.Default.Call,
                        value = tercero.telefono,
                        actionIcon = Icons.Default.Call,
                        actionDescription = "Llamar",
                        onAction = { callPhone(context, tercero.telefono) },
                        onCopy = { copyToClipboard(context, "Telefono", tercero.telefono) }
                    )
                    ContactLine(
                        icon = Icons.Default.Email,
                        value = tercero.correo,
                        actionIcon = Icons.Default.Email,
                        actionDescription = "Enviar correo",
                        onAction = { sendEmail(context, tercero.correo) },
                        onCopy = { copyToClipboard(context, "Correo", tercero.correo) }
                    )
                    ContactLine(
                        icon = Icons.Default.CreditCard,
                        value = tercero.numeroTarjeta,
                        actionIcon = Icons.Default.ContentCopy,
                        actionDescription = "Copiar tarjeta",
                        onAction = { copyToClipboard(context, "Tarjeta", tercero.numeroTarjeta) },
                        onCopy = { copyToClipboard(context, "Tarjeta", tercero.numeroTarjeta) }
                    )
                    ContactLine(
                        icon = Icons.Default.Sell,
                        value = tercero.direccionCrypto,
                        actionIcon = Icons.Default.ContentCopy,
                        actionDescription = "Copiar wallet",
                        onAction = { copyToClipboard(context, "Wallet", tercero.direccionCrypto) },
                        onCopy = { copyToClipboard(context, "Wallet", tercero.direccionCrypto) }
                    )

                    if (tercero.direccion.isNotBlank()) {
                        Text(
                            text = "Dirección: ${tercero.direccion}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }

                    if (tercero.identificadorFiscal.isNotBlank()) {
                        Text(
                            text = "Identificador: ${tercero.identificadorFiscal}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }

                    if (tercero.nota.isNotBlank()) {
                        Text(
                            text = "Nota: ${tercero.nota}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Divider()
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Por pagar", style = MaterialTheme.typography.bodySmall)
                Text(
                    formatCurrency(tercero.totalDeudas, "CUP"),
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Por cobrar", style = MaterialTheme.typography.bodySmall)
                Text(
                    formatCurrency(tercero.totalPrestamos, "CUP"),
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
private fun ContactLine(icon: ImageVector, value: String) {
    if (value.isBlank()) return
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, modifier = Modifier.padding(top = 2.dp))
        Text(value, style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun ContactLine(
    icon: ImageVector,
    value: String,
    actionIcon: ImageVector,
    actionDescription: String,
    onAction: () -> Unit,
    onCopy: () -> Unit
) {
    if (value.isBlank()) return
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, modifier = Modifier.padding(top = 2.dp))
        Text(value, style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
        IconButton(onClick = onAction) {
            Icon(actionIcon, contentDescription = actionDescription)
        }
        IconButton(onClick = onCopy) {
            Icon(Icons.Default.ContentCopy, contentDescription = "Copiar")
        }
    }
}

@Composable
private fun CuentaCard(
    cuenta: TerceroCuentaListItem,
    formatCurrency: (Double, String) -> String,
    onEdit: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Card {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(cuenta.concepto, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(
                        "${cuenta.terceroNombre} • ${cuenta.categoria}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    AssistChip(
                        onClick = {},
                        label = { Text(cuenta.estado.lowercase().replaceFirstChar { it.uppercase() }) }
                    )
                    if (expanded) {
                        IconButton(onClick = onEdit) {
                            Icon(Icons.Default.Edit, contentDescription = "Editar cuenta")
                        }
                    }
                    IconButton(onClick = { expanded = !expanded }) {
                        Icon(
                            if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = if (expanded) "Colapsar" else "Expandir"
                        )
                    }
                }
            }

            AnimatedVisibility(
                visible = expanded,
                enter = expandVertically(),
                exit = shrinkVertically()
            ) {
                Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                    if (cuenta.descripcion.isNotBlank()) {
                        Text(cuenta.descripcion, style = MaterialTheme.typography.bodySmall)
                    }

                    if (cuenta.nota.isNotBlank()) {
                        Text(
                            text = "Nota: ${cuenta.nota}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Divider()

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Monto original")
                        Text(formatCurrency(cuenta.montoOriginal, cuenta.moneda), fontWeight = FontWeight.Medium)
                    }
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Pendiente")
                Text(formatCurrency(cuenta.montoPendiente, cuenta.moneda), fontWeight = FontWeight.Bold)
            }

            if (cuenta.fechaVencimiento.isNotBlank()) {
                Text(
                    text = "Vence: ${cuenta.fechaVencimiento}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }
        }
    }
}

@Composable
private fun AddTerceroDialog(
    onDismiss: () -> Unit,
    onConfirm: (
        nombre: String,
        tipoEntidad: String,
        roles: Set<String>,
        telefono: String,
        correo: String,
        direccion: String,
        identificadorFiscal: String,
        numeroTarjeta: String,
        direccionCrypto: String,
        nota: String
    ) -> Unit
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
                item {
                    OutlinedTextField(
                        value = nombre,
                        onValueChange = { nombre = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Nombre") },
                        singleLine = true
                    )
                }
                item {
                    SingleSelectDropdown(
                        label = "Tipo de tercero",
                        options = tipoOptions,
                        selected = tipoEntidadSeleccionado,
                        onSelected = { selected ->
                            tipoEntidadSeleccionado = selected
                            if (selected != TIPO_ENTIDAD_OTRO) {
                                tipoEntidad = selected
                                customTipoEntidad = ""
                            }
                        }
                    )
                }
                if (tipoEntidadSeleccionado == TIPO_ENTIDAD_OTRO) {
                    item {
                        OutlinedTextField(
                            value = customTipoEntidad,
                            onValueChange = {
                                customTipoEntidad = it
                                tipoEntidad = it.trim().uppercase()
                            },
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Nuevo tipo de tercero") },
                            singleLine = true
                        )
                    }
                }
                item {
                    MultiSelectDropdown(
                        label = "Roles",
                        options = listOf(
                            RolTercero.CLIENTE to "Cliente",
                            RolTercero.PROVEEDOR to "Proveedor",
                            RolTercero.EMPLEADO to "Empleado"
                        ),
                        selected = roles,
                        onSelected = { roles = it }
                    )
                }
                item {
                    OutlinedTextField(
                        value = telefono,
                        onValueChange = { telefono = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Teléfono") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = correo,
                        onValueChange = { correo = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Correo") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = numeroTarjeta,
                        onValueChange = { numeroTarjeta = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Número de tarjeta") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = direccionCrypto,
                        onValueChange = { direccionCrypto = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Dirección cripto") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = direccion,
                        onValueChange = { direccion = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Dirección") }
                    )
                }
                item {
                    OutlinedTextField(
                        value = identificadorFiscal,
                        onValueChange = { identificadorFiscal = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Identificador fiscal") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = nota,
                        onValueChange = { nota = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Nota") }
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val tipoFinal = if (tipoEntidadSeleccionado == TIPO_ENTIDAD_OTRO) {
                        customTipoEntidad.trim().uppercase()
                    } else {
                        tipoEntidad
                    }
                    if (tipoFinal.isBlank()) return@TextButton

                    val rolesFinal = roles.toMutableSet()
                    if (tipoFinal == TipoEntidadTercero.ESTATAL || tipoFinal == TipoEntidadTercero.ESTADO) {
                        rolesFinal.add(RolTercero.ESTADO)
                    } else {
                        rolesFinal.remove(RolTercero.ESTADO)
                    }
                    onConfirm(
                        nombre,
                        tipoFinal,
                        rolesFinal,
                        telefono,
                        correo,
                        direccion,
                        identificadorFiscal,
                        numeroTarjeta,
                        direccionCrypto,
                        nota
                    )
                }
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
}

@Composable
private fun AddCuentaDialog(
    terceros: List<TerceroListItem>,
    onDismiss: () -> Unit,
    onConfirm: (
        terceroId: String,
        tipoCuenta: String,
        categoria: String,
        concepto: String,
        montoOriginal: String,
        fechaVencimiento: String,
        moneda: String,
        descripcion: String,
        nota: String
    ) -> Unit
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
                    val terceroOptions = if (terceros.isEmpty()) {
                        listOf("" to "Sin terceros")
                    } else {
                        terceros.map { it.id to it.nombre }
                    }
                    SingleSelectDropdown(
                        label = "Tercero",
                        options = terceroOptions,
                        selected = terceroId,
                        enabled = terceros.isNotEmpty(),
                        onSelected = { terceroId = it }
                    )
                }
                item {
                    SingleSelectDropdown(
                        label = "Tipo",
                        options = listOf(
                            TipoCuentaTercero.DEUDA to "Deuda",
                            TipoCuentaTercero.PRESTAMO to "Préstamo"
                        ),
                        selected = tipoCuenta,
                        onSelected = {
                            tipoCuenta = it
                            categoria = if (it == TipoCuentaTercero.DEUDA) RolTercero.PROVEEDOR else RolTercero.CLIENTE
                        }
                    )
                }
                item {
                    SingleSelectDropdown(
                        label = "Categoría",
                        options = listOf(
                            RolTercero.CLIENTE to "Cliente",
                            RolTercero.PROVEEDOR to "Proveedor",
                            RolTercero.EMPLEADO to "Empleado",
                            RolTercero.ESTADO to "Estado"
                        ),
                        selected = categoria,
                        onSelected = { categoria = it }
                    )
                }
                item {
                    OutlinedTextField(
                        value = concepto,
                        onValueChange = { concepto = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Concepto") }
                    )
                }
                item {
                    OutlinedTextField(
                        value = montoOriginal,
                        onValueChange = { montoOriginal = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Monto") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = fechaVencimiento,
                        onValueChange = { fechaVencimiento = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Vencimiento (YYYY-MM-DD)") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = moneda,
                        onValueChange = { moneda = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Moneda") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = descripcion,
                        onValueChange = { descripcion = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Descripción") }
                    )
                }
                item {
                    OutlinedTextField(
                        value = nota,
                        onValueChange = { nota = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Nota") }
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onConfirm(
                        terceroId,
                        tipoCuenta,
                        categoria,
                        concepto,
                        montoOriginal,
                        fechaVencimiento,
                        moneda,
                        descripcion,
                        nota
                    )
                },
                enabled = terceros.isNotEmpty()
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
}

@Composable
private fun EditTerceroDialog(
    tercero: TerceroListItem,
    onDismiss: () -> Unit,
    onConfirm: (
        terceroId: String,
        nombre: String,
        tipoEntidad: String,
        roles: Set<String>,
        telefono: String,
        correo: String,
        direccion: String,
        identificadorFiscal: String,
        numeroTarjeta: String,
        direccionCrypto: String,
        nota: String
    ) -> Unit
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
        when (tercero.tipoEntidad) {
            TipoEntidadTercero.TCP,
            TipoEntidadTercero.PARTICULAR,
            TipoEntidadTercero.PERSONA,
            TipoEntidadTercero.ESTATAL,
            TipoEntidadTercero.ESTADO,
            TipoEntidadTercero.MIPYME,
            TipoEntidadTercero.EMPRESA -> true
            else -> false
        }
    }
    var tipoEntidad by rememberSaveable { mutableStateOf(tercero.tipoEntidad) }
    var tipoEntidadSeleccionado by rememberSaveable {
        mutableStateOf(
            if (tipoConocidoInicial) {
                when (tercero.tipoEntidad) {
                    TipoEntidadTercero.PERSONA -> TipoEntidadTercero.PARTICULAR
                    TipoEntidadTercero.EMPRESA -> TipoEntidadTercero.MIPYME
                    TipoEntidadTercero.ESTADO -> TipoEntidadTercero.ESTATAL
                    else -> tercero.tipoEntidad
                }
            } else {
                TIPO_ENTIDAD_OTRO
            }
        )
    }
    var customTipoEntidad by rememberSaveable {
        mutableStateOf(if (tipoConocidoInicial) "" else tercero.tipoEntidad)
    }
    var roles by rememberSaveable { mutableStateOf(tercero.rolesList.toSet()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Editar tercero") },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                item {
                    OutlinedTextField(
                        value = nombre,
                        onValueChange = { nombre = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Nombre") },
                        singleLine = true
                    )
                }
                item {
                    SingleSelectDropdown(
                        label = "Tipo de tercero",
                        options = tipoOptions,
                        selected = tipoEntidadSeleccionado,
                        onSelected = { selected ->
                            tipoEntidadSeleccionado = selected
                            if (selected != TIPO_ENTIDAD_OTRO) {
                                tipoEntidad = selected
                                customTipoEntidad = ""
                            }
                        }
                    )
                }
                if (tipoEntidadSeleccionado == TIPO_ENTIDAD_OTRO) {
                    item {
                        OutlinedTextField(
                            value = customTipoEntidad,
                            onValueChange = {
                                customTipoEntidad = it
                                tipoEntidad = it.trim().uppercase()
                            },
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Nuevo tipo de tercero") },
                            singleLine = true
                        )
                    }
                }
                item {
                    MultiSelectDropdown(
                        label = "Roles",
                        options = listOf(
                            RolTercero.CLIENTE to "Cliente",
                            RolTercero.PROVEEDOR to "Proveedor",
                            RolTercero.EMPLEADO to "Empleado"
                        ),
                        selected = roles,
                        onSelected = { roles = it }
                    )
                }
                item {
                    OutlinedTextField(
                        value = telefono,
                        onValueChange = { telefono = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Teléfono") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = correo,
                        onValueChange = { correo = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Correo") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = numeroTarjeta,
                        onValueChange = { numeroTarjeta = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Número de tarjeta") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = direccionCrypto,
                        onValueChange = { direccionCrypto = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Dirección cripto") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = direccion,
                        onValueChange = { direccion = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Dirección") }
                    )
                }
                item {
                    OutlinedTextField(
                        value = identificadorFiscal,
                        onValueChange = { identificadorFiscal = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Identificador fiscal") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = nota,
                        onValueChange = { nota = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Nota") }
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val tipoFinal = if (tipoEntidadSeleccionado == TIPO_ENTIDAD_OTRO) {
                        customTipoEntidad.trim().uppercase()
                    } else {
                        tipoEntidad
                    }
                    if (tipoFinal.isBlank()) return@TextButton

                    val rolesFinal = roles.toMutableSet()
                    if (tipoFinal == TipoEntidadTercero.ESTATAL || tipoFinal == TipoEntidadTercero.ESTADO) {
                        rolesFinal.add(RolTercero.ESTADO)
                    } else {
                        rolesFinal.remove(RolTercero.ESTADO)
                    }
                    onConfirm(
                        tercero.id,
                        nombre,
                        tipoFinal,
                        rolesFinal,
                        telefono,
                        correo,
                        direccion,
                        identificadorFiscal,
                        numeroTarjeta,
                        direccionCrypto,
                        nota
                    )
                }
            ) {
                Text("Guardar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

@Composable
private fun EditCuentaDialog(
    cuenta: TerceroCuentaListItem,
    onDismiss: () -> Unit,
    onConfirm: (
        cuentaId: String,
        categoria: String,
        concepto: String,
        descripcion: String,
        fechaVencimiento: String,
        estado: String,
        moneda: String,
        nota: String
    ) -> Unit
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
        title = { Text("Editar deuda/préstamo") },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                item {
                    SingleSelectDropdown(
                        label = "Categoría",
                        options = listOf(
                            RolTercero.CLIENTE to "Cliente",
                            RolTercero.PROVEEDOR to "Proveedor",
                            RolTercero.EMPLEADO to "Empleado",
                            RolTercero.ESTADO to "Estado"
                        ),
                        selected = categoria,
                        onSelected = { categoria = it }
                    )
                }
                item {
                    SingleSelectDropdown(
                        label = "Estado",
                        options = listOf(
                            EstadoCuentaTercero.PENDIENTE to "Pendiente",
                            EstadoCuentaTercero.VENCIDO to "Vencido",
                            EstadoCuentaTercero.PAGADO to "Pagado",
                            EstadoCuentaTercero.COBRADO to "Cobrado",
                            EstadoCuentaTercero.CANCELADO to "Cancelado"
                        ),
                        selected = estado,
                        onSelected = { estado = it }
                    )
                }
                item {
                    OutlinedTextField(
                        value = concepto,
                        onValueChange = { concepto = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Concepto") }
                    )
                }
                item {
                    OutlinedTextField(
                        value = fechaVencimiento,
                        onValueChange = { fechaVencimiento = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Vencimiento (YYYY-MM-DD)") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = moneda,
                        onValueChange = { moneda = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Moneda") },
                        singleLine = true
                    )
                }
                item {
                    OutlinedTextField(
                        value = descripcion,
                        onValueChange = { descripcion = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Descripción") }
                    )
                }
                item {
                    OutlinedTextField(
                        value = nota,
                        onValueChange = { nota = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Nota") }
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onConfirm(
                        cuenta.id,
                        categoria,
                        concepto,
                        descripcion,
                        fechaVencimiento,
                        estado,
                        moneda,
                        nota
                    )
                }
            ) {
                Text("Guardar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
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

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { if (enabled) expanded = it }
    ) {
        OutlinedTextField(
            value = selectedLabel,
            onValueChange = {},
            readOnly = true,
            enabled = enabled,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor()
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { (value, title) ->
                DropdownMenuItem(
                    text = { Text(title) },
                    onClick = {
                        onSelected(value)
                        expanded = false
                    }
                )
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
    val selectedLabel = options.filter { selected.contains(it.first) }
        .joinToString(", ") { it.second }
        .ifBlank { "Seleccionar" }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = it }
    ) {
        OutlinedTextField(
            value = selectedLabel,
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor()
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { (value, title) ->
                val isSelected = selected.contains(value)
                DropdownMenuItem(
                    text = { Text(title) },
                    trailingIcon = {
                        if (isSelected) {
                            Icon(Icons.Default.Check, contentDescription = null)
                        }
                    },
                    onClick = {
                        val updated = selected.toMutableSet().apply {
                            if (isSelected) remove(value) else add(value)
                        }
                        onSelected(updated)
                    }
                )
            }
        }
    }
}

private fun callPhone(context: Context, value: String) {
    val phone = value.filter { it.isDigit() || it == '+' }
    if (phone.isBlank()) return
    runCatching {
        context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")))
    }
}

private fun sendEmail(context: Context, value: String) {
    val email = value.trim()
    if (email.isBlank()) return
    runCatching {
        context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$email")))
    }
}

private fun copyToClipboard(context: Context, label: String, value: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    clipboard.setPrimaryClip(ClipData.newPlainText(label, value))
    Toast.makeText(context, "$label copiado", Toast.LENGTH_SHORT).show()
}
