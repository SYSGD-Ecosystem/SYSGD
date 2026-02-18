package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.repository.LedgerConstants
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IngresosScreen(viewModel: LedgerViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var showAddDialog by remember { mutableStateOf(false) }
    var selectedMonthForDialog by remember { mutableStateOf("ENE") }

    Scaffold(floatingActionButton = {
        FloatingActionButton(onClick = { showAddDialog = true }) {
            Icon(Icons.Default.Add, contentDescription = "Agregar")
        }
    }) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Text("Ingresos", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(8.dp))

            val totalIngresos = uiState.annualReport?.totalIngresos ?: 0.0
            Text("Total: ${String.format("%.2f", totalIngresos)} CUP")

            Spacer(modifier = Modifier.height(16.dp))

            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(LedgerConstants.MONTHS) { month ->
                    val entries = uiState.registro.ingresos[month] ?: emptyList()
                    val total = entries.sumOf { it.importe.toDoubleOrNull() ?: 0.0 }

                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(LedgerConstants.monthLabels[month] ?: month)
                                Text("${String.format("%.2f", total)} CUP")
                            }
                            entries.forEach { entry ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Día ${entry.dia}", style = MaterialTheme.typography.bodySmall)
                                    Text("${entry.importe} CUP", style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        var selectedMonth by remember { mutableStateOf(selectedMonthForDialog) }
        var dia by remember { mutableStateOf("") }
        var importe by remember { mutableStateOf("") }
        var expanded by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Agregar Ingreso") },
            text = {
                Column {
                    ExposedDropdownMenuBox(
                        expanded = expanded,
                        onExpandedChange = { expanded = !expanded }
                    ) {
                        OutlinedTextField(
                            value = LedgerConstants.monthLabels[selectedMonth] ?: selectedMonth,
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
                            LedgerConstants.MONTHS.forEach { month ->
                                DropdownMenuItem(
                                    text = { Text(LedgerConstants.monthLabels[month] ?: month) },
                                    onClick = {
                                        selectedMonth = month
                                        expanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = dia,
                        onValueChange = { dia = it.filter { c -> c.isDigit() }.take(2) },
                        label = { Text("Día (1-31)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = importe,
                        onValueChange = { importe = it },
                        label = { Text("Importe (CUP)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val diaInt = dia.toIntOrNull()
                        val importeDouble = importe.toDoubleOrNull()
                        if (diaInt != null && importeDouble != null && diaInt in 1..31 && importeDouble > 0) {
                            viewModel.addIngreso(selectedMonth, diaInt, importeDouble)
                            showAddDialog = false
                        }
                    },
                    enabled = dia.toIntOrNull() != null && importe.toDoubleOrNull() != null
                ) {
                    Text("Agregar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Cancelar")
                }
            }
        )
    }
}
