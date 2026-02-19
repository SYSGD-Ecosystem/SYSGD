package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Context
import android.content.Intent
import android.os.Environment
import androidx.core.content.FileProvider
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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
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
        private val SERVER_VERSION_KEY = stringPreferencesKey("server_version")
        private val LAST_DOWNLOADED_VERSION_KEY = stringPreferencesKey("last_downloaded_version")
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

    suspend fun getServerVersion(): String {
        return context.ledgerDataStore.data.first()[SERVER_VERSION_KEY] ?: ""
    }

    suspend fun getLastDownloadedVersion(): String {
        return context.ledgerDataStore.data.first()[LAST_DOWNLOADED_VERSION_KEY] ?: ""
    }

    private suspend fun updateVersions(serverVersion: String, lastDownloaded: String) {
        context.ledgerDataStore.edit { prefs ->
            prefs[SERVER_VERSION_KEY] = serverVersion
            prefs[LAST_DOWNLOADED_VERSION_KEY] = lastDownloaded
        }
    }

    suspend fun generateLocalVersion(): String {
        return System.currentTimeMillis().toString()
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
            val token = authRepository.getToken() ?: return Result.failure(Exception("No token"))
            val localModified = isLocalModified()
            val lastDownloadedVersion = getLastDownloadedVersion()
            
            // Paso 1: Obtener datos actuales del servidor
            val response = apiService.getLedger("Bearer $token")
            if (!response.isSuccessful) {
                return Result.failure(Exception("Error al obtener datos: ${response.code()}"))
            }
            
            val body = response.body()
            val currentServerVersion = body?.updatedAt ?: ""
            val remoteRegistro = body?.registro
            
            // Paso 2: Verificar si el servidor cambió desde la última descarga
            val serverChanged = currentServerVersion != lastDownloadedVersion && lastDownloadedVersion.isNotEmpty()
            
            when {
                // Caso 1: No hay cambios locales y no hay datos remotos
                !localModified && remoteRegistro == null -> {
                    Result.success(SyncResult(true, "Sin cambios", SyncAction.NO_CHANGES))
                }
                
                // Caso 2: Hay cambios locales pero el servidor no cambió
                localModified && !serverChanged -> {
                    // Subir datos locales
                    val registro = getRegistro()
                    val updateResponse = apiService.updateLedger("Bearer $token", registro)
                    if (updateResponse.isSuccessful) {
                        // Siempre descargar datos del servidor después de subir
                        if (remoteRegistro != null) {
                            saveRegistro(remoteRegistro)
                            updateVersions(currentServerVersion, currentServerVersion)
                        }
                        markAsSynced()
                        Result.success(SyncResult(true, "Cambios subidos y datos actualizados", SyncAction.MERGED))
                    } else {
                        Result.failure(Exception("Error al subir: ${updateResponse.code()}"))
                    }
                }
                
                // Caso 3: Hay cambios locales Y el servidor cambió = CONFLICTO
                localModified && serverChanged -> {
                    // Verificar si hay conflictos reales (mismo día con valores distintos)
                    val localRegistro = getRegistro()
                    val conflictInfo = checkForConflicts(localRegistro, remoteRegistro!!)
                    
                    Result.success(SyncResult(
                        success = true,
                        message = "Conflicto detectado: cambios locales y remotos",
                        action = SyncAction.CONFLICT_DETECTED,
                        conflictInfo = conflictInfo,
                        needsUserDecision = true
                    ))
                }
                
                // Caso 4: No hay cambios locales pero el servidor cambió
                !localModified && serverChanged -> {
                    // Descargar datos del servidor
                    if (remoteRegistro != null) {
                        saveRegistro(remoteRegistro)
                        updateVersions(currentServerVersion, currentServerVersion)
                        markAsSynced()
                        Result.success(SyncResult(true, "Datos descargados del servidor", SyncAction.PULL_ONLY))
                    } else {
                        Result.success(SyncResult(true, "Sin cambios", SyncAction.NO_CHANGES))
                    }
                }
                
                else -> {
                    // En cualquier caso, siempre guardar datos remotos si existen
                    if (remoteRegistro != null) {
                        saveRegistro(remoteRegistro)
                        updateVersions(currentServerVersion, currentServerVersion)
                    }
                    Result.success(SyncResult(true, "Sincronizado", SyncAction.MERGED))
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun checkForConflicts(local: RegistroTCP, remote: RegistroTCP): ConflictInfo {
        val conflicts = mutableListOf<String>()
        
        // Verificar conflictos en ingresos
        LedgerConstants.MONTHS.forEach { month ->
            val localIngresos = local.ingresos[month] ?: emptyList()
            val remoteIngresos = remote.ingresos[month] ?: emptyList()
            
            localIngresos.forEach { localEntry ->
                val remoteEntry = remoteIngresos.find { it.dia == localEntry.dia }
                if (remoteEntry != null && remoteEntry.importe != localEntry.importe) {
                    conflicts.add("Ingreso día ${localEntry.dia}/$month: local=${localEntry.importe}, remoto=${remoteEntry.importe}")
                }
            }
        }
        
        // Verificar conflictos en gastos
        LedgerConstants.MONTHS.forEach { month ->
            val localGastos = local.gastos[month] ?: emptyList()
            val remoteGastos = remote.gastos[month] ?: emptyList()
            
            localGastos.forEach { localEntry ->
                val remoteEntry = remoteGastos.find { it.dia == localEntry.dia }
                if (remoteEntry != null && remoteEntry.importe != localEntry.importe) {
                    conflicts.add("Gasto día ${localEntry.dia}/$month: local=${localEntry.importe}, remoto=${remoteEntry.importe}")
                }
            }
        }
        
        return if (conflicts.isNotEmpty()) {
            ConflictInfo(
                hasConflict = true,
                conflictMessage = conflicts.joinToString("\n"),
                localNewEntries = emptyList(),
                remoteNewEntries = emptyList()
            )
        } else {
            ConflictInfo(
                hasConflict = false,
                conflictMessage = "No hay conflictos, se puede hacer merge automático"
            )
        }
    }

    suspend fun resolveConflict(useLocal: Boolean, remoteRegistro: RegistroTCP) {
        val token = authRepository.getToken() ?: return
        
        val registroToSave = if (useLocal) {
            getRegistro()
        } else {
            remoteRegistro
        }
        
        val response = apiService.updateLedger("Bearer $token", registroToSave)
        if (response.isSuccessful) {
            val newServerVersion = response.body()?.let {
                java.time.Instant.now().toString()
            } ?: ""
            saveRegistro(registroToSave)
            updateVersions(newServerVersion, newServerVersion)
            markAsSynced()
        }
    }

    suspend fun mergeVersions(local: RegistroTCP, remote: RegistroTCP): RegistroTCP {
        val mergedIngresos = mergeEntries(local.ingresos, remote.ingresos)
        val mergedGastos = mergeEntries(local.gastos, remote.gastos)
        
        // Los tributos se reemplazan (son más complejos)
        val mergedTributos = if (remote.tributos.isNotEmpty()) remote.tributos else local.tributos
        
        // Generales del más completo
        val mergedGenerales = if (remote.generales.nombre.isNotEmpty()) remote.generales else local.generales
        
        return RegistroTCP(
            generales = mergedGenerales,
            ingresos = mergedIngresos,
            gastos = mergedGastos,
            tributos = mergedTributos
        )
    }

    private fun mergeEntries(
        local: Map<String, List<DayAmountRow>>,
        remote: Map<String, List<DayAmountRow>>
    ): Map<String, List<DayAmountRow>> {
        val merged = mutableMapOf<String, List<DayAmountRow>>()
        
        LedgerConstants.MONTHS.forEach { month ->
            val localEntries = local[month] ?: emptyList()
            val remoteEntries = remote[month] ?: emptyList()
            
            // Combinar entradas, RemoteEntries con mismo día reemplaza local
            val allDays = (localEntries.map { it.dia.toIntOrNull() ?: 0 } + remoteEntries.map { it.dia.toIntOrNull() ?: 0 }).toSet()
            
            val mergedEntries = allDays.mapNotNull { dia ->
                val localEntry = localEntries.find { it.dia.toIntOrNull() == dia }
                val remoteEntry = remoteEntries.find { it.dia.toIntOrNull() == dia }
                
                when {
                    remoteEntry != null -> remoteEntry
                    localEntry != null -> localEntry
                    else -> null
                }
            }.sortedBy { it.dia }
            
            merged[month] = mergedEntries
        }
        
        return merged
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

    suspend fun downloadPdf(): Result<Intent> {
        return withContext(Dispatchers.IO) {
            try {
                val token = authRepository.getToken() ?: return@withContext Result.failure(Exception("No token"))
                val registro = getRegistro()

                val response = apiService.downloadPdf("Bearer $token", registro)

                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("Error al generar PDF: ${response.code()}"))
                }

                val body = response.body()
                if (body == null) {
                    return@withContext Result.failure(Exception("Respuesta vacía del servidor"))
                }

                val fileName = "Registro_TCP_${registro.generales.anio}.pdf"
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val file = File(downloadsDir, fileName)

                FileOutputStream(file).use { output ->
                    body.byteStream().use { input ->
                        input.copyTo(output)
                    }
                }

                val uri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    file
                )

                val shareIntent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, "application/pdf")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }

                Result.success(Intent.createChooser(shareIntent, "Abrir PDF"))
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
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
