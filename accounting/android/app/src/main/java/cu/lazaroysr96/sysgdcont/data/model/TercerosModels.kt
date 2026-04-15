package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

object TipoEntidadTercero {
    const val TCP = "TCP"
    const val PARTICULAR = "PARTICULAR"
    const val ESTATAL = "ESTATAL"
    const val MIPYME = "MIPYME"
    // Compatibilidad con datos antiguos
    const val PERSONA = PARTICULAR
    const val EMPRESA = MIPYME
    const val ESTADO = ESTATAL
}

object RolTercero {
    const val CLIENTE = "CLIENTE"
    const val PROVEEDOR = "PROVEEDOR"
    const val EMPLEADO = "EMPLEADO"
    const val ESTADO = "ESTADO"
}

object TipoCuentaTercero {
    const val DEUDA = "DEUDA"
    const val PRESTAMO = "PRESTAMO"
}

object EstadoCuentaTercero {
    const val PENDIENTE = "PENDIENTE"
    const val PAGADO = "PAGADO"
    const val COBRADO = "COBRADO"
    const val VENCIDO = "VENCIDO"
    const val CANCELADO = "CANCELADO"
}

@Entity(tableName = "terceros")
data class Tercero(
    @PrimaryKey val id: String,
    val nombre: String,
    val tipoEntidad: String,
    val telefono: String = "",
    val correo: String = "",
    val direccion: String = "",
    val identificadorFiscal: String = "",
    val numeroTarjeta: String = "",
    val direccionCrypto: String = "",
    val nota: String = "",
    val activo: Boolean = true,
    val createdAt: String,
    val updatedAt: String
)

@Entity(
    tableName = "tercero_roles",
    indices = [
        Index(value = ["terceroId"]),
        Index(value = ["terceroId", "rol"], unique = true)
    ]
)
data class TerceroRol(
    @PrimaryKey val id: String,
    val terceroId: String,
    val rol: String,
    val activo: Boolean = true,
    val createdAt: String
)

@Entity(
    tableName = "tercero_cuentas",
    indices = [Index(value = ["terceroId"])]
)
data class TerceroCuenta(
    @PrimaryKey val id: String,
    val terceroId: String,
    val tipoCuenta: String,
    val categoria: String,
    val concepto: String,
    val descripcion: String = "",
    val montoOriginal: Double,
    val montoPendiente: Double,
    val fechaCreacion: String,
    val fechaVencimiento: String = "",
    val estado: String,
    val moneda: String = "CUP",
    val origenTipo: String = "",
    val origenId: String = "",
    val nota: String = "",
    val createdAt: String,
    val updatedAt: String
)

@Entity(
    tableName = "tercero_movimientos",
    indices = [Index(value = ["cuentaId"])]
)
data class TerceroMovimiento(
    @PrimaryKey val id: String,
    val cuentaId: String,
    val tipoMovimiento: String,
    val monto: Double,
    val fecha: String,
    val metodo: String = "",
    val referencia: String = "",
    val nota: String = "",
    val createdAt: String
)

data class TerceroListItem(
    val id: String,
    val nombre: String,
    val tipoEntidad: String,
    val telefono: String,
    val correo: String,
    val direccion: String,
    val identificadorFiscal: String,
    val numeroTarjeta: String,
    val direccionCrypto: String,
    val nota: String,
    val roles: String?,
    val totalDeudas: Double,
    val totalPrestamos: Double,
    val cuentasPendientes: Int
) {
    val rolesList: List<String>
        get() = roles
            ?.split(",")
            ?.map { it.trim() }
            ?.filter { it.isNotBlank() }
            ?.distinct()
            .orEmpty()
}

data class TerceroCuentaListItem(
    val id: String,
    val terceroId: String,
    val terceroNombre: String,
    val tipoCuenta: String,
    val categoria: String,
    val concepto: String,
    val descripcion: String,
    val montoOriginal: Double,
    val montoPendiente: Double,
    val fechaCreacion: String,
    val fechaVencimiento: String,
    val estado: String,
    val moneda: String,
    val nota: String
)
