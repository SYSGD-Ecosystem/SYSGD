package cu.lazaroysr96.sysgdcont.ui.components.producto

/**
 * InventarioProductoComponents.kt
 *
 * Componentes genéricos para InventarioScreen que eliminan la duplicación
 * entre ProductCard/ProductCardCompra y unifican el acceso a ProductoImagen.
 *
 * Exportados públicamente (usables fuera del paquete):
 *   - ProductGridCard        → card cuadrada para grids 2-col (venta/compra)
 *   - CatalogoItemRow        → fila de catálogo (sheets de gestión)
 *   - ProductSelectorGrid    → grid de selección de producto base
 *   - withProductoImagen     → extensión para cualquier tipo con campo emoji
 */

import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ─────────────────────────────────────────────────────────────────────────────
// ProductGridCard
// Card cuadrada para grids de 2 columnas (punto de venta / punto de compra).
// Reemplaza ProductCard y ProductCardCompra — son exactamente la misma UI.
//
// Uso venta:
//   ProductGridCard(
//       rawEmoji = producto.emoji,
//       nombre   = producto.nombre,
//       subtitulo = "%.2f CUP / %s".format(producto.precio, producto.unidad),
//       onClick  = { productoSeleccionado = producto }
//   )
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun ProductGridCard(
    rawEmoji: String,
    nombre: String,
    subtitulo: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    avatarSize: Dp = 64.dp
) {
    Card(
        modifier = modifier
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
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            ProductoImagenAvatar(
                rawEmoji     = rawEmoji,
                size         = avatarSize,
                cornerRadius = 12.dp
            )
            Text(
                text       = nombre,
                style      = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                maxLines   = 1,
                overflow   = TextOverflow.Ellipsis
            )
            Text(
                text  = subtitulo,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CatalogoItemRow
// Fila horizontal para los sheets de gestión de catálogo (venta/compra).
// Reemplaza el bloque Row inline repetido en ProductCatalogSheet y
// ProductCatalogCompraSheet.
//
// Uso:
//   CatalogoItemRow(
//       rawEmoji  = producto.emoji,
//       nombre    = producto.nombre,
//       subtitulo = "%.2f CUP".format(producto.precio),
//       onEliminar = { onEliminar(producto.catalogoId) }
//   )
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun CatalogoItemRow(
    rawEmoji: String,
    nombre: String,
    subtitulo: String,
    onEliminar: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment     = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f)
        ) {
            ProductoImagenAvatar(
                rawEmoji     = rawEmoji,
                size         = 40.dp,
                cornerRadius = 10.dp
            )
            Column {
                Text(nombre, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(subtitulo, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        IconButton(onClick = onEliminar) {
            Icon(Icons.Default.Delete, contentDescription = "Eliminar", tint = MaterialTheme.colorScheme.error)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductSelectorGrid
// Grid de selección de producto base para ProductSheet.
// Reemplaza el LazyVerticalGrid + ElevatedCard inline.
//
// Uso:
//   ProductSelectorGrid(
//       productos = productosDisponibles,
//       onSelect  = { selectedProducto = it }
//   )
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun ProductSelectorGrid(
    productos: List<ProductoBaseItem>,
    onSelect: (ProductoBaseItem) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = 148.dp),
        modifier = modifier
            .fillMaxWidth()
            .heightIn(max = 420.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalArrangement   = Arrangement.spacedBy(8.dp)
    ) {
        items(productos, key = { it.id }) { producto ->
            ElevatedCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onSelect(producto) },
                colors = CardDefaults.elevatedCardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment     = Alignment.Top
                    ) {
                        ProductoImagenAvatar(
                            rawEmoji     = producto.emoji,
                            size         = 36.dp,
                            cornerRadius = 8.dp
                        )
                        FilledTonalButton(
                            onClick = { onSelect(producto) },
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp)
                        ) {
                            Text("Elegir", fontSize = 12.sp)
                        }
                    }
                    Text(
                        producto.nombre,
                        fontWeight = FontWeight.SemiBold,
                        style      = MaterialTheme.typography.bodyMedium,
                        maxLines   = 2
                    )
                    Text(
                        producto.unidad,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductoBaseItem — interfaz de datos ligera para el selector
// Evita acoplar ProductSelectorGrid al modelo Producto directamente.
// Convertir: val items = productos.map { it.toBaseItem() }
// ─────────────────────────────────────────────────────────────────────────────

data class ProductoBaseItem(
    val id: String,
    val nombre: String,
    val emoji: String,
    val unidad: String
)

// Extensión para convertir cualquier tipo que tenga esos campos
fun cu.lazaroysr96.sysgdcont.data.model.Producto.toBaseItem() =
    ProductoBaseItem(id = id, nombre = nombre, emoji = emoji, unidad = unidad)

// ─────────────────────────────────────────────────────────────────────────────
// InventarioItemAvatar
// Avatar de 24dp con emoji/imagen para ItemInventarioRow.
// Reemplaza Text(emoji, fontSize = 24.sp) en la pantalla de inventario.
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun InventarioItemAvatar(rawEmoji: String) {
    ProductoImagenAvatar(
        rawEmoji     = rawEmoji,
        size         = 36.dp,
        cornerRadius = 8.dp
    )
}
