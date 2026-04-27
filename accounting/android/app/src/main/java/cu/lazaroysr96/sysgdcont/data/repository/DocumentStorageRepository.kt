package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import javax.inject.Inject
import javax.inject.Singleton

enum class DocumentCategory(val folderName: String, val title: String) {
    FACTURAS("Facturas", "Facturas"),
    INFORMES("Informes", "Informes"),
    DJ("DJ", "Declaraciones y resúmenes"),
    BACKUPS("Backups", "Backups"),
    CONFIG("Config", "Configuración"),
    TEMP("Temp", "Temporales")
}

data class StoredDocument(
    val absolutePath: String,
    val displayName: String,
    val category: DocumentCategory,
    val mimeType: String,
    val sizeBytes: Long,
    val lastModified: Long,
    val isPublicDownload: Boolean
)

data class ExportedDocument(
    val displayPath: String,
    val uri: Uri? = null
)

@Singleton
class DocumentStorageRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {

    private fun baseAppDocumentsDir(): File {
        val external = context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS)
        return File(external ?: context.filesDir, "SYSGD")
    }

    fun getCategoryDirectory(category: DocumentCategory): File {
        val dir = File(baseAppDocumentsDir(), category.folderName)
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir
    }

    fun createDocumentFile(category: DocumentCategory, fileName: String): File {
        val safeName = sanitizeFileName(fileName)
        val dir = getCategoryDirectory(category)
        return File(dir, safeName)
    }

    fun saveBytes(category: DocumentCategory, fileName: String, content: ByteArray): File {
        val file = createDocumentFile(category, fileName)
        FileOutputStream(file).use { output -> output.write(content) }
        return file
    }

    fun saveStream(category: DocumentCategory, fileName: String, input: InputStream): File {
        val file = createDocumentFile(category, fileName)
        FileOutputStream(file).use { output -> input.copyTo(output) }
        return file
    }

    fun saveText(category: DocumentCategory, fileName: String, content: String): File {
        return saveBytes(category, fileName, content.toByteArray(Charsets.UTF_8))
    }

    fun listDocuments(): List<StoredDocument> {
        val results = linkedMapOf<String, StoredDocument>()

        DocumentCategory.values().forEach { category ->
            getCategoryDirectory(category)
                .listFiles()
                ?.filter { it.isFile }
                ?.forEach { file ->
                    results[file.absolutePath] = file.toStoredDocument(category, isPublic = false)
                }
        }

        collectLegacyDocuments().forEach { doc ->
            results.putIfAbsent(doc.absolutePath, doc)
        }

        return results.values.sortedByDescending { it.lastModified }
    }

    fun buildViewIntent(file: File, mimeType: String = mimeTypeFor(file.name)): Intent {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        return Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, mimeType)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    }

    fun buildShareIntent(file: File, mimeType: String = mimeTypeFor(file.name)): Intent {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            type = mimeType
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        return Intent.createChooser(sendIntent, "Compartir documento").apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    }

    fun fileFromStoredDocument(document: StoredDocument): File = File(document.absolutePath)

    fun exportToDownloads(document: StoredDocument): ExportedDocument {
        val sourceFile = fileFromStoredDocument(document)
        if (!sourceFile.exists()) {
            throw IllegalStateException("El archivo ya no existe")
        }

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            exportWithMediaStore(sourceFile, document)
        } else {
            exportWithLegacyDownloads(sourceFile, document)
        }
    }

    private fun exportWithMediaStore(sourceFile: File, document: StoredDocument): ExportedDocument {
        val values = android.content.ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, sourceFile.name)
            put(MediaStore.MediaColumns.MIME_TYPE, document.mimeType)
            put(
                MediaStore.MediaColumns.RELATIVE_PATH,
                "${Environment.DIRECTORY_DOWNLOADS}/SYSGD/${document.category.folderName}"
            )
            put(MediaStore.MediaColumns.IS_PENDING, 1)
        }

        val resolver = context.contentResolver
        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
            ?: throw IllegalStateException("No se pudo crear el documento en Descargas")

        resolver.openOutputStream(uri)?.use { output ->
            sourceFile.inputStream().use { input -> input.copyTo(output) }
        } ?: throw IllegalStateException("No se pudo escribir el documento exportado")

        values.clear()
        values.put(MediaStore.MediaColumns.IS_PENDING, 0)
        resolver.update(uri, values, null, null)

        return ExportedDocument(
            displayPath = "Descargas/SYSGD/${document.category.folderName}/${sourceFile.name}",
            uri = uri
        )
    }

    private fun exportWithLegacyDownloads(sourceFile: File, document: StoredDocument): ExportedDocument {
        val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        val targetDir = File(downloadsDir, "SYSGD/${document.category.folderName}")
        if (!targetDir.exists()) {
            targetDir.mkdirs()
        }

        val targetFile = File(targetDir, sourceFile.name)
        sourceFile.copyTo(targetFile, overwrite = true)
        return ExportedDocument(
            displayPath = "Descargas/SYSGD/${document.category.folderName}/${targetFile.name}"
        )
    }

    private fun collectLegacyDocuments(): List<StoredDocument> {
        val docs = mutableListOf<StoredDocument>()

        val legacyReportsDir = File(context.getExternalFilesDir(null), "reportes")
        legacyReportsDir.listFiles()
            ?.filter { it.isFile && it.extension.equals("pdf", ignoreCase = true) }
            ?.forEach { file ->
                docs += file.toStoredDocument(DocumentCategory.INFORMES, isPublic = false)
            }

        val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        downloadsDir.listFiles()
            ?.filter { it.isFile }
            ?.forEach { file ->
                val category = when {
                    file.name.startsWith("factura_", ignoreCase = true) -> DocumentCategory.FACTURAS
                    file.name.startsWith("Registro_TCP_", ignoreCase = true) -> DocumentCategory.DJ
                    else -> null
                } ?: return@forEach
                docs += file.toStoredDocument(category, isPublic = true)
            }

        return docs
    }

    private fun File.toStoredDocument(category: DocumentCategory, isPublic: Boolean): StoredDocument {
        return StoredDocument(
            absolutePath = absolutePath,
            displayName = name,
            category = category,
            mimeType = mimeTypeFor(name),
            sizeBytes = length(),
            lastModified = lastModified(),
            isPublicDownload = isPublic
        )
    }

    private fun sanitizeFileName(input: String): String {
        return input.replace(Regex("[^A-Za-z0-9._-]"), "_")
    }

    private fun mimeTypeFor(fileName: String): String {
        return when (fileName.substringAfterLast('.', "").lowercase()) {
            "pdf" -> "application/pdf"
            "json" -> "application/json"
            else -> "application/octet-stream"
        }
    }
}
