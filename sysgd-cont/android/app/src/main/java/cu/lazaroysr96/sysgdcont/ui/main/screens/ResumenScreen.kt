package cu.lazaroysr96.sysgdcont.ui.main.screens

import android.content.Context
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel

@Composable
fun ResumenScreen(viewModel: LedgerViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val report = uiState.annualReport
    val context = LocalContext.current

    LaunchedEffect(uiState.pdfIntent) {
        uiState.pdfIntent?.let { intent ->
            try {
                context.startActivity(intent)
            } catch (e: Exception) {
                // Handle error - no PDF viewer app
            }
            viewModel.clearPdfIntent()
        }
    }

    if (report == null) {
        Box(modifier = Modifier.fillMaxSize()) {
            CircularProgressIndicator()
        }
        return
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Text("Resumen ${report.year}", style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(16.dp))
        }

        item {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("BASE IMPONIBLE")
                    Text("${String.format("%.2f", report.baseImponible)} CUP")
                    Text("IMP. ESTIMADO: ${String.format("%.2f", report.impuestoEstimado)} CUP")
                }
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Ingresos")
                Text("${String.format("%.2f", report.totalIngresos)} CUP")
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Gastos")
                Text("${String.format("%.2f", report.totalGastos)} CUP")
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Tributos")
                Text("${String.format("%.2f", report.totalTributos)} CUP")
            }
        }

        item {
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = { viewModel.downloadPdf() },
                modifier = Modifier.fillMaxWidth(),
                enabled = !uiState.isDownloadingPdf
            ) {
                if (uiState.isDownloadingPdf) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Generando PDF...")
                } else {
                    Icon(Icons.Default.Download, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Descargar PDF")
                }
            }
        }

        uiState.pdfError?.let { error ->
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                ) {
                    Text(
                        text = error,
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
        }
    }
}
