package cu.lazaroysr96.sysgdcont.ui.main.screens

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.graphics.Bitmap
import android.util.Size
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import cu.lazaroysr96.sysgdcont.data.model.Tarjeta
import cu.lazaroysr96.sysgdcont.viewmodel.TarjetaViewModel
import java.util.concurrent.Executors

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun TarjetaScreen(viewModel: TarjetaViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.snackbarMessage) {
        uiState.snackbarMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearSnackbar()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Tarjetas") },
                actions = {
                    IconButton(onClick = { viewModel.showScanDialog(true) }) {
                        Icon(Icons.Default.QrCodeScanner, "Escanear QR")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.showAddDialog(true) },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, "Agregar tarjeta")
            }
        }
    ) { padding ->
        if (uiState.tarjetas.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.CreditCard,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "No hay tarjetas guardadas",
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Text(
                        "Toca + para agregar",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(uiState.tarjetas) { tarjeta ->
                    TarjetaCard(
                        tarjeta = tarjeta,
                        onToggleFavorita = { viewModel.toggleFavorita(tarjeta) },
                        onCopyNumero = {
                            copyToClipboard(context, "Número", tarjeta.numero)
                        },
                        onCopyTelefono = {
                            copyToClipboard(context, "Teléfono", tarjeta.telefono)
                        },
                        onGenerateQR = { viewModel.showQRDialog(tarjeta) },
                        onDelete = { viewModel.eliminarTarjeta(tarjeta.id) }
                    )
                }
            }
        }
    }

    if (uiState.showAddDialog) {
        AgregarTarjetaDialog(
            onDismiss = { viewModel.showAddDialog(false) },
            onConfirm = { nombre, numero, telefono ->
                viewModel.agregarTarjeta(nombre, numero, telefono)
            }
        )
    }

    if (uiState.showQRDialog && uiState.tarjetaSeleccionada != null) {
        QRDialog(
            tarjeta = uiState.tarjetaSeleccionada!!,
            onDismiss = { viewModel.showQRDialog(null) }
        )
    }

    if (uiState.showScanDialog) {
        EscanearQRDialog(
            onDismiss = { viewModel.showScanDialog(false) },
            onScanSuccess = { content ->
                viewModel.guardarDesdeQR(content)
            }
        )
    }
}

private fun copyToClipboard(context: Context, label: String, text: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    clipboard.setPrimaryClip(ClipData.newPlainText(label, text))
    Toast.makeText(context, "$label copiado", Toast.LENGTH_SHORT).show()
}

@Composable
private fun TarjetaCard(
    tarjeta: Tarjeta,
    onToggleFavorita: () -> Unit,
    onCopyNumero: () -> Unit,
    onCopyTelefono: () -> Unit,
    onGenerateQR: () -> Unit,
    onDelete: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { expanded = !expanded }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        Icons.Default.CreditCard,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Column {
                        Text(
                            tarjeta.nombre,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "•••• ${tarjeta.numero.takeLast(4)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onToggleFavorita) {
                        Icon(
                            if (tarjeta.esFavorita) Icons.Default.Star else Icons.Default.StarBorder,
                            contentDescription = "Favorito",
                            tint = if (tarjeta.esFavorita) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Icon(
                        if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (expanded) "Contraer" else "Expandir"
                    )
                }
            }

            if (expanded) {
                Spacer(modifier = Modifier.height(12.dp))
                Divider()
                Spacer(modifier = Modifier.height(12.dp))

                InfoField(
                    label = "Número",
                    value = tarjeta.numero,
                    onCopy = onCopyNumero
                )

                Spacer(modifier = Modifier.height(8.dp))

                InfoField(
                    label = "Teléfono",
                    value = tarjeta.telefono,
                    onCopy = onCopyTelefono
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onGenerateQR,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.QrCode, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Ver QR")
                    }
                    OutlinedButton(
                        onClick = onDelete,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Eliminar")
                    }
                }
            }
        }
    }
}

@Composable
private fun InfoField(
    label: String,
    value: String,
    onCopy: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyLarge
            )
        }
        IconButton(onClick = onCopy) {
            Icon(
                Icons.Default.ContentCopy,
                contentDescription = "Copiar $label",
                tint = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
private fun AgregarTarjetaDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, String, String) -> Unit
) {
    var nombre by remember { mutableStateOf("") }
    var numero by remember { mutableStateOf("") }
    var telefono by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nueva Tarjeta") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = nombre,
                    onValueChange = { nombre = it },
                    label = { Text("Nombre") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = numero,
                    onValueChange = { numero = it },
                    label = { Text("Número de tarjeta") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = telefono,
                    onValueChange = { telefono = it },
                    label = { Text("Teléfono") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(nombre, numero, telefono) },
                enabled = nombre.isNotBlank() && numero.isNotBlank() && telefono.isNotBlank()
            ) {
                Text("Guardar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}

@Composable
private fun QRDialog(
    tarjeta: Tarjeta,
    onDismiss: () -> Unit
) {
    val qrContent = "${tarjeta.nombre}|${tarjeta.numero}|${tarjeta.telefono}"
    val qrBitmap = remember(qrContent) { generateQRBitmap(qrContent) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("QR de ${tarjeta.nombre}") },
        text = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                qrBitmap?.let {
                    Image(
                        bitmap = it.asImageBitmap(),
                        contentDescription = "QR Code",
                        modifier = Modifier.size(200.dp)
                    )
                }
                Divider()
                Text(
                    "Número: ${tarjeta.numero}",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    "Teléfono: ${tarjeta.telefono}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cerrar")
            }
        }
    )
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
private fun EscanearQRDialog(
    onDismiss: () -> Unit,
    onScanSuccess: (String) -> Unit
) {
    val context = LocalContext.current
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)
    var scannedValue by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Escanear QR de Tarjeta") },
        text = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (cameraPermissionState.status.isGranted) {
                    if (scannedValue != null) {
                        Text(
                            "QR detectado: $scannedValue",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    } else {
                        QRScannerView(
                            onQRDetected = { value ->
                                scannedValue = value
                            }
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Apunta la cámara al QR",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Text(
                            "Formato: nombre|numero|telefono",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    Icon(
                        Icons.Default.CameraAlt,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Se requiere permiso de cámara para escanear",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        },
        confirmButton = {
            if (cameraPermissionState.status.isGranted && scannedValue != null) {
                TextButton(onClick = {
                    scannedValue?.let { onScanSuccess(it) }
                }) {
                    Text("Guardar")
                }
            } else if (!cameraPermissionState.status.isGranted) {
                TextButton(onClick = {
                    cameraPermissionState.launchPermissionRequest()
                }) {
                    Text("Conceder Permiso")
                }
            } else {
                TextButton(onClick = onDismiss) {
                    Text("Cerrar")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}

@Composable
private fun QRScannerView(
    onQRDetected: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var isScanning by remember { mutableStateOf(true) }

    Box(
        modifier = Modifier
            .size(250.dp)
            .background(MaterialTheme.colorScheme.surfaceVariant)
    ) {
        AndroidView(
            factory = { ctx ->
                androidx.camera.view.PreviewView(ctx).apply {
                    implementationMode = androidx.camera.view.PreviewView.ImplementationMode.COMPATIBLE
                }
            },
            modifier = Modifier.fillMaxSize(),
            update = { previewView ->
                if (!isScanning) return@AndroidView

                val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val imageAnalysis = ImageAnalysis.Builder()
                        .setTargetResolution(Size(1280, 720))
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()

                    val executor = Executors.newSingleThreadExecutor()
                    val scanner = BarcodeScanning.getClient()

                    imageAnalysis.setAnalyzer(executor) { imageProxy ->
                        @androidx.camera.core.ExperimentalGetImage
                        val mediaImage = imageProxy.image
                        if (mediaImage != null && isScanning) {
                            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                            scanner.process(image)
                                .addOnSuccessListener { barcodes ->
                                    for (barcode in barcodes) {
                                        if (barcode.valueType == Barcode.TYPE_TEXT || barcode.valueType == Barcode.TYPE_UNKNOWN) {
                                            barcode.rawValue?.let { value ->
                                                isScanning = false
                                                onQRDetected(value)
                                            }
                                        }
                                    }
                                }
                                .addOnCompleteListener {
                                    imageProxy.close()
                                }
                        } else {
                            imageProxy.close()
                        }
                    }

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            CameraSelector.DEFAULT_BACK_CAMERA,
                            preview,
                            imageAnalysis
                        )
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }, context.mainExecutor)
            }
        )
    }
}

private fun generateQRBitmap(content: String, size: Int = 512): Bitmap? {
    return try {
        val hints = mapOf(EncodeHintType.CHARACTER_SET to "UTF-8")
        val matrix = QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, size, size, hints)
        val width = matrix.width
        val height = matrix.height
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565)
        for (x in 0 until width) {
            for (y in 0 until height) {
                bitmap.setPixel(x, y, if (matrix[x, y]) android.graphics.Color.BLACK else android.graphics.Color.WHITE)
            }
        }
        bitmap
    } catch (e: Exception) {
        null
    }
}
