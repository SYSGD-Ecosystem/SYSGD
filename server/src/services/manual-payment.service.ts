import { pool } from "../db";
import type {
	CreateManualPaymentOrderInput,
	ManualPaymentOrder,
	ManualPaymentProduct,
	ManualPaymentStatus,
	ParsedTransfermovilMessage,
	ReviewManualPaymentOrderInput,
} from "../types/manualPayment";
import { UserService } from "./userService";

// const RECEIVER_CARD = "9238-1299-7124-1767";
// const CONFIRMATION_PHONE = "51158544";

const RECEIVER_CARD = "9212-9598-7255-8673";
const CONFIRMATION_PHONE = "52375492";

const userService = new UserService();

const MANUAL_PAYMENT_PRODUCTS: ManualPaymentProduct[] = [
	{
		id: "tm_pro_1m",
		tier: "pro",
		duration_months: 1,
		name: "Plan Pro por 1 mes",
		price_cup: 250,
		discount_percent: 0,
		description: "Acceso Pro mensual para la plataforma principal.",
		features: [
			"Generacion de facturas",
			"Funciones premium del plan Pro",
			"Base para futuras funciones Pro",
		],
	},
	{
		id: "tm_pro_3m",
		tier: "pro",
		duration_months: 3,
		name: "Plan Pro por 3 meses",
		price_cup: 650,
		discount_percent: 13.33,
		description: "Ahorra 13.33 por ciento respecto al pago mensual.",
		features: [
			"Generacion de facturas",
			"Funciones premium del plan Pro",
			"Base para futuras funciones Pro",
		],
	},
	{
		id: "tm_pro_12m",
		tier: "pro",
		duration_months: 12,
		name: "Plan Pro por 1 año",
		price_cup: 2400,
		discount_percent: 20,
		description: "Ahorra 20 por ciento respecto al pago mensual.",
		features: [
			"Generacion de facturas",
			"Funciones premium del plan Pro",
			"Base para futuras funciones Pro",
		],
	}/*,
	{
		id: "tm_vip_1m",
		tier: "vip",
		duration_months: 1,
		name: "Plan VIP por 1 mes",
		price_cup: 100,
		discount_percent: 0,
		description: "Acceso VIP mensual para la plataforma principal.",
		features: [
			"Todo lo incluido en Pro",
			"Funciones experimentales",
			"Prioridad para funciones avanzadas",
		],
	},
	{
		id: "tm_vip_3m",
		tier: "vip",
		duration_months: 3,
		name: "Plan VIP por 3 meses",
		price_cup: 270,
		discount_percent: 10,
		description: "Ahorra 10 por ciento respecto al pago mensual.",
		features: [
			"Todo lo incluido en Pro",
			"Funciones experimentales",
			"Prioridad para funciones avanzadas",
		],
	},
	{
		id: "tm_vip_12m",
		tier: "vip",
		duration_months: 12,
		name: "Plan VIP por 1 año",
		price_cup: 960,
		discount_percent: 20,
		description: "Ahorra 20 por ciento respecto al pago mensual.",
		features: [
			"Todo lo incluido en Pro",
			"Funciones experimentales",
			"Prioridad para funciones avanzadas",
		],
	},*/
];

const toNormalizedPhone = (value: string) => value.replace(/\D/g, "");

const parseAmount = (rawValue: string): number | null => {
	const normalized = rawValue.replace(/,/g, ".").replace(/[^\d.]/g, "");
	const value = Number.parseFloat(normalized);
	return Number.isFinite(value) ? Number(value.toFixed(2)) : null;
};

const parsePaymentDate = (rawValue: string): string | null => {
	const match = rawValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
	if (!match) return null;

	const [, day, month, year] = match;
	const parsed = new Date(
		Date.UTC(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, Number.parseInt(day, 10)),
	);

	return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const parseTransfermovilMessage = (
	smsMessage: string,
): ParsedTransfermovilMessage => {
	const transactionMatch = smsMessage.match(
		/(?:Nro\.?\s*Transaccion|NoTransaccion)\s*:?\s*([A-Z0-9]+)/i,
	);
	const amountMatch = smsMessage.match(/Monto\s*:?\s*([\d.,]+)\s*CUP/i);
	const dateMatch = smsMessage.match(/Fecha\s*:?\s*([0-9/]+)/i);

	return {
		transaction_id: transactionMatch?.[1]?.trim().toUpperCase() ?? null,
		amount_cup: amountMatch?.[1] ? parseAmount(amountMatch[1]) : null,
		payment_date: dateMatch?.[1] ? parsePaymentDate(dateMatch[1]) : null,
		raw_message: smsMessage.trim(),
	};
};

const getStatusForNewOrder = (
	product: ManualPaymentProduct,
	parsed: ParsedTransfermovilMessage,
): ManualPaymentStatus =>
	parsed.transaction_id && parsed.amount_cup === product.price_cup
		? "provisional"
		: "pending_review";

export const getManualPaymentInstructions = () => ({
	receiverCard: RECEIVER_CARD,
	confirmationPhone: CONFIRMATION_PHONE,
	importantNotes: [
			// "Debes confirmar el numero 51158544 en Transfermovil.",
			"Debes confirmar el numero 52375492 en Transfermovil.",
			'Debes marcar la opcion "El destinatario recibe mi numero de movil".',
			"Si no compartes tu numero movil, la verificacion puede retrasarse o perderse.",
		],
});

export const getManualPaymentProducts = (): ManualPaymentProduct[] =>
	MANUAL_PAYMENT_PRODUCTS;

export const getManualPaymentProductById = (
	productId: string,
): ManualPaymentProduct | undefined =>
	MANUAL_PAYMENT_PRODUCTS.find((product) => product.id === productId);

export const listUserManualPaymentOrders = async (
	userId: string,
): Promise<ManualPaymentOrder[]> => {
	const { rows } = await pool.query<ManualPaymentOrder>(
		`SELECT id, user_id, product_id, plan_tier, duration_months, expected_amount_cup,
		        status, payer_phone, sms_message, sms_transaction_id, sms_amount_cup,
		        sms_payment_date, confirmation_phone_acknowledged, receiver_phone_shared,
		        receiver_card, confirmation_phone, grace_expires_at, reviewed_at,
		        reviewed_by, review_notes, created_at, updated_at
		   FROM manual_payment_orders
		  WHERE user_id = $1
		  ORDER BY created_at DESC`,
		[userId],
	);

	return rows;
};

export const createManualPaymentOrder = async (
	userId: string,
	input: CreateManualPaymentOrderInput,
): Promise<ManualPaymentOrder> => {
	const product = getManualPaymentProductById(input.productId);

	if (!product) {
		throw new Error("Producto de pago manual no valido");
	}

	const payerPhone = toNormalizedPhone(input.payerPhone);
	if (payerPhone.length < 8 || payerPhone.length > 15) {
		throw new Error("El telefono del comprador no es valido");
	}

	if (!input.confirmationPhoneAcknowledged) {
		throw new Error("Debes confirmar el numero de telefono indicado");
	}

	if (!input.receiverPhoneShared) {
		throw new Error(
			'Debes marcar la opcion "El destinatario recibe mi numero de movil"',
		);
	}

	if (!input.smsMessage.trim()) {
		throw new Error("Debes pegar el mensaje recibido de Transfermovil");
	}

	const parsed = parseTransfermovilMessage(input.smsMessage);
	const status = getStatusForNewOrder(product, parsed);
	const graceExpiresAt =
		status === "provisional"
			? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
			: null;

	const { rows } = await pool.query<ManualPaymentOrder>(
		`INSERT INTO manual_payment_orders (
		      user_id,
		      product_id,
		      plan_tier,
		      duration_months,
		      expected_amount_cup,
		      status,
		      payer_phone,
		      sms_message,
		      sms_transaction_id,
		      sms_amount_cup,
		      sms_payment_date,
		      confirmation_phone_acknowledged,
		      receiver_phone_shared,
		      receiver_card,
		      confirmation_phone,
		      grace_expires_at
		   ) VALUES (
		      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
		   )
		   RETURNING id, user_id, product_id, plan_tier, duration_months, expected_amount_cup,
		             status, payer_phone, sms_message, sms_transaction_id, sms_amount_cup,
		             sms_payment_date, confirmation_phone_acknowledged, receiver_phone_shared,
		             receiver_card, confirmation_phone, grace_expires_at, reviewed_at,
		             reviewed_by, review_notes, created_at, updated_at`,
		[
			userId,
			product.id,
			product.tier,
			product.duration_months,
			product.price_cup,
			status,
			payerPhone,
			parsed.raw_message,
			parsed.transaction_id,
			parsed.amount_cup,
			parsed.payment_date,
			input.confirmationPhoneAcknowledged,
			input.receiverPhoneShared,
			RECEIVER_CARD,
			CONFIRMATION_PHONE,
			graceExpiresAt,
		],
	);

	if (status === "provisional") {
		await userService.updatePlan(userId, {
			tier: product.tier,
			durationMonths: product.duration_months,
		});
	}

	return rows[0];
};

export const listAllManualPaymentOrders = async (): Promise<ManualPaymentOrder[]> => {
	const { rows } = await pool.query<ManualPaymentOrder>(
		`SELECT id, user_id, product_id, plan_tier, duration_months, expected_amount_cup,
		        status, payer_phone, sms_message, sms_transaction_id, sms_amount_cup,
		        sms_payment_date, confirmation_phone_acknowledged, receiver_phone_shared,
		        receiver_card, confirmation_phone, grace_expires_at, reviewed_at,
		        reviewed_by, review_notes, created_at, updated_at
		   FROM manual_payment_orders
		  ORDER BY created_at DESC`,
	);

	return rows;
};

export const reviewManualPaymentOrder = async (
	orderId: string,
	reviewerId: string,
	input: ReviewManualPaymentOrderInput,
): Promise<ManualPaymentOrder> => {
	const { rows } = await pool.query<ManualPaymentOrder>(
		`SELECT id, user_id, product_id, plan_tier, duration_months, expected_amount_cup,
		        status, payer_phone, sms_message, sms_transaction_id, sms_amount_cup,
		        sms_payment_date, confirmation_phone_acknowledged, receiver_phone_shared,
		        receiver_card, confirmation_phone, grace_expires_at, reviewed_at,
		        reviewed_by, review_notes, created_at, updated_at
		   FROM manual_payment_orders
		  WHERE id = $1`,
		[orderId],
	);

	if (rows.length === 0) {
		throw new Error("Compra manual no encontrada");
	}

	const currentOrder = rows[0];
	if (currentOrder.status === "approved" || currentOrder.status === "rejected") {
		throw new Error("Esta compra ya fue revisada");
	}

	if (input.status === "approved" && currentOrder.status !== "provisional") {
		await userService.updatePlan(currentOrder.user_id, {
			tier: currentOrder.plan_tier,
			durationMonths: currentOrder.duration_months,
		});
	}

	const { rows: updatedRows } = await pool.query<ManualPaymentOrder>(
		`UPDATE manual_payment_orders
		    SET status = $1,
		        reviewed_at = NOW(),
		        reviewed_by = $2,
		        review_notes = $3,
		        grace_expires_at = CASE WHEN $1 = 'approved' THEN NULL ELSE grace_expires_at END,
		        updated_at = NOW()
		  WHERE id = $4
		  RETURNING id, user_id, product_id, plan_tier, duration_months, expected_amount_cup,
		            status, payer_phone, sms_message, sms_transaction_id, sms_amount_cup,
		            sms_payment_date, confirmation_phone_acknowledged, receiver_phone_shared,
		            receiver_card, confirmation_phone, grace_expires_at, reviewed_at,
		            reviewed_by, review_notes, created_at, updated_at`,
		[input.status, reviewerId, input.reviewNotes?.trim() || null, orderId],
	);

	return updatedRows[0];
};
