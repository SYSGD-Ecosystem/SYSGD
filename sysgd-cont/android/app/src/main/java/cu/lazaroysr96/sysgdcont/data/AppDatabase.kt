package cu.lazaroysr96.sysgdcont.data

import androidx.room.Database
import androidx.room.RoomDatabase
import cu.lazaroysr96.sysgdcont.data.dao.ProductoDao
import cu.lazaroysr96.sysgdcont.data.dao.VentaDao
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.model.Venta

@Database(
    entities = [
        Producto::class,
        Venta::class,
        LineaVenta::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productoDao(): ProductoDao
    abstract fun ventaDao(): VentaDao
}
