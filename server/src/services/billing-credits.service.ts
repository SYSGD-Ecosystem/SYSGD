import { pool } from "../db";
import { TIER_CREDITS, TIER_LIMITS, type UserTier } from "../utils/billing";

export type CreditBucket = "bonus" | "plan" | "purchased";

export interface BonusCreditItem {
	id: string;
	amount: number;
	expires_at: string;
	source?: string;
}

export interface BillingState {
	tier: UserTier;
	ai_task_credits: number;
	plan_credits: number;
	purchased_credits: number;
	bonus_credits: BonusCreditItem[];
	credit_spending_priority: CreditBucket[];
	limits: (typeof TIER_LIMITS)[UserTier];
	billing_cycle: {
		last_reset: string;
		next_reset: string;
	};
}

const DEFAULT_PRIORITY: CreditBucket[] = ["bonus", "plan", "purchased"];

const isValidPriority = (priority: unknown): priority is CreditBucket[] => {
	if (!Array.isArray(priority) || priority.length !== 3) return false;
	const values = new Set(priority);
	return (
		values.size === 3 &&
		values.has("bonus") &&
		values.has("plan") &&
		values.has("purchased")
	);
};

const cleanBonusCredits = (items: unknown): BonusCreditItem[] => {
	if (!Array.isArray(items)) return [];
	const now = Date.now();
	return items
		.filter((item): item is BonusCreditItem => {
			const candidate = item as BonusCreditItem;
			return (
				typeof candidate?.id === "string" &&
				typeof candidate?.amount === "number" &&
				candidate.amount > 0 &&
				typeof candidate?.expires_at === "string"
			);
		})
		.filter((item) => {
			const exp = new Date(item.expires_at).getTime();
			return Number.isFinite(exp) && exp > now;
		});
};

const computeBonusTotal = (items: BonusCreditItem[]): number =>
	items.reduce((acc, item) => acc + item.amount, 0);

export const normalizeBillingState = (billingRaw: unknown): BillingState => {
	const billing = (billingRaw ?? {}) as Partial<BillingState>;
	const tier = (billing.tier ?? "free") as UserTier;
	const safeTier: UserTier = ["free", "pro", "vip"].includes(tier) ? tier : "free";
	const bonusCredits = cleanBonusCredits(billing.bonus_credits);
	const planCredits = Number.isFinite(billing.plan_credits)
		? Math.max(0, Number(billing.plan_credits))
		: Number.isFinite(billing.ai_task_credits)
			? Math.max(0, Number(billing.ai_task_credits))
			: TIER_CREDITS[safeTier];
	const purchasedCredits = Number.isFinite(billing.purchased_credits)
		? Math.max(0, Number(billing.purchased_credits))
		: 0;

	const nextReset =
		typeof billing.billing_cycle?.next_reset === "string"
			? billing.billing_cycle.next_reset
			: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
	const lastReset =
		typeof billing.billing_cycle?.last_reset === "string"
			? billing.billing_cycle.last_reset
			: new Date().toISOString();

	const priority = isValidPriority(billing.credit_spending_priority)
		? billing.credit_spending_priority
		: DEFAULT_PRIORITY;

	const total = planCredits + purchasedCredits + computeBonusTotal(bonusCredits);
	return {
		tier: safeTier,
		plan_credits: planCredits,
		purchased_credits: purchasedCredits,
		bonus_credits: bonusCredits,
		credit_spending_priority: priority,
		ai_task_credits: total,
		limits: (billing.limits as BillingState["limits"]) ?? TIER_LIMITS[safeTier],
		billing_cycle: {
			last_reset: lastReset,
			next_reset: nextReset,
		},
	};
};

export const maybeRenewPlanCredits = (billing: BillingState): BillingState => {
	const nextResetDate = new Date(billing.billing_cycle.next_reset).getTime();
	if (!Number.isFinite(nextResetDate) || Date.now() < nextResetDate) {
		return billing;
	}
	const now = new Date();
	const next = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
	const renewedPlan = TIER_CREDITS[billing.tier];
	const total = renewedPlan + billing.purchased_credits + computeBonusTotal(billing.bonus_credits);
	return {
		...billing,
		plan_credits: renewedPlan,
		ai_task_credits: total,
		billing_cycle: {
			last_reset: now.toISOString(),
			next_reset: next.toISOString(),
		},
	};
};

export const persistBilling = async (userId: string, billing: BillingState): Promise<void> => {
	await pool.query(
		`UPDATE users
		 SET user_data = jsonb_set(
		   COALESCE(user_data, '{}'::jsonb),
		   '{billing}',
		   $1::jsonb
		 )
		 WHERE id = $2`,
		[JSON.stringify(billing), userId],
	);
};

export const consumeCreditsByPriority = (
	billing: BillingState,
	amount: number,
): BillingState | null => {
	if (amount <= 0) return billing;
	let pending = amount;
	let next: BillingState = { ...billing, bonus_credits: [...billing.bonus_credits] };

	for (const bucket of next.credit_spending_priority) {
		if (pending <= 0) break;
		if (bucket === "plan") {
			const used = Math.min(next.plan_credits, pending);
			next.plan_credits -= used;
			pending -= used;
		}
		if (bucket === "purchased") {
			const used = Math.min(next.purchased_credits, pending);
			next.purchased_credits -= used;
			pending -= used;
		}
		if (bucket === "bonus") {
			const updatedBonus: BonusCreditItem[] = [];
			for (const bonus of next.bonus_credits) {
				if (pending <= 0) {
					updatedBonus.push(bonus);
					continue;
				}
				const used = Math.min(bonus.amount, pending);
				pending -= used;
				const left = bonus.amount - used;
				if (left > 0) updatedBonus.push({ ...bonus, amount: left });
			}
			next.bonus_credits = updatedBonus;
		}
	}

	if (pending > 0) return null;
	next = normalizeBillingState(next);
	return next;
};
