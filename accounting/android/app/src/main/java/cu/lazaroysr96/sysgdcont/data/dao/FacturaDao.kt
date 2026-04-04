package cu.lazaroysr96.sysgdcont.data.dao

import androidx.room.*
import cu.lazaroysr96.sysgdcont.data.model.Factura
import cu.lazaroysr96.sysgdcont.data.model.LineaFactura
import kotlinx.coroutines.flow.Flow

@Dao
interface FacturaDao {
    @Query("SELECT * FROM facturas ORDER BY numero DESC")
    fun getAll(): Flow<List<Factura>>

    @Query("SELECT * FROM facturas WHERE id = :id")
    suspend fun getById(id: String): Factura?

    @Query("SELECT * FROM facturas WHERE ventaId = :ventaId")
    suspend fun getByVentaId(ventaId: String): Factura?

    @Query("SELECT MAX(numero) FROM facturas")
    suspend fun getUltimoNumero(): Int?

    @Query("SELECT * FROM lineas_factura WHERE facturaId = :facturaId")
    suspend fun getLineasDeFactura(facturaId: String): List<LineaFactura>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFactura(factura: Factura)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLineasFactura(lineas: List<LineaFactura>)

    @Transaction
    suspend fun insertFacturaCompleta(factura: Factura, lineas: List<LineaFactura>) {
        insertFactura(factura)
        insertLineasFactura(lineas)
    }

    @Update
    suspend fun updateFactura(factura: Factura)

    @Query("UPDATE facturas SET pdfPath = :pdfPath WHERE id = :id")
    suspend fun updatePdfPath(id: String, pdfPath: String)

    @Delete
    suspend fun deleteFactura(factura: Factura)
}
