package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cu.lazaroysr96.sysgdcont.data.model.ManualPaymentProduct
import cu.lazaroysr96.sysgdcont.viewmodel.PlanPurchaseUiState

@Composable
fun ExperimentalPlanPurchaseSection(
    experimentalFeaturesEnabled: Boolean,
    uiState: PlanPurchaseUiState,
    onRefresh: () -> Unit,
    onSubmit: (String, String, String, Boolean, Boolean) -> Unit,
    onDismissError: () -> Unit,
    onDismissInfo: () -> Unit
) {
    var selectedProductId by rememberSaveable { mutableStateOf("") }
    var payerPhone by rememberSaveable { mutableStateOf("") }
    var smsMessage by rememberSaveable { mutableStateOf("") }
    var confirmationPhoneAcknowledged by rememberSaveable { mutableStateOf(false) }
    var receiverPhoneShared by rememberSaveable { mutableStateOf(false) }

    val products = uiState.catalog?.products.orEmpty()
    val instructions = uiState.catalog?.instructions
    val selectedProduct = products.firstOrNull { it.id == selectedProductId } ?: products.firstOrNull()

    LaunchedEffect(products) {
        if (products.isNotEmpty() && products.none { it.id == selectedProductId }) {
            selectedProductId = products.first().id
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

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text("Compra experimental de planes", style = MaterialTheme.typography.titleMedium)
            Text(
                "Esta función está en desarrollo. De momento no se aplican restricciones de uso en esta app, pero ya deja preparado el flujo real de activación Pro y VIP a nivel de plataforma para depuración.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            uiState.currentPlan?.let { plan ->
                Text(
                    "Plan actual en plataforma: ${plan.tier.uppercase()} • Créditos ${plan.credits.available}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }

            if (!experimentalFeaturesEnabled) {
                Text(
                    "Activa las funciones experimentales para probar este flujo de compra antes de llevarlo a producción.",
                    style = MaterialTheme.typography.bodyMedium
                )
                return@Column
            }

            if (uiState.isLoading && uiState.catalog == null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator()
                }
                return@Column
            }

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
                    title = "Estado de la prueba",
                    body = message,
                    highlighted = false,
                    onAction = onDismissInfo,
                    actionLabel = "Cerrar"
                )
            }

            instructions?.let {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text("Datos para Transfermóvil", fontWeight = FontWeight.SemiBold)
                        Text("Tarjeta destino: ${it.receiverCard}", style = MaterialTheme.typography.bodyMedium)
                        Text("Teléfono a confirmar: ${it.confirmationPhone}", style = MaterialTheme.typography.bodyMedium)
                        it.importantNotes.forEach { note ->
                            Text("• $note", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }

            Text("Selecciona el plan a probar", fontWeight = FontWeight.SemiBold)
            products.forEach { product ->
                ProductCard(
                    product = product,
                    selected = product.id == (selectedProduct?.id ?: ""),
                    onSelect = { selectedProductId = product.id }
                )
            }

            selectedProduct?.let { product ->
                Text(
                    "Vas a registrar ${product.name} por ${product.price_cup} CUP. Si el mensaje coincide, el backend activará el plan en modo de prueba para depurar el flujo.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            OutlinedTextField(
                value = payerPhone,
                onValueChange = { payerPhone = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Tu número móvil") },
                supportingText = { Text("Debe ser el número desde el que hiciste la transferencia.") },
                singleLine = true
            )

            OutlinedTextField(
                value = smsMessage,
                onValueChange = { smsMessage = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Mensaje recibido de Transfermóvil") },
                supportingText = { Text("Pega el SMS completo para extraer monto, fecha y transacción.") },
                minLines = 5
            )

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
                    Text("Confirmé el teléfono 51158544", fontWeight = FontWeight.SemiBold)
                    Text(
                        "Sin esto la compra puede retrasarse o perderse en la verificación.",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Switch(
                    checked = confirmationPhoneAcknowledged,
                    onCheckedChange = { confirmationPhoneAcknowledged = it }
                )
            }

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
                    Text("Marqué que el destinatario recibe mi número", fontWeight = FontWeight.SemiBold)
                    Text(
                        "Esto ayuda a encontrar la operación más rápido en el historial.",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Switch(
                    checked = receiverPhoneShared,
                    onCheckedChange = { receiverPhoneShared = it }
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
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
                    enabled = selectedProduct != null && !uiState.isSubmitting
                ) {
                    if (uiState.isSubmitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.height(18.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text("Registrar compra")
                    }
                }
            }

            if (uiState.orders.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text("Tus solicitudes recientes", fontWeight = FontWeight.SemiBold)
                uiState.orders.take(5).forEach { order ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                "${order.plan_tier.uppercase()} • ${order.duration_months} mes(es) • ${order.expected_amount_cup} CUP",
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                "Estado: ${formatStatus(order.status)}",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            order.sms_transaction_id?.let {
                                Text("Transacción: $it", style = MaterialTheme.typography.bodySmall)
                            }
                            order.grace_expires_at?.let {
                                Text(
                                    "Gracia provisional hasta: ${it.take(10)}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                            Text(
                                "Registrada: ${order.created_at.take(10)}",
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductCard(
    product: ManualPaymentProduct,
    selected: Boolean,
    onSelect: () -> Unit
) {
    val backgroundColor = if (selected) {
        MaterialTheme.colorScheme.primaryContainer
    } else {
        MaterialTheme.colorScheme.surface
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        onClick = onSelect
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(backgroundColor)
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(product.name, fontWeight = FontWeight.SemiBold)
            Text("${product.price_cup} CUP", style = MaterialTheme.typography.titleMedium)
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

private fun formatStatus(status: String): String = when (status) {
    "pending_review" -> "Pendiente de revisión"
    "provisional" -> "Activa en modo de prueba"
    "approved" -> "Aprobada"
    "rejected" -> "Rechazada"
    "expired" -> "Expirada"
    else -> status
}
