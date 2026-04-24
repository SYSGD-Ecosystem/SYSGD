package cu.lazaroysr96.sysgdcont.ui.components.producto

/**
 * ProductoImagenUi.kt
 *
 * Composables de bajo nivel para renderizar y seleccionar imágenes de producto.
 * Todos son stateless o reciben estado desde el padre — no hay lógica de negocio aquí.
 *
 * Exportados:
 *   - ProductoImagenAvatar  → usar en cualquier lista, factura, selector, etc.
 *   - ProductoHeroSection   → sección hero del diálogo Add/Edit
 *   - ProductoEmojiPanel    → panel de selección de emoji
 *   - ProductoFotoPanel     → panel de selección de foto local
 *   - ProductoUrlPanel      → panel de URL externa
 */

import android.content.Context
import android.net.Uri
import android.os.Environment
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

// ─────────────────────────────────────────────────────────────────────────────
// ProductoImagenAvatar
// Renderiza el campo `emoji` de BD en cualquier tamaño.
// Úsalo en listas, facturas, selectores de producto, widgets de stock, etc.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param rawEmoji  Valor crudo del campo `emoji` en la BD (emoji plano o JSON).
 * @param size      Tamaño del cuadrado. Default 48.dp.
 * @param cornerRadius Radio de esquinas. Default 12.dp.
 */
@Composable
fun ProductoImagenAvatar(
    rawEmoji: String,
    modifier: Modifier = Modifier,
    size: Dp = 48.dp,
    cornerRadius: Dp = 12.dp
) {
    val imagen = rawEmoji.toProductoImagen()
    val shape  = RoundedCornerShape(cornerRadius)

    Box(
        modifier = modifier
            .size(size)
            .clip(shape)
            .background(MaterialTheme.colorScheme.surfaceVariant),
        contentAlignment = Alignment.Center
    ) {
        when (imagen.type) {
            "emoji" -> Text(
                text      = imagen.data.ifEmpty { "📦" },
                fontSize  = (size.value * 0.55f).sp,
                textAlign = TextAlign.Center
            )
            "foto" -> {
                val data = imagen.data
                val imageData = when {
                    data.startsWith("/") -> File(data)                     // Ruta interna
                    data.startsWith("content://") -> Uri.parse(data) // Legacy URI
                    else -> File(data)
                }
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(imageData)
                        .crossfade(true)
                        .build(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier     = Modifier.fillMaxSize()
                )
            }
            "url" -> AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(imagen.data)
                    .crossfade(true)
                    .build(),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier     = Modifier.fillMaxSize()
            )
            else -> Text("📦", fontSize = (size.value * 0.55f).sp)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductoHeroSection
// Hero de 150dp con preview central + tabs de modo en esquina.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param imagen     Estado actual de imagen (calculado por el padre).
 * @param fotoUri    URI de foto local seleccionada (null si no aplica).
 * @param activeTab  Tab activo actualmente.
 * @param onTabChange Callback cuando el usuario cambia de tab.
 */
@Composable
fun ProductoHeroSection(
    imagen: ProductoImagen,
    fotoUri: Uri?,
    activeTab: ImagenTab,
    onTabChange: (ImagenTab) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {

        // Fila superior: label + selector de tabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Imagen del producto",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            // Tab selector compacto
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f))
                    .border(
                        width = 0.5.dp,
                        color = MaterialTheme.colorScheme.outlineVariant,
                        shape = RoundedCornerShape(10.dp)
                    )
                    .padding(3.dp),
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                ImagenTab.entries.forEach { tab ->
                    val selected = tab == activeTab
                    val label = when (tab) {
                        ImagenTab.EMOJI -> "Emoji"
                        ImagenTab.FOTO -> "Foto"
                        ImagenTab.URL -> "URL"
                    }
                    Text(
                        text = label,
                        fontSize = 11.sp,
                        fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal,
                        color = if (selected) MaterialTheme.colorScheme.onSurface
                                else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier
                            .clip(RoundedCornerShape(7.dp))
                            .background(
                                if (selected) MaterialTheme.colorScheme.surface
                                else Color.Transparent
                            )
                            .clickable { onTabChange(tab) }
                            .padding(horizontal = 9.dp, vertical = 4.dp)
                    )
                }
            }
        }

        // Preview de la imagen / emoji
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(90.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(MaterialTheme.colorScheme.surface),
                contentAlignment = Alignment.Center
            ) {
                when {
                    imagen.type == "emoji" -> Text(
                        text = imagen.data.ifEmpty { "📦" },
                        fontSize = 52.sp,
                        textAlign = TextAlign.Center
                    )
                    imagen.type == "foto" && fotoUri != null -> AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(fotoUri).crossfade(true).build(),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                    imagen.type == "url" && imagen.data.isNotBlank() -> AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(imagen.data).crossfade(true).build(),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                    else -> Text("📦", fontSize = 52.sp, textAlign = TextAlign.Center)
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductoEmojiPanel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param selected     Emoji actualmente seleccionado.
 * @param extras      Emojis añadidos por el usuario en esta sesión.
 * @param onSelect    Callback cuando se selecciona un emoji del grid.
 * @param onAddCustom Callback para añadir un emoji personalizado.
 */
@Composable
fun ProductoEmojiPanel(
    selected: String,
    extras: List<String>,
    onSelect: (String) -> Unit,
    onAddCustom: (String) -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var dialogInput by remember { mutableStateOf("") }

    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = {
                showAddDialog = false
                dialogInput = ""
            },
            title = { Text("Emoji personalizado") },
            text = {
                OutlinedTextField(
                    value = dialogInput,
                    onValueChange = { dialogInput = it },
                    placeholder = { Text("Pega o escribe un emoji…") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val v = dialogInput.trim()
                        if (v.isNotEmpty()) {
                            onAddCustom(v)
                        }
                        showAddDialog = false
                        dialogInput = ""
                    }
                ) { Text("Agregar") }
            },
            dismissButton = {
                TextButton(onClick = {
                    showAddDialog = false
                    dialogInput = ""
                }) { Text("Cancelar") }
            }
        )
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        LazyRow(
            modifier = Modifier.weight(1f),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            items(DEFAULT_EMOJIS + extras) { emoji ->
                Text(
                    text = emoji,
                    fontSize = 22.sp,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(
                            if (emoji == selected) MaterialTheme.colorScheme.primaryContainer
                            else Color.Transparent
                        )
                        .clickable { onSelect(emoji) }
                        .padding(6.dp)
                )
            }
        }

        Spacer(Modifier.width(6.dp))

        OutlinedButton(
            onClick = { showAddDialog = true },
            modifier = Modifier
                .height(40.dp)
                .widthIn(min = 44.dp),
            contentPadding = PaddingValues(horizontal = 10.dp)
        ) {
            Text("+", fontSize = 16.sp)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductoFotoPanel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Zona de toque que abre el selector de imagen del sistema.
 * Copia la imagen al almacenamiento interno para persistencia.
 *
 * @param onFotoSelected Devuelve la ruta relativa (DesdeContext) del archivo copiado.
 */
@Composable
fun ProductoFotoPanel(onFotoSelected: (String) -> Unit) {
    val context = LocalContext.current
    val copiedPath = remember { mutableStateOf<String?>(null) }

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri ->
        uri?.let {
            // Copiar al almacenamiento interno
            val path = copiarImagenAStorageInterno(context, it)
            path?.let { p ->
                copiedPath.value = p
                onFotoSelected(p)
            }
        }
    }

    // Preview de imagen ya seleccionada
    val hayImagen = copiedPath.value != null

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp)
            .clip(RoundedCornerShape(10.dp))
            .border(
                width = 1.5.dp,
                color = MaterialTheme.colorScheme.outlineVariant,
                shape = RoundedCornerShape(10.dp)
            )
            .clickable { launcher.launch(arrayOf("image/*")) }
            .padding(vertical = 18.dp),
        contentAlignment = Alignment.Center
    ) {
        if (hayImagen) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(File(copiedPath.value!!))
                    .crossfade(true)
                    .build(),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(80.dp)
            )
        } else {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    "Seleccionar imagen",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    "JPG · PNG · WEBP",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.outline
                )
            }
        }
    }
}

private fun copiarImagenAStorageInterno(context: Context, uri: Uri): String? {
    return try {
        val input = context.contentResolver.openInputStream(uri) ?: return null
        val mimeType = context.contentResolver.getType(uri) ?: "image/jpeg"
        val ext = when {
            mimeType.contains("png") -> "png"
            mimeType.contains("webp") -> "webp"
            else -> "jpg"
        }
        val fileName = "img_${UUID.randomUUID()}.$ext"
        val imagesDir = File(context.filesDir, "productos_imagenes")
        if (!imagesDir.exists()) imagesDir.mkdirs()
        val outFile = File(imagesDir, fileName)

        FileOutputStream(outFile).use { output ->
            input.copyTo(output)
        }
        input.close()

        outFile.absolutePath
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductoUrlPanel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param value         URL actual.
 * @param onValueChange Callback de cambio.
 */
@Composable
fun ProductoUrlPanel(value: String, onValueChange: (String) -> Unit) {
    Column(
        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        OutlinedTextField(
            value         = value,
            onValueChange = onValueChange,
            placeholder   = { Text("https://ejemplo.com/imagen.png", fontSize = 12.sp) },
            singleLine    = true,
            textStyle     = LocalTextStyle.current.copy(fontSize = 13.sp),
            modifier      = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done)
        )
        Text(
            "URL pública de la imagen",
            fontSize = 11.sp,
            color    = MaterialTheme.colorScheme.outline
        )
    }
}
