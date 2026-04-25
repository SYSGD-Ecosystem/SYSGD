package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Intent
import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.itextpdf.io.image.ImageDataFactory
import com.itextpdf.kernel.colors.DeviceGray
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.borders.Border
import com.itextpdf.layout.borders.SolidBorder
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.element.Image
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.properties.HorizontalAlignment
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import cu.lazaroysr96.sysgdcont.data.model.Compra
import cu.lazaroysr96.sysgdcont.data.model.FormaPago
import cu.lazaroysr96.sysgdcont.data.model.LineaCompra
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Venta
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.io.File
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlin.math.roundToLong
import javax.inject.Inject
import javax.inject.Singleton

private val Context.facturaDataStore: DataStore<Preferences> by preferencesDataStore(name = "factura_prefs")

data class ConfiguracionFacturacion(
    val nombreEmpresa: String = "",
    val nombreVendedor: String = "",
    val correoVendedor: String = "",
    val telefonoVendedor: String = "",
    val direccionVendedor: String = "",
    val logoUri: String? = null,
    val firmaVendedorUri: String? = null
)

data class DatosClienteFactura(
    val nombre: String,
    val ci: String,
    val correo: String = "",
    val direccion: String = "",
    val telefono: String = ""
)

data class FacturaGenerada(
    val pdfPath: String,
    val intent: Intent
)

private data class LineaFacturaPdf(
    val codigo: String,
    val descripcion: String,
    val unidadMedida: String,
    val cantidad: Double,
    val precioUnitario: Double,
    val importe: Double
)

@Singleton
class FacturaRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val ledgerRepository: LedgerRepository,
    private val inventarioRepository: InventarioRepository,
    private val documentStorageRepository: DocumentStorageRepository
) {
    companion object {
        private val NOMBRE_EMPRESA_KEY = stringPreferencesKey("nombre_empresa")
        private val NOMBRE_VENDEDOR_KEY = stringPreferencesKey("nombre_vendedor")
        private val CORREO_VENDEDOR_KEY = stringPreferencesKey("correo_vendedor")
        private val TELEFONO_VENDEDOR_KEY = stringPreferencesKey("telefono_vendedor")
        private val DIRECCION_VENDEDOR_KEY = stringPreferencesKey("direccion_vendedor")
        private val LOGO_URI_KEY = stringPreferencesKey("logo_uri")
        private val FIRMA_VENDEDOR_URI_KEY = stringPreferencesKey("firma_vendedor_uri")
    }

    private var ultimoNumero = 0

    val configuracionFacturacion: Flow<ConfiguracionFacturacion> = context.facturaDataStore.data.map { prefs ->
        ConfiguracionFacturacion(
            nombreEmpresa = prefs[NOMBRE_EMPRESA_KEY].orEmpty(),
            nombreVendedor = prefs[NOMBRE_VENDEDOR_KEY].orEmpty(),
            correoVendedor = prefs[CORREO_VENDEDOR_KEY].orEmpty(),
            telefonoVendedor = prefs[TELEFONO_VENDEDOR_KEY].orEmpty(),
            direccionVendedor = prefs[DIRECCION_VENDEDOR_KEY].orEmpty(),
            logoUri = prefs[LOGO_URI_KEY],
            firmaVendedorUri = prefs[FIRMA_VENDEDOR_URI_KEY]
        )
    }

    suspend fun guardarConfiguracionFacturacion(config: ConfiguracionFacturacion) {
        context.facturaDataStore.edit { prefs ->
            guardarValor(prefs, NOMBRE_EMPRESA_KEY, config.nombreEmpresa)
            guardarValor(prefs, NOMBRE_VENDEDOR_KEY, config.nombreVendedor)
            guardarValor(prefs, CORREO_VENDEDOR_KEY, config.correoVendedor)
            guardarValor(prefs, TELEFONO_VENDEDOR_KEY, config.telefonoVendedor)
            guardarValor(prefs, DIRECCION_VENDEDOR_KEY, config.direccionVendedor)
            guardarValor(prefs, LOGO_URI_KEY, config.logoUri)
            guardarValor(prefs, FIRMA_VENDEDOR_URI_KEY, config.firmaVendedorUri)
        }
    }

    suspend fun getConfiguracionFacturacionActual(): ConfiguracionFacturacion {
        val guardada = configuracionFacturacion.first()
        val nombrePorDefecto = ledgerRepository.getRegistro().generales.nombre.ifBlank { "Mi establecimiento" }
        return guardada.copy(
            nombreEmpresa = guardada.nombreEmpresa.ifBlank { nombrePorDefecto },
            nombreVendedor = guardada.nombreVendedor.ifBlank { nombrePorDefecto }
        )
    }

    suspend fun generarFacturaPdf(
        venta: Venta,
        lineasVenta: List<LineaVenta>,
        datosCliente: DatosClienteFactura,
        formaPago: FormaPago,
        idTransaccion: String?,
        nota: String,
        firmaClienteUri: String?
    ): FacturaGenerada {
        ultimoNumero++
        val numeroFactura = ultimoNumero
        val configuracion = getConfiguracionFacturacionActual()
        val productos = inventarioRepository.getProductosPorIds(lineasVenta.map { it.productoId })

        return generarPdf(
            numero = numeroFactura,
            venta = venta,
            lineas = lineasVenta,
            productos = productos,
            datosCliente = datosCliente,
            formaPago = formaPago,
            idTransaccion = idTransaccion,
            nota = nota,
            firmaClienteUri = firmaClienteUri,
            configuracion = configuracion
        )
    }

    private fun generarPdf(
        numero: Int,
        venta: Venta,
        lineas: List<LineaVenta>,
        productos: Map<String, cu.lazaroysr96.sysgdcont.data.model.Producto>,
        datosCliente: DatosClienteFactura,
        formaPago: FormaPago,
        idTransaccion: String?,
        nota: String,
        firmaClienteUri: String?,
        configuracion: ConfiguracionFacturacion
    ): FacturaGenerada {
        val fileName = "factura_${numero}_${venta.fecha.replace("-", "")}.pdf"
        val pdfFile = documentStorageRepository.createDocumentFile(DocumentCategory.FACTURAS, fileName)

        val writer = PdfWriter(pdfFile)
        val pdfDoc = PdfDocument(writer)
        val document = Document(pdfDoc)

        document.add(crearEncabezadoFactura(numero, venta, configuracion))

        document.add(
            Paragraph("DATOS DEL CLIENTE")
                .setFontSize(11f)
                .setBold()
        )
        document.add(Paragraph("Nombre: ${datosCliente.nombre}").setFontSize(10f))
        document.add(Paragraph("CI: ${datosCliente.ci}").setFontSize(10f))
        if (datosCliente.correo.isNotBlank()) {
            document.add(Paragraph("Correo: ${datosCliente.correo}").setFontSize(10f))
        }
        if (datosCliente.direccion.isNotBlank()) {
            document.add(Paragraph("Dirección: ${datosCliente.direccion}").setFontSize(10f))
        }
        if (datosCliente.telefono.isNotBlank()) {
            document.add(Paragraph("Teléfono: ${datosCliente.telefono}").setFontSize(10f))
        }

        document.add(Paragraph("\n"))

        val lineasFactura = lineas.map { linea ->
            val producto = productos[linea.productoId]
            LineaFacturaPdf(
                codigo = producto?.id
                    ?.replace("-", "")
                    ?.take(8)
                    ?.uppercase()
                    ?.ifBlank { "S/C" }
                    ?: "S/C",
                descripcion = linea.nombreProducto,
                unidadMedida = producto?.unidad?.ifBlank { "und" } ?: "und",
                cantidad = linea.cantidad,
                precioUnitario = linea.precioUnitario,
                importe = linea.cantidad * linea.precioUnitario
            )
        }

        val table = Table(UnitValue.createPercentArray(floatArrayOf(14f, 38f, 10f, 12f, 13f, 13f)))
            .useAllAvailableWidth()

        table.addHeaderCell(Cell().add(Paragraph("Código").setBold()))
        table.addHeaderCell(Cell().add(Paragraph("Descripción").setBold()))
        table.addHeaderCell(Cell().add(Paragraph("U/M").setBold()).setTextAlignment(TextAlignment.CENTER))
        table.addHeaderCell(Cell().add(Paragraph("Cantidad").setBold()).setTextAlignment(TextAlignment.RIGHT))
        table.addHeaderCell(Cell().add(Paragraph("Precio").setBold()).setTextAlignment(TextAlignment.RIGHT))
        table.addHeaderCell(Cell().add(Paragraph("Importe").setBold()).setTextAlignment(TextAlignment.RIGHT))

        lineasFactura.forEach { linea ->
            table.addCell(Cell().add(Paragraph(linea.codigo).setFontSize(9f)))
            table.addCell(Cell().add(Paragraph(linea.descripcion).setFontSize(9f)))
            table.addCell(Cell().add(Paragraph(linea.unidadMedida).setFontSize(9f).setTextAlignment(TextAlignment.CENTER)))
            table.addCell(Cell().add(Paragraph("%.2f".format(linea.cantidad)).setFontSize(9f).setTextAlignment(TextAlignment.RIGHT)))
            table.addCell(Cell().add(Paragraph("%.2f".format(linea.precioUnitario)).setFontSize(9f).setTextAlignment(TextAlignment.RIGHT)))
            table.addCell(Cell().add(Paragraph("%.2f".format(linea.importe)).setFontSize(9f).setTextAlignment(TextAlignment.RIGHT)))
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

        if (nota.isNotBlank()) {
            document.add(Paragraph("\n"))
            document.add(Paragraph("Nota").setBold().setFontSize(11f))
            document.add(Paragraph(nota).setFontSize(10f))
        }

        document.add(Paragraph("\n\n"))
        document.add(
            crearTablaFirmas(
                firmaVendedorUri = configuracion.firmaVendedorUri,
                nombreVendedor = configuracion.nombreVendedor,
                firmaClienteUri = firmaClienteUri,
                nombreCliente = datosCliente.nombre
            )
        )

        document.close()

        return FacturaGenerada(
            pdfPath = pdfFile.absolutePath,
            intent = buildPdfIntent(pdfFile)
        )
    }

    suspend fun generarReporteVentasPdf(desde: LocalDate, hasta: LocalDate): String {
        require(!desde.isAfter(hasta)) { "La fecha inicial no puede ser mayor que la final" }
        val operaciones = inventarioRepository.getVentasConLineasEnRango(desde.toString(), hasta.toString())
        if (operaciones.isEmpty()) {
            throw IllegalStateException("No hay ventas registradas en el periodo seleccionado")
        }

        val nombre = getConfiguracionFacturacionActual().nombreEmpresa
        val pdfFile = documentStorageRepository.createDocumentFile(
            DocumentCategory.INFORMES,
            "reporte_ventas_${desde}_${hasta}.pdf"
        )
        val writer = PdfWriter(pdfFile)
        val pdfDoc = PdfDocument(writer)
        val document = Document(pdfDoc)

        document.add(
            Paragraph("REPORTE DE VENTAS")
                .setFontSize(18f)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
        )
        document.add(Paragraph(nombre).setTextAlignment(TextAlignment.CENTER).setFontSize(11f))
        document.add(Paragraph("Periodo: $desde a $hasta").setFontSize(10f))
        document.add(Paragraph("Operaciones: ${operaciones.size}").setFontSize(10f))
        document.add(Paragraph("\n"))

        val table = Table(UnitValue.createPercentArray(floatArrayOf(15f, 10f, 45f, 10f, 10f, 10f)))
            .useAllAvailableWidth()
        listOf("Fecha", "Hora", "Producto", "Cant.", "Precio", "Importe").forEach { titulo ->
            table.addHeaderCell(Cell().add(Paragraph(titulo).setBold()))
        }

        var total = 0.0
        operaciones.forEach { (venta, lineas) ->
            lineas.forEach { linea ->
                val subtotal = linea.subtotal
                total += subtotal
                agregarFilaOperacionVenta(table, venta, linea)
            }
        }

        document.add(table)
        document.add(Paragraph("\n"))
        document.add(
            Paragraph("TOTAL VENTAS: %.2f CUP".format(total))
                .setBold()
                .setTextAlignment(TextAlignment.RIGHT)
        )
        document.close()
        return pdfFile.absolutePath
    }

    suspend fun generarReporteComprasPdf(desde: LocalDate, hasta: LocalDate): String {
        require(!desde.isAfter(hasta)) { "La fecha inicial no puede ser mayor que la final" }
        val operaciones = inventarioRepository.getComprasConLineasEnRango(desde.toString(), hasta.toString())
        if (operaciones.isEmpty()) {
            throw IllegalStateException("No hay compras registradas en el periodo seleccionado")
        }

        val nombre = getConfiguracionFacturacionActual().nombreEmpresa
        val pdfFile = documentStorageRepository.createDocumentFile(
            DocumentCategory.INFORMES,
            "reporte_compras_${desde}_${hasta}.pdf"
        )
        val writer = PdfWriter(pdfFile)
        val pdfDoc = PdfDocument(writer)
        val document = Document(pdfDoc)

        document.add(
            Paragraph("REPORTE DE COMPRAS")
                .setFontSize(18f)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
        )
        document.add(Paragraph(nombre).setTextAlignment(TextAlignment.CENTER).setFontSize(11f))
        document.add(Paragraph("Periodo: $desde a $hasta").setFontSize(10f))
        document.add(Paragraph("Operaciones: ${operaciones.size}").setFontSize(10f))
        document.add(Paragraph("\n"))

        val table = Table(UnitValue.createPercentArray(floatArrayOf(15f, 10f, 45f, 10f, 10f, 10f)))
            .useAllAvailableWidth()
        listOf("Fecha", "Hora", "Insumo", "Cant.", "Precio", "Importe").forEach { titulo ->
            table.addHeaderCell(Cell().add(Paragraph(titulo).setBold()))
        }

        var total = 0.0
        operaciones.forEach { (compra, lineas) ->
            lineas.forEach { linea ->
                val subtotal = linea.subtotal
                total += subtotal
                agregarFilaOperacionCompra(table, compra, linea)
            }
        }

        document.add(table)
        document.add(Paragraph("\n"))
        document.add(
            Paragraph("TOTAL COMPRAS: %.2f CUP".format(total))
                .setBold()
                .setTextAlignment(TextAlignment.RIGHT)
        )
        document.close()
        return pdfFile.absolutePath
    }

    suspend fun generarInformeInventarioPdf(): String {
        val items = inventarioRepository.getItemsInventarioParaReporte()
        if (items.isEmpty()) {
            throw IllegalStateException("No hay productos en el almacén para generar el informe")
        }

        val productos = inventarioRepository.getProductosPorIds(items.map { it.productoId })
        val almacenes = inventarioRepository.getAlmacenesPorIds(items.map { it.almacenId })
        val nombre = getConfiguracionFacturacionActual().nombreEmpresa
        val fecha = LocalDate.now()
        val pdfFile = documentStorageRepository.createDocumentFile(
            DocumentCategory.INFORMES,
            "informe_inventario_${fecha}.pdf"
        )
        val writer = PdfWriter(pdfFile)
        val pdfDoc = PdfDocument(writer)
        val document = Document(pdfDoc)

        document.add(
            Paragraph("INFORME DE INVENTARIO")
                .setFontSize(18f)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
        )
        document.add(Paragraph(nombre).setTextAlignment(TextAlignment.CENTER).setFontSize(11f))
        document.add(Paragraph("Fecha: $fecha").setFontSize(10f))
        document.add(Paragraph("Productos activos en almacén: ${items.size}").setFontSize(10f))
        document.add(Paragraph("\n"))

        val table = Table(UnitValue.createPercentArray(floatArrayOf(10f, 34f, 17f, 16f, 12f, 10f)))
            .useAllAvailableWidth()
        listOf("Código", "Producto", "Almacén", "Modo", "Unidad", "Stock").forEach { titulo ->
            table.addHeaderCell(Cell().add(Paragraph(titulo).setBold()))
        }

        items.forEachIndexed { index, item ->
            val producto = productos[item.productoId]
            val nombreProducto = producto?.nombre ?: item.productoId
            val unidad = producto?.unidad?.ifBlank { "und" } ?: "und"
            val almacen = almacenes[item.almacenId]?.nombre ?: "Almacén principal"
            val stockTexto = when {
                item.stockDisponible.isInfinite() -> "Ilimitado"
                else -> {
                    val valor = item.stockDisponible
                    if ((valor * 100).roundToLong() % 100L == 0L) {
                        valor.toInt().toString()
                    } else {
                        "%.2f".format(valor)
                    }
                }
            }

            table.addCell(Cell().add(Paragraph((index + 1).toString()).setFontSize(9f)))
            table.addCell(Cell().add(Paragraph(nombreProducto).setFontSize(9f)))
            table.addCell(Cell().add(Paragraph(almacen).setFontSize(9f)))
            table.addCell(Cell().add(Paragraph(item.modoStock).setFontSize(9f)))
            table.addCell(Cell().add(Paragraph(unidad).setFontSize(9f)))
            table.addCell(
                Cell().add(
                    Paragraph(stockTexto).setFontSize(9f).setTextAlignment(TextAlignment.RIGHT)
                )
            )
        }

        document.add(table)
        document.close()
        return pdfFile.absolutePath
    }

    private fun agregarFilaOperacionVenta(table: Table, venta: Venta, linea: LineaVenta) {
        table.addCell(Cell().add(Paragraph(venta.fecha).setFontSize(9f)))
        table.addCell(Cell().add(Paragraph(venta.hora).setFontSize(9f)))
        table.addCell(Cell().add(Paragraph(linea.nombreProducto).setFontSize(9f)))
        table.addCell(Cell().add(Paragraph("%.2f".format(linea.cantidad)).setFontSize(9f).setTextAlignment(TextAlignment.RIGHT)))
        table.addCell(Cell().add(Paragraph("%.2f".format(linea.precioUnitario)).setFontSize(9f).setTextAlignment(TextAlignment.RIGHT)))
        table.addCell(Cell().add(Paragraph("%.2f".format(linea.subtotal)).setFontSize(9f).setTextAlignment(TextAlignment.RIGHT)))
    }

    private fun agregarFilaOperacionCompra(table: Table, compra: Compra, linea: LineaCompra) {
        table.addCell(Cell().add(Paragraph(compra.fecha).setFontSize(9f)))
        table.addCell(Cell().add(Paragraph(compra.hora).setFontSize(9f)))
        table.addCell(Cell().add(Paragraph(linea.nombreProducto).setFontSize(9f)))
        table.addCell(Cell().add(Paragraph("%.2f".format(linea.cantidad)).setFontSize(9f).setTextAlignment(TextAlignment.RIGHT)))
        table.addCell(Cell().add(Paragraph("%.2f".format(linea.precioUnitario)).setFontSize(9f).setTextAlignment(TextAlignment.RIGHT)))
        table.addCell(Cell().add(Paragraph("%.2f".format(linea.subtotal)).setFontSize(9f).setTextAlignment(TextAlignment.RIGHT)))
    }

    private fun guardarValor(
        prefs: androidx.datastore.preferences.core.MutablePreferences,
        key: androidx.datastore.preferences.core.Preferences.Key<String>,
        value: String?
    ) {
        val limpio = value?.trim().orEmpty()
        if (limpio.isBlank()) {
            prefs.remove(key)
        } else {
            prefs[key] = limpio
        }
    }

    private fun cargarImagenDesdeUri(uri: String?): Image? {
        if (uri.isNullOrBlank()) return null
        return runCatching {
            val bytes = context.contentResolver.openInputStream(android.net.Uri.parse(uri))?.use { it.readBytes() }
                ?: return null
            Image(ImageDataFactory.create(bytes))
        }.getOrNull()
    }

    private fun crearTablaFirmas(
        firmaVendedorUri: String?,
        nombreVendedor: String,
        firmaClienteUri: String?,
        nombreCliente: String
    ): Table {
        val table = Table(UnitValue.createPercentArray(floatArrayOf(50f, 50f))).useAllAvailableWidth()
        table.addCell(crearCeldaFirma("Firma del vendedor", nombreVendedor, firmaVendedorUri))
        table.addCell(crearCeldaFirma("Firma del cliente", nombreCliente, firmaClienteUri))
        return table
    }

    private fun crearCeldaFirma(
        titulo: String,
        nombre: String,
        firmaUri: String?
    ): Cell {
        val cell = Cell().setTextAlignment(TextAlignment.CENTER)
        cargarImagenDesdeUri(firmaUri)?.let { firma ->
            firma.scaleToFit(120f, 60f)
            firma.setHorizontalAlignment(HorizontalAlignment.CENTER)
            cell.add(firma)
        } ?: cell.add(Paragraph("\n\n"))

        cell.add(Paragraph("_________________________").setFontSize(10f))
        cell.add(Paragraph(titulo).setFontSize(9f))
        if (nombre.isNotBlank()) {
            cell.add(Paragraph(nombre).setFontSize(9f))
        }
        return cell
    }

    private fun crearEncabezadoFactura(
        numero: Int,
        venta: Venta,
        configuracion: ConfiguracionFacturacion
    ): Table {
        val table = Table(UnitValue.createPercentArray(floatArrayOf(68f, 32f))).useAllAvailableWidth()
        table.setBorder(Border.NO_BORDER)

        val infoCell = Cell().setBorder(Border.NO_BORDER).setPaddingRight(12f)
        infoCell.add(
            Paragraph(configuracion.nombreEmpresa)
                .setBold()
                .setFontSize(18f)
        )
        if (configuracion.nombreVendedor.isNotBlank() && configuracion.nombreVendedor != configuracion.nombreEmpresa) {
            infoCell.add(
                Paragraph("Vendedor: ${configuracion.nombreVendedor}")
                    .setFontSize(10f)
                    .setMarginTop(4f)
            )
        }
        if (configuracion.direccionVendedor.isNotBlank()) {
            infoCell.add(
                Paragraph("Dirección: ${configuracion.direccionVendedor}")
                    .setFontSize(10f)
                    .setMarginTop(4f)
            )
        }

        val contacto = buildList {
            if (configuracion.telefonoVendedor.isNotBlank()) {
                add("Teléfono: ${configuracion.telefonoVendedor}")
            }
            if (configuracion.correoVendedor.isNotBlank()) {
                add("Correo: ${configuracion.correoVendedor}")
            }
        }.joinToString("   ")

        if (contacto.isNotBlank()) {
            infoCell.add(
                Paragraph(contacto)
                    .setFontSize(10f)
                    .setMarginTop(2f)
            )
        }

        infoCell.add(
            Paragraph("\nFACTURA")
                .setBold()
                .setFontSize(16f)
                .setMarginTop(10f)
        )
        infoCell.add(
            Paragraph("No. $numero")
                .setFontSize(11f)
                .setMarginTop(2f)
        )
        infoCell.add(
            Paragraph("Fecha: ${venta.fecha}  Hora: ${venta.hora}")
                .setFontSize(10f)
                .setMarginTop(2f)
        )

        val logoCell = Cell()
            .setBorder(Border.NO_BORDER)
            .setTextAlignment(TextAlignment.RIGHT)
            .setVerticalAlignment(com.itextpdf.layout.properties.VerticalAlignment.TOP)

        cargarImagenDesdeUri(configuracion.logoUri)?.let { logo ->
            logo.scaleToFit(110f, 80f)
            logo.setHorizontalAlignment(HorizontalAlignment.RIGHT)
            logoCell.add(logo)
        }

        table.addCell(infoCell)
        table.addCell(logoCell)

        val wrapper = Table(UnitValue.createPercentArray(floatArrayOf(100f))).useAllAvailableWidth()
        wrapper.setBorder(Border.NO_BORDER)
        wrapper.addCell(
            Cell()
                .setBorder(Border.NO_BORDER)
                .add(table)
                .setPaddingBottom(8f)
        )
        wrapper.addCell(
            Cell()
                .setBorderTop(SolidBorder(DeviceGray(0.75f), 1f))
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER)
                .setPadding(0f)
                .setHeight(1f)
        )
        return wrapper
    }

    private fun buildPdfIntent(file: File): Intent {
        return documentStorageRepository.buildViewIntent(file, "application/pdf")
    }
}
