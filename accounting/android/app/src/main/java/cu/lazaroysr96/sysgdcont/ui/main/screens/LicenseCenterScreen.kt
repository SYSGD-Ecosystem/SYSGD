package cu.lazaroysr96.sysgdcont.ui.main.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cu.lazaroysr96.sysgdcont.data.model.ManualPaymentProduct
import cu.lazaroysr96.sysgdcont.data.model.UserPlanResponse
import cu.lazaroysr96.sysgdcont.viewmodel.PlanPurchaseUiState
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import kotlin.math.max

@Composable
fun LicenseCenterScreen(
    experimentalFeaturesEnabled: Boolean,
    uiState: PlanPurchaseUiState,
    onRefresh: () -> Unit,
    onSubmit: (String, String, String, Boolean, Boolean) -> Unit,
    onDismissError: () -> Unit,
    onDismissInfo: () -> Unit
) {
    val context = LocalContext.current
    var selectedProductId by rememberSaveable { mutableStateOf("") }
    var payerPhone by rememberSaveable { mutableStateOf("") }
    var smsMessage by rememberSaveable { mutableStateOf("") }
    var confirmationPhoneAcknowledged by rememberSaveable { mutableStateOf(false) }
    var receiverPhoneShared by rememberSaveable { mutableStateOf(false) }

    val products = uiState.catalog?.products.orEmpty()
    val instructions = uiState.catalog?.instructions
    val currentPlan = uiState.currentPlan
    val activeTier = currentPlan?.tier ?: "free"
    val hasActiveLicense = currentPlan?.hasActivePlan == true && activeTier != "free"
    val availableTiers = products.map { it.tier }.distinct()
    var selectedTier by rememberSaveable { mutableStateOf("") }
    var selectedDurationMonths by rememberSaveable { mutableStateOf(0) }

    val tierProducts = products.filter { it.tier == selectedTier }
    val selectedProduct = tierProducts.firstOrNull { it.duration_months == selectedDurationMonths }
        ?: products.firstOrNull { it.id == selectedProductId }
        ?: products.firstOrNull()

    LaunchedEffect(products) {
        if (products.isNotEmpty()) {
            val fallback = products.first()
            if (selectedTier.isBlank() || availableTiers.none { it == selectedTier }) {
                selectedTier = fallback.tier
            }
            val validDurations = products.filter { it.tier == selectedTier }.map { it.duration_months }
            if (selectedDurationMonths == 0 || validDurations.none { it == selectedDurationMonths }) {
                selectedDurationMonths = products.first { it.tier == selectedTier }.duration_months
            }
            val resolvedProduct = products.firstOrNull {
                it.tier == selectedTier && it.duration_months == selectedDurationMonths
            } ?: fallback
            selectedProductId = resolvedProduct.id
        }
    }

    LaunchedEffect(uiState.lastSubmittedAt) {
        if (uiState.lastSubmittedAt > 0L) {
            payerPhone = ""
            smsMessage = ""
            confirmationPhoneAcknowledged = false
            receiverPhoneShared = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Licencias y planes", style = MaterialTheme.typography.titleMedium)
        Text(
            "Aquí puedes comprar, renovar o revisar tu licencia Pro o VIP. Este flujo sigue siendo experimental para depuración, pero ya activa el plan a nivel de plataforma cuando la compra entra en modo provisional.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        if (!experimentalFeaturesEnabled) {
            StatusCard(
                title = "Función experimental",
                body = "Activa las funciones experimentales desde Acerca de para probar la compra y renovación de licencias desde esta app.",
                highlighted = false,
                onAction = onRefresh,
                actionLabel = "Actualizar"
            )
        }

        LicenseSummaryCard(
            currentPlan = currentPlan,
            hasActiveLicense = hasActiveLicense
        )

        if (uiState.catalog != null) {
            PurchaseStepperCard(
                currentStep = when {
                    !confirmationPhoneAcknowledged || !receiverPhoneShared -> 3
                    selectedProduct == null -> 1
                    else -> 2
                }
            )
        }

        if (uiState.isLoading && uiState.catalog == null) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            uiState.error?.let { error ->
                StatusCard(
                    title = "No se pudo cargar todo",
                    body = error,
                    highlighted = true,
                    onAction = onDismissError,
                    actionLabel = "Ocultar"
                )
            }

            uiState.infoMessage?.let { message ->
                StatusCard(
                    title = "Estado de la solicitud",
                    body = message,
                    highlighted = false,
                    onAction = onDismissInfo,
                    actionLabel = "Cerrar"
                )
            }

            instructions?.let {
                Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp)) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text("Paso 2. Realiza el pago", fontWeight = FontWeight.SemiBold)
                        CopyableValueRow(
                            label = "Tarjeta destino",
                            value = it.receiverCard,
                            buttonLabel = "Copiar tarjeta",
                            onCopy = { copyToClipboard(context, "Tarjeta", it.receiverCard) }
                        )
                        CopyableValueRow(
                            label = "Teléfono a confirmar",
                            value = it.confirmationPhone,
                            buttonLabel = "Copiar teléfono",
                            onCopy = { copyToClipboard(context, "Teléfono", it.confirmationPhone) }
                        )
                        it.importantNotes.forEach { note ->
                            Text("• $note", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }

            Text(
                "Paso 1. Elige tu licencia",
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                if (hasActiveLicense)
                    "Puedes renovar tu plan actual o subir al siguiente nivel sin perder claridad en el flujo."
                else
                    "Selecciona primero el tipo de licencia y luego la duración.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            SelectionSectionCard(
                title = "Tipo de licencia",
                subtitle = "Usa Pro para funciones premium y VIP para acceso experimental adicional."
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    availableTiers.forEach { tier ->
                        SelectionPillCard(
                            modifier = Modifier.weight(1f),
                            title = formatTier(tier),
                            subtitle = if (tier == "vip") "Todo Pro + extras" else "Plan premium base",
                            selected = tier == selectedTier,
                            onClick = {
                                selectedTier = tier
                                selectedDurationMonths = products.first { it.tier == tier }.duration_months
                                selectedProductId = products.first {
                                    it.tier == selectedTier && it.duration_months == selectedDurationMonths
                                }.id
                            }
                        )
                    }
                }
            }

            SelectionSectionCard(
                title = "Duración",
                subtitle = "La duración cambia el precio y el ahorro aplicado."
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    tierProducts.sortedBy { it.duration_months }.forEach { product ->
                        SelectionPillCard(
                            modifier = Modifier.weight(1f),
                            title = durationLabel(product.duration_months),
                            subtitle = "${product.price_cup} CUP",
                            selected = product.duration_months == selectedDurationMonths,
                            onClick = {
                                selectedDurationMonths = product.duration_months
                                selectedProductId = product.id
                            }
                        )
                    }
                }
            }

            selectedProduct?.let { product ->
                ProductSummaryCard(
                    product = product,
                    hasActiveLicense = hasActiveLicense
                )
            }

            Text(
                "Paso 3. Confirma la operación",
                style = MaterialTheme.typography.titleMedium
            )

            OutlinedTextField(
                value = payerPhone,
                onValueChange = { payerPhone = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Tu número móvil") },
                supportingText = { Text("Debe coincidir con el número desde el que hiciste la transferencia.") },
                singleLine = true
            )

            OutlinedTextField(
                value = smsMessage,
                onValueChange = { smsMessage = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Mensaje recibido de Transfermóvil") },
                supportingText = { Text("Pega el SMS completo para validar monto, fecha y transacción.") },
                minLines = 5
            )

            ConfirmationSwitchRow(
                title = "Confirmé el teléfono 51158544",
                body = "Es obligatorio para poder verificar la compra con menos fricción.",
                checked = confirmationPhoneAcknowledged,
                onCheckedChange = { confirmationPhoneAcknowledged = it }
            )

            ConfirmationSwitchRow(
                title = "Marqué que el destinatario recibe mi número",
                body = "Eso ayuda a identificar la operación más rápido en el historial.",
                checked = receiverPhoneShared,
                onCheckedChange = { receiverPhoneShared = it }
            )

            val canSubmitPurchase =
                selectedProduct != null &&
                    confirmationPhoneAcknowledged &&
                    receiverPhoneShared &&
                    payerPhone.isNotBlank() &&
                    smsMessage.isNotBlank() &&
                    !uiState.isSubmitting

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(
                    onClick = onRefresh,
                    enabled = !uiState.isLoading && !uiState.isSubmitting
                ) {
                    Text("Actualizar")
                }

                Button(
                    onClick = {
                        val productId = selectedProduct?.id ?: return@Button
                        onSubmit(
                            productId,
                            payerPhone,
                            smsMessage,
                            confirmationPhoneAcknowledged,
                            receiverPhoneShared
                        )
                    },
                    enabled = canSubmitPurchase
                ) {
                    if (uiState.isSubmitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.height(18.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(if (hasActiveLicense) "Renovar licencia" else "Comprar licencia")
                    }
                }
            }

            if (!confirmationPhoneAcknowledged || !receiverPhoneShared) {
                Text(
                    "Debes marcar ambas confirmaciones antes de poder enviar la compra.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            if (uiState.orders.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text("Solicitudes recientes", style = MaterialTheme.typography.titleMedium)
                uiState.orders.take(5).forEach { order ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    "${formatTier(order.plan_tier)} • ${order.duration_months} mes(es)",
                                    fontWeight = FontWeight.SemiBold
                                )
                                PlanTierBadge(order.plan_tier)
                            }
                            Text("${order.expected_amount_cup} CUP", style = MaterialTheme.typography.bodyMedium)
                            Text("Estado: ${formatStatus(order.status)}", style = MaterialTheme.typography.bodyMedium)
                            order.sms_transaction_id?.let { transactionId ->
                                Text("Transacción: $transactionId", style = MaterialTheme.typography.bodySmall)
                            }
                            order.grace_expires_at?.let { graceExpiresAt ->
                                Text(
                                    "Gracia provisional hasta: ${formatDate(graceExpiresAt)}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                            Text(
                                "Registrada: ${formatDate(order.created_at)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PurchaseStepperCard(currentStep: Int) {
    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text("Proceso de compra", style = MaterialTheme.typography.titleSmall)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                StepBadge(number = 1, label = "Plan", active = currentStep == 1)
                StepBadge(number = 2, label = "Pago", active = currentStep == 2)
                StepBadge(number = 3, label = "Confirmación", active = currentStep == 3)
            }
        }
    }
}

@Composable
private fun LicenseSummaryCard(
    currentPlan: UserPlanResponse?,
    hasActiveLicense: Boolean
) {
    val tier = currentPlan?.tier ?: "free"
    val validity = currentPlan?.planValidity

    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Estado de tu licencia", style = MaterialTheme.typography.titleMedium)
                PlanTierBadge(tier)
            }

            if (hasActiveLicense) {
                Text(
                    "Tienes activa la licencia ${formatTier(tier)} a nivel de plataforma.",
                    style = MaterialTheme.typography.bodyMedium
                )
                validity?.expiresAt?.let { expiresAt ->
                    Text(
                        "Vence el ${formatDate(expiresAt)}",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        remainingTimeLabel(expiresAt),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                validity?.durationMonths?.let { durationMonths ->
                    Text(
                        "Duración comprada: $durationMonths mes(es)",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                Text(
                    "No tienes una licencia activa en este momento. Puedes comprar una Pro o VIP desde esta misma pantalla.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            Text(
                "Créditos disponibles: ${currentPlan?.credits?.available ?: 0}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun CopyableValueRow(
    label: String,
    value: String,
    buttonLabel: String,
    onCopy: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                value,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold
            )
            OutlinedButton(onClick = onCopy) {
                Text(buttonLabel)
            }
        }
    }
}

@Composable
private fun ConfirmationSwitchRow(
    title: String,
    body: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                RoundedCornerShape(12.dp)
            )
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.SemiBold)
            Text(body, style = MaterialTheme.typography.bodySmall)
        }
        Spacer(modifier = Modifier.width(8.dp))
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SelectionPillCard(
    modifier: Modifier = Modifier,
    title: String,
    subtitle: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    val backgroundColor = if (selected) {
        MaterialTheme.colorScheme.primaryContainer
    } else {
        MaterialTheme.colorScheme.surface
    }

    Card(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(backgroundColor)
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(title, fontWeight = FontWeight.SemiBold)
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun SelectionSectionCard(
    title: String,
    subtitle: String,
    content: @Composable () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            content()
        }
    }
}

@Composable
private fun ProductSummaryCard(
    product: ManualPaymentProduct,
    hasActiveLicense: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.primaryContainer)
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(product.name, fontWeight = FontWeight.SemiBold)
                PlanTierBadge(product.tier)
            }
            Text("${product.price_cup} CUP", style = MaterialTheme.typography.titleMedium)
            Text(
                if (hasActiveLicense) "Resumen de renovación o mejora"
                else "Resumen del plan seleccionado",
                style = MaterialTheme.typography.labelMedium
            )
            Text(product.description, style = MaterialTheme.typography.bodySmall)
            if (product.discount_percent > 0) {
                Text(
                    "Incluye ${product.discount_percent}% de ahorro",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Text(
                product.features.joinToString(separator = " • "),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun StepBadge(number: Int, label: String, active: Boolean) {
    val background = if (active) {
        MaterialTheme.colorScheme.primaryContainer
    } else {
        MaterialTheme.colorScheme.surfaceVariant
    }
    val content = if (active) {
        MaterialTheme.colorScheme.onPrimaryContainer
    } else {
        MaterialTheme.colorScheme.onSurfaceVariant
    }

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .background(background, CircleShape)
                .padding(horizontal = 10.dp, vertical = 6.dp)
        ) {
            Text("$number", color = content, fontWeight = FontWeight.SemiBold)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(label, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun PlanTierBadge(tier: String) {
    val label = formatTier(tier)
    val background = when (tier.lowercase()) {
        "vip" -> MaterialTheme.colorScheme.tertiaryContainer
        "pro" -> MaterialTheme.colorScheme.primaryContainer
        else -> MaterialTheme.colorScheme.surfaceVariant
    }
    val contentColor = when (tier.lowercase()) {
        "vip" -> MaterialTheme.colorScheme.onTertiaryContainer
        "pro" -> MaterialTheme.colorScheme.onPrimaryContainer
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Box(
        modifier = Modifier
            .background(background, CircleShape)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = contentColor,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun StatusCard(
    title: String,
    body: String,
    highlighted: Boolean,
    onAction: () -> Unit,
    actionLabel: String
) {
    val backgroundColor = if (highlighted) {
        MaterialTheme.colorScheme.errorContainer
    } else {
        MaterialTheme.colorScheme.secondaryContainer
    }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(backgroundColor)
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(title, fontWeight = FontWeight.SemiBold)
            Text(body, style = MaterialTheme.typography.bodySmall)
            Button(onClick = onAction) {
                Text(actionLabel)
            }
        }
    }
}

private fun formatTier(tier: String): String = when (tier.lowercase()) {
    "pro" -> "PRO"
    "vip" -> "VIP"
    else -> "FREE"
}

private fun formatStatus(status: String): String = when (status) {
    "pending_review" -> "Pendiente de revisión"
    "provisional" -> "Activa en modo de prueba"
    "approved" -> "Aprobada"
    "rejected" -> "Rechazada"
    "expired" -> "Expirada"
    else -> status
}

private fun formatDate(value: String): String {
    return try {
        val instant = Instant.parse(value)
        val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.systemDefault())
        formatter.format(instant)
    } catch (_: Exception) {
        value.take(10)
    }
}

private fun remainingTimeLabel(expiresAt: String): String {
    return try {
        val remaining = Duration.between(Instant.now(), Instant.parse(expiresAt))
        val days = max(0, remaining.toDays().toInt())
        when {
            days == 0 -> "Vence hoy"
            days == 1 -> "Queda 1 día para renovar"
            else -> "Quedan $days días para renovar"
        }
    } catch (_: Exception) {
        "Consulta la fecha de vencimiento para renovar"
    }
}

private fun durationLabel(durationMonths: Int): String = when (durationMonths) {
    1 -> "1 mes"
    3 -> "3 meses"
    12 -> "1 año"
    else -> "$durationMonths meses"
}

private fun copyToClipboard(context: Context, label: String, text: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    clipboard.setPrimaryClip(ClipData.newPlainText(label, text))
    Toast.makeText(context, "$label copiado", Toast.LENGTH_SHORT).show()
}
