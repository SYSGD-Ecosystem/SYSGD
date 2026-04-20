package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import cu.lazaroysr96.sysgdcont.data.dao.TercerosDao
import cu.lazaroysr96.sysgdcont.data.model.EstadoCuentaTercero
import cu.lazaroysr96.sysgdcont.data.model.RolTercero
import cu.lazaroysr96.sysgdcont.data.model.Tercero
import cu.lazaroysr96.sysgdcont.data.model.TerceroCuenta
import cu.lazaroysr96.sysgdcont.data.model.TerceroCuentaListItem
import cu.lazaroysr96.sysgdcont.data.model.TerceroListItem
import cu.lazaroysr96.sysgdcont.data.model.TercerosRegistro
import cu.lazaroysr96.sysgdcont.data.model.TerceroRol
import cu.lazaroysr96.sysgdcont.data.model.TipoCuentaTercero
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

private val Context.tercerosDataStore: DataStore<Preferences> by preferencesDataStore(name = "terceros_prefs")

@Singleton
class TercerosRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val tercerosDao: TercerosDao
) {
    companion object {
        private val TERCEROS_LOCAL_MODIFIED_KEY = stringPreferencesKey("terceros_local_modified")
    }

    val localModified: Flow<Boolean> = context.tercerosDataStore.data.map { prefs ->
        prefs[TERCEROS_LOCAL_MODIFIED_KEY] == "true"
    }

    private suspend fun markLocalModified() {
        setLocalModified(true)
    }

    suspend fun clearLocalModified() {
        setLocalModified(false)
    }

    suspend fun setLocalModified(modified: Boolean) {
        context.tercerosDataStore.edit { prefs ->
            prefs[TERCEROS_LOCAL_MODIFIED_KEY] = if (modified) "true" else "false"
        }
    }

    fun observeTerceros(): Flow<List<TerceroListItem>> = tercerosDao.observeTerceros()

    fun observeCuentas(): Flow<List<TerceroCuentaListItem>> = tercerosDao.observeCuentas()

    fun observeTotalDeudas(): Flow<Double> = tercerosDao.observeTotalDeudas()

    fun observeTotalPrestamos(): Flow<Double> = tercerosDao.observeTotalPrestamos()

    suspend fun crearTercero(
        nombre: String,
        tipoEntidad: String,
        roles: Set<String>,
        telefono: String,
        correo: String,
        direccion: String,
        identificadorFiscal: String,
        numeroTarjeta: String,
        direccionCrypto: String,
        nota: String
    ): Tercero {
        require(nombre.isNotBlank()) { "El nombre es obligatorio" }
        require(roles.isNotEmpty()) { "Debes seleccionar al menos un rol" }

        val now = nowIso()
        val terceroId = UUID.randomUUID().toString()
        val tercero = Tercero(
            id = terceroId,
            nombre = nombre.trim(),
            tipoEntidad = tipoEntidad,
            telefono = telefono.trim(),
            correo = correo.trim(),
            direccion = direccion.trim(),
            identificadorFiscal = identificadorFiscal.trim(),
            numeroTarjeta = numeroTarjeta.trim(),
            direccionCrypto = direccionCrypto.trim(),
            nota = nota.trim(),
            createdAt = now,
            updatedAt = now
        )

        tercerosDao.insertTercero(tercero)
        tercerosDao.insertRoles(
            roles.map { rol ->
                TerceroRol(
                    id = UUID.randomUUID().toString(),
                    terceroId = terceroId,
                    rol = rol,
                    createdAt = now
                )
            }
        )
        markLocalModified()
        return tercero
    }

    suspend fun crearCuenta(
        terceroId: String,
        tipoCuenta: String,
        categoria: String,
        concepto: String,
        montoOriginal: Double,
        fechaVencimiento: String,
        moneda: String,
        descripcion: String,
        nota: String
    ): TerceroCuenta {
        require(terceroId.isNotBlank()) { "Selecciona un tercero" }
        require(concepto.isNotBlank()) { "El concepto es obligatorio" }
        require(montoOriginal > 0) { "El monto debe ser mayor que cero" }

        val now = nowIso()
        val cuenta = TerceroCuenta(
            id = UUID.randomUUID().toString(),
            terceroId = terceroId,
            tipoCuenta = tipoCuenta,
            categoria = categoria,
            concepto = concepto.trim(),
            descripcion = descripcion.trim(),
            montoOriginal = montoOriginal,
            montoPendiente = montoOriginal,
            fechaCreacion = LocalDate.now().toString(),
            fechaVencimiento = fechaVencimiento.trim(),
            estado = computeEstadoInicial(tipoCuenta, fechaVencimiento),
            moneda = moneda.ifBlank { "CUP" }.trim().uppercase(),
            nota = nota.trim(),
            createdAt = now,
            updatedAt = now
        )
        tercerosDao.insertCuenta(cuenta)
        markLocalModified()
        return cuenta
    }

    suspend fun actualizarTercero(
        terceroId: String,
        nombre: String,
        tipoEntidad: String,
        roles: Set<String>,
        telefono: String,
        correo: String,
        direccion: String,
        identificadorFiscal: String,
        numeroTarjeta: String,
        direccionCrypto: String,
        nota: String
    ) {
        require(nombre.isNotBlank()) { "El nombre es obligatorio" }
        require(roles.isNotEmpty()) { "Debes seleccionar al menos un rol" }

        val existing = tercerosDao.getTerceroById(terceroId)
            ?: throw IllegalStateException("El tercero no existe")
        val now = nowIso()
        val updated = existing.copy(
            nombre = nombre.trim(),
            tipoEntidad = tipoEntidad,
            telefono = telefono.trim(),
            correo = correo.trim(),
            direccion = direccion.trim(),
            identificadorFiscal = identificadorFiscal.trim(),
            numeroTarjeta = numeroTarjeta.trim(),
            direccionCrypto = direccionCrypto.trim(),
            nota = nota.trim(),
            updatedAt = now
        )
        tercerosDao.updateTercero(updated)
        tercerosDao.deleteRolesByTercero(terceroId)
        tercerosDao.insertRoles(
            roles.map { rol ->
                TerceroRol(
                    id = UUID.randomUUID().toString(),
                    terceroId = terceroId,
                    rol = rol,
                    createdAt = now
                )
            }
        )
        markLocalModified()
    }

    suspend fun actualizarCuenta(
        cuentaId: String,
        categoria: String,
        concepto: String,
        descripcion: String,
        fechaVencimiento: String,
        estado: String,
        moneda: String,
        nota: String
    ) {
        require(concepto.isNotBlank()) { "El concepto es obligatorio" }

        val existing = tercerosDao.getCuentaById(cuentaId)
            ?: throw IllegalStateException("La cuenta no existe")
        val now = nowIso()
        val updated = existing.copy(
            categoria = categoria,
            concepto = concepto.trim(),
            descripcion = descripcion.trim(),
            fechaVencimiento = fechaVencimiento.trim(),
            estado = estado,
            moneda = moneda.ifBlank { existing.moneda }.trim().uppercase(),
            nota = nota.trim(),
            updatedAt = now
        )
        tercerosDao.updateCuenta(updated)
        markLocalModified()
    }

    suspend fun archivarTercero(terceroId: String) {
        val cuentas = tercerosDao.countCuentasByTercero(terceroId)
        require(cuentas == 0) { "No se puede archivar un tercero con cuentas asociadas" }
        tercerosDao.deleteRolesByTercero(terceroId)
        tercerosDao.deactivateTercero(terceroId, nowIso())
        markLocalModified()
    }

    suspend fun toTercerosRegistro(): TercerosRegistro {
        return TercerosRegistro(
            terceros = tercerosDao.getAllTercerosIncluyendoArchivadosRaw(),
            roles = tercerosDao.getAllRolesRaw(),
            cuentas = tercerosDao.getAllCuentasRaw(),
            movimientos = tercerosDao.getAllMovimientosRaw()
        )
    }

    suspend fun fromTercerosRegistro(registro: TercerosRegistro) {
        tercerosDao.deleteAllMovimientos()
        tercerosDao.deleteAllCuentas()
        tercerosDao.deleteAllRoles()
        tercerosDao.deleteAllTerceros()

        registro.terceros.forEach { tercerosDao.insertTercero(it) }
        if (registro.roles.isNotEmpty()) {
            tercerosDao.insertRoles(registro.roles)
        }
        registro.cuentas.forEach { tercerosDao.insertCuenta(it) }
        registro.movimientos.forEach { tercerosDao.insertMovimiento(it) }

        clearLocalModified()
    }

    fun formatCurrency(value: Double, currency: String = "CUP"): String {
        return "${"%.2f".format(value)} $currency"
    }

    private fun computeEstadoInicial(tipoCuenta: String, fechaVencimiento: String): String {
        if (fechaVencimiento.isBlank()) {
            return EstadoCuentaTercero.PENDIENTE
        }

        return runCatching {
            val dueDate = LocalDate.parse(fechaVencimiento.trim())
            if (dueDate.isBefore(LocalDate.now())) {
                EstadoCuentaTercero.VENCIDO
            } else {
                EstadoCuentaTercero.PENDIENTE
            }
        }.getOrDefault(
            if (tipoCuenta == TipoCuentaTercero.PRESTAMO) {
                EstadoCuentaTercero.PENDIENTE
            } else {
                EstadoCuentaTercero.PENDIENTE
            }
        )
    }

    private fun nowIso(): String {
        return LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
    }
}
