package cu.lazaroysr96.sysgdcont.data

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import cu.lazaroysr96.sysgdcont.data.dao.ProductoDao
import cu.lazaroysr96.sysgdcont.data.dao.VentaDao
import cu.lazaroysr96.sysgdcont.data.dao.ProductoCompraDao
import cu.lazaroysr96.sysgdcont.data.dao.CompraDao
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.model.Venta
import cu.lazaroysr96.sysgdcont.data.model.ProductoCompra
import cu.lazaroysr96.sysgdcont.data.model.Compra
import cu.lazaroysr96.sysgdcont.data.model.LineaCompra

val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: androidx.sqlite.db.SupportSQLiteDatabase) {
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `productos_compra` (
                `id` TEXT NOT NULL,
                `nombre` TEXT NOT NULL,
                `precio` REAL NOT NULL,
                `emoji` TEXT NOT NULL DEFAULT '📦',
                `unidad` TEXT NOT NULL DEFAULT 'und',
                `activo` INTEGER NOT NULL DEFAULT 1,
                PRIMARY KEY (`id`)
            )
        """.trimIndent())
        
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `compras` (
                `id` TEXT NOT NULL,
                `fecha` TEXT NOT NULL,
                `hora` TEXT NOT NULL,
                `total` REAL NOT NULL,
                `anulada` INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (`id`)
            )
        """.trimIndent())
        
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `lineas_compra` (
                `id` TEXT NOT NULL,
                `compraId` TEXT NOT NULL,
                `productoId` TEXT NOT NULL,
                `nombreProducto` TEXT NOT NULL,
                `precioUnitario` REAL NOT NULL,
                `cantidad` INTEGER NOT NULL,
                PRIMARY KEY (`id`),
                FOREIGN KEY (`compraId`) REFERENCES `compras`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`productoId`) REFERENCES `productos_compra`(`id`) ON DELETE RESTRICT
            )
        """.trimIndent())
        
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_lineas_compra_compraId` ON `lineas_compra` (`compraId`)")
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_lineas_compra_productoId` ON `lineas_compra` (`productoId`)")
    }
}

@Database(
    entities = [
        Producto::class,
        Venta::class,
        LineaVenta::class,
        ProductoCompra::class,
        Compra::class,
        LineaCompra::class
    ],
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productoDao(): ProductoDao
    abstract fun ventaDao(): VentaDao
    abstract fun productoCompraDao(): ProductoCompraDao
    abstract fun compraDao(): CompraDao
}
