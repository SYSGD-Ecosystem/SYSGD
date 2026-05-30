package cu.lazaroysr96.sysgdcont.ui.fichacosto

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.platform.LocalContext

// ─── Colores ────────────────────────────────────────────────────────────────
private val ColorEncabezado   = Color(0xFF0A79F5)
private val ColorCeldaBorde   = Color(0xFFBBBBBB)
private val ColorFilaGrupo    = Color(0xFFF0F4FF)
private val ColorFilaSubfila  = Color.White
private val ColorFilaCalc     = Color(0xFFE8F5E9)
private val ColorEditable     = Color(0xFFFFF3E0)
private val ColorTexto        = Color(0xFF1A1A1A)

// ─── Anchos de columna (tabla horizontal) ───────────────────────────────────
private val AnchoConcept   = 280.dp
private val AnchoFila      = 52.dp
private val AnchoCosto     = 110.dp

// ────────────────────────────────────────────────────────────────────────────
//  Pantalla principal
// ────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FichaCostoScreen(
    vm: FichaCostoViewModel = viewModel(),
    onGenerarPdf: () -> Unit = {},
    onNavigateUp: () -> Unit = {},
) {
    // Estado del diálogo de calculadora
    var dialogTarget by remember { mutableStateOf<FilaCosto?>(null) }
    var dialogEsBase by remember { mutableStateOf(true) }
    val context = LocalContext.current

    

    // Estado del diálogo para añadir subfila dinámica
    var dialogAgregarGrupoId by remember { mutableStateOf<String?>(null) }

    Scaffold(
        // topBar = {
        //     // TopAppBar(
        //     //     title = { Text("Ficha de Precio", color = Color.White, fontWeight = FontWeight.Bold) },
        //     //     colors = TopAppBarDefaults.topAppBarColors(containerColor = ColorEncabezado),
        //     //     actions = {
        //     //         IconButton(onClick = {vm.generatePDF(context)}/*onGenerarPdf*/) {
        //     //             Icon(Icons.Default.PictureAsPdf, contentDescription = "Generar PDF", tint = Color.White)
        //     //         }
        //     //     },
        //     // )
        // }
    ) { innerPadding ->

        Column(
            Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFFEEF0F5))
                .padding(8.dp)
        ) {
            // ── Encabezado informativo ────────────────────────────────────
            EncabezadoFicha(vm.estado)

            Spacer(Modifier.height(8.dp))

            // ── Tabla con scroll horizontal + vertical ────────────────────
            Box(
                Modifier
                    .fillMaxSize()
                    .horizontalScroll(rememberScrollState())
            ) {
                LazyColumn {
                    // Cabecera de columnas
                    item { FilaEncabezadoTabla() }

                    // Filas de datos
                    items(vm.filas, key = { it.id }) { fila ->
                        FilaTabla(
                            fila = fila,
                            onClickBase = {
                                dialogTarget  = fila
                                dialogEsBase  = true
                            },
                            onClickNuevo = {
                                dialogTarget  = fila
                                dialogEsBase  = false
                            },
                            onAgregarSubfila = { grupoId ->
                                dialogAgregarGrupoId = grupoId
                            },
                            onEliminar = { filaId ->
                                vm.eliminarSubfilaDinamica(filaId)
                            },
                        )
                    }
                }
            }
        }
    }

    // ── Diálogo calculadora ───────────────────────────────────────────────────
    dialogTarget?.let { fila ->
        CalculatorInputDialog(
            valorInicial = if (dialogEsBase) fila.costoBase.value else fila.costoNuevo.value,
            titulo = if (dialogEsBase) "Costo Base — ${fila.etiqueta}" else "Costo Nuevo — ${fila.etiqueta}",
            onConfirm = { valor ->
                if (dialogEsBase) fila.costoBase.value = valor
                else              fila.costoNuevo.value = valor
                vm.recalcular()
                dialogTarget = null
            },
            onDismiss = { dialogTarget = null },
        )
    }

    // ── Diálogo añadir subfila dinámica ───────────────────────────────────────
    dialogAgregarGrupoId?.let { grupoId ->
        DialogAgregarSubfila(
            grupoNumero = grupoId,
            onConfirm = { etiqueta ->
                vm.agregarSubfila(grupoId, etiqueta)
                dialogAgregarGrupoId = null
            },
            onDismiss = { dialogAgregarGrupoId = null },
        )
    }
}

// ────────────────────────────────────────────────────────────────────────────
//  Encabezado con datos del producto / servicio
// ────────────────────────────────────────────────────────────────────────────

@Composable
private fun EncabezadoFicha(estado: FichaCostoState) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        elevation = CardDefaults.cardElevation(4.dp),
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(
                text = "MINISTERIO DE FINANZAS Y PRECIOS\n" +
                        "FICHA DE COSTOS Y GASTOS DE PRODUCTOS Y SERVICIOS\n" +
                        "PARA LA EVALUACIÓN DE PRECIOS Y TARIFAS",
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = estado.productoServicio.value,
                onValueChange = { estado.productoServicio.value = it },
                label = { Text("Producto o Servicio", fontSize = 11.sp) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            Spacer(Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                CampoEncabezado("Código", estado.codigo, Modifier.weight(1f))
                CampoEncabezado("UM", estado.um, Modifier.weight(0.6f))
                CampoEncabezado("Nivel Prod.", estado.nivelProduccion, Modifier.weight(1f))
                CampoEncabezado("% Capacidad", estado.pctCapacidad, Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun CampoEncabezado(label: String, state: androidx.compose.runtime.MutableState<String>, modifier: Modifier = Modifier) {
    OutlinedTextField(
        value = state.value,
        onValueChange = { state.value = it },
        label = { Text(label, fontSize = 10.sp) },
        modifier = modifier,
        singleLine = true,
        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp),
    )
}

// ────────────────────────────────────────────────────────────────────────────
//  Cabecera de la tabla
// ────────────────────────────────────────────────────────────────────────────

@Composable
private fun FilaEncabezadoTabla() {
    Row(Modifier.background(Color(0xFFDDE3F0))) {
        CeldaHeader("CONCEPTOS",    AnchoConcept)
        CeldaHeader("FILA",         AnchoFila)
        CeldaHeader("Costo Base",   AnchoCosto)
        CeldaHeader("Costo Nuevo",  AnchoCosto)
        // Espacio para botón +/-
        Spacer(Modifier.width(40.dp))
    }
}

@Composable
private fun CeldaHeader(texto: String, ancho: Dp) {
    Box(
        Modifier
            .width(ancho)
            .border(0.5.dp, ColorCeldaBorde)
            .padding(8.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(texto, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = ColorTexto, textAlign = TextAlign.Center)
    }
}

// ────────────────────────────────────────────────────────────────────────────
//  Fila de la tabla
// ────────────────────────────────────────────────────────────────────────────

@Composable
private fun FilaTabla(
    fila: FilaCosto,
    onClickBase: () -> Unit,
    onClickNuevo: () -> Unit,
    onAgregarSubfila: (String) -> Unit,
    onEliminar: (String) -> Unit,
) {
    val bgColor = when (fila.tipo) {
        FilaTipo.GRUPO    -> ColorFilaGrupo
        FilaTipo.SUBFILA  -> ColorFilaSubfila
        FilaTipo.CALCULADA -> ColorFilaCalc
    }
    val fontWeight = if (fila.tipo == FilaTipo.SUBFILA) FontWeight.Normal else FontWeight.Bold
    val fontStyle  = FontStyle.Normal
    val esEditable = fila.tipo != FilaTipo.CALCULADA
    val esDinamica = fila.id.contains("_d")

    Row(
        Modifier.background(bgColor),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Columna concepto
        Box(
            Modifier
                .width(AnchoConcept)
                .fillMaxHeight() // MIO
                .border(0.5.dp, ColorCeldaBorde)
                .padding(horizontal = 8.dp, vertical = 6.dp),
        ) {
            Text(
                text = fila.etiqueta,
                fontSize = 12.sp,
                fontWeight = fontWeight,
                fontStyle = fontStyle,
                color = ColorTexto,
            )
        }

        // Columna número de fila
        Box(
            Modifier
                .width(AnchoFila)
                .border(0.5.dp, ColorCeldaBorde)
                .padding(6.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(fila.numero, fontSize = 12.sp, fontWeight = fontWeight, color = ColorTexto)
        }

        // Columna Costo Base
        CeldaValor(
            valor = fila.costoBase.value,
            editable = esEditable,
            onClick = onClickBase,
        )

        // Columna Costo Nuevo
        CeldaValor(
            valor = fila.costoNuevo.value,
            editable = esEditable,
            onClick = onClickNuevo,
        )

        // Botones de acción (+ para grupos expandibles, × para dinámicas)
        Row(Modifier.width(40.dp), horizontalArrangement = Arrangement.Center) {
            when {
                esDinamica -> {
                    IconButton(onClick = { onEliminar(fila.id) }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Delete, contentDescription = "Eliminar", tint = Color(0xFFCC2222), modifier = Modifier.size(16.dp))
                    }
                }
                fila.expandible -> {
                    IconButton(onClick = { onAgregarSubfila(fila.id) }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Add, contentDescription = "Añadir subfila", tint = Color(0xFF0A79F5), modifier = Modifier.size(16.dp))
                    }
                }
                else -> Spacer(Modifier.width(32.dp))
            }
        }
    }
}

@Composable
private fun CeldaValor(
    valor: Double,
    editable: Boolean,
    onClick: () -> Unit,
) {
    val bg = if (editable) ColorEditable else Color(0xFFF5F5F5)
    Box(
        Modifier
            .width(AnchoCosto)
            .fillMaxHeight() //mio
            .border(0.5.dp, ColorCeldaBorde)
            .background(bg)
            .then(if (editable) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(horizontal = 8.dp, vertical = 6.dp),
        contentAlignment = Alignment.CenterEnd,
    ) {
        Text(
            text = "$ %.2f".format(valor),
            fontSize = 12.sp,
            fontWeight = if (!editable) FontWeight.Bold else FontWeight.Normal,
            color = if (!editable) Color(0xFF1B5E20) else ColorTexto,
        )
    }
}

// ────────────────────────────────────────────────────────────────────────────
//  Diálogo para añadir subfila dinámica
// ────────────────────────────────────────────────────────────────────────────

@Composable
fun DialogAgregarSubfila(
    grupoNumero: String,
    onConfirm: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    var texto by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Añadir desglose al grupo $grupoNumero") },
        text = {
            OutlinedTextField(
                value = texto,
                onValueChange = { texto = it },
                label = { Text("Descripción del concepto") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
        },
        confirmButton = {
            TextButton(
                onClick = { if (texto.isNotBlank()) onConfirm(texto.trim()) },
            ) { Text("Añadir") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        },
    )
}

// Alias de Dp para poder usarlo dentro del archivo sin importar explícito
private typealias Dp = androidx.compose.ui.unit.Dp
