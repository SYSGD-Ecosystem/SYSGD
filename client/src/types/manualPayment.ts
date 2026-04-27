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

export interface ManualPaymentInstructions {
	receiverCard: string;
	confirmationPhone: string;
	importantNotes: string[];
}

export interface ManualPaymentCatalogResponse {
	instructions: ManualPaymentInstructions;
	products: ManualPaymentProduct[];
}

export interface ManualPaymentOrder {
	id: string;
	product_id: string;
	plan_tier: ManualPaymentTier;
	duration_months: ManualPaymentDurationMonths;
	expected_amount_cup: string;
	status: ManualPaymentStatus;
	payer_phone: string;
	sms_transaction_id: string | null;
	sms_amount_cup: string | null;
	sms_payment_date: string | null;
	grace_expires_at: string | null;
	created_at: string;
}

export interface ManualPaymentOrdersResponse {
	orders: ManualPaymentOrder[];
}

export interface CreateManualPaymentOrderPayload {
	productId: string;
	payerPhone: string;
	smsMessage: string;
	confirmationPhoneAcknowledged: boolean;
	receiverPhoneShared: boolean;
}
