package cu.lazaroysr96.sysgdcont.data.model

data class ManualPaymentInstructions(
    val receiverCard: String = "",
    val confirmationPhone: String = "",
    val importantNotes: List<String> = emptyList()
)

data class ManualPaymentProduct(
    val id: String = "",
    val tier: String = "pro",
    val duration_months: Int = 1,
    val name: String = "",
    val price_cup: Int = 0,
    val discount_percent: Int = 0,
    val description: String = "",
    val features: List<String> = emptyList()
)

data class ManualPaymentCatalogResponse(
    val instructions: ManualPaymentInstructions = ManualPaymentInstructions(),
    val products: List<ManualPaymentProduct> = emptyList()
)

data class ManualPaymentOrder(
    val id: String = "",
    val product_id: String = "",
    val plan_tier: String = "pro",
    val duration_months: Int = 1,
    val expected_amount_cup: String = "0",
    val status: String = "pending_review",
    val payer_phone: String = "",
    val sms_message: String = "",
    val sms_transaction_id: String? = null,
    val sms_amount_cup: String? = null,
    val sms_payment_date: String? = null,
    val grace_expires_at: String? = null,
    val created_at: String = ""
)

data class ManualPaymentOrdersResponse(
    val orders: List<ManualPaymentOrder> = emptyList()
)

data class CreateManualPaymentOrderRequest(
    val productId: String,
    val payerPhone: String,
    val smsMessage: String,
    val confirmationPhoneAcknowledged: Boolean,
    val receiverPhoneShared: Boolean
)

data class ManualPaymentOrderResponse(
    val order: ManualPaymentOrder = ManualPaymentOrder()
)
