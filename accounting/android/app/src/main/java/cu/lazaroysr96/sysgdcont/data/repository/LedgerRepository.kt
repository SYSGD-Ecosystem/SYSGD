package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import androidx.core.content.FileProvider
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.itextpdf.io.font.constants.StandardFonts
import com.itextpdf.kernel.colors.ColorConstants
import com.itextpdf.kernel.font.PdfFont
import com.itextpdf.kernel.font.PdfFontFactory
import com.itextpdf.kernel.geom.PageSize
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.borders.SolidBorder
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.properties.HorizontalAlignment
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import com.google.gson.Gson
import com.google.gson.JsonParser
import cu.lazaroysr96.sysgdcont.data.api.ApiService
import cu.lazaroysr96.sysgdcont.data.model.*
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import okhttp3.ResponseBody
import org.json.JSONObject
import retrofit2.Response
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

private val Context.ledgerDataStore: DataStore<Preferences> by preferencesDataStore(name = "ledger_prefs")

class InsufficientCreditsException(message: String) : Exception(message)

@Singleton
class LedgerRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: ApiService,
    private val authRepository: AuthRepository,
    private val inventarioRepository: InventarioRepository
) {
    private data class RegistroBackupPayload(
        val app: String = "SYSGD Cont Android",
        val schemaVersion: Int = 1,
        val exportedAt: String,
        val registro: RegistroTCP
    )

    companion object {
        private val REGISTRO_KEY = stringPreferencesKey("registro_tcp")
        private val LAST_SYNC_KEY = stringPreferencesKey("last_sync")
        private val LOCAL_MODIFIED_KEY = stringPreferencesKey("local_modified")
        private val SERVER_VERSION_KEY = stringPreferencesKey("server_version")
        private val LAST_DOWNLOADED_VERSION_KEY = stringPreferencesKey("last_downloaded_version")
        private val BASELINE_REGISTRO_KEY = stringPreferencesKey("baseline_registro")
        private val BASELINE_INVENTARIO_KEY = stringPreferencesKey("baseline_inventario")
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

    val localModified: Flow<Boolean> = combine(
        context.ledgerDataStore.data.map { prefs -> prefs[LOCAL_MODIFIED_KEY] == "true" },
        inventarioRepository.localModified
    ) { ledgerModified, inventarioModified ->
        ledgerModified || inventarioModified
    }

    suspend fun getRegistro(): RegistroTCP = registro.first()

    private suspend fun saveRegistro(registro: RegistroTCP, modifiedByUser: Boolean) {
        context.ledgerDataStore.edit { prefs ->
            prefs[REGISTRO_KEY] = gson.toJson(registro)
            prefs[LOCAL_MODIFIED_KEY] = if (modifiedByUser) "true" else "false"
        }
    }

    private suspend fun saveBaseline(registro: RegistroTCP, inventario: InventarioRegistro, serverVersion: String) {
        val resolvedVersion = if (serverVersion.isNotBlank()) {
            serverVersion
        } else {
            java.time.Instant.now().toString()
        }
        context.ledgerDataStore.edit { prefs ->
            prefs[BASELINE_REGISTRO_KEY] = gson.toJson(registro)
            prefs[BASELINE_INVENTARIO_KEY] = gson.toJson(inventario)
            prefs[LAST_DOWNLOADED_VERSION_KEY] = resolvedVersion
            prefs[SERVER_VERSION_KEY] = resolvedVersion
            prefs[LOCAL_MODIFIED_KEY] = "false"
            prefs[LAST_SYNC_KEY] = java.time.Instant.now().toString()
        }
        inventarioRepository.clearLocalModified()
    }

    suspend fun saveUserEditedRegistro(registro: RegistroTCP) {
        saveRegistro(registro, modifiedByUser = true)
    }

    private suspend fun buildRegistroWithInventario(): RegistroTCP {
        val current = getRegistro()
        val inventarioRegistro = inventarioRepository.toInventarioRegistro()
        return current.copy(inventario = inventarioRegistro)
    }

    private fun stripInventario(registro: RegistroTCP): RegistroTCP {
        return registro.copy(inventario = InventarioRegistro())
    }

    private fun hasInventarioData(inventario: InventarioRegistro?): Boolean {
        if (inventario == null) return false
        return inventario.productosVenta.isNotEmpty() ||
            inventario.productosCompra.isNotEmpty() ||
            inventario.operaciones.isNotEmpty()
    }

    private fun buildRemoteRegistro(response: ContLedgerResponse): RegistroTCP? {
        val registro = response.registro ?: return null
        val inventario = response.inventarioRegistro
        return if (inventario != null) {
            registro.copy(inventario = inventario)
        } else {
            registro
        }
    }

    private suspend fun getBaselineInventario(): InventarioRegistro {
        val raw = context.ledgerDataStore.data.first()[BASELINE_INVENTARIO_KEY]
        if (raw.isNullOrBlank()) return InventarioRegistro()
        return try {
            gson.fromJson(raw, InventarioRegistro::class.java) ?: InventarioRegistro()
        } catch (_: Exception) {
            InventarioRegistro()
        }
    }

    private fun inventoriesEqual(left: InventarioRegistro, right: InventarioRegistro): Boolean {
        return gson.toJson(left) == gson.toJson(right)
    }

    private fun hasInventarioConflicts(
        local: InventarioRegistro,
        remote: InventarioRegistro,
        baseline: InventarioRegistro
    ): Boolean {
        val remoteChanged = !inventoriesEqual(remote, baseline)
        val localChanged = !inventoriesEqual(local, baseline)
        return localChanged && remoteChanged
    }

    suspend fun exportBackupToUri(uri: Uri): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val current = buildRegistroWithInventario()
            val payload = RegistroBackupPayload(
                exportedAt = java.time.Instant.now().toString(),
                registro = current
            )
            val json = gson.toJson(payload)
            context.contentResolver.openOutputStream(uri)?.use { output ->
                output.write(json.toByteArray(Charsets.UTF_8))
            } ?: throw Exception("No se pudo abrir el destino para guardar el archivo")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun importBackupFromUri(uri: Uri): Result<RegistroTCP> = withContext(Dispatchers.IO) {
        try {
            val rawJson = context.contentResolver.openInputStream(uri)?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }
                ?: throw Exception("No se pudo leer el archivo seleccionado")

            val rootElement = JsonParser().parse(rawJson)
            if (!rootElement.isJsonObject) {
                throw Exception("El archivo no contiene un JSON de respaldo válido")
            }

            val rootObject = rootElement.asJsonObject
            val registroElement = if (rootObject.has("registro")) rootObject.get("registro") else rootElement
            val imported = gson.fromJson(registroElement.toString(), RegistroTCP::class.java)
                ?: throw Exception("No se pudo interpretar el registro del archivo")

            val normalized = normalizeImportedRegistro(imported)
            inventarioRepository.fromInventarioRegistro(normalized.inventario)

            val registroSinInventario = stripInventario(normalized)
            saveUserEditedRegistro(registroSinInventario)
            Result.success(registroSinInventario)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun replaceLocalWithRemote(registro: RegistroTCP, serverVersion: String): Result<SyncResult> {
        return try {
            inventarioRepository.fromInventarioRegistro(registro.inventario)
            val registroSinInventario = stripInventario(registro)
            saveRegistro(registroSinInventario, modifiedByUser = false)
            saveBaseline(registroSinInventario, registro.inventario, serverVersion)
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
            val localRegistro = buildRegistroWithInventario()
            val inventarioRegistro = inventarioRepository.toInventarioRegistro()
            val updateResponse = apiService.updateLedger(
                "Bearer $token",
                UpdateLedgerRequest(
                    registro = stripInventario(localRegistro),
                    inventarioRegistro = inventarioRegistro
                )
            )
            if (!updateResponse.isSuccessful) {
                return Result.failure(Exception("Error al subir datos: ${updateResponse.code()}"))
            }

            val refreshedRemote = fetchRemote(token)
            val refreshedVersion = refreshedRemote.updatedAt.orEmpty()
            val registroFinal = buildRemoteRegistro(refreshedRemote) ?: buildRegistroWithInventario()

            replaceLocalWithRemote(registroFinal, refreshedVersion).getOrThrow()

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
            val registroConInventario = buildRegistroWithInventario().copy(
                generales = mergedRegistro.generales,
                ingresos = mergedRegistro.ingresos,
                gastos = mergedRegistro.gastos,
                tributos = mergedRegistro.tributos,
                inventario = mergedRegistro.inventario
            )
            val updateResponse = apiService.updateLedger(
                "Bearer $token",
                UpdateLedgerRequest(
                    registro = stripInventario(registroConInventario),
                    inventarioRegistro = registroConInventario.inventario
                )
            )
            if (!updateResponse.isSuccessful) {
                return Result.failure(Exception("Error al subir merge: ${updateResponse.code()}"))
            }

            val refreshedRemote = fetchRemote(token)
            val refreshedVersion = refreshedRemote.updatedAt.orEmpty()
            val registroFinal = buildRemoteRegistro(refreshedRemote) ?: registroConInventario

            replaceLocalWithRemote(registroFinal, refreshedVersion).getOrThrow()

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
        return localModified.first()
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
            val remoteRegistro = buildRemoteRegistro(remote) ?: return Result.success(getRegistro())
            replaceLocalWithRemote(remoteRegistro, remote.updatedAt.orEmpty())
                .map { remoteRegistro }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun push(): Result<Unit> {
        return uploadLocalToRemote().map { Unit }
    }

    suspend fun autoSyncOnFirstLogin(): Result<SyncResult> {
        return try {
            val shouldSync = authRepository.shouldAutoSyncOnFirstLogin()
            if (!shouldSync) {
                return Result.success(SyncResult(true, "Sincronización automática omitida", SyncAction.NO_CHANGES))
            }

            val result = sync()

            if (result.isSuccess) {
                authRepository.markFirstLoginSyncComplete()
            }

            result
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sync(): Result<SyncResult> {
        return try {
            val token = authRepository.getToken() ?: return Result.failure(Exception("No token"))
            val localRegistro = buildRegistroWithInventario()
            val localModified = isLocalModified()
            val hasBaseline = hasBaselineVersion()
            val hasLocalData = hasLocalSnapshot()
            val baselineVersion = getLastDownloadedVersion()
            val baselineInventario = getBaselineInventario()
            val remote = fetchRemote(token)
            val remoteRegistro = buildRemoteRegistro(remote)
            val remoteVersion = remote.updatedAt.orEmpty()
            val serverChanged = hasBaseline && remoteVersion != baselineVersion
            val remoteInventario = remoteRegistro?.inventario ?: InventarioRegistro()
            val inventarioConflict = hasBaseline &&
                remoteRegistro != null &&
                hasInventarioConflicts(localRegistro.inventario, remoteInventario, baselineInventario)

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
                    val conflictInfo = checkForConflicts(
                        local = localRegistro,
                        remote = remoteRegistro,
                        forceConflict = inventarioConflict,
                        extraConflictMessage = if (inventarioConflict) {
                            "Conflicto en datos del punto de venta"
                        } else {
                            null
                        }
                    )
                    val merged = if (!conflictInfo.hasConflict) {
                        mergeVersions(localRegistro, remoteRegistro, baselineInventario)
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
                    val conflictInfo = checkForConflicts(
                        local = localRegistro,
                        remote = remoteRegistro,
                        forceConflict = inventarioConflict,
                        extraConflictMessage = if (inventarioConflict) {
                            "Conflicto en datos del punto de venta"
                        } else {
                            null
                        }
                    )
                    val merged = if (!conflictInfo.hasConflict && remoteRegistro != null) {
                        mergeVersions(localRegistro, remoteRegistro, baselineInventario)
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

    private fun checkForConflicts(
        local: RegistroTCP,
        remote: RegistroTCP?,
        forceConflict: Boolean = false,
        extraConflictMessage: String? = null
    ): ConflictInfo {
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

        if (forceConflict && !extraConflictMessage.isNullOrBlank()) {
            conflicts.add(extraConflictMessage)
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

    suspend fun mergeVersions(
        local: RegistroTCP,
        remote: RegistroTCP,
        baselineInventario: InventarioRegistro = InventarioRegistro()
    ): RegistroTCP {
        val mergedIngresos = mergeEntries(local.ingresos, remote.ingresos)
        val mergedGastos = mergeEntries(local.gastos, remote.gastos)
        
        val mergedTributos = if (remote.tributos.isNotEmpty()) remote.tributos else local.tributos
        
        val mergedGenerales = if (remote.generales.nombre.isNotEmpty()) remote.generales else local.generales
        
        val remoteInventarioChanged = !inventoriesEqual(remote.inventario, baselineInventario)
        val localInventarioChanged = !inventoriesEqual(local.inventario, baselineInventario)
        val mergedInventario = when {
            remoteInventarioChanged && !localInventarioChanged -> remote.inventario
            !remoteInventarioChanged && localInventarioChanged -> local.inventario
            remoteInventarioChanged && localInventarioChanged -> local.inventario
            hasInventarioData(remote.inventario) -> remote.inventario
            else -> local.inventario
        }
        
        return RegistroTCP(
            generales = mergedGenerales,
            ingresos = mergedIngresos,
            gastos = mergedGastos,
            tributos = mergedTributos,
            inventario = mergedInventario
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

    private fun normalizeImportedRegistro(source: RegistroTCP): RegistroTCP {
        val baseYear = source.generales.anio.takeIf { it >= 2020 } ?: java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
        val base = emptyRegistro().copy(generales = emptyRegistro(baseYear).generales)

        val generales = source.generales.copy(
            anio = baseYear,
            nombre = source.generales.nombre.ifBlank { base.generales.nombre },
            nit = source.generales.nit.ifBlank { base.generales.nit },
            actividad = source.generales.actividad.ifBlank { base.generales.actividad },
            codigo = source.generales.codigo.ifBlank { base.generales.codigo },
            fiscalCalle = source.generales.fiscalCalle.ifBlank { base.generales.fiscalCalle },
            fiscalMunicipio = source.generales.fiscalMunicipio.ifBlank { base.generales.fiscalMunicipio },
            fiscalProvincia = source.generales.fiscalProvincia.ifBlank { base.generales.fiscalProvincia },
            legalCalle = source.generales.legalCalle.ifBlank { base.generales.legalCalle },
            legalMunicipio = source.generales.legalMunicipio.ifBlank { base.generales.legalMunicipio },
            legalProvincia = source.generales.legalProvincia.ifBlank { base.generales.legalProvincia }
        )

        val ingresos = LedgerConstants.MONTHS.associateWith { month ->
            normalizeMonthRows(source.ingresos[month])
        }
        val gastos = LedgerConstants.MONTHS.associateWith { month ->
            normalizeMonthRows(source.gastos[month])
        }
        val tributos = LedgerConstants.MONTHS.mapIndexed { index, month ->
            val row = source.tributos.getOrNull(index)
            TributoRow(
                mes = LedgerConstants.monthLabels[month] ?: month,
                ventas = row?.ventas.orEmpty(),
                fuerza = row?.fuerza.orEmpty(),
                sellos = row?.sellos.orEmpty(),
                anuncios = row?.anuncios.orEmpty(),
                css20 = row?.css20.orEmpty(),
                css14 = row?.css14.orEmpty(),
                otros = row?.otros.orEmpty(),
                restauracion = row?.restauracion.orEmpty(),
                arrendamiento = row?.arrendamiento.orEmpty(),
                exonerado = row?.exonerado.orEmpty(),
                otrosMFP = row?.otrosMFP.orEmpty(),
                cuotaMensual = row?.cuotaMensual.orEmpty()
            )
        }

        return RegistroTCP(
            generales = generales,
            ingresos = ingresos,
            gastos = gastos,
            tributos = tributos,
            inventario = source.inventario
        )
    }

    private fun normalizeMonthRows(rows: List<DayAmountRow>?): List<DayAmountRow> {
        if (rows.isNullOrEmpty()) return emptyList()
        return rows
            .mapNotNull { row ->
                val dia = row.dia.toIntOrNull()
                val importe = row.importe.toDoubleOrNull()
                if (dia == null || dia !in 1..31) return@mapNotNull null
                if (importe == null || importe <= 0.0) return@mapNotNull null
                DayAmountRow(dia = dia.toString(), importe = String.format(Locale.US, "%.2f", importe))
            }
            .take(36)
    }

    private fun emptyRegistro(year: Int = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)): RegistroTCP {
        val emptyMonthEntries = LedgerConstants.MONTHS.associateWith { emptyList<DayAmountRow>() }
        val emptyTributos = LedgerConstants.MONTHS.map { month ->
            TributoRow(mes = LedgerConstants.monthLabels[month] ?: month)
        }
        return RegistroTCP(
            GeneralesData(anio = year),
            emptyMonthEntries,
            emptyMonthEntries,
            emptyTributos,
            InventarioRegistro()
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
                        return@withContext Result.failure(buildPdfError(retryResponse))
                    }
                    processPdfResponse(retryResponse)
                } else if (!response.isSuccessful) {
                    return@withContext Result.failure(buildPdfError(response))
                } else {
                    processPdfResponse(response)
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }

    suspend fun downloadPdfOffline(): Result<Intent> {
        return withContext(Dispatchers.IO) {
            try {
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

                val file = generateOfflineTcpPdf(pdfPayload)
                buildPdfIntent(file)
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

            buildPdfIntent(file)
        }
    }

    private fun buildPdfIntent(file: File): Result<Intent> {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )

        val shareIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/pdf")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        return Result.success(Intent.createChooser(shareIntent, "Abrir PDF"))
    }

    private fun generateOfflineTcpPdf(payload: TcpPdfPayload): File {
        val fileName = "Registro_TCP_${payload.generalData.anio}_offline_experimental.pdf"
        val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        val file = File(downloadsDir, fileName)
        val writer = PdfWriter(file)
        val pdfDocument = PdfDocument(writer)
        val document = Document(pdfDocument, PageSize.A4.rotate())
        document.setMargins(10f, 10f, 10f, 10f)

        val regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA)
        val boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD)
        document.setFont(regularFont)

        addTcpCoverPage(document, payload.generalData, boldFont, regularFont)
        document.add(com.itextpdf.layout.element.AreaBreak())
        addMonthSection(document, "INGRESOS", "Total de Ingresos Anuales", payload.ingresos, boldFont, regularFont)
        document.add(com.itextpdf.layout.element.AreaBreak())
        addMonthSection(document, "GASTOS", "Total de Gastos Anuales", payload.gastos, boldFont, regularFont)
        document.add(com.itextpdf.layout.element.AreaBreak())
        addTributosSection(document, payload.tributos, boldFont, regularFont)

        document.close()
        return file
    }

    private fun addTcpCoverPage(
        document: Document,
        generalData: PdfGeneralData,
        boldFont: PdfFont,
        regularFont: PdfFont
    ) {
        val outer = Table(floatArrayOf(1f, 700f, 1f)).useAllAvailableWidth()
        outer.setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
        outer.addCell(blankCell())
        outer.addCell(
            Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .add(buildHeaderTable(generalData, boldFont, regularFont))
        )
        outer.addCell(blankCell())
        document.add(Paragraph("\n"))
        document.add(outer)

        val firmaOuter = Table(floatArrayOf(1f, 700f, 1f)).useAllAvailableWidth()
        firmaOuter.setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
        firmaOuter.addCell(blankCell())
        val firmaContainer = Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
        val firmaInner = Table(floatArrayOf(220f, 480f)).useAllAvailableWidth()
        firmaInner.setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
        firmaInner.addCell(buildFirmaTable(generalData, boldFont, regularFont))
        firmaInner.addCell(blankCell())
        firmaContainer.add(firmaInner)
        firmaContainer.setPaddingTop(14f)
        firmaOuter.addCell(firmaContainer)
        firmaOuter.addCell(blankCell())
        document.add(firmaOuter)
    }

    private fun buildHeaderTable(
        generalData: PdfGeneralData,
        boldFont: PdfFont,
        regularFont: PdfFont
    ): Table {
        val widths = floatArrayOf(60f, 60f, 125f, 125f, 95f, 95f, 55f, 85f)
        val table = Table(widths)
        table.setWidth(700f)

        val onatCell = baseCell(rowspan = 2, colspan = 2).setPaddingTop(8f)
        onatCell.add(
            Paragraph("ONAT")
                .setFont(boldFont)
                .setFontSize(16f)
                .setTextAlignment(TextAlignment.CENTER)
        )
        onatCell.add(
            Paragraph("OFICINA NACIONAL DE\nADMINISTRACION TRIBUTARIA")
                .setFont(regularFont)
                .setFontSize(6f)
                .setTextAlignment(TextAlignment.CENTER)
                .setMultipliedLeading(1f)
        )
        table.addCell(onatCell)
        table.addCell(
            textCell(
                "REGISTRO DE INGRESOS Y GASTOS PARA EL TRABAJO POR CUENTA\nPROPIA",
                boldFont,
                11f,
                TextAlignment.CENTER,
                rowspan = 2,
                colspan = 4
            ).setPaddingTop(10f)
        )
        table.addCell(textCell("Año", boldFont, 10f, TextAlignment.CENTER, colspan = 2))
        table.addCell(textCell(generalData.anio, boldFont, 11f, TextAlignment.CENTER, colspan = 2))
        table.addCell(textCell("Nombre(s) y Apellidos del Contribuyente", regularFont, 9f, TextAlignment.CENTER, colspan = 6))
        table.addCell(textCell("NIT", boldFont, 10f, TextAlignment.CENTER, colspan = 2))
        table.addCell(textCell(generalData.nombre, regularFont, 10f, TextAlignment.LEFT, colspan = 6))
        table.addCell(textCell(generalData.nit, regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(textCell("Domicilio fiscal: (lugar donde desarrolla la actividad): calle, No, apto, entre calles:", regularFont, 9f, TextAlignment.LEFT, colspan = 8))
        table.addCell(textCell(generalData.fiscalCalle, regularFont, 10f, TextAlignment.LEFT, colspan = 8))
        table.addCell(textCell("Municipio:", regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(textCell(generalData.fiscalMunicipio, regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(textCell("Provincia:", regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(textCell(generalData.fiscalProvincia, regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(textCell("Domicilio legal: (según Carnet de Identidad): calle, No, Apto, entre calles.", regularFont, 9f, TextAlignment.LEFT, colspan = 8))
        table.addCell(textCell(generalData.legalCalle, regularFont, 10f, TextAlignment.LEFT, colspan = 8))
        table.addCell(textCell("Municipio:", regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(textCell(generalData.legalMunicipio, regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(textCell("Provincia:", regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(textCell(generalData.legalProvincia, regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(textCell("Actividad:", regularFont, 10f, TextAlignment.LEFT))
        table.addCell(textCell(generalData.actividad, regularFont, 10f, TextAlignment.LEFT, colspan = 5))
        table.addCell(textCell("Código:", regularFont, 10f, TextAlignment.LEFT))
        table.addCell(textCell(generalData.codigo, regularFont, 10f, TextAlignment.LEFT))

        return table
    }

    private fun buildFirmaTable(
        generalData: PdfGeneralData,
        boldFont: PdfFont,
        regularFont: PdfFont
    ): Table {
        val table = Table(floatArrayOf(80f, 70f, 70f))
        table.setWidth(220f)
        table.addCell(textCell("D", regularFont, 10f, TextAlignment.CENTER))
        table.addCell(textCell("M", regularFont, 10f, TextAlignment.CENTER))
        table.addCell(textCell("A", regularFont, 10f, TextAlignment.CENTER))
        table.addCell(textCell(generalData.firmaDia, regularFont, 10f, TextAlignment.CENTER))
        table.addCell(textCell(generalData.firmaMes, regularFont, 10f, TextAlignment.CENTER))
        table.addCell(textCell(generalData.firmaAnio, regularFont, 10f, TextAlignment.CENTER))
        return table
    }

    private fun addMonthSection(
        document: Document,
        title: String,
        annualLabel: String,
        entries: Map<String, List<DayAmountRow>>,
        boldFont: PdfFont,
        regularFont: PdfFont
    ) {
        val widths = LedgerConstants.MONTHS.flatMap { listOf(16f, 34f) }.toFloatArray()
        val table = Table(widths)
        table.useAllAvailableWidth()

        table.addCell(textCell(title, boldFont, 9f, TextAlignment.CENTER, colspan = 24))
        LedgerConstants.MONTHS.forEach { month ->
            table.addCell(textCell("D", boldFont, 6f, TextAlignment.CENTER))
            table.addCell(textCell(month, boldFont, 7f, TextAlignment.CENTER))
        }

        for (rowIndex in 0 until 36) {
            LedgerConstants.MONTHS.forEach { month ->
                val row = entries[month].orEmpty().getOrNull(rowIndex)
                table.addCell(textCell(row?.dia.orEmpty(), regularFont, 6f, TextAlignment.CENTER))
                table.addCell(textCell(row?.importe.orEmpty(), regularFont, 7f, TextAlignment.RIGHT))
            }
        }

        LedgerConstants.MONTHS.forEach { month ->
            table.addCell(textCell("", regularFont, 6f, TextAlignment.CENTER))
            table.addCell(textCell(monthTotalText(entries[month].orEmpty()), boldFont, 7f, TextAlignment.RIGHT))
        }

        document.add(table)

        val summaryWrap = Table(floatArrayOf(1f, 240f)).useAllAvailableWidth()
        summaryWrap.setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
        summaryWrap.addCell(blankCell())
        val annualTotal = LedgerConstants.MONTHS.sumOf { month ->
            entries[month].orEmpty().sumOf { parseCurrency(it.importe) }
        }
        val summaryTable = Table(floatArrayOf(170f, 70f))
        summaryTable.addCell(textCell(annualLabel, boldFont, 9f, TextAlignment.LEFT))
        summaryTable.addCell(textCell(String.format(Locale.US, "%.2f", annualTotal), regularFont, 9f, TextAlignment.RIGHT))
        summaryWrap.addCell(
            Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setPaddingTop(8f)
                .add(summaryTable)
                .setHorizontalAlignment(HorizontalAlignment.RIGHT)
        )
        document.add(summaryWrap)
    }

    private fun addTributosSection(
        document: Document,
        tributos: List<TributoPdfRow>,
        boldFont: PdfFont,
        regularFont: PdfFont
    ) {
        val tributosRows = buildTributosRows(tributos)
        val totals = buildTributosTotals(tributosRows)
        val widths = floatArrayOf(64f, 44f, 44f, 44f, 44f, 44f, 44f, 44f, 44f, 44f, 44f, 44f, 44f, 44f, 44f, 44f)
        val table = Table(widths).useAllAvailableWidth()

        table.addCell(textCell("TRIBUTOS  Y OTROS GASTOS  ASOCIADOS A LA ACTIVIDAD", boldFont, 12f, TextAlignment.CENTER, colspan = 16))

        table.addCell(textCell("Mes", boldFont, 9f, TextAlignment.CENTER, rowspan = 3))
        table.addCell(textCell("TRIBUTOS PAGADOS DEDUCIBLES EN LA DECLARACIÓN JURADA", boldFont, 10f, TextAlignment.CENTER, colspan = 9))
        table.addCell(textCell("Subtotal", boldFont, 9f, TextAlignment.CENTER, rowspan = 3))
        table.addCell(textCell("Otros Gastos deducibles de la base imponible", boldFont, 10f, TextAlignment.CENTER, colspan = 4))
        table.addCell(textCell("Cuota Mensual (5 %)051012", boldFont, 8f, TextAlignment.CENTER, rowspan = 3))

        table.addCell(textCell("Impuesto sobre Ventas o Servicios (10%) 011402", boldFont, 7f, TextAlignment.CENTER, rowspan = 2))
        table.addCell(textCell("Impuesto por la Utilización de la Fuerza de Trabajo 061032", boldFont, 7f, TextAlignment.CENTER, rowspan = 2))
        table.addCell(textCell("Impuesto sobre Documentos y sellos 073012", boldFont, 7f, TextAlignment.CENTER, rowspan = 2))
        table.addCell(textCell("Tasa por la Radicación de Anuncios. Cartel 090012", boldFont, 7f, TextAlignment.CENTER, rowspan = 2))
        table.addCell(textCell("Contribución Especial a la Seguridad Social (20%) 082013", boldFont, 7f, TextAlignment.CENTER, rowspan = 2))
        table.addCell(textCell("Contribución a la Seguridad Social (14%) 081013", boldFont, 7f, TextAlignment.CENTER, colspan = 3))
        table.addCell(textCell("Otros", boldFont, 8f, TextAlignment.CENTER, rowspan = 2))
        table.addCell(textCell("Contribución para la Restauración y Preservación de las Zonas donde Desarrolla su Activ.", boldFont, 7f, TextAlignment.CENTER, rowspan = 2))
        table.addCell(textCell("Pago por arrendamiento de bienes estatales autorizadas", boldFont, 7f, TextAlignment.CENTER, rowspan = 2))
        table.addCell(textCell("Importes exonerados por arrendam. por asumir gastos de reparaciones", boldFont, 7f, TextAlignment.CENTER, rowspan = 2))
        table.addCell(textCell("Otros Gastos autorizados MFP", boldFont, 7f, TextAlignment.CENTER, rowspan = 2))

        table.addCell(textCell("Total", boldFont, 8f, TextAlignment.CENTER))
        table.addCell(textCell("12.5%", boldFont, 8f, TextAlignment.CENTER))
        table.addCell(textCell("1.5%", boldFont, 8f, TextAlignment.CENTER))

        listOf("", "-1", "-2", "-3", "-4", "-5", "-6", "-7", "-8", "-9", "-10", "-11", "-12", "-13", "-14", "-15")
            .forEachIndexed { index, label ->
                table.addCell(textCell(label, if (index == 0) regularFont else boldFont, if (index == 0) 8f else 9f, if (index == 0) TextAlignment.LEFT else TextAlignment.CENTER))
            }

        tributosRows.forEach { row ->
            table.addCell(textCell(row.mes, regularFont, 9f, TextAlignment.LEFT))
            table.addCell(textCell(row.b, regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(row.c, regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(row.d, regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(row.e, regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(row.f, regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(decimalOrBlank(row.g), regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(row.h, regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(row.i, regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(row.j, regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(decimalOrBlank(row.k), regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(row.l, regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(row.m, regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(row.n, regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(row.o, regularFont, 8f, TextAlignment.RIGHT))
            table.addCell(textCell(row.p, regularFont, 8f, TextAlignment.RIGHT))
        }

        table.addCell(textCell("Total pagado", boldFont, 10f, TextAlignment.LEFT))
        table.addCell(textCell(decimal(totals.b), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.c), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.d), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.e), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.f), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.g), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.h), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.i), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.j), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.k), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.l), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.m), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.n), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.o), boldFont, 8f, TextAlignment.RIGHT))
        table.addCell(textCell(decimal(totals.p), boldFont, 8f, TextAlignment.RIGHT))

        document.add(table)
    }

    private data class OfflineTributoRow(
        val mes: String,
        val b: String,
        val c: String,
        val d: String,
        val e: String,
        val f: String,
        val g: Double,
        val h: String,
        val i: String,
        val j: String,
        val k: Double,
        val l: String,
        val m: String,
        val n: String,
        val o: String,
        val p: String
    )

    private data class OfflineTributoTotals(
        val b: Double = 0.0,
        val c: Double = 0.0,
        val d: Double = 0.0,
        val e: Double = 0.0,
        val f: Double = 0.0,
        val g: Double = 0.0,
        val h: Double = 0.0,
        val i: Double = 0.0,
        val j: Double = 0.0,
        val k: Double = 0.0,
        val l: Double = 0.0,
        val m: Double = 0.0,
        val n: Double = 0.0,
        val o: Double = 0.0,
        val p: Double = 0.0
    )

    private fun buildTributosRows(tributos: List<TributoPdfRow>): List<OfflineTributoRow> {
        val tributosByMonth = tributos.associateBy { normalizeMonth(it.mes) }
        return LedgerConstants.MONTHS.mapIndexed { index, monthCode ->
            val monthLabel = LedgerConstants.monthLabels[monthCode].orEmpty()
            val source = tributosByMonth[normalizeMonth(monthLabel)] ?: tributos.getOrNull(index)
            val h = source?.h.orEmpty()
            val i = source?.i.orEmpty()
            val g = parseCurrency(h) + parseCurrency(i)
            val k = parseCurrency(source?.b.orEmpty()) +
                parseCurrency(source?.c.orEmpty()) +
                parseCurrency(source?.d.orEmpty()) +
                parseCurrency(source?.e.orEmpty()) +
                parseCurrency(source?.f.orEmpty()) +
                g +
                parseCurrency(source?.j.orEmpty())
            OfflineTributoRow(
                mes = monthLabel,
                b = source?.b.orEmpty(),
                c = source?.c.orEmpty(),
                d = source?.d.orEmpty(),
                e = source?.e.orEmpty(),
                f = source?.f.orEmpty(),
                g = g,
                h = h,
                i = i,
                j = source?.j.orEmpty(),
                k = k,
                l = source?.l.orEmpty(),
                m = source?.m.orEmpty(),
                n = source?.n.orEmpty(),
                o = source?.o.orEmpty(),
                p = source?.p.orEmpty()
            )
        }
    }

    private fun buildTributosTotals(rows: List<OfflineTributoRow>): OfflineTributoTotals =
        rows.fold(OfflineTributoTotals()) { acc, row ->
            OfflineTributoTotals(
                b = acc.b + parseCurrency(row.b),
                c = acc.c + parseCurrency(row.c),
                d = acc.d + parseCurrency(row.d),
                e = acc.e + parseCurrency(row.e),
                f = acc.f + parseCurrency(row.f),
                g = acc.g + row.g,
                h = acc.h + parseCurrency(row.h),
                i = acc.i + parseCurrency(row.i),
                j = acc.j + parseCurrency(row.j),
                k = acc.k + row.k,
                l = acc.l + parseCurrency(row.l),
                m = acc.m + parseCurrency(row.m),
                n = acc.n + parseCurrency(row.n),
                o = acc.o + parseCurrency(row.o),
                p = acc.p + parseCurrency(row.p)
            )
        }

    private fun blankCell(): Cell =
        Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)

    private fun baseCell(rowspan: Int = 1, colspan: Int = 1): Cell =
        Cell(rowspan, colspan)
            .setBorder(SolidBorder(ColorConstants.BLACK, 1f))
            .setPaddingTop(4f)
            .setPaddingBottom(4f)
            .setPaddingLeft(3f)
            .setPaddingRight(3f)

    private fun textCell(
        text: String,
        font: PdfFont,
        fontSize: Float,
        alignment: TextAlignment,
        rowspan: Int = 1,
        colspan: Int = 1
    ): Cell =
        baseCell(rowspan, colspan).add(
            Paragraph(text)
                .setFont(font)
                .setFontSize(fontSize)
                .setTextAlignment(alignment)
                .setMultipliedLeading(1f)
        )

    private fun monthTotalText(entries: List<DayAmountRow>): String =
        String.format(Locale.US, "%.2f", entries.sumOf { parseCurrency(it.importe) })

    private fun parseCurrency(value: String): Double {
        val normalized = value.replace(",", ".").trim()
        return normalized.toDoubleOrNull() ?: 0.0
    }

    private fun normalizeMonth(value: String): String =
        value.lowercase(Locale.ROOT)
            .normalize()
            .trim()

    private fun String.normalize(): String =
        java.text.Normalizer.normalize(this, java.text.Normalizer.Form.NFD)
            .replace("\\p{InCombiningDiacriticalMarks}+".toRegex(), "")

    private fun decimal(value: Double): String = String.format(Locale.US, "%.2f", value)

    private fun decimalOrBlank(value: Double): String =
        if (value == 0.0) "" else decimal(value)

    private fun buildPdfError(response: Response<ResponseBody>): Exception {
        val code = response.code()
        val errorBody = response.errorBody()?.string()
        val message = if (!errorBody.isNullOrBlank()) {
            try {
                val json = JSONObject(errorBody)
                json.optString("message")
                    .ifBlank { json.optString("error") }
                    .ifBlank { "Error al generar PDF: $code" }
            } catch (_: Exception) {
                "Error al generar PDF: $code"
            }
        } else {
            "Error al generar PDF: $code"
        }

        return if (code == 402) {
            InsufficientCreditsException(message)
        } else {
            Exception(message)
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
