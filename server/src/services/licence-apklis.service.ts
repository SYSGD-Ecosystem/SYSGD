import { pool } from "../db";
import { TIER_CREDITS, TIER_LIMITS } from "../utils/billing";
import {
	maybeRenewPlanCredits,
	normalizeBillingState,
	type PlanValidity,
} from "./billing-credits.service";

export interface ApklisLicenceInput {
	apklisLicenceUuid: string;
	apklisLicenceName: string;
	apklisLicenceDays: number;
	apklisLicense: string;
	apklisUsername: string;
	purchasedAt: number;
	packageName?: string;
}

export interface ApklisActivationResult {
	alreadyActivated: boolean;
	tier: string;
	planValidity: PlanValidity | null;
}

/**
 * Catálogo de duración conocida (Console de Apklis → Grupos de Licencias).
 * El `uuid` es la clave de negocio; `days` la vigencia que otorga. Se usa para
 * validar la entrada y para mapear a meses de facturación cuando aplica.
 */
export const APKLIS_LICENCE_CATALOG: Record<string, { name: string; days: number }> = {
	"29719eb7-7578-4fe3-8822-f8c5794117a7": { name: "Anual", days: 365 },
	"21b36443-c8d9-4985-891f-5bac3321a0e8": { name: "Trimestral", days: 90 },
	"1fce965a-e4a0-4bd9-861f-ce6ed7cdec74": { name: "Mensual", days: 30 },
	"d6274d70-7da3-4d5b-9391-1fc9a37f7d0b": { name: "Tester", days: 3 },
};

const APKLIS_PACKAGE = "cu.lazaroysr96.sysgdcont";

const monthsForDays = (days: number): 1 | 3 | 12 | null => {
	if (days === 30) return 1;
	if (days === 90) return 3;
	if (days === 365) return 12;
	return null;
};

const addMonths = (date: Date, months: number): Date => {
	const next = new Date(date);
	next.setMonth(next.getMonth() + months);
	return next;
};

/**
 * Activa el Plan Pro del usuario a partir de una compra de licencia Apklis.
 *
 * Idempotente por `(user_id, apklis_license)`: el string de licencia que emite
 * Apklis es la clave de negocio, por lo que reintentos (incluyendo el aviso
 * offline que la app reintenta al arrancar) no duplican ni extienden la
 * vigencia. Comprar una licencia distinta REEMPLAZA la vigencia actual (no
 * acumula), igual que `activatePlanBilling`.
 *
 * Nota de seguridad: NO se verifica aquí la firma RSA del string `license`.
 * Se guarda como prueba para un futuro endpoint de verificación. Ver
 * `plan-licencia-apklis-servidor.md`.
 */
export const activateApklisLicence = async (
	userId: string,
	input: ApklisLicenceInput,
): Promise<ApklisActivationResult> => {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const existing = await client.query<{ id: string }>(
			`SELECT id FROM apklis_licence_activations
			 WHERE user_id = $1 AND apklis_license = $2`,
			[userId, input.apklisLicense],
		);

		if (existing.rows.length > 0) {
			const userRows = await client.query<{ user_data: { billing?: unknown } | null }>(
				"SELECT user_data FROM users WHERE id = $1",
				[userId],
			);
			const billing = maybeRenewPlanCredits(
				normalizeBillingState(userRows.rows[0]?.user_data?.billing),
			);
			await client.query("COMMIT");
			return {
				alreadyActivated: true,
				tier: billing.tier,
				planValidity: billing.plan_validity,
			};
		}

		const userRows = await client.query<{ user_data: { billing?: unknown } | null }>(
			"SELECT user_data FROM users WHERE id = $1 FOR UPDATE",
			[userId],
		);
		if (userRows.rows.length === 0) {
			throw new Error("Usuario no encontrado para activación Apklis");
		}

		const current = maybeRenewPlanCredits(
			normalizeBillingState(userRows.rows[0].user_data?.billing),
		);

		const now = new Date();
		const days = input.apklisLicenceDays;
		const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
		const nextReset = new Date(
			Math.min(addMonths(now, 1).getTime(), new Date(expiresAt).getTime()),
		).toISOString();

		const planValidity: PlanValidity = {
			started_at: now.toISOString(),
			expires_at: expiresAt,
			duration_months: monthsForDays(days),
			duration_days: days,
			source: "purchase",
			product: "contability_tcp",
			apklis: {
				uuid: input.apklisLicenceUuid,
				name: input.apklisLicenceName,
				days,
				license: input.apklisLicense,
				username: input.apklisUsername,
			},
		};

		const bonusTotal = current.bonus_credits.reduce((acc, bonus) => acc + bonus.amount, 0);
		const nextBilling = {
			...current,
			tier: "pro" as const,
			plan_credits: TIER_CREDITS.pro,
			ai_task_credits: TIER_CREDITS.pro + current.purchased_credits + bonusTotal,
			limits: TIER_LIMITS.pro,
			billing_cycle: {
				last_reset: planValidity.started_at,
				next_reset: nextReset,
			},
			plan_validity: planValidity,
		};

		await client.query(
			`UPDATE users
			 SET user_data = jsonb_set(COALESCE(user_data, '{}'::jsonb), '{billing}', $1::jsonb)
			 WHERE id = $2`,
			[JSON.stringify(nextBilling), userId],
		);

		await client.query(
			`INSERT INTO apklis_licence_activations
			   (user_id, apklis_license, apklis_licence_uuid, apklis_licence_name,
			    apklis_licence_days, apklis_username, package_name, purchased_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			[
				userId,
				input.apklisLicense,
				input.apklisLicenceUuid,
				input.apklisLicenceName,
				days,
				input.apklisUsername,
				input.packageName ?? null,
				input.purchasedAt ? new Date(input.purchasedAt) : null,
			],
		);

		await client.query("COMMIT");
		return { alreadyActivated: false, tier: "pro", planValidity };
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

export const isKnownApklisLicence = (uuid: string): boolean =>
	Object.prototype.hasOwnProperty.call(APKLIS_LICENCE_CATALOG, uuid);

export const isApklisPackage = (packageName: string): boolean => {
	const normalized = packageName.trim().toLowerCase();
	return (
		normalized === APKLIS_PACKAGE ||
		normalized.startsWith(`${APKLIS_PACKAGE}.`)
	);
};
