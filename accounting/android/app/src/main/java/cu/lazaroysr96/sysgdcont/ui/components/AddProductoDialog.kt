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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import coil.request.ImageRequest
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

// ─── Modelo ──────────────────────────────────────────────────────────────────

@Serializable
data class ProductoImagen(
    val type: String, // "emoji" | "foto" | "url"
    val data: String
)

/** Parsea el campo `emoji` de la BD. Compatible con registros viejos (emoji plano). */
fun String?.toProductoImagen(): ProductoImagen =
    try {
        Json.decodeFromString(this ?: "")
    } catch (_: Exception) {
        ProductoImagen("emoji", this ?: "📦")
    }

fun ProductoImagen.toJson(): String = Json.encodeToString(this)

// ─── Constantes ──────────────────────────────────────────────────────────────

private val DEFAULT_EMOJIS = listOf(
    "📦", "🍔", "☕", "🥤", "🍟", "🍕", "🎁", "🥪", "🌮", "🍜",
    "🍰", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "🥛", "🧃", "🍵",
    "👕", "👖", "👗", "👟", "🎒", "👑", "🎩",
    "📱", "💻", "📷", "📺", "🔋", "💡",
    "🧹", "🧼", "🧴", "🔑", "📁", "✏️"
)

private enum class ImagenTab { EMOJI, FOTO, URL }

// ─── Diálogo principal ───────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddProductoDialog(
    onDismiss: () -> Unit,
    onConfirm: (nombre: String, imagenJson: String, unidad: String) -> Unit
) {
    var nombre by remember { mutableStateOf("") }
    var unidad by remember { mutableStateOf("und") }
    var activeTab by remember { mutableStateOf(ImagenTab.EMOJI) }

    // Estado de imagen
    var selectedEmoji by remember { mutableStateOf("📦") }
    var extraEmojis by remember { mutableStateOf(listOf<String>()) }
    var customEmojiInput by remember { mutableStateOf("") }
    var fotoUri by remember { mutableStateOf<Uri?>(null) }
    var urlInput by remember { mutableStateOf("") }

    // Imagen actual serializada
    val imagenActual: ProductoImagen = when (activeTab) {
        ImagenTab.EMOJI -> ProductoImagen("emoji", selectedEmoji)
        ImagenTab.FOTO  -> ProductoImagen("foto", fotoUri?.toString() ?: "")
        ImagenTab.URL   -> ProductoImagen("url", urlInput)
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

                // ── HERO ─────────────────────────────────────────────────────
                HeroSection(
                    imagen = imagenActual,
                    fotoUri = fotoUri,
                    activeTab = activeTab,
                    onTabChange = { activeTab = it }
                )

                Divider()

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
                        ImagenTab.URL -> UrlPanel(
                            value = urlInput,
                            onValueChange = { urlInput = it }
                        )
                    }
                }

                Divider()

                // ── CAMPOS ───────────────────────────────────────────────────
                Column(
                    modifier = Modifier
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    OutlinedTextField(
                        value = nombre,
                        onValueChange = { nombre = it },
                        label = { Text("Nombre") },
                        placeholder = { Text("Ej: Pan francés") },
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

                    // ── Botones ──────────────────────────────────────────────
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(onClick = onDismiss) {
                            Text("Cancelar")
                        }
                        Spacer(Modifier.width(8.dp))
                        Button(
                            onClick = {
                                onConfirm(nombre.trim(), imagenActual.toJson(), unidad.trim())
                            },
                            enabled = nombre.isNotBlank()
                        ) {
                            Text("Guardar")
                        }
                    }
                }
            }
        }
    }
}

// ─── Hero ────────────────────────────────────────────────────────────────────

@Composable
private fun HeroSection(
    imagen: ProductoImagen,
    fotoUri: Uri?,
    activeTab: ImagenTab,
    onTabChange: (ImagenTab) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(160.dp)
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
        contentAlignment = Alignment.Center
    ) {
        // Preview central
        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(MaterialTheme.colorScheme.surface),
            contentAlignment = Alignment.Center
        ) {
            when {
                imagen.type == "emoji" -> {
                    Text(
                        text = imagen.data.ifEmpty { "📦" },
                        fontSize = 56.sp,
                        textAlign = TextAlign.Center
                    )
                }
                imagen.type == "foto" && fotoUri != null -> {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(fotoUri)
                            .crossfade(true)
                            .build(),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                imagen.type == "url" && imagen.data.isNotBlank() -> {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(imagen.data)
                            .crossfade(true)
                            .build(),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                else -> {
                    Text("📦", fontSize = 56.sp, textAlign = TextAlign.Center)
                }
            }
        }

        // Tabs en esquina superior derecha
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
                val label = when (tab) {
                    ImagenTab.EMOJI -> "Emoji"
                    ImagenTab.FOTO  -> "Foto"
                    ImagenTab.URL   -> "URL"
                }
                Text(
                    text = label,
                    fontSize = 11.sp,
                    fontWeight = if (selected) androidx.compose.ui.text.font.FontWeight.Medium
                                 else androidx.compose.ui.text.font.FontWeight.Normal,
                    color = if (selected) MaterialTheme.colorScheme.onSurface
                            else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier
                        .clip(RoundedCornerShape(7.dp))
                        .background(
                            if (selected) MaterialTheme.colorScheme.surfaceVariant
                            else androidx.compose.ui.graphics.Color.Transparent
                        )
                        .clickable { onTabChange(tab) }
                        .padding(horizontal = 9.dp, vertical = 4.dp)
                )
            }
        }
    }
}

// ─── Panel Emoji ─────────────────────────────────────────────────────────────

@Composable
private fun EmojiPanel(
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
                            else androidx.compose.ui.graphics.Color.Transparent
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

// ─── Panel Foto ──────────────────────────────────────────────────────────────

@Composable
private fun FotoPanel(onPickFoto: () -> Unit) {
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
            Text("Seleccionar imagen", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("JPG · PNG · WEBP", fontSize = 11.sp, color = MaterialTheme.colorScheme.outline)
        }
    }
}

// ─── Panel URL ───────────────────────────────────────────────────────────────

@Composable
private fun UrlPanel(value: String, onValueChange: (String) -> Unit) {
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
