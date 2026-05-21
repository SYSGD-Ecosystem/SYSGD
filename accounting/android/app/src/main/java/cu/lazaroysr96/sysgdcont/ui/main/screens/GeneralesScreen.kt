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
import androidx.compose.ui.text.style.TextOverflow
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.data.model.GeneralesData
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GeneralesScreen(viewModel: LedgerViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val generales = uiState.registro.generales

    var nombre by remember(generales) { mutableStateOf(generales.nombre) }
    var nit by remember(generales) { mutableStateOf(generales.nit) }
    var anio by remember(generales) { mutableStateOf(generales.anio.toString()) }
    var actividad by remember(generales) { mutableStateOf(generales.actividad) }
    var codigo by remember(generales) { mutableStateOf(generales.codigo) }
    var fiscalCalle by remember(generales) { mutableStateOf(generales.fiscalCalle) }
    var fiscalMunicipio by remember(generales) { mutableStateOf(generales.fiscalMunicipio) }
    var fiscalProvincia by remember(generales) { mutableStateOf(generales.fiscalProvincia) }
    var legalCalle by remember(generales) { mutableStateOf(generales.legalCalle) }
    var legalMunicipio by remember(generales) { mutableStateOf(generales.legalMunicipio) }
    var legalProvincia by remember(generales) { mutableStateOf(generales.legalProvincia) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Text("Datos del Contribuyente", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = nombre,
            onValueChange = { nombre = it },
            label = { Text("Nombre completo") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(8.dp))

        Row(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = nit,
                onValueChange = { nit = it },
                label = { Text("NIT") },
                modifier = Modifier.weight(1f),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
            )
            Spacer(modifier = Modifier.width(8.dp))
            OutlinedTextField(
                value = anio,
                onValueChange = { anio = it.filter { c -> c.isDigit() }.take(4) },
                label = { Text("Año") },
                modifier = Modifier.weight(1f),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = actividad,
            onValueChange = { actividad = it },
            label = { Text("Actividad económica") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = codigo,
            onValueChange = { codigo = it },
            label = { Text("Código ONAT") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text("Domicilio Fiscal", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = fiscalCalle,
            onValueChange = { fiscalCalle = it },
            label = { Text("Calle, número") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        Row(modifier = Modifier.fillMaxWidth()) {
            val fiscalMunicipios = municipiosByProvincia[fiscalProvincia] ?: emptyList()
            DropdownTextField(
                label = "Municipio",
                value = fiscalMunicipio,
                options = fiscalMunicipios,
                modifier = Modifier.weight(1f),
                onOptionSelected = { fiscalMunicipio = it }
            )
            Spacer(modifier = Modifier.width(8.dp))
            DropdownTextField(
                label = "Provincia",
                value = fiscalProvincia,
                options = provinciasCuba,
                modifier = Modifier.weight(1f),
                onOptionSelected = {
                    fiscalProvincia = it
                    if (fiscalMunicipio !in (municipiosByProvincia[it] ?: emptyList())) fiscalMunicipio = ""
                }
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text("Domicilio Legal (según CI)", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = legalCalle,
            onValueChange = { legalCalle = it },
            label = { Text("Calle, número, apartamento") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        Row(modifier = Modifier.fillMaxWidth()) {
            val legalMunicipios = municipiosByProvincia[legalProvincia] ?: emptyList()
            DropdownTextField(
                label = "Municipio",
                value = legalMunicipio,
                options = legalMunicipios,
                modifier = Modifier.weight(1f),
                onOptionSelected = { legalMunicipio = it }
            )
            Spacer(modifier = Modifier.width(8.dp))
            DropdownTextField(
                label = "Provincia",
                value = legalProvincia,
                options = provinciasCuba,
                modifier = Modifier.weight(1f),
                onOptionSelected = {
                    legalProvincia = it
                    if (legalMunicipio !in (municipiosByProvincia[it] ?: emptyList())) legalMunicipio = ""
                }
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                viewModel.updateGenerales(
                    GeneralesData(
                        nombre = nombre,
                        nit = nit,
                        anio = anio.toIntOrNull() ?: 2026,
                        actividad = actividad,
                        codigo = codigo,
                        fiscalCalle = fiscalCalle,
                        fiscalMunicipio = fiscalMunicipio,
                        fiscalProvincia = fiscalProvincia,
                        legalCalle = legalCalle,
                        legalMunicipio = legalMunicipio,
                        legalProvincia = legalProvincia
                    )
                )
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Guardar")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DropdownTextField(
    label: String,
    value: String,
    options: List<String>,
    modifier: Modifier = Modifier,
    onOptionSelected: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded },
        modifier = modifier
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.menuAnchor().fillMaxWidth(),
            singleLine = true
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    onClick = {
                        onOptionSelected(option)
                        expanded = false
                    }
                )
            }
        }
    }
}

private val provinciasCuba = listOf(
    "Pinar del Río", "Artemisa", "La Habana", "Mayabeque", "Matanzas", "Cienfuegos",
    "Villa Clara", "Sancti Spíritus", "Ciego de Ávila", "Camagüey", "Las Tunas",
    "Granma", "Holguín", "Santiago de Cuba", "Guantánamo", "Isla de la Juventud",
)

private val municipiosByProvincia: Map<String, List<String>> = mapOf(
    "Pinar del Río" to listOf("Consolación del Sur", "Guane", "La Palma", "Los Palacios", "Mantua", "Minas de Matahambre", "Pinar del Río", "San Juan y Martínez", "San Luis", "Sandino", "Viñales"),
    "Artemisa" to listOf("Alquízar", "Artemisa", "Bauta", "Caimito", "Guanajay", "Güira de Melena", "Mariel", "Bahía Honda", "San Antonio de los Baños", "San Cristóbal"),
    "La Habana" to listOf("Playa", "Plaza de la Revolución", "Centro Habana", "Habana Vieja", "Regla", "Habana del Este", "Guanabacoa", "San Miguel del Padrón", "Diez de Octubre", "Cerro", "Marianao", "La Lisa", "Boyeros", "Arroyo Naranjo", "Cotorro"),
    "Mayabeque" to listOf("Batabanó", "Bejucal", "Güines", "Jaruco", "Madruga", "Melena del Sur", "Nueva Paz", "Quivicán", "San José de las Lajas", "San Nicolás de Bari", "Santa Cruz del Norte"),
    "Matanzas" to listOf("Calimete", "Cárdenas", "Ciénaga de Zapata", "Colón", "Jagüey Grande", "Jovellanos", "Limonar", "Los Arabos", "Martí", "Matanzas", "Pedro Betancourt", "Perico", "Unión de Reyes"),
    "Cienfuegos" to listOf("Abreus", "Aguada de Pasajeros", "Cienfuegos", "Cruces", "Cumanayagua", "Lajas", "Palmira", "Rodas"),
    "Villa Clara" to listOf("Caibarién", "Camajuaní", "Cifuentes", "Corralillo", "Encrucijada", "Manicaragua", "Placetas", "Quemado de Güines", "Ranchuelo", "Remedios", "Sagua la Grande", "Santa Clara", "Santo Domingo"),
    "Sancti Spíritus" to listOf("Cabaiguán", "Fomento", "Jatibonico", "La Sierpe", "Sancti Spíritus", "Taguasco", "Trinidad", "Yaguajay"),
    "Ciego de Ávila" to listOf("Baraguá", "Bolivia", "Chambas", "Ciego de Ávila", "Ciro Redondo", "Florencia", "Majagua", "Morón", "Primero de Enero", "Venezuela"),
    "Camagüey" to listOf("Camagüey", "Carlos Manuel de Céspedes", "Esmeralda", "Florida", "Guáimaro", "Jimaguayú", "Minas", "Najasa", "Nuevitas", "Santa Cruz del Sur", "Sibanicú", "Sierra de Cubitas", "Vertientes"),
    "Las Tunas" to listOf("Amancio", "Colombia", "Jesús Menéndez", "Jobabo", "Las Tunas", "Majibacoa", "Manatí", "Puerto Padre"),
    "Granma" to listOf("Bartolomé Masó", "Bayamo", "Buey Arriba", "Campechuela", "Cauto Cristo", "Guisa", "Jiguaní", "Manzanillo", "Media Luna", "Niquero", "Pilón", "Río Cauto", "Yara"),
    "Holguín" to listOf("Antilla", "Báguanos", "Banes", "Cacocum", "Calixto García", "Cueto", "Frank País", "Gibara", "Holguín", "Mayarí", "Moa", "Rafael Freyre", "Sagua de Tánamo", "Urbano Noris"),
    "Santiago de Cuba" to listOf("Contramaestre", "Guamá", "Mella", "Palma Soriano", "San Luis", "Santiago de Cuba", "Segundo Frente", "Songo-La Maya", "Tercer Frente"),
    "Guantánamo" to listOf("Baracoa", "Caimanera", "El Salvador", "Guantánamo", "Imías", "Maisí", "Manuel Tames", "Niceto Pérez", "San Antonio del Sur", "Yateras"),
    "Isla de la Juventud" to listOf("Isla de la Juventud"),
)
