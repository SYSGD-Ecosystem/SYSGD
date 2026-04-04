package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Context
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import cu.lazaroysr96.sysgdcont.data.model.FormaPago
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Venta
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import java.io.File
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FacturaRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val ledgerRepository: LedgerRepository
) {
    private var ultimoNumero = 0

    fun generarFacturaPdf(
        venta: Venta,
        lineasVenta: List<LineaVenta>,
        nombreCliente: String,
        ciCliente: String,
        direccionCliente: String,
        telefonoCliente: String,
        formaPago: FormaPago,
        idTransaccion: String?
    ): String {
        ultimoNumero++
        val numeroFactura = ultimoNumero
        
        // val nombreVendedor = try {
        //     ledgerRepository.getRegistro().first().generales.nombre
        // } catch (e: Exception) {
        //     "Vendedor"
        // }

        val nombreVendedor = "Vendedor"

        return generarPdf(
            numero = numeroFactura,
            venta = venta,
            lineas = lineasVenta,
            nombreCliente = nombreCliente,
            ciCliente = ciCliente,
            direccionCliente = direccionCliente,
            telefonoCliente = telefonoCliente,
            formaPago = formaPago,
            idTransaccion = idTransaccion,
            nombreVendedor = nombreVendedor
        )
    }

    private fun generarPdf(
        numero: Int,
        venta: Venta,
        lineas: List<LineaVenta>,
        nombreCliente: String,
        ciCliente: String,
        direccionCliente: String,
        telefonoCliente: String,
        formaPago: FormaPago,
        idTransaccion: String?,
        nombreVendedor: String
    ): String {
        val facturasDir = File(context.getExternalFilesDir(null), "facturas")
        if (!facturasDir.exists()) {
            facturasDir.mkdirs()
        }

        val fileName = "factura_${numero}_${venta.fecha.replace("-", "")}.pdf"
        val pdfFile = File(facturasDir, fileName)

        val writer = PdfWriter(pdfFile)
        val pdfDoc = PdfDocument(writer)
        val document = Document(pdfDoc)

        document.add(
            Paragraph("FACTURA")
                .setFontSize(18f)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
        )

        document.add(
            Paragraph("No. $numero")
                .setFontSize(12f)
                .setTextAlignment(TextAlignment.CENTER)
        )

        document.add(Paragraph("\n"))
        document.add(Paragraph("Establecimiento: $nombreVendedor").setFontSize(10f))
        document.add(Paragraph("Fecha: ${venta.fecha}  Hora: ${venta.hora}").setFontSize(10f))
        document.add(Paragraph("\n"))

        document.add(Paragraph("CLIENTE").setBold().setFontSize(11f))
        document.add(Paragraph("Nombre: $nombreCliente").setFontSize(10f))
        document.add(Paragraph("CI: $ciCliente").setFontSize(10f))
        if (direccionCliente.isNotBlank()) {
            document.add(Paragraph("Dirección: $direccionCliente").setFontSize(10f))
        }
        if (telefonoCliente.isNotBlank()) {
            document.add(Paragraph("Teléfono: $telefonoCliente").setFontSize(10f))
        }

        document.add(Paragraph("\n"))

        val table = Table(UnitValue.createPercentArray(floatArrayOf(50f, 15f, 17.5f, 17.5f)))
            .useAllAvailableWidth()

        table.addHeaderCell(Cell().add(Paragraph("Producto").setBold()))
        table.addHeaderCell(Cell().add(Paragraph("Cantidad").setBold()).setTextAlignment(TextAlignment.CENTER))
        table.addHeaderCell(Cell().add(Paragraph("Precio").setBold()).setTextAlignment(TextAlignment.RIGHT))
        table.addHeaderCell(Cell().add(Paragraph("Importe").setBold()).setTextAlignment(TextAlignment.RIGHT))

        lineas.forEach { linea ->
            table.addCell(Cell().add(Paragraph(linea.nombreProducto).setFontSize(9f)))
            table.addCell(Cell().add(Paragraph("%.2f".format(linea.cantidad)).setFontSize(9f).setTextAlignment(TextAlignment.CENTER)))
            table.addCell(Cell().add(Paragraph("%.2f".format(linea.precioUnitario)).setFontSize(9f).setTextAlignment(TextAlignment.RIGHT)))
            table.addCell(Cell().add(Paragraph("%.2f".format(linea.cantidad * linea.precioUnitario)).setFontSize(9f).setTextAlignment(TextAlignment.RIGHT)))
        }

        document.add(table)
        document.add(Paragraph("\n"))
        document.add(
            Paragraph("TOTAL: %.2f CUP".format(venta.total))
                .setFontSize(14f)
                .setBold()
                .setTextAlignment(TextAlignment.RIGHT)
        )

        document.add(Paragraph("\n"))

        val formaPagoTexto = when (formaPago) {
            FormaPago.EFECTIVO -> "Efectivo"
            FormaPago.TARJETA -> "Tarjeta"
        }
        document.add(Paragraph("Forma de pago: $formaPagoTexto").setFontSize(10f))

        if (formaPago == FormaPago.TARJETA && !idTransaccion.isNullOrBlank()) {
            document.add(Paragraph("ID Transacción: $idTransaccion").setFontSize(10f))
        }

        document.add(Paragraph("\n\n"))
        document.add(Paragraph("_________________________").setTextAlignment(TextAlignment.CENTER))
        document.add(Paragraph("Firma del vendedor").setTextAlignment(TextAlignment.CENTER).setFontSize(9f))
        document.add(Paragraph(nombreVendedor).setTextAlignment(TextAlignment.CENTER).setFontSize(9f))

        document.close()

        return pdfFile.absolutePath
    }
}
