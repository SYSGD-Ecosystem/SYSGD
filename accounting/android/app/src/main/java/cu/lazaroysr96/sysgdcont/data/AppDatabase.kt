package cu.lazaroysr96.sysgdcont.data

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import cu.lazaroysr96.sysgdcont.data.dao.ProductoDao
import cu.lazaroysr96.sysgdcont.data.dao.VentaDao
import cu.lazaroysr96.sysgdcont.data.dao.ProductoCompraDao
import cu.lazaroysr96.sysgdcont.data.dao.CompraDao
import cu.lazaroysr96.sysgdcont.data.dao.ItemInventarioDao
import cu.lazaroysr96.sysgdcont.data.dao.TarjetaDao
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.model.Venta
import cu.lazaroysr96.sysgdcont.data.model.ProductoCompra
import cu.lazaroysr96.sysgdcont.data.model.Compra
import cu.lazaroysr96.sysgdcont.data.model.LineaCompra
import cu.lazaroysr96.sysgdcont.data.model.ItemInventario
import cu.lazaroysr96.sysgdcont.data.model.Tarjeta

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


val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(database: androidx.sqlite.db.SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE lineas_venta RENAME TO lineas_venta_old")
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `lineas_venta` (
                `id` TEXT NOT NULL,
                `ventaId` TEXT NOT NULL,
                `productoId` TEXT NOT NULL,
                `nombreProducto` TEXT NOT NULL,
                `precioUnitario` REAL NOT NULL,
                `cantidad` REAL NOT NULL,
                PRIMARY KEY (`id`),
                FOREIGN KEY (`ventaId`) REFERENCES `ventas`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE RESTRICT
            )
        """.trimIndent())
        database.execSQL("INSERT INTO lineas_venta SELECT id, ventaId, productoId, nombreProducto, precioUnitario, cantidad FROM lineas_venta_old")
        database.execSQL("DROP TABLE lineas_venta_old")
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_lineas_venta_ventaId` ON `lineas_venta` (`ventaId`)")
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_lineas_venta_productoId` ON `lineas_venta` (`productoId`)")

        database.execSQL("ALTER TABLE lineas_compra RENAME TO lineas_compra_old")
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `lineas_compra` (
                `id` TEXT NOT NULL,
                `compraId` TEXT NOT NULL,
                `productoId` TEXT NOT NULL,
                `nombreProducto` TEXT NOT NULL,
                `precioUnitario` REAL NOT NULL,
                `cantidad` REAL NOT NULL,
                PRIMARY KEY (`id`),
                FOREIGN KEY (`compraId`) REFERENCES `compras`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`productoId`) REFERENCES `productos_compra`(`id`) ON DELETE RESTRICT
            )
        """.trimIndent())
        database.execSQL("INSERT INTO lineas_compra SELECT id, compraId, productoId, nombreProducto, precioUnitario, cantidad FROM lineas_compra_old")
        database.execSQL("DROP TABLE lineas_compra_old")
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_lineas_compra_compraId` ON `lineas_compra` (`compraId`)")
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_lineas_compra_productoId` ON `lineas_compra` (`productoId`)")
    }
}

// En AppDatabase.kt, agregar:
val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(database: androidx.sqlite.db.SupportSQLiteDatabase) {
        // Tabla items_inventario
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `items_inventario` (
                `id` TEXT NOT NULL,
                `productoId` TEXT NOT NULL,
                `tipoProducto` TEXT NOT NULL,
                `stockDisponible` REAL NOT NULL DEFAULT 0.0,
                `modoStock` TEXT NOT NULL DEFAULT 'ILIMITADO',
                `productosVinculadosIds` TEXT NOT NULL DEFAULT '[]',
                `ratiosConversion` TEXT NOT NULL DEFAULT '[]',
                `ultimaActualizacion` TEXT NOT NULL DEFAULT '',
                PRIMARY KEY (`id`)
            )
        """.trimIndent())
        database.execSQL(
            "CREATE INDEX IF NOT EXISTS `index_items_inventario_productoId` ON `items_inventario` (`productoId`)"
        )

        // Tabla tarjetas
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `tarjetas` (
                `id` TEXT NOT NULL,
                `nombre` TEXT NOT NULL,
                `numero` TEXT NOT NULL,
                `telefono` TEXT NOT NULL,
                `esFavorita` INTEGER NOT NULL DEFAULT 0,
                `createdAt` TEXT NOT NULL,
                PRIMARY KEY (`id`)
            )
        """.trimIndent())
    }
}

@Database(
    entities = [
        Producto::class,
        Venta::class,
        LineaVenta::class,
        ProductoCompra::class,
        Compra::class,
        LineaCompra::class,
        ItemInventario::class,
        Tarjeta::class
    ],
    version = 4,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productoDao(): ProductoDao
    abstract fun ventaDao(): VentaDao
    abstract fun productoCompraDao(): ProductoCompraDao
    abstract fun compraDao(): CompraDao
    abstract fun itemInventarioDao(): ItemInventarioDao
    abstract fun tarjetaDao(): TarjetaDao
}
