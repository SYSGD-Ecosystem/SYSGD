```kotlin
package cu.lazaroysr96.sysgdcont.ui.components

import android.net.Uri
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import coil.request.ImageRequest
import cu.lazaroysr96.sysgdcont.data.model.Producto
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

// ─── Modelo ProductoImagen ────────────────────────────────────────────────────

@Serializable
data class ProductoImagen(
    val type: String, // "emoji" | "foto" | "url"
    val data: String
)

fun String?.toProductoImagen(): ProductoImagen =
    try { Json.decodeFromString(this ?: "") }
    catch (_: Exception) { ProductoImagen("emoji", this ?: "📦") }

fun ProductoImagen.toJson(): String = Json.encodeToString(this)

// ─── Tabs internas ────────────────────────────────────────────────────────────

private enum class ImagenTab { EMOJI, FOTO, URL }

private val DEFAULT_EMOJIS = listOf(
    "📦", "🍔", "☕", "🥤", "🍟", "🍕", "🎁", "🥪", "🌮", "🍜",
    "🍰", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "🥛", "🧃", "🍵",
    "👕", "👖", "👗", "👟", "🎒", "👑", "🎩",
    "📱", "💻", "📷", "📺", "🔋", "💡",
    "🧹", "🧼", "🧴", "🔑", "📁", "✏️"
)

// ─────────────────────────────────────────────────────────────────────────────
// ProductoImagen — avatar reutilizable (hero o miniatura)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renderiza la imagen de un producto a partir del campo `emoji` de la BD,
 * que puede ser un emoji plano (retrocompatible) o un JSON ProductoImagen.
 *
 * @param rawEmoji  El valor crudo del campo `emoji` en la BD.
 * @param size      Tamaño del contenedor cuadrado.
 * @param cornerRadius Radio de esquinas.
 */
@Composable
fun ProductoImagenAvatar(
    rawEmoji: String,
    size: Int = 48,
    cornerRadius: Int = 12
) {
    val imagen = remember(rawEmoji) { rawEmoji.toProductoImagen() }
    val shape = RoundedCornerShape(cornerRadius.dp)

    Box(
        modifier = Modifier
            .size(size.dp)
            .clip(shape)
            .background(MaterialTheme.colorScheme.surfaceVariant),
        contentAlignment = Alignment.Center
    ) {
        when (imagen.type) {
            "emoji" -> Text(
                text = imagen.data.ifEmpty { "📦" },
                fontSize = (size * 0.55f).sp,
                textAlign = TextAlign.Center
            )
            "foto"  -> AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(Uri.parse(imagen.data))
                    .crossfade(true)
                    .build(),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            "url"   -> AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(imagen.data)
                    .crossfade(true)
                    .build(),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
                // fallback si la URL falla
                error = null
            )
            else    -> Text("📦", fontSize = (size * 0.55f).sp)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductoItem — card de la lista
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ítem de producto para [LazyColumn]. Muestra avatar (emoji/foto/url),
 * nombre, unidad y un botón de edición.
 *
 * @param producto   Modelo de datos.
 * @param onClick    Acción al tocar la card (abre edición).
 * @param trailing   Contenido opcional en el extremo derecho (p.ej. stock).
 */
@Composable
fun ProductoItem(
    producto: Producto,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    trailing: @Composable (() -> Unit)? = null
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Avatar imagen
            ProductoImagenAvatar(
                rawEmoji = producto.emoji,
                size = 52,
                cornerRadius = 12
            )

            // Nombre + unidad
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = producto.nombre,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text = producto.unidad,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Trailing opcional (stock, precio, etc.)
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
// EditProductoDialog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Diálogo para editar un producto existente. Mismo diseño que [AddProductoDialog]
 * pero con los campos precargados desde [producto].
 *
 * El campo [Producto.emoji] puede ser un emoji plano (retrocompat.) o un JSON
 * serializado de [ProductoImagen]. [onConfirm] devuelve el nuevo JSON listo
 * para guardar en BD.
 */
@Composable
fun EditProductoDialog(
    producto: Producto,
    onDismiss: () -> Unit,
    onConfirm: (nombre: String, imagenJson: String, unidad: String) -> Unit
) {
    // Parsear la imagen actual (compatibilidad con registros viejos)
    val imagenInicial = remember(producto.emoji) { producto.emoji.toProductoImagen() }

    var nombre  by remember { mutableStateOf(producto.nombre) }
    var unidad  by remember { mutableStateOf(producto.unidad) }

    // Tab inicial según el tipo guardado
    var activeTab by remember {
        mutableStateOf(
            when (imagenInicial.type) {
                "foto" -> ImagenTab.FOTO
                "url"  -> ImagenTab.URL
                else   -> ImagenTab.EMOJI
            }
        )
    }

    var selectedEmoji  by remember { mutableStateOf(
        if (imagenInicial.type == "emoji") imagenInicial.data else "📦"
    )}
    var extraEmojis    by remember { mutableStateOf(listOf<String>()) }
    var customEmojiInput by remember { mutableStateOf("") }
    var fotoUri        by remember { mutableStateOf<Uri?>(
        if (imagenInicial.type == "foto") Uri.parse(imagenInicial.data) else null
    )}
    var urlInput       by remember { mutableStateOf(
        if (imagenInicial.type == "url") imagenInicial.data else ""
    )}

    val imagenActual: ProductoImagen = when (activeTab) {
        ImagenTab.EMOJI -> ProductoImagen("emoji", selectedEmoji)
        ImagenTab.FOTO  -> ProductoImagen("foto",  fotoUri?.toString() ?: "")
        ImagenTab.URL   -> ProductoImagen("url",   urlInput)
    }

    val fotoPicker = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri -> if (uri != null) fotoUri = uri }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .wrapContentHeight(),
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 6.dp
        ) {
            Column {

                // ── Título ───────────────────────────────────────────────────
                Text(
                    text = "Editar producto",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(start = 20.dp, top = 20.dp, end = 20.dp, bottom = 0.dp)
                )

                // ── HERO ─────────────────────────────────────────────────────
                HeroSection(
                    imagen = imagenActual,
                    fotoUri = fotoUri,
                    activeTab = activeTab,
                    onTabChange = { activeTab = it }
                )

                HorizontalDivider()

                // ── PANEL SELECTOR ───────────────────────────────────────────
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                ) {
                    when (activeTab) {
                        ImagenTab.EMOJI -> EmojiPanel(
                            selected = selectedEmoji,
                            extras = extraEmojis,
                            customInput = customEmojiInput,
                            onCustomInputChange = { customEmojiInput = it },
                            onSelect = { selectedEmoji = it },
                            onAddCustom = {
                                val v = customEmojiInput.trim()
                                if (v.isNotEmpty()) {
                                    extraEmojis = extraEmojis + v
                                    selectedEmoji = v
                                    customEmojiInput = ""
                                }
                            }
                        )
                        ImagenTab.FOTO -> FotoPanel(
                            onPickFoto = { fotoPicker.launch("image/*") }
                        )
                        ImagenTab.URL  -> UrlPanel(
                            value = urlInput,
                            onValueChange = { urlInput = it }
                        )
                    }
                }

                HorizontalDivider()

                // ── CAMPOS ───────────────────────────────────────────────────
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    OutlinedTextField(
                        value = nombre,
                        onValueChange = { nombre = it },
                        label = { Text("Nombre") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = unidad,
                        onValueChange = { unidad = it },
                        label = { Text("Unidad") },
                        placeholder = { Text("und, kg, lt…") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(onClick = onDismiss) { Text("Cancelar") }
                        Spacer(Modifier.width(8.dp))
                        Button(
                            onClick = {
                                onConfirm(nombre.trim(), imagenActual.toJson(), unidad.trim())
                            },
                            enabled = nombre.isNotBlank()
                        ) { Text("Guardar") }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-composables compartidos (Hero + paneles)
// ─────────────────────────────────────────────────────────────────────────────

@Composable
internal fun HeroSection(
    imagen: ProductoImagen,
    fotoUri: Uri?,
    activeTab: ImagenTab,
    onTabChange: (ImagenTab) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(150.dp)
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
        contentAlignment = Alignment.Center
    ) {
        // Preview central
        Box(
            modifier = Modifier
                .size(96.dp)
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

        // Tabs — esquina superior derecha
        Row(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(10.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.92f))
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
                Text(
                    text = when (tab) {
                        ImagenTab.EMOJI -> "Emoji"
                        ImagenTab.FOTO  -> "Foto"
                        ImagenTab.URL   -> "URL"
                    },
                    fontSize = 11.sp,
                    fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal,
                    color = if (selected) MaterialTheme.colorScheme.onSurface
                            else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier
                        .clip(RoundedCornerShape(7.dp))
                        .background(
                            if (selected) MaterialTheme.colorScheme.surfaceVariant
                            else Color.Transparent
                        )
                        .clickable { onTabChange(tab) }
                        .padding(horizontal = 9.dp, vertical = 4.dp)
                )
            }
        }
    }
}

@Composable
internal fun EmojiPanel(
    selected: String,
    extras: List<String>,
    customInput: String,
    onCustomInputChange: (String) -> Unit,
    onSelect: (String) -> Unit,
    onAddCustom: () -> Unit
) {
    Column(
        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier.fillMaxWidth()
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

        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = customInput,
                onValueChange = onCustomInputChange,
                placeholder = { Text("Añadir emoji…", fontSize = 12.sp) },
                singleLine = true,
                textStyle = LocalTextStyle.current.copy(fontSize = 13.sp),
                modifier = Modifier.weight(1f),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done)
            )
            OutlinedButton(
                onClick = onAddCustom,
                modifier = Modifier.height(48.dp)
            ) {
                Text("+", fontSize = 18.sp)
            }
        }
    }
}

@Composable
internal fun FotoPanel(onPickFoto: () -> Unit) {
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
            .clickable { onPickFoto() }
            .padding(vertical = 18.dp),
        contentAlignment = Alignment.Center
    ) {
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

@Composable
internal fun UrlPanel(value: String, onValueChange: (String) -> Unit) {
    Column(
        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text("https://ejemplo.com/imagen.png", fontSize = 12.sp) },
            singleLine = true,
            textStyle = LocalTextStyle.current.copy(fontSize = 13.sp),
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done)
        )
        Text(
            "URL pública de la imagen",
            fontSize = 11.sp,
            color = MaterialTheme.colorScheme.outline
        )
    }
}
```
