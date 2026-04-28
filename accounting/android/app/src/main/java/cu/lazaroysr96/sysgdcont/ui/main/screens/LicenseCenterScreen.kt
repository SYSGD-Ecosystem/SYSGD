package cu.lazaroysr96.sysgdcont.ui.main.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.outlined.Cancel
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cu.lazaroysr96.sysgdcont.data.model.ManualPaymentProduct
import cu.lazaroysr96.sysgdcont.data.model.UserPlanResponse
import cu.lazaroysr96.sysgdcont.viewmodel.PlanPurchaseUiState
import cu.lazaroysr96.sysgdcont.data.model.ManualPaymentOrder
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import kotlin.math.max

// ─── Datos estáticos de las ventajas PRO ─────────────────────────────────────

private data class ProFeature(val label: String, val availableInFree: Boolean)

private val PRO_FEATURES = listOf(
    ProFeature("Múltiples espacios de trabajo", availableInFree = false),
    ProFeature("Facturación avanzada en compras y ventas", availableInFree = false),
    ProFeature("Módulo de terceros (clientes y proveedores)", availableInFree = false),
    ProFeature("Nomencladores y clasificadores CNAE", availableInFree = false),
    ProFeature("Catálogos de cuentas y productos", availableInFree = true),
    ProFeature("Registro básico de ingresos y gastos", availableInFree = true),
)

// ─── Screen principal ─────────────────────────────────────────────────────────

@Composable
fun LicenseCenterScreen(
    experimentalFeaturesEnabled: Boolean,
    uiState: PlanPurchaseUiState,
    onRefresh: () -> Unit,
    onSubmit: (String, String, String, Boolean, Boolean) -> Unit,
    onDismissError: () -> Unit,
    onDismissInfo: () -> Unit,
    isProDistribution: Boolean
) {
    val context = LocalContext.current

    var selectedProductId by rememberSaveable { mutableStateOf("") }
    var payerPhone by rememberSaveable { mutableStateOf("") }
    var smsMessage by rememberSaveable { mutableStateOf("") }
    var confirmationPhoneAcknowledged by rememberSaveable { mutableStateOf(false) }
    var receiverPhoneShared by rememberSaveable { mutableStateOf(false) }

    val products = uiState.catalog?.products.orEmpty()
    val purchaseProducts = remember(products) {
        products.filter { it.tier.equals("pro", ignoreCase = true) }.ifEmpty { products }
    }
    val instructions = uiState.catalog?.instructions
    val currentPlan = uiState.currentPlan
    val activeTier = currentPlan?.tier ?: "free"
    val hasActiveLicense = currentPlan?.hasActivePlan == true && activeTier != "free"
    
    var showPurchaseFlow by rememberSaveable { mutableStateOf(isProDistribution) }

    var selectedDurationMonths by rememberSaveable { mutableStateOf(0) }

    val selectedProduct = purchaseProducts.firstOrNull { it.duration_months == selectedDurationMonths }
        ?: purchaseProducts.firstOrNull { it.id == selectedProductId }
        ?: purchaseProducts.firstOrNull()

    LaunchedEffect(purchaseProducts) {
        if (purchaseProducts.isNotEmpty() && selectedDurationMonths == 0) {
            val fallback = purchaseProducts.first()
            selectedDurationMonths = fallback.duration_months
            selectedProductId = fallback.id
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
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Título + botón actualizar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Licencia PRO", style = MaterialTheme.typography.titleLarge)
            OutlinedButton(
                onClick = onRefresh,
                enabled = !uiState.isLoading && !uiState.isSubmitting
            ) {
                Text("Actualizar")
            }
        }

        // Advertencia: función experimental desactivada
        if (!experimentalFeaturesEnabled) {
            InfoBannerCard(
                message = "Activa las funciones experimentales desde Acerca de para comprar o renovar tu licencia desde aquí.",
                isError = false
            )
        }

        // ── Distribución PRO ───────────────────────────────────────────────
        if (isProDistribution) {
            InfoBannerCard(
                message = "Estás usando la versión PRO de la aplicación, que no requiere compra de licencia. Disfruta de todas las funciones desbloqueadas.",
                isError = false
            )
        }

        if (showPurchaseFlow) {
            // Advertencia: función experimental
            
                InfoBannerCard(
                    message = "Aunque esta es la versión PRO, el siguiente flujo te permite adquirir una licencia para usar en otra instalación con la versión gratuita. Gracias por apoyar el proyecto!",
                    isError = false
                )

                Button(
                    onClick = {
                        showPurchaseFlow = false
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !uiState.isSubmitting
                ) {
                    Text("Adquirir licencia PRO para otra instalación")
                }
            




        }else{

        // Mensajes de error e info
        uiState.error?.let { error ->
            InfoBannerCard(message = error, isError = true, onDismiss = onDismissError)
        }
        uiState.infoMessage?.let { msg ->
            InfoBannerCard(message = msg, isError = false, onDismiss = onDismissInfo)
        }

        // ── Estado actual de la licencia ──────────────────────────────────
        CurrentPlanCard(currentPlan = currentPlan, hasActiveLicense = hasActiveLicense)

        // ── Qué desbloquea PRO ────────────────────────────────────────────
        ProFeaturesCard()

        if (uiState.isLoading && uiState.catalog == null) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                CircularProgressIndicator()
            }
            return@Column
        }

        // ── Paso 1: Duración ──────────────────────────────────────────────
        StepSection(number = 1, title = "Elige la duración") {
            if (purchaseProducts.isEmpty()) {
                Text(
                    "No hay planes disponibles en este momento.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    purchaseProducts.sortedBy { it.duration_months }.forEach { product ->
                        DurationPillCard(
                            modifier = Modifier.weight(1f),
                            product = product,
                            selected = product.duration_months == selectedDurationMonths,
                            onClick = {
                                selectedDurationMonths = product.duration_months
                                selectedProductId = product.id
                            }
                        )
                    }
                }

                selectedProduct?.let { product ->
                    Spacer(Modifier.height(4.dp))
                    PriceSummaryRow(product = product, hasActiveLicense = hasActiveLicense)
                }
            }
        }

        // ── Paso 2: Datos de pago ─────────────────────────────────────────
        instructions?.let { inst ->
            StepSection(number = 2, title = "Realiza la transferencia") {
                Text(
                    "Transfiere el monto exacto a través de Transfermóvil.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(10.dp))
                CopyableDataRow(
                    label = "Tarjeta destino",
                    value = inst.receiverCard,
                    onCopy = { copyToClipboard(context, "Tarjeta", inst.receiverCard) }
                )
                Divider(modifier = Modifier.padding(vertical = 10.dp))
                CopyableDataRow(
                    label = "Teléfono de confirmación",
                    value = inst.confirmationPhone,
                    onCopy = { copyToClipboard(context, "Teléfono", inst.confirmationPhone) }
                )
                if (inst.importantNotes.isNotEmpty()) {
                    Spacer(Modifier.height(10.dp))
                    inst.importantNotes.forEach { note ->
                        Text(
                            "• $note",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Spacer(Modifier.height(4.dp))
                InfoBannerCard(
                    message = "Al hacer la transferencia, activa la opción para que el destinatario reciba tu número. Eso agiliza la verificación.",
                    isError = false
                )
            }
        }

        // ── Paso 3: Confirmación ──────────────────────────────────────────
        StepSection(number = 3, title = "Confirma tu pago") {
            OutlinedTextField(
                value = payerPhone,
                onValueChange = { payerPhone = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Tu número de teléfono móvil") },
                supportingText = { Text("Debe coincidir con el número desde el que hiciste la transferencia.") },
                singleLine = true
            )

            Spacer(Modifier.height(4.dp))

            OutlinedTextField(
                value = smsMessage,
                onValueChange = { smsMessage = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("SMS de Transfermóvil") },
                supportingText = { Text("Pega el mensaje completo para verificar monto, fecha y transacción.") },
                minLines = 4
            )

            Spacer(Modifier.height(8.dp))

            ConfirmationSwitchRow(
                title = "Llamé o confirmé al ${instructions?.confirmationPhone ?: "teléfono de confirmación"}",
                body = "Necesario para validar la operación antes de activar tu licencia.",
                checked = confirmationPhoneAcknowledged,
                onCheckedChange = { confirmationPhoneAcknowledged = it }
            )

            ConfirmationSwitchRow(
                title = "Activé \"recibir número del remitente\" en la transferencia",
                body = "Ayuda a identificar tu pago más rápido en el historial.",
                checked = receiverPhoneShared,
                onCheckedChange = { receiverPhoneShared = it }
            )

            Spacer(Modifier.height(4.dp))

            val canSubmit = selectedProduct != null &&
                confirmationPhoneAcknowledged &&
                receiverPhoneShared &&
                payerPhone.isNotBlank() &&
                smsMessage.isNotBlank() &&
                !uiState.isSubmitting

            Button(
                onClick = {
                    val productId = selectedProduct?.id ?: return@Button
                    onSubmit(productId, payerPhone, smsMessage, confirmationPhoneAcknowledged, receiverPhoneShared)
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = canSubmit
            ) {
                if (uiState.isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                } else {
                    val priceLabel = selectedProduct?.price_cup?.let { " · $it CUP" } ?: ""
                    Text(if (hasActiveLicense) "Renovar licencia PRO$priceLabel" else "Comprar licencia PRO$priceLabel")
                }
            }

            if (!confirmationPhoneAcknowledged || !receiverPhoneShared) {
                Text(
                    "Marca ambas confirmaciones para poder enviar la solicitud.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        // ── Solicitudes recientes ─────────────────────────────────────────
        if (uiState.orders.isNotEmpty()) {
            Text("Solicitudes recientes", style = MaterialTheme.typography.titleMedium)
            uiState.orders.take(5).forEach { order ->
                RecentOrderCard(order = order)
            }
        }
    }
}
}

// ─── Sección con número de paso ───────────────────────────────────────────────

@Composable
private fun StepSection(
    number: Int,
    title: String,
    content: @Composable () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "$number",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            Spacer(Modifier.width(8.dp))
            Text(title, style = MaterialTheme.typography.titleMedium)
        }
        Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp)) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                content()
            }
        }
    }
}

// ─── Estado de licencia actual ────────────────────────────────────────────────

@Composable
private fun CurrentPlanCard(
    currentPlan: UserPlanResponse?,
    hasActiveLicense: Boolean
) {
    val tier = currentPlan?.tier ?: "free"
    val validity = currentPlan?.planValidity

    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp)) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Tu plan actual", style = MaterialTheme.typography.titleSmall)
                PlanBadge(tier = tier)
            }

            if (hasActiveLicense) {
                validity?.expiresAt?.let { expiresAt ->
                    Text(
                        "Vence el ${formatDate(expiresAt)}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        remainingTimeLabel(expiresAt),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                validity?.durationMonths?.let { months ->
                    Text(
                        "Duración comprada: $months mes(es)",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                Text(
                    "Estás usando la versión gratuita. Los módulos avanzados requieren una licencia PRO.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            currentPlan?.credits?.available?.let { credits ->
                if (credits > 0) {
                    Text(
                        "Créditos disponibles: $credits",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

// ─── Ventajas del plan PRO ────────────────────────────────────────────────────

@Composable
private fun ProFeaturesCard() {
    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp)) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text("Lo que desbloquea PRO", style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(4.dp))
            val proFeatures = PRO_FEATURES.filter { !it.availableInFree }
            val freeFeatures = PRO_FEATURES.filter { it.availableInFree }

            proFeatures.forEach { feature ->
                FeatureRow(label = feature.label, available = true)
            }

            if (freeFeatures.isNotEmpty()) {
                Divider(modifier = Modifier.padding(vertical = 8.dp))
                Text(
                    "Disponible gratis siempre",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(2.dp))
                freeFeatures.forEach { feature ->
                    FeatureRow(label = feature.label, available = true, muted = true)
                }
            }
        }
    }
}

@Composable
private fun FeatureRow(label: String, available: Boolean, muted: Boolean = false) {
    Row(
        modifier = Modifier.padding(vertical = 3.dp),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            imageVector = if (available) Icons.Filled.CheckCircle else Icons.Outlined.Cancel,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = when {
                muted -> MaterialTheme.colorScheme.onSurfaceVariant
                available -> MaterialTheme.colorScheme.primary
                else -> MaterialTheme.colorScheme.error
            }
        )
        Spacer(Modifier.width(8.dp))
        Text(
            label,
            style = MaterialTheme.typography.bodySmall,
            color = if (muted) MaterialTheme.colorScheme.onSurfaceVariant
                    else MaterialTheme.colorScheme.onSurface
        )
    }
}

// ─── Píldora de duración ──────────────────────────────────────────────────────

@Composable
private fun DurationPillCard(
    modifier: Modifier = Modifier,
    product: ManualPaymentProduct,
    selected: Boolean,
    onClick: () -> Unit
) {
    val borderColor by animateColorAsState(
        if (selected) MaterialTheme.colorScheme.primary
        else MaterialTheme.colorScheme.outlineVariant,
        label = "pill-border"
    )
    val bgColor by animateColorAsState(
        if (selected) MaterialTheme.colorScheme.primaryContainer
        else MaterialTheme.colorScheme.surface,
        label = "pill-bg"
    )

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .border(
                width = if (selected) 1.5.dp else 0.5.dp,
                color = borderColor,
                shape = RoundedCornerShape(12.dp)
            )
            .clickable(onClick = onClick)
            .padding(12.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(
                durationLabel(product.duration_months),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = if (selected) MaterialTheme.colorScheme.onPrimaryContainer
                        else MaterialTheme.colorScheme.onSurface
            )
            Text(
                "${product.price_cup} CUP",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (product.discount_percent > 0) {
                Text(
                    "ahorra ${product.discount_percent}%",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

// ─── Resumen de precio ────────────────────────────────────────────────────────

@Composable
private fun PriceSummaryRow(product: ManualPaymentProduct, hasActiveLicense: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                if (hasActiveLicense) "Total a pagar (renovación)" else "Total a pagar",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (product.discount_percent > 0) {
                Text(
                    "Incluye ${product.discount_percent}% de ahorro",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
        Text(
            "${product.price_cup} CUP",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
    }
}

// ─── Fila de dato copiable ────────────────────────────────────────────────────

@Composable
private fun CopyableDataRow(label: String, value: String, onCopy: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
            IconButton(onClick = onCopy) {
                Icon(Icons.Default.ContentCopy, contentDescription = "Copiar $label")
            }
        }
    }
}

// ─── Switch de confirmación ───────────────────────────────────────────────────

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
            Text(title, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(2.dp))
            Text(body, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.width(8.dp))
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}

// ─── Banner de info / error ───────────────────────────────────────────────────

@Composable
private fun InfoBannerCard(message: String, isError: Boolean, onDismiss: (() -> Unit)? = null) {
    val bg = if (isError) MaterialTheme.colorScheme.errorContainer
             else MaterialTheme.colorScheme.secondaryContainer
    val fg = if (isError) MaterialTheme.colorScheme.onErrorContainer
             else MaterialTheme.colorScheme.onSecondaryContainer

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(bg, RoundedCornerShape(10.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            message,
            style = MaterialTheme.typography.bodySmall,
            color = fg,
            modifier = Modifier.weight(1f)
        )
        if (onDismiss != null) {
            Spacer(Modifier.width(8.dp))
            Text(
                "Cerrar",
                style = MaterialTheme.typography.labelSmall,
                color = fg,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.clickable(onClick = onDismiss)
            )
        }
    }
}

// ─── Badge de plan ────────────────────────────────────────────────────────────

@Composable
private fun PlanBadge(tier: String) {
    val label = formatTier(tier)
    val bg = when (tier.lowercase()) {
        "pro" -> MaterialTheme.colorScheme.primaryContainer
        else -> MaterialTheme.colorScheme.surfaceVariant
    }
    val fg = when (tier.lowercase()) {
        "pro" -> MaterialTheme.colorScheme.onPrimaryContainer
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }
    Box(
        modifier = Modifier
            .background(bg, CircleShape)
            .padding(horizontal = 12.dp, vertical = 4.dp)
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = fg, fontWeight = FontWeight.SemiBold)
    }
}

// ─── Card de orden reciente ───────────────────────────────────────────────────

@Composable
private fun RecentOrderCard(order: cu.lazaroysr96.sysgdcont.data.model.ManualPaymentOrder) {
    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
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
                    "PRO · ${order.duration_months} mes(es)",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    formatStatus(order.status),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text("${order.expected_amount_cup} CUP", style = MaterialTheme.typography.bodySmall)
            order.sms_transaction_id?.let {
                Text("Transacción: $it", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            order.grace_expires_at?.let {
                Text("Gracia provisional hasta: ${formatDate(it)}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(
                "Registrada el ${formatDate(order.created_at)}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

private fun formatTier(tier: String): String = when (tier.lowercase()) {
    "pro", "vip" -> "PRO"
    else -> "FREE"
}

private fun formatStatus(status: String): String = when (status) {
    "pending_review" -> "Pendiente de revisión"
    "provisional"    -> "Activa en modo de prueba"
    "approved"       -> "Aprobada"
    "rejected"       -> "Rechazada"
    "expired"        -> "Expirada"
    else             -> status
}

private fun formatDate(value: String): String = try {
    val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.systemDefault())
    formatter.format(Instant.parse(value))
} catch (_: Exception) {
    value.take(10)
}

private fun remainingTimeLabel(expiresAt: String): String = try {
    val days = max(0, Duration.between(Instant.now(), Instant.parse(expiresAt)).toDays().toInt())
    when (days) {
        0    -> "Vence hoy"
        1    -> "Queda 1 día para renovar"
        else -> "Quedan $days días para renovar"
    }
} catch (_: Exception) {
    "Consulta la fecha de vencimiento"
}

private fun durationLabel(months: Int): String = when (months) {
    1    -> "1 mes"
    3    -> "3 meses"
    12   -> "1 año"
    else -> "$months meses"
}

private fun copyToClipboard(context: Context, label: String, text: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    clipboard.setPrimaryClip(ClipData.newPlainText(label, text))
    Toast.makeText(context, "$label copiado", Toast.LENGTH_SHORT).show()
}