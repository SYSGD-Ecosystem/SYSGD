package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Percent
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.CuentaContable
import cu.lazaroysr96.sysgdcont.data.model.RegistroTCP
import cu.lazaroysr96.sysgdcont.data.model.TributoCategorias
import cu.lazaroysr96.sysgdcont.data.model.TributoConfig
import cu.lazaroysr96.sysgdcont.data.model.TributoCuentaBase
import cu.lazaroysr96.sysgdcont.data.model.TributoEditable
import cu.lazaroysr96.sysgdcont.data.model.TributoKeys
import cu.lazaroysr96.sysgdcont.data.model.TributoRow
import cu.lazaroysr96.sysgdcont.data.repository.LedgerConstants
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel
import kotlin.math.round

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TributosScreen(viewModel: LedgerViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var selectedMonthIndex by remember { mutableStateOf(0) }
    var expandedMonth by remember { mutableStateOf(false) }
    var editingTributoKey by remember { mutableStateOf<String?>(null) }
    val month = LedgerConstants.MONTHS[selectedMonthIndex]
    val editableTributos = remember(
        uiState.registro,
        uiState.tributoConfigs,
        uiState.tributoCuentaBases,
        uiState.cuentaPorAsientoId,
        month
    ) {
        buildEditableTributos(
            registro = uiState.registro,
            configs = uiState.tributoConfigs,
            relaciones = uiState.tributoCuentaBases,
            cuentaPorAsientoId = uiState.cuentaPorAsientoId,
            month = month
        )
    }
    val montoOverrides = remember(month) { mutableStateMapOf<String, String>() }

    LaunchedEffect(editableTributos) {
        montoOverrides.clear()
        editableTributos.forEach { montoOverrides[it.config.key] = it.monto }
    }

    val tributosPagados = editableTributos.filter { it.config.categoria == TributoCategorias.TRIBUTO }
    val otrosDeducibles = editableTributos.filter { it.config.categoria == TributoCategorias.OTRO_DEDUCIBLE }
    val editingTributo = editableTributos.firstOrNull { it.config.key == editingTributoKey }

    Scaffold { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text("Tributos y Otros Deducibles", style = MaterialTheme.typography.titleLarge)
            }

            item {
                ExposedDropdownMenuBox(
                    expanded = expandedMonth,
                    onExpandedChange = { expandedMonth = !expandedMonth }
                ) {
                    OutlinedTextField(
                        value = LedgerConstants.monthLabels[month] ?: month,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Mes de trabajo") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedMonth) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedMonth,
                        onDismissRequest = { expandedMonth = false }
                    ) {
                        LedgerConstants.MONTHS.forEachIndexed { index, current ->
                            DropdownMenuItem(
                                text = { Text(LedgerConstants.monthLabels[current] ?: current) },
                                onClick = {
                                    selectedMonthIndex = index
                                    expandedMonth = false
                                }
                            )
                        }
                    }
                }
            }

            item {
                Text(
                    "Tributos pagados y deducibles",
                    style = MaterialTheme.typography.titleMedium
                )
            }

            items(tributosPagados, key = { it.config.key }) { item ->
                TributoItemCard(
                    item = item,
                    monto = montoOverrides[item.config.key].orEmpty(),
                    selectedAccounts = uiState.cuentasContables.filter { it.id in item.selectedCuentaIds },
                    onMontoChange = { montoOverrides[item.config.key] = it },
                    onIncludedChange = { included ->
                        viewModel.actualizarTributoConfig(
                            key = item.config.key,
                            incluido = included,
                            autocalcular = item.config.autocalcular,
                            porcentaje = item.config.porcentaje,
                            cuentaIds = item.selectedCuentaIds.toList()
                        )
                    },
                    onAutocalcularChange = { autocalcular ->
                        viewModel.actualizarTributoConfig(
                            key = item.config.key,
                            incluido = item.config.incluido,
                            autocalcular = autocalcular,
                            porcentaje = item.config.porcentaje,
                            cuentaIds = item.selectedCuentaIds.toList()
                        )
                    },
                    onEdit = { editingTributoKey = item.config.key }
                )
            }

            item {
                Text(
                    "Otros gastos deducibles",
                    style = MaterialTheme.typography.titleMedium
                )
            }

            items(otrosDeducibles, key = { it.config.key }) { item ->
                TributoItemCard(
                    item = item,
                    monto = montoOverrides[item.config.key].orEmpty(),
                    selectedAccounts = uiState.cuentasContables.filter { it.id in item.selectedCuentaIds },
                    onMontoChange = { montoOverrides[item.config.key] = it },
                    onIncludedChange = { included ->
                        viewModel.actualizarTributoConfig(
                            key = item.config.key,
                            incluido = included,
                            autocalcular = item.config.autocalcular,
                            porcentaje = item.config.porcentaje,
                            cuentaIds = item.selectedCuentaIds.toList()
                        )
                    },
                    onAutocalcularChange = { autocalcular ->
                        viewModel.actualizarTributoConfig(
                            key = item.config.key,
                            incluido = item.config.incluido,
                            autocalcular = autocalcular,
                            porcentaje = item.config.porcentaje,
                            cuentaIds = item.selectedCuentaIds.toList()
                        )
                    },
                    onEdit = { editingTributoKey = item.config.key }
                )
            }

            item {
                Button(
                    onClick = {
                        val currentRow = tributoRowForMonth(uiState.registro, month)
                        val updated = editableTributos.fold(currentRow) { row, item ->
                            val shouldKeepManual = item.config.incluido && !item.config.autocalcular
                            if (shouldKeepManual) {
                                updateTributoRowValue(
                                    row = row,
                                    key = item.config.key,
                                    value = montoOverrides[item.config.key].orEmpty()
                                )
                            } else {
                                row
                            }
                        }
                        viewModel.updateTributos(month, updated)
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Guardar tributos del mes")
                }
            }
        }
    }

    if (editingTributo != null) {
        EditTributoConfigDialog(
            tributo = editingTributo,
            cuentas = uiState.cuentasContables,
            onDismiss = { editingTributoKey = null },
            onSave = { porcentaje, cuentaIds ->
                viewModel.actualizarTributoConfig(
                    key = editingTributo.config.key,
                    incluido = editingTributo.config.incluido,
                    autocalcular = editingTributo.config.autocalcular,
                    porcentaje = porcentaje,
                    cuentaIds = cuentaIds
                )
                editingTributoKey = null
            }
        )
    }
}

@Composable
private fun TributoItemCard(
    item: TributoEditable,
    monto: String,
    selectedAccounts: List<CuentaContable>,
    onMontoChange: (String) -> Unit,
    onIncludedChange: (Boolean) -> Unit,
    onAutocalcularChange: (Boolean) -> Unit,
    onEdit: () -> Unit
) {
    val montoVisible = when {
        !item.config.incluido -> ""
        item.config.autocalcular -> item.monto
        else -> monto
    }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(item.config.nombre, style = MaterialTheme.typography.titleSmall)
                    Text(
                        "Base imponible: ${formatCurrency(item.baseImponible)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                IconButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = "Editar configuración del tributo")
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Checkbox(
                        checked = item.config.incluido,
                        onCheckedChange = onIncludedChange
                    )
                    Text("Incluir en cálculo")
                }
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Switch(
                        checked = item.config.autocalcular,
                        onCheckedChange = onAutocalcularChange,
                        enabled = item.config.incluido
                    )
                    Text("Autocalcular")
                }
            }

            OutlinedTextField(
                value = montoVisible,
                onValueChange = onMontoChange,
                label = { Text("Monto del mes") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                enabled = item.config.incluido && !item.config.autocalcular,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Porcentaje ${formatPercent(item.config.porcentaje)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    "${selectedAccounts.size} cuenta(s) base",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (selectedAccounts.isNotEmpty()) {
                SelectedAccountsChips(selectedAccounts)
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SelectedAccountsChips(cuentas: List<CuentaContable>) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        cuentas.forEach { cuenta ->
            Surface(
                color = MaterialTheme.colorScheme.secondaryContainer,
                shape = MaterialTheme.shapes.small
            ) {
                Text(
                    "${cuenta.codigo} ${cuenta.nombre}",
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSecondaryContainer
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
private fun EditTributoConfigDialog(
    tributo: TributoEditable,
    cuentas: List<CuentaContable>,
    onDismiss: () -> Unit,
    onSave: (porcentaje: Double, cuentaIds: List<String>) -> Unit
) {
    var porcentaje by remember(tributo.config.key) { mutableStateOf(formatEditablePercent(tributo.config.porcentaje)) }
    val seleccionadas = remember(tributo.config.key) {
        mutableStateListOf<String>().apply { addAll(tributo.selectedCuentaIds) }
    }
    var search by remember { mutableStateOf("") }
    val cuentasFiltradas = remember(cuentas, search) {
        val query = search.trim().lowercase()
        if (query.isBlank()) {
            cuentas
        } else {
            cuentas.filter {
                it.codigo.lowercase().contains(query) || it.nombre.lowercase().contains(query)
            }
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Configurar ${tributo.config.nombre}") },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = porcentaje,
                    onValueChange = { porcentaje = it },
                    label = { Text("Porcentaje") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    leadingIcon = { Icon(Icons.Default.Percent, contentDescription = null) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )

                OutlinedTextField(
                    value = search,
                    onValueChange = { search = it },
                    label = { Text("Buscar cuenta base") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Text(
                    "Selecciona una o varias cuentas para calcular la base imponible.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    cuentasFiltradas.forEach { cuenta ->
                        val selected = cuenta.id in seleccionadas
                        FilterChip(
                            selected = selected,
                            onClick = {
                                if (selected) {
                                    seleccionadas.remove(cuenta.id)
                                } else {
                                    seleccionadas.add(cuenta.id)
                                }
                            },
                            label = { Text("${cuenta.codigo} ${cuenta.nombre}") }
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(
                        porcentaje.replace(',', '.').toDoubleOrNull() ?: 0.0,
                        seleccionadas.toList()
                    )
                }
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

private fun buildEditableTributos(
    registro: RegistroTCP,
    configs: List<TributoConfig>,
    relaciones: List<TributoCuentaBase>,
    cuentaPorAsientoId: Map<String, String>,
    month: String
): List<TributoEditable> {
    val row = tributoRowForMonth(registro, month)
    val relacionesPorTributo = relaciones.groupBy { it.tributoKey }
    return configs.sortedBy { it.orden }.map { config ->
        val cuentaIds = relacionesPorTributo[config.key].orEmpty().map { it.cuentaId }.toSet()
        TributoEditable(
            config = config,
            selectedCuentaIds = cuentaIds,
            monto = readTributoValue(row, config.key),
            baseImponible = if (config.incluido && config.autocalcular) {
                calculateBaseImponible(registro, month, cuentaIds, cuentaPorAsientoId)
            } else {
                0.0
            }
        )
    }
}

private fun tributoRowForMonth(registro: RegistroTCP, month: String): TributoRow {
    val index = LedgerConstants.MONTHS.indexOf(month)
    return if (index in registro.tributos.indices) {
        registro.tributos[index]
    } else {
        TributoRow(mes = LedgerConstants.monthLabels[month] ?: month)
    }
}

private fun readTributoValue(row: TributoRow, key: String): String = when (key) {
    TributoKeys.VENTAS -> row.ventas
    TributoKeys.FUERZA -> row.fuerza
    TributoKeys.SELLOS -> row.sellos
    TributoKeys.ANUNCIOS -> row.anuncios
    TributoKeys.CSS20 -> row.css20
    TributoKeys.CSS14 -> row.css14
    TributoKeys.CSS_SUBSIDIO -> row.cssSubsidio
    TributoKeys.OTROS -> row.otros
    TributoKeys.RESTAURACION -> row.restauracion
    TributoKeys.ARRENDAMIENTO -> row.arrendamiento
    TributoKeys.EXONERADO -> row.exonerado
    TributoKeys.OTROS_MFP -> row.otrosMFP
    TributoKeys.CUOTA_MENSUAL -> row.cuotaMensual
    else -> ""
}

private fun updateTributoRowValue(row: TributoRow, key: String, value: String): TributoRow = when (key) {
    TributoKeys.VENTAS -> row.copy(ventas = value)
    TributoKeys.FUERZA -> row.copy(fuerza = value)
    TributoKeys.SELLOS -> row.copy(sellos = value)
    TributoKeys.ANUNCIOS -> row.copy(anuncios = value)
    TributoKeys.CSS20 -> row.copy(css20 = value)
    TributoKeys.CSS14 -> row.copy(css14 = value)
    TributoKeys.CSS_SUBSIDIO -> row.copy(cssSubsidio = value)
    TributoKeys.OTROS -> row.copy(otros = value)
    TributoKeys.RESTAURACION -> row.copy(restauracion = value)
    TributoKeys.ARRENDAMIENTO -> row.copy(arrendamiento = value)
    TributoKeys.EXONERADO -> row.copy(exonerado = value)
    TributoKeys.OTROS_MFP -> row.copy(otrosMFP = value)
    TributoKeys.CUOTA_MENSUAL -> row.copy(cuotaMensual = value)
    else -> row
}

private fun calculateBaseImponible(
    registro: RegistroTCP,
    month: String,
    cuentaIds: Set<String>,
    cuentaPorAsientoId: Map<String, String>
): Double {
    if (cuentaIds.isEmpty()) return 0.0
    val total = registro.ingresos[month].orEmpty().sumOf { row ->
        if (cuentaPorAsientoId[row.id] in cuentaIds) parseAmount(row.importe) else 0.0
    } + registro.gastos[month].orEmpty().sumOf { row ->
        if (cuentaPorAsientoId[row.id] in cuentaIds) parseAmount(row.importe) else 0.0
    }
    return round2(total)
}

private fun parseAmount(value: String): Double = value.replace(',', '.').toDoubleOrNull() ?: 0.0

private fun round2(value: Double): Double = round(value * 100.0) / 100.0

private fun formatCurrency(value: Double): String = String.format("%.2f CUP", value)

private fun formatPercent(value: Double): String = String.format("%.2f%%", value)

private fun formatEditablePercent(value: Double): String =
    if (value == value.toInt().toDouble()) value.toInt().toString() else String.format("%.2f", value)
