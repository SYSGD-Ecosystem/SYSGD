package cu.lazaroysr96.sysgdcont.ui.fichacosto

import android.content.Context
import com.google.gson.Gson

private const val FICHA_COSTO_PREFS = "fichas_costo_productos_prefs"
private const val FICHA_COSTO_KEY_PREFIX = "ficha_costo_producto_"

/**
 * Almacenamiento temporal de fichas de costo por producto.
 *
 * Esta capa usa preferencias internas hasta que la funcionalidad se estabilice
 * y pueda migrarse oficialmente al backend/base de datos.
 */
object FichaCostoProductoPreferences {
    private val gson = Gson()

    fun hasFicha(context: Context, productoId: String): Boolean =
        prefs(context).contains(key(productoId))

    fun loadFicha(context: Context, productoId: String): FichaCostoPersistida? {
        val raw = prefs(context).getString(key(productoId), null) ?: return null
        return runCatching { gson.fromJson(raw, FichaCostoPersistida::class.java) }.getOrNull()
    }

    fun saveFicha(context: Context, productoId: String, ficha: FichaCostoPersistida) {
        prefs(context)
            .edit()
            .putString(key(productoId), gson.toJson(ficha))
            .apply()
    }

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(FICHA_COSTO_PREFS, Context.MODE_PRIVATE)

    private fun key(productoId: String) = "$FICHA_COSTO_KEY_PREFIX$productoId"
}
