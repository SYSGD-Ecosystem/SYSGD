package cu.lazaroysr96.sysgdcont.ui.components.producto

/**
 * ProductoItem.kt
 *
 * Card de producto para LazyColumn. Reutilizable en:
 *   - CatalogosScreen  (listado/edición)
 *   - VentasScreen     (selector de producto al agregar línea)
 *   - InventarioScreen (listado de stock)
 *   - cualquier otra pantalla que liste productos)
 *
 * El slot [trailing] es opcional:
 *   - Sin trailing → muestra icono de edición (comportamiento Catálogos)
 *   - Con trailing → puedes poner stock, precio, cantidad, checkbox, etc.
 */

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import cu.lazaroysr96.sysgdcont.data.model.Producto

// ─────────────────────────────────────────────────────────────────────────────
// Variante principal — usa el modelo Producto
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param producto  Modelo de datos.
 * @param onClick   Acción al tocar la card.
 * @param modifier  Modifier externo opcional.
 * @param avatarSize Tamaño del avatar de imagen. Default 52.dp.
 * @param trailing  Slot derecho opcional. Si es null muestra icono de edición.
 */
@Composable
fun ProductoItem(
    producto: Producto,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    avatarSize: Dp = 52.dp,
    trailing: @Composable (() -> Unit)? = null
) {
    ProductoItemBase(
        rawEmoji    = producto.emoji,
        nombre      = producto.nombre,
        subtitulo   = producto.unidad,
        onClick     = onClick,
        modifier    = modifier,
        avatarSize  = avatarSize,
        trailing    = trailing
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Variante primitiva — para cuando no tenés el modelo Producto
// (p.ej. selector de producto desde un Flow parcial, preview, etc.)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param rawEmoji  Campo `emoji` crudo de BD (emoji plano o JSON).
 * @param nombre    Nombre del producto.
 * @param subtitulo Texto secundario (unidad, stock, precio, etc.).
 * @param onClick   Acción al tocar.
 * @param trailing  Slot derecho opcional.
 */
@Composable
fun ProductoItemBase(
    rawEmoji: String,
    nombre: String,
    subtitulo: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    avatarSize: Dp = 52.dp,
    trailing: @Composable (() -> Unit)? = null
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape  = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment     = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Avatar (emoji / foto / url)
            ProductoImagenAvatar(
                rawEmoji     = rawEmoji,
                size         = avatarSize,
                cornerRadius = 12.dp
            )

            // Nombre + subtítulo
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text       = nombre,
                    style      = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium,
                    maxLines   = 1,
                    overflow   = TextOverflow.Ellipsis
                )
                if (subtitulo.isNotBlank()) {
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text  = subtitulo,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Trailing — icono de edición por defecto
            if (trailing != null) {
                trailing()
            } else {
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = "Editar",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ejemplos de trailing slots reutilizables
// ─────────────────────────────────────────────────────────────────────────────

/** Trailing con cantidad de stock */
@Composable
fun StockTrailing(cantidad: Double, unidad: String) {
    Column(horizontalAlignment = Alignment.End) {
        Text(
            text  = String.format("%.1f", cantidad),
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Medium,
            color = if (cantidad <= 0) MaterialTheme.colorScheme.error
                    else MaterialTheme.colorScheme.primary
        )
        Text(
            text  = unidad,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/** Trailing con precio */
@Composable
fun PrecioTrailing(precio: Double) {
    Text(
        text  = String.format("%.2f CUP", precio),
        style = MaterialTheme.typography.titleSmall,
        fontWeight = FontWeight.Medium,
        color = MaterialTheme.colorScheme.primary
    )
}

/** Trailing con chevron (para listas de navegación) */
@Composable
fun ChevronTrailing() {
    Icon(
        imageVector = Icons.Default.ChevronRight,
        contentDescription = null,
        tint = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.size(20.dp)
    )
}
