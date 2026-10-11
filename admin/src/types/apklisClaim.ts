export type ApklisClaimStatus =
	| "pending_review"
	| "approved"
	| "rejected"
	| "expired"

export interface ApklisClaimOrder {
	id: string
	user_id: string
	product_id: string
	plan_tier: "pro"
	duration_months: 1 | 3 | 12
	expected_amount_cup: string
	status: ApklisClaimStatus
	apklis_licence_uuid: string
	apklis_licence_name: string
	apklis_licence_days: number
	apklis_license: string | null
	apklis_username: string | null
	id_compra: string
	transaction_no: string | null
	sms_message: string
	sms_amount_cup: string | null
	sms_amount_paid_cup: string | null
	sms_payment_date: string | null
	reviewed_at: string | null
	reviewed_by: string | null
	review_notes: string | null
	created_at: string
	user_name: string
	user_email: string
}

export interface ApklisClaimOrdersResponse {
	orders: ApklisClaimOrder[]
}
