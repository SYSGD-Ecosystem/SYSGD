package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.material3.AlertDialog
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel

@Composable
fun CalculadoraScreen(viewModel: LedgerViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var showDialogMargenComercial by rememberSaveable { mutableStateOf(false) }
    var showDialogCosto by rememberSaveable { mutableStateOf(false) }

    LazyColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Text("Calculadora", style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(16.dp))
        }

        item {
            Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors =
                            CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.errorContainer
                            )
            ) {
                Text(
                        text = "La calculadora está en fase experimental.",
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        }

        item {
            Button(
                    onClick = { showDialogMargenComercial = true },
                    modifier = Modifier.fillMaxWidth()
            ) { Text("Calculo de Margen Comercial") }
        }

        item {
            Button(
                    onClick = { showDialogCosto = true },
                    modifier = Modifier.fillMaxWidth()
            ) { Text("Calculo del Costo") }
        }

        if (showDialogMargenComercial) {
            item {
                MargenComercialDialog(
                        onDismiss = { showDialogMargenComercial = false },
                )
            }
        }

        if (showDialogCosto) {
            item {
                CostoProductoDialog(
                        onDismiss = { showDialogCosto = false },
                )
            }
        }
    }
}

@Composable
private fun MargenComercialDialog(
        onDismiss: () -> Unit,
) {

    var precio_compra by remember { mutableStateOf("") }
    val precioCosto = precio_compra.toDoubleOrNull() ?: 0.0

    var precioVentaInput by remember { mutableStateOf("") }
    val precioVenta = precioVentaInput.toDoubleOrNull()

    var cantidadInput by remember { mutableStateOf("") }
    val cantidad = cantidadInput.toDoubleOrNull() ?: 0.0

    val ganancia = if (precioVenta != null && precioCosto > 0) precioVenta - precioCosto else null
    val margenComercial =
            if (precioVenta != null && precioVenta > 0 && precioCosto > 0)
                    ((precioVenta - precioCosto) / precioVenta) * 100
            else null

    val gananciaTotal =
            if (precioVenta != null && precioCosto > 0 && cantidad > 0)
                    (precioVenta - precioCosto) * cantidad
            else null

    val costoTotal = if (precioCosto > 0 && cantidad > 0) (precioCosto) * cantidad else null

    val valorTotal =
            if (precioVenta != null && precioVenta > 0 && cantidad > 0) (precioVenta) * cantidad
            else null

    AlertDialog(
            onDismissRequest = onDismiss,
            title = { Text("Calculo de Margen Comercial") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                            value = precio_compra,
                            onValueChange = { precio_compra = it },
                            label = { Text("Precio de compra") },
                            placeholder = { Text("0.00 CUP") },
                            singleLine = true
                    )

                    OutlinedTextField(
                            value = precioVentaInput,
                            onValueChange = { precioVentaInput = it },
                            label = { Text("Precio de venta") },
                            placeholder = { Text("0.00 CUP") },
                            singleLine = true
                    )

                    OutlinedTextField(
                            value = cantidadInput,
                            onValueChange = { cantidadInput = it },
                            label = { Text("Cantidad") },
                            placeholder = { Text("0") },
                            singleLine = true,
                    )

                    if (ganancia != null && margenComercial != null) {
                        Divider()
                        Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Ganancia:", style = MaterialTheme.typography.bodySmall)
                            Text(
                                    "${"%.2f".format(ganancia)} CUP",
                                    style = MaterialTheme.typography.bodySmall,
                                    color =
                                            if (ganancia >= 0) MaterialTheme.colorScheme.primary
                                            else MaterialTheme.colorScheme.error,
                                    fontWeight = FontWeight.SemiBold
                            )
                        }
                        Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Margen comercial:", style = MaterialTheme.typography.bodySmall)
                            Text(
                                    "${"%.1f".format(margenComercial)}%",
                                    style = MaterialTheme.typography.bodySmall,
                                    color =
                                            if (margenComercial >= 0)
                                                    MaterialTheme.colorScheme.primary
                                            else MaterialTheme.colorScheme.error,
                                    fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    if (ganancia != null &&
                                    margenComercial != null &&
                                    gananciaTotal != null &&
                                    costoTotal != null &&
                                    valorTotal != null
                    ) {
                        Divider()
                        Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Ganancia Total:", style = MaterialTheme.typography.bodySmall)
                            Text(
                                    "${"%.2f".format(gananciaTotal)} CUP",
                                    style = MaterialTheme.typography.bodySmall,
                                    color =
                                            if (gananciaTotal >= 0) MaterialTheme.colorScheme.primary
                                            else MaterialTheme.colorScheme.error,
                                    fontWeight = FontWeight.SemiBold
                            )
                        }


                        Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Costo Total:", style = MaterialTheme.typography.bodySmall)
                            Text(
                                    "${"%.2f".format(costoTotal)} CUP",
                                    style = MaterialTheme.typography.bodySmall,
                                    color =
                                            if (costoTotal >= 0) MaterialTheme.colorScheme.primary
                                            else MaterialTheme.colorScheme.error,
                                    fontWeight = FontWeight.SemiBold
                            )
                        }



                        Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Valor Total de la venta:", style = MaterialTheme.typography.bodySmall)
                            Text(
                                    "${"%.2f".format(valorTotal)} CUP",
                                    style = MaterialTheme.typography.bodySmall,
                                    color =
                                            if (valorTotal >= 0) MaterialTheme.colorScheme.primary
                                            else MaterialTheme.colorScheme.error,
                                    fontWeight = FontWeight.SemiBold
                            )
                        }






                    }
                }
            },
            confirmButton = { TextButton(onClick = onDismiss) { Text("Cerrar") } }
    )
}












// COSTO DE UN PRODUCTO / MARGEN COMERCIAL
@Composable
private fun CostoProductoDialog(
    onDismiss: () -> Unit,
) {
    // --- Entradas ---
    var cantidadInput by remember { mutableStateOf("") }
    val cantidad = cantidadInput.toDoubleOrNull() ?: 0.0

    var precioCostoInput by remember { mutableStateOf("") }
    val precioCosto = precioCostoInput.toDoubleOrNull() ?: 0.0

    var precioTransporteInput by remember { mutableStateOf("") }
    val precioTransporte = precioTransporteInput.toDoubleOrNull() ?: 0.0

    var gastoMODInput by remember { mutableStateOf("") }
    val gastoMOD = gastoMODInput.toDoubleOrNull() ?: 0.0

    var gastoImpuestosInput by remember { mutableStateOf("") }
    val gastoImpuestos = gastoImpuestosInput.toDoubleOrNull() ?: 0.0

    var otrosGastosInput by remember { mutableStateOf("") }
    val otrosGastos = otrosGastosInput.toDoubleOrNull() ?: 0.0

    // Modo A: precio de venta conocido
    var precioVentaInput by remember { mutableStateOf("") }
    val precioVenta = precioVentaInput.toDoubleOrNull()

    // Modo B: margen comercial deseado → calcular precio de venta sugerido
    var margenComercialInput by remember { mutableStateOf("") }
    val margenDeseado = margenComercialInput.toDoubleOrNull()

    // --- Cálculos intermedios ---

    // Costo unitario: precio de compra + gastos proporcionales por unidad
    val gastosAdicionalesUnitarios =
        if (cantidad > 0)
            (precioTransporte + gastoMOD + gastoImpuestos + otrosGastos) / cantidad
        else 0.0

    val costoUnitario = precioCosto + gastosAdicionalesUnitarios

    // Precio de venta sugerido desde margen deseado: PV = CU / (1 - margen/100)
    val precioVentaSugerido: Double? =
        if (margenDeseado != null && margenDeseado > 0.0 && margenDeseado < 100.0 && costoUnitario > 0)
            costoUnitario / (1.0 - margenDeseado / 100.0)
        else null

    // Precio de venta efectivo: el manual tiene prioridad; si no, el sugerido
    val pvEfectivo: Double? =
        if (precioVenta != null && precioVenta > 0) precioVenta
        else precioVentaSugerido

    // --- Resultados ---
    val gananciaUnitaria: Double? =
        if (pvEfectivo != null && costoUnitario > 0) pvEfectivo - costoUnitario else null

    val margenReal: Double? =
        if (pvEfectivo != null && pvEfectivo > 0 && costoUnitario > 0)
            ((pvEfectivo - costoUnitario) / pvEfectivo) * 100
        else null

    val costoTotal: Double? =
        if (costoUnitario > 0 && cantidad > 0) costoUnitario * cantidad else null

    val gananciaTotal: Double? =
        if (gananciaUnitaria != null && cantidad > 0) gananciaUnitaria * cantidad else null

    val valorTotalVenta: Double? =
        if (pvEfectivo != null && pvEfectivo > 0 && cantidad > 0) pvEfectivo * cantidad else null

    // --- UI ---
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Costo de Producto") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier
                .verticalScroll(rememberScrollState())) {

                // Sección: Compra
                Text("Compra", style = MaterialTheme.typography.labelLarge)

                OutlinedTextField(
                    value = cantidadInput,
                    onValueChange = { cantidadInput = it },
                    label = { Text("Cantidad a comprar") },
                    placeholder = { Text("0") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = precioCostoInput,
                    onValueChange = { precioCostoInput = it },
                    label = { Text("Precio de compra unitario") },
                    placeholder = { Text("0.00 CUP") },
                    singleLine = true
                )

                // Sección: Gastos adicionales (totales del lote)
                Text("Gastos del lote", style = MaterialTheme.typography.labelLarge)

                OutlinedTextField(
                    value = precioTransporteInput,
                    onValueChange = { precioTransporteInput = it },
                    label = { Text("Gastos de Transportación") },
                    placeholder = { Text("0.00 CUP") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = gastoMODInput,
                    onValueChange = { gastoMODInput = it },
                    label = { Text("Mano de Obra Directa") },
                    placeholder = { Text("0.00 CUP") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = gastoImpuestosInput,
                    onValueChange = { gastoImpuestosInput = it },
                    label = { Text("Gastos por Impuestos") },
                    placeholder = { Text("0.00 CUP") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = otrosGastosInput,
                    onValueChange = { otrosGastosInput = it },
                    label = { Text("Otros Gastos") },
                    placeholder = { Text("0.00 CUP") },
                    singleLine = true
                )

                // Costo unitario calculado (siempre visible si hay datos)
                if (costoUnitario > 0) {
                    Divider()
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Costo unitario real:", style = MaterialTheme.typography.bodySmall)
                        Text(
                            "${"%.2f".format(costoUnitario)} CUP",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }

                // Sección: Precio de venta
                Text("Venta", style = MaterialTheme.typography.labelLarge)

                OutlinedTextField(
                    value = precioVentaInput,
                    onValueChange = {
                        precioVentaInput = it
                        // Limpiar margen si el usuario escribe precio manualmente
                        if (it.isNotEmpty()) margenComercialInput = ""
                    },
                    label = { Text("Precio de venta (manual)") },
                    placeholder = { Text("0.00 CUP") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = margenComercialInput,
                    onValueChange = {
                        margenComercialInput = it
                        // Limpiar precio manual si el usuario escribe margen
                        if (it.isNotEmpty()) precioVentaInput = ""
                    },
                    label = { Text("% Margen comercial deseado") },
                    placeholder = { Text("Ej: 30") },
                    singleLine = true
                )

                // Precio de venta sugerido (modo margen)
                if (precioVentaSugerido != null && precioVenta == null) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Precio sugerido:", style = MaterialTheme.typography.bodySmall)
                        Text(
                            "${"%.2f".format(precioVentaSugerido)} CUP",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.tertiary
                        )
                    }
                }

                // Resultados por unidad
                if (gananciaUnitaria != null && margenReal != null) {
                    Divider()
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Ganancia unitaria:", style = MaterialTheme.typography.bodySmall)
                        Text(
                            "${"%.2f".format(gananciaUnitaria)} CUP",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (gananciaUnitaria >= 0) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.error,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Margen comercial real:", style = MaterialTheme.typography.bodySmall)
                        Text(
                            "${"%.1f".format(margenReal)}%",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (margenReal >= 0) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.error,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                // Resultados totales del lote
                if (costoTotal != null && gananciaTotal != null && valorTotalVenta != null) {
                    Divider()
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Costo Total:", style = MaterialTheme.typography.bodySmall)
                        Text(
                            "${"%.2f".format(costoTotal)} CUP",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Ganancia Total:", style = MaterialTheme.typography.bodySmall)
                        Text(
                            "${"%.2f".format(gananciaTotal)} CUP",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (gananciaTotal >= 0) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.error,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Valor Total de la venta:", style = MaterialTheme.typography.bodySmall)
                        Text(
                            "${"%.2f".format(valorTotalVenta)} CUP",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (valorTotalVenta >= 0) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.error,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Cerrar") } }
    )
}
