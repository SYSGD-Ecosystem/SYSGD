package cu.lazaroysr96.sysgdcont.ui.main.screens

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.*
import cu.lazaroysr96.sysgdcont.viewmodel.InventarioViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.FacturaViewModel
// ─── Nuevos imports de componentes unificados ─────────────────────────────────
import cu.lazaroysr96.sysgdcont.ui.components.producto.CatalogoItemRow
import cu.lazaroysr96.sysgdcont.ui.components.producto.InventarioItemAvatar
import cu.lazaroysr96.sysgdcont.ui.components.producto.ProductGridCard
import cu.lazaroysr96.sysgdcont.ui.components.producto.ProductSelectorGrid
import cu.lazaroysr96.sysgdcont.ui.components.producto.ProductoBaseItem
import cu.lazaroysr96.sysgdcont.ui.components.producto.ProductoFormDialog
import cu.lazaroysr96.sysgdcont.ui.components.producto.ProductoImagenAvatar
import cu.lazaroysr96.sysgdcont.ui.components.producto.toBaseItem
// ─────────────────────────────────────────────────────────────────────────────
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.YearMonth
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

// ─────────────────────────────────────────────────────────────────────────────
// InventarioScreen
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventarioScreen(
    viewModel: InventarioViewModel,
    facturaViewModel: FacturaViewModel,
    canUseProFeatures: Boolean,
    canGenerateInvoices: Boolean,
) {
    val uiState      by viewModel.uiState.collectAsStateWithLifecycle()
    val facturaState by facturaViewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current

    LaunchedEffect(uiState.snackbarMessage) {
        uiState.snackbarMessage?.let { snackbarHostState.showSnackbar(it); viewModel.clearSnackbar() }
    }
    LaunchedEffect(facturaState.snackbarMessage) {
        facturaState.snackbarMessage?.let { snackbarHostState.showSnackbar(it); facturaViewModel.clearSnackbar() }
    }
    LaunchedEffect(facturaState.pdfIntent) {
        facturaState.pdfIntent?.let { runCatching { context.startActivity(it) }; facturaViewModel.clearPdfIntent() }
    }
    LaunchedEffect(canUseProFeatures, uiState.currentTab) {
        if (!canUseProFeatures && uiState.currentTab == 3) viewModel.setCurrentTab(0)
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(selected = uiState.currentTab == 0, onClick = { viewModel.setCurrentTab(0) }, icon = { Icon(Icons.Default.PointOfSale, "Vender") }, label = { Text("Venta") })
                NavigationBarItem(selected = uiState.currentTab == 1, onClick = { viewModel.setCurrentTab(1) }, icon = { Icon(Icons.Default.ShoppingCart, "Comprar") }, label = { Text("Compra") })
                if (canUseProFeatures) NavigationBarItem(selected = uiState.currentTab == 3, onClick = { viewModel.setCurrentTab(3) }, icon = { Icon(Icons.Default.List, "Inventario") }, label = { Text("Almacén") })
                NavigationBarItem(selected = uiState.currentTab == 2, onClick = { viewModel.setCurrentTab(2) }, icon = { Icon(Icons.Default.History, "Historial") }, label = { Text("Historial") })
                NavigationBarItem(selected = uiState.currentTab == 4, onClick = { viewModel.setCurrentTab(4) }, icon = { Icon(Icons.Default.MoreHoriz, "Más") }, label = { Text("Más") })
            }
        },
        floatingActionButton = {
            Column {
                if (uiState.currentTab == 0 && uiState.cart.isNotEmpty()) {
                    FloatingActionButton(onClick = { viewModel.showSaleSheet(true) }, containerColor = MaterialTheme.colorScheme.primary) {
                        BadgedBox(badge = { Badge { Text(viewModel.cartItemCount.toString()) } }) { Icon(Icons.Default.ShoppingCart, "Carrito") }
                    }
                    Spacer(Modifier.height(8.dp))
                }
                if (uiState.currentTab == 1 && uiState.cartCompra.isNotEmpty()) {
                    FloatingActionButton(onClick = { viewModel.showPurchaseSheet(true) }, containerColor = MaterialTheme.colorScheme.secondary) {
                        BadgedBox(badge = { Badge { Text(viewModel.cartCompraItemCount.toString()) } }) { Icon(Icons.Default.ShoppingCart, "Carrito") }
                    }
                    Spacer(Modifier.height(8.dp))
                }
                if (uiState.currentTab == 0) FloatingActionButton(onClick = { viewModel.showCatalog(true) }, containerColor = MaterialTheme.colorScheme.tertiary) { Icon(Icons.Default.Add, "Agregar producto") }
                if (uiState.currentTab == 1) FloatingActionButton(onClick = { viewModel.showCatalogCompra(true) }, containerColor = MaterialTheme.colorScheme.tertiary) { Icon(Icons.Default.Add, "Agregar insumo") }
            }
        }
    ) { padding ->
        when (uiState.currentTab) {
            0 -> PuntoVentaContent(viewModel, padding)
            1 -> PuntoCompraContent(viewModel, padding)
            3 -> if (canUseProFeatures) InventarioContent(viewModel, padding)
            2 -> HistorialContent(viewModel, facturaViewModel, padding, canGenerateInvoices)
            4 -> MasContent(viewModel, padding)
        }
    }

    if (uiState.showCatalog) {
        ProductCatalogSheet(
            productosBase = uiState.productosBase,
            productos     = uiState.productos,
            onAdd         = viewModel::agregarProductoExistenteAVentas,
            onEditPrice   = viewModel::actualizarPrecioProductoVenta,
            onCreateNewProduct = viewModel::agregarProductoBase,
            onEliminar    = viewModel::eliminarProducto,
            onDismiss     = { viewModel.showCatalog(false) }
        )
    }
    if (uiState.showSaleSheet) {
        CartSheet(
            cart = uiState.cart,
            total = viewModel.cartTotal,
            onAdd = viewModel::addToCart,
            onRemove = viewModel::removeFromCart,
            onEditQuantity = viewModel::setCartCantidad,
            onRegistrar = viewModel::registrarVenta,
            onDismiss = { viewModel.showSaleSheet(false) }
        )
    }
    if (uiState.showCatalogCompra) {
        ProductCatalogCompraSheet(
            productosBase = uiState.productosBase,
            productos     = uiState.productosCompra,
            onAdd         = viewModel::agregarProductoExistenteACompras,
            onEditPrice   = viewModel::actualizarPrecioProductoCompra,
            onCreateNewProduct = viewModel::agregarProductoBase,
            onEliminar    = viewModel::eliminarProductoCompra,
            onDismiss     = { viewModel.showCatalogCompra(false) }
        )
    }
    if (uiState.showPurchaseSheet) {
        PurchaseCartSheet(
            cart = uiState.cartCompra,
            total = viewModel.cartCompraTotal,
            onAdd = viewModel::addToCartCompra,
            onRemove = viewModel::removeFromCartCompra,
            onEditQuantity = viewModel::setCartCompraCantidad,
            onRegistrar = viewModel::registrarCompra,
            onDismiss = { viewModel.showPurchaseSheet(false) }
        )
    }
    if (facturaState.showDialog && facturaState.venta != null) {
        FacturaDialog(
            lineas    = facturaState.lineasVenta,
            onDismiss = { facturaViewModel.hideDialog() },
            onConfirm = { nombre, ci, correo, direccion, telefono, formaPago, transaccion, nota, firmaClienteUri ->
                facturaViewModel.generarFactura(nombre, ci, correo, direccion, telefono, formaPago, transaccion, nota, firmaClienteUri)
            }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PuntoVentaContent — ProductCard → ProductGridCard
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun PuntoVentaContent(viewModel: InventarioViewModel, padding: PaddingValues) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val dateFormatter = remember { DateTimeFormatter.ofPattern("dd/MM/yyyy") }
    val esHoy = uiState.fechaTrabajo == LocalDate.now()

    Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
        Text("Punto de Venta", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
            Row(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(if (esHoy) "Ventas de hoy" else "Ventas del ${uiState.fechaTrabajo.format(dateFormatter)}", style = MaterialTheme.typography.labelMedium)
                    Text("${uiState.ventasHoy.size} transacciones", style = MaterialTheme.typography.bodyMedium)
                }
                Column(horizontalAlignment = Alignment.End) {
                    DiaTrabajoSelector(uiState.fechaTrabajo, viewModel::setFechaTrabajo)
                    Text("%.2f CUP".format(uiState.totalHoy), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        Text("Productos disponibles", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(8.dp))

        if (uiState.productos.isEmpty()) {
            EmptyProductosBox(modifier = Modifier.fillMaxWidth().weight(1f))
        } else {
            LazyVerticalGrid(columns = GridCells.Fixed(2), modifier = Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(uiState.productos) { producto ->
                    // ✅ ProductCard eliminado → ProductGridCard genérico
                    ProductGridCard(
                        rawEmoji  = producto.emoji,
                        nombre    = producto.nombre,
                        subtitulo = "%.2f CUP / %s".format(producto.precio, producto.unidad),
                        onClick   = { viewModel.addToCart(producto) }
                    )
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PuntoCompraContent — ProductCardCompra → ProductGridCard
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun PuntoCompraContent(viewModel: InventarioViewModel, padding: PaddingValues) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val dateFormatter = remember { DateTimeFormatter.ofPattern("dd/MM/yyyy") }
    val esHoy = uiState.fechaTrabajo == LocalDate.now()

    Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
        Text("Registro de Compras", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)) {
            Row(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(if (esHoy) "Compras de hoy" else "Compras del ${uiState.fechaTrabajo.format(dateFormatter)}", style = MaterialTheme.typography.labelMedium)
                    Text("${uiState.comprasHoy.size} transacciones", style = MaterialTheme.typography.bodyMedium)
                }
                Column(horizontalAlignment = Alignment.End) {
                    DiaTrabajoSelector(uiState.fechaTrabajo, viewModel::setFechaTrabajo)
                    Text("%.2f CUP".format(uiState.totalComprasHoy), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        Text("Insumos disponibles", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(8.dp))

        if (uiState.productosCompra.isEmpty()) {
            EmptyProductosBox(modifier = Modifier.fillMaxWidth().weight(1f), label = "No hay insumos")
        } else {
            LazyVerticalGrid(columns = GridCells.Fixed(2), modifier = Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(uiState.productosCompra) { producto ->
                    // ✅ ProductCardCompra eliminado → ProductGridCard genérico
                    ProductGridCard(
                        rawEmoji  = producto.emoji,
                        nombre    = producto.nombre,
                        subtitulo = "%.2f CUP / %s".format(producto.precio, producto.unidad),
                        onClick   = { viewModel.addToCartCompra(producto) }
                    )
                }
            }
        }
    }

}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyProductosBox
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun EmptyProductosBox(modifier: Modifier = Modifier, label: String = "No hay productos") {
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("📦", fontSize = 48.sp)
            Spacer(Modifier.height(8.dp))
            Text(label, style = MaterialTheme.typography.bodyLarge)
            Text("Toca + para agregar", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductCatalogSheet — Row inline → CatalogoItemRow
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductCatalogSheet(
    productosBase: List<Producto>,
    productos: List<ProductoVenta>,
    onAdd: (String, Double) -> Unit,
    onEditPrice: (String, Double) -> Unit,
    onCreateNewProduct: (String, String, String) -> Unit,
    onEliminar: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var productoEditandoPrecio by remember { mutableStateOf<ProductoVenta?>(null) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp).navigationBarsPadding()) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Mis productos", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                IconButton(onClick = { showAddDialog = true }) { Icon(Icons.Default.Add, "Agregar al catálogo") }
            }
            Divider(modifier = Modifier.padding(vertical = 8.dp))

            if (productos.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) { Text("No hay productos aún") }
            } else {
                LazyColumn(modifier = Modifier.heightIn(max = 400.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    items(productos) { producto ->
                        // ✅ Row inline con Text(emoji) → CatalogoItemRow
                        CatalogoItemRow(
                            rawEmoji   = producto.emoji,
                            nombre     = producto.nombre,
                            subtitulo  = "%.2f CUP".format(producto.precio),
                            onEditarPrecio = { productoEditandoPrecio = producto },
                            onEliminar = { onEliminar(producto.catalogoId) }
                        )
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        ProductSheet(
            title    = "Agregar producto al catálogo de ventas",
            emptyLabel = "No hay productos base disponibles",
            productos  = productosBase,
            productosEnCatalogoIds = productos.map { it.id }.toSet(),
            onAdd      = onAdd,
            onCreateNewProduct = onCreateNewProduct,
            onDismiss  = { showAddDialog = false }
        )
    }

    productoEditandoPrecio?.let { producto ->
        ProductPriceDialog(
            title = "Editar precio de venta",
            nombre = producto.nombre,
            emoji = producto.emoji,
            unidad = producto.unidad,
            initialPrice = producto.precio,
            confirmLabel = "Guardar",
            onDismiss = { productoEditandoPrecio = null },
            onConfirm = { precio ->
                onEditPrice(producto.id, precio)
                productoEditandoPrecio = null
            }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductCatalogCompraSheet — Row inline (parcial) → CatalogoItemRow
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductCatalogCompraSheet(
    productosBase: List<Producto>,
    productos: List<ProductoCompra>,
    onAdd: (String, Double) -> Unit,
    onEditPrice: (String, Double) -> Unit,
    onCreateNewProduct: (String, String, String) -> Unit,
    onEliminar: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var productoEditandoPrecio by remember { mutableStateOf<ProductoCompra?>(null) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp).navigationBarsPadding()) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Mis Insumos", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                IconButton(onClick = { showAddDialog = true }) { Icon(Icons.Default.Add, "Agregar al catálogo") }
            }
            Divider(modifier = Modifier.padding(vertical = 8.dp))

            if (productos.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) { Text("No hay insumos aún") }
            } else {
                LazyColumn(modifier = Modifier.heightIn(max = 400.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    items(productos) { producto ->
                        // ✅ Box inline con when(imagen.type) → CatalogoItemRow
                        CatalogoItemRow(
                            rawEmoji   = producto.emoji,
                            nombre     = producto.nombre,
                            subtitulo  = "%.2f CUP".format(producto.precio),
                            onEditarPrecio = { productoEditandoPrecio = producto },
                            onEliminar = { onEliminar(producto.catalogoId) }
                        )
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        ProductSheet(
            title    = "Agregar producto al catálogo de compras",
            emptyLabel = "No hay productos base disponibles",
            productos  = productosBase,
            productosEnCatalogoIds = productos.map { it.id }.toSet(),
            onAdd      = onAdd,
            onCreateNewProduct = onCreateNewProduct,
            onDismiss  = { showAddDialog = false }
        )
    }

    productoEditandoPrecio?.let { producto ->
        ProductPriceDialog(
            title = "Editar precio de compra",
            nombre = producto.nombre,
            emoji = producto.emoji,
            unidad = producto.unidad,
            initialPrice = producto.precio,
            confirmLabel = "Guardar",
            onDismiss = { productoEditandoPrecio = null },
            onConfirm = { precio ->
                onEditPrice(producto.id, precio)
                productoEditandoPrecio = null
            }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductSheet — LazyVerticalGrid inline → ProductSelectorGrid
//              — CreateBaseProductDialog → ProductoFormDialog
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductSheet(
    title: String,
    emptyLabel: String,
    productos: List<Producto>,
    productosEnCatalogoIds: Set<String>,
    onAdd: (String, Double) -> Unit,
    onCreateNewProduct: (String, String, String) -> Unit,
    onDismiss: () -> Unit
) {
    var showCreateDialog      by remember { mutableStateOf(false) }
    var selectedItem          by remember { mutableStateOf<ProductoBaseItem?>(null) }
    var search                by remember { mutableStateOf("") }
    var pendingCreatedProduct by remember { mutableStateOf<Pair<String, String>?>(null) }

    val productosDisponibles = remember(productos, productosEnCatalogoIds, search) {
        productos
            .filter { it.activo && it.id !in productosEnCatalogoIds }
            .filter { search.isBlank() || it.nombre.contains(search, ignoreCase = true) || it.unidad.contains(search, ignoreCase = true) }
            .sortedBy { it.nombre.lowercase(Locale.getDefault()) }
            .map { it.toBaseItem() }          // ← convierte a ProductoBaseItem
    }

    LaunchedEffect(productosDisponibles, pendingCreatedProduct) {
        val pending = pendingCreatedProduct ?: return@LaunchedEffect
        val match = productosDisponibles.firstOrNull { it.nombre.equals(pending.first, ignoreCase = true) && it.unidad == pending.second } ?: return@LaunchedEffect
        selectedItem = match
        pendingCreatedProduct = null
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp).navigationBarsPadding()) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                FilledTonalButton(onClick = { showCreateDialog = true }, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp)) {
                    Icon(Icons.Default.Add, null); Spacer(Modifier.width(6.dp)); Text("Nuevo")
                }
            }
            Divider(modifier = Modifier.padding(vertical = 8.dp))
            OutlinedTextField(value = search, onValueChange = { search = it }, label = { Text("Buscar producto") }, leadingIcon = { Icon(Icons.Default.Search, null) }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            Spacer(Modifier.height(12.dp))

            if (productosDisponibles.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                    Text(if (search.isBlank()) emptyLabel else "No se encontraron productos", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            } else {
                // ✅ LazyVerticalGrid + ElevatedCard inline → ProductSelectorGrid
                ProductSelectorGrid(productos = productosDisponibles, onSelect = { selectedItem = it })
            }
        }
    }

    // Diálogo de precio
    selectedItem?.let { item ->
        ProductPriceDialog(
            title    = "Agregar al catálogo",
            nombre   = item.nombre,
            emoji    = item.emoji,
            unidad   = item.unidad,
            confirmLabel = "Agregar",
            onDismiss = { selectedItem = null },
            onConfirm = { precio ->
                onAdd(item.id, precio)
                selectedItem = null
                onDismiss()
            }
        )
    }

    // ✅ CreateBaseProductDialog eliminado → ProductoFormDialog unificado
    if (showCreateDialog) {
        ProductoFormDialog(
            onDismiss = { showCreateDialog = false },
            onConfirm = { nombre, imagenJson, unidad ->
                onCreateNewProduct(nombre, imagenJson, unidad)
                showCreateDialog = false
                search = nombre
                pendingCreatedProduct = nombre to unidad
            }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductPriceDialog — Text(emoji, 26sp) → ProductoImagenAvatar
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun ProductPriceDialog(
    title: String,
    nombre: String,
    emoji: String,
    unidad: String,
    initialPrice: Double = 0.0,
    confirmLabel: String = "Agregar",
    onDismiss: () -> Unit,
    onConfirm: (Double) -> Unit
) {
    var precio by remember(initialPrice) {
        mutableStateOf(
            if (initialPrice > 0.0) "%.2f".format(initialPrice) else ""
        )
    }
    val puedeAgregar = (precio.toDoubleOrNull() ?: 0.0) > 0.0

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text  = {
            Column(modifier = Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                ElevatedCard(colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)) {
                    Row(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        // ✅ Text(emoji, 26sp) → ProductoImagenAvatar
                        ProductoImagenAvatar(rawEmoji = emoji, size = 40.dp)
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(nombre, fontWeight = FontWeight.SemiBold)
                            Text("Unidad: $unidad", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
                OutlinedTextField(
                    value = precio,
                    onValueChange = { precio = it.replace(',', '.') },
                    label = { Text("Precio (CUP)") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onConfirm(precio.toDouble())
                    onDismiss()
                },
                enabled = puedeAgregar
            ) {
                Text(confirmLabel)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// ItemInventarioRow — Text(emoji, 24sp) → InventarioItemAvatar
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun ItemInventarioRow(
    item: ItemInventario,
    nombre: String,
    emoji: String,
    color: androidx.compose.ui.graphics.Color,
    onAjustarStock: () -> Unit,
    onMover: (() -> Unit)?,
    onArchive: () -> Unit,
    bloqueadoPorVenta: Boolean
) {
    var expanded by remember { mutableStateOf(false) }
    val modo = runCatching { ModoStock.valueOf(item.modoStock) }.getOrElse { ModoStock.ILIMITADO }

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth().clickable { expanded = !expanded }.padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // ✅ Text(emoji, 24sp) → InventarioItemAvatar
                InventarioItemAvatar(rawEmoji = emoji)
                Column {
                    Text(nombre, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                    Text(
                        when (modo) {
                            ModoStock.ILIMITADO -> "Disponibilidad ilimitada"
                            ModoStock.MANUAL    -> "Stock manual"
                            ModoStock.VINCULADO -> "Vinculado a compras"
                        },
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (modo != ModoStock.ILIMITADO && item.stockDisponible.isFinite()) {
                    Surface(shape = RoundedCornerShape(8.dp), color = if (item.stockDisponible > 0) color.copy(alpha = 0.15f) else MaterialTheme.colorScheme.errorContainer) {
                        Text("%.1f".format(item.stockDisponible), modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = if (item.stockDisponible > 0) color else MaterialTheme.colorScheme.error)
                    }
                } else {
                    Icon(Icons.Default.AllInclusive, contentDescription = "Ilimitado", tint = color, modifier = Modifier.size(18.dp))
                }
                Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, contentDescription = null, modifier = Modifier.size(18.dp))
            }
        }

        AnimatedVisibility(visible = expanded, enter = expandVertically(), exit = shrinkVertically()) {
            Column(modifier = Modifier.fillMaxWidth().padding(start = 44.dp, bottom = 8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Última actualización: ${item.ultimaActualizacion.ifEmpty { "Sin registro" }}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Modo: ${item.modoStock}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onAjustarStock, modifier = Modifier.height(32.dp), contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp)) {
                        Icon(Icons.Default.Edit, null, modifier = Modifier.size(14.dp)); Spacer(Modifier.width(4.dp)); Text("Ajustar stock", style = MaterialTheme.typography.labelSmall)
                    }
                    if (onMover != null) {
                        OutlinedButton(onClick = onMover, modifier = Modifier.height(32.dp), contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp)) {
                            Icon(Icons.Default.SwapHoriz, null, modifier = Modifier.size(14.dp)); Spacer(Modifier.width(4.dp)); Text("Poner a la venta", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
                Spacer(Modifier.height(4.dp))
                if (bloqueadoPorVenta) {
                    Text("Para archivar, quita primero el producto del catálogo de ventas.", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    OutlinedButton(onClick = onArchive, modifier = Modifier.fillMaxWidth(), contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp)) {
                        Icon(Icons.Default.Delete, null, modifier = Modifier.size(14.dp)); Spacer(Modifier.width(4.dp)); Text("Archivar", style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// El resto sin cambios — pegado tal cual del original
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun CantidadOperacionDialog(nombreProducto: String, unidad: String, precioUnitario: Double, titulo: String, initialCantidad: Double? = null, onDismiss: () -> Unit, onConfirm: (Double) -> Unit) {
    val permiteFraccion = permiteFraccion(unidad)
    var cantidadInput by remember(nombreProducto, unidad, initialCantidad) { mutableStateOf(initialCantidad?.let { formatCantidad(it, permiteFraccion) } ?: if (permiteFraccion) "1.0" else "1") }
    val cantidad = parseCantidad(cantidadInput, permiteFraccion)
    val subtotal = (cantidad ?: 0.0) * precioUnitario
    AlertDialog(
        onDismissRequest = onDismiss, title = { Text(titulo) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(nombreProducto, fontWeight = FontWeight.SemiBold)
                Text("Unidad: $unidad" + if (permiteFraccion) " (permite fracciones)" else " (solo enteros)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconButton(onClick = { val a = cantidad ?: 0.0; cantidadInput = formatCantidad((a - 1.0).coerceAtLeast(0.0), permiteFraccion) }) { Icon(Icons.Default.Remove, null) }
                    OutlinedTextField(value = cantidadInput, onValueChange = { if (it.isEmpty() || esEntradaCantidadValida(it, permiteFraccion)) cantidadInput = it.replace(',', '.') }, label = { Text("Cantidad") }, keyboardOptions = KeyboardOptions(keyboardType = if (permiteFraccion) KeyboardType.Decimal else KeyboardType.Number), singleLine = true, modifier = Modifier.weight(1f))
                    IconButton(onClick = { val a = cantidad ?: 0.0; cantidadInput = formatCantidad(a + 1.0, permiteFraccion) }) { Icon(Icons.Default.Add, null) }
                }
                Text("Precio unitario: %.2f CUP".format(precioUnitario), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Total: %.2f CUP".format(subtotal), style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            }
        },
        confirmButton = { TextButton(onClick = { onConfirm(cantidad ?: 0.0) }, enabled = (cantidad ?: 0.0) > 0.0) { Text("Aceptar") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DiaTrabajoSelector(fechaTrabajo: LocalDate, onFechaChange: (LocalDate) -> Unit) {
    val formatter = remember { DateTimeFormatter.ofPattern("dd/MM/yyyy") }
    var showDatePicker by remember { mutableStateOf(false) }
    Text(text = fechaTrabajo.format(formatter), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary, modifier = Modifier.clickable { showDatePicker = true })
    if (showDatePicker) {
        val initialMillis = remember(fechaTrabajo) { fechaTrabajo.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli() }
        val datePickerState = rememberDatePickerState(initialSelectedDateMillis = initialMillis)
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = { TextButton(onClick = { datePickerState.selectedDateMillis?.let { onFechaChange(Instant.ofEpochMilli(it).atZone(ZoneOffset.UTC).toLocalDate()) }; showDatePicker = false }) { Text("Aceptar") } },
            dismissButton = { TextButton(onClick = { showDatePicker = false }) { Text("Cancelar") } }
        ) { DatePicker(state = datePickerState) }
    }
}

@Composable
private fun InventarioContent(viewModel: InventarioViewModel, padding: PaddingValues) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val itemsInventario = remember(uiState.itemsInventarioCompra, uiState.itemsInventarioVenta) {
        (uiState.itemsInventarioCompra + uiState.itemsInventarioVenta).distinctBy { it.id }.sortedByDescending { it.ultimaActualizacion }
    }
    Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Inventario", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        AlmacenSection(
            titulo = "Almacén principal", icono = Icons.Default.Inventory2, color = MaterialTheme.colorScheme.primary,
            items = itemsInventario, productosBase = uiState.productosBase, productos = uiState.productosCompra, productosVenta = uiState.productos,
            onAjustarStock = { viewModel.showAjusteStockDialog(it) },
            onMover = { item -> if (uiState.productos.none { it.id == item.productoId }) viewModel.showMoverDialog(item) },
            onGenerarInforme = viewModel::generarInformeInventarioPdf,
            onArchive = { item, nombre -> viewModel.showArchiveDialog(item, nombre) }
        )
    }
    if (uiState.showAjusteStockDialog && uiState.itemAjustando != null) AjusteStockDialog(item = uiState.itemAjustando!!, productosCompra = uiState.productosCompra, vinculadosIniciales = uiState.vinculadosItemAjustando, onDismiss = { viewModel.showAjusteStockDialog(null) }, onConfirm = { cantidad, modo, vinculados, ratios -> viewModel.ajustarStockManual(uiState.itemAjustando!!.id, cantidad, modo, vinculados, ratios) })
    if (uiState.showMoverDialog && uiState.itemMoviendo != null) MoverProductoDialog(item = uiState.itemMoviendo!!, productosCompra = uiState.productosCompra, onDismiss = { viewModel.showMoverDialog(null) }, onConfirm = { viewModel.ponerProductoEnVenta(productoId = uiState.itemMoviendo!!.productoId, precioVenta = it) })
    if (uiState.showArchiveDialog && uiState.itemArchivando != null) ArchiveInventoryItemDialog(nombreProducto = uiState.nombreItemArchivando, stockDisponible = uiState.itemArchivando!!.stockDisponible, modoStock = uiState.itemArchivando!!.modoStock, bloqueadoPorVenta = uiState.productos.any { it.id == uiState.itemArchivando!!.productoId }, onDismiss = { viewModel.showArchiveDialog(null, "") }, onConfirm = { viewModel.archivarItemInventario(it) })
}

@Composable
private fun AlmacenSection(titulo: String, icono: androidx.compose.ui.graphics.vector.ImageVector, color: androidx.compose.ui.graphics.Color, items: List<ItemInventario>, productosBase: List<Producto>, productos: List<ProductoCompra>, productosVenta: List<ProductoVenta>, onAjustarStock: (ItemInventario) -> Unit, onMover: ((ItemInventario) -> Unit)?, onGenerarInforme: () -> Unit, onArchive: (ItemInventario, String) -> Unit) {
    var expanded by remember { mutableStateOf(true) }
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth().clickable { expanded = !expanded }, horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) { Icon(icono, null, tint = color); Text(titulo, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = RoundedCornerShape(12.dp), color = color.copy(alpha = 0.15f)) { Text("${items.size} productos", modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall, color = color) }
                    Spacer(Modifier.width(8.dp))
                    Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null)
                }
            }
            AnimatedVisibility(visible = expanded, enter = expandVertically(), exit = shrinkVertically()) {
                Column(modifier = Modifier.padding(top = 12.dp)) {
                    OutlinedButton(onClick = onGenerarInforme, modifier = Modifier.fillMaxWidth()) { Icon(Icons.Default.PictureAsPdf, null); Spacer(Modifier.width(8.dp)); Text("Generar informe de inventario") }
                    if (items.isEmpty()) {
                        Box(modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp), contentAlignment = Alignment.Center) { Column(horizontalAlignment = Alignment.CenterHorizontally) { Text("📦", fontSize = 32.sp); Spacer(Modifier.height(4.dp)); Text("Sin productos en inventario", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) } }
                    } else {
                        Divider(modifier = Modifier.padding(bottom = 8.dp))
                        items.forEach { item ->
                            val productoVenta = productosVenta.find { it.id == item.productoId }
                            val productoCompra = productos.find { it.id == item.productoId }
                            val productoBase = productosBase.find { it.id == item.productoId }
                            val nombreProducto = productoBase?.nombre ?: productoVenta?.nombre ?: productoCompra?.nombre ?: item.productoId
                            val emojiProducto  = productoBase?.emoji  ?: productoVenta?.emoji  ?: productoCompra?.emoji  ?: "📦"
                            ItemInventarioRow(item = item, nombre = nombreProducto, emoji = emojiProducto, color = color, onAjustarStock = { onAjustarStock(item) }, onMover = onMover?.takeIf { productoVenta == null }?.let { { it(item) } }, onArchive = { onArchive(item, nombreProducto) }, bloqueadoPorVenta = productoVenta != null)
                            Divider(modifier = Modifier.padding(vertical = 4.dp))
                        }
                    }
                }
            }
        }
    }
}

// Resto de composables sin modificaciones
@Composable private fun ArchiveInventoryItemDialog(nombreProducto: String, stockDisponible: Double, modoStock: String, bloqueadoPorVenta: Boolean, onDismiss: () -> Unit, onConfirm: (String) -> Unit) { val modo = runCatching { ModoStock.valueOf(modoStock) }.getOrElse { ModoStock.ILIMITADO }; val stockIlimitado = modo == ModoStock.ILIMITADO; val stockAgotado = !stockIlimitado && stockDisponible.isFinite() && stockDisponible <= 0.0; var motivo by rememberSaveable { mutableStateOf(if (stockAgotado) "Archivado por inventario agotado" else "") }; AlertDialog(onDismissRequest = onDismiss, title = { Text("Archivar producto del almacén") }, text = { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) { Text(nombreProducto, fontWeight = FontWeight.SemiBold); Text(if (stockIlimitado) "Stock: ilimitado" else "Stock: ${"%.2f".format(stockDisponible)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant); if (bloqueadoPorVenta) Text("Este producto está en el catálogo de ventas.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error) else { OutlinedTextField(value = motivo, onValueChange = { motivo = it }, label = { Text("Motivo de archivo") }, modifier = Modifier.fillMaxWidth(), minLines = 2, maxLines = 4); if (!stockAgotado) Text("Si aún queda inventario, es obligatorio explicar el motivo.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) } } }, confirmButton = { TextButton(onClick = { onConfirm(motivo) }, enabled = !bloqueadoPorVenta && (stockAgotado || motivo.isNotBlank())) { Text("Archivar") } }, dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }) }
@Composable private fun ArchivedInventoryDialog(items: List<ItemInventario>, productosBase: List<Producto>, onRestore: (String) -> Unit, onDismiss: () -> Unit) { val productosMap = remember(productosBase) { productosBase.associateBy { it.id } }; AlertDialog(onDismissRequest = onDismiss, title = { Text("Productos archivados") }, text = { if (items.isEmpty()) Text("No hay productos archivados.") else Column(modifier = Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) { items.forEach { item -> val nombre = productosMap[item.productoId]?.nombre ?: item.productoId; Column(modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f), RoundedCornerShape(10.dp)).padding(12.dp)) { Text(nombre, fontWeight = FontWeight.SemiBold); if (item.fechaArchivado.isNotBlank()) Text("Fecha: ${item.fechaArchivado}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant); Text("Motivo: ${item.motivoArchivado.ifBlank { "Sin motivo registrado" }}", style = MaterialTheme.typography.bodySmall); Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) { TextButton(onClick = { onRestore(item.id) }) { Text("Restaurar") } } } } } }, confirmButton = { TextButton(onClick = onDismiss) { Text("Cerrar") } }) }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AjusteStockDialog(item: ItemInventario, productosCompra: List<ProductoCompra>, vinculadosIniciales: List<InventarioVinculoEdicion>, onDismiss: () -> Unit, onConfirm: (Double, String, List<String>, List<Double>) -> Unit) {
    var cantidadInput by remember { mutableStateOf(if (item.stockDisponible > 0) item.stockDisponible.toString() else "") }
    var unidad by remember { mutableStateOf(item.modoStock) }
    val cantidad = cantidadInput.toDoubleOrNull()
    var unitExpanded by remember { mutableStateOf(false) }
    var productosVinculados by remember(item.id, vinculadosIniciales) { mutableStateOf(vinculadosIniciales.map { VinculadoTemp(it.productoId, it.cantidad) }) }
    AlertDialog(onDismissRequest = onDismiss, title = { Text("Ajustar stock") }, text = {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.verticalScroll(rememberScrollState())) {
            Text("Tipo de stock:", style = MaterialTheme.typography.bodyMedium)
            ExposedDropdownMenuBox(expanded = unitExpanded, onExpandedChange = { unitExpanded = it }) {
                OutlinedTextField(value = unidad, onValueChange = {}, readOnly = true, label = { Text("Seleccionar") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(unitExpanded) }, modifier = Modifier.fillMaxWidth().menuAnchor())
                ExposedDropdownMenu(expanded = unitExpanded, onDismissRequest = { unitExpanded = false }) {
                    listOf(ModoStock.ILIMITADO, ModoStock.MANUAL, ModoStock.VINCULADO).forEach { u -> DropdownMenuItem(text = { Text(u.name) }, onClick = { unidad = u.name; unitExpanded = false }) }
                }
            }
            if (unidad == ModoStock.MANUAL.name) { Text("Indica la cantidad disponible actual.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant); OutlinedTextField(value = cantidadInput, onValueChange = { cantidadInput = it.replace(',', '.') }, label = { Text("Cantidad disponible") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true, modifier = Modifier.fillMaxWidth()) }
            if (unidad == ModoStock.VINCULADO.name) {
                Text("Vincula este producto con productos de compra.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    productosVinculados.forEachIndexed { index, vinculado -> VinculadoItemRow(vinculado = vinculado, productosCompra = productosCompra, productosVinculados = productosVinculados.map { it.productoId }, onProductoCambiado = { productosVinculados = productosVinculados.toMutableList().apply { this[index] = vinculado.copy(productoId = it) } }, onRatioCambiado = { productosVinculados = productosVinculados.toMutableList().apply { this[index] = vinculado.copy(ratio = it) } }, onEliminar = { productosVinculados = productosVinculados.filterIndexed { i, _ -> i != index } }) }
                    OutlinedButton(onClick = { productosVinculados = productosVinculados + VinculadoTemp(productosCompra.firstOrNull { p -> productosVinculados.none { it.productoId == p.id } }?.id ?: "", 1.0) }, modifier = Modifier.fillMaxWidth()) { Icon(Icons.Default.Add, null); Spacer(Modifier.width(4.dp)); Text("Agregar producto vinculado") }
                }
            }
        }
    }, confirmButton = { TextButton(onClick = { onConfirm(cantidad ?: 0.0, unidad, productosVinculados.map { it.productoId }.filter { it.isNotEmpty() }, productosVinculados.map { it.ratio }) }, enabled = when (unidad) { ModoStock.ILIMITADO.name -> true; ModoStock.VINCULADO.name -> productosVinculados.isNotEmpty() && productosVinculados.all { it.productoId.isNotEmpty() }; else -> cantidad != null && cantidad >= 0.0 }) { Text("Guardar") } }, dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } })
}

data class VinculadoTemp(val productoId: String, val ratio: Double)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun VinculadoItemRow(vinculado: VinculadoTemp, productosCompra: List<ProductoCompra>, productosVinculados: List<String>, onProductoCambiado: (String) -> Unit, onRatioCambiado: (Double) -> Unit, onEliminar: () -> Unit) {
    var dropdownExpanded by remember { mutableStateOf(false) }
    var ratioInput by remember { mutableStateOf(if (vinculado.ratio > 0) vinculado.ratio.toString() else "1") }
    val productosDisponibles = productosCompra.filter { p -> p.id == vinculado.productoId || !productosVinculados.contains(p.id) }
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(8.dp)) {
            ExposedDropdownMenuBox(expanded = dropdownExpanded, onExpandedChange = { dropdownExpanded = it }) {
                OutlinedTextField(value = productosCompra.find { it.id == vinculado.productoId }?.nombre ?: "Seleccionar", onValueChange = {}, readOnly = true, label = { Text("Producto") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(dropdownExpanded) }, modifier = Modifier.fillMaxWidth().menuAnchor())
                ExposedDropdownMenu(expanded = dropdownExpanded, onDismissRequest = { dropdownExpanded = false }) {
                    productosDisponibles.forEach { p -> DropdownMenuItem(text = { Text("${p.emoji} ${p.nombre}") }, onClick = { onProductoCambiado(p.id); dropdownExpanded = false }) }
                }
            }
            Spacer(Modifier.height(4.dp))
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                OutlinedTextField(value = ratioInput, onValueChange = { ratioInput = it.replace(',', '.'); it.replace(',', '.').toDoubleOrNull()?.let { r -> onRatioCambiado(r) } }, label = { Text("Cantidad a descontar") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true, modifier = Modifier.weight(1f))
                IconButton(onClick = onEliminar) { Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MoverProductoDialog(item: ItemInventario, productosCompra: List<ProductoCompra>, onDismiss: () -> Unit, onConfirm: (Double) -> Unit) {
    val productoCompra = productosCompra.find { it.id == item.productoId }
    val precioCosto = productoCompra?.precio ?: 0.0
    var precioVentaInput by remember { mutableStateOf("") }
    val precioVenta = precioVentaInput.toDoubleOrNull()
    val ganancia = if (precioVenta != null && precioCosto > 0) precioVenta - precioCosto else null
    val margenComercial = if (precioVenta != null && precioVenta > 0 && precioCosto > 0) ((precioVenta - precioCosto) / precioVenta) * 100 else null
    AlertDialog(onDismissRequest = onDismiss, title = { Text("Poner producto a la venta") }, text = {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.verticalScroll(rememberScrollState())) {
            Text("${productoCompra?.emoji ?: "📦"} ${productoCompra?.nombre ?: "Producto"}", style = MaterialTheme.typography.titleMedium)
            Text("Se agregará al catálogo de ventas usando el mismo inventario del almacén actual.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("Precio de costo:", style = MaterialTheme.typography.bodyMedium); Text("${"%.2f".format(precioCosto)} CUP", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold) }
            OutlinedTextField(value = precioVentaInput, onValueChange = { precioVentaInput = it.replace(',', '.') }, label = { Text("Precio de venta (CUP)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true, modifier = Modifier.fillMaxWidth())
            if (ganancia != null && margenComercial != null) { Divider(); Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("Ganancia:", style = MaterialTheme.typography.bodySmall); Text("${"%.2f".format(ganancia)} CUP", style = MaterialTheme.typography.bodySmall, color = if (ganancia >= 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error, fontWeight = FontWeight.SemiBold) }; Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("Margen comercial:", style = MaterialTheme.typography.bodySmall); Text("${"%.1f".format(margenComercial)}%", style = MaterialTheme.typography.bodySmall, color = if (margenComercial >= 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error, fontWeight = FontWeight.SemiBold) } }
        }
    }, confirmButton = { TextButton(onClick = { onConfirm(precioVenta!!) }, enabled = (precioVenta ?: 0.0) > 0.0) { Text("Publicar") } }, dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } })
}

@Composable
private fun HistorialContent(viewModel: InventarioViewModel, facturaViewModel: FacturaViewModel, padding: PaddingValues, canGenerateInvoices: Boolean) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    Column(modifier = Modifier.fillMaxSize().padding(padding)) {
        Card(modifier = Modifier.fillMaxWidth().padding(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
            Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { viewModel.mesAnterior() }) { Icon(Icons.Default.ChevronLeft, "Mes anterior") }
                    Text(viewModel.getNombreMes(uiState.mesActual), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    IconButton(onClick = { viewModel.mesSiguiente() }, enabled = !uiState.mesActual.isAfter(YearMonth.now())) { Icon(Icons.Default.ChevronRight, "Mes siguiente", tint = if (uiState.mesActual.isAfter(YearMonth.now())) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f) else MaterialTheme.colorScheme.onSurface) }
                }
                Spacer(Modifier.height(8.dp))
                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (!canGenerateInvoices) Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) { Text("La generación de facturas requiere plan Pro o VIP.", modifier = Modifier.padding(12.dp), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { ResumenItem(modifier = Modifier.weight(1f), value = "${uiState.cantidadVentasMes}", label = "Ventas realizadas", valueColor = MaterialTheme.colorScheme.primary); ResumenItem(modifier = Modifier.weight(1f), value = "%.2f CUP".format(uiState.totalVentasMes), label = "Total de ventas", valueColor = MaterialTheme.colorScheme.primary) }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { ResumenItem(modifier = Modifier.weight(1f), value = "${uiState.cantidadComprasMes}", label = "Compras realizadas", valueColor = MaterialTheme.colorScheme.secondary); ResumenItem(modifier = Modifier.weight(1f), value = "%.2f CUP".format(uiState.totalComprasMes), label = "Total de compras", valueColor = MaterialTheme.colorScheme.secondary) }
                }
            }
        }
        if (uiState.isLoading) { Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
        else if (uiState.ventasDelMes.isEmpty() && uiState.comprasDelMes.isEmpty()) { Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Column(horizontalAlignment = Alignment.CenterHorizontally) { Text("📊", fontSize = 48.sp); Spacer(Modifier.height(8.dp)); Text("No hay movimientos este mes", style = MaterialTheme.typography.bodyLarge) } } }
        else {
            val fechas = (uiState.ventasDelMes.keys + uiState.comprasDelMes.keys).distinct().sortedDescending()
            LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                fechas.forEach { fecha ->
                    val ventas = uiState.ventasDelMes[fecha].orEmpty()
                    val compras = uiState.comprasDelMes[fecha].orEmpty()
                    if (ventas.isNotEmpty()) item(key = "ventas-$fecha") { DiaVentasCard(fecha, ventas, { viewModel.anularVenta(it) }, { venta, lineas -> facturaViewModel.showFacturaDialog(venta, lineas) }, canGenerateInvoices) }
                    if (compras.isNotEmpty()) item(key = "compras-$fecha") { DiaComprasCard(fecha, compras) { viewModel.anularCompra(it) } }
                }
            }
        }
    }
}

@Composable private fun ResumenItem(modifier: Modifier = Modifier, value: String, label: String, valueColor: androidx.compose.ui.graphics.Color) { Surface(modifier = modifier, shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.surface.copy(alpha = 0.6f)) { Column(modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp, horizontal = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = valueColor); Text(label, style = MaterialTheme.typography.bodySmall) } } }

@Composable private fun DiaVentasCard(fecha: String, ventas: List<Pair<Venta, List<LineaVenta>>>, onAnular: (String) -> Unit, onGenerarFactura: (Venta, List<LineaVenta>) -> Unit, canGenerateInvoices: Boolean) { var expanded by remember { mutableStateOf(false) }; val totalDia = ventas.sumOf { it.first.total }; val fechaLocal = LocalDate.parse(fecha); val nombreDia = fechaLocal.dayOfWeek.getDisplayName(TextStyle.FULL, Locale("es", "ES")); Card(modifier = Modifier.fillMaxWidth().clickable { expanded = !expanded }) { Column(modifier = Modifier.padding(16.dp)) { Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Column { Text("$nombreDia ${fechaLocal.dayOfMonth}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold); Text("${ventas.size} venta${if (ventas.size != 1) "s" else ""}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }; Row(verticalAlignment = Alignment.CenterVertically) { Text("%.2f CUP".format(totalDia), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary); Spacer(Modifier.width(8.dp)); Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null) } }; AnimatedVisibility(visible = expanded, enter = expandVertically(), exit = shrinkVertically()) { Column(modifier = Modifier.padding(top = 12.dp)) { Divider(); ventas.forEach { (venta, lineas) -> VentaItem(fecha, venta, lineas, { onAnular(venta.id) }, { onGenerarFactura(venta, lineas) }, canGenerateInvoices) } } } } } }

@Composable private fun DiaComprasCard(fecha: String, compras: List<Pair<Compra, List<LineaCompra>>>, onAnular: (String) -> Unit) { var expanded by remember { mutableStateOf(false) }; val totalDia = compras.sumOf { it.first.total }; val fechaLocal = LocalDate.parse(fecha); val nombreDia = fechaLocal.dayOfWeek.getDisplayName(TextStyle.FULL, Locale("es", "ES")); Card(modifier = Modifier.fillMaxWidth().clickable { expanded = !expanded }) { Column(modifier = Modifier.padding(16.dp)) { Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Column { Text("$nombreDia ${fechaLocal.dayOfMonth}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold); Text("${compras.size} compra${if (compras.size != 1) "s" else ""}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }; Row(verticalAlignment = Alignment.CenterVertically) { Text("%.2f CUP".format(totalDia), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary); Spacer(Modifier.width(8.dp)); Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null) } }; AnimatedVisibility(visible = expanded, enter = expandVertically(), exit = shrinkVertically()) { Column(modifier = Modifier.padding(top = 12.dp)) { Divider(); compras.forEach { (compra, lineas) -> CompraItem(fecha, compra, lineas) { onAnular(compra.id) } } } } } } }

@Composable private fun VentaItem(fecha: String, venta: Venta, lineas: List<LineaVenta>, onAnular: () -> Unit, onGenerarFactura: () -> Unit, canGenerateInvoices: Boolean) { var expanded by remember { mutableStateOf(false) }; var showAnularDialog by remember { mutableStateOf(false) }; Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) { Row(modifier = Modifier.fillMaxWidth().clickable { expanded = !expanded }, horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Column(modifier = Modifier.weight(1f)) { Text(lineas.resumenProductosVenta(), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, maxLines = 1); Spacer(Modifier.height(4.dp)); Text(formatFechaHoraOperacion(fecha, venta.hora), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }; Row(verticalAlignment = Alignment.CenterVertically) { Text("$ %.2f CUP".format(venta.total), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold); Spacer(Modifier.width(8.dp)); Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null) } }; AnimatedVisibility(visible = expanded, enter = expandVertically(), exit = shrinkVertically()) { Column(modifier = Modifier.padding(top = 8.dp)) { lineas.forEachIndexed { index, linea -> LineaDetalleFactura(linea.nombreProducto, linea.cantidad, linea.precioUnitario, linea.subtotal); if (index < lineas.lastIndex) Divider(modifier = Modifier.padding(vertical = 6.dp)) }; Spacer(Modifier.height(8.dp)); Text("Importe total: $ %.2f CUP".format(venta.total), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary); Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) { TextButton(onClick = onGenerarFactura, enabled = canGenerateInvoices) { Icon(Icons.Default.Receipt, null, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(4.dp)); Text("Factura") }; TextButton(onClick = { showAnularDialog = true }) { Text("Anular", color = MaterialTheme.colorScheme.error) } } } } }; if (showAnularDialog) AlertDialog(onDismissRequest = { showAnularDialog = false }, title = { Text("Anular venta") }, text = { Text("Esta operación se anulará del historial. ¿Deseas continuar?") }, confirmButton = { TextButton(onClick = { onAnular(); showAnularDialog = false }) { Text("Sí, anular", color = MaterialTheme.colorScheme.error) } }, dismissButton = { TextButton(onClick = { showAnularDialog = false }) { Text("Cancelar") } }) }

@Composable private fun CompraItem(fecha: String, compra: Compra, lineas: List<LineaCompra>, onAnular: () -> Unit) { var expanded by remember { mutableStateOf(false) }; var showAnularDialog by remember { mutableStateOf(false) }; Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) { Row(modifier = Modifier.fillMaxWidth().clickable { expanded = !expanded }, horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Column(modifier = Modifier.weight(1f)) { Text(lineas.resumenProductosCompra(), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, maxLines = 1); Spacer(Modifier.height(4.dp)); Text(formatFechaHoraOperacion(fecha, compra.hora), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }; Row(verticalAlignment = Alignment.CenterVertically) { Text("$ %.2f CUP".format(compra.total), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold); Spacer(Modifier.width(8.dp)); Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null) } }; AnimatedVisibility(visible = expanded, enter = expandVertically(), exit = shrinkVertically()) { Column(modifier = Modifier.padding(top = 8.dp)) { lineas.forEachIndexed { index, linea -> LineaDetalleFactura(linea.nombreProducto, linea.cantidad, linea.precioUnitario, linea.subtotal); if (index < lineas.lastIndex) Divider(modifier = Modifier.padding(vertical = 6.dp)) }; Spacer(Modifier.height(8.dp)); Text("Importe total: $ %.2f CUP".format(compra.total), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary); TextButton(onClick = { showAnularDialog = true }, modifier = Modifier.align(Alignment.End)) { Text("Anular", color = MaterialTheme.colorScheme.error) } } } }; if (showAnularDialog) AlertDialog(onDismissRequest = { showAnularDialog = false }, title = { Text("Anular compra") }, text = { Text("Esta operación se anulará del historial. ¿Deseas continuar?") }, confirmButton = { TextButton(onClick = { onAnular(); showAnularDialog = false }) { Text("Sí, anular", color = MaterialTheme.colorScheme.error) } }, dismissButton = { TextButton(onClick = { showAnularDialog = false }) { Text("Cancelar") } }) }

@Composable private fun LineaDetalleFactura(nombre: String, cantidad: Double, precioUnitario: Double, subtotal: Double) { Column(modifier = Modifier.fillMaxWidth()) { Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) { Text(nombre, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f)); Spacer(Modifier.width(8.dp)); Text("${formatCantidad(cantidad)}x%.2f".format(precioUnitario), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold) }; Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Text("Subtotal", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant); Text("%.2f CUP".format(subtotal), style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant) } } }

@Composable private fun DocumentoAdjuntoField(titulo: String, descripcion: String, valor: String?, onSeleccionar: () -> Unit, onLimpiar: () -> Unit) { Surface(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), tonalElevation = 1.dp, color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)) { Column(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Text(titulo, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold); Text(descripcion, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant); Text(valor?.let(::resumenDocumentoAdjunto) ?: "No seleccionado", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant); Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { OutlinedButton(onClick = onSeleccionar) { Icon(Icons.Default.AttachFile, null); Spacer(Modifier.width(8.dp)); Text(if (valor == null) "Seleccionar" else "Cambiar") }; if (valor != null) TextButton(onClick = onLimpiar) { Icon(Icons.Default.Close, null); Spacer(Modifier.width(4.dp)); Text("Quitar") } } } } }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CartSheet(
    cart: Map<ProductoVenta, Double>,
    total: Double,
    onAdd: (ProductoVenta) -> Unit,
    onRemove: (ProductoVenta) -> Unit,
    onEditQuantity: (ProductoVenta, Double) -> Unit,
    onRegistrar: () -> Unit,
    onDismiss: () -> Unit
) {
    var productoEditandoCantidad by remember { mutableStateOf<ProductoVenta?>(null) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp).navigationBarsPadding()) {
            Text("Carrito de venta", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Divider(modifier = Modifier.padding(vertical = 8.dp))

            if (cart.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                    Text("El carrito está vacío")
                }
            } else {
                LazyColumn(modifier = Modifier.heightIn(max = 300.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(cart.entries.toList()) { (producto, cantidad) ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(producto.nombre, fontWeight = FontWeight.Medium)
                                Text(
                                    "%.2f CUP x %s".format(producto.precio, formatCantidad(cantidad, permiteFraccion(producto.unidad))),
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(onClick = { productoEditandoCantidad = producto }) {
                                    Icon(Icons.Default.Edit, contentDescription = "Editar cantidad")
                                }
                                IconButton(onClick = { onRemove(producto) }) {
                                    Icon(Icons.Default.Remove, null)
                                }
                                Text(
                                    formatCantidad(cantidad, permiteFraccion(producto.unidad)),
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                )
                                IconButton(onClick = { onAdd(producto) }) {
                                    Icon(Icons.Default.Add, null)
                                }
                            }
                        }
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text("%.2f CUP".format(total), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
                Spacer(Modifier.height(16.dp))
                Button(onClick = onRegistrar, modifier = Modifier.fillMaxWidth(), enabled = cart.isNotEmpty()) {
                    Icon(Icons.Default.Check, null)
                    Spacer(Modifier.width(8.dp))
                    Text("Registrar venta")
                }
            }
        }
    }

    productoEditandoCantidad?.let { producto ->
        val cantidadActual = cart[producto]
        if (cantidadActual != null) {
            CantidadOperacionDialog(
                nombreProducto = producto.nombre,
                unidad = producto.unidad,
                precioUnitario = producto.precio,
                titulo = "Editar cantidad de venta",
                initialCantidad = cantidadActual,
                onDismiss = { productoEditandoCantidad = null },
                onConfirm = { cantidad ->
                    onEditQuantity(producto, cantidad)
                    productoEditandoCantidad = null
                }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PurchaseCartSheet(
    cart: Map<ProductoCompra, Double>,
    total: Double,
    onAdd: (ProductoCompra) -> Unit,
    onRemove: (ProductoCompra) -> Unit,
    onEditQuantity: (ProductoCompra, Double) -> Unit,
    onRegistrar: () -> Unit,
    onDismiss: () -> Unit
) {
    var productoEditandoCantidad by remember { mutableStateOf<ProductoCompra?>(null) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp).navigationBarsPadding()) {
            Text("Carrito de compra", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Divider(modifier = Modifier.padding(vertical = 8.dp))

            if (cart.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                    Text("El carrito está vacío")
                }
            } else {
                LazyColumn(modifier = Modifier.heightIn(max = 300.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(cart.entries.toList()) { (producto, cantidad) ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(producto.nombre, fontWeight = FontWeight.Medium)
                                Text(
                                    "%.2f CUP x %s".format(producto.precio, formatCantidad(cantidad, permiteFraccion(producto.unidad))),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.secondary
                                )
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(onClick = { productoEditandoCantidad = producto }) {
                                    Icon(Icons.Default.Edit, contentDescription = "Editar cantidad")
                                }
                                IconButton(onClick = { onRemove(producto) }) {
                                    Icon(Icons.Default.Remove, null)
                                }
                                Text(
                                    formatCantidad(cantidad, permiteFraccion(producto.unidad)),
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                )
                                IconButton(onClick = { onAdd(producto) }) {
                                    Icon(Icons.Default.Add, null)
                                }
                            }
                        }
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text("%.2f CUP".format(total), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                }
                Spacer(Modifier.height(16.dp))
                Button(onClick = onRegistrar, modifier = Modifier.fillMaxWidth(), enabled = cart.isNotEmpty(), colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)) {
                    Icon(Icons.Default.Check, null)
                    Spacer(Modifier.width(8.dp))
                    Text("Registrar compra")
                }
            }
        }
    }

    productoEditandoCantidad?.let { producto ->
        val cantidadActual = cart[producto]
        if (cantidadActual != null) {
            CantidadOperacionDialog(
                nombreProducto = producto.nombre,
                unidad = producto.unidad,
                precioUnitario = producto.precio,
                titulo = "Editar cantidad de compra",
                initialCantidad = cantidadActual,
                onDismiss = { productoEditandoCantidad = null },
                onConfirm = { cantidad ->
                    onEditQuantity(producto, cantidad)
                    productoEditandoCantidad = null
                }
            )
        }
    }
}

@Composable
private fun MasContent(viewModel: InventarioViewModel, padding: PaddingValues) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val resumenBalanceMes = uiState.totalVentasMes - uiState.totalComprasMes
    val context = LocalContext.current
    var facturaExpanded by rememberSaveable { mutableStateOf(false) }
    var integracionExpanded by rememberSaveable { mutableStateOf(false) }
    var showArchivedDialog by rememberSaveable { mutableStateOf(false) }
    var integracionActiva by rememberSaveable { mutableStateOf(false) }
    var cuentaIngresoSeleccionada by rememberSaveable { mutableStateOf<String?>(null) }
    var cuentaGastoSeleccionada by rememberSaveable { mutableStateOf<String?>(null) }
    val logoPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> uri?.let { tomarPermisoLecturaPersistente(context, it) }; viewModel.updateLogoFacturaUri(uri?.toString()) }
    val firmaVendedorPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> uri?.let { tomarPermisoLecturaPersistente(context, it) }; viewModel.updateFirmaVendedorFacturaUri(uri?.toString()) }
    LaunchedEffect(uiState.posIntegrationConfig) { integracionActiva = uiState.posIntegrationConfig.enabled; cuentaIngresoSeleccionada = uiState.posIntegrationConfig.ingresoCuentaId; cuentaGastoSeleccionada = uiState.posIntegrationConfig.gastoCuentaId }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { Column(verticalArrangement = Arrangement.spacedBy(6.dp)) { Text("Más", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold); Text("Configuración, resumen y reportes del módulo de ventas", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) } }
        item { Card { Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) { Row(modifier = Modifier.fillMaxWidth().clickable { integracionExpanded = !integracionExpanded }, horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) { Text("Integración contable", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold); Text("Totaliza diariamente ventas y compras del punto de venta hacia el registro contable.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }; Icon(if (integracionExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null) }; AnimatedVisibility(visible = integracionExpanded, enter = expandVertically(), exit = shrinkVertically()) { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) { Spacer(Modifier.height(4.dp)); Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) { Text("Activar integración"); Text("Usa cuentas contables para registrar automáticamente ventas y compras del día.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }; Switch(checked = integracionActiva, onCheckedChange = { integracionActiva = it }) }; CuentaContableSelector("Cuenta para ventas", "Selecciona una cuenta acreedora", uiState.cuentasIngresoContables, cuentaIngresoSeleccionada) { cuentaIngresoSeleccionada = it }; CuentaContableSelector("Cuenta para compras", "Selecciona una cuenta deudora", uiState.cuentasGastoContables, cuentaGastoSeleccionada) { cuentaGastoSeleccionada = it }; Button(onClick = { viewModel.actualizarIntegracionContable(integracionActiva, cuentaIngresoSeleccionada, cuentaGastoSeleccionada) }, modifier = Modifier.align(Alignment.End), enabled = !integracionActiva || (!cuentaIngresoSeleccionada.isNullOrBlank() && !cuentaGastoSeleccionada.isNullOrBlank())) { Icon(Icons.Default.Save, null); Spacer(Modifier.width(8.dp)); Text("Guardar") } } } } } }
        item { Card { Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) { Text("Productos archivados", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold); Text("Consulta los productos retirados del almacén y su motivo.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant); OutlinedButton(onClick = { showArchivedDialog = true }, modifier = Modifier.fillMaxWidth()) { Icon(Icons.Default.Inventory2, null); Spacer(Modifier.width(8.dp)); Text("Ver productos archivados") } } } }
        item { Card { Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) { Row(modifier = Modifier.fillMaxWidth().clickable { facturaExpanded = !facturaExpanded }, horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) { Text("Datos de facturación", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold); Text("Empresa, vendedor y recursos visuales para las facturas.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }; Icon(if (facturaExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null) }; AnimatedVisibility(visible = facturaExpanded, enter = expandVertically(), exit = shrinkVertically()) { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) { Spacer(Modifier.height(4.dp)); OutlinedTextField(uiState.nombreEmpresaFactura, viewModel::updateNombreEmpresaFactura, label = { Text("Nombre de la empresa o negocio") }, modifier = Modifier.fillMaxWidth(), singleLine = true); OutlinedTextField(uiState.nombreVendedorFactura, viewModel::updateNombreVendedorFactura, label = { Text("Nombre del vendedor") }, modifier = Modifier.fillMaxWidth(), singleLine = true); OutlinedTextField(uiState.correoVendedorFactura, viewModel::updateCorreoVendedorFactura, label = { Text("Correo electrónico") }, modifier = Modifier.fillMaxWidth(), singleLine = true); OutlinedTextField(uiState.telefonoVendedorFactura, viewModel::updateTelefonoVendedorFactura, label = { Text("Teléfono") }, modifier = Modifier.fillMaxWidth(), singleLine = true); OutlinedTextField(uiState.direccionVendedorFactura, viewModel::updateDireccionVendedorFactura, label = { Text("Dirección") }, modifier = Modifier.fillMaxWidth()); DocumentoAdjuntoField("Logo de la empresa", "Opcional. Se ajusta automáticamente en la factura.", uiState.logoFacturaUri, { logoPicker.launch(arrayOf("image/*")) }) { viewModel.updateLogoFacturaUri(null) }; DocumentoAdjuntoField("Firma del vendedor", "Opcional. Usa una imagen clara sobre fondo simple.", uiState.firmaVendedorFacturaUri, { firmaVendedorPicker.launch(arrayOf("image/*")) }) { viewModel.updateFirmaVendedorFacturaUri(null) }; Button(onClick = viewModel::guardarConfiguracionFacturacion, modifier = Modifier.align(Alignment.End)) { Icon(Icons.Default.Save, null); Spacer(Modifier.width(8.dp)); Text("Guardar") } } } } } }
        item { Card { Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) { Text("Resumen rápido", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold); ResumenOperacionRow("Ventas del día", "%.2f CUP".format(uiState.totalHoy)); ResumenOperacionRow("Compras del día", "%.2f CUP".format(uiState.totalComprasHoy)); ResumenOperacionRow("Ventas del mes", "%.2f CUP".format(uiState.totalVentasMes)); ResumenOperacionRow("Compras del mes", "%.2f CUP".format(uiState.totalComprasMes)); ResumenOperacionRow("Cantidad de ventas", uiState.cantidadVentasMes.toString()); ResumenOperacionRow("Cantidad de compras", uiState.cantidadComprasMes.toString()); Divider(); ResumenOperacionRow("Balance mensual", "%.2f CUP".format(resumenBalanceMes), destacado = true) } } }
        item { Card { Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) { Text("Reportes PDF", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold); Text("Selecciona el periodo y genera un documento con todas las operaciones registradas.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant); Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) { Box(modifier = Modifier.weight(1f)) { DateField("Desde", uiState.reporteDesde, viewModel::setReporteDesde) }; Box(modifier = Modifier.weight(1f)) { DateField("Hasta", uiState.reporteHasta, viewModel::setReporteHasta) } }; Button(onClick = viewModel::generarReporteVentasPdf, modifier = Modifier.fillMaxWidth()) { Icon(Icons.Default.PictureAsPdf, null); Spacer(Modifier.width(8.dp)); Text("Generar reporte de ventas") }; OutlinedButton(onClick = viewModel::generarReporteComprasPdf, modifier = Modifier.fillMaxWidth()) { Icon(Icons.Default.ReceiptLong, null); Spacer(Modifier.width(8.dp)); Text("Generar reporte de compras") } } } }
    }
    if (showArchivedDialog) ArchivedInventoryDialog(items = uiState.itemsInventarioArchivados, productosBase = uiState.productosBase, onRestore = { viewModel.restaurarItemInventario(it) }, onDismiss = { showArchivedDialog = false })
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CuentaContableSelector(label: String, placeholder: String, cuentas: List<CuentaContable>, selectedCuentaId: String?, onCuentaSelected: (String) -> Unit) { var expanded by remember { mutableStateOf(false) }; val cuentaSeleccionada = cuentas.firstOrNull { it.id == selectedCuentaId }; ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) { OutlinedTextField(value = cuentaSeleccionada?.let { "${it.codigo} · ${it.nombre}" } ?: "", onValueChange = {}, readOnly = true, label = { Text(label) }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) }, modifier = Modifier.menuAnchor().fillMaxWidth(), placeholder = { Text(placeholder) }); ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) { cuentas.forEach { cuenta -> DropdownMenuItem(text = { Text("${cuenta.codigo} · ${cuenta.nombre}") }, onClick = { onCuentaSelected(cuenta.id); expanded = false }) } } } }

@Composable private fun ResumenOperacionRow(label: String, value: String, destacado: Boolean = false) { Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Text(label, style = if (destacado) MaterialTheme.typography.titleSmall else MaterialTheme.typography.bodyMedium, fontWeight = if (destacado) FontWeight.Bold else FontWeight.Normal); Text(value, style = if (destacado) MaterialTheme.typography.titleSmall else MaterialTheme.typography.bodyMedium, fontWeight = if (destacado) FontWeight.Bold else FontWeight.Medium, color = if (destacado) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface) } }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DateField(label: String, fecha: LocalDate, onFechaChange: (LocalDate) -> Unit) { val formatter = remember { DateTimeFormatter.ofPattern("dd/MM/yyyy") }; var showDatePicker by remember { mutableStateOf(false) }; Box(modifier = Modifier.fillMaxWidth()) { OutlinedTextField(value = fecha.format(formatter), onValueChange = {}, modifier = Modifier.fillMaxWidth(), readOnly = true, label = { Text(label) }, trailingIcon = { Icon(Icons.Default.DateRange, null) }); Box(modifier = Modifier.matchParentSize().clickable { showDatePicker = true }) }; if (showDatePicker) { val initialMillis = remember(fecha) { fecha.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli() }; val state = rememberDatePickerState(initialSelectedDateMillis = initialMillis); DatePickerDialog(onDismissRequest = { showDatePicker = false }, confirmButton = { TextButton(onClick = { state.selectedDateMillis?.let { onFechaChange(Instant.ofEpochMilli(it).atZone(ZoneOffset.UTC).toLocalDate()) }; showDatePicker = false }) { Text("Aceptar") } }, dismissButton = { TextButton(onClick = { showDatePicker = false }) { Text("Cancelar") } }) { DatePicker(state = state) } } }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FacturaDialog(lineas: List<LineaVenta>, onDismiss: () -> Unit, onConfirm: (String, String, String, String, String, FormaPago, String?, String, String?) -> Unit) { val context = LocalContext.current; var nombre by remember { mutableStateOf("") }; var ci by remember { mutableStateOf("") }; var correo by remember { mutableStateOf("") }; var direccion by remember { mutableStateOf("") }; var telefono by remember { mutableStateOf("") }; var formaPago by remember { mutableStateOf(FormaPago.EFECTIVO) }; var idTransaccion by remember { mutableStateOf("") }; var nota by remember { mutableStateOf("") }; var firmaClienteUri by remember { mutableStateOf<String?>(null) }; var formaPagoExpanded by remember { mutableStateOf(false) }; val firmaClientePicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> uri?.let { tomarPermisoLecturaPersistente(context, it) }; firmaClienteUri = uri?.toString() }; AlertDialog(onDismissRequest = onDismiss, title = { Text("Generar Factura") }, text = { Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.verticalScroll(rememberScrollState())) { OutlinedTextField(nombre, { nombre = it }, label = { Text("Nombre del cliente") }, singleLine = true, modifier = Modifier.fillMaxWidth()); OutlinedTextField(ci, { ci = it }, label = { Text("No. de Carnet de Identidad") }, singleLine = true, modifier = Modifier.fillMaxWidth()); OutlinedTextField(correo, { correo = it }, label = { Text("Correo electrónico") }, singleLine = true, modifier = Modifier.fillMaxWidth()); OutlinedTextField(direccion, { direccion = it }, label = { Text("Dirección") }, modifier = Modifier.fillMaxWidth()); OutlinedTextField(telefono, { telefono = it }, label = { Text("Teléfono") }, singleLine = true, modifier = Modifier.fillMaxWidth()); ExposedDropdownMenuBox(expanded = formaPagoExpanded, onExpandedChange = { formaPagoExpanded = it }) { OutlinedTextField(value = if (formaPago == FormaPago.EFECTIVO) "Efectivo" else "Tarjeta", onValueChange = {}, readOnly = true, label = { Text("Forma de pago") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(formaPagoExpanded) }, modifier = Modifier.fillMaxWidth().menuAnchor()); ExposedDropdownMenu(expanded = formaPagoExpanded, onDismissRequest = { formaPagoExpanded = false }) { DropdownMenuItem(text = { Text("Efectivo") }, onClick = { formaPago = FormaPago.EFECTIVO; formaPagoExpanded = false }); DropdownMenuItem(text = { Text("Tarjeta") }, onClick = { formaPago = FormaPago.TARJETA; formaPagoExpanded = false }) } }; if (formaPago == FormaPago.TARJETA) OutlinedTextField(idTransaccion, { idTransaccion = it }, label = { Text("ID de transacción") }, singleLine = true, modifier = Modifier.fillMaxWidth()); DocumentoAdjuntoField("Firma del cliente", "Opcional. Si no se agrega, se deja el espacio para firmar.", firmaClienteUri, { firmaClientePicker.launch(arrayOf("image/*")) }) { firmaClienteUri = null }; OutlinedTextField(nota, { nota = it }, label = { Text("Nota en la factura") }, modifier = Modifier.fillMaxWidth(), minLines = 3, maxLines = 5); if (lineas.isNotEmpty()) Text("Productos: ${lineas.size}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) } }, confirmButton = { TextButton(onClick = { onConfirm(nombre.trim(), ci.trim(), correo.trim(), direccion.trim(), telefono.trim(), formaPago, idTransaccion.trim().ifBlank { null }, nota.trim(), firmaClienteUri) }, enabled = nombre.isNotBlank() && ci.isNotBlank()) { Text("Generar") } }, dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }) }

// ─── Helpers privados ─────────────────────────────────────────────────────────
private fun permiteFraccion(unidad: String) = unidad.trim().lowercase(Locale.ROOT) in setOf("kg", "g", "libra", "litro", "ml")
private fun esEntradaCantidadValida(valor: String, permiteFraccion: Boolean): Boolean { val n = valor.replace(',', '.'); return if (permiteFraccion) Regex("^\\d*(\\.\\d{0,2})?$").matches(n) else Regex("^\\d*$").matches(n) }
private fun parseCantidad(valor: String, permiteFraccion: Boolean): Double? { val n = valor.replace(',', '.').trim(); if (n.isEmpty()) return null; val num = n.toDoubleOrNull() ?: return null; return if (permiteFraccion) num else if (num % 1.0 == 0.0) num else null }
private fun formatCantidad(cantidad: Double, permiteFraccion: Boolean): String = if (!permiteFraccion || cantidad % 1.0 == 0.0) cantidad.toInt().toString() else "%.2f".format(cantidad).trimEnd('0').trimEnd('.')
private fun formatCantidad(cantidad: Double): String = if (cantidad % 1.0 == 0.0) cantidad.toInt().toString() else "%.2f".format(cantidad).trimEnd('0').trimEnd('.')
private fun formatFechaHoraOperacion(fecha: String, hora: String): String { val fechaF = runCatching { LocalDate.parse(fecha).format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) }.getOrElse { fecha }; val horaF = runCatching { val fmt = listOf(DateTimeFormatter.ofPattern("HH:mm"), DateTimeFormatter.ofPattern("HH:mm:ss"), DateTimeFormatter.ofPattern("h:mm a", Locale.US)).firstNotNullOfOrNull { runCatching { LocalTime.parse(hora, it) }.getOrNull() } ?: return@runCatching hora; fmt.format(DateTimeFormatter.ofPattern("hh:mm a", Locale.US)) }.getOrElse { hora }; return "$fechaF $horaF" }
private fun List<LineaCompra>.resumenProductosCompra(): String { val r = take(2).joinToString(", ") { it.nombreProducto }; return if (size > 2) "$r +${size - 2}" else r }
private fun List<LineaVenta>.resumenProductosVenta(): String { val r = take(2).joinToString(", ") { it.nombreProducto }; return if (size > 2) "$r +${size - 2}" else r }
private fun tomarPermisoLecturaPersistente(context: android.content.Context, uri: Uri) { runCatching { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) } }
private fun resumenDocumentoAdjunto(uri: String): String = runCatching { Uri.parse(uri).lastPathSegment }.getOrNull().orEmpty().substringAfterLast('/').ifBlank { "Archivo seleccionado" }
