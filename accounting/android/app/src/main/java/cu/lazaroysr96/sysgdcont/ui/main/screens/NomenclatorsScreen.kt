package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.ListAlt
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.AccountingItem
import cu.lazaroysr96.sysgdcont.data.model.AccountingSubaccount
import cu.lazaroysr96.sysgdcont.data.model.CnaeItem
import cu.lazaroysr96.sysgdcont.data.model.NomenclatorType
import cu.lazaroysr96.sysgdcont.viewmodel.NomenclatorViewModel

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun NomenclatorsScreen(
    viewModel: NomenclatorViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var showFiltersSheet by remember { mutableStateOf(false) }

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = uiState.selectedType == NomenclatorType.CNAE,
                    onClick = { viewModel.setType(NomenclatorType.CNAE) },
                    icon = { Icon(Icons.Default.ListAlt, contentDescription = null) },
                    label = { Text("CNAE") }
                )
                NavigationBarItem(
                    selected = uiState.selectedType == NomenclatorType.ACCOUNTING,
                    onClick = { viewModel.setType(NomenclatorType.ACCOUNTING) },
                    icon = { Icon(Icons.Default.Business, contentDescription = null) },
                    label = { Text("Contabilidad") }
                )
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Text(
                "Consultas de referencia para CNAE y nomenclador contable.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = uiState.query,
                onValueChange = viewModel::setQuery,
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                label = {
                    Text(
                        if (uiState.selectedType == NomenclatorType.CNAE)
                            "Buscar por codigo, descripcion o estructura"
                        else
                            "Buscar por codigo, nombre, descripcion o subcuenta"
                    )
                },
                singleLine = true
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = { viewModel.search() }) {
                    Text("Buscar")
                }
                TextButton(onClick = { viewModel.clearFilters() }) {
                    Text("Limpiar")
                }
                if (uiState.selectedType == NomenclatorType.ACCOUNTING) {
                    TextButton(onClick = { showFiltersSheet = true }) {
                        Text("Filtros")
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (uiState.isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                if (uiState.selectedType == NomenclatorType.CNAE) {
                    CnaeResults(uiState.cnaeItems)
                } else {
                    AccountingResults(uiState.accountingItems)
                }
            }
        }

        if (showFiltersSheet && uiState.selectedType == NomenclatorType.ACCOUNTING) {
            ModalBottomSheet(
                onDismissRequest = { showFiltersSheet = false }
            ) {
                AccountingFilters(
                    uiState = uiState,
                    onCategorySelected = viewModel::setCategory,
                    onSubcategorySelected = viewModel::setSubcategory,
                    onClose = { showFiltersSheet = false }
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
private fun AccountingFilters(
    uiState: cu.lazaroysr96.sysgdcont.viewmodel.NomenclatorUiState,
    onCategorySelected: (String?) -> Unit,
    onSubcategorySelected: (String?) -> Unit,
    onClose: () -> Unit
) {
    var categoryExpanded by remember { mutableStateOf(false) }
    var subcategoryExpanded by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 16.dp, end = 16.dp, bottom = 24.dp)
    ) {
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
            )
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.FilterList,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Text(
                    "Filtros contables",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            ExposedDropdownMenuBox(
                expanded = categoryExpanded,
                onExpandedChange = { categoryExpanded = !categoryExpanded }
            ) {
                OutlinedTextField(
                    value = uiState.accountingCategories
                        .firstOrNull { it.code == uiState.selectedCategoryCode }
                        ?.let { "${it.code} - ${it.name}" }
                        ?: "Todas las categorias",
                    onValueChange = {},
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(),
                    readOnly = true,
                    label = { Text("Categoria") },
                    trailingIcon = {
                        ExposedDropdownMenuDefaults.TrailingIcon(expanded = categoryExpanded)
                    }
                )
                ExposedDropdownMenu(
                    expanded = categoryExpanded,
                    onDismissRequest = { categoryExpanded = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Todas las categorias") },
                        onClick = {
                            onCategorySelected(null)
                            categoryExpanded = false
                        }
                    )
                    uiState.accountingCategories.forEach { category ->
                        DropdownMenuItem(
                            text = { Text("${category.code} - ${category.name}") },
                            onClick = {
                                onCategorySelected(category.code)
                                categoryExpanded = false
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            ExposedDropdownMenuBox(
                expanded = subcategoryExpanded,
                onExpandedChange = { subcategoryExpanded = !subcategoryExpanded }
            ) {
                OutlinedTextField(
                    value = uiState.accountingSubcategories
                        .firstOrNull { it.code == uiState.selectedSubcategoryCode }
                        ?.let { "${it.code} - ${it.name}" }
                        ?: "Todas las subcategorias",
                    onValueChange = {},
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(),
                    readOnly = true,
                    label = { Text("Subcategoria") },
                    trailingIcon = {
                        ExposedDropdownMenuDefaults.TrailingIcon(expanded = subcategoryExpanded)
                    }
                )
                ExposedDropdownMenu(
                    expanded = subcategoryExpanded,
                    onDismissRequest = { subcategoryExpanded = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Todas las subcategorias") },
                        onClick = {
                            onSubcategorySelected(null)
                            subcategoryExpanded = false
                        }
                    )
                    uiState.accountingSubcategories.forEach { subcategory ->
                        DropdownMenuItem(
                            text = { Text("${subcategory.code} - ${subcategory.name}") },
                            onClick = {
                                onSubcategorySelected(subcategory.code)
                                subcategoryExpanded = false
                            }
                        )
                    }
                }
            }

                Spacer(modifier = Modifier.height(8.dp))

                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AssistChip(
                        onClick = { onCategorySelected(null) },
                        label = { Text("Quitar categoria") },
                        leadingIcon = { Icon(Icons.Default.AccountTree, contentDescription = null) },
                        colors = AssistChipDefaults.assistChipColors()
                    )
                    AssistChip(
                        onClick = { onSubcategorySelected(null) },
                        label = { Text("Quitar subcategoria") },
                        colors = AssistChipDefaults.assistChipColors()
                    )
                    if (!uiState.selectedCategoryCode.isNullOrBlank()) {
                        FilterChip(
                            selected = true,
                            onClick = { onCategorySelected(null) },
                            label = { Text("Cat. ${uiState.selectedCategoryCode}") }
                        )
                    }
                    if (!uiState.selectedSubcategoryCode.isNullOrBlank()) {
                        FilterChip(
                            selected = true,
                            onClick = { onSubcategorySelected(null) },
                            label = { Text("Sub. ${uiState.selectedSubcategoryCode}") }
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            Button(onClick = onClose) {
                Text("Listo")
            }
        }
    }
}

@Composable
private fun CnaeResults(items: List<CnaeItem>) {
    if (items.isEmpty()) {
        EmptyResults("No se encontraron resultados de CNAE.")
        return
    }

    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(bottom = 8.dp)
    ) {
        items(items, key = { it.code }) { item ->
            var expanded by remember { mutableStateOf(false) }
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded },
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item.description, fontWeight = FontWeight.SemiBold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                "${item.code} • ${item.structure} • Seccion ${item.section}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Icon(
                            if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = null
                        )
                    }

                    AnimatedVisibility(
                        visible = expanded,
                        enter = expandVertically(),
                        exit = shrinkVertically()
                    ) {
                        Column(modifier = Modifier.padding(top = 12.dp)) {
                            if (item.notes.isNotEmpty()) {
                                Divider()
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Notas", fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(6.dp))
                                item.notes.forEach { note ->
                                    Text(
                                        text = note,
                                        style = MaterialTheme.typography.bodySmall,
                                        modifier = Modifier.padding(bottom = 6.dp)
                                    )
                                }
                            }
                            if (item.correlations.isNotEmpty()) {
                                Divider()
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Correlaciones", fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(6.dp))
                                item.correlations.forEach { correlation ->
                                    ElevatedCard(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(bottom = 8.dp)
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Text("${correlation.codeCnae} -> ${correlation.codeNae} -> ${correlation.codeCiiu}")
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                correlation.descriptionCnae,
                                                style = MaterialTheme.typography.bodySmall
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
}

@Composable
private fun AccountingResults(items: List<AccountingItem>) {
    if (items.isEmpty()) {
        EmptyResults("No se encontraron resultados contables.")
        return
    }

    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(bottom = 8.dp)
    ) {
        items(
            items = items,
            key = {
                listOf(
                    it.categoryCode,
                    it.subcategoryCode,
                    it.accountCode
                ).joinToString("|")
            }
        ) { item ->
            var expanded by remember { mutableStateOf(false) }
            var showDescription by remember { mutableStateOf(false) }
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
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item.accountName, fontWeight = FontWeight.SemiBold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                "${item.accountCode} • ${item.accountNature}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                            if (item.subaccounts.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    "${item.subaccounts.size} subcuenta(s)",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        Icon(
                            if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = null
                        )
                    }

                    AnimatedVisibility(
                        visible = expanded,
                        enter = expandVertically(),
                        exit = shrinkVertically()
                    ) {
                        Column(modifier = Modifier.padding(top = 12.dp)) {
                            Divider()
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "Categoria: ${item.categoryCode} - ${item.categoryName}",
                                style = MaterialTheme.typography.bodySmall
                            )
                            if (item.subcategoryCode.isNotBlank()) {
                                Text(
                                    "Subcategoria: ${item.subcategoryCode} - ${item.subcategoryName}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                "Cuenta: ${item.accountCode} - ${item.accountName}",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Text(
                                "Naturaleza de cuenta: ${item.accountNature}",
                                style = MaterialTheme.typography.bodySmall
                            )
                            if (item.accountDescription.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                TextButton(
                                    onClick = { showDescription = true },
                                    contentPadding = PaddingValues(0.dp)
                                ) {
                                    Text("Ver descripcion")
                                }
                            }
                            if (item.subaccounts.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "Subcuentas",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    item.subaccounts.forEach { subaccount ->
                                        SubaccountRow(subaccount)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (showDescription) {
                AlertDialog(
                    onDismissRequest = { showDescription = false },
                    confirmButton = {
                        TextButton(onClick = { showDescription = false }) {
                            Text("Cerrar")
                        }
                    },
                    title = {
                        Text("${item.accountCode} - ${item.accountName}")
                    },
                    text = {
                        Text(item.accountDescription)
                    }
                )
            }
        }
    }
}

@Composable
private fun SubaccountRow(subaccount: AccountingSubaccount) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
        )
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                "${subaccount.code} - ${subaccount.name}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                "Naturaleza: ${subaccount.nature}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun EmptyResults(message: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(message, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
