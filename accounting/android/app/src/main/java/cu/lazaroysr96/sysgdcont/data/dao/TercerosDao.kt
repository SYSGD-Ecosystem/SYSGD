package cu.lazaroysr96.sysgdcont.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import cu.lazaroysr96.sysgdcont.data.model.Tercero
import cu.lazaroysr96.sysgdcont.data.model.TerceroCuenta
import cu.lazaroysr96.sysgdcont.data.model.TerceroCuentaListItem
import cu.lazaroysr96.sysgdcont.data.model.TerceroListItem
import cu.lazaroysr96.sysgdcont.data.model.TerceroMovimiento
import cu.lazaroysr96.sysgdcont.data.model.TerceroRol
import kotlinx.coroutines.flow.Flow

@Dao
interface TercerosDao {
    @Query(
        """
        SELECT
            t.id,
            t.nombre,
            t.tipoEntidad,
            t.telefono,
            t.correo,
            t.direccion,
            t.identificadorFiscal,
            t.numeroTarjeta,
            t.direccionCrypto,
            t.nota,
            (
                SELECT GROUP_CONCAT(rol)
                FROM tercero_roles tr
                WHERE tr.terceroId = t.id AND tr.activo = 1
            ) AS roles,
            (
                SELECT COALESCE(SUM(tc.montoPendiente), 0)
                FROM tercero_cuentas tc
                WHERE tc.terceroId = t.id
                    AND tc.tipoCuenta = 'DEUDA'
                    AND tc.estado NOT IN ('PAGADO', 'COBRADO', 'CANCELADO')
            ) AS totalDeudas,
            (
                SELECT COALESCE(SUM(tc.montoPendiente), 0)
                FROM tercero_cuentas tc
                WHERE tc.terceroId = t.id
                    AND tc.tipoCuenta = 'PRESTAMO'
                    AND tc.estado NOT IN ('PAGADO', 'COBRADO', 'CANCELADO')
            ) AS totalPrestamos,
            (
                SELECT COUNT(*)
                FROM tercero_cuentas tc
                WHERE tc.terceroId = t.id
                    AND tc.estado IN ('PENDIENTE', 'VENCIDO')
            ) AS cuentasPendientes
        FROM terceros t
        WHERE t.activo = 1
        ORDER BY t.nombre COLLATE NOCASE ASC
        """
    )
    fun observeTerceros(): Flow<List<TerceroListItem>>

    @Query(
        """
        SELECT
            tc.id,
            tc.terceroId,
            t.nombre AS terceroNombre,
            tc.tipoCuenta,
            tc.categoria,
            tc.concepto,
            tc.descripcion,
            tc.montoOriginal,
            tc.montoPendiente,
            tc.fechaCreacion,
            tc.fechaVencimiento,
            tc.estado,
            tc.moneda,
            tc.nota
        FROM tercero_cuentas tc
        INNER JOIN terceros t ON t.id = tc.terceroId
        WHERE t.activo = 1
        ORDER BY tc.fechaCreacion DESC
        """
    )
    fun observeCuentas(): Flow<List<TerceroCuentaListItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTercero(tercero: Tercero)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRoles(roles: List<TerceroRol>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCuenta(cuenta: TerceroCuenta)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMovimiento(movimiento: TerceroMovimiento)

    @Query("SELECT * FROM terceros WHERE activo = 1 ORDER BY nombre COLLATE NOCASE ASC")
    suspend fun getAllTercerosRaw(): List<Tercero>

    @Query("SELECT COUNT(*) FROM tercero_cuentas WHERE terceroId = :terceroId")
    suspend fun countCuentasByTercero(terceroId: String): Int

    @Query("DELETE FROM tercero_roles WHERE terceroId = :terceroId")
    suspend fun deleteRolesByTercero(terceroId: String)

    @Query("UPDATE terceros SET activo = 0, updatedAt = :updatedAt WHERE id = :terceroId")
    suspend fun deactivateTercero(terceroId: String, updatedAt: String)

    @Query(
        """
        UPDATE tercero_cuentas
        SET montoPendiente = :montoPendiente,
            estado = :estado,
            updatedAt = :updatedAt
        WHERE id = :cuentaId
        """
    )
    suspend fun updateCuentaSaldo(
        cuentaId: String,
        montoPendiente: Double,
        estado: String,
        updatedAt: String
    )

    @Query(
        """
        SELECT
            COALESCE(SUM(CASE
                WHEN tipoCuenta = 'DEUDA' AND estado NOT IN ('PAGADO', 'COBRADO', 'CANCELADO')
                THEN montoPendiente ELSE 0
            END), 0)
        FROM tercero_cuentas
        """
    )
    fun observeTotalDeudas(): Flow<Double>

    @Query(
        """
        SELECT
            COALESCE(SUM(CASE
                WHEN tipoCuenta = 'PRESTAMO' AND estado NOT IN ('PAGADO', 'COBRADO', 'CANCELADO')
                THEN montoPendiente ELSE 0
            END), 0)
        FROM tercero_cuentas
        """
    )
    fun observeTotalPrestamos(): Flow<Double>
}
