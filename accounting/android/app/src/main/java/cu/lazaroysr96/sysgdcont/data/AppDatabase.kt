package cu.lazaroysr96.sysgdcont.data

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import cu.lazaroysr96.sysgdcont.data.dao.CatalogoCompraDao
import cu.lazaroysr96.sysgdcont.data.dao.CatalogoVentaDao
import cu.lazaroysr96.sysgdcont.data.dao.ProductoDao
import cu.lazaroysr96.sysgdcont.data.dao.VentaDao
import cu.lazaroysr96.sysgdcont.data.dao.CompraDao
import cu.lazaroysr96.sysgdcont.data.dao.ItemInventarioDao
import cu.lazaroysr96.sysgdcont.data.dao.AlmacenDao
import cu.lazaroysr96.sysgdcont.data.dao.TarjetaDao
import cu.lazaroysr96.sysgdcont.data.model.LineaVenta
import cu.lazaroysr96.sysgdcont.data.model.Almacen
import cu.lazaroysr96.sysgdcont.data.model.CatalogoCompra
import cu.lazaroysr96.sysgdcont.data.model.CatalogoVenta
import cu.lazaroysr96.sysgdcont.data.model.Producto
import cu.lazaroysr96.sysgdcont.data.model.Venta
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

val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(database: androidx.sqlite.db.SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE productos RENAME TO productos_old")
        database.execSQL("ALTER TABLE ventas RENAME TO ventas_old")
        database.execSQL("ALTER TABLE lineas_venta RENAME TO lineas_venta_old")
        database.execSQL("ALTER TABLE compras RENAME TO compras_old")
        database.execSQL("ALTER TABLE lineas_compra RENAME TO lineas_compra_old")

        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `productos` (
                `id` TEXT NOT NULL,
                `nombre` TEXT NOT NULL,
                `emoji` TEXT NOT NULL DEFAULT '📦',
                `unidad` TEXT NOT NULL DEFAULT 'und',
                `activo` INTEGER NOT NULL DEFAULT 1,
                PRIMARY KEY (`id`)
            )
        """.trimIndent())

        database.execSQL("""
            INSERT INTO productos (id, nombre, emoji, unidad, activo)
            SELECT id, nombre, emoji, unidad, activo
            FROM productos_old
        """.trimIndent())

        database.execSQL("""
            INSERT OR IGNORE INTO productos (id, nombre, emoji, unidad, activo)
            SELECT id, nombre, emoji, unidad, activo
            FROM productos_compra
        """.trimIndent())

        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `almacenes` (
                `id` TEXT NOT NULL,
                `nombre` TEXT NOT NULL,
                `principal` INTEGER NOT NULL DEFAULT 0,
                `activo` INTEGER NOT NULL DEFAULT 1,
                PRIMARY KEY (`id`)
            )
        """.trimIndent())
        database.execSQL("""
            INSERT INTO almacenes (id, nombre, principal, activo)
            VALUES ('almacen_principal', 'Almacén principal', 1, 1)
        """.trimIndent())

        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `catalogo_ventas` (
                `id` TEXT NOT NULL,
                `productoId` TEXT NOT NULL,
                `precioReferencia` REAL NOT NULL,
                `almacenId` TEXT NOT NULL DEFAULT 'almacen_principal',
                `activo` INTEGER NOT NULL DEFAULT 1,
                PRIMARY KEY (`id`),
                FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`almacenId`) REFERENCES `almacenes`(`id`) ON DELETE RESTRICT
            )
        """.trimIndent())
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_catalogo_ventas_productoId` ON `catalogo_ventas` (`productoId`)")
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_catalogo_ventas_almacenId` ON `catalogo_ventas` (`almacenId`)")
        database.execSQL("""
            INSERT INTO catalogo_ventas (id, productoId, precioReferencia, almacenId, activo)
            SELECT 'venta_' || id, id, precio, 'almacen_principal', activo
            FROM productos_old
        """.trimIndent())

        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `catalogo_compras` (
                `id` TEXT NOT NULL,
                `productoId` TEXT NOT NULL,
                `precioReferencia` REAL NOT NULL,
                `almacenDestinoId` TEXT NOT NULL DEFAULT 'almacen_principal',
                `activo` INTEGER NOT NULL DEFAULT 1,
                PRIMARY KEY (`id`),
                FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`almacenDestinoId`) REFERENCES `almacenes`(`id`) ON DELETE RESTRICT
            )
        """.trimIndent())
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_catalogo_compras_productoId` ON `catalogo_compras` (`productoId`)")
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_catalogo_compras_almacenDestinoId` ON `catalogo_compras` (`almacenDestinoId`)")
        database.execSQL("""
            INSERT INTO catalogo_compras (id, productoId, precioReferencia, almacenDestinoId, activo)
            SELECT 'compra_' || id, id, precio, 'almacen_principal', activo
            FROM productos_compra
        """.trimIndent())

        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `items_inventario` (
                `id` TEXT NOT NULL,
                `productoId` TEXT NOT NULL,
                `almacenId` TEXT NOT NULL DEFAULT 'almacen_principal',
                `tipoProducto` TEXT NOT NULL,
                `stockDisponible` REAL NOT NULL DEFAULT 0.0,
                `modoStock` TEXT NOT NULL DEFAULT 'ILIMITADO',
                `productosVinculadosIds` TEXT NOT NULL DEFAULT '[]',
                `ratiosConversion` TEXT NOT NULL DEFAULT '[]',
                `ultimaActualizacion` TEXT NOT NULL DEFAULT '',
                `visibleEnVentas` INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (`id`)
            )
        """.trimIndent())
        database.execSQL("""
            CREATE INDEX IF NOT EXISTS `index_items_inventario_productoId` ON `items_inventario` (`productoId`)
        """.trimIndent())
        database.execSQL("""
            CREATE INDEX IF NOT EXISTS `index_items_inventario_almacenId` ON `items_inventario` (`almacenId`)
        """.trimIndent())

        database.execSQL("""
            INSERT INTO items_inventario (
                id, productoId, almacenId, tipoProducto, stockDisponible, modoStock,
                productosVinculadosIds, ratiosConversion, ultimaActualizacion, visibleEnVentas
            )
            SELECT 
                'stock_almacen_principal_' || id,
                id,
                'almacen_principal',
                'VENTA',
                0.0,
                'ILIMITADO',
                '[]',
                '[]',
                ''
                ,1
            FROM productos_old
            WHERE activo = 1
        """.trimIndent())

        database.execSQL("""
            INSERT OR IGNORE INTO items_inventario (
                id, productoId, almacenId, tipoProducto, stockDisponible, modoStock,
                productosVinculadosIds, ratiosConversion, ultimaActualizacion, visibleEnVentas
            )
            SELECT
                'stock_almacen_principal_' || productoId,
                productoId,
                'almacen_principal',
                'COMPRA',
                SUM(cantidad),
                'MANUAL',
                '[]',
                '[]',
                '',
                0
            FROM lineas_compra_old
            GROUP BY productoId
        """.trimIndent())

        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `ventas` (
                `id` TEXT NOT NULL,
                `fecha` TEXT NOT NULL,
                `hora` TEXT NOT NULL,
                `total` REAL NOT NULL,
                `almacenOrigenId` TEXT NOT NULL DEFAULT 'almacen_principal',
                `anulada` INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (`id`)
            )
        """.trimIndent())
        database.execSQL("""
            INSERT INTO ventas (id, fecha, hora, total, almacenOrigenId, anulada)
            SELECT id, fecha, hora, total, 'almacen_principal', anulada
            FROM ventas_old
        """.trimIndent())

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
        database.execSQL("""
            INSERT INTO lineas_venta (id, ventaId, productoId, nombreProducto, precioUnitario, cantidad)
            SELECT id, ventaId, productoId, nombreProducto, precioUnitario, cantidad
            FROM lineas_venta_old
        """.trimIndent())
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_lineas_venta_ventaId` ON `lineas_venta` (`ventaId`)")
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_lineas_venta_productoId` ON `lineas_venta` (`productoId`)")

        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `compras` (
                `id` TEXT NOT NULL,
                `fecha` TEXT NOT NULL,
                `hora` TEXT NOT NULL,
                `total` REAL NOT NULL,
                `almacenDestinoId` TEXT NOT NULL DEFAULT 'almacen_principal',
                `anulada` INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (`id`)
            )
        """.trimIndent())
        database.execSQL("""
            INSERT INTO compras (id, fecha, hora, total, almacenDestinoId, anulada)
            SELECT id, fecha, hora, total, 'almacen_principal', anulada
            FROM compras_old
        """.trimIndent())

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
                FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE RESTRICT
            )
        """.trimIndent())
        database.execSQL("""
            INSERT INTO lineas_compra (id, compraId, productoId, nombreProducto, precioUnitario, cantidad)
            SELECT id, compraId, productoId, nombreProducto, precioUnitario, cantidad
            FROM lineas_compra_old
        """.trimIndent())
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_lineas_compra_compraId` ON `lineas_compra` (`compraId`)")
        database.execSQL("CREATE INDEX IF NOT EXISTS `index_lineas_compra_productoId` ON `lineas_compra` (`productoId`)")

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

        database.execSQL("DROP TABLE productos_old")
        database.execSQL("DROP TABLE ventas_old")
        database.execSQL("DROP TABLE lineas_venta_old")
        database.execSQL("DROP TABLE compras_old")
        database.execSQL("DROP TABLE lineas_compra_old")
        database.execSQL("DROP TABLE productos_compra")
    }
}

@Database(
    entities = [
        Producto::class,
        CatalogoVenta::class,
        CatalogoCompra::class,
        Almacen::class,
        Venta::class,
        LineaVenta::class,
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
    abstract fun catalogoVentaDao(): CatalogoVentaDao
    abstract fun catalogoCompraDao(): CatalogoCompraDao
    abstract fun ventaDao(): VentaDao
    abstract fun compraDao(): CompraDao
    abstract fun itemInventarioDao(): ItemInventarioDao
    abstract fun almacenDao(): AlmacenDao
    abstract fun tarjetaDao(): TarjetaDao
}
