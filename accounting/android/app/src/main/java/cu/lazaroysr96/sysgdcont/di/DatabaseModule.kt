package cu.lazaroysr96.sysgdcont.di

import android.content.Context
import androidx.room.Room
import cu.lazaroysr96.sysgdcont.data.AppDatabase
import cu.lazaroysr96.sysgdcont.data.MIGRATION_1_2
import cu.lazaroysr96.sysgdcont.data.MIGRATION_2_3
import cu.lazaroysr96.sysgdcont.data.MIGRATION_3_4
import cu.lazaroysr96.sysgdcont.data.MIGRATION_4_5
import cu.lazaroysr96.sysgdcont.data.MIGRATION_5_6
import cu.lazaroysr96.sysgdcont.data.MIGRATION_6_7
import cu.lazaroysr96.sysgdcont.data.MIGRATION_7_8
import cu.lazaroysr96.sysgdcont.data.MIGRATION_8_9
import cu.lazaroysr96.sysgdcont.data.MIGRATION_9_10
import cu.lazaroysr96.sysgdcont.data.MIGRATION_10_11
import cu.lazaroysr96.sysgdcont.data.MIGRATION_11_12
import cu.lazaroysr96.sysgdcont.data.dao.CajaBancoDao
import cu.lazaroysr96.sysgdcont.data.dao.CatalogoCompraDao
import cu.lazaroysr96.sysgdcont.data.dao.CatalogoVentaDao
import cu.lazaroysr96.sysgdcont.data.dao.ProductoDao
import cu.lazaroysr96.sysgdcont.data.dao.PrecioProductoDao
import cu.lazaroysr96.sysgdcont.data.dao.VentaDao
import cu.lazaroysr96.sysgdcont.data.dao.CompraDao
import cu.lazaroysr96.sysgdcont.data.dao.ItemInventarioDao
import cu.lazaroysr96.sysgdcont.data.dao.InventarioVinculoDao
import cu.lazaroysr96.sysgdcont.data.dao.MovimientoInventarioDao
import cu.lazaroysr96.sysgdcont.data.dao.AlmacenDao
import cu.lazaroysr96.sysgdcont.data.dao.TarjetaDao
import cu.lazaroysr96.sysgdcont.data.dao.TercerosDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "sysgd_cont_database"
        )
            .addMigrations(
                MIGRATION_1_2,
                MIGRATION_2_3,
                MIGRATION_3_4,
                MIGRATION_4_5,
                MIGRATION_5_6,
                MIGRATION_6_7,
                MIGRATION_7_8,
                MIGRATION_8_9,
                MIGRATION_9_10,
                MIGRATION_10_11,
                MIGRATION_11_12
            )
            .build()
    }

    @Provides
    @Singleton
    fun provideProductoDao(database: AppDatabase): ProductoDao {
        return database.productoDao()
    }

    @Provides
    @Singleton
    fun provideCatalogoVentaDao(database: AppDatabase): CatalogoVentaDao {
        return database.catalogoVentaDao()
    }

    @Provides
    @Singleton
    fun provideCatalogoCompraDao(database: AppDatabase): CatalogoCompraDao {
        return database.catalogoCompraDao()
    }

    @Provides
    @Singleton
    fun providePrecioProductoDao(database: AppDatabase): PrecioProductoDao {
        return database.precioProductoDao()
    }

    @Provides
    @Singleton
    fun provideVentaDao(database: AppDatabase): VentaDao {
        return database.ventaDao()
    }

    @Provides
    @Singleton
    fun provideCompraDao(database: AppDatabase): CompraDao {
        return database.compraDao()
    }

    
    @Provides
    @Singleton
    fun provideItemInventarioDao(database: AppDatabase): ItemInventarioDao {
        return database.itemInventarioDao()
    }

    @Provides
    @Singleton
    fun provideInventarioVinculoDao(database: AppDatabase): InventarioVinculoDao {
        return database.inventarioVinculoDao()
    }

    @Provides
    @Singleton
    fun provideMovimientoInventarioDao(database: AppDatabase): MovimientoInventarioDao {
        return database.movimientoInventarioDao()
    }

    @Provides
    @Singleton
    fun provideAlmacenDao(database: AppDatabase): AlmacenDao {
        return database.almacenDao()
    }

    @Provides
    @Singleton
    fun provideTarjetaDao(database: AppDatabase): TarjetaDao {
        return database.tarjetaDao()
    }

    @Provides
    @Singleton
    fun provideTercerosDao(database: AppDatabase): TercerosDao {
        return database.tercerosDao()
    }

    @Provides
    @Singleton
    fun provideCajaBancoDao(database: AppDatabase): CajaBancoDao {
        return database.cajaBancoDao()
    }
}
