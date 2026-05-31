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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

// ─── Anchos de columna ───────────────────────────────────────────────────────
private val AnchoConcept = 280.dp
private val AnchoFila    = 52.dp
private val AnchoCosto   = 110.dp
private val AnchoAccion  = 40.dp

// ────────────────────────────────────────────────────────────────────────────
//  Pantalla principal — sin Scaffold propio, la toolbar la provee MainScreen
// ────────────────────────────────────────────────────────────────────────────

@Composable
fun FichaCostoScreen(
    vm: FichaCostoViewModel = viewModel(),
) {
    var dialogTarget      by remember { mutableStateOf<FilaCosto?>(null) }
    var dialogEsBase      by remember { mutableStateOf(true) }
    var dialogAgregarId   by remember { mutableStateOf<String?>(null) }
    var encabezadoVisible by remember { mutableStateOf(true) }

    // Colores que respetan el tema (claro u oscuro)
    val cs = MaterialTheme.colorScheme

    // ── Colores semánticos derivados del tema ────────────────────────────
    val colorBorde     = cs.outlineVariant
    val colorGrupo     = cs.primaryContainer.copy(alpha = 0.35f)
    val colorSubfila   = cs.surface
    val colorCalc      = cs.tertiaryContainer.copy(alpha = 0.45f)
    val colorEditable  = cs.secondaryContainer.copy(alpha = 0.5f)
    val colorEncHeader = cs.surfaceVariant

    Column(Modifier.fillMaxSize()) {

        // ── Encabezado colapsable ────────────────────────────────────────
        EncabezadoColapsable(
            estado    = vm.estado,
            visible   = encabezadoVisible,
            onToggle  = { encabezadoVisible = !encabezadoVisible },
        )

        Spacer(Modifier.height(6.dp))

        // ── Tabla con doble scroll (H dentro, V por LazyColumn) ──────────
        Box(
            Modifier
                .weight(1f)
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
        ) {
            LazyColumn(Modifier.fillMaxHeight()) {
                item {
                    FilaEncabezadoTabla(
                        colorBorde = colorBorde,
                        colorFondo = colorEncHeader,
                    )
                }
                items(vm.filas, key = { it.id }) { fila ->
                    FilaTabla(
                        fila              = fila,
                        colorBorde        = colorBorde,
                        colorGrupo        = colorGrupo,
                        colorSubfila      = colorSubfila,
                        colorCalc         = colorCalc,
                        colorEditable     = colorEditable,
                        onClickBase       = { dialogTarget = fila; dialogEsBase = true },
                        onClickNuevo      = { dialogTarget = fila; dialogEsBase = false },
                        onAgregarSubfila  = { dialogAgregarId = it },
                        onEliminar        = { vm.eliminarSubfilaDinamica(it) },
                    )
                }
            }
        }
    }

    // ── Diálogo calculadora ──────────────────────────────────────────────
    dialogTarget?.let { fila ->
        CalculatorInputDialog(
            valorInicial = if (dialogEsBase) fila.costoBase.value else fila.costoNuevo.value,
            titulo = if (dialogEsBase) "Costo Base\n${fila.etiqueta}"
                     else             "Costo Nuevo\n${fila.etiqueta}",
            onConfirm = { valor ->
                if (dialogEsBase) fila.costoBase.value = valor
                else              fila.costoNuevo.value = valor
                vm.recalcular()
                dialogTarget = null
            },
            onDismiss = { dialogTarget = null },
        )
    }

    // ── Diálogo nueva subfila ────────────────────────────────────────────
    dialogAgregarId?.let { grupoId ->
        DialogAgregarSubfila(
            grupoNumero = grupoId,
            onConfirm   = { etiqueta ->
                vm.agregarSubfila(grupoId, etiqueta)
                dialogAgregarId = null
            },
            onDismiss = { dialogAgregarId = null },
        )
    }
}

// ────────────────────────────────────────────────────────────────────────────
//  Encabezado colapsable con los datos del formulario
// ────────────────────────────────────────────────────────────────────────────

@Composable
private fun EncabezadoColapsable(
    estado:   FichaCostoState,
    visible:  Boolean,
    onToggle: () -> Unit,
) {
    Card(
        modifier  = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
        shape     = RoundedCornerShape(8.dp),
        elevation = CardDefaults.cardElevation(3.dp),
    ) {
        Column {
            // Barra de colapso
            Row(
                Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onToggle)
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "MINISTERIO DE FINANZAS Y PRECIOS — Ficha de Costos y Gastos",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f),
                    maxLines = 1,
                )
                Icon(
                    imageVector = if (visible) Icons.Default.KeyboardArrowUp
                                  else         Icons.Default.KeyboardArrowDown,
                    contentDescription = if (visible) "Colapsar" else "Expandir",
                )
            }

            // Contenido colapsable
            if (visible) {
                Divider()
                Column(Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                    Text(
                        text = "FICHA DE COSTOS Y GASTOS DE PRODUCTOS Y SERVICIOS\n" +
                               "PARA LA EVALUACIÓN DE PRECIOS Y TARIFAS",
                        style      = MaterialTheme.typography.labelSmall,
                        textAlign  = TextAlign.Center,
                        modifier   = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value         = estado.productoServicio.value,
                        onValueChange = { estado.productoServicio.value = it },
                        label         = { Text("Producto o Servicio") },
                        modifier      = Modifier.fillMaxWidth(),
                        singleLine    = true,
                        textStyle     = MaterialTheme.typography.bodySmall,
                    )
                    Spacer(Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        CampoEnc("Código",      estado.codigo,          Modifier.weight(1f))
                        CampoEnc("UM",          estado.um,              Modifier.weight(0.6f))
                        CampoEnc("Nivel Prod.", estado.nivelProduccion, Modifier.weight(1f))
                        CampoEnc("% Cap.",      estado.pctCapacidad,    Modifier.weight(0.8f))
                    }
                }
            }
        }
    }
}

@Composable
private fun CampoEnc(
    label:    String,
    state:    androidx.compose.runtime.MutableState<String>,
    modifier: Modifier = Modifier,
) {
    OutlinedTextField(
        value         = state.value,
        onValueChange = { state.value = it },
        label         = { Text(label, style = MaterialTheme.typography.labelSmall) },
        modifier      = modifier,
        singleLine    = true,
        textStyle     = MaterialTheme.typography.bodySmall,
    )
}

// ────────────────────────────────────────────────────────────────────────────
//  Cabecera de columnas de la tabla
// ────────────────────────────────────────────────────────────────────────────

@Composable
private fun FilaEncabezadoTabla(colorBorde: Color, colorFondo: Color) {
    Row(
        Modifier
            .height(IntrinsicSize.Min)   // alinea alturas
            .background(colorFondo)
    ) {
        CeldaHeader("CONCEPTOS",   AnchoConcept, colorBorde)
        CeldaHeader("FILA",        AnchoFila,    colorBorde)
        CeldaHeader("Costo Base",  AnchoCosto,   colorBorde)
        CeldaHeader("Costo Nuevo", AnchoCosto,   colorBorde)
        Spacer(Modifier.width(AnchoAccion))
    }
}

@Composable
private fun CeldaHeader(texto: String, ancho: Dp, colorBorde: Color) {
    Box(
        Modifier
            .width(ancho)
            .fillMaxHeight()
            .border(0.5.dp, colorBorde)
            .padding(8.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            texto,
            fontWeight = FontWeight.Bold,
            fontSize   = 12.sp,
            textAlign  = TextAlign.Center,
            style      = MaterialTheme.typography.labelMedium,
        )
    }
}

// ────────────────────────────────────────────────────────────────────────────
//  Fila de datos
//  IntrinsicSize.Min garantiza que todas las celdas de la fila tengan
//  la misma altura sin importar cuántas líneas tenga el texto del concepto.
// ────────────────────────────────────────────────────────────────────────────

@Composable
private fun FilaTabla(
    fila:             FilaCosto,
    colorBorde:       Color,
    colorGrupo:       Color,
    colorSubfila:     Color,
    colorCalc:        Color,
    colorEditable:    Color,
    onClickBase:      () -> Unit,
    onClickNuevo:     () -> Unit,
    onAgregarSubfila: (String) -> Unit,
    onEliminar:       (String) -> Unit,
) {
    val bgRow = when (fila.tipo) {
        FilaTipo.GRUPO     -> colorGrupo
        FilaTipo.SUBFILA   -> colorSubfila
        FilaTipo.CALCULADA -> colorCalc
    }
    val fw         = if (fila.tipo == FilaTipo.SUBFILA) FontWeight.Normal else FontWeight.Bold
    val esEditable = fila.tipo != FilaTipo.CALCULADA
    val esDinamica = fila.id.contains("_d")

    // IntrinsicSize.Min: la Row adopta la altura mínima que satisfaga a
    // todos sus hijos que piden fillMaxHeight() — efecto "equalizar celdas"
    Row(
        Modifier
            .height(IntrinsicSize.Min)
            .background(bgRow),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // ── Concepto ──────────────────────────────────────────────────────
        Box(
            Modifier
                .width(AnchoConcept)
                .fillMaxHeight()
                .border(0.5.dp, colorBorde)
                .padding(horizontal = 8.dp, vertical = 6.dp),
            contentAlignment = Alignment.CenterStart,
        ) {
            Text(
                text       = fila.etiqueta,
                fontSize   = 12.sp,
                fontWeight = fw,
                color      = MaterialTheme.colorScheme.onSurface,
            )
        }

        // ── Número de fila ────────────────────────────────────────────────
        Box(
            Modifier
                .width(AnchoFila)
                .fillMaxHeight()
                .border(0.5.dp, colorBorde)
                .padding(6.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(fila.numero, fontSize = 12.sp, fontWeight = fw,
                 color = MaterialTheme.colorScheme.onSurface)
        }

        // ── Costo Base ────────────────────────────────────────────────────
        CeldaValor(
            valor         = fila.costoBase.value,
            editable      = esEditable,
            colorEditable = colorEditable,
            colorBorde    = colorBorde,
            onClick       = onClickBase,
        )

        // ── Costo Nuevo ───────────────────────────────────────────────────
        CeldaValor(
            valor         = fila.costoNuevo.value,
            editable      = esEditable,
            colorEditable = colorEditable,
            colorBorde    = colorBorde,
            onClick       = onClickNuevo,
        )

        // ── Acciones ──────────────────────────────────────────────────────
        Box(
            Modifier
                .width(AnchoAccion)
                .fillMaxHeight(),
            contentAlignment = Alignment.Center,
        ) {
            when {
                esDinamica -> IconButton(
                    onClick  = { onEliminar(fila.id) },
                    modifier = Modifier.size(32.dp),
                ) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Eliminar subfila",
                        tint     = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(16.dp),
                    )
                }
                fila.expandible -> IconButton(
                    onClick  = { onAgregarSubfila(fila.id) },
                    modifier = Modifier.size(32.dp),
                ) {
                    Icon(
                        Icons.Default.Add,
                        contentDescription = "Añadir desglose",
                        tint     = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(16.dp),
                    )
                }
                else -> Spacer(Modifier.size(32.dp))
            }
        }
    }
}

// ────────────────────────────────────────────────────────────────────────────
//  Celda de valor numérico
// ────────────────────────────────────────────────────────────────────────────

@Composable
private fun CeldaValor(
    valor:         Double,
    editable:      Boolean,
    colorEditable: Color,
    colorBorde:    Color,
    onClick:       () -> Unit,
) {
    val cs = MaterialTheme.colorScheme
    val bg = if (editable) colorEditable else Color.Transparent

    Box(
        Modifier
            .width(AnchoCosto)
            .fillMaxHeight()
            .border(0.5.dp, colorBorde)
            .background(bg)
            .then(if (editable) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(horizontal = 8.dp, vertical = 6.dp),
        contentAlignment = Alignment.CenterEnd,
    ) {
        Text(
            text       = "$ %.2f".format(valor),
            fontSize   = 12.sp,
            fontWeight = if (!editable) FontWeight.Bold else FontWeight.Normal,
            color      = if (!editable) cs.tertiary else cs.onSurface,
        )
    }
}

// ────────────────────────────────────────────────────────────────────────────
//  Diálogo: nueva subfila dinámica
// ────────────────────────────────────────────────────────────────────────────

@Composable
fun DialogAgregarSubfila(
    grupoNumero: String,
    onConfirm:   (String) -> Unit,
    onDismiss:   () -> Unit,
) {
    var texto by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title   = { Text("Desglose del grupo $grupoNumero") },
        text    = {
            OutlinedTextField(
                value         = texto,
                onValueChange = { texto = it },
                label         = { Text("Descripción del concepto") },
                singleLine    = true,
                modifier      = Modifier.fillMaxWidth(),
            )
        },
        confirmButton = {
            TextButton(onClick = { if (texto.isNotBlank()) onConfirm(texto.trim()) }) {
                Text("Añadir")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        },
    )
}
