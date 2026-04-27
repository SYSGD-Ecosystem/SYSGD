package cu.lazaroysr96.sysgdcont.ui.main.screens

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.repository.DocumentCategory
import cu.lazaroysr96.sysgdcont.data.repository.StoredDocument
import cu.lazaroysr96.sysgdcont.viewmodel.DocumentosViewModel
import java.text.DateFormat
import java.util.Date
import kotlin.math.max

@Composable
fun DocumentosScreen(viewModel: DocumentosViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var pendingExport by remember { mutableStateOf<StoredDocument?>(null) }

    LaunchedEffect(Unit) {
        viewModel.refresh()
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        val document = pendingExport
        pendingExport = null
        if (granted && document != null) {
            viewModel.exportDocument(document)
        } else if (!granted) {
            viewModel.clearError()
        }
    }

    LaunchedEffect(uiState.openIntent) {
        uiState.openIntent?.let { intent ->
            runCatching { context.startActivity(intent) }
            viewModel.clearOpenIntent()
        }
    }

    LaunchedEffect(uiState.shareIntent) {
        uiState.shareIntent?.let { intent ->
            runCatching { context.startActivity(intent) }
            viewModel.clearShareIntent()
        }
    }

    val documentsByCategory = uiState.documentos.groupBy { it.category }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Documentos SYSGD", style = MaterialTheme.typography.titleLarge)
                            Text(
                                "Aquí se muestran facturas, informes y PDFs generados por la app. Puedes abrirlos, compartirlos o exportarlos a Descargas/SYSGD.",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                        IconButton(onClick = viewModel::refresh) {
                            Icon(Icons.Default.Refresh, contentDescription = "Actualizar")
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        AssistChip(onClick = {}, label = { Text("${uiState.documentos.size} archivos") })
                    }
                }
            }
        }

        if (uiState.isLoading) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        }

        if (!uiState.isLoading && uiState.documentos.isEmpty()) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        "Todavía no hay documentos guardados en la carpeta de SYSGD.",
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }

        uiState.message?.let { message ->
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Text(
                        message,
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onTertiaryContainer
                    )
                }
            }
        }

        uiState.error?.let { error ->
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Text(
                        error,
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
        }

        DocumentCategory.values().forEach { category ->
            val docs = documentsByCategory[category].orEmpty()
            if (docs.isNotEmpty()) {
                item {
                    Text(
                        category.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                items(docs, key = { it.absolutePath }) { document ->
                    DocumentCard(
                        document = document,
                        onOpen = { viewModel.openDocument(document) },
                        onShare = { viewModel.shareDocument(document) },
                        onExport = {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                                viewModel.exportDocument(document)
                            } else {
                                val granted = ContextCompat.checkSelfPermission(
                                    context,
                                    Manifest.permission.WRITE_EXTERNAL_STORAGE
                                ) == PackageManager.PERMISSION_GRANTED

                                if (granted) {
                                    viewModel.exportDocument(document)
                                } else {
                                    pendingExport = document
                                    permissionLauncher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun DocumentCard(
    document: StoredDocument,
    onOpen: () -> Unit,
    onShare: () -> Unit,
    onExport: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(document.displayName, style = MaterialTheme.typography.titleSmall)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                buildString {
                    append(formatBytes(document.sizeBytes))
                    append(" · ")
                    append(DateFormat.getDateTimeInstance().format(Date(document.lastModified)))
                    if (document.isPublicDownload) {
                        append(" · Descargas")
                    } else {
                        append(" · Carpeta privada de la app")
                    }
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AssistChip(
                    onClick = onOpen,
                    label = { Text("Ver") },
                    leadingIcon = { Icon(Icons.Default.Visibility, contentDescription = null) }
                )
                AssistChip(
                    onClick = onShare,
                    label = { Text("Compartir") },
                    leadingIcon = { Icon(Icons.Default.Share, contentDescription = null) }
                )
                AssistChip(
                    onClick = onExport,
                    label = { Text("Exportar") },
                    leadingIcon = { Icon(Icons.Default.Download, contentDescription = null) }
                )
            }
        }
    }
}

private fun formatBytes(size: Long): String {
    if (size < 1024) return "$size B"
    val kb = size / 1024.0
    if (kb < 1024) return "${"%.1f".format(kb)} KB"
    val mb = kb / 1024.0
    return "${"%.1f".format(max(0.1, mb))} MB"
}
