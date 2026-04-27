package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
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
import cu.lazaroysr96.sysgdcont.data.model.CuentaContable
import cu.lazaroysr96.sysgdcont.data.model.DayAmountRow
import cu.lazaroysr96.sysgdcont.data.repository.LedgerConstants
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GastosScreen(viewModel: LedgerViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val cuentasPorId = remember(uiState.cuentasContables) { uiState.cuentasContables.associateBy { it.id } }
    var showDialog by remember { mutableStateOf(false) }
    var isEditMode by remember { mutableStateOf(false) }
    var editEntry by remember { mutableStateOf<Pair<String, DayAmountRow>?>(null) }
    var expandedMonths by remember { mutableStateOf(setOf<String>()) }
    var expandedDaysByMonth by remember { mutableStateOf<Map<String, Set<String>>>(emptyMap()) }
    var preselectedMonth by remember { mutableStateOf<String?>(null) }

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
            Text("Gastos", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(8.dp))

            val totalGastos = uiState.annualReport?.totalGastos ?: 0.0
            Text("Total: ${String.format("%.2f", totalGastos)} CUP")

            Spacer(modifier = Modifier.height(16.dp))

            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(LedgerConstants.MONTHS) { month ->
                    val entries = uiState.registro.gastos[month] ?: emptyList()
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
        .padding(start = 12.dp, top = 4.dp, bottom = 4.dp, end = 4.dp),
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
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text("${String.format("%.2f", total)} CUP")
        IconButton(onClick = {
            isEditMode = false
            editEntry = null
            preselectedMonth = month
            showDialog = true
        }) {
            Icon(
                Icons.Default.Add,
                contentDescription = "Agregar registro",
                modifier = Modifier.size(20.dp)
            )
        }
    }
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
                                        entries
                                            .groupBy { it.dia }
                                            .toSortedMap(compareBy { it.toIntOrNull() ?: 0 })
                                            .forEach { (dia, dayEntries) ->
                                                val expandedDays = expandedDaysByMonth[month].orEmpty()
                                                val dayExpanded = expandedDays.contains(dia)
                                                GastoDayCard(
                                                    dia = dia,
                                                    entries = dayEntries.sortedBy { it.id },
                                                    isExpanded = dayExpanded,
                                                    cuentasPorId = cuentasPorId,
                                                    cuentaPorAsientoId = uiState.cuentaPorAsientoId,
                                                    notaPorAsientoId = uiState.notaPorAsientoId,
                                                    onToggle = {
                                                        expandedDaysByMonth = expandedDaysByMonth.toMutableMap().apply {
                                                            this[month] = if (dayExpanded) expandedDays - dia else expandedDays + dia
                                                        }
                                                    },
                                                    onEdit = { entry ->
                                                        isEditMode = true
                                                        editEntry = month to entry
                                                        showDialog = true
                                                    },
                                                    onDelete = { entry ->
                                                        viewModel.deleteGastoById(month, entry.id)
                                                    }
                                                )
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

    GastoDialog(
        visible = showDialog,
        isEditMode = isEditMode,
        initialMonth = editEntry?.first ?: preselectedMonth,
        initialDia = when {
            isEditMode -> editEntry?.second?.dia
            preselectedMonth != null -> null
            else -> Calendar.getInstance().get(Calendar.DAY_OF_MONTH).toString()
        },
        initialImporte = editEntry?.second?.importe,
        initialCuenta = editEntry?.second?.id?.let { uiState.cuentaPorAsientoId[it] },
        initialNota = editEntry?.second?.id?.let { uiState.notaPorAsientoId[it] },
        cuentasDisponibles = uiState.cuentasGasto,
        onDismiss = {
            showDialog = false
            isEditMode = false
            editEntry = null
            preselectedMonth = null
        },
        onConfirm = { month, dia, importe, cuenta, nota ->
            if (isEditMode && editEntry != null) {
                viewModel.editGastoById(editEntry!!.second.id, month, dia, importe, cuenta, nota)
            } else {
                viewModel.addGasto(month, dia, importe, cuenta, nota)
            }
            showDialog = false
            isEditMode = false
            editEntry = null
            preselectedMonth = null
        }
    )
}

@Composable
private fun GastoDayCard(
    dia: String,
    entries: List<DayAmountRow>,
    isExpanded: Boolean,
    cuentasPorId: Map<String, CuentaContable>,
    cuentaPorAsientoId: Map<String, String>,
    notaPorAsientoId: Map<String, String>,
    onToggle: () -> Unit,
    onEdit: (DayAmountRow) -> Unit,
    onDelete: (DayAmountRow) -> Unit
) {
    val totalDia = entries.sumOf { it.importe.toDoubleOrNull() ?: 0.0 }
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .animateContentSize()
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onToggle)
                    .padding(vertical = 10.dp, horizontal = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Día $dia", style = MaterialTheme.typography.titleSmall)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        String.format("%.2f CUP", totalDia),
                        style = MaterialTheme.typography.titleSmall
                    )
                    Text(
                        "${entries.size} movimiento(s)",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            AnimatedVisibility(visible = isExpanded) {
                Column(
                    modifier = Modifier.padding(start = 12.dp, end = 12.dp, bottom = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    entries.forEachIndexed { index, entry ->
                        if (index > 0) {
                            Divider()
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    "${entry.importe} CUP",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                cuentaPorAsientoId[entry.id]?.let { cuentaId ->
                                    Text(
                                        cuentasPorId[cuentaId]?.let { "Cuenta: ${it.codigo} · ${it.nombre}" }
                                            ?: "Cuenta: $cuentaId",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                notaPorAsientoId[entry.id]?.takeIf { it.isNotBlank() }?.let { nota ->
                                    Text(
                                        "Nota: $nota",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            Row {
                                IconButton(
                                    onClick = { onEdit(entry) },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        Icons.Default.Edit,
                                        contentDescription = "Editar",
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                                IconButton(
                                    onClick = { onDelete(entry) },
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
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GastoDialog(
    visible: Boolean,
    isEditMode: Boolean = false,
    initialMonth: String? = null,
    initialDia: String? = null,
    initialImporte: String? = null,
    initialCuenta: String? = null,
    initialNota: String? = null,
    cuentasDisponibles: List<cu.lazaroysr96.sysgdcont.data.model.CuentaContable> = emptyList(),
    onDismiss: () -> Unit,
    onConfirm: (month: String, dia: Int, importe: Double, cuenta: String, nota: String) -> Unit
) {
    if (visible) {
        val currentMonthIndex = Calendar.getInstance().get(Calendar.MONTH)
        val currentMonth = LedgerConstants.MONTHS.getOrNull(currentMonthIndex) ?: "ENE"
        
        var selectedMonth by remember { mutableStateOf(initialMonth ?: currentMonth) }
        var dia by remember { mutableStateOf(initialDia ?: if (initialDia != null) initialDia else "") }
        var importe by remember { mutableStateOf(initialImporte ?: "") }
        var cuenta by remember { mutableStateOf(initialCuenta ?: cuentasDisponibles.firstOrNull()?.id.orEmpty()) }
        var nota by remember { mutableStateOf(initialNota ?: "") }
        var expanded by remember { mutableStateOf(false) }
        var expandedCuenta by remember { mutableStateOf(false) }
        val cuentaSeleccionada = cuentasDisponibles.firstOrNull { it.id == cuenta }

        LaunchedEffect(cuentasDisponibles, initialCuenta) {
            if (cuenta.isBlank() && initialCuenta.isNullOrBlank() && cuentasDisponibles.isNotEmpty()) {
                cuenta = cuentasDisponibles.first().id
            }
        }

        AlertDialog(
            onDismissRequest = onDismiss,
            title = { Text(if (isEditMode) "Editar Gasto" else "Agregar Gasto") },
            text = {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ExposedDropdownMenuBox(
                            expanded = expanded,
                            onExpandedChange = { expanded = !expanded },
                            modifier = Modifier.weight(1f)
                        ) {
                            
                            OutlinedTextField(
                                value = LedgerConstants.monthLabels[selectedMonth] ?: selectedMonth,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Mes") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                                modifier = Modifier.menuAnchor()
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

                        OutlinedTextField(
                            value = dia,
                            onValueChange = { dia = it.filter { c -> c.isDigit() }.take(2) },
                            label = { Text("Día") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = importe,
                        onValueChange = { importe = it },
                        label = { Text("Importe (CUP)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    ExposedDropdownMenuBox(
                        expanded = expandedCuenta,
                        onExpandedChange = { expandedCuenta = !expandedCuenta }
                    ) {
                        OutlinedTextField(
                            value = cuentaSeleccionada?.let { "${it.codigo} · ${it.nombre}" } ?: "",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Cuenta contable") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedCuenta) },
                            modifier = Modifier.menuAnchor().fillMaxWidth(),
                            placeholder = { Text("Selecciona una cuenta de gasto") }
                        )
                        ExposedDropdownMenu(
                            expanded = expandedCuenta,
                            onDismissRequest = { expandedCuenta = false }
                        ) {
                            cuentasDisponibles.forEach { cuentaItem ->
                                DropdownMenuItem(
                                    text = { Text("${cuentaItem.codigo} · ${cuentaItem.nombre}") },
                                    onClick = {
                                        cuenta = cuentaItem.id
                                        expandedCuenta = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = nota,
                        onValueChange = { nota = it },
                        label = { Text("Nota (Opcional)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val diaInt = dia.toIntOrNull()
                        val importeDouble = importe.toDoubleOrNull()
                        if (diaInt != null && importeDouble != null && diaInt in 1..31 && importeDouble > 0) {
                            onConfirm(selectedMonth, diaInt, importeDouble, cuenta, nota)
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
