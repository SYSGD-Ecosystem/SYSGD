package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.model.Venta
import cu.lazaroysr96.sysgdcont.viewmodel.InventarioViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventarioScreen(viewModel: InventarioViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.snackbarMessage) {
        uiState.snackbarMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearSnackbar()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            Column {
                if (uiState.cart.isNotEmpty()) {
                    FloatingActionButton(
                        onClick = { viewModel.showSaleSheet(true) },
                        containerColor = MaterialTheme.colorScheme.primary
                    ) {
                        BadgedBox(
                            badge = { Badge { Text(viewModel.cartItemCount.toString()) } }
                        ) {
                            Icon(Icons.Default.ShoppingCart, "Carrito")
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
                FloatingActionButton(
                    onClick = { viewModel.showCatalog(true) },
                    containerColor = MaterialTheme.colorScheme.secondary
                ) {
                    Icon(Icons.Default.Add, "Agregar producto")
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Text(
                "Punto de Venta",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
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
                            "Ventas de hoy",
                            style = MaterialTheme.typography.labelMedium
                        )
                        Text(
                            "${uiState.ventasHoy.size} transacciones",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                    Text(
                        "%.2f CUP".format(uiState.totalHoy),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                "Productos disponibles",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            Spacer(modifier = Modifier.height(8.dp))

            if (uiState.productos.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("📦", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "No hay productos",
                            style = MaterialTheme.typography.bodyLarge
                        )
                        Text(
                            "Toca + para agregar",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.productos) { producto ->
                        ProductCard(
                            producto = producto,
                            onClick = { viewModel.addToCart(producto) }
                        )
                    }
                }
            }
        }

        if (uiState.showCatalog) {
            ProductCatalogSheet(
                productos = uiState.productos,
                onAdd = { nombre, precio, emoji, unidad ->
                    viewModel.agregarProducto(nombre, precio, emoji, unidad)
                },
                onEliminar = viewModel::eliminarProducto,
                onDismiss = { viewModel.showCatalog(false) }
            )
        }

        if (uiState.showSaleSheet) {
            CartSheet(
                cart = uiState.cart,
                total = viewModel.cartTotal,
                onAdd = viewModel::addToCart,
                onRemove = viewModel::removeFromCart,
                onRegistrar = viewModel::registrarVenta,
                onDismiss = { viewModel.showSaleSheet(false) }
            )
        }
    }
}

@Composable
private fun ProductCard(
    producto: Producto,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(producto.emoji, fontSize = 32.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                producto.nombre,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                maxLines = 1
            )
            Text(
                "%.2f CUP / %s".format(producto.precio, producto.unidad),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductCatalogSheet(
    productos: List<Producto>,
    onAdd: (String, Double, String, String) -> Unit,
    onEliminar: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Mis productos",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                IconButton(onClick = { showAddDialog = true }) {
                    Icon(Icons.Default.Add, "Agregar")
                }
            }

            Divider(modifier = Modifier.padding(vertical = 8.dp))

            if (productos.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No hay productos aún")
                }
            } else {
                LazyColumn(
                    modifier = Modifier.heightIn(max = 400.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(productos) { producto ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(producto.emoji, fontSize = 24.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        producto.nombre,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Text(
                                        "%.2f CUP".format(producto.precio),
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                            }
                            IconButton(onClick = { onEliminar(producto.id) }) {
                                Icon(
                                    Icons.Default.Delete,
                                    "Eliminar",
                                    tint = MaterialTheme.colorScheme.error
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AddProductDialog(
            onDismiss = { showAddDialog = false },
            onAdd = onAdd
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddProductDialog(
    onDismiss: () -> Unit,
    onAdd: (String, Double, String, String) -> Unit
) {
    var nombre by remember { mutableStateOf("") }
    var precio by remember { mutableStateOf("") }
    var emoji by remember { mutableStateOf("📦") }
    var unidad by remember { mutableStateOf("und") }

    val unidades = listOf("und", "kg", "g", "litro", "ml", "docena", "paquete", "caja", "bolsa", "par")
    var unitExpanded by remember { mutableStateOf(false) }

    val puedeAgregar = nombre.isNotBlank() && precio.toDoubleOrNull() != null && (precio.toDoubleOrNull() ?: 0.0) > 0

    val emojis = listOf(
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

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nuevo producto") },
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

                OutlinedTextField(
                    value = precio,
                    onValueChange = { precio = it },
                    label = { Text("Precio (CUP)") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true
                )

                Text("Emoji:", style = MaterialTheme.typography.bodyMedium)

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

                Text("Unidad:", style = MaterialTheme.typography.bodyMedium)

                ExposedDropdownMenuBox(
                    expanded = unitExpanded,
                    onExpandedChange = { unitExpanded = it }
                ) {
                    OutlinedTextField(
                        value = unidad,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Seleccionar") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(unitExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = unitExpanded,
                        onDismissRequest = { unitExpanded = false }
                    ) {
                        unidades.forEach { u ->
                            DropdownMenuItem(
                                text = { Text(u) },
                                onClick = {
                                    unidad = u
                                    unitExpanded = false
                                }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onAdd(nombre.trim(), precio.toDouble(), emoji, unidad)
                    onDismiss()
                },
                enabled = puedeAgregar
            ) {
                Text("Agregar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CartSheet(
    cart: Map<Producto, Int>,
    total: Double,
    onAdd: (Producto) -> Unit,
    onRemove: (Producto) -> Unit,
    onRegistrar: () -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                "Carrito de venta",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            Divider(modifier = Modifier.padding(vertical = 8.dp))

            if (cart.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("El carrito está vacío")
                }
            } else {
                LazyColumn(
                    modifier = Modifier.heightIn(max = 300.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(cart.entries.toList()) { (producto, cantidad) ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(producto.nombre, fontWeight = FontWeight.Medium)
                                Text(
                                    "%.2f CUP x %d".format(producto.precio, cantidad),
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(onClick = { onRemove(producto) }) {
                                    Icon(Icons.Default.Remove, "Quitar")
                                }
                                Text(
                                    cantidad.toString(),
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                )
                                IconButton(onClick = { onAdd(producto) }) {
                                    Icon(Icons.Default.Add, "Agregar")
                                }
                            }
                        }
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        "Total",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "%.2f CUP".format(total),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onRegistrar,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = cart.isNotEmpty()
                ) {
                    Icon(Icons.Default.Check, null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Registrar venta")
                }
            }
        }
    }
}
