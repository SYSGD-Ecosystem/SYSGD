package cu.lazaroysr96.sysgdcont.ui.main.screens

/**
 * CatalogosScreen.kt
 *
 * Pantalla de catálogos (Cuentas / Productos).
 * Ahora solo orquesta — toda la lógica de UI de producto vive en:
 *   ui/components/producto/
 *     ├── ProductoImagenModel.kt   (modelo + helpers)
 *     ├── ProductoImagenUi.kt      (Avatar, Hero, paneles)
 *     ├── ProductoItem.kt          (card de lista + trailing slots)
 *     └── ProductoFormDialog.kt    (Add + Edit unificados)
 */

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.CuentaContable
import cu.lazaroysr96.sysgdcont.data.model.NaturalezaCuenta
import cu.lazaroysr96.sysgdcont.data.model.TipoCuenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.viewmodel.InventarioViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel
import cu.lazaroysr96.sysgdcont.ui.components.producto.ProductoFormDialog
import cu.lazaroysr96.sysgdcont.ui.components.producto.ProductoItem

private data class CuentaTreeNode(
    val cuenta: CuentaContable,
    val children: List<CuentaTreeNode> = emptyList()
)

// ─────────────────────────────────────────────────────────────────────────────
// CatalogosScreen
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CatalogosScreen(
    onNavigateBack: () -> Unit,
    inventarioViewModel: InventarioViewModel,
    ledgerViewModel: LedgerViewModel
) {
    var selectedTab    by remember { mutableStateOf(0) }
    val productosState by inventarioViewModel.uiState.collectAsStateWithLifecycle()
    val ledgerState    by ledgerViewModel.uiState.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = selectedTab) {
            listOf("Cuentas", "Productos").forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick  = { selectedTab = index },
                    text     = { Text(title) },
                    icon     = {
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
                cuentas          = ledgerState.cuentasContables,
                saldoPorCuentaId = ledgerState.saldoPorCuentaId,
                onAddCuenta      = ledgerViewModel::crearCuentaContable
            )
            1 -> ProductosTab(
                productos     = productosState.productosBase,
                onAddProduct  = inventarioViewModel::agregarProductoBase,
                onEditProduct = inventarioViewModel::actualizarProductoBase
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductosTab
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun ProductosTab(
    productos: List<Producto>,
    onAddProduct:  (nombre: String, imagenJson: String, unidad: String) -> Unit,
    onEditProduct: (id: String, nombre: String, imagenJson: String, unidad: String) -> Unit
) {
    var productoEditando by remember { mutableStateOf<Producto?>(null) }
    var showAddDialog    by remember { mutableStateOf(false) }
    var searchQuery      by remember { mutableStateOf("") }

    val filteredProducts = remember(productos, searchQuery) {
        if (searchQuery.isBlank()) productos
        else productos.filter { it.nombre.contains(searchQuery, ignoreCase = true) }
    }

    Column(modifier = Modifier.fillMaxSize()) {

        // Barra búsqueda + botón añadir
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment     = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value         = searchQuery,
                onValueChange = { searchQuery = it },
                label         = { Text("Buscar") },
                leadingIcon   = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine    = true,
                modifier      = Modifier.weight(1f)
            )
            FilledTonalIconButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Agregar producto")
            }
        }

        if (filteredProducts.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text  = if (searchQuery.isBlank()) "No hay productos registrados."
                            else "No se encontraron productos.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            LazyColumn(
                modifier        = Modifier.fillMaxSize(),
                contentPadding  = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredProducts, key = { it.id }) { producto ->
                    // ← ProductoItem genérico, sin trailing = icono editar por defecto
                    ProductoItem(
                        producto = producto,
                        onClick  = { productoEditando = producto }
                    )
                }
            }
        }
    }

    // Diálogo agregar
    if (showAddDialog) {
        ProductoFormDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { nombre, imagenJson, unidad ->
                onAddProduct(nombre, imagenJson, unidad)
                showAddDialog = false
            }
        )
    }

    // Diálogo editar — se activa cuando productoEditando != null
    productoEditando?.let { p ->
        ProductoFormDialog(
            producto  = p,
            onDismiss = { productoEditando = null },
            onConfirm = { nombre, imagenJson, unidad ->
                onEditProduct(p.id, nombre, imagenJson, unidad)
                productoEditando = null
            }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CuentasTab — sin cambios respecto al original
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun CuentasTab(
    cuentas: List<CuentaContable>,
    saldoPorCuentaId: Map<String, Double>,
    onAddCuenta: (codigo: String, nombre: String, naturaleza: String, tipo: String) -> Unit
) {
    var showAddDialog      by remember { mutableStateOf(false) }
    var search             by remember { mutableStateOf("") }
    var expandedAccountIds by remember { mutableStateOf(setOf<String>()) }
    val cuentasFiltradas   = remember(cuentas, search) { buildCuentaTree(cuentas, search) }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment     = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value         = search,
                onValueChange = { search = it },
                label         = { Text("Buscar") },
                leadingIcon   = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine    = true,
                modifier      = Modifier.weight(1f)
            )
            FilledTonalIconButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Agregar cuenta")
            }
        }

        LazyColumn(
            modifier        = Modifier.fillMaxSize(),
            contentPadding  = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                Text(
                    "Cuentas Contables",
                    style    = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
            if (cuentasFiltradas.isEmpty()) {
                item {
                    Text(
                        text  = if (cuentas.isEmpty()) "No hay cuentas registradas."
                                else "No hay resultados para esa búsqueda.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                items(cuentasFiltradas, key = { it.cuenta.id }) { node ->
                    CuentaTreeCard(
                        node             = node,
                        saldoPorCuentaId = saldoPorCuentaId,
                        expandedIds      = expandedAccountIds,
                        onToggle         = { id ->
                            expandedAccountIds = if (id in expandedAccountIds)
                                expandedAccountIds - id else expandedAccountIds + id
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

// ─────────────────────────────────────────────────────────────────────────────
// Árbol de cuentas — helpers
// ─────────────────────────────────────────────────────────────────────────────

private fun buildCuentaTree(cuentas: List<CuentaContable>, search: String): List<CuentaTreeNode> {
    val ordenadas        = cuentas.sortedWith(compareBy<CuentaContable> { it.codigo }.thenBy { it.nombre })
    val childrenByParent = ordenadas.filter { !it.padreId.isNullOrBlank() }.groupBy { it.padreId!! }

    fun buildNode(cuenta: CuentaContable): CuentaTreeNode =
        CuentaTreeNode(cuenta, childrenByParent[cuenta.id].orEmpty().map(::buildNode))

    val roots = ordenadas
        .filter { c -> c.padreId.isNullOrBlank() || ordenadas.none { it.id == c.padreId } }
        .map(::buildNode)

    val query = search.trim().lowercase()
    if (query.isBlank()) return roots

    fun filterNode(node: CuentaTreeNode): CuentaTreeNode? {
        val filteredChildren = node.children.mapNotNull(::filterNode)
        val selfMatches = node.cuenta.codigo.lowercase().contains(query) ||
                          node.cuenta.nombre.lowercase().contains(query)
        return if (selfMatches || filteredChildren.isNotEmpty()) node.copy(children = filteredChildren) else null
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
    val cuenta      = node.cuenta
    val hasChildren = node.children.isNotEmpty()
    val isExpanded  = cuenta.id in expandedIds

    Card(modifier = Modifier.fillMaxWidth().padding(start = (level * 12).dp)) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth()
                    .then(if (hasChildren) Modifier.clickable { onToggle(cuenta.id) } else Modifier),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment     = Alignment.CenterVertically
            ) {
                Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (hasChildren) Icon(if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(cuenta.codigo, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                        Text(cuenta.nombre, style = MaterialTheme.typography.titleMedium)
                    }
                }
                Text(TipoCuenta.label(cuenta.tipo), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text("Naturaleza ${NaturalezaCuenta.label(cuenta.naturaleza)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Divider()
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(if (hasChildren) "Saldo acumulado" else "Saldo", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(String.format("%.2f CUP", saldoPorCuentaId[cuenta.id] ?: 0.0), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
            }
        }
    }

    if (hasChildren && isExpanded) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            node.children.forEach { child ->
                CuentaTreeCard(child, saldoPorCuentaId, expandedIds, onToggle, level + 1)
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// AddCuentaDialog — sin cambios
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddCuentaDialog(
    onDismiss: () -> Unit,
    onConfirm: (codigo: String, nombre: String, naturaleza: String, tipo: String) -> Unit
) {
    var codigo             by remember { mutableStateOf("") }
    var nombre             by remember { mutableStateOf("") }
    var naturaleza         by remember { mutableStateOf("ACREEDORA") }
    var tipo               by remember { mutableStateOf("INGRESO") }
    var expandedNaturaleza by remember { mutableStateOf(false) }
    var expandedTipo       by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nueva Cuenta Contable") },
        text  = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(value = codigo, onValueChange = { codigo = it }, label = { Text("Código") }, placeholder = { Text("Ej: 4.1.01") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = nombre, onValueChange = { nombre = it }, label = { Text("Nombre") }, placeholder = { Text("Ej: Ventas por servicios") }, singleLine = true, modifier = Modifier.fillMaxWidth())

                ExposedDropdownMenuBox(expanded = expandedNaturaleza, onExpandedChange = { expandedNaturaleza = !expandedNaturaleza }) {
                    OutlinedTextField(value = naturaleza, onValueChange = {}, readOnly = true, label = { Text("Naturaleza") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedNaturaleza) }, modifier = Modifier.menuAnchor().fillMaxWidth())
                    ExposedDropdownMenu(expanded = expandedNaturaleza, onDismissRequest = { expandedNaturaleza = false }) {
                        listOf("ACREEDORA", "DEUDORA").forEach { nat ->
                            DropdownMenuItem(text = { Text(if (nat == "ACREEDORA") "Acreedora" else "Deudora") }, onClick = { naturaleza = nat; expandedNaturaleza = false })
                        }
                    }
                }

                ExposedDropdownMenuBox(expanded = expandedTipo, onExpandedChange = { expandedTipo = !expandedTipo }) {
                    OutlinedTextField(value = tipo, onValueChange = {}, readOnly = true, label = { Text("Tipo") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedTipo) }, modifier = Modifier.menuAnchor().fillMaxWidth())
                    ExposedDropdownMenu(expanded = expandedTipo, onDismissRequest = { expandedTipo = false }) {
                        listOf("ACTIVO", "PASIVO", "PATRIMONIO", "INGRESO", "GASTO").forEach { t ->
                            DropdownMenuItem(text = { Text(t) }, onClick = { tipo = t; expandedTipo = false })
                        }
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = { onConfirm(codigo, nombre, naturaleza, tipo) }, enabled = codigo.isNotBlank() && nombre.isNotBlank()) { Text("Guardar") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}