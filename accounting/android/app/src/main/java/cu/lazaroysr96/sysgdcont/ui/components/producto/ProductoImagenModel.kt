package cu.lazaroysr96.sysgdcont.ui.components.producto

/**
 * ProductoImagenModel.kt
 *
 * Modelo central para el campo `emoji` de la BD.
 * Compatible con registros viejos (emoji plano) y nuevos (JSON serializado).
 *
 * Uso:
 *   val img = producto.emoji.toProductoImagen()
 *   val json = ProductoImagen("emoji", "📦").toJson()
 */

import android.net.Uri
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

// ─── Modelo ──────────────────────────────────────────────────────────────────

@Serializable
data class ProductoImagen(
    val type: String, // "emoji" | "foto" | "url"
    val data: String
) {
    companion object {
        val DEFAULT = ProductoImagen("emoji", "📦")
    }
}

fun String?.toProductoImagen(): ProductoImagen =
    if (this.isNullOrBlank()) ProductoImagen.DEFAULT
    else try { Json.decodeFromString(this) }
    catch (_: Exception) { ProductoImagen("emoji", this) }

fun ProductoImagen.toJson(): String = Json.encodeToString(this)

// ─── Tabs ─────────────────────────────────────────────────────────────────────

enum class ImagenTab(val label: String) {
    EMOJI("Emoji"),
    FOTO("Foto"),
    URL("URL")
}

fun ProductoImagen.toTab(): ImagenTab = when (type) {
    "foto" -> ImagenTab.FOTO
    "url"  -> ImagenTab.URL
    else   -> ImagenTab.EMOJI
}

// ─── Emojis por defecto ───────────────────────────────────────────────────────

val DEFAULT_EMOJIS = listOf(
    "📦", "🍔", "☕", "🥤", "🍟", "🍕", "🎁", "🥪", "🌮", "🍜",
    "🍰", "🧁", "🍩", "🍪", "🍫", "🍬", "🍭", "🥛", "🧃", "🍵",
    "👕", "👖", "👗", "👟", "🎒", "👑", "🎩",
    "📱", "💻", "📷", "📺", "🔋", "💡",
    "🧹", "🧼", "🧴", "🔑", "📁", "✏️"
)
