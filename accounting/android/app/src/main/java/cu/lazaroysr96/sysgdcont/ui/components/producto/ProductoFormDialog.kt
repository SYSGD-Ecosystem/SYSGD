package cu.lazaroysr96.sysgdcont.ui.components.producto

/**
 * ProductoFormDialog.kt
 *
 * Un único diálogo para agregar Y editar productos.
 * Elimina la duplicación entre AddProductoDialog y EditProductoDialog.
 *
 * Uso — Agregar:
 *   ProductoFormDialog(
 *       onDismiss = { ... },
 *       onConfirm = { nombre, imagenJson, unidad -> ... }
 *   )
 *
 * Uso — Editar (pasar el producto existente):
 *   ProductoFormDialog(
 *       producto  = productoEditando,
 *       onDismiss = { ... },
 *       onConfirm = { nombre, imagenJson, unidad -> ... }
 *   )
 *
 * [onConfirm] siempre devuelve imagenJson listo para guardar en BD.
 * Retrocompatible: productos con emoji plano se parsean correctamente.
 */

import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import cu.lazaroysr96.sysgdcont.data.model.Producto

@Composable
fun ProductoFormDialog(
    onDismiss: () -> Unit,
    onConfirm: (nombre: String, imagenJson: String, unidad: String) -> Unit,
    // Null → modo Agregar, non-null → modo Editar
    producto: Producto? = null
) {
    // ── Estado inicial según modo ─────────────────────────────────────────────
    val imagenInicial = remember(producto) {
        producto?.emoji.toProductoImagen()
    }

    var nombre by remember { mutableStateOf(producto?.nombre ?: "") }
    var unidad by remember { mutableStateOf(producto?.unidad ?: "und") }

    var activeTab by remember { mutableStateOf(imagenInicial.toTab()) }

    var selectedEmoji by remember {
        mutableStateOf(
            if (imagenInicial.type == "emoji") imagenInicial.data else "📦"
        )
    }
    var extraEmojis      by remember { mutableStateOf(listOf<String>()) }
    var customEmojiInput by remember { mutableStateOf("") }

    // Ahora es String (ruta de archivo interno) en lugar de Uri
    var fotoPath by remember {
        mutableStateOf<String?>(
            if (imagenInicial.type == "foto") imagenInicial.data else null
        )
    }
    var urlInput by remember {
        mutableStateOf(if (imagenInicial.type == "url") imagenInicial.data else "")
    }

    // ── Imagen calculada (derivada del tab activo) ────────────────────────────
    val imagenActual: ProductoImagen = when (activeTab) {
        ImagenTab.EMOJI -> ProductoImagen("emoji", selectedEmoji)
        ImagenTab.FOTO  -> ProductoImagen("foto",  fotoPath ?: "")
        ImagenTab.URL   -> ProductoImagen("url",   urlInput)
    }

    // ── UI ───────────────────────────────────────────────────────────────────
    val titulo = if (producto == null) "Nuevo producto" else "Editar producto"

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier     = Modifier
                .fillMaxWidth(0.95f)
                .wrapContentHeight(),
            shape        = RoundedCornerShape(20.dp),
            color        = MaterialTheme.colorScheme.surface,
            tonalElevation = 6.dp
        ) {
            Column {

                // Título
                Text(
                    text     = titulo,
                    style    = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(start = 20.dp, top = 20.dp, end = 20.dp)
                )

                Spacer(Modifier.height(12.dp))

                // Hero — preview + tabs
                ProductoHeroSection(
                    imagen      = imagenActual,
                    fotoUri     = fotoPath?.let { Uri.parse(it) },  // Solo para preview, pasar Uri
                    activeTab   = activeTab,
                    onTabChange = { activeTab = it }
                )

                Divider()

                // Panel según tab activo
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                ) {
                    when (activeTab) {
                        ImagenTab.EMOJI -> ProductoEmojiPanel(
                            selected            = selectedEmoji,
                            extras              = extraEmojis,
                            customInput         = customEmojiInput,
                            onCustomInputChange = { customEmojiInput = it },
                            onSelect            = { selectedEmoji = it },
                            onAddCustom         = {
                                val v = customEmojiInput.trim()
                                if (v.isNotEmpty()) {
                                    extraEmojis   = extraEmojis + v
                                    selectedEmoji = v
                                    customEmojiInput = ""
                                }
                            }
                        )
                        ImagenTab.FOTO -> ProductoFotoPanel(
                            onFotoSelected = { fotoPath = it }
                        )
                        ImagenTab.URL  -> ProductoUrlPanel(
                            value         = urlInput,
                            onValueChange = { urlInput = it }
                        )
                    }
                }

                Divider()

                // Campos nombre + unidad
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    OutlinedTextField(
                        value         = nombre,
                        onValueChange = { nombre = it },
                        label         = { Text("Nombre") },
                        placeholder   = { Text("Ej: Pan francés") },
                        singleLine    = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                        modifier      = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value         = unidad,
                        onValueChange = { unidad = it },
                        label         = { Text("Unidad") },
                        placeholder   = { Text("und, kg, lt…") },
                        singleLine    = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        modifier      = Modifier.fillMaxWidth()
                    )

                    // Botones
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment     = Alignment.CenterVertically
                    ) {
                        TextButton(onClick = onDismiss) {
                            Text("Cancelar")
                        }
                        Spacer(Modifier.width(8.dp))
                        Button(
                            onClick = {
                                onConfirm(
                                    nombre.trim(),
                                    imagenActual.toJson(),
                                    unidad.trim()
                                )
                            },
                            enabled = nombre.isNotBlank()
                        ) {
                            Text(if (producto == null) "Guardar" else "Actualizar")
                        }
                    }
                }
            }
        }
    }
}

// ─── Aliases de conveniencia ──────────────────────────────────────────────────
// Mantienen la firma anterior para no romper call sites que ya existían.

@Composable
fun AddProductoDialog(
    onDismiss: () -> Unit,
    onConfirm: (nombre: String, imagenJson: String, unidad: String) -> Unit
) = ProductoFormDialog(onDismiss = onDismiss, onConfirm = onConfirm)

@Composable
fun EditProductoDialog(
    producto: Producto,
    onDismiss: () -> Unit,
    onConfirm: (nombre: String, imagenJson: String, unidad: String) -> Unit
) = ProductoFormDialog(producto = producto, onDismiss = onDismiss, onConfirm = onConfirm)
