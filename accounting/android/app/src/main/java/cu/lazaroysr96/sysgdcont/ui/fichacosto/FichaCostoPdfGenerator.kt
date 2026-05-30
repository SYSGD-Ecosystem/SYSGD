package cu.lazaroysr96.sysgdcont.ui.fichacosto

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import com.itextpdf.kernel.colors.ColorConstants
import com.itextpdf.kernel.colors.DeviceRgb
import com.itextpdf.kernel.font.PdfFontFactory
import com.itextpdf.kernel.geom.PageSize
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// ── Colores iText ────────────────────────────────────────────────────────────
private val COLOR_HEADER    = DeviceRgb(10,  121, 245)   // azul barra
private val COLOR_GRUPO     = DeviceRgb(224, 232, 255)   // fondo grupo
private val COLOR_CALC      = DeviceRgb(232, 245, 233)   // fondo calculada
private val COLOR_EDITABLE  = DeviceRgb(255, 243, 224)   // fondo editable
private val COLOR_TEXTO     = DeviceRgb(26,  26,  26)

// ────────────────────────────────────────────────────────────────────────────
//  Clase principal de generación
// ────────────────────────────────────────────────────────────────────────────

class FichaCostoPdfGenerator(private val context: Context) {

    /**
     * Genera el PDF y devuelve el File resultante.
     * Lanza excepción si hay algún error de escritura.
     */
    fun generar(
        estado: FichaCostoState,
        filas: List<FilaCosto>,
    ): File {
        val dir  = File(context.getExternalFilesDir(null), "FichasCosto")
        dir.mkdirs()

        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val file = File(dir, "FichaCosto_$timestamp.pdf")

        val writer    = PdfWriter(file)
        val pdfDoc    = PdfDocument(writer)
        val pageSize  = PageSize.A4 // PageSize.A4.rotate()          // apaisado para la tabla
        val document  = Document(pdfDoc, pageSize)

        document.setMargins(20f*2, 20f, 20f*2, 20f)

        // Fuente (Helvetica siempre disponible en iText)
        val fontBold   = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD)
        val fontNormal = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA)

        // ── Título ───────────────────────────────────────────────────────────
        document.add(
            Paragraph("MINISTERIO DE FINANZAS Y PRECIOS\n" +
                    "FICHA DE COSTOS Y GASTOS DE PRODUCTOS Y SERVICIOS\n" +
                    "PARA LA EVALUACIÓN DE PRECIOS Y TARIFAS")
                .setFont(fontBold)
                .setFontSize(10f)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(8f)
        )

        // ── Datos del encabezado ─────────────────────────────────────────────
        val tablaEnc = Table(UnitValue.createPercentArray(floatArrayOf(40f, 15f, 10f, 20f, 15f)))
            .useAllAvailableWidth()
            .setMarginBottom(6f)

        fun celdaEnc(txt: String, bold: Boolean = false) =
            Cell().add(
                Paragraph(txt)
                    .setFont(if (bold) fontBold else fontNormal)
                    .setFontSize(9f)
            ).setPadding(4f)

        tablaEnc.addCell(celdaEnc("Producto o Servicio: ${estado.productoServicio.value}"))
        tablaEnc.addCell(celdaEnc("Código: ${estado.codigo.value}"))
        tablaEnc.addCell(celdaEnc("UM: ${estado.um.value}"))
        tablaEnc.addCell(celdaEnc("Nivel de Producción: ${estado.nivelProduccion.value}"))
        tablaEnc.addCell(celdaEnc("% Capacidad: ${estado.pctCapacidad.value}"))
        document.add(tablaEnc)

        // ── Tabla principal ──────────────────────────────────────────────────
        // Columnas: Concepto | Fila | CostoBase | CostoNuevo
        val tabla = Table(UnitValue.createPercentArray(floatArrayOf(56f, 8f, 18f, 18f)))
            .useAllAvailableWidth()

        // Cabecera
        fun celdaCabecera(txt: String) = Cell()
            .setBackgroundColor(COLOR_HEADER)
            .add(Paragraph(txt).setFont(fontBold).setFontSize(9f).setFontColor(ColorConstants.WHITE))
            .setTextAlignment(TextAlignment.CENTER)
            .setPadding(5f)

        tabla.addHeaderCell(celdaCabecera("CONCEPTOS"))
        tabla.addHeaderCell(celdaCabecera("FILA"))
        tabla.addHeaderCell(celdaCabecera("Costo Base"))
        tabla.addHeaderCell(celdaCabecera("Costo Nuevo"))

        // Filas de datos
        filas.forEach { fila ->
            val bgColor = when (fila.tipo) {
                FilaTipo.GRUPO    -> COLOR_GRUPO
                FilaTipo.CALCULADA -> COLOR_CALC
                FilaTipo.SUBFILA  -> null
            }
            val font   = if (fila.tipo == FilaTipo.SUBFILA) fontNormal else fontBold
            val indent = if (fila.tipo == FilaTipo.SUBFILA) "   " else ""

            fun celdaDato(txt: String, align: TextAlignment = TextAlignment.LEFT) =
                Cell()
                    .apply { if (bgColor != null) setBackgroundColor(bgColor) }
                    .add(Paragraph(txt).setFont(font).setFontSize(9f))
                    .setTextAlignment(align)
                    .setPadding(4f)

            tabla.addCell(celdaDato("$indent${fila.etiqueta}"))
            tabla.addCell(celdaDato(fila.numero, TextAlignment.CENTER))
            tabla.addCell(celdaDato("$ %.2f".format(fila.costoBase.value), TextAlignment.RIGHT))
            tabla.addCell(celdaDato("$ %.2f".format(fila.costoNuevo.value), TextAlignment.RIGHT))
        }

        document.add(tabla)

        document.add(
            Paragraph("\nElaborado por: ________________________________ Firma: ___________ Cargo: ____________________________ Fecha: ____________")
                .setFont(fontNormal)
                .setFontSize(8f)
        )

        // ── Pie de página ─────────────────────────────────────────────────────
        document.add(
            Paragraph("\nGenerado por SYSGD Contable · ${SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date())}")
                .setFont(fontNormal)
                .setFontSize(8f)
                .setFontColor(DeviceRgb(120, 120, 120))
                .setTextAlignment(TextAlignment.RIGHT)
        )

        document.close()
        return file
    }

    /**
     * Genera y abre el PDF con el visor instalado en el dispositivo.
     */
    fun generarYAbrir(estado: FichaCostoState, filas: List<FilaCosto>) {
        val file = generar(estado, filas)
        val uri  = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file,
        )
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/pdf")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(Intent.createChooser(intent, "Abrir PDF con…"))
    }
}
