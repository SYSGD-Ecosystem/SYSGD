export type ManualPaymentTier = "pro" | "vip";
export type ManualPaymentDurationMonths = 1 | 3 | 12;
export type ManualPaymentStatus =
	| "pending_review"
	| "provisional"
	| "approved"
	| "rejected"
	| "expired";

export interface ManualPaymentProduct {
	id: string;
	tier: ManualPaymentTier;
	duration_months: ManualPaymentDurationMonths;
	name: string;
	price_cup: number;
	discount_percent: number;
	description: string;
	features: string[];
}

export interface ParsedTransfermovilMessage {
	transaction_id: string | null;
	amount_cup: number | null;
	payment_date: string | null;
	raw_message: string;
}

export interface CreateManualPaymentOrderInput {
	productId: string;
	payerPhone: string;
	smsMessage: string;
	confirmationPhoneAcknowledged: boolean;
	receiverPhoneShared: boolean;
}

export interface ManualPaymentOrder {
	id: string;
	user_id: string;
	product_id: string;
	plan_tier: ManualPaymentTier;
	duration_months: ManualPaymentDurationMonths;
	expected_amount_cup: string;
	status: ManualPaymentStatus;
	payer_phone: string;
	sms_message: string;
	sms_transaction_id: string | null;
	sms_amount_cup: string | null;
	sms_payment_date: string | null;
	confirmation_phone_acknowledged: boolean;
	receiver_phone_shared: boolean;
	receiver_card: string;
	confirmation_phone: string;
	grace_expires_at: string | null;
	reviewed_at: string | null;
	reviewed_by: string | null;
	review_notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface ReviewManualPaymentOrderInput {
	status: "approved" | "rejected";
	reviewNotes?: string;
}
