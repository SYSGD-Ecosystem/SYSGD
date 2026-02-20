package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.DayAmountRow
import cu.lazaroysr96.sysgdcont.data.repository.LedgerConstants
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IngresosScreen(viewModel: LedgerViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var showDialog by remember { mutableStateOf(false) }
    var isEditMode by remember { mutableStateOf(false) }
    var editEntry by remember { mutableStateOf<Pair<String, DayAmountRow>?>(null) }
    var expandedMonths by remember { mutableStateOf(setOf<String>()) }
    var preselectedMonth by remember { mutableStateOf<String?>(null) }
    
    var showDuplicateDialog by remember { mutableStateOf(false) }
    var pendingDuplicateEntry by remember { mutableStateOf<Triple<String, Int, Double>?>(null) }
    var existingImporte by remember { mutableStateOf(0.0) }

    Scaffold(floatingActionButton = {
        FloatingActionButton(onClick = {
            isEditMode = false
            editEntry = null
            preselectedMonth = null
            showDialog = true
        }) {
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
                    val isExpanded = expandedMonths.contains(month)

                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        expandedMonths = if (isExpanded) {
                                            expandedMonths - month
                                        } else {
                                            expandedMonths + month
                                        }
                                    }
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                        contentDescription = null,
                                        modifier = Modifier.size(24.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(LedgerConstants.monthLabels[month] ?: month)
                                }
                                Text("${String.format("%.2f", total)} CUP")
                            }

                            AnimatedVisibility(visible = isExpanded) {
                                Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                                    if (entries.isEmpty()) {
                                        Text(
                                            "Sin registros",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    } else {
                                        entries.sortedBy { it.dia }.forEach { entry ->
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Row {
                                                    Text(
                                                        "Día ${entry.dia}",
                                                        style = MaterialTheme.typography.bodySmall
                                                    )
                                                    Spacer(modifier = Modifier.width(16.dp))
                                                    Text(
                                                        "${entry.importe} CUP",
                                                        style = MaterialTheme.typography.bodySmall
                                                    )
                                                }
                                                Row {
                                                    IconButton(
                                                        onClick = {
                                                            isEditMode = true
                                                            editEntry = month to entry
                                                            showDialog = true
                                                        },
                                                        modifier = Modifier.size(32.dp)
                                                    ) {
                                                        Icon(
                                                            Icons.Default.Edit,
                                                            contentDescription = "Editar",
                                                            modifier = Modifier.size(18.dp)
                                                        )
                                                    }
                                                    IconButton(
                                                        onClick = {
                                                            viewModel.deleteIngreso(month, entry.dia.toIntOrNull() ?: 0)
                                                        },
                                                        modifier = Modifier.size(32.dp)
                                                    ) {
                                                        Icon(
                                                            Icons.Default.Delete,
                                                            contentDescription = "Eliminar",
                                                            modifier = Modifier.size(18.dp)
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    
                                    Spacer(modifier = Modifier.height(8.dp))
                                    
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.Center
                                    ) {
                                        TextButton(
                                            onClick = {
                                                isEditMode = false
                                                editEntry = null
                                                preselectedMonth = month
                                                showDialog = true
                                            }
                                        ) {
                                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Agregar registro")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    IngresoDialog(
        visible = showDialog,
        isEditMode = isEditMode,
        initialMonth = editEntry?.first ?: preselectedMonth,
        initialDia = when {
            isEditMode -> editEntry?.second?.dia
            preselectedMonth != null -> null
            else -> Calendar.getInstance().get(Calendar.DAY_OF_MONTH).toString()
        },
        initialImporte = editEntry?.second?.importe,
        existingEntries = if (isEditMode && editEntry != null) {
            uiState.registro.ingresos[editEntry?.first] ?: emptyList()
        } else emptyList(),
        onDismiss = {
            showDialog = false
            isEditMode = false
            editEntry = null
            preselectedMonth = null
        },
        onConfirm = { month, dia, importe ->
            val existing = (if (isEditMode && editEntry != null) {
                uiState.registro.ingresos[month]?.filter { it.dia != editEntry?.second?.dia }
            } else uiState.registro.ingresos[month]) ?: emptyList()
            
            val existingEntry = existing.find { it.dia == dia.toString() }
            
            if (existingEntry != null && !isEditMode) {
                existingImporte = existingEntry.importe.toDoubleOrNull() ?: 0.0
                pendingDuplicateEntry = Triple(month, dia, importe)
                showDuplicateDialog = true
            } else {
                if (isEditMode && editEntry != null) {
                    val oldDia = editEntry?.second?.dia?.toIntOrNull() ?: 0
                    viewModel.editIngreso(month, oldDia, dia, importe)
                } else {
                    viewModel.addIngreso(month, dia, importe)
                }
                showDialog = false
                isEditMode = false
                editEntry = null
                preselectedMonth = null
            }
        }
    )

    if (showDuplicateDialog && pendingDuplicateEntry != null) {
        AlertDialog(
            onDismissRequest = { 
                showDuplicateDialog = false
                pendingDuplicateEntry = null
            },
            title = { Text("Día ya existe") },
            text = { 
                Text("Ya existe un registro de ${String.format("%.2f", existingImporte)} CUP para el día ${pendingDuplicateEntry?.second}. ¿Qué deseas hacer?")
            },
            confirmButton = {
                Row {
                    TextButton(
                        onClick = {
                            val entry = pendingDuplicateEntry!!
                            viewModel.addIngreso(entry.first, entry.second, entry.third + existingImporte)
                            showDuplicateDialog = false
                            pendingDuplicateEntry = null
                            showDialog = false
                            isEditMode = false
                            editEntry = null
                            preselectedMonth = null
                        }
                    ) {
                        Text("Sumar")
                    }
                    TextButton(
                        onClick = {
                            val entry = pendingDuplicateEntry!!
                            viewModel.addIngreso(entry.first, entry.second, entry.third)
                            showDuplicateDialog = false
                            pendingDuplicateEntry = null
                            showDialog = false
                            isEditMode = false
                            editEntry = null
                            preselectedMonth = null
                        }
                    ) {
                        Text("Reemplazar")
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { 
                        showDuplicateDialog = false
                        pendingDuplicateEntry = null
                    }
                ) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IngresoDialog(
    visible: Boolean,
    isEditMode: Boolean = false,
    initialMonth: String? = null,
    initialDia: String? = null,
    initialImporte: String? = null,
    existingEntries: List<DayAmountRow> = emptyList(),
    onDismiss: () -> Unit,
    onConfirm: (month: String, dia: Int, importe: Double) -> Unit
) {
    if (visible) {
        val currentDay = Calendar.getInstance().get(Calendar.DAY_OF_MONTH)
        val currentMonthIndex = Calendar.getInstance().get(Calendar.MONTH)
        val currentMonth = LedgerConstants.MONTHS.getOrNull(currentMonthIndex) ?: "ENE"
        
        var selectedMonth by remember { mutableStateOf(initialMonth ?: currentMonth) }
        var dia by remember { mutableStateOf(initialDia ?: if (initialDia != null) initialDia else "") }
        var importe by remember { mutableStateOf(initialImporte ?: "") }
        var expanded by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = onDismiss,
            title = { Text(if (isEditMode) "Editar Ingreso" else "Agregar Ingreso") },
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
                            onConfirm(selectedMonth, diaInt, importeDouble)
                        }
                    },
                    enabled = dia.toIntOrNull() != null && importe.toDoubleOrNull() != null
                ) {
                    Text(if (isEditMode) "Guardar" else "Agregar")
                }
            },
            dismissButton = {
                TextButton(onClick = onDismiss) {
                    Text("Cancelar")
                }
            }
        )
    }
}
