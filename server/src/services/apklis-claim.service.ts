import { pool } from "../db";
import type {
	ApklisClaimOrder,
	ApklisClaimProduct,
	CreateApklisClaimOrderInput,
	ParsedApklisPaymentMessage,
	ReviewApklisClaimOrderInput,
} from "../types/apklisClaim";
import { UserService } from "./userService";

const userService = new UserService();

/**
 * Solicitud de plan Pro para SYSGD Ecosystem por compra de licencia en Apklis
 * (Gestor Contable TCP). Solo los planes 2-4 (Mensual/Trimestral/Anual) generan
 * reclamo; el Tester es solo-dispositivo y NO aparece aquí (Decisión 13).
 */
const APKLIS_CLAIM_PRODUCTS: ApklisClaimProduct[] = [
	{
		id: "apklis_pro_1m",
		tier: "pro",
		duration_months: 1,
		duration_days: 30,
		name: "Plan Pro por 1 mes (licencia Apklis Mensual)",
		price_cup: 250,
		apklis_licence_uuid: "1fce965a-e4a0-4bd9-861f-ce6ed7cdec74",
		description:
			"Reclamo de Plan Pro por compra de la licencia Mensual en Apklis.",
	},
	{
		id: "apklis_pro_3m",
		tier: "pro",
		duration_months: 3,
		duration_days: 90,
		name: "Plan Pro por 3 meses (licencia Apklis Trimestral)",
		price_cup: 650,
		apklis_licence_uuid: "21b36443-c8d9-4985-891f-5bac3321a0e8",
		description:
			"Reclamo de Plan Pro por compra de la licencia Trimestral en Apklis.",
	},
	{
		id: "apklis_pro_12m",
		tier: "pro",
		duration_months: 12,
		duration_days: 365,
		name: "Plan Pro por 1 año (licencia Apklis Anual)",
		price_cup: 2400,
		apklis_licence_uuid: "29719eb7-7578-4fe3-8822-f8c5794117a7",
		description:
			"Reclamo de Plan Pro por compra de la licencia Anual en Apklis.",
	},
];

const TESTER_LICENCE_UUID = "d6274d70-7da3-4d5b-9391-1fc9a37f7d0b";

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

/**
 * Parsea el SMS de pago en línea de Apklis (Transfermóvil). Formatos conocidos
 * (Bandec, mensaje al comerciante y al comprador):
 *   "Id Compra: LIC00000000000012320 ... Importe: 10.00 CUP Importe Pagado: 9.60 CUP ...
 *    Nro. Transaccion: KW601WPPKP999"
 * Se extrae por palabras clave (no por plantilla completa) porque la redacción
 * varía por banco.
 */
export const parseApklisPaymentMessage = (
	smsMessage: string,
): ParsedApklisPaymentMessage => {
	const idCompraMatch = smsMessage.match(/Id\s*Compra\s*:?\s*(LIC[0-9]+)/i);
	const transactionMatch = smsMessage.match(
		/(?:Nro\.?\s*Transacci[oó]n|No\.?\s*Transacci[oó]n)\s*:?\s*([A-Z0-9]+)/i,
	);
	const amountMatches = [
		...smsMessage.matchAll(/Importe(?:\s*Pagad[oa])?\s*:?\s*([\d.,]+)\s*CUP/gi),
	].map((match) => parseAmount(match[1]));
	const dateMatch = smsMessage.match(/Fecha\s*:?\s*([0-9/]+)/i);

	return {
		id_compra: idCompraMatch?.[1]?.trim().toUpperCase() ?? null,
		transaction_no: transactionMatch?.[1]?.trim().toUpperCase() ?? null,
		amount_cup: amountMatches.length > 0 ? (amountMatches[0] ?? null) : null,
		amount_paid_cup: amountMatches.length > 1 ? (amountMatches[1] ?? null) : null,
		payment_date: dateMatch?.[1] ? parsePaymentDate(dateMatch[1]) : null,
		raw_message: smsMessage.trim(),
	};
};

/** Acepta si ALGUNA cifra del SMS (importe o pagado) iguala el precio. */
const amountMatchesPrice = (
	parsed: ParsedApklisPaymentMessage,
	priceCup: number,
): boolean =>
	parsed.amount_cup === priceCup || parsed.amount_paid_cup === priceCup;

export const getApklisClaimProducts = (): ApklisClaimProduct[] =>
	APKLIS_CLAIM_PRODUCTS;

export const getApklisClaimProductById = (
	productId: string,
): ApklisClaimProduct | undefined =>
	APKLIS_CLAIM_PRODUCTS.find((product) => product.id === productId);

const ORDER_COLUMNS = `id, user_id, product_id, plan_tier, duration_months, expected_amount_cup,
	status, apklis_licence_uuid, apklis_licence_name, apklis_licence_days,
	apklis_license, apklis_username, id_compra, transaction_no, sms_message,
	sms_amount_cup, sms_amount_paid_cup, sms_payment_date, reviewed_at,
	reviewed_by, review_notes, created_at, updated_at`;

export const listUserApklisClaimOrders = async (
	userId: string,
): Promise<ApklisClaimOrder[]> => {
	const { rows } = await pool.query<ApklisClaimOrder>(
		`SELECT ${ORDER_COLUMNS} FROM apklis_claim_orders
		  WHERE user_id = $1 ORDER BY created_at DESC`,
		[userId],
	);

	return rows;
};

export const createApklisClaimOrder = async (
	userId: string,
	input: CreateApklisClaimOrderInput,
): Promise<{ order: ApklisClaimOrder; alreadyClaimed: boolean }> => {
	const product = getApklisClaimProductById(input.productId);

	if (!product) {
		if (input.productId.toLowerCase().includes("tester")) {
			throw new Error(
				"La licencia de prueba solo funciona en el dispositivo y no genera plan en SYSGD Ecosystem",
			);
		}
		throw new Error("Producto de reclamo no válido");
	}

	if (!input.smsMessage.trim()) {
		throw new Error("Debes pegar el SMS de pago recibido de Transfermóvil");
	}

	const parsed = parseApklisPaymentMessage(input.smsMessage);
	if (!parsed.id_compra) {
		throw new Error(
			"No se encontró el Id Compra (LIC…) en el mensaje. Pega el SMS completo del pago",
		);
	}

	// First-claim-wins sobre el Id Compra: una compra = una cuenta. Reintento
	// del mismo usuario devuelve su orden; otra cuenta recibe 409 (el controller
	// lo traduce). Cierra la clonación de licencias entre cuentas.
	const { rows: existing } = await pool.query<ApklisClaimOrder>(
		`SELECT ${ORDER_COLUMNS} FROM apklis_claim_orders WHERE id_compra = $1`,
		[parsed.id_compra],
	);
	if (existing.length > 0) {
		if (existing[0].user_id === userId) {
			return { order: existing[0], alreadyClaimed: true };
		}
		throw new Error("Esta compra ya fue reclamada por otra cuenta");
	}

	// Sin estado provisional: todo reclamo nace pending_review y decide un
	// humano. Un SMS es falsificable y el servidor no ve la licencia del
	// dispositivo; activar Pro automático aquí daría Pro gratis ilimitado con
	// IDs inventados.
	const { rows } = await pool.query<ApklisClaimOrder>(
		`INSERT INTO apklis_claim_orders (
		      user_id, product_id, plan_tier, duration_months, expected_amount_cup,
		      status, apklis_licence_uuid, apklis_licence_name, apklis_licence_days,
		      apklis_license, apklis_username, id_compra, transaction_no,
		      sms_message, sms_amount_cup, sms_amount_paid_cup, sms_payment_date
		   ) VALUES (
		      $1, $2, $3, $4, $5, 'pending_review', $6, $7, $8, $9, $10, $11, $12,
		      $13, $14, $15, $16
		   )
		   RETURNING ${ORDER_COLUMNS}`,
		[
			userId,
			product.id,
			product.tier,
			product.duration_months,
			product.price_cup,
			product.apklis_licence_uuid,
			product.name,
			product.duration_days,
			input.apklisLicense?.trim() || null,
			input.apklisUsername?.trim() || null,
			parsed.id_compra,
			parsed.transaction_no,
			parsed.raw_message,
			parsed.amount_cup,
			parsed.amount_paid_cup,
			parsed.payment_date,
		],
	);

	const order = rows[0];
	// Rastro para el revisor cuando el importe no cuadra (p. ej. descuentos).
	if (!amountMatchesPrice(parsed, product.price_cup)) {
		await pool.query(
			`UPDATE apklis_claim_orders
			    SET review_notes = $1 WHERE id = $2`,
			[
				`Aviso automático: el importe del SMS no coincide con el precio esperado (${product.price_cup} CUP).`,
				order.id,
			],
		);
		order.review_notes = `Aviso automático: el importe del SMS no coincide con el precio esperado (${product.price_cup} CUP).`;
	}

	return { order, alreadyClaimed: false };
};

export const listAllApklisClaimOrders = async (): Promise<ApklisClaimOrder[]> => {
	const { rows } = await pool.query<ApklisClaimOrder>(
		`SELECT o.*, users.name AS user_name, users.email AS user_email
		   FROM apklis_claim_orders o LEFT JOIN users ON o.user_id = users.id
		  ORDER BY o.created_at DESC`,
	);

	return rows;
};

export const reviewApklisClaimOrder = async (
	orderId: string,
	reviewerId: string,
	input: ReviewApklisClaimOrderInput,
): Promise<ApklisClaimOrder> => {
	const { rows } = await pool.query<ApklisClaimOrder>(
		`SELECT ${ORDER_COLUMNS} FROM apklis_claim_orders WHERE id = $1`,
		[orderId],
	);

	if (rows.length === 0) {
		throw new Error("Reclamo no encontrado");
	}

	const currentOrder = rows[0];
	if (currentOrder.status === "approved" || currentOrder.status === "rejected") {
		throw new Error("Este reclamo ya fue revisado");
	}

	if (input.status === "approved") {
		await userService.updatePlan(currentOrder.user_id, {
			tier: currentOrder.plan_tier,
			durationMonths: currentOrder.duration_months,
		});
	}

	const { rows: updatedRows } = await pool.query<ApklisClaimOrder>(
		`UPDATE apklis_claim_orders
		    SET status = $1, reviewed_at = NOW(), reviewed_by = $2,
		        review_notes = $3, updated_at = NOW()
		  WHERE id = $4
		  RETURNING ${ORDER_COLUMNS}`,
		[input.status, reviewerId, input.reviewNotes?.trim() || null, orderId],
	);

	return updatedRows[0];
};

export const TESTER_APKLIS_LICENCE_UUID = TESTER_LICENCE_UUID;
