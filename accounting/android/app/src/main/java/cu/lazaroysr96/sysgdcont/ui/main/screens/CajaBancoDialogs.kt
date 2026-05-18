package cu.lazaroysr96.sysgdcont.ui.main.screens

import cu.lazaroysr96.sysgdcont.data.model.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ---------------------------------------------------------------------------
// Componentes de estructura de sheet compartidos
// ---------------------------------------------------------------------------

@Composable
private fun SheetHandle() {
    Box(Modifier.fillMaxWidth().padding(top = 12.dp, bottom = 4.dp), contentAlignment = Alignment.Center) {
        Box(Modifier.width(36.dp).height(4.dp).clip(RoundedCornerShape(2.dp))
            .background(MaterialTheme.colorScheme.outlineVariant))
    }
}

@Composable
private fun SheetTitle(text: String) {
    Text(text, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold,
        modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp))
}

@Composable
private fun SheetDivider() {
    Divider(color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp,
        modifier = Modifier.padding(bottom = 12.dp))
}

@Composable
private fun SheetActions(
    confirmLabel: String,
    confirmEnabled: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        TextButton(onClick = onDismiss, modifier = Modifier.weight(1f),
            colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.onSurfaceVariant)) {
            Text("Cancelar")
        }
        TextButton(onClick = onConfirm, enabled = confirmEnabled, modifier = Modifier.weight(1f),
            colors = ButtonDefaults.textButtonColors(
                contentColor = Color(0xFF1D4ED8),
                disabledContentColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
            )) {
            Text(confirmLabel, fontWeight = FontWeight.Medium)
        }
    }
}

// ---------------------------------------------------------------------------
// Dropdowns reutilizables
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletDropdown2(
    label: String,
    wallets: List<Wallet2>,
    selected: Wallet2?,
    onSelect: (Wallet2) -> Unit,
    modifier: Modifier = Modifier,
    excludeId: String? = null,
) {
    var expanded by remember { mutableStateOf(false) }
    val opciones = wallets.filter { it.activo && it.id != excludeId }

    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }, modifier = modifier) {
        OutlinedTextField(
            value = selected?.nombre ?: "",
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            placeholder = { Text("Seleccionar…", color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)) },
            trailingIcon = { Icon(Icons.Outlined.ExpandMore, null, Modifier.size(20.dp)) },
            leadingIcon = if (selected != null) {
                {
                    Box(
                        Modifier.size(28.dp).clip(RoundedCornerShape(6.dp))
                            .background(walletContainerOf(selected.tipo)),
                        contentAlignment = Alignment.Center,
                    ) { Icon(walletIconOf(selected.tipo), null, Modifier.size(15.dp), tint = walletColorOf(selected.tipo)) }
                }
            } else null,
            modifier = Modifier.fillMaxWidth().menuAnchor(),
            shape = RoundedCornerShape(10.dp),
            singleLine = true,
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            opciones.forEach { w ->
                DropdownMenuItem(
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Box(Modifier.size(26.dp).clip(RoundedCornerShape(6.dp))
                                .background(walletContainerOf(w.tipo)), contentAlignment = Alignment.Center) {
                                Icon(walletIconOf(w.tipo), null, Modifier.size(14.dp), tint = walletColorOf(w.tipo))
                            }
                            Column {
                                Text(w.nombre, style = MaterialTheme.typography.bodyMedium)
                                Text(tipoWalletLabel(w.tipo), style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    },
                    onClick = { onSelect(w); expanded = false },
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MonedaDropdown(
    label: String,
    monedas: List<Moneda>,
    selected: Moneda?,
    onSelect: (Moneda) -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }, modifier = modifier) {
        OutlinedTextField(
            value = if (selected != null) "${selected.nombre} (${selected.tipo})" else "",
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            placeholder = { Text("Seleccionar moneda") },
            trailingIcon = { Icon(Icons.Outlined.ExpandMore, null, Modifier.size(20.dp)) },
            modifier = Modifier.fillMaxWidth().menuAnchor(),
            shape = RoundedCornerShape(10.dp),
            singleLine = true,
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            monedas.forEach { m ->
                DropdownMenuItem(
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(Modifier.size(26.dp).clip(RoundedCornerShape(6.dp)).background(Color(0xFFEFF6FF)),
                                contentAlignment = Alignment.Center) {
                                Text(m.tipo.take(2), style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Medium, color = Color(0xFF1D4ED8))
                            }
                            Column {
                                Text(m.nombre, style = MaterialTheme.typography.bodyMedium)
                                Text(m.tipo, style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    },
                    onClick = { onSelect(m); expanded = false },
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun <T> EnumDropdown2(
    label: String,
    options: List<T>,
    selected: T?,
    labelFor: (T) -> String,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }, modifier = modifier) {
        OutlinedTextField(
            value = selected?.let { labelFor(it) } ?: "",
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            placeholder = { Text("Seleccionar…") },
            trailingIcon = { Icon(Icons.Outlined.ExpandMore, null, Modifier.size(20.dp)) },
            modifier = Modifier.fillMaxWidth().menuAnchor(),
            shape = RoundedCornerShape(10.dp),
            singleLine = true,
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { opt ->
                DropdownMenuItem(
                    text = { Text(labelFor(opt)) },
                    onClick = { onSelect(opt); expanded = false },
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 1. Sheet: Crear / editar wallet (con selector de moneda)
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Wallet2FormSheet(
    walletInicial: Wallet2? = null,
    monedas: List<Moneda>,
    sheetState: SheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
    onDismiss: () -> Unit,
    onConfirm: (nombre: String, tipo: WalletTipo, saldo: Double, monedaId: String) -> Unit,
) {
    val editando = walletInicial != null
    val focus = LocalFocusManager.current
    var nombre by remember { mutableStateOf(walletInicial?.nombre ?: "") }
    var tipo by remember { mutableStateOf(walletInicial?.tipo ?: WalletTipo.EFECTIVO) }
    var saldoTxt by remember { mutableStateOf(walletInicial?.saldoInicial?.toString() ?: "") }
    var moneda by remember {
        mutableStateOf(monedas.find { it.id == walletInicial?.monedaId } ?: monedas.monedaBase() ?: monedas.firstOrNull())
    }
    var errNombre by remember { mutableStateOf(false) }
    var errSaldo by remember { mutableStateOf(false) }
    var errMoneda by remember { mutableStateOf(false) }
    val saldo = saldoTxt.replace(",", ".").toDoubleOrNull()
    val valido = nombre.isNotBlank() && saldo != null && saldo >= 0 && moneda != null

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, dragHandle = null) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState())
                .imePadding().windowInsetsPadding(WindowInsets.navigationBars),
        ) {
            SheetHandle()
            SheetTitle(if (editando) "Editar wallet" else "Nueva wallet")
            SheetDivider()
            Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                OutlinedTextField(
                    value = nombre, onValueChange = { nombre = it; errNombre = false },
                    label = { Text("Nombre") }, placeholder = { Text("Ej. BPA 9208") },
                    isError = errNombre,
                    supportingText = if (errNombre) { { Text("El nombre es obligatorio") } } else null,
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences, imeAction = ImeAction.Next),
                    keyboardActions = KeyboardActions(onNext = { focus.moveFocus(FocusDirection.Down) }),
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp),
                )
                EnumDropdown2(
                    label = "Tipo",
                    options = WalletTipo.entries,
                    selected = tipo,
                    labelFor = ::tipoWalletLabel,
                    onSelect = { tipo = it },
                )
                MonedaDropdown(
                    label = "Moneda",
                    monedas = monedas,
                    selected = moneda,
                    onSelect = { moneda = it; errMoneda = false },
                )
                if (errMoneda) Text("Selecciona una moneda", style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.error)
                OutlinedTextField(
                    value = saldoTxt, onValueChange = { saldoTxt = it; errSaldo = false },
                    label = { Text(if (editando) "Saldo actual" else "Saldo inicial") },
                    placeholder = { Text("0.00") },
                    isError = errSaldo,
                    supportingText = if (errSaldo) { { Text("Monto inválido") } } else null,
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal, imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { focus.clearFocus() }),
                    prefix = { Text("$") },
                    suffix = { Text(moneda?.tipo ?: "CUP") },
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp),
                )
            }
            SheetActions(
                confirmLabel = if (editando) "Guardar" else "Crear wallet",
                confirmEnabled = valido,
                onDismiss = onDismiss,
                onConfirm = {
                    var ok = true
                    if (nombre.isBlank()) { errNombre = true; ok = false }
                    if (saldo == null) { errSaldo = true; ok = false }
                    if (moneda == null) { errMoneda = true; ok = false }
                    if (ok) onConfirm(nombre.trim(), tipo, saldo!!, moneda!!.id)
                },
            )
        }
    }
}

// ---------------------------------------------------------------------------
// 2. Sheet: Entrada (con multimoneda + tasa)
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Entrada2Sheet(
    wallets: List<Wallet2>,
    monedas: List<Moneda>,
    monedaTasas: List<MonedaTasa>,
    sheetState: SheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
    onDismiss: () -> Unit,
    onConfirm: (walletDestinoId: String, monto: Double, monedaId: String, tasa: Double, ref: WalletReferenciaTipo, nota: String, fecha: String) -> Unit,
) {
    MovimientoSheet2(
        titulo = "Entrada de dinero",
        tipoMov = WalletMovimientoTipo.ENTRADA,
        wallets = wallets, monedas = monedas, monedaTasas = monedaTasas,
        sheetState = sheetState, onDismiss = onDismiss,
        refOptions = listOf(WalletReferenciaTipo.INGRESO, WalletReferenciaTipo.OPERACION_POS, WalletReferenciaTipo.MANUAL),
        confirmLabel = "Registrar entrada",
        onConfirm = { wO, wD, m, mid, t, ref, n, f -> onConfirm(wD!!, m, mid, t, ref, n, f) },
    )
}

// ---------------------------------------------------------------------------
// 3. Sheet: Salida (con multimoneda + tasa)
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Salida2Sheet(
    wallets: List<Wallet2>,
    monedas: List<Moneda>,
    monedaTasas: List<MonedaTasa>,
    sheetState: SheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
    onDismiss: () -> Unit,
    onConfirm: (walletOrigenId: String, monto: Double, monedaId: String, tasa: Double, ref: WalletReferenciaTipo, nota: String, fecha: String) -> Unit,
) {
    MovimientoSheet2(
        titulo = "Salida de dinero",
        tipoMov = WalletMovimientoTipo.SALIDA,
        wallets = wallets, monedas = monedas, monedaTasas = monedaTasas,
        sheetState = sheetState, onDismiss = onDismiss,
        refOptions = listOf(WalletReferenciaTipo.GASTO, WalletReferenciaTipo.MANUAL),
        confirmLabel = "Registrar salida",
        onConfirm = { wO, wD, m, mid, t, ref, n, f -> onConfirm(wO!!, m, mid, t, ref, n, f) },
    )
}

// ---------------------------------------------------------------------------
// 4. Sheet: Transferencia (con multimoneda + tasa)
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Transferencia2Sheet(
    wallets: List<Wallet2>,
    monedas: List<Moneda>,
    monedaTasas: List<MonedaTasa>,
    sheetState: SheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
    onDismiss: () -> Unit,
    onConfirm: (origenId: String, destinoId: String, monto: Double, monedaId: String, tasa: Double, nota: String, fecha: String) -> Unit,
) {
    MovimientoSheet2(
        titulo = "Transferencia entre wallets",
        tipoMov = WalletMovimientoTipo.TRANSFERENCIA,
        wallets = wallets, monedas = monedas, monedaTasas = monedaTasas,
        sheetState = sheetState, onDismiss = onDismiss,
        refOptions = listOf(WalletReferenciaTipo.MANUAL),
        confirmLabel = "Registrar transferencia",
        onConfirm = { wO, wD, m, mid, t, _, n, f -> onConfirm(wO!!, wD!!, m, mid, t, n, f) },
    )
}

// ---------------------------------------------------------------------------
// Sheet de movimiento unificado (interno)
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MovimientoSheet2(
    titulo: String,
    tipoMov: WalletMovimientoTipo,
    wallets: List<Wallet2>,
    monedas: List<Moneda>,
    monedaTasas: List<MonedaTasa>,
    sheetState: SheetState,
    onDismiss: () -> Unit,
    refOptions: List<WalletReferenciaTipo>,
    confirmLabel: String,
    onConfirm: (wOrig: String?, wDest: String?, monto: Double, monedaId: String, tasa: Double, ref: WalletReferenciaTipo, nota: String, fecha: String) -> Unit,
) {
    val focus = LocalFocusManager.current
    val base = monedas.monedaBase()

    var walletOrigen by remember { mutableStateOf<Wallet2?>(null) }
    var walletDestino by remember { mutableStateOf<Wallet2?>(null) }
    var montoTxt by remember { mutableStateOf("") }
    var moneda by remember { mutableStateOf(base ?: monedas.firstOrNull()) }
    var tasaPersonalizada by remember { mutableStateOf("") }
    var referencia by remember { mutableStateOf<WalletReferenciaTipo?>(null) }
    var nota by remember { mutableStateOf("") }
    var fecha by remember { mutableStateOf(java.time.LocalDate.now().toString()) }

    var errOrigen by remember { mutableStateOf(false) }
    var errDestino by remember { mutableStateOf(false) }
    var errMonto by remember { mutableStateOf(false) }
    var errMoneda by remember { mutableStateOf(false) }
    var errRef by remember { mutableStateOf(false) }

    val monto = montoTxt.replace(",", ".").toDoubleOrNull()
    val tasaDefault = monedaTasas.find { it.id == moneda?.tasaId }?.tasa ?: 1.0
    val tasaFinal = tasaPersonalizada.replace(",", ".").toDoubleOrNull() ?: tasaDefault
    val montoEnBase by remember(montoTxt, tasaFinal) {
        derivedStateOf { (monto ?: 0.0) * tasaFinal }
    }
    val esExtranjera = moneda != null && moneda?.tipo != "CUP"
    val mismaWallet = tipoMov == WalletMovimientoTipo.TRANSFERENCIA &&
        walletOrigen != null && walletOrigen?.id == walletDestino?.id

    val valido = monto != null && monto > 0 && moneda != null && !mismaWallet &&
        (tipoMov != WalletMovimientoTipo.ENTRADA || walletDestino != null) &&
        (tipoMov != WalletMovimientoTipo.SALIDA || walletOrigen != null) &&
        (tipoMov != WalletMovimientoTipo.TRANSFERENCIA || (walletOrigen != null && walletDestino != null)) &&
        (refOptions.size == 1 || referencia != null)

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, dragHandle = null) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState())
                .imePadding().windowInsetsPadding(WindowInsets.navigationBars),
        ) {
            SheetHandle()
            SheetTitle(titulo)
            SheetDivider()

            Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {

                // Wallet origen (SALIDA y TRANSFERENCIA)
                if (tipoMov == WalletMovimientoTipo.SALIDA || tipoMov == WalletMovimientoTipo.TRANSFERENCIA) {
                    WalletDropdown2(
                        label = if (tipoMov == WalletMovimientoTipo.TRANSFERENCIA) "Wallet origen" else "Desde wallet",
                        wallets = wallets, selected = walletOrigen,
                        onSelect = { walletOrigen = it; errOrigen = false },
                    )
                    if (errOrigen) Text("Selecciona la wallet origen",
                        style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
                }

                // Wallet destino (ENTRADA y TRANSFERENCIA)
                if (tipoMov == WalletMovimientoTipo.ENTRADA || tipoMov == WalletMovimientoTipo.TRANSFERENCIA) {
                    WalletDropdown2(
                        label = if (tipoMov == WalletMovimientoTipo.TRANSFERENCIA) "Wallet destino" else "A wallet",
                        wallets = wallets, selected = walletDestino,
                        excludeId = walletOrigen?.id,
                        onSelect = { walletDestino = it; errDestino = false },
                    )
                    if (errDestino) Text("Selecciona la wallet destino",
                        style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
                    if (mismaWallet) Text("El origen y el destino no pueden ser la misma wallet",
                        style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
                }

                // Moneda
                MonedaDropdown("Moneda", monedas, moneda, onSelect = { moneda = it; errMoneda = false })
                if (errMoneda) Text("Selecciona una moneda",
                    style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)

                // Monto
                OutlinedTextField(
                    value = montoTxt, onValueChange = { montoTxt = it; errMonto = false },
                    label = { Text("Monto") }, placeholder = { Text("0.00") },
                    isError = errMonto,
                    supportingText = if (errMonto) { { Text("Monto inválido o cero") } } else null,
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal, imeAction = ImeAction.Next),
                    keyboardActions = KeyboardActions(onNext = { focus.moveFocus(FocusDirection.Down) }),
                    prefix = { Text("$") },
                    suffix = { Text(moneda?.tipo ?: "CUP") },
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp),
                )

                // Tasa personalizable (solo si moneda extranjera)
                if (esExtranjera) {
                    OutlinedTextField(
                        value = tasaPersonalizada,
                        onValueChange = { tasaPersonalizada = it },
                        label = { Text("Tasa de cambio (1 ${moneda?.tipo} = X ${base?.tipo ?: "CUP"})") },
                        placeholder = { Text("$tasaDefault") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal, imeAction = ImeAction.Next),
                        keyboardActions = KeyboardActions(onNext = { focus.moveFocus(FocusDirection.Down) }),
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp),
                    )
                    // Preview del equivalente en base
                    if (monto != null && monto > 0) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFEFF6FF)),
                            shape = RoundedCornerShape(8.dp),
                            elevation = CardDefaults.cardElevation(0.dp),
                        ) {
                            Row(
                                Modifier.fillMaxWidth().padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Text("Equivalente en ${base?.tipo ?: "CUP"}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Color(0xFF1D4ED8))
                                Text(formatCup(montoEnBase),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Medium, color = Color(0xFF1D4ED8))
                            }
                        }
                    }
                }

                // Concepto (si hay más de una opción)
                if (refOptions.size > 1) {
                    EnumDropdown2(
                        label = "Concepto",
                        options = refOptions,
                        selected = referencia,
                        labelFor = ::refLabel,
                        onSelect = { referencia = it; errRef = false },
                    )
                    if (errRef) Text("Selecciona un concepto",
                        style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
                }

                // Nota
                OutlinedTextField(
                    value = nota, onValueChange = { nota = it },
                    label = { Text("Nota (opcional)") },
                    placeholder = { Text("Descripción del movimiento") },
                    singleLine = false, maxLines = 3,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp),
                )

                // Fecha
                OutlinedTextField(
                    value = fecha, onValueChange = { fecha = it },
                    label = { Text("Fecha") }, placeholder = { Text("AAAA-MM-DD") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { focus.clearFocus() }),
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp),
                )
            }

            SheetActions(
                confirmLabel = confirmLabel,
                confirmEnabled = valido,
                onDismiss = onDismiss,
                onConfirm = {
                    var ok = true
                    if (monto == null || monto <= 0) { errMonto = true; ok = false }
                    if (moneda == null) { errMoneda = true; ok = false }
                    if (tipoMov != WalletMovimientoTipo.ENTRADA && walletOrigen == null) { errOrigen = true; ok = false }
                    if (tipoMov != WalletMovimientoTipo.SALIDA && walletDestino == null) { errDestino = true; ok = false }
                    val ref = if (refOptions.size == 1) refOptions.first() else referencia
                    if (ref == null) { errRef = true; ok = false }
                    if (ok) onConfirm(walletOrigen?.id, walletDestino?.id, monto!!, moneda!!.id, tasaFinal, ref!!, nota.trim(), fecha)
                },
            )
        }
    }
}

// ---------------------------------------------------------------------------
// 5. Sheet: Detalle de movimiento
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Movimiento2DetalleSheet(
    movimiento: WalletMovimiento,
    wallets: List<Wallet2>,
    monedas: List<Moneda>,
    sheetState: SheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
    onDismiss: () -> Unit,
    onEditarNota: (String) -> Unit,
    onEliminar: () -> Unit,
) {
    var modoEdicion by remember { mutableStateOf(false) }
    var nuevaNota by remember { mutableStateOf(movimiento.nota) }
    var pedirEliminar by remember { mutableStateOf(false) }

    val walletOrigen = wallets.find { it.id == movimiento.walletOrigenId }
    val walletDestino = wallets.find { it.id == movimiento.walletDestinoId }
    val moneda = monedas.monedaById(movimiento.monedaId)
    val colorTipo = movColorOf(movimiento.tipo)
    val montoEnBase = movimiento.monto * movimiento.tasaAlMomento

    if (pedirEliminar) {
        AlertDialog(
            onDismissRequest = { pedirEliminar = false },
            title = { Text("Eliminar movimiento") },
            text = { Text("¿Eliminar \"${movimiento.nota.ifBlank { movimiento.tipo.name }}\"? Esta acción no se puede deshacer.",
                style = MaterialTheme.typography.bodyMedium) },
            confirmButton = {
                TextButton(onClick = { pedirEliminar = false; onEliminar() },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)) {
                    Text("Eliminar")
                }
            },
            dismissButton = { TextButton(onClick = { pedirEliminar = false }) { Text("Cancelar") } },
        )
    }

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, dragHandle = null) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState())
                .imePadding().windowInsetsPadding(WindowInsets.navigationBars),
        ) {
            SheetHandle()
            // Cabecera con monto
            Column(
                Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 10.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    when (movimiento.tipo) {
                        WalletMovimientoTipo.ENTRADA -> "+${formatCup(montoEnBase)}"
                        WalletMovimientoTipo.SALIDA -> "-${formatCup(montoEnBase)}"
                        WalletMovimientoTipo.TRANSFERENCIA -> formatCup(montoEnBase)
                    } + " CUP",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Medium, color = colorTipo,
                )
                if (moneda != null && moneda.tipo != "CUP") {
                    Text("${movimiento.monto} ${moneda.tipo} @ ${movimiento.tasaAlMomento}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Text(movimiento.tipo.name, style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            SheetDivider()

            Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                DetalleField("Fecha", movimiento.fecha)
                if (walletOrigen != null) DetalleField("Origen", walletOrigen.nombre)
                if (walletDestino != null) DetalleField("Destino", walletDestino.nombre)
                moneda?.let { DetalleField("Moneda", "${it.nombre} (${it.tipo})") }
                movimiento.referenciaTipo?.let { DetalleField("Concepto", refLabel(it)) }
                if (modoEdicion) {
                    OutlinedTextField(
                        value = nuevaNota, onValueChange = { nuevaNota = it },
                        label = { Text("Nota") }, singleLine = false, maxLines = 4,
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp),
                        keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
                    )
                } else {
                    DetalleField("Nota", movimiento.nota.ifBlank { "Sin nota" })
                }
            }
            Spacer(Modifier.height(12.dp))

            if (modoEdicion) {
                SheetActions(
                    confirmLabel = "Guardar nota",
                    confirmEnabled = true,
                    onDismiss = { modoEdicion = false; nuevaNota = movimiento.nota },
                    onConfirm = { onEditarNota(nuevaNota.trim()); modoEdicion = false },
                )
            } else {
                Row(
                    Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    TextButton(onClick = { pedirEliminar = true }, Modifier.weight(1f),
                        colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)) {
                        Icon(Icons.Outlined.Delete, null, Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Eliminar")
                    }
                    TextButton(onClick = { modoEdicion = true }, Modifier.weight(1f),
                        colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFF1D4ED8))) {
                        Icon(Icons.Outlined.Edit, null, Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Editar nota", fontWeight = FontWeight.Medium)
                    }
                }
            }
        }
    }
}

@Composable
private fun DetalleField(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
    }
}

// ---------------------------------------------------------------------------
// 6. Sheet: Crear nueva moneda
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MonedaFormSheet(
    monedaBase: Moneda?,
    sheetState: SheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
    onDismiss: () -> Unit,
    onConfirm: (nombre: String, tipo: String, tasa: Double) -> Unit,
) {
    val focus = LocalFocusManager.current
    var nombre by remember { mutableStateOf("") }
    var tipo by remember { mutableStateOf("") }
    var tasaTxt by remember { mutableStateOf("") }
    var errNombre by remember { mutableStateOf(false) }
    var errTipo by remember { mutableStateOf(false) }
    var errTasa by remember { mutableStateOf(false) }
    val tasa = tasaTxt.replace(",", ".").toDoubleOrNull()
    val valido = nombre.isNotBlank() && tipo.isNotBlank() && tasa != null && tasa > 0

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, dragHandle = null) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState())
                .imePadding().windowInsetsPadding(WindowInsets.navigationBars),
        ) {
            SheetHandle()
            SheetTitle("Nueva moneda")
            SheetDivider()
            Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                OutlinedTextField(
                    value = nombre, onValueChange = { nombre = it; errNombre = false },
                    label = { Text("Nombre") }, placeholder = { Text("Ej. Dólar Estadounidense") },
                    isError = errNombre,
                    supportingText = if (errNombre) { { Text("Nombre obligatorio") } } else null,
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words, imeAction = ImeAction.Next),
                    keyboardActions = KeyboardActions(onNext = { focus.moveFocus(FocusDirection.Down) }),
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp),
                )
                OutlinedTextField(
                    value = tipo, onValueChange = { tipo = it.uppercase().take(5); errTipo = false },
                    label = { Text("Código ISO (máx. 5 chars)") }, placeholder = { Text("USD") },
                    isError = errTipo,
                    supportingText = if (errTipo) { { Text("Código obligatorio") } } else null,
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters, imeAction = ImeAction.Next),
                    keyboardActions = KeyboardActions(onNext = { focus.moveFocus(FocusDirection.Down) }),
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp),
                )
                OutlinedTextField(
                    value = tasaTxt, onValueChange = { tasaTxt = it; errTasa = false },
                    label = { Text("Tasa inicial (1 ${tipo.ifBlank { "XXX" }} = X ${monedaBase?.tipo ?: "CUP"})") },
                    placeholder = { Text("350") },
                    isError = errTasa,
                    supportingText = if (errTasa) { { Text("Tasa inválida o cero") } } else null,
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal, imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { focus.clearFocus() }),
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp),
                )
            }
            SheetActions(
                confirmLabel = "Crear moneda",
                confirmEnabled = valido,
                onDismiss = onDismiss,
                onConfirm = {
                    var ok = true
                    if (nombre.isBlank()) { errNombre = true; ok = false }
                    if (tipo.isBlank()) { errTipo = true; ok = false }
                    if (tasa == null || tasa <= 0) { errTasa = true; ok = false }
                    if (ok) onConfirm(nombre.trim(), tipo, tasa!!)
                },
            )
        }
    }
}

// ---------------------------------------------------------------------------
// 7. Sheet: Editar tasa de cambio
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditarTasaSheet(
    moneda: Moneda,
    tasaActual: Double,
    monedaBase: Moneda?,
    sheetState: SheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
    onDismiss: () -> Unit,
    onConfirm: (nuevaTasa: Double) -> Unit,
) {
    val focus = LocalFocusManager.current
    var tasaTxt by remember { mutableStateOf(tasaActual.toString()) }
    var errTasa by remember { mutableStateOf(false) }
    val tasa = tasaTxt.replace(",", ".").toDoubleOrNull()

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, dragHandle = null) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState())
                .imePadding().windowInsetsPadding(WindowInsets.navigationBars),
        ) {
            SheetHandle()
            SheetTitle("Actualizar tasa — ${moneda.tipo}")
            SheetDivider()
            Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("Tasa actual: 1 ${moneda.tipo} = ${formatCup(tasaActual)} ${monedaBase?.tipo ?: "CUP"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                OutlinedTextField(
                    value = tasaTxt, onValueChange = { tasaTxt = it; errTasa = false },
                    label = { Text("Nueva tasa (1 ${moneda.tipo} = X ${monedaBase?.tipo ?: "CUP"})") },
                    isError = errTasa,
                    supportingText = if (errTasa) { { Text("Tasa inválida o cero") } } else null,
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal, imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { focus.clearFocus() }),
                    modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp),
                )
            }
            SheetActions(
                confirmLabel = "Guardar tasa",
                confirmEnabled = tasa != null && tasa > 0,
                onDismiss = onDismiss,
                onConfirm = {
                    if (tasa == null || tasa <= 0) { errTasa = true; return@SheetActions }
                    onConfirm(tasa)
                },
            )
        }
    }
}

// ---------------------------------------------------------------------------
// 8. AlertDialogs
// ---------------------------------------------------------------------------

@Composable
fun EliminarWallet2Dialog(wallet: Wallet2, onDismiss: () -> Unit, onConfirm: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Eliminar wallet") },
        text = { Text("¿Eliminar \"${wallet.nombre}\"? Se perderán todos sus movimientos asociados. Esta acción no se puede deshacer.",
            style = MaterialTheme.typography.bodyMedium) },
        confirmButton = {
            TextButton(onClick = onConfirm,
                colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)) {
                Text("Eliminar")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } },
    )
}

@Composable
fun CrearMonedaBaseDialog(onDismiss: () -> Unit, onConfirm: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Crear moneda base") },
        text = { Text("Se creará el Peso Cubano (CUP) como moneda base del sistema con tasa 1.0. Esta es la moneda de referencia para todas las conversiones.",
            style = MaterialTheme.typography.bodyMedium) },
        confirmButton = {
            TextButton(onClick = onConfirm,
                colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFF1D4ED8))) {
                Text("Crear CUP", fontWeight = FontWeight.Medium)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } },
    )
}
