import { pool } from "../db";
import { isValidTier, TIER_CREDITS, TIER_LIMITS } from "../utils/billing";

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

		const credits = parseCreditsProduct(order.product_id);
		if (credits !== null) {
			await client.query(
				`UPDATE users
				 SET user_data = jsonb_set(
				   jsonb_set(
				     COALESCE(user_data, '{}'::jsonb),
				     '{billing,ai_task_credits}',
				     to_jsonb(COALESCE((user_data->'billing'->>'ai_task_credits')::int, 0) + $1)
				   ),
				   '{billing,purchased_credits}',
				   to_jsonb(COALESCE((user_data->'billing'->>'purchased_credits')::int, 0) + $1)
				 )
				 WHERE id = $2`,
				[credits, order.user_id],
			);
		} else {
			const plan = parsePlanProduct(order.product_id);
			if (!plan) {
				throw new Error(`Producto no soportado: ${order.product_id}`);
			}

			const nextReset = new Date();
			if (plan.period === "monthly") {
				nextReset.setMonth(nextReset.getMonth() + 1);
			} else {
				nextReset.setFullYear(nextReset.getFullYear() + 1);
			}

			const initialCredits = TIER_CREDITS[plan.tier];
			const tierLimits = TIER_LIMITS[plan.tier];

			await client.query(
				`UPDATE users
				 SET user_data = jsonb_set(
				   jsonb_set(
				     jsonb_set(
				       jsonb_set(
				         COALESCE(user_data, '{}'::jsonb),
				         '{billing,tier}',
				         to_jsonb($1::text)
				       ),
				       '{billing,ai_task_credits}',
				       to_jsonb($2::int)
				     ),
				     '{billing,billing_cycle,next_reset}',
				     to_jsonb($3::text)
				   ),
				   '{billing,limits}',
				   $4::jsonb
				 )
				 WHERE id = $5`,
				[plan.tier, initialCredits, nextReset.toISOString(), JSON.stringify(tierLimits), order.user_id],
			);
		}

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
