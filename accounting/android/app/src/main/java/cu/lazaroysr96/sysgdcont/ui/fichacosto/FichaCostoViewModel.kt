package cu.lazaroysr96.sysgdcont.ui.fichacosto

import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import javax.inject.Inject
import android.content.Context
import android.widget.Toast

class FichaCostoViewModel : ViewModel() {

    val estado = FichaCostoState()

    /** Lista principal de filas (mutable para permitir inserción de dinámicas) */
    val filas = mutableStateListOf<FilaCosto>().apply {
        addAll(buildFilasIniciales())
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Cálculos automáticos
    // ─────────────────────────────────────────────────────────────────────

    /** Recalcula todas las filas de tipo CALCULADA.
     *  Se llama cada vez que el usuario confirma un valor en la calculadora.
     */
    fun recalcular() {
        val mapa = filas.associateBy { it.id }

        fun sumBase(vararg ids: String) =
            ids.sumOf { mapa[it]?.costoBase?.value ?: 0.0 }

        fun sumNuevo(vararg ids: String) =
            ids.sumOf { mapa[it]?.costoNuevo?.value ?: 0.0 }

        // Fila 5 = 1 + 2 + 3 + 4
        mapa["5"]?.let { f5 ->
            f5.costoBase.value = sumBase("1", "2", "3", "4")
            f5.costoNuevo.value = sumNuevo("1", "2", "3", "4")
        }

        // Fila 11 = 6 + 7 + 8 + 9 + 10
        mapa["11"]?.let { f11 ->
            f11.costoBase.value = sumBase("6", "7", "8", "9", "10")
            f11.costoNuevo.value = sumNuevo("6", "7", "8", "9", "10")
        }

        // Fila 12 = 5 + 11
        mapa["12"]?.let { f12 ->
            f12.costoBase.value = sumBase("5", "11")
            f12.costoNuevo.value = sumNuevo("5", "11")
        }
    }


    // ─────────────────────────────────────────────────────────────────────
    //  Gestión de subfilas dinámicas
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Añade una subfila dinámica justo después del grupo padre.
     *
     * @param grupoId  ID del grupo padre (ej. "2")
     * @param etiqueta Texto descriptivo que escribe el usuario
     */
    fun agregarSubfila(grupoId: String, etiqueta: String) {
        val idxPadre = filas.indexOfFirst { it.id == grupoId }
        if (idxPadre < 0) return

        val padre = filas[idxPadre]
        val numSubfilasExistentes = padre.subFilasDinamicas.size
        val nuevoNumero = "$grupoId.${numSubfilasExistentes + 1}"
        val nuevoId = "${grupoId}_d${numSubfilasExistentes + 1}"

        val nuevaFila = FilaCosto(
            id = nuevoId,
            numero = nuevoNumero,
            etiqueta = etiqueta,
            tipo = FilaTipo.SUBFILA,
        )

        // Registrar en la lista interna del padre (para PDF / referencia)
        padre.subFilasDinamicas.add(nuevaFila)

        // Insertar en la lista principal después del último hijo del padre
        // (busca el último hijo cuyo id empieza por grupoId)
        var posInsercion = idxPadre + 1
        for (i in (idxPadre + 1) until filas.size) {
            val fila = filas[i]
            if (fila.id.startsWith("${grupoId}_d") || fila.id.startsWith("$grupoId.")) {
                posInsercion = i + 1
            } else {
                break
            }
        }
        filas.add(posInsercion, nuevaFila)
    }

    /**
     * Elimina una subfila dinámica.
     */
    fun eliminarSubfilaDinamica(filaId: String) {
        val fila = filas.firstOrNull { it.id == filaId } ?: return
        // Quitar del padre
        filas.forEach { it.subFilasDinamicas.remove(fila) }
        // Quitar de la lista principal
        filas.remove(fila)
        recalcular()
    }


    // ─────────────────────────────────────────────────────────────────────
    //  Acceso plano para el PDF
    // ─────────────────────────────────────────────────────────────────────

    /** Retorna la lista completa de filas (incluyendo dinámicas ya insertadas) */
    fun filasParaPdf(): List<FilaCosto> = filas.toList()

    fun generatePDF(context: Context){
        // val context = LocalContext.current
        try{
        val fichaCostoPdfGenerator = FichaCostoPdfGenerator(context)
        fichaCostoPdfGenerator.generarYAbrir(estado, filasParaPdf())
        }catch(e: Exception){
            Toast.makeText(
                    context,
                    e.message,
                    Toast.LENGTH_SHORT
                ).show()
        }
    }
}
