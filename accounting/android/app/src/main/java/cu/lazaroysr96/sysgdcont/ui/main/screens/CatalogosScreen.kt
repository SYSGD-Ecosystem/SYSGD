package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.CuentaContable
import cu.lazaroysr96.sysgdcont.data.model.NaturalezaCuenta
import cu.lazaroysr96.sysgdcont.data.model.TipoCuenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.viewmodel.InventarioViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel

private data class CuentaTreeNode(
    val cuenta: CuentaContable,
    val children: List<CuentaTreeNode> = emptyList()
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CatalogosScreen(
    onNavigateBack: () -> Unit,
    inventarioViewModel: InventarioViewModel,
    ledgerViewModel: LedgerViewModel
) {
    var selectedTab by remember { mutableStateOf(1) } // Default to Products
    val tabs = listOf("Cuentas", "Productos")
    val productosState by inventarioViewModel.uiState.collectAsStateWithLifecycle()
    val ledgerState by ledgerViewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        TabRow(selectedTabIndex = selectedTab) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = { Text(title) },
                    icon = {
                        Icon(
                            if (index == 0) Icons.Default.AccountBalance else Icons.Default.Inventory2,
                            contentDescription = null
                        )
                    }
                )
            }
        }

        when (selectedTab) {
            0 -> CuentasTab(
                cuentas = ledgerState.cuentasContables,
                saldoPorCuentaId = ledgerState.saldoPorCuentaId,
                onAddCuenta = ledgerViewModel::crearCuentaContable
            )
            1 -> ProductosTab(
                productos = productosState.productosBase,
                onAddProduct = { nombre, emoji, unidad ->
                    inventarioViewModel.agregarProductoBase(nombre, emoji, unidad)
                },
                onEditProduct = { id, nombre, emoji, unidad ->
                    inventarioViewModel.actualizarProductoBase(id, nombre, emoji, unidad)
                }
            )
        }
    }
}

@Composable
private fun CuentasTab(
    cuentas: List<CuentaContable>,
    saldoPorCuentaId: Map<String, Double>,
    onAddCuenta: (codigo: String, nombre: String, naturaleza: String, tipo: String) -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var search by remember { mutableStateOf("") }
    var expandedAccountIds by remember { mutableStateOf(setOf<String>()) }
    val cuentasFiltradas = remember(cuentas, search) {
        buildCuentaTree(cuentas, search)
    }
    
    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                label = { Text("Buscar") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier.weight(1f),
                singleLine = true
            )
            Spacer(modifier = Modifier.width(8.dp))
            FilledTonalIconButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Agregar cuenta")
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                Text(
                    "Cuentas Contables",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
            if (cuentasFiltradas.isEmpty()) {
                item {
                    Text(
                        if (cuentas.isEmpty()) {
                            "No hay cuentas registradas. Agrega tu primera cuenta contable."
                        } else {
                            "No hay resultados para esa búsqueda."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                items(cuentasFiltradas, key = { it.cuenta.id }) { node ->
                    CuentaTreeCard(
                        node = node,
                        saldoPorCuentaId = saldoPorCuentaId,
                        expandedIds = expandedAccountIds,
                        onToggle = { cuentaId ->
                            expandedAccountIds = if (cuentaId in expandedAccountIds) {
                                expandedAccountIds - cuentaId
                            } else {
                                expandedAccountIds + cuentaId
                            }
                        }
                    )
                }
            }
        }
    }

    if (showAddDialog) {
        AddCuentaDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { codigo, nombre, naturaleza, tipo ->
                onAddCuenta(codigo, nombre, naturaleza, tipo)
                showAddDialog = false
            }
        )
    }
}

private fun buildCuentaTree(
    cuentas: List<CuentaContable>,
    search: String
): List<CuentaTreeNode> {
    val cuentasOrdenadas = cuentas.sortedWith(compareBy<CuentaContable> { it.codigo }.thenBy { it.nombre })
    val childrenByParent = cuentasOrdenadas
        .filter { !it.padreId.isNullOrBlank() }
        .groupBy { it.padreId!! }

    fun buildNode(cuenta: CuentaContable): CuentaTreeNode {
        val children = childrenByParent[cuenta.id].orEmpty().map(::buildNode)
        return CuentaTreeNode(cuenta = cuenta, children = children)
    }

    val roots = cuentasOrdenadas
        .filter { cuenta -> cuenta.padreId.isNullOrBlank() || cuentasOrdenadas.none { it.id == cuenta.padreId } }
        .map(::buildNode)

    val query = search.trim().lowercase()
    if (query.isBlank()) return roots

    fun filterNode(node: CuentaTreeNode): CuentaTreeNode? {
        val filteredChildren = node.children.mapNotNull(::filterNode)
        val selfMatches = node.cuenta.codigo.lowercase().contains(query) ||
            node.cuenta.nombre.lowercase().contains(query)
        return if (selfMatches || filteredChildren.isNotEmpty()) {
            node.copy(children = filteredChildren)
        } else {
            null
        }
    }

    return roots.mapNotNull(::filterNode)
}

@Composable
private fun CuentaTreeCard(
    node: CuentaTreeNode,
    saldoPorCuentaId: Map<String, Double>,
    expandedIds: Set<String>,
    onToggle: (String) -> Unit,
    level: Int = 0
) {
    val cuenta = node.cuenta
    val hasChildren = node.children.isNotEmpty()
    val isExpanded = cuenta.id in expandedIds

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = (level * 12).dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .then(
                        if (hasChildren) Modifier.clickable { onToggle(cuenta.id) } else Modifier
                    ),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (hasChildren) {
                        Icon(
                            if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = null
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            cuenta.codigo,
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            cuenta.nombre,
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                }
                Text(
                    TipoCuenta.label(cuenta.tipo),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text(
                "Naturaleza ${NaturalezaCuenta.label(cuenta.naturaleza)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Divider()
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    if (hasChildren) "Saldo acumulado" else "Saldo",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    String.format("%.2f CUP", saldoPorCuentaId[cuenta.id] ?: 0.0),
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }

    if (hasChildren && isExpanded) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            node.children.forEach { child ->
                CuentaTreeCard(
                    node = child,
                    saldoPorCuentaId = saldoPorCuentaId,
                    expandedIds = expandedIds,
                    onToggle = onToggle,
                    level = level + 1
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddCuentaDialog(
    onDismiss: () -> Unit,
    onConfirm: (codigo: String, nombre: String, naturaleza: String, tipo: String) -> Unit
) {
    var codigo by remember { mutableStateOf("") }
    var nombre by remember { mutableStateOf("") }
    var naturaleza by remember { mutableStateOf("ACREEDORA") }
    var tipo by remember { mutableStateOf("INGRESO") }
    var expandedNaturaleza by remember { mutableStateOf(false) }
    var expandedTipo by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nueva Cuenta Contable") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = codigo,
                    onValueChange = { codigo = it },
                    label = { Text("Código") },
                    placeholder = { Text("Ej: 4.1.01") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = nombre,
                    onValueChange = { nombre = it },
                    label = { Text("Nombre") },
                    placeholder = { Text("Ej: Ventas por servicios") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                
                ExposedDropdownMenuBox(
                    expanded = expandedNaturaleza,
                    onExpandedChange = { expandedNaturaleza = !expandedNaturaleza }
                ) {
                    OutlinedTextField(
                        value = naturaleza,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Naturaleza") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedNaturaleza) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedNaturaleza,
                        onDismissRequest = { expandedNaturaleza = false }
                    ) {
                        listOf("ACREEDORA", "DEUDORA").forEach { nat ->
                            DropdownMenuItem(
                                text = { Text(if (nat == "ACREEDORA") "Acreedora" else "Deudora") },
                                onClick = {
                                    naturaleza = nat
                                    expandedNaturaleza = false
                                }
                            )
                        }
                    }
                }

                ExposedDropdownMenuBox(
                    expanded = expandedTipo,
                    onExpandedChange = { expandedTipo = !expandedTipo }
                ) {
                    OutlinedTextField(
                        value = tipo,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Tipo") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedTipo) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedTipo,
                        onDismissRequest = { expandedTipo = false }
                    ) {
                        listOf("ACTIVO", "PASIVO", "PATRIMONIO", "INGRESO", "GASTO").forEach { t ->
                            DropdownMenuItem(
                                text = { Text(t) },
                                onClick = {
                                    tipo = t
                                    expandedTipo = false
                                }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(codigo, nombre, naturaleza, tipo) },
                enabled = codigo.isNotBlank() && nombre.isNotBlank()
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
private fun EditProductoDialog(
    producto: Producto,
    onDismiss: () -> Unit,
    onConfirm: (nombre: String, emoji: String, unidad: String) -> Unit
) {
    var nombre by remember { mutableStateOf(producto.nombre) }
    var emoji by remember { mutableStateOf(producto.emoji) }
    var unidad by remember { mutableStateOf(producto.unidad) }

    val defaultEmojis = listOf(
        "📦", "🍔", "☕", "🥤", "🍟", "🍕", "🎁", "🥪", "🌮", "🍜",
        "🍰", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "🍮", "🍯", "🥛",
        "🧃", "🧉", "🍺", "🍻", "🥂", "🥃", "🫗", "🥤", "🧋", "🍵",
        "👕", "👖", "👗", "👘", "👙", "👚", "👛", "👜", "👝", "🎒",
        "👞", "👟", "👠", "👡", "👢", "👑", "👒", "🎩", "🎓", "⛑️",
        "📱", "💻", "⌨️", "🖱️", "🖨️", "📷", "📹", "🎥", "📞", "☎️",
        "📺", "📻", "🎙️", "🎚️", "🎛️", "⏰", "⌚", "📡", "🔋", "💡",
        "🧹", "🧺", "🧻", "🧼", "🪥", "🪒", "🧽", "🪣", "🧴", "🛎️",
        "🔑", "🗝️", "🔒", "🔓", "📁", "📂", "🗂️", "📅", "📆", "📇",
        "✏️", "🖊️", "🖋️", "📌", "📍", "✂️", "🗃️", "🗄️", "📎", "📏"
    )
    val emojis = remember { mutableStateListOf<String>().apply { addAll(defaultEmojis) } }
    var showCustomEmojiDialog by remember { mutableStateOf(false) }
    var customEmojiInput by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Editar producto") },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = nombre,
                    onValueChange = { nombre = it },
                    label = { Text("Nombre") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Emoji:", style = MaterialTheme.typography.bodyMedium)
                    Text(
                        "Añadir emoji",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.clickable { showCustomEmojiDialog = true }
                    )
                }

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(emojis) { e ->
                        Text(
                            e,
                            fontSize = 24.sp,
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { emoji = e }
                                .background(
                                    if (emoji == e) MaterialTheme.colorScheme.primaryContainer
                                    else MaterialTheme.colorScheme.surface
                                )
                                .padding(8.dp)
                        )
                    }
                }

                OutlinedTextField(
                    value = unidad,
                    onValueChange = { unidad = it },
                    label = { Text("Unidad") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(nombre.trim(), emoji, unidad) },
                enabled = nombre.isNotBlank()
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

    if (showCustomEmojiDialog) {
        AlertDialog(
            onDismissRequest = {
                showCustomEmojiDialog = false
                customEmojiInput = ""
            },
            title = { Text("Agregar emoji") },
            text = {
                OutlinedTextField(
                    value = customEmojiInput,
                    onValueChange = { customEmojiInput = it },
                    label = { Text("Pega o escribe el emoji") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val nuevo = customEmojiInput.trim()
                        if (nuevo.isNotEmpty() && !emojis.contains(nuevo)) {
                            emojis.add(0, nuevo)
                        }
                        if (nuevo.isNotEmpty()) {
                            emoji = nuevo
                        }
                        customEmojiInput = ""
                        showCustomEmojiDialog = false
                    },
                    enabled = customEmojiInput.trim().isNotEmpty()
                ) {
                    Text("Añadir")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showCustomEmojiDialog = false
                        customEmojiInput = ""
                    }
                ) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
private fun ProductosTab(
    productos: List<Producto>,
    onAddProduct: (nombre: String, emoji: String, unidad: String) -> Unit,
    onEditProduct: (id: String, nombre: String, emoji: String, unidad: String) -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var productoEditando by remember { mutableStateOf<Producto?>(null) }
    var searchQuery by remember { mutableStateOf("") }

    val filteredProducts = productos.filter { 
        searchQuery.isBlank() || it.nombre.contains(searchQuery, ignoreCase = true)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Buscar") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier.weight(1f),
                singleLine = true
            )
            Spacer(modifier = Modifier.width(8.dp))
            FilledTonalIconButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Agregar producto")
            }
        }

        if (filteredProducts.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    if (searchQuery.isBlank()) "No hay productos registrados." 
                    else "No se encontraron productos.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredProducts, key = { it.id }) { producto ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                productoEditando = producto
                                showEditDialog = true
                            }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = producto.emoji,
                                style = MaterialTheme.typography.headlineMedium
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = producto.nombre,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = "Unidad: ${producto.unidad}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Icon(
                                Icons.Default.Edit,
                                contentDescription = "Editar",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AddProductoDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { nombre, emoji, unidad ->
                onAddProduct(nombre, emoji, unidad)
                showAddDialog = false
            }
        )
    }

    if (showEditDialog) {
        val p = productoEditando
        if (p != null) {
            EditProductoDialog(
                producto = p,
                onDismiss = {
                    showEditDialog = false
                    productoEditando = null
                },
                onConfirm = { nombre, emoji, unidad ->
                    onEditProduct(p.id, nombre, emoji, unidad)
                    showEditDialog = false
                    productoEditando = null
                }
            )
        } else {
            showEditDialog = false
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddProductoDialog(
    onDismiss: () -> Unit,
    onConfirm: (nombre: String, emoji: String, unidad: String) -> Unit
) {
    var nombre by remember { mutableStateOf("") }
    var emoji by remember { mutableStateOf("📦") }
    var unidad by remember { mutableStateOf("und") }

    val defaultEmojis = listOf(
        "📦", "🍔", "☕", "🥤", "🍟", "🍕", "🎁", "🥪", "🌮", "🍜",
        "🍰", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "🍮", "🍯", "🥛",
        "🧃", "🧉", "🍺", "🍻", "🥂", "🥃", "🫗", "🥤", "🧋", "🍵",
        "👕", "👖", "👗", "👘", "👙", "👚", "👛", "👜", "👝", "🎒",
        "👞", "👟", "👠", "👡", "👢", "👑", "👒", "🎩", "🎓", "⛑️",
        "📱", "💻", "⌨️", "🖱️", "🖨️", "📷", "📹", "🎥", "📞", "☎️",
        "📺", "📻", "🎙️", "🎚️", "🎛️", "⏰", "⌚", "📡", "🔋", "💡",
        "🧹", "🧺", "🧻", "🧼", "🪥", "🪒", "🧽", "🪣", "🧴", "🛎️",
        "🔑", "🗝️", "🔒", "🔓", "📁", "📂", "🗂️", "📅", "📆", "📇",
        "✏️", "🖊️", "🖋️", "📌", "📍", "✂️", "🗃️", "🗄️", "📎", "📏"
    )
    val emojis = remember { mutableStateListOf<String>().apply { addAll(defaultEmojis) } }
    var showCustomEmojiDialog by remember { mutableStateOf(false) }
    var customEmojiInput by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nuevo Producto") },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = nombre,
                    onValueChange = { nombre = it },
                    label = { Text("Nombre") },
                    placeholder = { Text("Ej: Pan francés") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Emoji:", style = MaterialTheme.typography.bodyMedium)
                    Text(
                        "Añadir emoji",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.clickable { showCustomEmojiDialog = true }
                    )
                }

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(emojis) { e ->
                        Text(
                            e,
                            fontSize = 24.sp,
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .clickable { emoji = e }
                                .background(
                                    if (emoji == e) MaterialTheme.colorScheme.primaryContainer
                                    else MaterialTheme.colorScheme.surface
                                )
                                .padding(8.dp)
                        )
                    }
                }

                OutlinedTextField(
                    value = unidad,
                    onValueChange = { unidad = it },
                    label = { Text("Unidad") },
                    placeholder = { Text("und, kg, lt, etc.") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(nombre, emoji, unidad) },
                enabled = nombre.isNotBlank()
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
