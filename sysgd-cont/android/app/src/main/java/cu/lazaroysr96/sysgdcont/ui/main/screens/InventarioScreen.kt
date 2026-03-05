package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
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
import cu.lazaroysr96.sysgdcont.data.model.ProductoCompra
import cu.lazaroysr96.sysgdcont.data.model.Compra
import cu.lazaroysr96.sysgdcont.data.model.LineaCompra
import cu.lazaroysr96.sysgdcont.viewmodel.InventarioViewModel
import java.time.LocalDate
import java.time.LocalTime
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

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
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = uiState.currentTab == 0,
                    onClick = { viewModel.setCurrentTab(0) },
                    icon = { Icon(Icons.Default.PointOfSale, "Vender") },
                    label = { Text("Venta") }
                )
                NavigationBarItem(
                    selected = uiState.currentTab == 1,
                    onClick = { viewModel.setCurrentTab(1) },
                    icon = { Icon(Icons.Default.ShoppingCart, "Comprar") },
                    label = { Text("Compra") }
                )
                NavigationBarItem(
                    selected = uiState.currentTab == 2,
                    onClick = { viewModel.setCurrentTab(2) },
                    icon = { Icon(Icons.Default.History, "Historial") },
                    label = { Text("Historial") }
                )
            }
        },
        floatingActionButton = {
            Column {
                if (uiState.currentTab == 0 && uiState.cart.isNotEmpty()) {
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
                if (uiState.currentTab == 1 && uiState.cartCompra.isNotEmpty()) {
                    FloatingActionButton(
                        onClick = { viewModel.showPurchaseSheet(true) },
                        containerColor = MaterialTheme.colorScheme.secondary
                    ) {
                        BadgedBox(
                            badge = { Badge { Text(viewModel.cartCompraItemCount.toString()) } }
                        ) {
                            Icon(Icons.Default.ShoppingCart, "Carrito")
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
                if (uiState.currentTab == 0) {
                    FloatingActionButton(
                        onClick = { viewModel.showCatalog(true) },
                        containerColor = MaterialTheme.colorScheme.tertiary
                    ) {
                        Icon(Icons.Default.Add, "Agregar producto")
                    }
                }
                if (uiState.currentTab == 1) {
                    FloatingActionButton(
                        onClick = { viewModel.showCatalogCompra(true) },
                        containerColor = MaterialTheme.colorScheme.tertiary
                    ) {
                        Icon(Icons.Default.Add, "Agregar insumo")
                    }
                }
            }
        }
    ) { padding ->
        when (uiState.currentTab) {
            0 -> PuntoVentaContent(viewModel, padding)
            1 -> PuntoCompraContent(viewModel, padding)
            2 -> HistorialContent(viewModel, padding)
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

    if (uiState.showCatalogCompra) {
        ProductCatalogCompraSheet(
            productos = uiState.productosCompra,
            onAdd = { nombre, precio, emoji, unidad ->
                viewModel.agregarProductoCompra(nombre, precio, emoji, unidad)
            },
            onEliminar = viewModel::eliminarProductoCompra,
            onDismiss = { viewModel.showCatalogCompra(false) }
        )
    }

    if (uiState.showPurchaseSheet) {
        PurchaseCartSheet(
            cart = uiState.cartCompra,
            total = viewModel.cartCompraTotal,
            onAdd = viewModel::addToCartCompra,
            onRemove = viewModel::removeFromCartCompra,
            onRegistrar = viewModel::registrarCompra,
            onDismiss = { viewModel.showPurchaseSheet(false) }
        )
    }
}

@Composable
private fun PuntoVentaContent(viewModel: InventarioViewModel, padding: PaddingValues) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

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
}

@Composable
private fun PuntoCompraContent(viewModel: InventarioViewModel, padding: PaddingValues) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var productoSeleccionado by remember { mutableStateOf<ProductoCompra?>(null) }
    var cantidadSeleccionada by remember { mutableStateOf("1") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding)
            .padding(16.dp)
    ) {
        Text(
            "Registro de Compras",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.secondaryContainer
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
                        "Compras de hoy",
                        style = MaterialTheme.typography.labelMedium
                    )
                    Text(
                        "${uiState.comprasHoy.size} transacciones",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                Text(
                    "%.2f CUP".format(uiState.totalComprasHoy),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.secondary
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            "Insumos disponibles",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )

        Spacer(modifier = Modifier.height(8.dp))

        if (uiState.productosCompra.isEmpty()) {
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
                        "No hay insumos",
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
                items(uiState.productosCompra) { producto ->
                    ProductCardCompra(
                        producto = producto,
                        onClick = {
                            productoSeleccionado = producto
                            cantidadSeleccionada = "1"
                        }
                    )
                }
            }
        }
    }

    if (productoSeleccionado != null) {
        val cantidad = cantidadSeleccionada.toIntOrNull() ?: 0
        AlertDialog(
            onDismissRequest = { productoSeleccionado = null },
            title = { Text("Cantidad a comprar") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        productoSeleccionado?.nombre.orEmpty(),
                        fontWeight = FontWeight.SemiBold
                    )
                    OutlinedTextField(
                        value = cantidadSeleccionada,
                        onValueChange = { nueva ->
                            if (nueva.isEmpty() || nueva.all(Char::isDigit)) {
                                cantidadSeleccionada = nueva
                            }
                        },
                        label = { Text("Cantidad") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text(
                        "Precio unitario: %.2f CUP".format(productoSeleccionado?.precio ?: 0.0),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        productoSeleccionado?.let { viewModel.addToCartCompra(it, cantidad) }
                        productoSeleccionado = null
                    },
                    enabled = cantidad > 0
                ) {
                    Text("Aceptar")
                }
            },
            dismissButton = {
                TextButton(onClick = { productoSeleccionado = null }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
private fun HistorialContent(viewModel: InventarioViewModel, padding: PaddingValues) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )
        ) {
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
                    IconButton(onClick = { viewModel.mesAnterior() }) {
                        Icon(Icons.Default.ChevronLeft, "Mes anterior")
                    }
                    Text(
                        viewModel.getNombreMes(uiState.mesActual),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(
                        onClick = { viewModel.mesSiguiente() },
                        enabled = !uiState.mesActual.isAfter(YearMonth.now())
                    ) {
                        Icon(
                            Icons.Default.ChevronRight, 
                            "Mes siguiente",
                            tint = if (uiState.mesActual.isAfter(YearMonth.now())) 
                                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f) 
                            else MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ResumenItem(
                            modifier = Modifier.weight(1f),
                            value = "${uiState.cantidadVentasMes}",
                            label = "Ventas realizadas",
                            valueColor = MaterialTheme.colorScheme.primary
                        )
                        ResumenItem(
                            modifier = Modifier.weight(1f),
                            value = "%.2f CUP".format(uiState.totalVentasMes),
                            label = "Total de ventas",
                            valueColor = MaterialTheme.colorScheme.primary
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ResumenItem(
                            modifier = Modifier.weight(1f),
                            value = "${uiState.cantidadComprasMes}",
                            label = "Compras realizadas",
                            valueColor = MaterialTheme.colorScheme.secondary
                        )
                        ResumenItem(
                            modifier = Modifier.weight(1f),
                            value = "%.2f CUP".format(uiState.totalComprasMes),
                            label = "Total de compras",
                            valueColor = MaterialTheme.colorScheme.secondary
                        )
                    }
                }
            }
        }

        val hayMovimientos = uiState.ventasDelMes.isNotEmpty() || uiState.comprasDelMes.isNotEmpty()

        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (!hayMovimientos) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("📊", fontSize = 48.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "No hay movimientos este mes",
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }
        } else {
            val fechas = (uiState.ventasDelMes.keys + uiState.comprasDelMes.keys).distinct().sortedDescending()

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fechas.forEach { fecha ->
                    val ventas = uiState.ventasDelMes[fecha].orEmpty()
                    val compras = uiState.comprasDelMes[fecha].orEmpty()

                    if (ventas.isNotEmpty()) {
                        item(key = "ventas-$fecha") {
                            DiaVentasCard(
                                fecha = fecha,
                                ventas = ventas,
                                onAnular = { ventaId -> viewModel.anularVenta(ventaId) }
                            )
                        }
                    }
                    if (compras.isNotEmpty()) {
                        item(key = "compras-$fecha") {
                            DiaComprasCard(
                                fecha = fecha,
                                compras = compras,
                                onAnular = { compraId -> viewModel.anularCompra(compraId) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ResumenItem(
    modifier: Modifier = Modifier,
    value: String,
    label: String,
    valueColor: androidx.compose.ui.graphics.Color
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.6f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 10.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = valueColor
            )
            Text(
                label,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

@Composable
private fun DiaComprasCard(
    fecha: String,
    compras: List<Pair<Compra, List<LineaCompra>>>,
    onAnular: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val totalDia = compras.sumOf { it.first.total }

    val fechaLocal = LocalDate.parse(fecha)
    val nombreDia = fechaLocal.dayOfWeek.getDisplayName(TextStyle.FULL, Locale("es", "ES"))

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { expanded = !expanded }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "$nombreDia ${fechaLocal.dayOfMonth}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "${compras.size} compra${if (compras.size != 1) "s" else ""}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "%.2f CUP".format(totalDia),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.secondary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (expanded) "Contraer" else "Expandir"
                    )
                }
            }

            AnimatedVisibility(
                visible = expanded,
                enter = expandVertically(),
                exit = shrinkVertically()
            ) {
                Column(modifier = Modifier.padding(top = 12.dp)) {
                    Divider()
                    compras.forEach { (compra, lineas) ->
                        CompraItem(
                            fecha = fecha,
                            compra = compra,
                            lineas = lineas,
                            onAnular = { onAnular(compra.id) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CompraItem(
    fecha: String,
    compra: Compra,
    lineas: List<LineaCompra>,
    onAnular: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    var showAnularDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = !expanded },
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Column {
                    Text(
                        lineas.resumenProductosCompra(),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = formatFechaHoraOperacion(fecha, compra.hora),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "$ %.2f CUP".format(compra.total),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.width(8.dp))
                Icon(
                    if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = if (expanded) "Contraer detalle" else "Expandir detalle"
                )
            }
        }

        AnimatedVisibility(
            visible = expanded,
            enter = expandVertically(),
            exit = shrinkVertically()
        ) {
            Column(modifier = Modifier.padding(top = 8.dp)) {
                lineas.forEachIndexed { index, linea ->
                    LineaDetalleFactura(
                        nombre = linea.nombreProducto,
                        cantidad = linea.cantidad,
                        precioUnitario = linea.precioUnitario,
                        subtotal = linea.subtotal
                    )
                    if (index < lineas.lastIndex) {
                        Divider(modifier = Modifier.padding(vertical = 6.dp))
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "Importe total: $ %.2f CUP".format(compra.total),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.secondary
                )

                TextButton(
                    onClick = { showAnularDialog = true },
                    modifier = Modifier.align(Alignment.End)
                ) {
                    Text("Anular", color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }

    if (showAnularDialog) {
        AlertDialog(
            onDismissRequest = { showAnularDialog = false },
            title = { Text("Anular compra") },
            text = {
                Text("Esta operación se anulará del historial. ¿Deseas continuar?")
            },
            confirmButton = {
                TextButton(onClick = {
                    onAnular()
                    showAnularDialog = false
                }) {
                    Text("Sí, anular", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    showAnularDialog = false
                }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
private fun DiaVentasCard(
    fecha: String,
    ventas: List<Pair<Venta, List<LineaVenta>>>,
    onAnular: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val totalDia = ventas.sumOf { it.first.total }
    
    val fechaLocal = LocalDate.parse(fecha)
    val nombreDia = fechaLocal.dayOfWeek.getDisplayName(TextStyle.FULL, Locale("es", "ES"))

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { expanded = !expanded }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "$nombreDia ${fechaLocal.dayOfMonth}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "${ventas.size} venta${if (ventas.size != 1) "s" else ""}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "%.2f CUP".format(totalDia),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (expanded) "Contraer" else "Expandir"
                    )
                }
            }

            AnimatedVisibility(
                visible = expanded,
                enter = expandVertically(),
                exit = shrinkVertically()
            ) {
                Column(modifier = Modifier.padding(top = 12.dp)) {
                    Divider()
                    ventas.forEach { (venta, lineas) ->
                        VentaItem(
                            fecha = fecha,
                            venta = venta,
                            lineas = lineas,
                            onAnular = { onAnular(venta.id) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun VentaItem(
    fecha: String,
    venta: Venta,
    lineas: List<LineaVenta>,
    onAnular: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    var showAnularDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = !expanded },
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Column {
                    Text(
                        lineas.resumenProductosVenta(),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = formatFechaHoraOperacion(fecha, venta.hora),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "$ %.2f CUP".format(venta.total),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.width(8.dp))
                Icon(
                    if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = if (expanded) "Contraer detalle" else "Expandir detalle"
                )
            }
        }

        AnimatedVisibility(
            visible = expanded,
            enter = expandVertically(),
            exit = shrinkVertically()
        ) {
            Column(modifier = Modifier.padding(top = 8.dp)) {
                lineas.forEachIndexed { index, linea ->
                    LineaDetalleFactura(
                        nombre = linea.nombreProducto,
                        cantidad = linea.cantidad,
                        precioUnitario = linea.precioUnitario,
                        subtotal = linea.subtotal
                    )
                    if (index < lineas.lastIndex) {
                        Divider(modifier = Modifier.padding(vertical = 6.dp))
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "Importe total: $ %.2f CUP".format(venta.total),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                TextButton(
                    onClick = { showAnularDialog = true },
                    modifier = Modifier.align(Alignment.End)
                ) {
                    Text("Anular", color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }

    if (showAnularDialog) {
        AlertDialog(
            onDismissRequest = { showAnularDialog = false },
            title = { Text("Anular venta") },
            text = {
                Text("Esta operación se anulará del historial. ¿Deseas continuar?")
            },
            confirmButton = {
                TextButton(onClick = {
                    onAnular()
                    showAnularDialog = false
                }) {
                    Text("Sí, anular", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    showAnularDialog = false
                }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
private fun LineaDetalleFactura(
    nombre: String,
    cantidad: Int,
    precioUnitario: Double,
    subtotal: Double
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Text(
                text = nombre,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.weight(1f)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "%dx%.2f".format(cantidad, precioUnitario),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Subtotal",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "%.2f CUP".format(subtotal),
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

private fun formatFechaHoraOperacion(fecha: String, hora: String): String {
    val fechaFormateada = runCatching {
        LocalDate.parse(fecha).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
    }.getOrElse { fecha }

    val horaFormateada = runCatching {
        val formatterEntrada = listOf(
            DateTimeFormatter.ofPattern("HH:mm"),
            DateTimeFormatter.ofPattern("HH:mm:ss"),
            DateTimeFormatter.ofPattern("h:mm a", Locale.US)
        ).firstNotNullOfOrNull { fmt ->
            runCatching { LocalTime.parse(hora, fmt) }.getOrNull()
        } ?: return@runCatching hora

        formatterEntrada.format(DateTimeFormatter.ofPattern("hh:mm a", Locale.US))
    }.getOrElse { hora }

    return "$fechaFormateada $horaFormateada"
}

private fun List<LineaCompra>.resumenProductosCompra(): String {
    val resumen = take(2).joinToString(", ") { it.nombreProducto }
    return if (size > 2) "$resumen +${size - 2}" else resumen
}

private fun List<LineaVenta>.resumenProductosVenta(): String {
    val resumen = take(2).joinToString(", ") { it.nombreProducto }
    return if (size > 2) "$resumen +${size - 2}" else resumen
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

@Composable
private fun ProductCardCompra(
    producto: ProductoCompra,
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
                .navigationBarsPadding()
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
                .navigationBarsPadding()
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductCatalogCompraSheet(
    productos: List<ProductoCompra>,
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
                    "Mis Insumos",
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
                    Text("No hay insumos aún")
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
        AddProductCompraDialog(
            onDismiss = { showAddDialog = false },
            onAdd = onAdd
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddProductCompraDialog(
    onDismiss: () -> Unit,
    onAdd: (String, Double, String, String) -> Unit
) {
    var nombre by remember { mutableStateOf("") }
    var precio by remember { mutableStateOf("") }
    var emoji by remember { mutableStateOf("📦") }
    var unidad by remember { mutableStateOf("und") }

    val unidades = listOf("und", "kg", "g", "litro", "ml", "docena", "paquete", "caja", "bolsa", "par", "libra")
    var unitExpanded by remember { mutableStateOf(false) }

    val puedeAgregar = nombre.isNotBlank() && precio.toDoubleOrNull() != null && (precio.toDoubleOrNull() ?: 0.0) > 0

    val defaultEmojis = listOf(
        "📦", "🍞", "🥚", "🧈", "🧀", "🥛", "🍚", "🍝", "🍅", "🧅",
        "🧄", "🥩", "🍗", "🐟", "🧃", "☕", "🍵", "🍪", "🍫", "🍬",
        "🧼", "🧻", "🧴", "🧹", "🪥", "🧽", "🪣", "🔧", "🔨", "🪚",
        "🪵", "📦", "✏️", "📎", "📏", "✂️", "🗃️", "🗄️", "📁", "📂"
    )
    val emojis = remember { mutableStateListOf<String>().apply { addAll(defaultEmojis) } }
    var showCustomEmojiDialog by remember { mutableStateOf(false) }
    var customEmojiInput by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nuevo insumo") },
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PurchaseCartSheet(
    cart: Map<ProductoCompra, Int>,
    total: Double,
    onAdd: (ProductoCompra) -> Unit,
    onRemove: (ProductoCompra) -> Unit,
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
                "Carrito de compra",
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
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.secondary
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
                        color = MaterialTheme.colorScheme.secondary
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onRegistrar,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = cart.isNotEmpty(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.secondary
                    )
                ) {
                    Icon(Icons.Default.Check, null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Registrar compra")
                }
            }
        }
    }
}
