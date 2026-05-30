package cu.lazaroysr96.sysgdcont.ui.fichacosto

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

// ─── Colores ────────────────────────────────────────────────────────────────
private val ColorNum = Color(0xFF1565C0)
private val ColorOp = Color(0xFF0D47A1)
private val ColorAccion = Color(0xFFC62828)
private val ColorBlanc = Color.White

// ────────────────────────────────────────────────────────────────────────────
//  Calculadora modal — equivalente Compose de CalculatorInput.java
// ────────────────────────────────────────────────────────────────────────────

@Composable
fun CalculatorInputDialog(
        valorInicial: Double = 0.0,
        titulo: String = "Ingrese valor",
        onConfirm: (Double) -> Unit,
        onDismiss: () -> Unit,
) {
    // ── Estado interno ────────────────────────────────────────────────────
    var display by remember {
        mutableStateOf(if (valorInicial != 0.0) formatCalc(valorInicial) else "")
    }
    var operacion by remember { mutableStateOf<Char?>(null) }
    var acumulado by remember { mutableStateOf(0.0) }
    var historial by remember { mutableStateOf("") }

    // ── Lógica ───────────────────────────────────────────────────────────
    fun appendDigit(d: String) {
        display = if (display == "0") d else display + d
    }

    fun appendPunto() {
        if (!display.contains('.')) display = if (display.isEmpty()) "0." else "$display."
    }

    fun borrar() {
        display = if (display.length <= 1) "" else display.dropLast(1)
    }

    fun borrarTodo() {
        display = ""
        operacion = null
        acumulado = 0.0
        historial = ""
    }

    fun toggleNeg() {
        display =
                when {
                    display.startsWith('-') -> display.drop(1)
                    display.isNotEmpty() -> "-$display"
                    else -> display
                }
    }

    fun calcular(): Double {
        val b = display.toDoubleOrNull() ?: 0.0
        return when (operacion) {
            '+' -> acumulado + b
            '-' -> acumulado - b
            '*' -> acumulado * b
            '/' -> if (b != 0.0) acumulado / b else 0.0
            else -> b
        }
    }

    fun igualizar() {
        if (operacion != null) {
            val res = calcular()
            historial = "${formatCalc(acumulado)} $operacion ${display} ="
            display = formatCalc(res)
            operacion = null
            acumulado = 0.0
        }
    }

    fun operar(op: Char) {
        if (operacion != null) {
            val res = calcular()
            historial = "${formatCalc(acumulado)} $operacion"
            acumulado = res
            display = ""
        } else {
            acumulado = display.toDoubleOrNull() ?: 0.0
            display = ""
        }
        historial = "${formatCalc(acumulado)} $op"
        operacion = op
    }

    // ── UI ───────────────────────────────────────────────────────────────
    Dialog(
            onDismissRequest = onDismiss,
            properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Card(
                modifier = Modifier.fillMaxWidth(0.92f).wrapContentHeight(),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(8.dp),
        ) {
            Column(
                    Modifier.background(Color(0xFF1A237E)).padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                // Título
                Text(
                        titulo,
                        color = Color.White,
                        fontSize = 12.sp,
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center,
                        maxLines = 2,
                )

                // Pantalla
                Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0D1B6E)),
                ) {
                    Column(Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) {
                        Text(
                                text = historial.ifEmpty { " " },
                                color = Color(0xFFFF8F00),
                                fontSize = 14.sp,
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.End,
                        )
                        Text(
                                text = display.ifEmpty { "0" },
                                color = Color.White,
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.End,
                        )
                    }
                }

                // Fila 1: 7 8 9 ×
                CalcRow {
                    // btnNum("7") { appendDigit("7") }
                    // btnNum("8") { appendDigit("8") }
                    // btnNum("9") { appendDigit("9") }
                    // btnOp("×")  { operar('*') }
                    Button(
                            onClick = { appendDigit("7") },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorNum),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "7",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { appendDigit("8") },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorNum),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "8",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { appendDigit("9") },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorNum),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "9",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { operar('*') },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorOp),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "×",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }
                }
                // Fila 2: 4 5 6 ÷
                CalcRow {
                    // btnNum("4") { appendDigit("4") }
                    // btnNum("5") { appendDigit("5") }
                    // btnNum("6") { appendDigit("6") }
                    // btnOp("÷")  { operar('/') }

                    Button(
                            onClick = { appendDigit("4") },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorNum),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "4",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { appendDigit("5") },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorNum),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "5",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { appendDigit("6") },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorNum),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "6",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { operar('/') },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorOp),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "÷",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }
                }
                // Fila 3: 1 2 3 +
                CalcRow {
                    // btnNum("1") { appendDigit("1") }
                    // btnNum("2") { appendDigit("2") }
                    // btnNum("3") { appendDigit("3") }
                    // btnOp("+")  { operar('+') }

                    Button(
                            onClick = { appendDigit("1") },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorNum),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "1",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { appendDigit("2") },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorNum),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "2",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { appendDigit("3") },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorNum),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "3",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { operar('+') },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorOp),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "+",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }
                }
                // Fila 4: . 0 +/- -
                CalcRow {
                    // btnNum(".") { appendPunto() }
                    // btnNum("0") { appendDigit("0") }
                    // btnNum("±") { toggleNeg() }
                    // btnOp("-")  { operar('-') }
                    Button(
                            onClick = { appendPunto() },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorNum),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "7",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { appendDigit("0") },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorNum),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "0",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { toggleNeg() },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorNum),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "±",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { operar('-') },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorOp),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "-",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }
                }
                // Fila 5: C = OK
                CalcRow {

                    Button(
                            onClick = { borrar() },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorAccion),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "⌫",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { borrarTodo() },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorAccion),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "C",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                            onClick = { igualizar() },
                            modifier = Modifier.weight(1f).height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ColorAccion),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(0.dp),
                    ) {
                        Text(
                                "=",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Botón OK
                Button(
                        onClick = {
                            igualizar()
                            val valor = display.toDoubleOrNull() ?: acumulado
                            onConfirm(valor)
                        },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00C853)),
                        shape = RoundedCornerShape(8.dp),
                ) {
                    Text("OK", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                }
            }
        }
    }
}

// ────────────────────────────────────────────────────────────────────────────
//  Helpers de UI
// ────────────────────────────────────────────────────────────────────────────

@Composable
private fun CalcRow(content: @Composable RowScope.() -> Unit) {
    Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            content = content,
    )
}

/** Formatea un Double para mostrar en pantalla de calculadora */
private fun formatCalc(v: Double): String =
        if (v == v.toLong().toDouble()) v.toLong().toString()
        else "%.6g".format(v).trimEnd('0').trimEnd('.')
