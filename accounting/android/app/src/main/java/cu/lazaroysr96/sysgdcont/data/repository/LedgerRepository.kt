package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.withTransaction
import com.google.gson.Gson
import com.google.gson.JsonParser
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
import com.itextpdf.layout.properties.VerticalAlignment
import cu.lazaroysr96.sysgdcont.data.AppDatabase
import cu.lazaroysr96.sysgdcont.data.api.ApiService
import cu.lazaroysr96.sysgdcont.data.model.*
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.File
import java.time.LocalDate
import java.util.Locale
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import okhttp3.ResponseBody
import org.json.JSONObject
import retrofit2.Response
import android.util.Log

private val Context.ledgerDataStore: DataStore<Preferences> by
        preferencesDataStore(name = "ledger_prefs")

class InsufficientCreditsException(message: String) : Exception(message)

@Singleton
class LedgerRepository
@Inject
constructor(
        @ApplicationContext private val context: Context,
        private val appDatabase: AppDatabase,
        private val apiService: ApiService,
        private val authRepository: AuthRepository,
        private val inventarioRepository: InventarioRepository,
        private val tercerosRepository: TercerosRepository,
        private val documentStorageRepository: DocumentStorageRepository
) {
    private val cuentaContableDao by lazy { appDatabase.cuentaContableDao() }
    private val ingresoGastoCuentaDao by lazy { appDatabase.ingresoGastoCuentaDao() }
    private val ingresoGastoNotaDao by lazy { appDatabase.ingresoGastoNotaDao() }
    private val posIntegrationConfigDao by lazy { appDatabase.posIntegrationConfigDao() }
    private val tributoConfigDao by lazy { appDatabase.tributoConfigDao() }
    private val tributoCuentaBaseDao by lazy { appDatabase.tributoCuentaBaseDao() }
    private val cajaBancoDao by lazy { appDatabase.cajaBancoDao() }

    private data class RegistroBackupPayload(
            val app: String = "SYSGD Cont Android",
            val schemaVersion: Int = 1,
            val exportedAt: String,
            val container: CloudLedgerContainer? = null,
            val registro: RegistroTCP? = null
    )

    private data class LegacyBackupRoot(
            val app: String?,
            val exportedAt: String?,
            val registro: LegacyRegistro?
    )

    private data class RawAccountingWorkspaceState(
            val cuentasContables: List<CuentaContable>?,
            val ingresoGastoCuentas: List<IngresoGastoCuenta>?,
            val ingresoGastoNotas: List<IngresoGastoNota>?,
            val posIntegrationConfig: PosIntegrationConfig?,
            val tributoConfigs: List<TributoConfig>?,
            val tributoCuentaBases: List<TributoCuentaBase>?,
            val wallets: List<Wallet2>?,
            val walletMovimientos: List<WalletMovimiento>?,
            val monedas: List<Moneda>?,
            val monedaTasas: List<MonedaTasa>?,
            val monedaTasaHistorial: List<MonedaTasaHistorial>?
    )

    private data class RawCloudWorkspaceEntry(
            val id: String?,
            val name: String?,
            val registro: RegistroTCP?,
            val accounting: RawAccountingWorkspaceState?
    )

    private data class RawCloudLedgerContainer(
            val activeWorkspaceId: String?,
            val workspaces: List<RawCloudWorkspaceEntry>?
    )

    private data class LegacyRegistro(
            val generales: LegacyGenerales?,
            val ingresos: Map<String, List<DayAmountRow>>?,
            val gastos: Map<String, List<DayAmountRow>>?,
            val tributos: List<LegacyTributoRow>?,
            val inventario: LegacyInventario?
    )

    private data class LegacyGenerales(
            val nombre: String?,
            val anio: Int?,
            val nit: String?,
            val actividad: String?,
            val codigo: String?,
            val fiscalCalle: String?,
            val fiscalMunicipio: String?,
            val fiscalProvincia: String?,
            val legalCalle: String?,
            val legalMunicipio: String?,
            val legalProvincia: String?
    )

    private data class LegacyTributoRow(
            val mes: String?,
            val ventas: String?,
            val fuerza: String?,
            val sellos: String?,
            val anuncios: String?,
            val css20: String?,
            val css14: String?,
            val otros: String?,
            val restauracion: String?,
            val arrendamiento: String?,
            val exonerado: String?,
            val otrosMFP: String?,
            val cuotaMensual: String?
    )

    private data class LegacyInventario(
            val operaciones: List<LegacyOperacion>?,
            val productosVenta: List<LegacyProducto>?,
            val productosCompra: List<LegacyProducto>?
    )

    private data class LegacyOperacion(
            val id: String?,
            val tipo: String?,
            val fecha: String?,
            val operacionId: String?,
            val hora: String?,
            val anulada: Boolean?,
            val productoId: String?,
            val nombreProducto: String?,
            val unidad: String?,
            val cantidad: Double?,
            val precioUnitario: Double?,
            val total: Double?,
            val almacenId: String?
    )

    private data class LegacyProducto(
            val id: String?,
            val nombre: String?,
            val precio: Double?,
            val tipo: String?,
            val unidad: String?
    )

    companion object {
        private const val DEFAULT_WORKSPACE_ID = "workspace_default"
        private const val TCP_MONTH_DAY_COLUMN_WIDTH = 16f
        private const val TCP_MONTH_VALUE_COLUMN_WIDTH = 52f  //34f 
        private const val TCP_MONTH_TABLE_WIDTH = 816f //600f A4=842x595
        private val REGISTRO_KEY = stringPreferencesKey("registro_tcp")
        private val LAST_SYNC_KEY = stringPreferencesKey("last_sync")
        private val LOCAL_MODIFIED_KEY = stringPreferencesKey("local_modified")
        private val EXPERIMENTAL_FEATURES_KEY =
                stringPreferencesKey("experimental_features_enabled")
        private val HIDE_INVENTARIO_DISCLAIMER_KEY =
                stringPreferencesKey("hide_inventario_disclaimer")
        private val SERVER_VERSION_KEY = stringPreferencesKey("server_version")
        private val LAST_DOWNLOADED_VERSION_KEY = stringPreferencesKey("last_downloaded_version")
        private val BASELINE_REGISTRO_KEY = stringPreferencesKey("baseline_registro")
        private val BASELINE_INVENTARIO_KEY = stringPreferencesKey("baseline_inventario")
        private val WORKSPACES_KEY = stringPreferencesKey("workspace_profiles")
        private val CURRENT_WORKSPACE_ID_KEY = stringPreferencesKey("current_workspace_id")
    }

    private val gson = Gson()

    private fun workspaceSnapshotKey(workspaceId: String) =
            stringPreferencesKey("workspace_snapshot_$workspaceId")

    val workspaceProfiles: Flow<List<WorkspaceProfile>> =
            context.ledgerDataStore.data.map { prefs ->
                val raw = prefs[WORKSPACES_KEY]
                parseWorkspaceProfiles(raw)
            }

    val currentWorkspaceId: Flow<String> =
            context.ledgerDataStore.data.map { prefs ->
                prefs[CURRENT_WORKSPACE_ID_KEY] ?: DEFAULT_WORKSPACE_ID
            }

    val registro: Flow<RegistroTCP> =
            context.ledgerDataStore.data.map { prefs ->
                val raw = prefs[REGISTRO_KEY]
                if (raw != null) {
                    try {
                        normalizeImportedRegistro(
                                gson.fromJson(raw, RegistroTCP::class.java) ?: emptyRegistro()
                        )
                    } catch (e: Exception) {
                        emptyRegistro()
                    }
                } else {
                    emptyRegistro()
                }
            }

    val lastSync: Flow<String?> = context.ledgerDataStore.data.map { prefs -> prefs[LAST_SYNC_KEY] }

    val experimentalFeaturesEnabled: Flow<Boolean> =
            context.ledgerDataStore.data.map { prefs -> prefs[EXPERIMENTAL_FEATURES_KEY] == "true" }

    val hideInventarioDisclaimer: Flow<Boolean> =
            context.ledgerDataStore.data.map { prefs ->
                prefs[HIDE_INVENTARIO_DISCLAIMER_KEY] == "true"
            }

    val localModified: Flow<Boolean> =
            combine(
                    context.ledgerDataStore.data.map { prefs ->
                        prefs[LOCAL_MODIFIED_KEY] == "true"
                    },
                    inventarioRepository.localModified,
                    tercerosRepository.localModified
            ) { ledgerModified, inventarioModified, tercerosModified ->
                ledgerModified || inventarioModified || tercerosModified
            }

    val cuentasContables: Flow<List<CuentaContable>> = cuentaContableDao.observeActivas()

    val cuentasIngreso: Flow<List<CuentaContable>> =
            cuentaContableDao.observeByUso(UsoOperativoCuenta.INGRESO)

    val cuentasGasto: Flow<List<CuentaContable>> =
            cuentaContableDao.observeByUso(UsoOperativoCuenta.GASTO)

    val ingresoGastoCuentas: Flow<List<IngresoGastoCuenta>> = ingresoGastoCuentaDao.observeAll()
    val ingresoGastoNotas: Flow<List<IngresoGastoNota>> = ingresoGastoNotaDao.observeAll()
    val tributoConfigs: Flow<List<TributoConfig>> = tributoConfigDao.observeAll()
    val tributoCuentaBases: Flow<List<TributoCuentaBase>> = tributoCuentaBaseDao.observeAll()

    val posIntegrationConfig: Flow<PosIntegrationConfig> =
            posIntegrationConfigDao.observeById().map { config ->
                config
                        ?: PosIntegrationConfig(
                                ingresoCuentaId = CuentasContablesPorDefecto.ingresosVentas().id,
                                gastoCuentaId = CuentasContablesPorDefecto.gastosActividad().id
                        )
            }

    val saldoPorCuenta: Flow<Map<String, Double>> =
            combine(registro, cuentasContables, ingresoGastoCuentas) {
                    currentRegistro,
                    cuentas,
                    links ->
                computeAccountBalances(currentRegistro, cuentas, links)
            }

    suspend fun getRegistro(): RegistroTCP = registro.first()

    suspend fun getCurrentWorkspaceId(): String = currentWorkspaceId.first()

    private fun parseWorkspaceProfiles(raw: String?): List<WorkspaceProfile> {
        return if (raw.isNullOrBlank()) {
            emptyList()
        } else {
            runCatching {
                        gson.fromJson(raw, Array<WorkspaceProfile>::class.java)?.toList().orEmpty()
                    }
                    .getOrDefault(emptyList())
        }
    }

    private fun defaultCajaBancoState(createdAt: Long = System.currentTimeMillis()): AccountingWorkspaceState {
        val tasa = MonedaTasa(
                id = "moneda_tasa_cup",
                nombre = "Tasa CUP",
                tasa = 1.0,
                createdAt = createdAt,
                updatedAt = createdAt
        )
        val moneda = Moneda(
                id = "moneda_cup",
                nombre = "Peso Cubano",
                tipo = "CUP",
                tasaId = tasa.id,
                createdAt = createdAt,
                updatedAt = createdAt
        )
        val historial = MonedaTasaHistorial(
                id = "moneda_tasa_historial_cup_inicial",
                monedaId = moneda.id,
                tasa = 1.0,
                createdAt = createdAt
        )
        return AccountingWorkspaceState(
                monedas = listOf(moneda),
                monedaTasas = listOf(tasa),
                monedaTasaHistorial = listOf(historial)
        )
    }

    @Suppress("SENSELESS_COMPARISON")
    private fun AccountingWorkspaceState.withCajaBancoDefaultsIfNeeded(): AccountingWorkspaceState {
        val currentMonedas = if (monedas == null) emptyList() else monedas
        val currentTasas = if (monedaTasas == null) emptyList() else monedaTasas
        val currentHistorial = if (monedaTasaHistorial == null) emptyList() else monedaTasaHistorial
        val defaults = defaultCajaBancoState()
        return copy(
                wallets = if (wallets == null) emptyList() else wallets,
                walletMovimientos = if (walletMovimientos == null) emptyList() else walletMovimientos,
                monedas = currentMonedas.ifEmpty { defaults.monedas },
                monedaTasas = currentTasas.ifEmpty { defaults.monedaTasas },
                monedaTasaHistorial = currentHistorial.ifEmpty { defaults.monedaTasaHistorial }
        )
    }

    private fun emptyWorkspaceSnapshot(): WorkspaceSnapshot {
        val baseRegistro = emptyRegistro()
        return WorkspaceSnapshot(
                registro = baseRegistro,
                accounting =
                        AccountingWorkspaceState(
                                cuentasContables = CuentasContablesPorDefecto.todas(),
                                posIntegrationConfig =
                                        PosIntegrationConfig(
                                                ingresoCuentaId =
                                                        CuentasContablesPorDefecto.ingresosVentas()
                                                                .id,
                                                gastoCuentaId =
                                                        CuentasContablesPorDefecto.gastosActividad()
                                                                .id
                                        ),
                                tributoConfigs = TributoConfigsPorDefecto.entidades(),
                                tributoCuentaBases =
                                        listOf(
                                                TributoCuentaBase(
                                                        tributoKey = TributoKeys.VENTAS,
                                                        cuentaId =
                                                                CuentasContablesPorDefecto
                                                                        .ingresosVentas()
                                                                        .id
                                                )
                                        ),
                                monedas = defaultCajaBancoState().monedas,
                                monedaTasas = defaultCajaBancoState().monedaTasas,
                                monedaTasaHistorial = defaultCajaBancoState().monedaTasaHistorial
                        )
        )
    }

    private suspend fun readWorkspaceSnapshot(workspaceId: String): WorkspaceSnapshot? {
        val raw =
                context.ledgerDataStore.data.first()[workspaceSnapshotKey(workspaceId)]
                        ?: return null
        return runCatching { gson.fromJson(raw, WorkspaceSnapshot::class.java) }
                .getOrNull()
                ?.let { snapshot ->
                    snapshot.copy(accounting = snapshot.accounting.withCajaBancoDefaultsIfNeeded())
                }
    }

    private suspend fun saveRegistro(registro: RegistroTCP, modifiedByUser: Boolean) {
        context.ledgerDataStore.edit { prefs ->
            prefs[REGISTRO_KEY] = gson.toJson(registro)
            prefs[LOCAL_MODIFIED_KEY] = if (modifiedByUser) "true" else "false"
        }
    }

    private suspend fun saveBaseline(
            registro: RegistroTCP,
            inventario: InventarioRegistro,
            serverVersion: String
    ) {
        val resolvedVersion =
                if (serverVersion.isNotBlank()) {
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
        tercerosRepository.clearLocalModified()
    }

    private suspend fun buildAccountingWorkspaceState(): AccountingWorkspaceState {
        return AccountingWorkspaceState(
                cuentasContables = cuentaContableDao.getActivas(),
                ingresoGastoCuentas = ingresoGastoCuentaDao.getAll(),
                ingresoGastoNotas = ingresoGastoNotaDao.getAll(),
                posIntegrationConfig = posIntegrationConfigDao.getById(),
                tributoConfigs = tributoConfigDao.getAll(),
                tributoCuentaBases = tributoCuentaBaseDao.getAll(),
                wallets = cajaBancoDao.getWalletsList(),
                walletMovimientos = cajaBancoDao.getMovimientosList(),
                monedas = cajaBancoDao.getMonedasList(),
                monedaTasas = cajaBancoDao.getMonedaTasasList(),
                monedaTasaHistorial = cajaBancoDao.getMonedaTasaHistorialList()
        )
    }

    private suspend fun buildActiveWorkspaceSnapshot(): WorkspaceSnapshot {
        val registroActual = buildRegistroWithInventario()
        val prefs = context.ledgerDataStore.data.first()
        val baselineRegistro =
                prefs[BASELINE_REGISTRO_KEY]?.let { raw ->
                    runCatching { gson.fromJson(raw, RegistroTCP::class.java) }.getOrNull()
                }
        val baselineInventario =
                prefs[BASELINE_INVENTARIO_KEY]?.let { raw ->
                    runCatching { gson.fromJson(raw, InventarioRegistro::class.java) }.getOrNull()
                }
        return WorkspaceSnapshot(
                registro = registroActual,
                accounting = buildAccountingWorkspaceState(),
                lastSync = prefs[LAST_SYNC_KEY],
                ledgerModified = prefs[LOCAL_MODIFIED_KEY] == "true",
                inventarioModified = inventarioRepository.localModified.first(),
                tercerosModified = tercerosRepository.localModified.first(),
                serverVersion = prefs[SERVER_VERSION_KEY].orEmpty(),
                lastDownloadedVersion = prefs[LAST_DOWNLOADED_VERSION_KEY].orEmpty(),
                baselineRegistro = baselineRegistro,
                baselineInventario = baselineInventario
        )
    }

    private suspend fun persistActiveWorkspaceSnapshot(workspaceId: String) {
        val snapshot = buildActiveWorkspaceSnapshot()
        context.ledgerDataStore.edit { prefs ->
            prefs[workspaceSnapshotKey(workspaceId)] = gson.toJson(snapshot)
        }
    }

    private fun snapshotToCloudEntry(
            profile: WorkspaceProfile,
            snapshot: WorkspaceSnapshot
    ): CloudWorkspaceEntry {
        return CloudWorkspaceEntry(
                id = profile.id,
                name = profile.nombre,
                registro = normalizeImportedRegistro(snapshot.registro),
                accounting = snapshot.accounting
        )
    }

    private fun normalizeAccountingState(
            raw: RawAccountingWorkspaceState?
    ): AccountingWorkspaceState {
        return AccountingWorkspaceState(
                cuentasContables = raw?.cuentasContables.orEmpty().map { it.conUsoOperativoNormalizado() },
                ingresoGastoCuentas = raw?.ingresoGastoCuentas.orEmpty(),
                ingresoGastoNotas = raw?.ingresoGastoNotas.orEmpty(),
                posIntegrationConfig = raw?.posIntegrationConfig,
                tributoConfigs = raw?.tributoConfigs.orEmpty(),
                tributoCuentaBases = raw?.tributoCuentaBases.orEmpty(),
                wallets = raw?.wallets.orEmpty(),
                walletMovimientos = raw?.walletMovimientos.orEmpty(),
                monedas = raw?.monedas.orEmpty(),
                monedaTasas = raw?.monedaTasas.orEmpty(),
                monedaTasaHistorial = raw?.monedaTasaHistorial.orEmpty()
        ).withCajaBancoDefaultsIfNeeded()
    }

    private fun parseCloudLedgerContainer(json: String): CloudLedgerContainer? {
        val rawContainer =
                runCatching { gson.fromJson(json, RawCloudLedgerContainer::class.java) }.getOrNull()
                        ?: return null

        val normalizedWorkspaces =
                rawContainer.workspaces.orEmpty().mapNotNull { entry ->
                    val registro = entry.registro ?: return@mapNotNull null
                    val id = entry.id?.takeIf { it.isNotBlank() } ?: UUID.randomUUID().toString()
                    CloudWorkspaceEntry(
                            id = id,
                            name = entry.name?.takeIf { it.isNotBlank() } ?: "Negocio principal",
                            registro = normalizeImportedRegistro(registro),
                            accounting = normalizeAccountingState(entry.accounting)
                    )
                }

        if (normalizedWorkspaces.isEmpty()) return null

        val activeWorkspaceId =
                rawContainer.activeWorkspaceId?.takeIf { activeId ->
                    normalizedWorkspaces.any { it.id == activeId }
                }
                        ?: normalizedWorkspaces.first().id

        return CloudLedgerContainer(
                activeWorkspaceId = activeWorkspaceId,
                workspaces = normalizedWorkspaces
        )
    }

    private fun cloudEntryToSnapshot(
            entry: CloudWorkspaceEntry,
            serverVersion: String = ""
    ): WorkspaceSnapshot {
        val normalizedRegistro = normalizeImportedRegistro(entry.registro)
        return WorkspaceSnapshot(
                registro = normalizedRegistro,
                accounting = entry.accounting.withCajaBancoDefaultsIfNeeded(),
                lastSync =
                        if (serverVersion.isBlank()) null else java.time.Instant.now().toString(),
                ledgerModified = false,
                inventarioModified = false,
                tercerosModified = false,
                serverVersion = serverVersion,
                lastDownloadedVersion = serverVersion,
                baselineRegistro = stripInventario(normalizedRegistro),
                baselineInventario = normalizedRegistro.inventario
        )
    }

    private suspend fun buildCloudLedgerContainer(): CloudLedgerContainer {
        ensureWorkspaceRegistry()
        val profiles =
                workspaceProfiles.first().ifEmpty {
                    listOf(
                            WorkspaceProfile(
                                    id = getCurrentWorkspaceId(),
                                    nombre = "Negocio principal"
                            )
                    )
                }
        val activeId = getCurrentWorkspaceId()
        val entries =
                profiles.map { profile ->
                    val snapshot =
                            if (profile.id == activeId) {
                                buildActiveWorkspaceSnapshot()
                            } else {
                                readWorkspaceSnapshot(profile.id)
                                        ?: emptyWorkspaceSnapshot()
                            }
                    snapshotToCloudEntry(profile, snapshot)
                }
        return CloudLedgerContainer(activeWorkspaceId = activeId, workspaces = entries)
    }

    private suspend fun applyCloudLedgerContainer(
            container: CloudLedgerContainer,
            serverVersion: String
    ): Result<SyncResult> {
        return try {
            val normalizedEntries =
                    container.workspaces.ifEmpty {
                        listOf(
                                CloudWorkspaceEntry(
                                        id = DEFAULT_WORKSPACE_ID,
                                        name = "Negocio principal",
                                        registro = emptyRegistro(),
                                        accounting =
                                                AccountingWorkspaceState(
                                                        cuentasContables =
                                                                CuentasContablesPorDefecto.todas(),
                                                        posIntegrationConfig =
                                                                PosIntegrationConfig(
                                                                        ingresoCuentaId =
                                                                                CuentasContablesPorDefecto
                                                                                        .ingresosVentas()
                                                                                        .id,
                                                                        gastoCuentaId =
                                                                                CuentasContablesPorDefecto
                                                                                        .gastosActividad()
                                                                                        .id
                                                                ),
                                                        tributoConfigs =
                                                                TributoConfigsPorDefecto
                                                                        .entidades(),
                                                        tributoCuentaBases =
                                                                listOf(
                                                                        TributoCuentaBase(
                                                                                tributoKey =
                                                                                        TributoKeys
                                                                                                .VENTAS,
                                                                                cuentaId =
                                                                                        CuentasContablesPorDefecto
                                                                                                .ingresosVentas()
                                                                                                .id
                                                                        )
                                                                ),
                                                        monedas = defaultCajaBancoState().monedas,
                                                        monedaTasas = defaultCajaBancoState().monedaTasas,
                                                        monedaTasaHistorial = defaultCajaBancoState().monedaTasaHistorial
                                                )
                                )
                        )
                    }

            val profiles =
                    normalizedEntries.map { entry ->
                        WorkspaceProfile(id = entry.id, nombre = entry.name)
                    }
            val activeId =
                    container.activeWorkspaceId.takeIf { id -> profiles.any { it.id == id } }
                            ?: profiles.first().id

            val snapshots =
                    normalizedEntries.associate { entry ->
                        entry.id to cloudEntryToSnapshot(entry, serverVersion)
                    }

            context.ledgerDataStore.edit { prefs ->
                prefs[WORKSPACES_KEY] = gson.toJson(profiles)
                prefs[CURRENT_WORKSPACE_ID_KEY] = activeId
                snapshots.forEach { (workspaceId, snapshot) ->
                    prefs[workspaceSnapshotKey(workspaceId)] = gson.toJson(snapshot)
                }
            }

            val activeSnapshot =
                    snapshots[activeId]
                            ?: cloudEntryToSnapshot(normalizedEntries.first(), serverVersion)
            applyWorkspaceSnapshot(activeSnapshot)

            Result.success(
                    SyncResult(
                            success = true,
                            message = "Negocios locales actualizados desde la nube",
                            action = SyncAction.PULL_ONLY
                    )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private suspend fun restoreAccountingWorkspaceState(state: AccountingWorkspaceState) {
        val normalizedState = state.withCajaBancoDefaultsIfNeeded()
        appDatabase.withTransaction {
            cajaBancoDao.deleteMovimientos()
            cajaBancoDao.deleteWallets()
            cajaBancoDao.deleteMonedaTasaHistorial()
            cajaBancoDao.deleteMonedas()
            cajaBancoDao.deleteMonedaTasas()
            tributoCuentaBaseDao.deleteAll()
            tributoConfigDao.deleteAll()
            posIntegrationConfigDao.deleteAll()
            ingresoGastoNotaDao.deleteAll()
            ingresoGastoCuentaDao.deleteAll()
            cuentaContableDao.deleteAll()

            val cuentasNormalizadas = normalizedState.cuentasContables.map { it.conUsoOperativoNormalizado() }
            if (cuentasNormalizadas.isNotEmpty()) {
                cuentaContableDao.insertAll(cuentasNormalizadas)
            }
            if (normalizedState.ingresoGastoCuentas.isNotEmpty()) {
                ingresoGastoCuentaDao.insertAll(normalizedState.ingresoGastoCuentas)
            }
            if (normalizedState.ingresoGastoNotas.isNotEmpty()) {
                ingresoGastoNotaDao.insertAll(normalizedState.ingresoGastoNotas)
            }
            normalizedState.posIntegrationConfig?.let { posIntegrationConfigDao.insert(it) }
            if (normalizedState.tributoConfigs.isNotEmpty()) {
                tributoConfigDao.insertAll(normalizedState.tributoConfigs)
            }
            if (normalizedState.tributoCuentaBases.isNotEmpty()) {
                tributoCuentaBaseDao.insertAll(normalizedState.tributoCuentaBases)
            }
            if (normalizedState.monedaTasas.isNotEmpty()) {
                cajaBancoDao.insertMonedaTasas(normalizedState.monedaTasas)
            }
            if (normalizedState.monedas.isNotEmpty()) {
                cajaBancoDao.insertMonedas(normalizedState.monedas)
            }
            if (normalizedState.monedaTasaHistorial.isNotEmpty()) {
                cajaBancoDao.insertMonedaTasaHistorial(normalizedState.monedaTasaHistorial)
            }
            if (normalizedState.wallets.isNotEmpty()) {
                cajaBancoDao.insertWallets(normalizedState.wallets)
            }
            if (normalizedState.walletMovimientos.isNotEmpty()) {
                cajaBancoDao.insertMovimientos(normalizedState.walletMovimientos)
            }
        }
        ensureDefaultAccounts()
    }

    private suspend fun applyWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
        val normalized = normalizeImportedRegistro(snapshot.registro)
        inventarioRepository.fromInventarioRegistro(normalized.inventario)
        tercerosRepository.fromTercerosRegistro(normalized.terceros)
        restoreAccountingWorkspaceState(snapshot.accounting)

        val registroSinDependencias =
                stripInventario(normalized).copy(terceros = normalized.terceros)
        context.ledgerDataStore.edit { prefs ->
            prefs[REGISTRO_KEY] = gson.toJson(registroSinDependencias)
            prefs[LAST_SYNC_KEY] = snapshot.lastSync ?: ""
            prefs[LOCAL_MODIFIED_KEY] = if (snapshot.ledgerModified) "true" else "false"
            prefs[SERVER_VERSION_KEY] = snapshot.serverVersion
            prefs[LAST_DOWNLOADED_VERSION_KEY] = snapshot.lastDownloadedVersion
            if (snapshot.baselineRegistro != null) {
                prefs[BASELINE_REGISTRO_KEY] = gson.toJson(snapshot.baselineRegistro)
            } else {
                prefs.remove(BASELINE_REGISTRO_KEY)
            }
            if (snapshot.baselineInventario != null) {
                prefs[BASELINE_INVENTARIO_KEY] = gson.toJson(snapshot.baselineInventario)
            } else {
                prefs.remove(BASELINE_INVENTARIO_KEY)
            }
        }
        inventarioRepository.setLocalModified(snapshot.inventarioModified)
        tercerosRepository.setLocalModified(snapshot.tercerosModified)
    }

    private suspend fun ensureWorkspaceRegistry() {
        val prefs = context.ledgerDataStore.data.first()
        val existing = parseWorkspaceProfiles(prefs[WORKSPACES_KEY]).toMutableList()
        val currentId = prefs[CURRENT_WORKSPACE_ID_KEY] ?: DEFAULT_WORKSPACE_ID
        if (existing.none { it.id == currentId }) {
            existing.add(WorkspaceProfile(id = currentId, nombre = "Negocio principal"))
        }
        context.ledgerDataStore.edit { editable ->
            editable[WORKSPACES_KEY] = gson.toJson(existing.distinctBy { it.id })
            editable[CURRENT_WORKSPACE_ID_KEY] = currentId
        }
    }

    suspend fun saveUserEditedRegistro(registro: RegistroTCP) {
        saveRegistro(registro, modifiedByUser = true)
    }

    private suspend fun saveRegistroAplicandoTributos(
            registro: RegistroTCP,
            modifiedByUser: Boolean = true
    ) {
        saveRegistro(applyAutoCalculatedTributos(registro), modifiedByUser = modifiedByUser)
    }

    private suspend fun refreshAutoCalculatedTributos(modifiedByUser: Boolean = false) {
        saveRegistroAplicandoTributos(getRegistro(), modifiedByUser = modifiedByUser)
    }

    suspend fun ensureDefaultAccounts() {
        ensureWorkspaceRegistry()

        val existentes = cuentaContableDao.getActivas().associateBy { it.codigo }
        val faltantes = CuentasContablesPorDefecto.todas().filter { existentes[it.codigo] == null }
        if (faltantes.isNotEmpty()) {
            cuentaContableDao.insertAll(faltantes)
        }

        val configs = tributoConfigDao.getAll()
        if (configs.isEmpty()) {
            tributoConfigDao.insertAll(TributoConfigsPorDefecto.entidades())
        }

        val relaciones = tributoCuentaBaseDao.getAll()
        if (relaciones.none { it.tributoKey == TributoKeys.VENTAS }) {
            tributoCuentaBaseDao.insertAll(
                    listOf(
                            TributoCuentaBase(
                                    tributoKey = TributoKeys.VENTAS,
                                    cuentaId = CuentasContablesPorDefecto.ingresosVentas().id
                            )
                    )
            )
        }

        val actualConfig = posIntegrationConfigDao.getById()
        if (actualConfig == null) {
            posIntegrationConfigDao.insert(
                    PosIntegrationConfig(
                            enabled = false,
                            ingresoCuentaId = CuentasContablesPorDefecto.ingresosVentas().id,
                            gastoCuentaId = CuentasContablesPorDefecto.gastosActividad().id
                    )
            )
        }

        refreshAutoCalculatedTributos(modifiedByUser = false)
    }

    suspend fun createWorkspace(nombre: String): WorkspaceProfile {
        ensureWorkspaceRegistry()
        val nombreNormalizado = nombre.trim()
        require(nombreNormalizado.isNotBlank()) { "El nombre del negocio es obligatorio" }

        val profile =
                WorkspaceProfile(id = UUID.randomUUID().toString(), nombre = nombreNormalizado)
        val current = workspaceProfiles.first().toMutableList()
        current.add(profile)
        val snapshot = emptyWorkspaceSnapshot()

        context.ledgerDataStore.edit { prefs ->
            prefs[WORKSPACES_KEY] = gson.toJson(current.distinctBy { it.id })
            prefs[workspaceSnapshotKey(profile.id)] = gson.toJson(snapshot)
        }

        switchWorkspace(profile.id)
        return profile
    }

    suspend fun switchWorkspace(workspaceId: String) {
        ensureWorkspaceRegistry()
        val profiles = workspaceProfiles.first()
        require(profiles.any { it.id == workspaceId }) { "El negocio seleccionado no existe" }

        val activeWorkspaceId = getCurrentWorkspaceId()
        if (activeWorkspaceId == workspaceId) return

        persistActiveWorkspaceSnapshot(activeWorkspaceId)
        val snapshot =
                readWorkspaceSnapshot(workspaceId)
                        ?: emptyWorkspaceSnapshot()
        applyWorkspaceSnapshot(snapshot)

        val updatedProfiles =
                profiles.map { profile ->
                    if (profile.id == workspaceId)
                            profile.copy(updatedAt = System.currentTimeMillis())
                    else profile
                }
        context.ledgerDataStore.edit { prefs ->
            prefs[CURRENT_WORKSPACE_ID_KEY] = workspaceId
            prefs[WORKSPACES_KEY] = gson.toJson(updatedProfiles)
        }
    }

    suspend fun crearCuentaContable(
            codigo: String,
            nombre: String,
            naturaleza: String,
            tipo: String,
            usoOperativo: String
    ) {
        val codigoNormalizado = codigo.trim()
        val nombreNormalizado = nombre.trim()
        require(codigoNormalizado.isNotBlank()) { "El código es obligatorio" }
        require(nombreNormalizado.isNotBlank()) { "El nombre es obligatorio" }

        val existente = cuentaContableDao.getByCodigo(codigoNormalizado)
        require(existente == null) { "Ya existe una cuenta con ese código" }

        val ahora = System.currentTimeMillis()
        cuentaContableDao.insert(
                CuentaContable(
                        id = UUID.randomUUID().toString(),
                        codigo = codigoNormalizado,
                        nombre = nombreNormalizado,
                        naturaleza = naturaleza,
                        tipo = tipo,
                        usoOperativo = usoOperativo,
                        createdAt = ahora,
                        updatedAt = ahora
                )
        )
    }

    suspend fun updatePosIntegrationConfig(
            enabled: Boolean,
            ingresoCuentaId: String?,
            gastoCuentaId: String?
    ) {
        val actual = posIntegrationConfigDao.getById()
        posIntegrationConfigDao.insert(
                (actual ?: PosIntegrationConfig()).copy(
                        enabled = enabled,
                        ingresoCuentaId = ingresoCuentaId,
                        gastoCuentaId = gastoCuentaId,
                        updatedAt = System.currentTimeMillis()
                )
        )
    }

    suspend fun updateTributoConfig(
            key: String,
            incluido: Boolean,
            autocalcular: Boolean,
            porcentaje: Double,
            cuentaIds: List<String>
    ) {
        val actual =
                tributoConfigDao.getAll().firstOrNull { it.key == key }
                        ?: TributoConfigsPorDefecto.entidades().firstOrNull { it.key == key }
                                ?: return

        tributoConfigDao.insert(
                actual.copy(
                        incluido = incluido,
                        autocalcular = autocalcular,
                        porcentaje = porcentaje,
                        updatedAt = System.currentTimeMillis()
                )
        )

        tributoCuentaBaseDao.deleteByTributoKey(key)
        val cuentas =
                cuentaIds.map { it.trim() }.filter { it.isNotBlank() }.distinct().map { cuentaId ->
                    TributoCuentaBase(tributoKey = key, cuentaId = cuentaId)
                }
        if (cuentas.isNotEmpty()) {
            tributoCuentaBaseDao.insertAll(cuentas)
        }

        refreshAutoCalculatedTributos(modifiedByUser = true)
    }

    suspend fun setExperimentalFeaturesEnabled(enabled: Boolean) {
        context.ledgerDataStore.edit { prefs ->
            prefs[EXPERIMENTAL_FEATURES_KEY] = if (enabled) "true" else "false"
        }
    }

    suspend fun setHideInventarioDisclaimer(hide: Boolean) {
        context.ledgerDataStore.edit { prefs ->
            prefs[HIDE_INVENTARIO_DISCLAIMER_KEY] = if (hide) "true" else "false"
        }
    }

    private suspend fun buildRegistroWithInventario(): RegistroTCP {
        val current = getRegistro()
        val inventarioRegistro = inventarioRepository.toInventarioRegistro()
        val tercerosRegistro = tercerosRepository.toTercerosRegistro()
        return current.copy(inventario = inventarioRegistro, terceros = tercerosRegistro)
    }

    private fun stripInventario(registro: RegistroTCP): RegistroTCP {
        // El inventario se sincroniza en el campo dedicado `inventarioRegistro`.
        // Terceros permanece dentro de `registro` para que viaje al servidor.
        return registro.copy(inventario = InventarioRegistro())
    }

    private fun hasInventarioData(inventario: InventarioRegistro?): Boolean {
        if (inventario == null) return false
        return inventario.productos.isNotEmpty() ||
                inventario.catalogoVentas.isNotEmpty() ||
                inventario.catalogoCompras.isNotEmpty() ||
                inventario.almacenes.isNotEmpty() ||
                inventario.stock.isNotEmpty() ||
                inventario.productosVenta.isNotEmpty() ||
                inventario.productosCompra.isNotEmpty() ||
                inventario.operaciones.isNotEmpty()
    }

    private fun hasTercerosData(terceros: TercerosRegistro?): Boolean {
        if (terceros == null) return false
        return terceros.terceros.isNotEmpty() ||
                terceros.roles.isNotEmpty() ||
                terceros.cuentas.isNotEmpty() ||
                terceros.movimientos.isNotEmpty()
    }

    private fun isRegistroEffectivelyEmpty(registro: RegistroTCP): Boolean {
        val generalesVacios =
                registro.generales.nombre.isBlank() &&
                        registro.generales.nit.isBlank() &&
                        registro.generales.actividad.isBlank() &&
                        registro.generales.codigo.isBlank() &&
                        registro.generales.fiscalCalle.isBlank() &&
                        registro.generales.fiscalMunicipio.isBlank() &&
                        registro.generales.fiscalProvincia.isBlank() &&
                        registro.generales.legalCalle.isBlank() &&
                        registro.generales.legalMunicipio.isBlank() &&
                        registro.generales.legalProvincia.isBlank()

        val ingresosVacios = registro.ingresos.values.all { it.isEmpty() }
        val gastosVacios = registro.gastos.values.all { it.isEmpty() }
        val tributosVacios =
                registro.tributos.all { row ->
                    row.ventas.isBlank() &&
                            row.fuerza.isBlank() &&
                            row.sellos.isBlank() &&
                            row.anuncios.isBlank() &&
                            row.css20.isBlank() &&
                            row.css14.isBlank() &&
                            row.otros.isBlank() &&
                            row.restauracion.isBlank() &&
                            row.arrendamiento.isBlank() &&
                            row.exonerado.isBlank() &&
                            row.otrosMFP.isBlank() &&
                            row.cuotaMensual.isBlank()
                }

        return generalesVacios &&
                ingresosVacios &&
                gastosVacios &&
                tributosVacios &&
                !hasInventarioData(registro.inventario) &&
                !hasTercerosData(registro.terceros)
    }

    private fun buildRemoteRegistro(response: ContLedgerResponse): RegistroTCP? {
        val registroElement = response.registro ?: return null
        val registro =
                runCatching { gson.fromJson(registroElement, RegistroTCP::class.java) }.getOrNull()
                        ?: return null

        val inventario =
                response.inventarioRegistro?.let { inventarioElement ->
                    runCatching { gson.fromJson(inventarioElement, InventarioRegistro::class.java) }
                            .getOrNull()
                }
        val combinado = if (inventario != null) registro.copy(inventario = inventario) else registro
        return normalizeImportedRegistro(combinado)
    }

    private fun buildRemoteContainer(response: ContLedgerResponse): CloudLedgerContainer? {
        val registroElement = response.registro ?: return null
        val asContainer = parseCloudLedgerContainer(registroElement.toString())

        if (asContainer != null) {
            return asContainer
        }

        val legacyRegistro = buildRemoteRegistro(response) ?: return null
        return CloudLedgerContainer(
                activeWorkspaceId = DEFAULT_WORKSPACE_ID,
                workspaces =
                        listOf(
                                CloudWorkspaceEntry(
                                        id = DEFAULT_WORKSPACE_ID,
                                        name = "Negocio principal",
                                        registro = legacyRegistro,
                                        accounting =
                                                AccountingWorkspaceState(
                                                        cuentasContables =
                                                                CuentasContablesPorDefecto.todas(),
                                                        posIntegrationConfig =
                                                                PosIntegrationConfig(
                                                                        ingresoCuentaId =
                                                                                CuentasContablesPorDefecto
                                                                                        .ingresosVentas()
                                                                                        .id,
                                                                        gastoCuentaId =
                                                                                CuentasContablesPorDefecto
                                                                                        .gastosActividad()
                                                                                        .id
                                                                ),
                                                        tributoConfigs =
                                                                TributoConfigsPorDefecto
                                                                        .entidades(),
                                                        tributoCuentaBases =
                                                                listOf(
                                                                        TributoCuentaBase(
                                                                                tributoKey =
                                                                                        TributoKeys
                                                                                                .VENTAS,
                                                                                cuentaId =
                                                                                        CuentasContablesPorDefecto
                                                                                                .ingresosVentas()
                                                                                                .id
                                                                        )
                                                                ),
                                                        monedas = defaultCajaBancoState().monedas,
                                                        monedaTasas = defaultCajaBancoState().monedaTasas,
                                                        monedaTasaHistorial = defaultCajaBancoState().monedaTasaHistorial
                                                )
                                )
                        )
        )
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

    suspend fun exportBackupToUri(uri: Uri): Result<Unit> =
            withContext(Dispatchers.IO) {
                try {
                    val container = buildCloudLedgerContainer()
                    val payload =
                            RegistroBackupPayload(
                                    exportedAt = java.time.Instant.now().toString(),
                                    container = container
                            )
                    val json = gson.toJson(payload)
                    documentStorageRepository.saveText(
                            DocumentCategory.BACKUPS,
                            "Backup_${java.time.LocalDate.now()}.json",
                            json
                    )
                    context.contentResolver.openOutputStream(uri)?.use { output ->
                        output.write(json.toByteArray(Charsets.UTF_8))
                    }
                            ?: throw Exception(
                                    "No se pudo abrir el destino para guardar el archivo"
                            )
                    Result.success(Unit)
                } catch (e: Exception) {
                    Result.failure(e)
                }
            }

    suspend fun importBackupFromUri(uri: Uri): Result<RegistroTCP> =
            withContext(Dispatchers.IO) {
                try {
                    val rawJson =
                            context.contentResolver
                                    .openInputStream(uri)
                                    ?.bufferedReader(Charsets.UTF_8)
                                    ?.use { it.readText() }
                                    ?: throw Exception("No se pudo leer el archivo seleccionado")

                    val cleanedJson = sanitizeJsonString(rawJson)

                    val importedContainer: CloudLedgerContainer? =
                            try {
                                val rootElement = JsonParser().parse(cleanedJson)
                                if (!rootElement.isJsonObject) {
                                    throw Exception(
                                            "El archivo no contiene un JSON de respaldo válido"
                                    )
                                }

                                val rootObject = rootElement.asJsonObject

                                if (rootObject.has("container")) {
                                    parseCloudLedgerContainer(
                                            rootObject.get("container").toString()
                                    )
                                } else if (rootObject.has("activeWorkspaceId") &&
                                                rootObject.has("workspaces")
                                ) {
                                    parseCloudLedgerContainer(rootElement.toString())
                                } else if (rootObject.has("registro")) {
                                    val registroElement = rootObject.get("registro")
                                    val legacyRegistro =
                                            tryParseLegacyRegistro(registroElement.toString())
                                    if (legacyRegistro != null) {
                                        CloudLedgerContainer(
                                                activeWorkspaceId = DEFAULT_WORKSPACE_ID,
                                                workspaces =
                                                        listOf(
                                                                CloudWorkspaceEntry(
                                                                        id = DEFAULT_WORKSPACE_ID,
                                                                        name =
                                                                                legacyRegistro
                                                                                        .generales
                                                                                        ?.nombre
                                                                                        ?.takeIf {
                                                                                            !it.isNullOrBlank()
                                                                                        }
                                                                                        ?: "Negocio principal",
                                                                        registro =
                                                                                migrateFromLegacy(
                                                                                        legacyRegistro
                                                                                )
                                                                )
                                                        )
                                        )
                                    } else {
                                        val registro =
                                                gson.fromJson(
                                                        registroElement.toString(),
                                                        RegistroTCP::class.java
                                                )
                                                        ?: throw Exception(
                                                                "No se pudo interpretar el registro del archivo"
                                                        )
                                        CloudLedgerContainer(
                                                activeWorkspaceId = DEFAULT_WORKSPACE_ID,
                                                workspaces =
                                                        listOf(
                                                                CloudWorkspaceEntry(
                                                                        id = DEFAULT_WORKSPACE_ID,
                                                                        name = "Negocio principal",
                                                                        registro =
                                                                                normalizeImportedRegistro(
                                                                                        registro
                                                                                )
                                                                )
                                                        )
                                        )
                                    }
                                } else {
                                    val legacyRegistro = tryParseLegacyRegistro(cleanedJson)
                                    if (legacyRegistro != null) {
                                        CloudLedgerContainer(
                                                activeWorkspaceId = DEFAULT_WORKSPACE_ID,
                                                workspaces =
                                                        listOf(
                                                                CloudWorkspaceEntry(
                                                                        id = DEFAULT_WORKSPACE_ID,
                                                                        name =
                                                                                legacyRegistro
                                                                                        .generales
                                                                                        ?.nombre
                                                                                        ?.takeIf {
                                                                                            !it.isNullOrBlank()
                                                                                        }
                                                                                        ?: "Negocio principal",
                                                                        registro =
                                                                                migrateFromLegacy(
                                                                                        legacyRegistro
                                                                                )
                                                                )
                                                        )
                                        )
                                    } else {
                                        val registro =
                                                gson.fromJson(
                                                        rootElement.toString(),
                                                        RegistroTCP::class.java
                                                )
                                                        ?: throw Exception(
                                                                "No se pudo interpretar el registro del archivo"
                                                        )
                                        CloudLedgerContainer(
                                                activeWorkspaceId = DEFAULT_WORKSPACE_ID,
                                                workspaces =
                                                        listOf(
                                                                CloudWorkspaceEntry(
                                                                        id = DEFAULT_WORKSPACE_ID,
                                                                        name = "Negocio principal",
                                                                        registro =
                                                                                normalizeImportedRegistro(
                                                                                        registro
                                                                                )
                                                                )
                                                        )
                                        )
                                    }
                                }
                            } catch (e: Exception) {
                                val legacyRegistro = tryParseLegacyRegistro(cleanedJson)
                                if (legacyRegistro != null) {
                                    CloudLedgerContainer(
                                            activeWorkspaceId = DEFAULT_WORKSPACE_ID,
                                            workspaces =
                                                    listOf(
                                                            CloudWorkspaceEntry(
                                                                    id = DEFAULT_WORKSPACE_ID,
                                                                    name = "Negocio principal",
                                                                    registro =
                                                                            migrateFromLegacy(
                                                                                    legacyRegistro
                                                                            )
                                                            )
                                                    )
                                    )
                                } else {
                                    throw e
                                }
                            }

                    val container =
                            importedContainer ?: throw Exception("No se pudo interpretar el backup")
                    applyCloudLedgerContainer(container, serverVersion = "").getOrThrow()
                    Result.success(getRegistro())
                } catch (e: Exception) {
                    Result.failure(e)
                }
            }

    private fun sanitizeJsonString(json: String): String {
        return json.replace(Regex("[\u0000-\u001F]"), "").replace(
                        Regex("(\\\\u00[0-9A-Fa-f]{2}){1,}")
                ) { matchResult ->
            try {
                val hexString = matchResult.value.replace("\\u00", "")
                val bytes = hexString.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
                String(bytes, Charsets.UTF_8)
            } catch (_: Exception) {
                ""
            }
        }
    }

    private fun tryParseLegacyRegistro(json: String): LegacyRegistro? {
        return try {
            gson.fromJson(json, LegacyRegistro::class.java)
        } catch (_: Exception) {
            null
        }
    }

    private fun migrateFromLegacy(legacy: LegacyRegistro): RegistroTCP {
        val baseYear =
                legacy.generales?.anio?.takeIf { it >= 2020 }
                        ?: java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)

        val generalesData =
                GeneralesData(
                        anio = baseYear,
                        nombre = legacy.generales?.nombre?.sanitizeText() ?: "",
                        nit = legacy.generales?.nit?.sanitizeText() ?: "",
                        actividad = legacy.generales?.actividad?.sanitizeText() ?: "",
                        codigo = legacy.generales?.codigo?.sanitizeText() ?: "",
                        fiscalCalle = legacy.generales?.fiscalCalle?.sanitizeText() ?: "",
                        fiscalMunicipio = legacy.generales?.fiscalMunicipio?.sanitizeText() ?: "",
                        fiscalProvincia = legacy.generales?.fiscalProvincia?.sanitizeText() ?: "",
                        legalCalle = legacy.generales?.legalCalle?.sanitizeText() ?: "",
                        legalMunicipio = legacy.generales?.legalMunicipio?.sanitizeText() ?: "",
                        legalProvincia = legacy.generales?.legalProvincia?.sanitizeText() ?: ""
                )

        val meses =
                listOf(
                        "ENE",
                        "FEB",
                        "MAR",
                        "ABR",
                        "MAY",
                        "JUN",
                        "JUL",
                        "AGO",
                        "SEP",
                        "OCT",
                        "NOV",
                        "DIC"
                )
        val labelsMeses =
                mapOf(
                        "ENE" to "Enero",
                        "FEB" to "Febrero",
                        "MAR" to "Marzo",
                        "ABR" to "Abril",
                        "MAY" to "Mayo",
                        "JUN" to "Junio",
                        "JUL" to "Julio",
                        "AGO" to "Agosto",
                        "SEP" to "Septiembre",
                        "OCT" to "Octubre",
                        "NOV" to "Noviembre",
                        "DIC" to "Diciembre"
                )

        val ingresos =
                meses.associateWith { month -> normalizeMonthRows(legacy.ingresos?.get(month)) }

        val gastos = meses.associateWith { month -> normalizeMonthRows(legacy.gastos?.get(month)) }

        val tributos =
                meses.mapIndexed { index, month ->
                    val row = legacy.tributos?.getOrNull(index)
                    TributoRow(
                            mes = labelsMeses[month] ?: month,
                            ventas = row?.ventas?.sanitizeText() ?: "",
                            fuerza = row?.fuerza?.sanitizeText() ?: "",
                            sellos = row?.sellos?.sanitizeText() ?: "",
                            anuncios = row?.anuncios?.sanitizeText() ?: "",
                            css20 = row?.css20?.sanitizeText() ?: "",
                            css14 = row?.css14?.sanitizeText() ?: "",
                            cssSubsidio = "5",
                            otros = row?.otros?.sanitizeText() ?: "",
                            restauracion = row?.restauracion?.sanitizeText() ?: "",
                            arrendamiento = row?.arrendamiento?.sanitizeText() ?: "",
                            exonerado = row?.exonerado?.sanitizeText() ?: "",
                            otrosMFP = row?.otrosMFP?.sanitizeText() ?: "",
                            cuotaMensual = row?.cuotaMensual?.sanitizeText() ?: ""
                    )
                }

        val inventario =
                legacy.inventario?.let { legacyInv ->
                    val productosVenta =
                            legacyInv.productosVenta?.mapNotNull { p ->
                                p.nombre?.takeIf { it.isNotBlank() }?.let {
                                    ProductoInventario(
                                            id = p.id?.sanitizeId()
                                                            ?: java.util
                                                                    .UUID
                                                                    .randomUUID()
                                                                    .toString(),
                                            nombre = p.nombre?.sanitizeText() ?: "",
                                            unidad = p.unidad?.sanitizeText() ?: "und",
                                            emoji = "📦",
                                            precio = p.precio ?: 0.0,
                                            tipo = "venta"
                                    )
                                }
                            }
                                    ?: emptyList()

                    val productosCompra =
                            legacyInv.productosCompra?.mapNotNull { p ->
                                p.nombre?.takeIf { it.isNotBlank() }?.let {
                                    ProductoInventario(
                                            id = p.id?.sanitizeId()
                                                            ?: java.util
                                                                    .UUID
                                                                    .randomUUID()
                                                                    .toString(),
                                            nombre = p.nombre?.sanitizeText() ?: "",
                                            unidad = p.unidad?.sanitizeText() ?: "und",
                                            emoji = "📦",
                                            precio = p.precio ?: 0.0,
                                            tipo = "compra"
                                    )
                                }
                            }
                                    ?: emptyList()

                    val operaciones =
                            legacyInv.operaciones?.mapNotNull { op ->
                                if (op?.tipo.isNullOrBlank()) return@mapNotNull null
                                OperacionInventario(
                                        id = op.id?.sanitizeId()
                                                        ?: java.util.UUID.randomUUID().toString(),
                                        tipo = op.tipo?.lowercase() ?: return@mapNotNull null,
                                        fecha = op.fecha?.sanitizeText() ?: return@mapNotNull null,
                                        operacionId = op.operacionId?.sanitizeId() ?: "",
                                        hora = op.hora?.sanitizeText() ?: "",
                                        anulada = op.anulada ?: false,
                                        productoId = op.productoId?.sanitizeId()
                                                        ?: java.util.UUID.randomUUID().toString(),
                                        nombreProducto = op.nombreProducto?.sanitizeText() ?: "",
                                        unidad = op.unidad?.sanitizeText() ?: "",
                                        cantidad = op.cantidad ?: 0.0,
                                        precioUnitario = op.precioUnitario ?: 0.0,
                                        total = op.total ?: 0.0,
                                        almacenId = op.almacenId?.sanitizeId() ?: Almacen.DEFAULT_ID
                                )
                            }
                                    ?: emptyList()

                    InventarioRegistro(
                            productos = emptyList(),
                            catalogoVentas = emptyList(),
                            catalogoCompras = emptyList(),
                            almacenes = emptyList(),
                            stock = emptyList(),
                            operaciones = operaciones,
                            productosVenta = productosVenta,
                            productosCompra = productosCompra
                    )
                }
                        ?: InventarioRegistro()

        return RegistroTCP(
                generales = generalesData,
                ingresos = ingresos,
                gastos = gastos,
                tributos = tributos,
                inventario = inventario
        )
    }

    private fun String.sanitizeText(): String {
        return this.trim().replace(Regex("[\\x00-\\x1F\\x7F]"), "").take(500)
    }

    private fun String.sanitizeId(): String {
        return this.trim().replace(Regex("[^a-zA-Z0-9\\-]"), "").take(100).ifBlank {
            java.util.UUID.randomUUID().toString()
        }
    }

    suspend fun replaceLocalWithRemote(
            registro: RegistroTCP,
            serverVersion: String
    ): Result<SyncResult> {
        return try {
            if (hasInventarioData(registro.inventario)) {
                inventarioRepository.fromInventarioRegistro(registro.inventario)
            }
            if (hasTercerosData(registro.terceros)) {
                tercerosRepository.fromTercerosRegistro(registro.terceros)
            }
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

    private fun cloudContainersEqual(
            local: CloudLedgerContainer,
            remote: CloudLedgerContainer
    ): Boolean {
        return gson.toJson(local) == gson.toJson(remote)
    }

    suspend fun uploadLocalToRemote(): Result<SyncResult> {
        return try {
            val token = authRepository.getToken() ?: return Result.failure(Exception("No token"))
            val container = buildCloudLedgerContainer()
            val updateResponse =
                    apiService.updateLedger(
                            "Bearer $token",
                            UpdateLedgerRequest(
                                    registro = gson.toJsonTree(container),
                                    inventarioRegistro = null
                            )
                    )
            if (!updateResponse.isSuccessful) {
                if (updateResponse.code() == 401 || updateResponse.code() == 403) {
                    authRepository.logout()
                    return Result.failure(Exception("Tu sesión expiró. Inicia sesión de nuevo."))
                }
                return Result.failure(Exception("Error al subir datos: ${updateResponse.code()}"))
            }

            val refreshedRemote = fetchRemote(token)
            val refreshedVersion = refreshedRemote.updatedAt.orEmpty()
            val containerFinal = buildRemoteContainer(refreshedRemote) ?: container

            applyCloudLedgerContainer(containerFinal, refreshedVersion).getOrThrow()

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
            val currentWorkspaceId = getCurrentWorkspaceId()
            val registroConInventario =
                    buildRegistroWithInventario()
                            .copy(
                                    generales = mergedRegistro.generales,
                                    ingresos = mergedRegistro.ingresos,
                                    gastos = mergedRegistro.gastos,
                                    tributos = mergedRegistro.tributos,
                                    inventario = mergedRegistro.inventario
                            )
            val container =
                    buildCloudLedgerContainer().let { existing ->
                        existing.copy(
                                workspaces =
                                        existing.workspaces.map { entry ->
                                            if (entry.id == currentWorkspaceId) {
                                                entry.copy(
                                                        name =
                                                                registroConInventario.generales
                                                                        .nombre.takeIf {
                                                                    it.isNotBlank()
                                                                }
                                                                        ?: entry.name,
                                                        registro = registroConInventario,
                                                        accounting = buildAccountingWorkspaceState()
                                                )
                                            } else {
                                                entry
                                            }
                                        }
                        )
                    }
            val updateResponse =
                    apiService.updateLedger(
                            "Bearer $token",
                            UpdateLedgerRequest(
                                    registro = gson.toJsonTree(container),
                                    inventarioRegistro = null
                            )
                    )
            if (!updateResponse.isSuccessful) {
                if (updateResponse.code() == 401 || updateResponse.code() == 403) {
                    authRepository.logout()
                    return Result.failure(Exception("Tu sesión expiró. Inicia sesión de nuevo."))
                }
                return Result.failure(Exception("Error al subir merge: ${updateResponse.code()}"))
            }

            val refreshedRemote = fetchRemote(token)
            val refreshedVersion = refreshedRemote.updatedAt.orEmpty()
            val containerFinal = buildRemoteContainer(refreshedRemote) ?: container

            applyCloudLedgerContainer(containerFinal, refreshedVersion).getOrThrow()

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

    suspend fun markLocalModified(modified: Boolean = true) {
        context.ledgerDataStore.edit { prefs ->
            prefs[LOCAL_MODIFIED_KEY] = if (modified) "true" else "false"
        }
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
        if (response.code() == 401 || response.code() == 403) {
            authRepository.logout()
            throw Exception("Tu sesión expiró. Inicia sesión de nuevo.")
        }
        if (!response.isSuccessful) {
            throw Exception("Error al obtener datos remotos: ${response.code()}")
        }
        return response.body() ?: ContLedgerResponse(registro = null, updatedAt = "")
    }

    suspend fun updateGenerales(data: GeneralesData) {
        val current = getRegistro()
        saveUserEditedRegistro(current.copy(generales = data))
    }

    suspend fun addIngreso(
            month: String,
            dia: Int,
            importe: Double,
            cuenta: String = "",
            nota: String = ""
    ) {
        addEntry("ingresos", month, dia, importe, cuenta, nota)
    }

    suspend fun addGasto(
            month: String,
            dia: Int,
            importe: Double,
            cuenta: String = "",
            nota: String = ""
    ) {
        addEntry("gastos", month, dia, importe, cuenta, nota)
    }

    suspend fun registrarOperacionRapida(
            month: String,
            dia: Int,
            ingreso: Double?,
            ingresoCuentaId: String = "",
            gasto: Double?,
            gastoCuentaId: String = "",
            nota: String = ""
    ) {
        val ingresoNormalizado = ingreso?.takeIf { it > 0.0 }
        val gastoNormalizado = gasto?.takeIf { it > 0.0 }
        if (ingresoNormalizado == null && gastoNormalizado == null) return

        val current = getRegistro()
        val ingresos = current.ingresos.toMutableMap()
        val gastos = current.gastos.toMutableMap()

        ingresoNormalizado?.let {
            val monthEntries = ingresos[month]?.toMutableList() ?: mutableListOf()
            val entryId = UUID.randomUUID().toString()
            monthEntries.add(
                    DayAmountRow(
                            id = entryId,
                            dia = dia.toString(),
                            importe = String.format(Locale.US, "%.2f", it)
                    )
            )
            ingresos[month] = monthEntries
            saveEntryMetadata(entryId, month, "ingresos", ingresoCuentaId, nota)
        }

        gastoNormalizado?.let {
            val monthEntries = gastos[month]?.toMutableList() ?: mutableListOf()
            val entryId = UUID.randomUUID().toString()
            monthEntries.add(
                    DayAmountRow(
                            id = entryId,
                            dia = dia.toString(),
                            importe = String.format(Locale.US, "%.2f", it)
                    )
            )
            gastos[month] = monthEntries
            saveEntryMetadata(entryId, month, "gastos", gastoCuentaId, nota)
        }

        saveRegistroAplicandoTributos(
                current.copy(
                        ingresos = ingresos.mapValues { (_, entries) ->
                            entries.sortedBy { row -> row.dia.toIntOrNull() ?: 0 }
                        },
                        gastos = gastos.mapValues { (_, entries) ->
                            entries.sortedBy { row -> row.dia.toIntOrNull() ?: 0 }
                        }
                )
        )
    }

    suspend fun deleteIngreso(month: String, dia: Int) {
        deleteEntry("ingresos", month, dia)
    }

    suspend fun deleteGasto(month: String, dia: Int) {
        deleteEntry("gastos", month, dia)
    }

    suspend fun deleteIngresoById(month: String, entryId: String) {
        deleteEntryById("ingresos", month, entryId)
    }

    suspend fun deleteGastoById(month: String, entryId: String) {
        deleteEntryById("gastos", month, entryId)
    }

    suspend fun updateIngreso(
            month: String,
            oldDia: Int,
            newDia: Int,
            importe: Double,
            cuenta: String = "",
            nota: String = ""
    ) {
        updateEntry("ingresos", month, oldDia, newDia, importe, cuenta, nota)
    }

    suspend fun updateGasto(
            month: String,
            oldDia: Int,
            newDia: Int,
            importe: Double,
            cuenta: String = "",
            nota: String = ""
    ) {
        updateEntry("gastos", month, oldDia, newDia, importe, cuenta, nota)
    }

    suspend fun updateIngresoById(
            entryId: String,
            month: String,
            newDia: Int,
            importe: Double,
            cuenta: String = "",
            nota: String = ""
    ) {
        updateEntryById("ingresos", entryId, month, newDia, importe, cuenta, nota)
    }

    suspend fun updateGastoById(
            entryId: String,
            month: String,
            newDia: Int,
            importe: Double,
            cuenta: String = "",
            nota: String = ""
    ) {
        updateEntryById("gastos", entryId, month, newDia, importe, cuenta, nota)
    }

    suspend fun registrarIngresoDesdePuntoVenta(fechaIso: String, total: Double) {
        val config = posIntegrationConfigDao.getById() ?: return
        if (!config.enabled || config.ingresoCuentaId.isNullOrBlank()) return
        registrarMovimientoIntegrado(
                type = "ingresos",
                fechaIso = fechaIso,
                importeDelta = total,
                cuentaId = config.ingresoCuentaId,
                nota = "Integración automática: ventas del punto de venta"
        )
    }

    suspend fun revertirIngresoDesdePuntoVenta(fechaIso: String, total: Double) {
        val config = posIntegrationConfigDao.getById() ?: return
        if (!config.enabled || config.ingresoCuentaId.isNullOrBlank()) return
        registrarMovimientoIntegrado(
                type = "ingresos",
                fechaIso = fechaIso,
                importeDelta = -total,
                cuentaId = config.ingresoCuentaId,
                nota = "Integración automática: ventas del punto de venta"
        )
    }

    suspend fun registrarGastoDesdePuntoVenta(fechaIso: String, total: Double) {
        val config = posIntegrationConfigDao.getById() ?: return
        if (!config.enabled || config.gastoCuentaId.isNullOrBlank()) return
        registrarMovimientoIntegrado(
                type = "gastos",
                fechaIso = fechaIso,
                importeDelta = total,
                cuentaId = config.gastoCuentaId,
                nota = "Integración automática: compras del punto de venta"
        )
    }

    suspend fun revertirGastoDesdePuntoVenta(fechaIso: String, total: Double) {
        val config = posIntegrationConfigDao.getById() ?: return
        if (!config.enabled || config.gastoCuentaId.isNullOrBlank()) return
        registrarMovimientoIntegrado(
                type = "gastos",
                fechaIso = fechaIso,
                importeDelta = -total,
                cuentaId = config.gastoCuentaId,
                nota = "Integración automática: compras del punto de venta"
        )
    }

    private suspend fun updateEntry(
            type: String,
            month: String,
            oldDia: Int,
            newDia: Int,
            importe: Double,
            cuenta: String = "",
            nota: String = ""
    ) {
        val current = getRegistro()
        val entries =
                when (type) {
                    "ingresos" -> current.ingresos.toMutableMap()
                    "gastos" -> current.gastos.toMutableMap()
                    else -> return
                }

        val monthEntries = entries[month]?.toMutableList() ?: mutableListOf()
        val previousEntry = monthEntries.firstOrNull { it.dia == oldDia.toString() }

        monthEntries.removeAll { it.dia == oldDia.toString() }

        if (newDia in 1..31 && importe > 0) {
            val entryId =
                    previousEntry?.id?.takeIf { it.isNotBlank() } ?: UUID.randomUUID().toString()
            monthEntries.add(
                // TODO: Hay que incluir aqui una funcion para indicar el año del registro
                    DayAmountRow(entryId, 2026, newDia.toString(), String.format("%.2f", importe))
            )
            saveEntryMetadata(entryId, month, type, cuenta, nota)
        } else {
            previousEntry?.id?.let { deleteEntryMetadata(it) }
        }

        entries[month] = monthEntries

        val updated =
                when (type) {
                    "ingresos" -> current.copy(ingresos = entries)
                    "gastos" -> current.copy(gastos = entries)
                    else -> current
                }
        saveRegistroAplicandoTributos(updated)
    }

    private suspend fun deleteEntry(type: String, month: String, dia: Int) {
        val current = getRegistro()
        val entries =
                when (type) {
                    "ingresos" -> current.ingresos.toMutableMap()
                    "gastos" -> current.gastos.toMutableMap()
                    else -> return
                }

        val monthEntries = entries[month]?.toMutableList() ?: mutableListOf()
        val idsEliminados = monthEntries.filter { it.dia == dia.toString() }.map { it.id }
        monthEntries.removeAll { it.dia == dia.toString() }
        idsEliminados.forEach { deleteEntryMetadata(it) }

        entries[month] = monthEntries

        val updated =
                when (type) {
                    "ingresos" -> current.copy(ingresos = entries)
                    "gastos" -> current.copy(gastos = entries)
                    else -> current
                }
        saveRegistroAplicandoTributos(updated)
    }

    private suspend fun deleteEntryById(type: String, month: String, entryId: String) {
        val current = getRegistro()
        val entries =
                when (type) {
                    "ingresos" -> current.ingresos.toMutableMap()
                    "gastos" -> current.gastos.toMutableMap()
                    else -> return
                }

        val monthEntries = entries[month]?.toMutableList() ?: mutableListOf()
        val removed = monthEntries.removeAll { it.id == entryId }
        if (!removed) return
        deleteEntryMetadata(entryId)

        entries[month] = monthEntries
        val updated =
                when (type) {
                    "ingresos" -> current.copy(ingresos = entries)
                    "gastos" -> current.copy(gastos = entries)
                    else -> current
                }
        saveRegistroAplicandoTributos(updated)
    }

    private suspend fun addEntry(
            type: String,
            month: String,
            dia: Int,
            importe: Double,
            cuenta: String = "",
            nota: String = ""
    ) {
        val current = getRegistro()
        val entries =
                when (type) {
                    "ingresos" -> current.ingresos.toMutableMap()
                    "gastos" -> current.gastos.toMutableMap()
                    else -> return
                }

        val monthEntries = entries[month]?.toMutableList() ?: mutableListOf()
        val entryId = UUID.randomUUID().toString()
        // TODO: Hay que incluir aqui una funcion para indicar el año del registro
        monthEntries.add(DayAmountRow(entryId, 2026, dia.toString(), String.format("%.2f", importe)))
        saveEntryMetadata(entryId, month, type, cuenta, nota)

        entries[month] = monthEntries

        val updated =
                when (type) {
                    "ingresos" -> current.copy(ingresos = entries)
                    "gastos" -> current.copy(gastos = entries)
                    else -> current
                }
        saveRegistroAplicandoTributos(updated)
    }

    private suspend fun updateEntryById(
            type: String,
            entryId: String,
            month: String,
            newDia: Int,
            importe: Double,
            cuenta: String = "",
            nota: String = ""
    ) {
        Log.e("SYSGD_EDIT", "updateEntryById llamado — type=$type, entryId='$entryId', month=$month")

        val current = getRegistro()
        val sourceEntries =
                when (type) {
                    "ingresos" -> current.ingresos.toMutableMap()
                    "gastos" -> current.gastos.toMutableMap()
                    else -> return
                }

        Log.e("SYSGD_EDIT", "IDs disponibles en $type: ${sourceEntries.values.flatten().map { it.id }}")

        val actualSourceMonth =
                sourceEntries.entries
                        .firstOrNull { entry -> entry.value.any { it.id == entryId } }
                        ?.key
                        ?: month

        val monthEntriesOrigen =
                sourceEntries[actualSourceMonth]?.toMutableList() ?: mutableListOf()
        val previousEntry = monthEntriesOrigen.firstOrNull { it.id == entryId } /*?:  return*/

        Log.e("SYSGD_EDIT", "previousEntry encontrado: $previousEntry")
    
    if (previousEntry == null) {
        Log.e("SYSGD_EDIT", "ERROR — entryId '$entryId' no encontrado en ningún mes")
        return
    }



        monthEntriesOrigen.removeAll { it.id == entryId }
        sourceEntries[actualSourceMonth] = monthEntriesOrigen

        if (newDia !in 1..31 || importe <= 0.0) {
            deleteEntryMetadata(entryId)
        } else {
            val monthEntriesDestino = sourceEntries[month]?.toMutableList() ?: mutableListOf()
            monthEntriesDestino.add(
                    previousEntry.copy(
                            dia = newDia.toString(),
                            importe = String.format("%.2f", importe)
                    )
            )
            sourceEntries[month] = monthEntriesDestino.sortedBy { it.dia.toIntOrNull() ?: 0 }
            saveEntryMetadata(entryId, month, type, cuenta, nota)
        }

        val updated =
                when (type) {
                    "ingresos" -> current.copy(ingresos = sourceEntries)
                    "gastos" -> current.copy(gastos = sourceEntries)
                    else -> current
                }
        saveRegistroAplicandoTributos(updated)
    }

    private suspend fun saveEntryMetadata(
            entryId: String,
            month: String,
            type: String,
            cuentaId: String,
            nota: String
    ) {
        val asientoTipo = if (type == "ingresos") TipoCuenta.INGRESO else TipoCuenta.GASTO
        val cuentaNormalizada = cuentaId.trim()
        val notaNormalizada = nota.trim()

        if (cuentaNormalizada.isBlank()) {
            ingresoGastoCuentaDao.deleteByEntryId(entryId)
        } else {
            ingresoGastoCuentaDao.insert(
                    IngresoGastoCuenta(
                            id = "cuenta_$entryId",
                            ingresoGastoId = entryId,
                            mes = month,
                            tipo = asientoTipo,
                            cuentaId = cuentaNormalizada
                    )
            )
        }

        if (notaNormalizada.isBlank()) {
            ingresoGastoNotaDao.deleteByEntryId(entryId)
        } else {
            ingresoGastoNotaDao.insert(
                    IngresoGastoNota(
                            id = "nota_$entryId",
                            ingresoGastoId = entryId,
                            mes = month,
                            tipo = asientoTipo,
                            nota = notaNormalizada
                    )
            )
        }
    }

    private suspend fun deleteEntryMetadata(entryId: String) {
        ingresoGastoCuentaDao.deleteByEntryId(entryId)
        ingresoGastoNotaDao.deleteByEntryId(entryId)
    }

    private suspend fun registrarMovimientoIntegrado(
            type: String,
            fechaIso: String,
            importeDelta: Double,
            cuentaId: String,
            nota: String
    ) {
        if (importeDelta == 0.0) return

        val fecha = LocalDate.parse(fechaIso)
        val month =
                LedgerConstants.MONTHS.getOrElse(fecha.monthValue - 1) {
                    LedgerConstants.MONTHS.first()
                }
        val dia = fecha.dayOfMonth.toString()
        val current = getRegistro()
        val entries =
                when (type) {
                    "ingresos" -> current.ingresos.toMutableMap()
                    "gastos" -> current.gastos.toMutableMap()
                    else -> return
                }
        val monthEntries = entries[month]?.toMutableList() ?: mutableListOf()
        val cuentas = ingresoGastoCuentaDao.getAll().associateBy { it.ingresoGastoId }
        val notas = ingresoGastoNotaDao.getAll().associateBy { it.ingresoGastoId }
        val entry =
                monthEntries.firstOrNull {
                    it.dia == dia &&
                            cuentas[it.id]?.cuentaId == cuentaId &&
                            notas[it.id]?.nota == nota
                }

        if (entry != null) {
            val nuevoImporte = parseCurrency(entry.importe) + importeDelta
            monthEntries.removeAll { it.id == entry.id }
            if (nuevoImporte > 0.0) {
                monthEntries.add(
                        entry.copy(importe = String.format(Locale.US, "%.2f", nuevoImporte))
                )
                saveEntryMetadata(entry.id, month, type, cuentaId, nota)
            } else {
                deleteEntryMetadata(entry.id)
            }
        } else if (importeDelta > 0.0) {
            val entryId = UUID.randomUUID().toString()
            monthEntries.add(
                    DayAmountRow(
                            id = entryId,
                            dia = dia,
                            importe = String.format(Locale.US, "%.2f", importeDelta)
                    )
            )
            saveEntryMetadata(entryId, month, type, cuentaId, nota)
        }

        entries[month] = monthEntries.sortedBy { it.dia.toIntOrNull() ?: 0 }
        val updated =
                when (type) {
                    "ingresos" -> current.copy(ingresos = entries)
                    "gastos" -> current.copy(gastos = entries)
                    else -> current
                }
        saveRegistroAplicandoTributos(updated)
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
        saveRegistroAplicandoTributos(current.copy(tributos = newTributos))
    }

    fun buildEditableTributos(
            registro: RegistroTCP,
            configs: List<TributoConfig>,
            relaciones: List<TributoCuentaBase>,
            cuentaPorAsientoId: Map<String, String>,
            month: String
    ): List<TributoEditable> {
        val row = tributoRowForMonth(registro, month)
        val cuentasPorTributo = relaciones.groupBy { it.tributoKey }
        return configs.sortedBy { it.orden }.map { config ->
            val monto = tributoValue(row, config.key)
            val baseImponible =
                    if (config.incluido && config.autocalcular) {
                        calculateBaseImponible(
                                registro = registro,
                                month = month,
                                cuentaIds =
                                        cuentasPorTributo[config.key]
                                                .orEmpty()
                                                .map { it.cuentaId }
                                                .toSet(),
                                cuentaPorAsientoId = cuentaPorAsientoId
                        )
                    } else {
                        0.0
                    }
            TributoEditable(
                    config = config,
                    selectedCuentaIds =
                            cuentasPorTributo[config.key].orEmpty().map { it.cuentaId }.toSet(),
                    monto = monto,
                    baseImponible = baseImponible
            )
        }
    }

    suspend fun pull(): Result<RegistroTCP> {
        return try {
            val token = authRepository.getToken() ?: return Result.failure(Exception("No token"))
            val remote = fetchRemote(token)
            val remoteContainer =
                    buildRemoteContainer(remote) ?: return Result.success(getRegistro())
            applyCloudLedgerContainer(remoteContainer, remote.updatedAt.orEmpty()).map {
                getRegistro()
            }
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
                return Result.success(
                        SyncResult(true, "Sincronización automática omitida", SyncAction.NO_CHANGES)
                )
            }

            val token = authRepository.getToken() ?: return Result.failure(Exception("No token"))
            val localContainer = buildCloudLedgerContainer()
            val remote = fetchRemote(token)
            val remoteContainer = buildRemoteContainer(remote)
            val result =
                    when {
                        remoteContainer != null -> {
                            applyCloudLedgerContainer(remoteContainer, remote.updatedAt.orEmpty())
                        }
                        localContainer.workspaces.isNotEmpty() || isLocalModified() -> {
                            uploadLocalToRemote()
                        }
                        else -> {
                            Result.success(
                                    SyncResult(
                                            true,
                                            "No hay datos para sincronizar",
                                            SyncAction.NO_CHANGES
                                    )
                            )
                        }
                    }

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
            val localContainer = buildCloudLedgerContainer()
            val localModified = isLocalModified()
            val hasBaseline = hasBaselineVersion()
            val hasLocalData = hasLocalSnapshot()
            val baselineVersion = getLastDownloadedVersion()
            val baselineInventario = getBaselineInventario()
            val remote = fetchRemote(token)
            val remoteRegistro = buildRemoteRegistro(remote)
            val remoteContainer = buildRemoteContainer(remote)
            val remoteVersion = remote.updatedAt.orEmpty()
            val localEmpty = isRegistroEffectivelyEmpty(localRegistro)
            val serverChanged = hasBaseline && remoteVersion != baselineVersion
            val remoteInventario = remoteRegistro?.inventario ?: InventarioRegistro()
            val inventarioConflict =
                    hasBaseline &&
                            remoteRegistro != null &&
                            hasInventarioConflicts(
                                    localRegistro.inventario,
                                    remoteInventario,
                                    baselineInventario
                            )

            when {
                remoteContainer == null && !localModified -> {
                    Result.success(
                            SyncResult(true, "No hay datos para sincronizar", SyncAction.NO_CHANGES)
                    )
                }
                remoteContainer == null && localModified -> {
                    Result.success(
                            SyncResult(
                                    success = true,
                                    message =
                                            "No hay datos en la nube. ¿Deseas subir tus cambios locales?",
                                    action = SyncAction.PUSH_ONLY,
                                    needsUserDecision = true
                            )
                    )
                }
                remoteContainer != null && !localModified && !hasBaseline && localEmpty -> {
                    applyCloudLedgerContainer(remoteContainer, remoteVersion)
                }
                !localModified && (!hasBaseline || !hasLocalData || serverChanged) -> {
                    Result.success(
                            SyncResult(
                                    success = true,
                                    message =
                                            "Se encontraron cambios en la nube. ¿Deseas actualizar tus datos locales?",
                                    action = SyncAction.PULL_ONLY,
                                    needsUserDecision = true,
                                    remoteRegistro =
                                            remoteContainer?.workspaces
                                                    ?.firstOrNull {
                                                        it.id == remoteContainer.activeWorkspaceId
                                                    }
                                                    ?.registro
                                                    ?: remoteRegistro,
                                    remoteVersion = remoteVersion
                            )
                    )
                }
                !localModified && hasBaseline && !serverChanged -> {
                    Result.success(
                            SyncResult(
                                    true,
                                    "Ya estás sincronizado con la nube",
                                    SyncAction.NO_CHANGES
                            )
                    )
                }
                localModified && !hasBaseline && remoteContainer != null -> {
                    Result.success(
                            SyncResult(
                                    success = true,
                                    message =
                                            "Ya existen datos en nube y también cambios locales. Para múltiples negocios, elige usar nube o teléfono.",
                                    action = SyncAction.CONFLICT_DETECTED,
                                    conflictInfo =
                                            ConflictInfo(
                                                    hasConflict = true,
                                                    conflictMessage =
                                                            "Conflicto entre contenedores de negocios",
                                                    mergePossible = false
                                            ),
                                    needsUserDecision = true,
                                    remoteRegistro =
                                            remoteContainer.workspaces
                                                    .firstOrNull {
                                                        it.id == remoteContainer.activeWorkspaceId
                                                    }
                                                    ?.registro,
                                    remoteVersion = remoteVersion
                            )
                    )
                }
                localModified && hasBaseline && !serverChanged -> {
                    Result.success(
                            SyncResult(
                                    success = true,
                                    message =
                                            "Tus cambios locales están listos. ¿Deseas subirlos a la nube?",
                                    action = SyncAction.PUSH_ONLY,
                                    needsUserDecision = true
                            )
                    )
                }
                localModified && serverChanged -> {
                    val identicalContainers =
                            remoteContainer?.let { cloudContainersEqual(localContainer, it) } ==
                                    true
                    if (identicalContainers) {
                        Result.success(
                                SyncResult(
                                        true,
                                        "Ya estás sincronizado con la nube",
                                        SyncAction.NO_CHANGES
                                )
                        )
                    } else {
                        Result.success(
                                SyncResult(
                                        success = true,
                                        message =
                                                "Hay cambios en nube y teléfono. Con múltiples negocios, debes elegir usar nube o teléfono.",
                                        action = SyncAction.CONFLICT_DETECTED,
                                        conflictInfo =
                                                ConflictInfo(
                                                        hasConflict = true,
                                                        conflictMessage =
                                                                "Conflicto entre contenedores de negocios",
                                                        mergePossible = false
                                                ),
                                        needsUserDecision = true,
                                        remoteRegistro =
                                                remoteContainer?.workspaces
                                                        ?.firstOrNull {
                                                            it.id ==
                                                                    remoteContainer
                                                                            .activeWorkspaceId
                                                        }
                                                        ?.registro
                                                        ?: remoteRegistro,
                                        remoteVersion = remoteVersion
                                )
                        )
                    }
                }
                else -> Result.success(SyncResult(true, "Sin cambios", SyncAction.NO_CHANGES))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resolveWithRemote(
            remoteRegistro: RegistroTCP,
            remoteVersion: String
    ): Result<SyncResult> {
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
                if (remoteEntry != null &&
                                normalizeAmount(remoteEntry.importe) !=
                                        normalizeAmount(localEntry.importe)
                ) {
                    conflicts.add(
                            "Ingreso día ${localEntry.dia}/$month: local=${localEntry.importe}, remoto=${remoteEntry.importe}"
                    )
                }
            }
        }

        LedgerConstants.MONTHS.forEach { month ->
            val localGastos = local.gastos[month] ?: emptyList()
            val remoteGastos = remote.gastos[month] ?: emptyList()

            localGastos.forEach { localEntry ->
                val remoteEntry = remoteGastos.find { it.dia == localEntry.dia }
                if (remoteEntry != null &&
                                normalizeAmount(remoteEntry.importe) !=
                                        normalizeAmount(localEntry.importe)
                ) {
                    conflicts.add(
                            "Gasto día ${localEntry.dia}/$month: local=${localEntry.importe}, remoto=${remoteEntry.importe}"
                    )
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

        val mergedGenerales =
                if (remote.generales.nombre.isNotEmpty()) remote.generales else local.generales

        val remoteInventarioChanged = !inventoriesEqual(remote.inventario, baselineInventario)
        val localInventarioChanged = !inventoriesEqual(local.inventario, baselineInventario)
        val mergedInventario =
                when {
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
            val allDays =
                    (localEntries.map { it.dia.toIntOrNull() ?: 0 } +
                                    remoteEntries.map { it.dia.toIntOrNull() ?: 0 })
                            .toSet()

            val mergedEntries =
                    allDays
                            .mapNotNull { dia ->
                                val localEntry = localEntries.find { it.dia.toIntOrNull() == dia }
                                val remoteEntry = remoteEntries.find { it.dia.toIntOrNull() == dia }

                                when {
                                    remoteEntry != null ->
                                            remoteEntry.copy(
                                                    importe = normalizeAmount(remoteEntry.importe)
                                            )
                                    localEntry != null ->
                                            localEntry.copy(
                                                    importe = normalizeAmount(localEntry.importe)
                                            )
                                    else -> null
                                }
                            }
                            .sortedBy { it.dia }

            merged[month] = mergedEntries
        }

        return merged
    }

    private fun normalizeAmount(value: String): String {
        val number = value.toDoubleOrNull() ?: 0.0
        return String.format(Locale.US, "%.2f", number)
    }

    private suspend fun applyAutoCalculatedTributos(registro: RegistroTCP): RegistroTCP {
        val configs = tributoConfigDao.getAll().ifEmpty { TributoConfigsPorDefecto.entidades() }
        val relaciones = tributoCuentaBaseDao.getAll()
        val relacionesPorTributo = relaciones.groupBy { it.tributoKey }
        val cuentaPorAsientoId =
                ingresoGastoCuentaDao.getAll().associate { it.ingresoGastoId to it.cuentaId }
        val tributosActualizados =
                LedgerConstants.MONTHS.mapIndexed { index, month ->
                    val actual =
                            registro.tributos.getOrNull(index)
                                    ?: TributoRow(mes = LedgerConstants.monthLabels[month] ?: month)
                    val base =
                            if (actual.mes.isBlank()) {
                                actual.copy(mes = LedgerConstants.monthLabels[month] ?: month)
                            } else {
                                actual
                            }
                    configs.fold(base) { row, config ->
                        val seleccionado =
                                relacionesPorTributo[config.key]
                                        .orEmpty()
                                        .map { it.cuentaId }
                                        .toSet()
                        when {
                            !config.incluido -> updateTributoValue(row, config.key, "")
                            config.autocalcular -> {
                                val baseImponible =
                                        calculateBaseImponible(
                                                registro,
                                                month,
                                                seleccionado,
                                                cuentaPorAsientoId
                                        )
                                val monto =
                                        if (baseImponible > 0.0 && config.porcentaje > 0.0) {
                                            String.format(
                                                    Locale.US,
                                                    "%.2f",
                                                    round2(
                                                            baseImponible * config.porcentaje /
                                                                    100.0
                                                    )
                                            )
                                        } else {
                                            ""
                                        }
                                updateTributoValue(row, config.key, monto)
                            }
                            else -> row
                        }
                    }
                }
        return registro.copy(tributos = tributosActualizados)
    }

    private fun tributoRowForMonth(registro: RegistroTCP, month: String): TributoRow {
        val index = LedgerConstants.MONTHS.indexOf(month)
        return if (index in registro.tributos.indices) {
            registro.tributos[index]
        } else {
            TributoRow(mes = LedgerConstants.monthLabels[month] ?: month)
        }
    }

    private fun tributoValue(row: TributoRow, key: String): String =
            when (key) {
                TributoKeys.VENTAS -> row.ventas
                TributoKeys.FUERZA -> row.fuerza
                TributoKeys.SELLOS -> row.sellos
                TributoKeys.ANUNCIOS -> row.anuncios
                TributoKeys.CSS20 -> row.css20
                TributoKeys.CSS14 -> row.css14
                TributoKeys.CSS_SUBSIDIO -> row.cssSubsidio
                TributoKeys.OTROS -> row.otros
                TributoKeys.RESTAURACION -> row.restauracion
                TributoKeys.ARRENDAMIENTO -> row.arrendamiento
                TributoKeys.EXONERADO -> row.exonerado
                TributoKeys.OTROS_MFP -> row.otrosMFP
                TributoKeys.CUOTA_MENSUAL -> row.cuotaMensual
                else -> ""
            }

    private fun updateTributoValue(row: TributoRow, key: String, value: String): TributoRow =
            when (key) {
                TributoKeys.VENTAS -> row.copy(ventas = value)
                TributoKeys.FUERZA -> row.copy(fuerza = value)
                TributoKeys.SELLOS -> row.copy(sellos = value)
                TributoKeys.ANUNCIOS -> row.copy(anuncios = value)
                TributoKeys.CSS20 -> row.copy(css20 = value)
                TributoKeys.CSS14 -> row.copy(css14 = value)
                TributoKeys.CSS_SUBSIDIO -> row.copy(cssSubsidio = value)
                TributoKeys.OTROS -> row.copy(otros = value)
                TributoKeys.RESTAURACION -> row.copy(restauracion = value)
                TributoKeys.ARRENDAMIENTO -> row.copy(arrendamiento = value)
                TributoKeys.EXONERADO -> row.copy(exonerado = value)
                TributoKeys.OTROS_MFP -> row.copy(otrosMFP = value)
                TributoKeys.CUOTA_MENSUAL -> row.copy(cuotaMensual = value)
                else -> row
            }

    private fun calculateBaseImponible(
            registro: RegistroTCP,
            month: String,
            cuentaIds: Set<String>,
            cuentaPorAsientoId: Map<String, String>
    ): Double {
        if (cuentaIds.isEmpty()) return 0.0
        val ingresos = registro.ingresos[month].orEmpty()
        val gastos = registro.gastos[month].orEmpty()
        val total =
                ingresos.sumOf { row ->
                    val cuentaId = cuentaPorAsientoId[row.id]
                    if (cuentaId in cuentaIds) parseCurrency(row.importe) else 0.0
                } +
                        gastos.sumOf { row ->
                            val cuentaId = cuentaPorAsientoId[row.id]
                            if (cuentaId in cuentaIds) parseCurrency(row.importe) else 0.0
                        }
        return round2(total)
    }

    private fun computeAccountBalances(
            registro: RegistroTCP,
            cuentas: List<CuentaContable>,
            links: List<IngresoGastoCuenta>
    ): Map<String, Double> {
        val cuentasPorId = cuentas.associateBy { it.id }
        val linksPorEntry = links.associateBy { it.ingresoGastoId }
        val acumulado = mutableMapOf<String, Double>()

        fun acumular(rows: Collection<List<DayAmountRow>>, tipoMovimiento: String) {
            rows.flatten().forEach { row ->
                val link = linksPorEntry[row.id] ?: return@forEach
                val cuenta = cuentasPorId[link.cuentaId] ?: return@forEach
                val importe = parseCurrency(row.importe)
                val signo =
                        when {
                            cuenta.naturaleza == NaturalezaCuenta.ACREEDORA &&
                                    tipoMovimiento == TipoCuenta.INGRESO -> 1.0
                            cuenta.naturaleza == NaturalezaCuenta.ACREEDORA &&
                                    tipoMovimiento == TipoCuenta.GASTO -> -1.0
                            cuenta.naturaleza == NaturalezaCuenta.DEUDORA &&
                                    tipoMovimiento == TipoCuenta.GASTO -> 1.0
                            cuenta.naturaleza == NaturalezaCuenta.DEUDORA &&
                                    tipoMovimiento == TipoCuenta.INGRESO -> -1.0
                            cuenta.naturaleza == NaturalezaCuenta.MIXTA &&
                                    tipoMovimiento == TipoCuenta.INGRESO -> 1.0
                            cuenta.naturaleza == NaturalezaCuenta.MIXTA &&
                                    tipoMovimiento == TipoCuenta.GASTO -> -1.0
                            else -> 1.0
                        }
                acumulado[cuenta.id] = round2((acumulado[cuenta.id] ?: 0.0) + importe * signo)
            }
        }

        acumular(registro.ingresos.values, TipoCuenta.INGRESO)
        acumular(registro.gastos.values, TipoCuenta.GASTO)

        val hijosPorPadre = cuentas.filter { !it.padreId.isNullOrBlank() }.groupBy { it.padreId!! }

        fun totalCuenta(cuentaId: String, visitados: MutableSet<String> = mutableSetOf()): Double {
            if (!visitados.add(cuentaId)) return acumulado[cuentaId] ?: 0.0
            val propio = acumulado[cuentaId] ?: 0.0
            val hijos =
                    hijosPorPadre[cuentaId].orEmpty().sumOf { hijo ->
                        totalCuenta(hijo.id, visitados.toMutableSet())
                    }
            return round2(propio + hijos)
        }

        return cuentas.associate { cuenta -> cuenta.id to totalCuenta(cuenta.id) }
    }

    fun calculateAnnualReport(registro: RegistroTCP): AnnualReport {
        val monthly =
                LedgerConstants.MONTHS.map { month ->
                    val ingresos = monthTotal(registro.ingresos[month] ?: emptyList())
                    val gastos = monthTotal(registro.gastos[month] ?: emptyList())
                    val tribIndex = LedgerConstants.MONTHS.indexOf(month)
                    val tributos =
                            if (tribIndex < registro.tributos.size) {
                                tributosSubtotal(registro.tributos[tribIndex])
                            } else 0.0
                    val otros =
                            if (tribIndex < registro.tributos.size) {
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
        val keys = listOf("ventas", "fuerza", "sellos", "anuncios", "css20", "css14" , "cssSubsidio", "otros")
        return round2(
                keys.sumOf { key ->
                    when (key) {
                        "ventas" -> item.ventas.toDoubleOrNull() ?: 0.0
                        "fuerza" -> item.fuerza.toDoubleOrNull() ?: 0.0
                        "sellos" -> item.sellos.toDoubleOrNull() ?: 0.0
                        "anuncios" -> item.anuncios.toDoubleOrNull() ?: 0.0
                        "css20" -> item.css20.toDoubleOrNull() ?: 0.0
                        "css14" -> item.css14.toDoubleOrNull() ?: 0.0
                        "cssSubsidio" -> item.cssSubsidio.toDoubleOrNull() ?: 0.0
                        "otros" -> item.otros.toDoubleOrNull() ?: 0.0
                        else -> 0.0
                    }
                }
        )
    }

    private fun otrosDeduciblesSubtotal(item: TributoRow): Double {
        return round2(
                (item.restauracion.toDoubleOrNull()
                        ?: 0.0) +
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
        val baseYear =
                source.generales.anio.takeIf { it >= 2020 }
                        ?: java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
        val base = emptyRegistro().copy(generales = emptyRegistro(baseYear).generales)
        fun safeText(block: () -> Any?, default: String = ""): String =
                runCatching { block()?.toString() }.getOrNull()?.trim()?.takeIf { it.isNotBlank() }
                        ?: default

        val generales =
                source.generales.copy(
                        anio = baseYear,
                        nombre = safeText({ source.generales.nombre }, base.generales.nombre),
                        nit = safeText({ source.generales.nit }, base.generales.nit),
                        actividad =
                                safeText({ source.generales.actividad }, base.generales.actividad),
                        codigo = safeText({ source.generales.codigo }, base.generales.codigo),
                        fiscalCalle =
                                safeText(
                                        { source.generales.fiscalCalle },
                                        base.generales.fiscalCalle
                                ),
                        fiscalMunicipio =
                                safeText(
                                        { source.generales.fiscalMunicipio },
                                        base.generales.fiscalMunicipio
                                ),
                        fiscalProvincia =
                                safeText(
                                        { source.generales.fiscalProvincia },
                                        base.generales.fiscalProvincia
                                ),
                        legalCalle =
                                safeText(
                                        { source.generales.legalCalle },
                                        base.generales.legalCalle
                                ),
                        legalMunicipio =
                                safeText(
                                        { source.generales.legalMunicipio },
                                        base.generales.legalMunicipio
                                ),
                        legalProvincia =
                                safeText(
                                        { source.generales.legalProvincia },
                                        base.generales.legalProvincia
                                )
                )

        val ingresos =
                LedgerConstants.MONTHS.associateWith { month ->
                    normalizeMonthRows(source.ingresos[month])
                }
        val gastos =
                LedgerConstants.MONTHS.associateWith { month ->
                    normalizeMonthRows(source.gastos[month])
                }
        val tributos =
                LedgerConstants.MONTHS.mapIndexed { index, month ->
                    val row = source.tributos.getOrNull(index)
                    TributoRow(
                            mes = LedgerConstants.monthLabels[month] ?: month,
                            ventas = row?.ventas.orEmpty(),
                            fuerza = row?.fuerza.orEmpty(),
                            sellos = row?.sellos.orEmpty(),
                            anuncios = row?.anuncios.orEmpty(),
                            css20 = row?.css20.orEmpty(),
                            css14 = row?.css14.orEmpty(),
                            cssSubsidio = row?.cssSubsidio.orEmpty(),
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
                inventario = normalizeImportedInventario(source.inventario),
                terceros = source.terceros
        )
    }

    private fun normalizeImportedInventario(source: InventarioRegistro): InventarioRegistro {
        fun fallbackId(value: String): String =
                value.ifBlank { java.util.UUID.randomUUID().toString() }

        fun safeString(block: () -> Any?, default: String = ""): String =
                runCatching { block()?.toString() }.getOrNull()?.trim()?.takeIf { it.isNotBlank() }
                        ?: default

        fun safeDouble(block: () -> Any?, default: Double = 0.0): Double =
                runCatching {
                            when (val value = block()) {
                                is Number -> value.toDouble()
                                is String -> value.replace(',', '.').toDoubleOrNull() ?: default
                                else -> default
                            }
                        }
                        .getOrDefault(default)

        fun safeNullableDouble(block: () -> Any?): Double? =
                runCatching {
                            when (val value = block()) {
                                null -> null
                                is Number -> value.toDouble()
                                is String -> value.replace(',', '.').toDoubleOrNull()
                                else -> null
                            }
                        }
                        .getOrNull()

        fun safeBoolean(block: () -> Any?, default: Boolean = false): Boolean =
                runCatching {
                            when (val value = block()) {
                                is Boolean -> value
                                is String -> value.equals("true", ignoreCase = true)
                                else -> default
                            }
                        }
                        .getOrDefault(default)

        fun safeLong(block: () -> Any?, default: Long = 0L): Long =
                runCatching {
                            when (val value = block()) {
                                null -> default
                                is Long -> value
                                is Number -> value.toLong()
                                is String -> value.toLongOrNull() ?: default
                                else -> default
                            }
                        }
                        .getOrDefault(default)

        return InventarioRegistro(
                productos =
                        source.productos.map { producto ->
                            ProductoInventario(
                                    id = fallbackId(safeString({ producto.id })),
                                    nombre = safeString({ producto.nombre }, "Producto"),
                                    unidad = safeString({ producto.unidad }, "und"),
                                    descripcion = safeString({ producto.descripcion }),
                                    emoji = safeString({ producto.emoji }, "📦"),
                                    precio = safeDouble({ producto.precio }),
                                    tipo = safeString({ producto.tipo })
                            )
                        },
                catalogoVentas =
                        source.catalogoVentas.map { catalogo ->
                            CatalogoVentaRegistro(
                                    id = fallbackId(safeString({ catalogo.id })),
                                    productoId = fallbackId(safeString({ catalogo.productoId })),
                                    precioReferencia = safeDouble({ catalogo.precioReferencia }),
                                    almacenId =
                                            safeString({ catalogo.almacenId }, Almacen.DEFAULT_ID),
                                    activo = safeBoolean({ catalogo.activo }, true)
                            )
                        },
                catalogoCompras =
                        source.catalogoCompras.map { catalogo ->
                            CatalogoCompraRegistro(
                                    id = fallbackId(safeString({ catalogo.id })),
                                    productoId = fallbackId(safeString({ catalogo.productoId })),
                                    precioReferencia = safeDouble({ catalogo.precioReferencia }),
                                    almacenDestinoId =
                                            safeString(
                                                    { catalogo.almacenDestinoId },
                                                    Almacen.DEFAULT_ID
                                            ),
                                    activo = safeBoolean({ catalogo.activo }, true)
                            )
                        },
                historialPrecios =
                        source.historialPrecios.map { precio ->
                            PrecioProductoRegistro(
                                    id = fallbackId(safeString({ precio.id })),
                                    productoId = fallbackId(safeString({ precio.productoId })),
                                    tipoPrecio = safeString({ precio.tipoPrecio }),
                                    precio = safeDouble({ precio.precio }),
                                    moneda = safeString({ precio.moneda }, "CUP"),
                                    fechaDesde = safeString({ precio.fechaDesde }),
                                    fechaHasta = runCatching { precio.fechaHasta?.trim() }.getOrNull()?.takeIf { it.isNotBlank() },
                                    activo = safeBoolean({ precio.activo }, true),
                                    createdAt = safeLong({ precio.createdAt }),
                                    almacenId = safeString({ precio.almacenId }, Almacen.DEFAULT_ID)
                            )
                        },
                almacenes =
                        source.almacenes.map { almacen ->
                            AlmacenRegistro(
                                    id = fallbackId(safeString({ almacen.id })),
                                    nombre = safeString({ almacen.nombre }, "Almacén principal"),
                                    principal = safeBoolean({ almacen.principal })
                            )
                        },
                stock =
                        source.stock.map { stock ->
                            StockRegistro(
                                    id = fallbackId(safeString({ stock.id })),
                                    productoId = fallbackId(safeString({ stock.productoId })),
                                    almacenId = safeString({ stock.almacenId }, Almacen.DEFAULT_ID),
                                    stockDisponible = safeDouble({ stock.stockDisponible }),
                                    modoStock =
                                            safeString(
                                                    { stock.modoStock },
                                                    ModoStock.ILIMITADO.name
                                            ),
                                    productosVinculadosIds =
                                            safeString({ stock.productosVinculadosIds }, "[]"),
                                    ratiosConversion = safeString({ stock.ratiosConversion }, "[]"),
                                    ultimaActualizacion = safeString({ stock.ultimaActualizacion }),
                                    visibleEnVentas = safeBoolean({ stock.visibleEnVentas })
                            )
                        },
                movimientos =
                        source.movimientos.map { movimiento ->
                            MovimientoInventarioRegistro(
                                    id = fallbackId(safeString({ movimiento.id })),
                                    tipoMovimiento = safeString({ movimiento.tipoMovimiento }),
                                    fecha = safeString({ movimiento.fecha }),
                                    hora = safeString({ movimiento.hora }),
                                    productoId = fallbackId(safeString({ movimiento.productoId })),
                                    cantidad = safeDouble({ movimiento.cantidad }),
                                    almacenOrigenId =
                                            runCatching { movimiento.almacenOrigenId?.trim() }
                                                    .getOrNull()
                                                    ?.takeIf { it.isNotBlank() },
                                    almacenDestinoId =
                                            runCatching { movimiento.almacenDestinoId?.trim() }
                                                    .getOrNull()
                                                    ?.takeIf { it.isNotBlank() },
                                    stockOrigenAntes = safeNullableDouble { movimiento.stockOrigenAntes },
                                    stockOrigenDespues = safeNullableDouble { movimiento.stockOrigenDespues },
                                    stockDestinoAntes = safeNullableDouble { movimiento.stockDestinoAntes },
                                    stockDestinoDespues = safeNullableDouble { movimiento.stockDestinoDespues },
                                    referenciaId = safeString({ movimiento.referenciaId }),
                                    nota = safeString({ movimiento.nota })
                            )
                        },
                operaciones =
                        source.operaciones.map { operacion ->
                            OperacionInventario(
                                    id = fallbackId(safeString({ operacion.id })),
                                    tipo = safeString({ operacion.tipo }),
                                    fecha = safeString({ operacion.fecha }),
                                    operacionId = safeString({ operacion.operacionId }),
                                    hora = safeString({ operacion.hora }),
                                    anulada = safeBoolean({ operacion.anulada }),
                                    productoId = fallbackId(safeString({ operacion.productoId })),
                                    nombreProducto =
                                            safeString({ operacion.nombreProducto }, "Producto"),
                                    unidad = safeString({ operacion.unidad }),
                                    cantidad = safeDouble({ operacion.cantidad }),
                                    precioUnitario = safeDouble({ operacion.precioUnitario }),
                                    total = safeDouble({ operacion.total }),
                                    almacenId =
                                            safeString({ operacion.almacenId }, Almacen.DEFAULT_ID)
                            )
                        },
                productosVenta =
                        source.productosVenta.map { producto ->
                            ProductoInventario(
                                    id = fallbackId(safeString({ producto.id })),
                                    nombre = safeString({ producto.nombre }, "Producto"),
                                    unidad = safeString({ producto.unidad }, "und"),
                                    descripcion = safeString({ producto.descripcion }),
                                    emoji = safeString({ producto.emoji }, "📦"),
                                    precio = safeDouble({ producto.precio }),
                                    tipo = safeString({ producto.tipo }, "venta")
                            )
                        },
                productosCompra =
                        source.productosCompra.map { producto ->
                            ProductoInventario(
                                    id = fallbackId(safeString({ producto.id })),
                                    nombre = safeString({ producto.nombre }, "Producto"),
                                    unidad = safeString({ producto.unidad }, "und"),
                                    descripcion = safeString({ producto.descripcion }),
                                    emoji = safeString({ producto.emoji }, "📦"),
                                    precio = safeDouble({ producto.precio }),
                                    tipo = safeString({ producto.tipo }, "compra")
                            )
                        }
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
                    DayAmountRow(
                            id = row.id.ifBlank { UUID.randomUUID().toString() },
                            dia = dia.toString(),
                            importe = String.format("%.2f", importe)
                    )
                    // DayAmountRow(dia = dia.toString(), importe = String.format(Locale.US, "%.2f",importe))
                }
                .take(36)
    }

    private fun emptyRegistro(
            year: Int = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
    ): RegistroTCP {
        val emptyMonthEntries = LedgerConstants.MONTHS.associateWith { emptyList<DayAmountRow>() }
        val emptyTributos =
                LedgerConstants.MONTHS.map { month ->
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
                val token =
                        authRepository.getToken()
                                ?: return@withContext Result.failure(Exception("No token"))
                val registro = getRegistro()

                val pdfPayload =
                        TcpPdfPayload(
                                generalData =
                                        PdfGeneralData(
                                                anio = registro.generales.anio.toString(),
                                                nombre = registro.generales.nombre,
                                                nit = registro.generales.nit,
                                                fiscalCalle = registro.generales.fiscalCalle,
                                                fiscalMunicipio =
                                                        registro.generales.fiscalMunicipio,
                                                fiscalProvincia =
                                                        registro.generales.fiscalProvincia,
                                                legalCalle = registro.generales.legalCalle,
                                                legalMunicipio = registro.generales.legalMunicipio,
                                                legalProvincia = registro.generales.legalProvincia,
                                                actividad = registro.generales.actividad,
                                                codigo = registro.generales.codigo
                                        ),
                                ingresos = registro.ingresos,
                                gastos = registro.gastos,
                                tributos =
                                        registro.tributos.map { row ->
                                            TributoPdfRow(
                                                    mes = row.mes,
                                                    b = row.ventas,
                                                    c = row.fuerza,
                                                    d = row.sellos,
                                                    e = row.anuncios,
                                                    f = row.css20,
                                                    h = row.css14,
                                                    i = row.cssSubsidio,
                                                    j = row.otros,
                                                    l = row.restauracion,
                                                    m = row.arrendamiento,
                                                    n = row.exonerado,
                                                    o = row.otrosMFP,
                                                    p = row.cuotaMensual
                                            )
                                        }
                        )

                val response = apiService.downloadPdf("Bearer $token", pdfPayload)

                if (response.code() == 502) {
                    onRetryMessage("Servidor dormido. Reintentando en 15 segundos...")
                    delay(15000)
                    val retryResponse = apiService.downloadPdf("Bearer $token", pdfPayload)
                    if (retryResponse.code() == 401 || retryResponse.code() == 403) {
                        authRepository.logout()
                        return@withContext Result.failure(
                                Exception("Tu sesión expiró. Inicia sesión de nuevo.")
                        )
                    }
                    if (!retryResponse.isSuccessful) {
                        return@withContext Result.failure(buildPdfError(retryResponse))
                    }
                    processPdfResponse(retryResponse)
                } else if (response.code() == 401 || response.code() == 403) {
                    authRepository.logout()
                    return@withContext Result.failure(
                            Exception("Tu sesión expiró. Inicia sesión de nuevo.")
                    )
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
                val pdfPayload =
                        TcpPdfPayload(
                                generalData =
                                        PdfGeneralData(
                                                anio = registro.generales.anio.toString(),
                                                nombre = registro.generales.nombre,
                                                nit = registro.generales.nit,
                                                fiscalCalle = registro.generales.fiscalCalle,
                                                fiscalMunicipio =
                                                        registro.generales.fiscalMunicipio,
                                                fiscalProvincia =
                                                        registro.generales.fiscalProvincia,
                                                legalCalle = registro.generales.legalCalle,
                                                legalMunicipio = registro.generales.legalMunicipio,
                                                legalProvincia = registro.generales.legalProvincia,
                                                actividad = registro.generales.actividad,
                                                codigo = registro.generales.codigo
                                        ),
                                ingresos = registro.ingresos,
                                gastos = registro.gastos,
                                tributos =
                                        registro.tributos.map { row ->
                                            TributoPdfRow(
                                                    mes = row.mes,
                                                    b = row.ventas,
                                                    c = row.fuerza,
                                                    d = row.sellos,
                                                    e = row.anuncios,
                                                    f = row.css20,
                                                    h = row.css14,
                                                    i = row.cssSubsidio,
                                                    j = row.otros,
                                                    l = row.restauracion,
                                                    m = row.arrendamiento,
                                                    n = row.exonerado,
                                                    o = row.otrosMFP,
                                                    p = row.cuotaMensual
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

    /**
     * Genera un informe mensual de ingresos y gastos (Estado de Resultados)
     * Estructura del informe:
     * - Título: Informe Mensual - [Mes/Año]
     * - Tabla INGRESOS: Fecha | Cuenta | Detalle (nota) | Importe
     * - Total INGRESOS (verde)
     * - Tabla GASTOS: Fecha | Cuenta | Detalle (nota) | Importe
     * - Total GASTOS (rojo)
     * - ESTADO DE RESULTADOS: Diferencia (Ingresos - Gastos)
     */
    suspend fun generateMonthlyReportPdf(month: String): Result<Intent> {
        return withContext(Dispatchers.IO) {
            try {
                val file = createMonthlyReportFile(month)
                buildPdfIntent(file)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }

    private fun createMonthlyReportFile(month: String): File {
        // TODO: Implementar generación de PDF con iTextPDF
        // 1. Obtener registro actual
        // 2. Filtrar ingresos y gastos del mes seleccionado
        // 3. Obtener cuentas contables y notas para cada operación
        // 4. Generar tabla con iTextPDF (colores: verde para ingresos, rojo para gastos)
        // 5. Calcular totales y diferencia
        val fileName = "Informe_Mensual_${month}_${System.currentTimeMillis()}.pdf"
        return documentStorageRepository.createDocumentFile(DocumentCategory.DJ, fileName)
    }

    private suspend fun processPdfResponse(response: Response<ResponseBody>): Result<Intent> {
        return withContext(Dispatchers.IO) {
            val body = response.body()
            if (body == null) {
                return@withContext Result.failure(Exception("Respuesta vacía del servidor"))
            }

            val registro = getRegistro()
            val fileName = "DJ_${registro.generales.anio}.pdf"
            val file =
                    body.byteStream().use { input ->
                        documentStorageRepository.saveStream(DocumentCategory.DJ, fileName, input)
                    }

            buildPdfIntent(file)
        }
    }

    private fun buildPdfIntent(file: File): Result<Intent> {
        return Result.success(documentStorageRepository.buildViewIntent(file, "application/pdf"))
    }

    private fun generateOfflineTcpPdf(payload: TcpPdfPayload): File {
        val fileName = "DJ_${payload.generalData.anio}_offline_experimental.pdf"
        val file = documentStorageRepository.createDocumentFile(DocumentCategory.DJ, fileName)
        val writer = PdfWriter(file)
        val pdfDocument = PdfDocument(writer)
        val document = Document(pdfDocument, PageSize.A4.rotate())
        document.setMargins(10f, 10f, 10f, 10f)

        val regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA)
        val boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD)
        document.setFont(regularFont)

        addTcpCoverPage(document, payload.generalData, boldFont, regularFont)
        document.add(com.itextpdf.layout.element.AreaBreak())
        addMonthSection(
                document,
                "INGRESOS",
                "Total de Ingresos Anuales",
                payload.ingresos,
                boldFont,
                regularFont
        )
        document.add(com.itextpdf.layout.element.AreaBreak())
        addMonthSection(
                document,
                "GASTOS",
                "Total de Gastos Anuales",
                payload.gastos,
                boldFont,
                regularFont
        )
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
                        )
                        .setPaddingTop(10f)
        )
        table.addCell(textCell("Año", boldFont, 10f, TextAlignment.CENTER, colspan = 2))
        table.addCell(textCell(generalData.anio, boldFont, 11f, TextAlignment.CENTER, colspan = 2))
        table.addCell(
                textCell(
                        "Nombre(s) y Apellidos del Contribuyente",
                        regularFont,
                        9f,
                        TextAlignment.CENTER,
                        colspan = 6
                )
        )
        table.addCell(textCell("NIT", boldFont, 10f, TextAlignment.CENTER, colspan = 2))
        table.addCell(
                textCell(generalData.nombre, regularFont, 10f, TextAlignment.CENTER, colspan = 6)
        )
        table.addCell(textCell(generalData.nit, regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(
                textCell(
                        "Domicilio fiscal: (lugar donde desarrolla la actividad): calle, No, apto, entre calles:",
                        regularFont,
                        9f,
                        TextAlignment.LEFT,
                        colspan = 8
                )
        )
        table.addCell(
                textCell(generalData.fiscalCalle, regularFont, 10f, TextAlignment.LEFT, colspan = 8)
        )
        table.addCell(textCell("Municipio:", regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(
                textCell(
                        generalData.fiscalMunicipio,
                        regularFont,
                        10f,
                        TextAlignment.LEFT,
                        colspan = 2
                )
        )
        table.addCell(textCell("Provincia:", regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(
                textCell(
                        generalData.fiscalProvincia,
                        regularFont,
                        10f,
                        TextAlignment.LEFT,
                        colspan = 2
                )
        )
        table.addCell(
                textCell(
                        "Domicilio legal: (según Carnet de Identidad): calle, No, Apto, entre calles.",
                        regularFont,
                        9f,
                        TextAlignment.LEFT,
                        colspan = 8
                )
        )
        table.addCell(
                textCell(generalData.legalCalle, regularFont, 10f, TextAlignment.LEFT, colspan = 8)
        )
        table.addCell(textCell("Municipio:", regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(
                textCell(
                        generalData.legalMunicipio,
                        regularFont,
                        10f,
                        TextAlignment.LEFT,
                        colspan = 2
                )
        )
        table.addCell(textCell("Provincia:", regularFont, 10f, TextAlignment.LEFT, colspan = 2))
        table.addCell(
                textCell(
                        generalData.legalProvincia,
                        regularFont,
                        10f,
                        TextAlignment.LEFT,
                        colspan = 2
                )
        )
        table.addCell(textCell("Actividad:", regularFont, 10f, TextAlignment.LEFT))
        table.addCell(
                textCell(generalData.actividad, regularFont, 10f, TextAlignment.LEFT, colspan = 5)
        )
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
        table.addCell(
                textCell(/*generalData.firmaDia*/ "\n", regularFont, 10f, TextAlignment.CENTER)
        )
        table.addCell(
                textCell(/*generalData.firmaMes*/ "\n", regularFont, 10f, TextAlignment.CENTER)
        )
        table.addCell(
                textCell(/*generalData.firmaAnio*/ "\n", regularFont, 10f, TextAlignment.CENTER)
        )
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
        val widths =
                LedgerConstants.MONTHS
                        .flatMap {
                            listOf(TCP_MONTH_DAY_COLUMN_WIDTH, TCP_MONTH_VALUE_COLUMN_WIDTH)
                        }
                        .toFloatArray()
        val table = Table(widths)
        table.setWidth(TCP_MONTH_TABLE_WIDTH)
        table.setFixedLayout()
        val monthCellHeight = 12f

        table.addCell(textCell(title, boldFont, 9f, TextAlignment.CENTER, colspan = 24))
        LedgerConstants.MONTHS.forEach { month ->
            table.addCell(monthGridCell("D", boldFont, 6f, TextAlignment.CENTER, monthCellHeight))
            table.addCell(monthGridCell(month, boldFont, 7f, TextAlignment.CENTER, monthCellHeight))
        }

        for (rowIndex in 0 until 36) {
            LedgerConstants.MONTHS.forEach { month ->
                val row = entries[month].orEmpty().getOrNull(rowIndex)
                table.addCell(
                        monthGridCell(
                                sanitizeMonthDayCell(row?.dia.orEmpty()),
                                regularFont,
                                6f,
                                TextAlignment.CENTER,
                                monthCellHeight
                        )
                )
                table.addCell(
                        monthGridCell(
                                sanitizeMonthAmountCell(row?.importe.orEmpty()),
                                regularFont,
                                7f,
                                TextAlignment.RIGHT,
                                monthCellHeight
                        )
                )
            }
        }

        LedgerConstants.MONTHS.forEach { month ->
            table.addCell(monthGridCell("", regularFont, 6f, TextAlignment.CENTER, monthCellHeight))
            table.addCell(
                    monthGridCell(
                            sanitizeMonthAmountCell(monthTotalText(entries[month].orEmpty())),
                            boldFont,
                            7f,
                            TextAlignment.RIGHT,
                            monthCellHeight
                    )
            )
        }

        document.add(table)

        val summaryWrap = Table(floatArrayOf(1f, 240f)).useAllAvailableWidth()
        summaryWrap.setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
        summaryWrap.addCell(blankCell())
        val annualTotal =
                LedgerConstants.MONTHS.sumOf { month ->
                    entries[month].orEmpty().sumOf { parseCurrency(it.importe) }
                }
        val summaryTable = Table(floatArrayOf(170f, 70f))
        summaryTable.addCell(textCell(annualLabel, boldFont, 9f, TextAlignment.LEFT))
        summaryTable.addCell(
                textCell(
                        String.format(Locale.US, "%.2f", annualTotal),
                        regularFont,
                        9f,
                        TextAlignment.RIGHT
                )
        )
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
        val widths =
                floatArrayOf(
                        64f,
                        44f,
                        44f,
                        44f,
                        44f,
                        44f,
                        44f,
                        44f,
                        44f,
                        44f,
                        44f,
                        44f,
                        44f,
                        44f,
                        44f,
                        44f
                )
        val table = Table(widths).useAllAvailableWidth()

        table.addCell(
                textCell(
                        "TRIBUTOS  Y OTROS GASTOS  ASOCIADOS A LA ACTIVIDAD",
                        boldFont,
                        12f,
                        TextAlignment.CENTER,
                        colspan = 16
                )
        )

        table.addCell(textCell("Mes", boldFont, 9f, TextAlignment.CENTER, rowspan = 3))
        table.addCell(
                textCell(
                        "TRIBUTOS PAGADOS DEDUCIBLES EN LA DECLARACIÓN JURADA",
                        boldFont,
                        10f,
                        TextAlignment.CENTER,
                        colspan = 9
                )
        )
        table.addCell(textCell("Subtotal", boldFont, 9f, TextAlignment.CENTER, rowspan = 3))
        table.addCell(
                textCell(
                        "Otros Gastos deducibles de la base imponible",
                        boldFont,
                        10f,
                        TextAlignment.CENTER,
                        colspan = 4
                )
        )
        table.addCell(
                textCell(
                        "Cuota Mensual (5%) 051012",
                        boldFont,
                        8f,
                        TextAlignment.CENTER,
                        rowspan = 3
                )
        )

        table.addCell(
                textCell(
                        "Impuesto sobre Ventas o Servicios (10%) 011402",
                        boldFont,
                        7f,
                        TextAlignment.CENTER,
                        rowspan = 2
                )
        )
        table.addCell(
                textCell(
                        "Impuesto por la Utilización de la Fuerza de Trabajo 061032",
                        boldFont,
                        7f,
                        TextAlignment.CENTER,
                        rowspan = 2
                )
        )
        table.addCell(
                textCell(
                        "Impuesto sobre Documentos y sellos 073012",
                        boldFont,
                        7f,
                        TextAlignment.CENTER,
                        rowspan = 2
                )
        )
        table.addCell(
                textCell(
                        "Tasa por la Radicación de Anuncios. Cartel 090012",
                        boldFont,
                        7f,
                        TextAlignment.CENTER,
                        rowspan = 2
                )
        )
        table.addCell(
                textCell(
                        "Contribución Especial a la Seguridad Social (20%) 082013",
                        boldFont,
                        7f,
                        TextAlignment.CENTER,
                        rowspan = 2
                )
        )
        table.addCell(
                textCell(
                        "Contribución a la Seguridad Social (14%) 081013",
                        boldFont,
                        7f,
                        TextAlignment.CENTER,
                        colspan = 3
                )
        )
        table.addCell(textCell("Otros", boldFont, 8f, TextAlignment.CENTER, rowspan = 2))
        table.addCell(
                textCell(
                        "Contribución para la Restauración y Preservación de las Zonas donde Desarrolla su Activ.",
                        boldFont,
                        7f,
                        TextAlignment.CENTER,
                        rowspan = 2
                )
        )
        table.addCell(
                textCell(
                        "Pago por arrendamiento de bienes estatales autorizadas",
                        boldFont,
                        7f,
                        TextAlignment.CENTER,
                        rowspan = 2
                )
        )
        table.addCell(
                textCell(
                        "Importes exonerados por arrendam. por asumir gastos de reparaciones",
                        boldFont,
                        7f,
                        TextAlignment.CENTER,
                        rowspan = 2
                )
        )
        table.addCell(
                textCell(
                        "Otros Gastos autorizados MFP",
                        boldFont,
                        7f,
                        TextAlignment.CENTER,
                        rowspan = 2
                )
        )

        table.addCell(textCell("Total", boldFont, 8f, TextAlignment.CENTER))
        table.addCell(textCell("12.5%", boldFont, 8f, TextAlignment.CENTER))
        table.addCell(textCell("1.5%", boldFont, 8f, TextAlignment.CENTER))

        listOf(
                        "",
                        "-1",
                        "-2",
                        "-3",
                        "-4",
                        "-5",
                        "-6",
                        "-7",
                        "-8",
                        "-9",
                        "-10",
                        "-11",
                        "-12",
                        "-13",
                        "-14",
                        "-15"
                )
                .forEachIndexed { index, label ->
                    table.addCell(
                            textCell(
                                    label,
                                    if (index == 0) regularFont else boldFont,
                                    if (index == 0) 8f else 9f,
                                    if (index == 0) TextAlignment.LEFT else TextAlignment.CENTER
                            )
                    )
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
            val b: String, //1
            val c: String, //2
            val d: String, //3
            val e: String, //4
            val f: String, //5
            val g: Double, //6
            val h: String, //7
            val i: String, //8
            val j: String, //9
            val k: Double, //10
            val l: String, //11
            val m: String, //12
            val n: String, //13
            val o: String, //14
            val p: String  //15
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
            val k =
                    parseCurrency(source?.b.orEmpty()) +
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

    private fun blankCell(): Cell = Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)

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
            baseCell(rowspan, colspan)
                    .add(
                            Paragraph(text)
                                    .setFont(font)
                                    .setFontSize(fontSize)
                                    .setTextAlignment(alignment)
                                    .setMultipliedLeading(1f)
                    )

    private fun monthGridCell(
            text: String,
            font: PdfFont,
            fontSize: Float,
            alignment: TextAlignment,
            height: Float
    ): Cell =
            baseCell().apply {
                setHeight(height)
                setMinHeight(height)
                setMaxHeight(height)
                setVerticalAlignment(VerticalAlignment.MIDDLE)
                setPaddingTop(0f)
                setPaddingBottom(0f)
                setKeepTogether(true)
                add(
                        Paragraph(text)
                                .setFont(font)
                                .setFontSize(fontSize)
                                .setTextAlignment(alignment)
                                .setMultipliedLeading(1f)
                                .setMargin(0f)
                )
            }

    private fun sanitizeMonthDayCell(value: String): String {
        val digits = value.trim().filter { it.isDigit() }
        return digits.take(2)
    }

    private fun sanitizeMonthAmountCell(value: String): String {
        val normalized = value.replace(',', '.').trim()
        val amount = normalized.toDoubleOrNull()
        return if (amount != null) {
            String.format(Locale.US, "%.2f", amount)
        } else {
            normalized.take(10)
        }
    }

    private fun monthTotalText(entries: List<DayAmountRow>): String =
            String.format(Locale.US, "%.2f", entries.sumOf { parseCurrency(it.importe) })

    private fun parseCurrency(value: String): Double {
        val normalized = value.replace(",", ".").trim()
        return normalized.toDoubleOrNull() ?: 0.0
    }

    private fun normalizeMonth(value: String): String =
            value.lowercase(Locale.ROOT).normalize().trim()

    private fun String.normalize(): String =
            java.text.Normalizer.normalize(this, java.text.Normalizer.Form.NFD)
                    .replace("\\p{InCombiningDiacriticalMarks}+".toRegex(), "")

    private fun decimal(value: Double): String = String.format(Locale.US, "%.2f", value)

    private fun decimalOrBlank(value: Double): String = if (value == 0.0) "" else decimal(value)

    private fun buildPdfError(response: Response<ResponseBody>): Exception {
        val code = response.code()
        val errorBody = response.errorBody()?.string()
        val message =
                if (!errorBody.isNullOrBlank()) {
                    try {
                        val json = JSONObject(errorBody)
                        json.optString("message").ifBlank { json.optString("error") }.ifBlank {
                            "Error al generar PDF: $code"
                        }
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
    val MONTHS =
            listOf(
                    "ENE",
                    "FEB",
                    "MAR",
                    "ABR",
                    "MAY",
                    "JUN",
                    "JUL",
                    "AGO",
                    "SEP",
                    "OCT",
                    "NOV",
                    "DIC"
            )
    val monthLabels =
            mapOf(
                    "ENE" to "Enero",
                    "FEB" to "Febrero",
                    "MAR" to "Marzo",
                    "ABR" to "Abril",
                    "MAY" to "Mayo",
                    "JUN" to "Junio",
                    "JUL" to "Julio",
                    "AGO" to "Agosto",
                    "SEP" to "Septiembre",
                    "OCT" to "Octubre",
                    "NOV" to "Noviembre",
                    "DIC" to "Diciembre"
            )
}
