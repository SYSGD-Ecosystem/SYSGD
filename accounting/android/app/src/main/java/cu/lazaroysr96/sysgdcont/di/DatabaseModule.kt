package cu.lazaroysr96.sysgdcont.di

import android.content.Context
import androidx.room.Room
import cu.lazaroysr96.sysgdcont.data.AppDatabase
import cu.lazaroysr96.sysgdcont.data.MIGRATION_1_2
import cu.lazaroysr96.sysgdcont.data.MIGRATION_2_3
import cu.lazaroysr96.sysgdcont.data.MIGRATION_3_4
import cu.lazaroysr96.sysgdcont.data.dao.CatalogoCompraDao
import cu.lazaroysr96.sysgdcont.data.dao.CatalogoVentaDao
import cu.lazaroysr96.sysgdcont.data.dao.ProductoDao
import cu.lazaroysr96.sysgdcont.data.dao.VentaDao
import cu.lazaroysr96.sysgdcont.data.dao.CompraDao
import cu.lazaroysr96.sysgdcont.data.dao.ItemInventarioDao
import cu.lazaroysr96.sysgdcont.data.dao.AlmacenDao
import cu.lazaroysr96.sysgdcont.data.dao.TarjetaDao
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
            .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4)
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
    fun provideAlmacenDao(database: AppDatabase): AlmacenDao {
        return database.almacenDao()
    }

    @Provides
    @Singleton
    fun provideTarjetaDao(database: AppDatabase): TarjetaDao {
        return database.tarjetaDao()
    }
}
