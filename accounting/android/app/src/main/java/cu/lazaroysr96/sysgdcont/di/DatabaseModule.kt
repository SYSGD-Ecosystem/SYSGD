package cu.lazaroysr96.sysgdcont.di

import android.content.Context
import androidx.room.Room
import cu.lazaroysr96.sysgdcont.data.AppDatabase
import cu.lazaroysr96.sysgdcont.data.MIGRATION_1_2
import cu.lazaroysr96.sysgdcont.data.MIGRATION_2_3
import cu.lazaroysr96.sysgdcont.data.dao.ProductoDao
import cu.lazaroysr96.sysgdcont.data.dao.VentaDao
import cu.lazaroysr96.sysgdcont.data.dao.ProductoCompraDao
import cu.lazaroysr96.sysgdcont.data.dao.CompraDao
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
                        .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
            .build()
    }

    @Provides
    @Singleton
    fun provideProductoDao(database: AppDatabase): ProductoDao {
        return database.productoDao()
    }

    @Provides
    @Singleton
    fun provideVentaDao(database: AppDatabase): VentaDao {
        return database.ventaDao()
    }

    @Provides
    @Singleton
    fun provideProductoCompraDao(database: AppDatabase): ProductoCompraDao {
        return database.productoCompraDao()
    }

    @Provides
    @Singleton
    fun provideCompraDao(database: AppDatabase): CompraDao {
        return database.compraDao()
    }
}
