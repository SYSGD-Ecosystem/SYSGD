export type ApklisClaimStatus =
	| "pending_review"
	| "approved"
	| "rejected"
	| "expired";

export interface ApklisClaimProduct {
	id: string;
	tier: "pro";
	duration_months: 1 | 3 | 12;
	/** Días de la licencia Apklis que respalda el reclamo. */
	duration_days: 30 | 90 | 365;
	name: string;
	price_cup: number;
	/** UUID del grupo de licencias en Console de Apklis. */
	apklis_licence_uuid: string;
	description: string;
}

export interface ParsedApklisPaymentMessage {
	id_compra: string | null;
	transaction_no: string | null;
	amount_cup: number | null;
	amount_paid_cup: number | null;
	payment_date: string | null;
	raw_message: string;
}

export interface CreateApklisClaimOrderInput {
	productId: string;
	smsMessage: string;
	apklisLicense?: string;
	apklisUsername?: string;
}

export interface ApklisClaimOrder {
	id: string;
	user_id: string;
	product_id: string;
	plan_tier: "pro";
	duration_months: 1 | 3 | 12;
	expected_amount_cup: string;
	status: ApklisClaimStatus;
	apklis_licence_uuid: string;
	apklis_licence_name: string;
	apklis_licence_days: number;
	apklis_license: string | null;
	apklis_username: string | null;
	id_compra: string;
	transaction_no: string | null;
	sms_message: string;
	sms_amount_cup: string | null;
	sms_amount_paid_cup: string | null;
	sms_payment_date: string | null;
	reviewed_at: string | null;
	reviewed_by: string | null;
	review_notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface ReviewApklisClaimOrderInput {
	status: "approved" | "rejected";
	reviewNotes?: string;
}
