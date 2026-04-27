package cu.lazaroysr96.sysgdcont.data.model

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

enum class FormaPago { EFECTIVO, TARJETA }

@Entity(tableName = "facturas")
data class Factura(
    @PrimaryKey val id: String,
    val numero: Int,
    val ventaId: String,
    val fecha: String,
    val hora: String,
    val nombreCliente: String,
    val ciCliente: String,
    val direccionCliente: String,
    val telefonoCliente: String,
    val formaPago: String,
    val idTransaccion: String? = null,
    val nombreEmpresa: String,
    val nombreVendedor: String,
    val total: Double,
    val pdfPath: String? = null,
    val createdAt: String
)

@Entity(
    tableName = "lineas_factura",
    foreignKeys = [
        ForeignKey(
            entity = Factura::class,
            parentColumns = ["id"],
            childColumns = ["facturaId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("facturaId")]
)
data class LineaFactura(
    @PrimaryKey val id: String,
    val facturaId: String,
    val productoId: String,
    val codigo: String,
    val descripcion: String,
    val unidadMedida: String,
    val cantidad: Double,
    val precioUnitario: Double,
    val importe: Double
)
