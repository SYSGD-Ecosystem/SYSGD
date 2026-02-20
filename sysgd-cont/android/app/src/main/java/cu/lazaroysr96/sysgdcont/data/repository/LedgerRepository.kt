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
import cu.lazaroysr96.sysgdcont.data.api.ApiService
import cu.lazaroysr96.sysgdcont.data.model.*
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import okhttp3.ResponseBody
import retrofit2.Response
import java.io.File
import java.io.FileOutputStream
import java.util.Locale
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
        private val BASELINE_REGISTRO_KEY = stringPreferencesKey("baseline_registro")
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

    val localModified: Flow<Boolean> = context.ledgerDataStore.data.map { prefs ->
        prefs[LOCAL_MODIFIED_KEY] == "true"
    }

    suspend fun getRegistro(): RegistroTCP = registro.first()

    private suspend fun saveRegistro(registro: RegistroTCP, modifiedByUser: Boolean) {
        context.ledgerDataStore.edit { prefs ->
            prefs[REGISTRO_KEY] = gson.toJson(registro)
            prefs[LOCAL_MODIFIED_KEY] = if (modifiedByUser) "true" else "false"
        }
    }

    private suspend fun saveBaseline(registro: RegistroTCP, serverVersion: String) {
        val resolvedVersion = if (serverVersion.isNotBlank()) {
            serverVersion
        } else {
            java.time.Instant.now().toString()
        }
        context.ledgerDataStore.edit { prefs ->
            prefs[BASELINE_REGISTRO_KEY] = gson.toJson(registro)
            prefs[LAST_DOWNLOADED_VERSION_KEY] = resolvedVersion
            prefs[SERVER_VERSION_KEY] = resolvedVersion
            prefs[LOCAL_MODIFIED_KEY] = "false"
            prefs[LAST_SYNC_KEY] = java.time.Instant.now().toString()
        }
    }

    suspend fun saveUserEditedRegistro(registro: RegistroTCP) {
        saveRegistro(registro, modifiedByUser = true)
    }

    suspend fun replaceLocalWithRemote(registro: RegistroTCP, serverVersion: String): Result<SyncResult> {
        return try {
            saveRegistro(registro, modifiedByUser = false)
            saveBaseline(registro, serverVersion)
            Result.success(
                SyncResult(
                    success = true,
                    message = "Datos locales actualizados desde la nube",
                    action = SyncAction.PULL_ONLY
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadLocalToRemote(): Result<SyncResult> {
        return try {
            val token = authRepository.getToken() ?: return Result.failure(Exception("No token"))
            val localRegistro = getRegistro()
            val updateResponse = apiService.updateLedger(
                "Bearer $token",
                UpdateLedgerRequest(registro = localRegistro)
            )
            if (!updateResponse.isSuccessful) {
                return Result.failure(Exception("Error al subir datos: ${updateResponse.code()}"))
            }

            val refreshedRemote = fetchRemote(token)
            val refreshedVersion = refreshedRemote.updatedAt.orEmpty()
            val registroFinal = refreshedRemote.registro ?: localRegistro

            saveRegistro(registroFinal, modifiedByUser = false)
            saveBaseline(registroFinal, refreshedVersion)

            Result.success(
                SyncResult(
                    success = true,
                    message = "Datos en la nube actualizados correctamente",
                    action = SyncAction.PUSH_ONLY
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadMergedToRemote(mergedRegistro: RegistroTCP): Result<SyncResult> {
        return try {
            val token = authRepository.getToken() ?: return Result.failure(Exception("No token"))
            val updateResponse = apiService.updateLedger(
                "Bearer $token",
                UpdateLedgerRequest(registro = mergedRegistro)
            )
            if (!updateResponse.isSuccessful) {
                return Result.failure(Exception("Error al subir merge: ${updateResponse.code()}"))
            }

            val refreshedRemote = fetchRemote(token)
            val refreshedVersion = refreshedRemote.updatedAt.orEmpty()
            val registroFinal = refreshedRemote.registro ?: mergedRegistro

            saveRegistro(registroFinal, modifiedByUser = false)
            saveBaseline(registroFinal, refreshedVersion)

            Result.success(
                SyncResult(
                    success = true,
                    message = "Merge aplicado y sincronizado",
                    action = SyncAction.MERGED
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun isLocalModified(): Boolean {
        return context.ledgerDataStore.data.first()[LOCAL_MODIFIED_KEY] == "true"
    }

    private suspend fun getLastDownloadedVersion(): String {
        return context.ledgerDataStore.data.first()[LAST_DOWNLOADED_VERSION_KEY] ?: ""
    }

    private suspend fun hasBaselineVersion(): Boolean {
        return getLastDownloadedVersion().isNotEmpty()
    }

    private suspend fun hasLocalSnapshot(): Boolean {
        return context.ledgerDataStore.data.first()[REGISTRO_KEY] != null
    }

    private suspend fun fetchRemote(token: String): ContLedgerResponse {
        val response = apiService.getLedger("Bearer $token")
        if (!response.isSuccessful) {
            throw Exception("Error al obtener datos remotos: ${response.code()}")
        }
        return response.body() ?: ContLedgerResponse(registro = null, updatedAt = "")
    }

    suspend fun updateGenerales(data: GeneralesData) {
        val current = getRegistro()
        saveUserEditedRegistro(current.copy(generales = data))
    }

    suspend fun addIngreso(month: String, dia: Int, importe: Double) {
        addEntry("ingresos", month, dia, importe)
    }

    suspend fun addGasto(month: String, dia: Int, importe: Double) {
        addEntry("gastos", month, dia, importe)
    }

    suspend fun deleteIngreso(month: String, dia: Int) {
        deleteEntry("ingresos", month, dia)
    }

    suspend fun deleteGasto(month: String, dia: Int) {
        deleteEntry("gastos", month, dia)
    }

    suspend fun updateIngreso(month: String, oldDia: Int, newDia: Int, importe: Double) {
        updateEntry("ingresos", month, oldDia, newDia, importe)
    }

    suspend fun updateGasto(month: String, oldDia: Int, newDia: Int, importe: Double) {
        updateEntry("gastos", month, oldDia, newDia, importe)
    }

    private suspend fun updateEntry(type: String, month: String, oldDia: Int, newDia: Int, importe: Double) {
        val current = getRegistro()
        val entries = when (type) {
            "ingresos" -> current.ingresos.toMutableMap()
            "gastos" -> current.gastos.toMutableMap()
            else -> return
        }

        val monthEntries = entries[month]?.toMutableList() ?: mutableListOf()
        
        // Remove old entry
        monthEntries.removeAll { it.dia == oldDia.toString() }
        
        // Add new entry with new day
        if (newDia in 1..31 && importe > 0) {
            monthEntries.add(DayAmountRow(newDia.toString(), String.format("%.2f", importe)))
        }

        entries[month] = monthEntries

        val updated = when (type) {
            "ingresos" -> current.copy(ingresos = entries)
            "gastos" -> current.copy(gastos = entries)
            else -> current
        }
        saveUserEditedRegistro(updated)
    }

    private suspend fun deleteEntry(type: String, month: String, dia: Int) {
        val current = getRegistro()
        val entries = when (type) {
            "ingresos" -> current.ingresos.toMutableMap()
            "gastos" -> current.gastos.toMutableMap()
            else -> return
        }

        val monthEntries = entries[month]?.toMutableList() ?: mutableListOf()
        monthEntries.removeAll { it.dia == dia.toString() }

        entries[month] = monthEntries

        val updated = when (type) {
            "ingresos" -> current.copy(ingresos = entries)
            "gastos" -> current.copy(gastos = entries)
            else -> current
        }
        saveUserEditedRegistro(updated)
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
        saveUserEditedRegistro(updated)
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
        saveUserEditedRegistro(current.copy(tributos = newTributos))
    }

    suspend fun pull(): Result<RegistroTCP> {
        return try {
            val token = authRepository.getToken() ?: return Result.failure(Exception("No token"))
            val remote = fetchRemote(token)
            val remoteRegistro = remote.registro ?: return Result.success(getRegistro())
            replaceLocalWithRemote(remoteRegistro, remote.updatedAt.orEmpty())
                .map { remoteRegistro }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun push(): Result<Unit> {
        return uploadLocalToRemote().map { Unit }
    }

    suspend fun sync(): Result<SyncResult> {
        return try {
            val token = authRepository.getToken() ?: return Result.failure(Exception("No token"))
            val localRegistro = getRegistro()
            val localModified = isLocalModified()
            val hasBaseline = hasBaselineVersion()
            val hasLocalData = hasLocalSnapshot()
            val baselineVersion = getLastDownloadedVersion()
            val remote = fetchRemote(token)
            val remoteRegistro = remote.registro
            val remoteVersion = remote.updatedAt.orEmpty()
            val serverChanged = hasBaseline && remoteVersion != baselineVersion

            when {
                remoteRegistro == null && !localModified -> {
                    Result.success(SyncResult(true, "No hay datos para sincronizar", SyncAction.NO_CHANGES))
                }

                remoteRegistro == null && localModified -> {
                    Result.success(
                        SyncResult(
                            success = true,
                            message = "No hay datos en la nube. ¿Deseas subir tus cambios locales?",
                            action = SyncAction.PUSH_ONLY,
                            needsUserDecision = true
                        )
                    )
                }

                !localModified && (!hasBaseline || !hasLocalData || serverChanged) -> {
                    Result.success(
                        SyncResult(
                            success = true,
                            message = "Se encontraron cambios en la nube. ¿Deseas actualizar tus datos locales?",
                            action = SyncAction.PULL_ONLY,
                            needsUserDecision = true,
                            remoteRegistro = remoteRegistro,
                            remoteVersion = remoteVersion
                        )
                    )
                }

                !localModified && hasBaseline && !serverChanged -> {
                    Result.success(SyncResult(true, "Ya estás sincronizado con la nube", SyncAction.NO_CHANGES))
                }

                localModified && !hasBaseline && remoteRegistro != null -> {
                    val conflictInfo = checkForConflicts(localRegistro, remoteRegistro)
                    val merged = if (!conflictInfo.hasConflict) {
                        mergeVersions(localRegistro, remoteRegistro)
                    } else {
                        null
                    }
                    val message = if (conflictInfo.hasConflict) {
                        "Ya existen datos en nube y también cambios locales. Elige cómo resolver."
                    } else {
                        "Hay datos locales y remotos sin conflicto. Puedes hacer merge."
                    }
                    Result.success(
                        SyncResult(
                            success = true,
                            message = message,
                            action = if (conflictInfo.hasConflict) SyncAction.CONFLICT_DETECTED else SyncAction.MERGED,
                            conflictInfo = conflictInfo,
                            needsUserDecision = true,
                            remoteRegistro = remoteRegistro,
                            remoteVersion = remoteVersion,
                            mergedRegistro = merged
                        )
                    )
                }

                localModified && hasBaseline && !serverChanged -> {
                    Result.success(
                        SyncResult(
                            success = true,
                            message = "Tus cambios locales están listos. ¿Deseas subirlos a la nube?",
                            action = SyncAction.PUSH_ONLY,
                            needsUserDecision = true
                        )
                    )
                }

                localModified && serverChanged -> {
                    val conflictInfo = checkForConflicts(localRegistro, remoteRegistro)
                    val merged = if (!conflictInfo.hasConflict && remoteRegistro != null) {
                        mergeVersions(localRegistro, remoteRegistro)
                    } else {
                        null
                    }
                    val message = if (conflictInfo.hasConflict) {
                        "Hay conflictos entre nube y teléfono. Elige cómo resolver."
                    } else {
                        "Hay cambios en nube y teléfono sin conflicto por día. Puedes hacer merge."
                    }
                    Result.success(
                        SyncResult(
                            success = true,
                            message = message,
                            action = if (conflictInfo.hasConflict) SyncAction.CONFLICT_DETECTED else SyncAction.MERGED,
                            conflictInfo = conflictInfo,
                            needsUserDecision = true,
                            remoteRegistro = remoteRegistro,
                            remoteVersion = remoteVersion,
                            mergedRegistro = merged
                        )
                    )
                }

                else -> Result.success(SyncResult(true, "Sin cambios", SyncAction.NO_CHANGES))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resolveWithRemote(remoteRegistro: RegistroTCP, remoteVersion: String): Result<SyncResult> {
        return replaceLocalWithRemote(remoteRegistro, remoteVersion)
    }

    suspend fun resolveWithLocal(): Result<SyncResult> {
        return uploadLocalToRemote()
    }

    suspend fun resolveWithMerge(mergedRegistro: RegistroTCP): Result<SyncResult> {
        return uploadMergedToRemote(mergedRegistro)
    }

    private fun checkForConflicts(local: RegistroTCP, remote: RegistroTCP?): ConflictInfo {
        if (remote == null) {
            return ConflictInfo(
                hasConflict = false,
                mergePossible = true,
                conflictMessage = "No hay datos remotos, se puede subir versión local."
            )
        }

        val conflicts = mutableListOf<String>()
        
        LedgerConstants.MONTHS.forEach { month ->
            val localIngresos = local.ingresos[month] ?: emptyList()
            val remoteIngresos = remote.ingresos[month] ?: emptyList()
            
            localIngresos.forEach { localEntry ->
                val remoteEntry = remoteIngresos.find { it.dia == localEntry.dia }
                if (remoteEntry != null && normalizeAmount(remoteEntry.importe) != normalizeAmount(localEntry.importe)) {
                    conflicts.add("Ingreso día ${localEntry.dia}/$month: local=${localEntry.importe}, remoto=${remoteEntry.importe}")
                }
            }
        }
        
        LedgerConstants.MONTHS.forEach { month ->
            val localGastos = local.gastos[month] ?: emptyList()
            val remoteGastos = remote.gastos[month] ?: emptyList()
            
            localGastos.forEach { localEntry ->
                val remoteEntry = remoteGastos.find { it.dia == localEntry.dia }
                if (remoteEntry != null && normalizeAmount(remoteEntry.importe) != normalizeAmount(localEntry.importe)) {
                    conflicts.add("Gasto día ${localEntry.dia}/$month: local=${localEntry.importe}, remoto=${remoteEntry.importe}")
                }
            }
        }

        if (local.generales != remote.generales) {
            conflicts.add("Conflicto en datos generales")
        }

        if (local.tributos != remote.tributos) {
            conflicts.add("Conflicto en tributos")
        }
        
        return if (conflicts.isNotEmpty()) {
            ConflictInfo(
                hasConflict = true,
                conflictMessage = conflicts.joinToString("\n"),
                mergePossible = false,
                localNewEntries = emptyList(),
                remoteNewEntries = emptyList()
            )
        } else {
            ConflictInfo(
                hasConflict = false,
                mergePossible = true,
                conflictMessage = "No hay conflictos, se puede hacer merge automático"
            )
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
                    remoteEntry != null -> remoteEntry.copy(importe = normalizeAmount(remoteEntry.importe))
                    localEntry != null -> localEntry.copy(importe = normalizeAmount(localEntry.importe))
                    else -> null
                }
            }.sortedBy { it.dia }
            
            merged[month] = mergedEntries
        }
        
        return merged
    }

    private fun normalizeAmount(value: String): String {
        val number = value.toDoubleOrNull() ?: 0.0
        return String.format(Locale.US, "%.2f", number)
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

    suspend fun downloadPdf(onRetryMessage: (String) -> Unit): Result<Intent> {
        return withContext(Dispatchers.IO) {
            try {
                val token = authRepository.getToken() ?: return@withContext Result.failure(Exception("No token"))
                val registro = getRegistro()

                val pdfPayload = TcpPdfPayload(
                    generalData = PdfGeneralData(
                        anio = registro.generales.anio.toString(),
                        nombre = registro.generales.nombre,
                        nit = registro.generales.nit,
                        fiscalCalle = registro.generales.fiscalCalle,
                        fiscalMunicipio = registro.generales.fiscalMunicipio,
                        fiscalProvincia = registro.generales.fiscalProvincia,
                        legalCalle = registro.generales.legalCalle,
                        legalMunicipio = registro.generales.legalMunicipio,
                        legalProvincia = registro.generales.legalProvincia,
                        actividad = registro.generales.actividad,
                        codigo = registro.generales.codigo
                    ),
                    ingresos = registro.ingresos,
                    gastos = registro.gastos,
                    tributos = registro.tributos.map { row ->
                        TributoPdfRow(
                            mes = row.mes,
                            b = row.ventas,
                            c = row.fuerza,
                            d = row.sellos,
                            e = row.anuncios,
                            f = row.css20,
                            h = row.css14,
                            i = row.otros,
                            j = row.restauracion,
                            l = row.arrendamiento,
                            m = row.exonerado,
                            n = row.otrosMFP,
                            o = row.cuotaMensual,
                            p = ""
                        )
                    }
                )

                val response = apiService.downloadPdf("Bearer $token", pdfPayload)

                if (response.code() == 502) {
                    onRetryMessage("Servidor dormido. Reintentando en 15 segundos...")
                    delay(15000)
                    val retryResponse = apiService.downloadPdf("Bearer $token", pdfPayload)
                    if (!retryResponse.isSuccessful) {
                        return@withContext Result.failure(Exception("Error al generar PDF: ${retryResponse.code()}"))
                    }
                    processPdfResponse(retryResponse)
                } else if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("Error al generar PDF: ${response.code()}"))
                } else {
                    processPdfResponse(response)
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }

    private suspend fun processPdfResponse(response: Response<ResponseBody>): Result<Intent> {
        return withContext(Dispatchers.IO) {
            val body = response.body()
            if (body == null) {
                return@withContext Result.failure(Exception("Respuesta vacía del servidor"))
            }

            val registro = getRegistro()
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
