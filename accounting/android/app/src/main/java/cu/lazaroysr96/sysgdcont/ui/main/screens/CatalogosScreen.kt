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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.Almacen
import cu.lazaroysr96.sysgdcont.data.model.CuentaContable
import cu.lazaroysr96.sysgdcont.data.model.ItemInventario
import cu.lazaroysr96.sysgdcont.data.model.ModoStock
import cu.lazaroysr96.sysgdcont.data.model.NaturalezaCuenta
import cu.lazaroysr96.sysgdcont.data.model.PrecioProductoDetalle
import cu.lazaroysr96.sysgdcont.data.model.TipoPrecio
import cu.lazaroysr96.sysgdcont.data.model.TipoCuenta
import cu.lazaroysr96.sysgdcont.data.model.UsoOperativoCuenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.viewmodel.InventarioViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel
import cu.lazaroysr96.sysgdcont.ui.components.producto.ChevronTrailing
import cu.lazaroysr96.sysgdcont.ui.components.producto.ProductoFormDialog
import cu.lazaroysr96.sysgdcont.ui.components.producto.ProductoItem

import coil.compose.AsyncImage
import androidx.compose.ui.graphics.Brush
import java.io.File
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.draw.clip

// Shapes y layout
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.background
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.graphics.Color

// Dialog
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

// Imagen
import androidx.compose.ui.res.painterResource

// ProductoImagen — ajusta el paquete según donde esté definida en tu proyecto
import cu.lazaroysr96.sysgdcont.ui.components.producto.toProductoImagen
import cu.lazaroysr96.sysgdcont.ui.fichacosto.FichaCostoProductoPreferences
import cu.lazaroysr96.sysgdcont.ui.fichacosto.FichaCostoScreen
import cu.lazaroysr96.sysgdcont.ui.fichacosto.FichaCostoViewModel

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
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(productosState.snackbarMessage) {
        productosState.snackbarMessage?.let { message ->
            snackbarHostState.showSnackbar(message)
            inventarioViewModel.clearSnackbar()
        }
    }

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
    Column(modifier = Modifier.fillMaxSize().padding(padding)) {
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
                productos        = productosState.productosBase,
                almacenes        = productosState.almacenes,
                itemsInventario  = (productosState.itemsInventarioVenta + productosState.itemsInventarioCompra).distinctBy { it.id },
                onAddProduct     = inventarioViewModel::agregarProductoBase,
                onEditProduct    = inventarioViewModel::actualizarProductoBase,
                onDeleteProduct  = inventarioViewModel::deleteProductoBase,
                onUpdatePrice    = inventarioViewModel::actualizarPrecioProductoCatalogo,
                onUpdateStock    = inventarioViewModel::ajustarInventarioProductoCatalogo,
                loadPriceHistory = inventarioViewModel::obtenerHistorialPreciosProducto
            )
        }
    }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductosTab
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun ProductosTab(
    productos: List<Producto>,
    almacenes: List<Almacen>,
    itemsInventario: List<ItemInventario>,
    onAddProduct:  (nombre: String, imagenJson: String, unidad: String, descripcion: String) -> Unit,
    onEditProduct: (id: String, nombre: String, imagenJson: String, unidad: String, descripcion: String) -> Unit,
    onDeleteProduct: (id: String) -> Unit,
    onUpdatePrice: (productoId: String, tipoPrecio: String, precio: Double, almacenId: String) -> Unit,
    onUpdateStock: (productoId: String, almacenId: String, cantidad: Double, modo: ModoStock) -> Unit,
    loadPriceHistory: suspend (String) -> List<PrecioProductoDetalle>
) {
    var productoDetalle  by remember { mutableStateOf<Producto?>(null) }
    var productoEditando by remember { mutableStateOf<Producto?>(null) }
    var showAddDialog    by remember { mutableStateOf(false) }
    var searchQuery      by remember { mutableStateOf("") }

    val filteredProducts = remember(productos, searchQuery) {
        if (searchQuery.isBlank()) productos
        else productos.filter {
            it.nombre.contains(searchQuery, ignoreCase = true) ||
                it.unidad.contains(searchQuery, ignoreCase = true) ||
                it.descripcion.contains(searchQuery, ignoreCase = true)
        }
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
                        onClick  = { productoDetalle = producto },
                        trailing = { ChevronTrailing() }
                    )
                }
            }
        }
    }

    // Diálogo agregar
    if (showAddDialog) {
        ProductoFormDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { nombre, imagenJson, unidad, descripcion ->
                onAddProduct(nombre, imagenJson, unidad, descripcion)
                showAddDialog = false
            }
        )
    }

    productoDetalle?.let { producto ->
        ProductoDetalleDialog(
            producto = producto,
            almacenes = almacenes,
            itemsInventario = itemsInventario.filter { it.productoId == producto.id },
            loadPriceHistory = loadPriceHistory,
            onUpdatePrice = onUpdatePrice,
            onUpdateStock = onUpdateStock,
            onDismiss = { productoDetalle = null },
            onEdit = {
                productoDetalle = null
                productoEditando = producto
            },
            onDelete = {
                onDeleteProduct(producto.id)
                productoDetalle = null
            }
        )
    }

    // Diálogo editar — se activa cuando productoEditando != null
    productoEditando?.let { p ->
        ProductoFormDialog(
            producto  = p,
            onDismiss = { productoEditando = null },
            onConfirm = { nombre, imagenJson, unidad, descripcion ->
                onEditProduct(p.id, nombre, imagenJson, unidad, descripcion)
                productoEditando = null
            }
        )
    }
}


@Composable
private fun ProductoDetalleDialog(
    producto: Producto,
    almacenes: List<Almacen>,
    itemsInventario: List<ItemInventario>,
    loadPriceHistory: suspend (String) -> List<PrecioProductoDetalle>,
    onUpdatePrice: (productoId: String, tipoPrecio: String, precio: Double, almacenId: String) -> Unit,
    onUpdateStock: (productoId: String, almacenId: String, cantidad: Double, modo: ModoStock) -> Unit,
    onDismiss: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    val historial by produceState<List<PrecioProductoDetalle>>(
        initialValue = emptyList(),
        key1 = producto.id
    ) {
        value = runCatching { loadPriceHistory(producto.id) }.getOrDefault(emptyList())
    }
    val preciosVenta = remember(historial) { historial.filter { it.tipoPrecio == TipoPrecio.VENTA && it.activo } }
    val preciosCompra = remember(historial) { historial.filter { it.tipoPrecio == TipoPrecio.COMPRA && it.activo } }
    val imagen = remember(producto.emoji) { producto.emoji.toProductoImagen() }
    val colorScheme = MaterialTheme.colorScheme
    val context = LocalContext.current
    var priceEditor by remember { mutableStateOf<String?>(null) }
    var stockEditorOpen by remember { mutableStateOf(false) }
    var fichaCostoOpen by remember { mutableStateOf(false) }
    var fichaCostoExiste by remember(producto.id) {
        mutableStateOf(FichaCostoProductoPreferences.hasFicha(context, producto.id))
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .wrapContentHeight(),
            shape = RoundedCornerShape(24.dp),
            color = colorScheme.surface,
            tonalElevation = 6.dp
        ) {
            Column {

                // ── Hero ─────────────────────────────────────────────────────
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    colorScheme.primaryContainer,
                                    colorScheme.secondaryContainer
                                )
                            )
                        )
                        .padding(24.dp),
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Imagen / emoji / url / foto
                        Surface(
                            modifier = Modifier.size(72.dp),
                            shape = RoundedCornerShape(20.dp),
                            color = colorScheme.surface.copy(alpha = 0.35f),
                            tonalElevation = 0.dp
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                when (imagen.type) {
                                    "emoji" -> Text(
                                        text = imagen.data.ifBlank { "📦" },
                                        style = MaterialTheme.typography.displaySmall
                                    )
                                    "url" -> AsyncImage(
                                        model = imagen.data,
                                        contentDescription = producto.nombre,
                                        modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(20.dp)),
                                        contentScale = ContentScale.Crop,
                                        error = painterResource(android.R.drawable.ic_menu_gallery)
                                    )
                                    "foto" -> AsyncImage(
                                        model = File(imagen.data),
                                        contentDescription = producto.nombre,
                                        modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(20.dp)),
                                        contentScale = ContentScale.Crop,
                                        error = painterResource(android.R.drawable.ic_menu_gallery)
                                    )
                                    else -> Text("📦", style = MaterialTheme.typography.displaySmall)
                                }
                            }
                        }

                        Column(
                            verticalArrangement = Arrangement.spacedBy(4.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(
                                text = producto.nombre,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = colorScheme.onPrimaryContainer
                            )
                            Surface(
                                shape = RoundedCornerShape(999.dp),
                                color = colorScheme.surface.copy(alpha = 0.40f)
                            ) {
                                Text(
                                    text = producto.unidad,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = colorScheme.onPrimaryContainer,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                            if (producto.descripcion.isNotBlank()) {
                                Text(
                                    text = producto.descripcion,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colorScheme.onPrimaryContainer.copy(alpha = 0.80f),
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }

                // ── Cuerpo ────────────────────────────────────────────────────
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {

                    // Precios vigentes
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        PrecioVigenteCard(
                            titulo = "Venta",
                            precios = preciosVenta,
                            containerColor = colorScheme.primaryContainer,
                            contentColor = colorScheme.onPrimaryContainer,
                            modifier = Modifier.weight(1f).fillMaxHeight(),
                            onEdit = { priceEditor = TipoPrecio.VENTA }
                        )
                        PrecioVigenteCard(
                            titulo = "Compra",
                            precios = preciosCompra,
                            containerColor = colorScheme.secondaryContainer,
                            contentColor = colorScheme.onSecondaryContainer,
                            modifier = Modifier.weight(1f).fillMaxHeight(),
                            onEdit = { priceEditor = TipoPrecio.COMPRA }
                        )
                    }

                    InventoryAvailabilitySection(
                        items = itemsInventario,
                        almacenes = almacenes,
                        onEdit = { stockEditorOpen = true }
                    )

                    FichaCostoProductActionCard(
                        fichaExiste = fichaCostoExiste,
                        onClick = { fichaCostoOpen = true }
                    )

                    // Historial
                    if (historial.isNotEmpty()) {
                        Text(
                            text = "Historial de precios",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = colorScheme.onSurface
                        )
                        historial.forEach { item ->
                            HistorialPrecioItem(item)
                        }
                    } else {
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "Todavía no hay cambios de precio registrados.",
                                style = MaterialTheme.typography.bodySmall,
                                color = colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    }
                }

                // ── Botones ───────────────────────────────────────────────────
                Divider(color = colorScheme.outlineVariant)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) { Text("Cerrar") }
                    Spacer(Modifier.width(8.dp))
                    Button(onClick = onDelete) {
                        Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Eliminar")
                    }
                    Spacer(Modifier.width(8.dp))
                    Button(onClick = onEdit) {
                        Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Editar")
                    }
                }
            }
        }
    }

    if (fichaCostoOpen) {
        ProductoFichaCostoDialog(
            producto = producto,
            onDismiss = { fichaCostoOpen = false },
            onSaved = {
                fichaCostoExiste = true
                fichaCostoOpen = false
            }
        )
    }

    priceEditor?.let { tipoPrecio ->
        EditPriceDialog(
            producto = producto,
            tipoPrecio = tipoPrecio,
            almacenes = almacenes,
            currentPrice = (if (tipoPrecio == TipoPrecio.VENTA) preciosVenta else preciosCompra).firstOrNull(),
            onDismiss = { priceEditor = null },
            onConfirm = { almacenId, precio ->
                onUpdatePrice(producto.id, tipoPrecio, precio, almacenId)
                priceEditor = null
            }
        )
    }

    if (stockEditorOpen) {
        EditStockDialog(
            producto = producto,
            almacenes = almacenes,
            items = itemsInventario,
            onDismiss = { stockEditorOpen = false },
            onConfirm = { almacenId, cantidad, modo ->
                onUpdateStock(producto.id, almacenId, cantidad, modo)
                stockEditorOpen = false
            }
        )
    }
}


@Composable
private fun FichaCostoProductActionCard(
    fichaExiste: Boolean,
    onClick: () -> Unit,
) {
    val colorScheme = MaterialTheme.colorScheme
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = colorScheme.tertiaryContainer.copy(alpha = 0.45f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = "Ficha de costo del producto",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = colorScheme.onTertiaryContainer
            )
            Text(
                text = "Se guardará temporalmente en las preferencias internas de la app hasta que esta función pase oficialmente a la base de datos.",
                style = MaterialTheme.typography.bodySmall,
                color = colorScheme.onTertiaryContainer.copy(alpha = 0.78f)
            )
            OutlinedButton(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.Description, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(if (fichaExiste) "Ver ficha de costos" else "Definir ficha de costo")
            }
        }
    }
}

@Composable
private fun ProductoFichaCostoDialog(
    producto: Producto,
    onDismiss: () -> Unit,
    onSaved: () -> Unit,
) {
    val context = LocalContext.current
    val vm = remember(producto.id) {
        FichaCostoViewModel().apply {
            inicializarParaProducto(
                productoId = producto.id,
                productoNombre = producto.nombre,
                unidadMedida = producto.unidad,
                fichaGuardada = FichaCostoProductoPreferences.loadFicha(context, producto.id)
            )
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.98f)
                .fillMaxHeight(0.92f),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 6.dp
        ) {
            Column(Modifier.fillMaxSize()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Ficha de costo",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = producto.nombre,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    TextButton(onClick = onDismiss) { Text("Cerrar") }
                }
                Divider()
                Box(modifier = Modifier.weight(1f)) {
                    FichaCostoScreen(vm = vm)
                }
                Divider()
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) { Text("Cancelar") }
                    Spacer(Modifier.width(8.dp))
                    Button(onClick = {
                        FichaCostoProductoPreferences.saveFicha(context, producto.id, vm.toPersistida())
                        onSaved()
                    }) {
                        Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Guardar ficha")
                    }
                }
            }
        }
    }
}

// ── Auxiliares ────────────────────────────────────────────────────────────────

@Composable
private fun PrecioVigenteCard(
    titulo: String,
    precios: List<PrecioProductoDetalle>,
    containerColor: Color,
    contentColor: Color,
    modifier: Modifier = Modifier,
    onEdit: () -> Unit = {}
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = containerColor
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = titulo,
                    style = MaterialTheme.typography.labelMedium,
                    color = contentColor.copy(alpha = 0.75f)
                )
                IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Edit, contentDescription = "Editar precio", tint = contentColor)
                }
            }
            if (precios.isEmpty()) {
                Text(
                    text = "Sin precio",
                    style = MaterialTheme.typography.bodySmall,
                    color = contentColor.copy(alpha = 0.60f)
                )
            } else {
                precios.forEach { item ->
                    Text(
                        text = "${"%.2f".format(item.precio)} ${item.moneda}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = contentColor
                    )
                    if (item.almacenNombre != null) {
                        Text(
                            text = item.almacenNombre,
                            style = MaterialTheme.typography.bodySmall,
                            color = contentColor.copy(alpha = 0.70f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HistorialPrecioItem(item: PrecioProductoDetalle) {
    val colorScheme = MaterialTheme.colorScheme
    val isVigente = item.activo
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = if (isVigente)
            colorScheme.primaryContainer.copy(alpha = 0.35f)
        else
            colorScheme.surfaceVariant.copy(alpha = 0.45f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = TipoPrecio.label(item.tipoPrecio),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = colorScheme.onSurface
                    )
                    Text(
                        text = "·",
                        color = colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = item.almacenNombre ?: "Almacén",
                        style = MaterialTheme.typography.labelMedium,
                        color = colorScheme.onSurfaceVariant
                    )
                }
                Text(
                    text = if (isVigente) "Vigente desde ${item.fechaDesde}"
                           else "${item.fechaDesde} → ${item.fechaHasta ?: "sin cierre"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "${"%.2f".format(item.precio)} ${item.moneda}",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = colorScheme.onSurface
                )
                if (isVigente) {
                    Surface(
                        shape = RoundedCornerShape(999.dp),
                        color = colorScheme.primary.copy(alpha = 0.15f)
                    ) {
                        Text(
                            text = "Activo",
                            style = MaterialTheme.typography.labelSmall,
                            color = colorScheme.primary,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                }
            }
        }
    }
}












@Composable
private fun InventoryAvailabilitySection(
    items: List<ItemInventario>,
    almacenes: List<Almacen>,
    onEdit: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Inventario disponible", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                TextButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Modificar")
                }
            }
            if (items.isEmpty()) {
                Text("Sin inventario registrado", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                items.forEach { item ->
                    val almacen = almacenes.firstOrNull { it.id == item.almacenId }?.nombre ?: item.almacenId
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(almacen, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
                        Text(
                            text = if (item.modoStock == ModoStock.ILIMITADO.name) "Ilimitado" else "${"%.2f".format(item.stockDisponible)}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun EditPriceDialog(
    producto: Producto,
    tipoPrecio: String,
    almacenes: List<Almacen>,
    currentPrice: PrecioProductoDetalle?,
    onDismiss: () -> Unit,
    onConfirm: (String, Double) -> Unit
) {
    val defaultAlmacen = currentPrice?.almacenId ?: almacenes.firstOrNull()?.id.orEmpty()
    var almacenId by remember(defaultAlmacen) { mutableStateOf(defaultAlmacen) }
    var precioText by remember(currentPrice) { mutableStateOf(currentPrice?.precio?.toString().orEmpty()) }
    val precio = precioText.replace(',', '.').toDoubleOrNull()
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Editar precio de ${TipoPrecio.label(tipoPrecio).lowercase()}") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(producto.nombre, style = MaterialTheme.typography.titleSmall)
                AlmacenSelector(almacenes = almacenes, selectedId = almacenId, onSelected = { almacenId = it })
                OutlinedTextField(
                    value = precioText,
                    onValueChange = { precioText = it },
                    label = { Text("Precio") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                enabled = almacenId.isNotBlank() && precio != null && precio >= 0.0,
                onClick = { onConfirm(almacenId, precio ?: 0.0) }
            ) { Text("Guardar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EditStockDialog(
    producto: Producto,
    almacenes: List<Almacen>,
    items: List<ItemInventario>,
    onDismiss: () -> Unit,
    onConfirm: (String, Double, ModoStock) -> Unit
) {
    val defaultItem = items.firstOrNull()
    val defaultAlmacen = defaultItem?.almacenId ?: almacenes.firstOrNull()?.id.orEmpty()
    var almacenId by remember(defaultAlmacen) { mutableStateOf(defaultAlmacen) }
    val selectedItem = items.firstOrNull { it.almacenId == almacenId }
    var cantidadText by remember(selectedItem) { mutableStateOf((selectedItem?.stockDisponible ?: 0.0).toString()) }
    var modo by remember(selectedItem) { mutableStateOf(runCatching { ModoStock.valueOf(selectedItem?.modoStock ?: ModoStock.MANUAL.name) }.getOrDefault(ModoStock.MANUAL)) }
    val cantidad = cantidadText.replace(',', '.').toDoubleOrNull()
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Modificar inventario") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(producto.nombre, style = MaterialTheme.typography.titleSmall)
                AlmacenSelector(almacenes = almacenes, selectedId = almacenId, onSelected = { almacenId = it })
                OutlinedTextField(
                    value = cantidadText,
                    onValueChange = { cantidadText = it },
                    label = { Text("Cantidad disponible") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(ModoStock.MANUAL, ModoStock.ILIMITADO).forEach { option ->
                        FilterChip(
                            selected = modo == option,
                            onClick = { modo = option },
                            label = { Text(option.name.lowercase().replaceFirstChar { it.uppercase() }) }
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                enabled = almacenId.isNotBlank() && cantidad != null && cantidad >= 0.0,
                onClick = { onConfirm(almacenId, cantidad ?: 0.0, modo) }
            ) { Text("Guardar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}

@Composable
private fun AlmacenSelector(
    almacenes: List<Almacen>,
    selectedId: String,
    onSelected: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedName = almacenes.firstOrNull { it.id == selectedId }?.nombre ?: "Seleccionar almacén"
    Box {
        OutlinedButton(onClick = { expanded = true }, modifier = Modifier.fillMaxWidth()) {
            Text(selectedName, modifier = Modifier.weight(1f))
            Icon(Icons.Default.ArrowDropDown, contentDescription = null)
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            almacenes.forEach { almacen ->
                DropdownMenuItem(
                    text = { Text(if (almacen.principal) "${almacen.nombre} (principal)" else almacen.nombre) },
                    onClick = {
                        onSelected(almacen.id)
                        expanded = false
                    }
                )
            }
        }
    }
}


@Composable
private fun ProductoDetalleDato(label: String, valor: String) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(valor, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun ProductoPrecioVigenteBlock(
    titulo: String,
    precios: List<PrecioProductoDetalle>
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(titulo, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
        if (precios.isEmpty()) {
            Text(
                "Sin precio vigente",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            precios.forEach { item ->
                Text(
                    "${item.almacenNombre ?: "Almacen"}: ${"%.2f".format(item.precio)} ${item.moneda}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CuentasTab — sin cambios respecto al original
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun CuentasTab(
    cuentas: List<CuentaContable>,
    saldoPorCuentaId: Map<String, Double>,
    onAddCuenta: (codigo: String, nombre: String, naturaleza: String, tipo: String, usoOperativo: String) -> Unit
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
            onConfirm = { codigo, nombre, naturaleza, tipo, usoOperativo ->
                onAddCuenta(codigo, nombre, naturaleza, tipo, usoOperativo)
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
    onConfirm: (codigo: String, nombre: String, naturaleza: String, tipo: String, usoOperativo: String) -> Unit
) {
    var codigo             by remember { mutableStateOf("") }
    var nombre             by remember { mutableStateOf("") }
    var naturaleza         by remember { mutableStateOf("ACREEDORA") }
    var tipo               by remember { mutableStateOf("INGRESO") }
    var usoOperativo       by remember { mutableStateOf(UsoOperativoCuenta.INGRESO) }
    var expandedNaturaleza by remember { mutableStateOf(false) }
    var expandedTipo       by remember { mutableStateOf(false) }
    var expandedUso        by remember { mutableStateOf(false) }

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
                        NaturalezaCuenta.todos.forEach { nat ->
                            DropdownMenuItem(text = { Text(NaturalezaCuenta.label(nat)) }, onClick = { naturaleza = nat; expandedNaturaleza = false })
                        }
                    }
                }

                ExposedDropdownMenuBox(expanded = expandedTipo, onExpandedChange = { expandedTipo = !expandedTipo }) {
                    OutlinedTextField(value = tipo, onValueChange = {}, readOnly = true, label = { Text("Tipo") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedTipo) }, modifier = Modifier.menuAnchor().fillMaxWidth())
                    ExposedDropdownMenu(expanded = expandedTipo, onDismissRequest = { expandedTipo = false }) {
                        TipoCuenta.todos.forEach { t ->
                            DropdownMenuItem(
                                text = { Text(TipoCuenta.label(t)) },
                                onClick = {
                                    tipo = t
                                    expandedTipo = false
                                }
                            )
                        }
                    }
                }

                ExposedDropdownMenuBox(expanded = expandedUso, onExpandedChange = { expandedUso = !expandedUso }) {
                    OutlinedTextField(value = UsoOperativoCuenta.label(usoOperativo), onValueChange = {}, readOnly = true, label = { Text("Uso operativo") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedUso) }, modifier = Modifier.menuAnchor().fillMaxWidth())
                    ExposedDropdownMenu(expanded = expandedUso, onDismissRequest = { expandedUso = false }) {
                        UsoOperativoCuenta.todos.forEach { uso ->
                            DropdownMenuItem(text = { Text(UsoOperativoCuenta.label(uso)) }, onClick = { usoOperativo = uso; expandedUso = false })
                        }
                    }
                }

            }
        },
        confirmButton = { TextButton(onClick = { onConfirm(codigo, nombre, naturaleza, tipo, usoOperativo) }, enabled = codigo.isNotBlank() && nombre.isNotBlank()) { Text("Guardar") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}
