package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.TributoRow
import cu.lazaroysr96.sysgdcont.data.repository.LedgerConstants
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TributosScreen(viewModel: LedgerViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var selectedMonthIndex by remember { mutableStateOf(0) }
    var expanded by remember { mutableStateOf(false) }

    val currentTributo = if (selectedMonthIndex < uiState.registro.tributos.size) {
        uiState.registro.tributos[selectedMonthIndex]
    } else {
        TributoRow(mes = LedgerConstants.monthLabels[LedgerConstants.MONTHS[selectedMonthIndex]] ?: "")
    }

    var ventas by remember(currentTributo) { mutableStateOf(currentTributo.ventas) }
    var fuerza by remember(currentTributo) { mutableStateOf(currentTributo.fuerza) }
    var sellos by remember(currentTributo) { mutableStateOf(currentTributo.sellos) }
    var anuncios by remember(currentTributo) { mutableStateOf(currentTributo.anuncios) }
    var css20 by remember(currentTributo) { mutableStateOf(currentTributo.css20) }
    var css14 by remember(currentTributo) { mutableStateOf(currentTributo.css14) }
    var otros by remember(currentTributo) { mutableStateOf(currentTributo.otros) }
    var restauracion by remember(currentTributo) { mutableStateOf(currentTributo.restauracion) }
    var arrendamiento by remember(currentTributo) { mutableStateOf(currentTributo.arrendamiento) }
    var exonerado by remember(currentTributo) { mutableStateOf(currentTributo.exonerado) }
    var otrosMFP by remember(currentTributo) { mutableStateOf(currentTributo.otrosMFP) }
    var cuotaMensual by remember(currentTributo) { mutableStateOf(currentTributo.cuotaMensual) }

    Scaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text("Tributos y Otros Gastos", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(16.dp))

            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded }
            ) {
                OutlinedTextField(
                    value = LedgerConstants.monthLabels[LedgerConstants.MONTHS[selectedMonthIndex]] ?: "",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Mes") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                    modifier = Modifier.fillMaxWidth().menuAnchor()
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    LedgerConstants.MONTHS.forEachIndexed { index, month ->
                        DropdownMenuItem(
                            text = { Text(LedgerConstants.monthLabels[month] ?: month) },
                            onClick = {
                                selectedMonthIndex = index
                                expanded = false
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            Text("Tributos Pagados (Deducibles)", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = ventas,
                onValueChange = { ventas = it },
                label = { Text("Impuesto Ventas/Servicios (10%)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = css14,
                onValueChange = { css14 = it },
                label = { Text("Contribución Seguridad Social (14%)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = fuerza,
                onValueChange = { fuerza = it },
                label = { Text("Imp. Fuerza de Trabajo") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = sellos,
                onValueChange = { sellos = it },
                label = { Text("Imp. Documentos y Sellos") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = css20,
                onValueChange = { css20 = it },
                label = { Text("Contribución Seg. Social (20%)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = anuncios,
                onValueChange = { anuncios = it },
                label = { Text("Tasa Radicación Anuncios") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = otros,
                onValueChange = { otros = it },
                label = { Text("Otros Tributos") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Spacer(modifier = Modifier.height(24.dp))
            Text("Otros Gastos Deducibles", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = cuotaMensual,
                onValueChange = { cuotaMensual = it },
                label = { Text("Cuota Mensual (5%)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = arrendamiento,
                onValueChange = { arrendamiento = it },
                label = { Text("Pago Arrendamiento (Estado)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = restauracion,
                onValueChange = { restauracion = it },
                label = { Text("Contribución Restauración") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = exonerado,
                onValueChange = { exonerado = it },
                label = { Text("Exonerado (Reparaciones)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = otrosMFP,
                onValueChange = { otrosMFP = it },
                label = { Text("Otros Gastos (MFP)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    viewModel.updateTributos(
                        LedgerConstants.MONTHS[selectedMonthIndex],
                        TributoRow(
                            mes = LedgerConstants.monthLabels[LedgerConstants.MONTHS[selectedMonthIndex]] ?: "",
                            ventas = ventas,
                            fuerza = fuerza,
                            sellos = sellos,
                            anuncios = anuncios,
                            css20 = css20,
                            css14 = css14,
                            otros = otros,
                            restauracion = restauracion,
                            arrendamiento = arrendamiento,
                            exonerado = exonerado,
                            otrosMFP = otrosMFP,
                            cuotaMensual = cuotaMensual
                        )
                    )
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Guardar")
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
