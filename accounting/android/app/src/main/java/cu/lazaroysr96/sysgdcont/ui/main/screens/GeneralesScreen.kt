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
            OutlinedTextField(
                value = fiscalMunicipio,
                onValueChange = { fiscalMunicipio = it },
                label = { Text("Municipio") },
                modifier = Modifier.weight(1f),
                singleLine = true
            )
            Spacer(modifier = Modifier.width(8.dp))
            OutlinedTextField(
                value = fiscalProvincia,
                onValueChange = { fiscalProvincia = it },
                label = { Text("Provincia") },
                modifier = Modifier.weight(1f),
                singleLine = true
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
            OutlinedTextField(
                value = legalMunicipio,
                onValueChange = { legalMunicipio = it },
                label = { Text("Municipio") },
                modifier = Modifier.weight(1f),
                singleLine = true
            )
            Spacer(modifier = Modifier.width(8.dp))
            OutlinedTextField(
                value = legalProvincia,
                onValueChange = { legalProvincia = it },
                label = { Text("Provincia") },
                modifier = Modifier.weight(1f),
                singleLine = true
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
