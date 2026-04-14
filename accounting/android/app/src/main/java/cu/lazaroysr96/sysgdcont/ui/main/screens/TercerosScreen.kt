@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package cu.lazaroysr96.sysgdcont.ui.main.screens

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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.Divider
import androidx.compose.material3.ElevatedAssistChip
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
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
import androidx.compose.material3.TopAppBar
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.RolTercero
import cu.lazaroysr96.sysgdcont.data.model.TerceroCuentaListItem
import cu.lazaroysr96.sysgdcont.data.model.TerceroListItem
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
    PERSONA,
    EMPRESA,
    ESTADO
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
        topBar = {
            TopAppBar(
                title = { Text("Terceros") },
                actions = {
                    if (selectedTab == TercerosTab.TARJETAS) {
                        IconButton(onClick = { tarjetaViewModel.showScanDialog(true) }) {
                            Icon(Icons.Default.QrCodeScanner, "Escanear QR")
                        }
                    }
                }
            )
        },
        floatingActionButton = {
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
                    FloatingActionButton(onClick = { tarjetaViewModel.showAddDialog(true) }) {
                        Icon(Icons.Default.Add, contentDescription = "Agregar tarjeta")
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
                            CuentaCard(cuenta = cuenta, formatCurrency = viewModel::formatCurrency)
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
}

@Composable
private fun PersonasFilterRow(
    selected: PersonasFilter,
    onSelected: (PersonasFilter) -> Unit
) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        PersonasFilter.values().forEach { option ->
            val label = when (option) {
                PersonasFilter.TODOS -> "Todos"
                PersonasFilter.PERSONA -> "Persona"
                PersonasFilter.EMPRESA -> "Empresa"
                PersonasFilter.ESTADO -> "Estado"
            }
            if (selected == option) {
                ElevatedAssistChip(onClick = { onSelected(option) }, label = { Text(label) })
            } else {
                AssistChip(onClick = { onSelected(option) }, label = { Text(label) })
            }
        }
    }
}

@Composable
private fun CuentasFilterRow(
    selected: CuentasFilter,
    onSelected: (CuentasFilter) -> Unit
) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        CuentasFilter.values().forEach { option ->
            val label = when (option) {
                CuentasFilter.TODAS -> "Todas"
                CuentasFilter.DEUDAS -> "Deudas"
                CuentasFilter.PRESTAMOS -> "Préstamos"
            }
            if (selected == option) {
                ElevatedAssistChip(onClick = { onSelected(option) }, label = { Text(label) })
            } else {
                AssistChip(onClick = { onSelected(option) }, label = { Text(label) })
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
        PersonasFilter.PERSONA -> terceros.filter { it.tipoEntidad == TipoEntidadTercero.PERSONA }
        PersonasFilter.EMPRESA -> terceros.filter { it.tipoEntidad == TipoEntidadTercero.EMPRESA }
        PersonasFilter.ESTADO -> terceros.filter { it.tipoEntidad == TipoEntidadTercero.ESTADO }
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
    onArchive: () -> Unit
) {
    Card {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(tercero.nombre, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(
                        text = tercero.tipoEntidad.lowercase().replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                IconButton(onClick = onArchive) {
                    Icon(Icons.Default.DeleteOutline, contentDescription = "Archivar tercero")
                }
            }

            if (tercero.rolesList.isNotEmpty()) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    tercero.rolesList.forEach { rol ->
                        AssistChip(onClick = {}, label = { Text(rol.lowercase().replaceFirstChar { it.uppercase() }) })
                    }
                }
            }

            ContactLine(Icons.Default.Call, tercero.telefono)
            ContactLine(Icons.Default.Email, tercero.correo)
            ContactLine(Icons.Default.CreditCard, tercero.numeroTarjeta)
            ContactLine(Icons.Default.Sell, tercero.direccionCrypto)

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

            Divider()

            Row(
                modifier = Modifier.fillMaxWidth(),
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
                modifier = Modifier.fillMaxWidth(),
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
        Text(value, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun CuentaCard(
    cuenta: TerceroCuentaListItem,
    formatCurrency: (Double, String) -> String
) {
    Card {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
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
                AssistChip(
                    onClick = {},
                    label = { Text(cuenta.estado.lowercase().replaceFirstChar { it.uppercase() }) }
                )
            }

            if (cuenta.descripcion.isNotBlank()) {
                Text(cuenta.descripcion, style = MaterialTheme.typography.bodySmall)
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Monto original")
                Text(formatCurrency(cuenta.montoOriginal, cuenta.moneda), fontWeight = FontWeight.Medium)
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Pendiente")
                Text(formatCurrency(cuenta.montoPendiente, cuenta.moneda), fontWeight = FontWeight.Bold)
            }

            if (cuenta.fechaVencimiento.isNotBlank()) {
                Text(
                    text = "Vence: ${cuenta.fechaVencimiento}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
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
    var tipoEntidad by rememberSaveable { mutableStateOf(TipoEntidadTercero.PERSONA) }
    var isCliente by rememberSaveable { mutableStateOf(true) }
    var isProveedor by rememberSaveable { mutableStateOf(false) }
    var isEmpleado by rememberSaveable { mutableStateOf(false) }

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
                    TipoEntidadSelector(selected = tipoEntidad, onSelected = { tipoEntidad = it })
                }
                item {
                    RolesSelector(
                        isCliente = isCliente,
                        isProveedor = isProveedor,
                        isEmpleado = isEmpleado,
                        onClienteChange = { isCliente = it },
                        onProveedorChange = { isProveedor = it },
                        onEmpleadoChange = { isEmpleado = it }
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
                    val roles = buildSet {
                        if (isCliente) add(RolTercero.CLIENTE)
                        if (isProveedor) add(RolTercero.PROVEEDOR)
                        if (isEmpleado) add(RolTercero.EMPLEADO)
                        if (tipoEntidad == TipoEntidadTercero.ESTADO) add(RolTercero.ESTADO)
                    }
                    onConfirm(
                        nombre,
                        tipoEntidad,
                        roles,
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
                    SelectorChips(
                        title = "Tercero",
                        options = terceros.associate { it.id to it.nombre },
                        selected = terceroId,
                        onSelected = { terceroId = it }
                    )
                }
                item {
                    SelectorChips(
                        title = "Tipo",
                        options = linkedMapOf(
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
                    SelectorChips(
                        title = "Categoría",
                        options = linkedMapOf(
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
private fun TipoEntidadSelector(
    selected: String,
    onSelected: (String) -> Unit
) {
    SelectorChips(
        title = "Tipo de tercero",
        options = linkedMapOf(
            TipoEntidadTercero.PERSONA to "Persona",
            TipoEntidadTercero.EMPRESA to "Empresa",
            TipoEntidadTercero.ESTADO to "Estado"
        ),
        selected = selected,
        onSelected = onSelected
    )
}

@Composable
private fun RolesSelector(
    isCliente: Boolean,
    isProveedor: Boolean,
    isEmpleado: Boolean,
    onClienteChange: (Boolean) -> Unit,
    onProveedorChange: (Boolean) -> Unit,
    onEmpleadoChange: (Boolean) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Roles", style = MaterialTheme.typography.labelLarge)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            ToggleChip("Cliente", isCliente, onClienteChange)
            ToggleChip("Proveedor", isProveedor, onProveedorChange)
            ToggleChip("Empleado", isEmpleado, onEmpleadoChange)
        }
    }
}

@Composable
private fun ToggleChip(
    label: String,
    selected: Boolean,
    onChange: (Boolean) -> Unit
) {
    if (selected) {
        ElevatedAssistChip(onClick = { onChange(false) }, label = { Text(label) })
    } else {
        AssistChip(onClick = { onChange(true) }, label = { Text(label) })
    }
}

@Composable
private fun SelectorChips(
    title: String,
    options: Map<String, String>,
    selected: String,
    onSelected: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.labelLarge)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            options.forEach { (key, label) ->
                if (selected == key) {
                    ElevatedAssistChip(onClick = { onSelected(key) }, label = { Text(label) })
                } else {
                    AssistChip(onClick = { onSelected(key) }, label = { Text(label) })
                }
            }
        }
    }
}
