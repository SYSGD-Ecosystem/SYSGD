package cu.lazaroysr96.sysgdcont.data

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NomenclatorDatabaseHelper @Inject constructor(
    @ApplicationContext
    private val context: Context
) {
    private val databaseName = "database.db"

    fun openDatabase(): SQLiteDatabase {
        val dbFile = context.getDatabasePath(databaseName)
        ensureDatabaseCopied(dbFile)
        return SQLiteDatabase.openDatabase(
            dbFile.path,
            null,
            SQLiteDatabase.OPEN_READONLY
        )
    }

    private fun ensureDatabaseCopied(dbFile: File) {
        if (dbFile.exists()) return

        dbFile.parentFile?.mkdirs()
        context.assets.open(databaseName).use { input ->
            FileOutputStream(dbFile).use { output ->
                input.copyTo(output)
            }
        }
    }
}
