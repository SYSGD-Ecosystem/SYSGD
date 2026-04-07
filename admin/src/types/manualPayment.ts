export type ManualPaymentStatus =
	| "pending_review"
	| "provisional"
	| "approved"
	| "rejected"
	| "expired"

export interface ManualPaymentOrder {
	id: string
	user_id: string
	product_id: string
	plan_tier: "pro" | "vip"
	duration_months: 1 | 3 | 12
	expected_amount_cup: string
	status: ManualPaymentStatus
	payer_phone: string
	sms_message: string
	sms_transaction_id: string | null
	sms_amount_cup: string | null
	sms_payment_date: string | null
	grace_expires_at: string | null
	reviewed_at: string | null
	reviewed_by: string | null
	review_notes: string | null
	created_at: string
}

export interface ManualPaymentOrdersResponse {
	orders: ManualPaymentOrder[]
}
