import { pool } from "../db";
import { isValidTier, TIER_CREDITS, TIER_LIMITS } from "../utils/billing";
import { maybeRenewPlanCredits, normalizeBillingState } from "./billing-credits.service";

interface PaymentOrderRecord {
	order_id: string;
	user_id: string;
	product_id: string;
}

const parsePlanProduct = (
	productId: string,
): { tier: "pro" | "vip"; period: "monthly" | "yearly" } | null => {
	const normalized = productId.trim().toLowerCase();
	if (!normalized.startsWith("plan_")) return null;

	const parts = normalized.split("_");
	if (parts.length < 3) return null;

	const tier = parts[1];
	const period = parts[2];

	if (!isValidTier(tier)) return null;
	if (period !== "monthly" && period !== "yearly") return null;
	if (tier === "free") return null;

	return { tier, period };
};

const parseCreditsProduct = (productId: string): number | null => {
	const normalized = productId.trim().toLowerCase();
	if (!normalized.startsWith("credits_")) return null;
	const value = Number.parseInt(normalized.split("_")[1] ?? "", 10);
	if (!Number.isFinite(value) || value <= 0) return null;
	return value;
};

export const fulfillOrderIfNeeded = async (
	order: PaymentOrderRecord,
): Promise<{ fulfilled: boolean; reason?: string }> => {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const existing = await client.query<{ order_id: string }>(
			"SELECT order_id FROM crypto_payment_fulfillments WHERE order_id = $1",
			[order.order_id],
		);
		if (existing.rows.length > 0) {
			await client.query("COMMIT");
			return { fulfilled: false, reason: "already_fulfilled" };
		}

		const userRows = await client.query<{ user_data: { billing?: unknown } }>(
			"SELECT user_data FROM users WHERE id = $1 FOR UPDATE",
			[order.user_id],
		);
		if (userRows.rows.length === 0) {
			throw new Error("Usuario no encontrado para cumplimiento de orden");
		}

		const currentBilling = maybeRenewPlanCredits(
			normalizeBillingState(userRows.rows[0].user_data?.billing),
		);

		const credits = parseCreditsProduct(order.product_id);
		if (credits !== null) {
			currentBilling.purchased_credits += credits;
		} else {
			const plan = parsePlanProduct(order.product_id);
			if (!plan) {
				throw new Error(`Producto no soportado: ${order.product_id}`);
			}

			const now = new Date();
			const nextReset = new Date(now);
			if (plan.period === "monthly") nextReset.setDate(nextReset.getDate() + 30);
			else nextReset.setFullYear(nextReset.getFullYear() + 1);

			currentBilling.tier = plan.tier;
			currentBilling.plan_credits = TIER_CREDITS[plan.tier];
			currentBilling.limits = TIER_LIMITS[plan.tier];
			currentBilling.billing_cycle.last_reset = now.toISOString();
			currentBilling.billing_cycle.next_reset = nextReset.toISOString();
		}

		const normalizedAfter = normalizeBillingState(currentBilling);
		await client.query(
			`UPDATE users
			 SET user_data = jsonb_set(COALESCE(user_data, '{}'::jsonb), '{billing}', $1::jsonb)
			 WHERE id = $2`,
			[JSON.stringify(normalizedAfter), order.user_id],
		);

		await client.query(
			`INSERT INTO crypto_payment_fulfillments (order_id, user_id, product_id)
			 VALUES ($1, $2, $3)`,
			[order.order_id, order.user_id, order.product_id],
		);

		await client.query("COMMIT");
		return { fulfilled: true };
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};
