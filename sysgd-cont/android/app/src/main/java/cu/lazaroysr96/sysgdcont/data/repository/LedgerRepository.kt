package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import cu.lazaroysr96.sysgdcont.data.api.ApiService
import cu.lazaroysr96.sysgdcont.data.model.*
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.ledgerDataStore: DataStore<Preferences> by preferencesDataStore(name = "ledger_prefs")

@Singleton
class LedgerRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: ApiService,
    private val authRepository: AuthRepository
) {
    companion object {
        private val REGISTRO_KEY = stringPreferencesKey("registro_tcp")
        private val LAST_SYNC_KEY = stringPreferencesKey("last_sync")
        private val LOCAL_MODIFIED_KEY = stringPreferencesKey("local_modified")
    }

    private val gson = Gson()

    val registro: Flow<RegistroTCP> = context.ledgerDataStore.data.map { prefs ->
        val raw = prefs[REGISTRO_KEY]
        if (raw != null) {
            try {
                gson.fromJson(raw, RegistroTCP::class.java)
            } catch (e: Exception) {
                emptyRegistro()
            }
        } else {
            emptyRegistro()
        }
    }

    val lastSync: Flow<String?> = context.ledgerDataStore.data.map { prefs ->
        prefs[LAST_SYNC_KEY]
    }

    suspend fun getRegistro(): RegistroTCP = registro.first()

    suspend fun saveRegistro(registro: RegistroTCP) {
        context.ledgerDataStore.edit { prefs ->
            prefs[REGISTRO_KEY] = gson.toJson(registro)
            prefs[LOCAL_MODIFIED_KEY] = "true"
        }
    }

    suspend fun markAsSynced() {
        context.ledgerDataStore.edit { prefs ->
            prefs[LOCAL_MODIFIED_KEY] = "false"
        }
    }

    suspend fun isLocalModified(): Boolean {
        return context.ledgerDataStore.data.first()[LOCAL_MODIFIED_KEY] == "true"
    }

    suspend fun updateGenerales(data: GeneralesData) {
        val current = getRegistro()
        saveRegistro(current.copy(generales = data))
    }

    suspend fun addIngreso(month: String, dia: Int, importe: Double) {
        addEntry("ingresos", month, dia, importe)
    }

    suspend fun addGasto(month: String, dia: Int, importe: Double) {
        addEntry("gastos", month, dia, importe)
    }

    private suspend fun addEntry(type: String, month: String, dia: Int, importe: Double) {
        val current = getRegistro()
        val entries = when (type) {
            "ingresos" -> current.ingresos.toMutableMap()
            "gastos" -> current.gastos.toMutableMap()
            else -> return
        }

        val monthEntries = entries[month]?.toMutableList() ?: mutableListOf()
        monthEntries.add(DayAmountRow(dia.toString(), String.format("%.2f", importe)))

        entries[month] = monthEntries

        val updated = when (type) {
            "ingresos" -> current.copy(ingresos = entries)
            "gastos" -> current.copy(gastos = entries)
            else -> current
        }
        saveRegistro(updated)
    }

    suspend fun updateTributos(month: String, values: TributoRow) {
        val current = getRegistro()
        val index = LedgerConstants.MONTHS.indexOf(month)
        if (index == -1) return

        val newTributos = current.tributos.toMutableList()
        if (index < newTributos.size) {
            newTributos[index] = values
        } else {
            while (newTributos.size < index) {
                newTributos.add(TributoRow(mes = ""))
            }
            newTributos.add(values)
        }
        saveRegistro(current.copy(tributos = newTributos))
    }

    suspend fun pull(): Result<RegistroTCP> {
        return try {
            val token = authRepository.getToken() ?: return Result.failure(Exception("No token"))
            val response = apiService.getLedger("Bearer $token")
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.registro != null) {
                    saveRegistro(body.registro)
                    context.ledgerDataStore.edit { prefs ->
                        prefs[LAST_SYNC_KEY] = body.updatedAt ?: ""
                    }
                    Result.success(body.registro)
                } else {
                    Result.success(getRegistro())
                }
            } else {
                Result.failure(Exception("Pull failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun push(): Result<Unit> {
        return try {
            val token = authRepository.getToken() ?: return Result.failure(Exception("No token"))
            val registro = getRegistro()
            val response = apiService.updateLedger("Bearer $token", registro)
            if (response.isSuccessful) {
                context.ledgerDataStore.edit { prefs ->
                    prefs[LAST_SYNC_KEY] = java.time.Instant.now().toString()
                    prefs[LOCAL_MODIFIED_KEY] = "false"
                }
                Result.success(Unit)
            } else {
                Result.failure(Exception("Push failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sync(): Result<SyncResult> {
        return try {
            val localModified = isLocalModified()
            val localRegistro = getRegistro()
            
            // Paso 1: Si hay cambios locales, subir primero
            if (localModified) {
                val pushResult = push()
                if (pushResult.isFailure) {
                    return Result.failure(pushResult.exceptionOrNull() ?: Exception("Push failed"))
                }
            }

            // Paso 2: Pull para obtener datos del servidor
            val pullResult = pull()
            if (pullResult.isFailure) {
                return Result.failure(pullResult.exceptionOrNull() ?: Exception("Pull failed"))
            }

            val remoteRegistro = pullResult.getOrNull()
            val hasRemoteData = remoteRegistro?.let { 
                it.generales.nombre.isNotEmpty() || 
                it.ingresos.values.any { list -> list.isNotEmpty() } ||
                it.gastos.values.any { list -> list.isNotEmpty() }
            } ?: false

            val result = when {
                !localModified && !hasRemoteData -> {
                    SyncResult(true, "Sin cambios", SyncAction.NO_CHANGES)
                }
                localModified && !hasRemoteData -> {
                    markAsSynced()
                    SyncResult(true, "Datos subidos (servidor vacío)", SyncAction.PUSH_ONLY)
                }
                !localModified && hasRemoteData -> {
                    SyncResult(true, "Datos descargados", SyncAction.PULL_ONLY)
                }
                else -> {
                    markAsSynced()
                    SyncResult(true, "Sincronizado (datos combinados)", SyncAction.MERGED)
                }
            }

            Result.success(result)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun calculateAnnualReport(registro: RegistroTCP): AnnualReport {
        val monthly = LedgerConstants.MONTHS.map { month ->
            val ingresos = monthTotal(registro.ingresos[month] ?: emptyList())
            val gastos = monthTotal(registro.gastos[month] ?: emptyList())
            val tribIndex = LedgerConstants.MONTHS.indexOf(month)
            val tributos = if (tribIndex < registro.tributos.size) {
                tributosSubtotal(registro.tributos[tribIndex])
            } else 0.0
            val otros = if (tribIndex < registro.tributos.size) {
                otrosDeduciblesSubtotal(registro.tributos[tribIndex])
            } else 0.0

            MonthlyTotals(
                month = month,
                ingresos = ingresos,
                gastos = gastos,
                tributos = tributos,
                otrosDeducibles = otros,
                neto = round2(ingresos - gastos - tributos - otros)
            )
        }

        val totalIngresos = monthly.sumOf { it.ingresos }
        val totalGastos = monthly.sumOf { it.gastos }
        val totalTributos = monthly.sumOf { it.tributos }
        val totalOtros = monthly.sumOf { it.otrosDeducibles }
        val baseImponible = round2(totalIngresos - totalGastos - totalTributos - totalOtros)

        return AnnualReport(
            year = registro.generales.anio,
            totalIngresos = totalIngresos,
            totalGastos = totalGastos,
            totalTributos = totalTributos,
            totalOtrosDeducibles = totalOtros,
            baseImponible = baseImponible,
            impuestoEstimado = estimateIncomeTax(baseImponible),
            monthly = monthly
        )
    }

    private fun monthTotal(rows: List<DayAmountRow>): Double {
        return round2(rows.sumOf { it.importe.toDoubleOrNull() ?: 0.0 })
    }

    private fun tributosSubtotal(item: TributoRow): Double {
        val keys = listOf("ventas", "fuerza", "sellos", "anuncios", "css20", "css14", "otros")
        return round2(keys.sumOf { key ->
            when (key) {
                "ventas" -> item.ventas.toDoubleOrNull() ?: 0.0
                "fuerza" -> item.fuerza.toDoubleOrNull() ?: 0.0
                "sellos" -> item.sellos.toDoubleOrNull() ?: 0.0
                "anuncios" -> item.anuncios.toDoubleOrNull() ?: 0.0
                "css20" -> item.css20.toDoubleOrNull() ?: 0.0
                "css14" -> item.css14.toDoubleOrNull() ?: 0.0
                "otros" -> item.otros.toDoubleOrNull() ?: 0.0
                else -> 0.0
            }
        })
    }

    private fun otrosDeduciblesSubtotal(item: TributoRow): Double {
        return round2(
            (item.restauracion.toDoubleOrNull() ?: 0.0) +
            (item.arrendamiento.toDoubleOrNull() ?: 0.0) +
            (item.exonerado.toDoubleOrNull() ?: 0.0) +
            (item.otrosMFP.toDoubleOrNull() ?: 0.0) +
            (item.cuotaMensual.toDoubleOrNull() ?: 0.0)
        )
    }

    private fun estimateIncomeTax(baseImponible: Double): Double {
        if (baseImponible <= 10000) return 0.0
        return when {
            baseImponible <= 20000 -> round2((baseImponible - 10000) * 0.25)
            baseImponible <= 30000 -> round2(2500 + (baseImponible - 20000) * 0.30)
            baseImponible <= 50000 -> round2(5500 + (baseImponible - 30000) * 0.35)
            else -> round2(12500 + (baseImponible - 50000) * 0.40)
        }
    }

    private fun round2(value: Double): Double = Math.round(value * 100) / 100.0

    private fun emptyRegistro(): RegistroTCP {
        val emptyMonthEntries = LedgerConstants.MONTHS.associateWith { emptyList<DayAmountRow>() }
        val emptyTributos = LedgerConstants.MONTHS.map { month ->
            TributoRow(mes = LedgerConstants.monthLabels[month] ?: month)
        }
        return RegistroTCP(
            GeneralesData(anio = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)),
            emptyMonthEntries,
            emptyMonthEntries,
            emptyTributos
        )
    }
}

object LedgerConstants {
    val MONTHS = listOf("ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC")
    val monthLabels = mapOf(
        "ENE" to "Enero", "FEB" to "Febrero", "MAR" to "Marzo", "ABR" to "Abril",
        "MAY" to "Mayo", "JUN" to "Junio", "JUL" to "Julio", "AGO" to "Agosto",
        "SEP" to "Septiembre", "OCT" to "Octubre", "NOV" to "Noviembre", "DIC" to "Diciembre"
    )
}
