import { pool } from "../db";

export type UserSegment =
	| "free"
	| "pro"
	| "vip"
	| "manual_license"
	| "trial_pro"
	| "inactive_1y";

export interface UserSegments {
	total: number;
	admins: number;
	regular: number;
	free: number;
	pro: number;
	vip: number;
	manualLicenseBuyers: number;
	trialProActive: number;
	inactiveOverYear: number;
}

export function normalizeSegment(value: unknown): UserSegment | null {
	const allowed: UserSegment[] = [
		"free",
		"pro",
		"vip",
		"manual_license",
		"trial_pro",
		"inactive_1y",
	];
	return typeof value === "string" && (allowed as string[]).includes(value)
		? (value as UserSegment)
		: null;
}

/** Condición SQL del filtro por segmento sobre la tabla alias `u`. */
export function segmentCondition(segment: UserSegment): string {
	switch (segment) {
		case "free":
			return `COALESCE(u.user_data->'billing'->>'tier', 'free') = 'free'`;
		case "pro":
			return `u.user_data->'billing'->>'tier' = 'pro'`;
		case "vip":
			return `u.user_data->'billing'->>'tier' = 'vip'`;
		case "manual_license":
			return `u.id IN (SELECT o.user_id FROM manual_payment_orders o WHERE o.status = 'approved')`;
		case "trial_pro":
			return `u.user_data->'billing'->'plan_validity'->>'source' = 'trial'
				AND (u.user_data->'billing'->'plan_validity'->>'expires_at')::timestamptz > NOW()`;
		case "inactive_1y":
			return `u.created_at < NOW() - INTERVAL '1 year'
				AND NOT EXISTS (SELECT 1 FROM user_activity a WHERE a.user_id = u.id AND a.created_at > NOW() - INTERVAL '1 year')
				AND NOT EXISTS (SELECT 1 FROM users_logins l WHERE l.user_id = u.id AND l.login_time > NOW() - INTERVAL '1 year')`;
	}
}

/** Contadores de segmentos de usuarios para las tarjetas del panel admin. */
export async function getUserSegments(): Promise<UserSegments> {
	const [counters, buyers] = await Promise.all([
		pool.query<{
			total: string;
			admins: string;
			free: string;
			pro: string;
			vip: string;
			trial_pro: string;
			inactive_year: string;
		}>(
			`SELECT
				COUNT(*) AS total,
				COUNT(*) FILTER (WHERE u.privileges = 'admin') AS admins,
				COUNT(*) FILTER (WHERE COALESCE(u.user_data->'billing'->>'tier', 'free') = 'free') AS free,
				COUNT(*) FILTER (WHERE u.user_data->'billing'->>'tier' = 'pro') AS pro,
				COUNT(*) FILTER (WHERE u.user_data->'billing'->>'tier' = 'vip') AS vip,
				COUNT(*) FILTER (WHERE ${segmentCondition("trial_pro")}) AS trial_pro,
				COUNT(*) FILTER (WHERE ${segmentCondition("inactive_1y")}) AS inactive_year
			FROM users u`,
		),
		pool.query<{ buyers: string }>(
			`SELECT COUNT(DISTINCT user_id) AS buyers
			 FROM manual_payment_orders
			 WHERE status = 'approved'`,
		),
	]);

	const row = counters.rows[0];
	const total = Number(row?.total ?? "0");
	const admins = Number(row?.admins ?? "0");

	return {
		total,
		admins,
		regular: total - admins,
		free: Number(row?.free ?? "0"),
		pro: Number(row?.pro ?? "0"),
		vip: Number(row?.vip ?? "0"),
		manualLicenseBuyers: Number(buyers.rows[0]?.buyers ?? "0"),
		trialProActive: Number(row?.trial_pro ?? "0"),
		inactiveOverYear: Number(row?.inactive_year ?? "0"),
	};
}
