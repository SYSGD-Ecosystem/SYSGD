import { pool } from "../db";
import { createDefaultUserData } from "../utils/billing";
import {
	consumeCreditsByPriority,
	maybeRenewPlanCredits,
	normalizeBillingState,
} from "./billing-credits.service";
import { getUserBillingTier } from "./accounting-documents.service"; // ya existe, reusalo

// Modo prueba: PRO también puede publicar, a futuro restringe solo a VIP
const PUBLISHING_TIERS = new Set(["pro", "vip"]);

// Costo fijo por tier (ajustable a futuro a escalado diario)
const POST_COST_BY_TIER: Record<string, number> = {
	pro: 20,
	vip: 10, // vip tiene más créditos asignados por plan, así que paga menos por publicación
};

const POST_DURATION_DAYS = 7;

export const userCanPublishInDescubre = async (userId: string): Promise<boolean> => {
	const tier = await getUserBillingTier(userId);
	return !!tier && PUBLISHING_TIERS.has(tier);
};

export const getPostCostForUser = async (userId: string): Promise<number | null> => {
	const tier = await getUserBillingTier(userId);
	if (!tier || !PUBLISHING_TIERS.has(tier)) return null;
	return POST_COST_BY_TIER[tier] ?? null;
};

export interface CreateDescubrePostInput {
	title: string;
	description: string;
	category?: string;
	precio?: string;
	moneda?: string;
	province?: string;
	contactNumber: string;
	imageUrls?: string[];
}

interface DescubrePostRow {
	id: string;
	user_id: string;
	title: string;
	description: string;
	category: string | null;
	precio: string | null;
	moneda: string | null;
	province: string | null;
	contact_number: string;
	image_url: string | null;
	credits_spent: number;
	boost_credits: number;
	boosted_at: string | null;
	status: string;
	expires_at: string;
	created_at: string;
	user_name?: string;
}

export interface DescubrePostOutput {
	id: string;
	userId: string;
	userName: string;
	contactNumber: string;
	moneda: string;
	province: string;
	precio: string;
	date: string;
	title: string;
	description: string;
	category: string;
	imageUrls: string[];
	creditsSpent: number;
	boostCredits: number;
}

export type CreateDescubrePostResult =
	| { ok: true; post: DescubrePostOutput; remainingCredits: number }
	| { ok: false; reason: "forbidden" | "insufficient_credits"; remainingCredits?: number };

function toDescubrePostOutput(row: DescubrePostRow): DescubrePostOutput {
	let imageUrls: string[] = [];
	if (row.image_url) {
		try {
			const parsed = JSON.parse(row.image_url);
			imageUrls = Array.isArray(parsed) ? parsed : [row.image_url];
		} catch {
			imageUrls = [row.image_url];
		}
	}
	return {
		id: row.id,
		userId: row.user_id,
		userName: row.user_name ?? "",
		contactNumber: row.contact_number,
		moneda: row.moneda ?? "",
		province: row.province ?? "",
		precio: row.precio ?? "",
		date: row.created_at,
		title: row.title,
		description: row.description,
		category: row.category ?? "",
		imageUrls,
		creditsSpent: row.credits_spent,
		boostCredits: row.boost_credits,
	};
}

export const createDescubrePost = async (
	userId: string,
	input: CreateDescubrePostInput,
): Promise<CreateDescubrePostResult> => {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const { rows: userRows } = await client.query<{ user_data: { billing?: { tier?: string } } | null }>(
			"SELECT user_data FROM users WHERE id = $1 FOR UPDATE",
			[userId],
		);
		if (userRows.length === 0) {
			await client.query("ROLLBACK");
			return { ok: false, reason: "forbidden" };
		}

		const tier = userRows[0].user_data?.billing?.tier;
		if (!tier || !PUBLISHING_TIERS.has(tier)) {
			await client.query("ROLLBACK");
			return { ok: false, reason: "forbidden" };
		}

		const cost = POST_COST_BY_TIER[tier];
		const currentBilling = maybeRenewPlanCredits(
			normalizeBillingState(userRows[0].user_data?.billing ?? createDefaultUserData().billing),
		);
		const consumedBilling = consumeCreditsByPriority(currentBilling, cost);

		if (!consumedBilling) {
			await client.query("ROLLBACK");
			return {
				ok: false,
				reason: "insufficient_credits",
				remainingCredits: currentBilling.ai_task_credits,
			};
		}

		await client.query(
			`UPDATE users
			 SET user_data = jsonb_set(COALESCE(user_data, '{}'::jsonb), '{billing}', $1::jsonb)
			 WHERE id = $2`,
			[JSON.stringify(consumedBilling), userId],
		);

		const imageUrlJson = input.imageUrls?.length ? JSON.stringify(input.imageUrls) : null;

		const { rows: postRows } = await client.query(
			`INSERT INTO descubre_posts
				(user_id, title, description, category, precio, moneda, province,
				 contact_number, image_url, credits_spent, expires_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW() + INTERVAL '${POST_DURATION_DAYS} days')
			RETURNING id, user_id, title, description, category, precio, moneda, province,
				contact_number, image_url, credits_spent, boost_credits, boosted_at,
				status, expires_at, created_at
			`,
			[
				userId,
				input.title,
				input.description,
				input.category ?? null,
				input.precio ?? null,
				input.moneda ?? null,
				input.province ?? null,
				input.contactNumber,
				imageUrlJson,
				cost,
			],
		);

		const { rows: userRows2 } = await client.query<{ name: string }>(
			"SELECT name FROM users WHERE id = $1",
			[userId],
		);

		await client.query("COMMIT");

		const fullRow: DescubrePostRow = {
			...postRows[0],
			user_name: userRows2[0]?.name ?? "",
		};

		return { ok: true, post: toDescubrePostOutput(fullRow), remainingCredits: consumedBilling.ai_task_credits };
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

const WELCOME_POSTS: DescubrePostOutput[] = [
	{
		id: "welcome-1",
		userId: "system",
		userName: "Equipo SYSGD",
		contactNumber: "",
		moneda: "CUP",
		province: "Toda Cuba",
		precio: "Gratis",
		date: new Date().toISOString(),
		title: "👋 ¡Bienvenido a Descubre!",
		description: "Estamos ajustando los últimos parámetros para ofrecerte la mejor experiencia. Muy pronto podrás explorar y publicar servicios, productos y más. ¡Gracias por tu paciencia!",
		category: "Información",
		imageUrls: [],
		creditsSpent: 0,
		boostCredits: 0,
	},
	{
		id: "welcome-2",
		userId: "system",
		userName: "Equipo SYSGD",
		contactNumber: "",
		moneda: "CUP",
		province: "Toda Cuba",
		precio: "Próximamente",
		date: new Date().toISOString(),
		title: "🚀 Nuevas funcionalidades en camino",
		description: "Descubre será el espacio ideal para conectar profesionales y clientes en Cuba. Publica tus servicios, encuentra lo que necesitas y haz crecer tu red de contactos.",
		category: "Información",
		imageUrls: [],
		creditsSpent: 0,
		boostCredits: 0,
	},
	{
		id: "welcome-3",
		userId: "system",
		userName: "Equipo SYSGD",
		contactNumber: "",
		moneda: "CUP",
		province: "Toda Cuba",
		precio: "Muy pronto",
		date: new Date().toISOString(),
		title: "📢 ¿Eres Pro o VIP?",
		description: "Los usuarios con plan Pro y VIP podrán publicar en Descubre. Si aún no tienes uno, actualiza tu plan y prepárate para mostrar tus servicios a toda la comunidad.",
		category: "Información",
		imageUrls: [],
		creditsSpent: 0,
		boostCredits: 0,
	},
];

export function getWelcomePosts(): DescubrePostOutput[] {
	return WELCOME_POSTS.map(p => ({ ...p, date: new Date().toISOString() }));
}

export const listDescubrePosts = async (limit = 30, cursorCreatedAt?: string): Promise<DescubrePostOutput[]> => {
	const cursorClause = cursorCreatedAt ? "AND p.created_at < $2" : "";
	const params: unknown[] = cursorCreatedAt ? [limit, cursorCreatedAt] : [limit];

	const { rows } = await pool.query(
		`
		SELECT p.id, p.user_id, u.name AS user_name, p.title, p.description,
			p.category, p.precio, p.moneda, p.province,
			p.contact_number, p.image_url, p.credits_spent, p.boost_credits,
			p.boosted_at, p.status, p.expires_at, p.created_at,
			(p.boost_credits + 1) /
				POWER(
					EXTRACT(EPOCH FROM (NOW() - COALESCE(p.boosted_at, p.created_at))) / 3600 + 2,
					1.6
				) AS score
		FROM descubre_posts p
		LEFT JOIN users u ON u.id = p.user_id
		WHERE p.status = 'active' AND p.expires_at > NOW() ${cursorClause}
		ORDER BY score DESC, p.created_at DESC
		LIMIT $1
		`,
		params,
	);
	if (rows.length === 0) {
		return getWelcomePosts();
	}
	return rows.map(toDescubrePostOutput);
};

export interface AdminDescubrePostOutput extends DescubrePostOutput {
	status: string;
	expiresAt: string;
}

export const listAllDescubrePostsForAdmin = async (limit = 100): Promise<AdminDescubrePostOutput[]> => {
	const { rows } = await pool.query<DescubrePostRow>(
		`
		SELECT p.id, p.user_id, u.name AS user_name, p.title, p.description,
			p.category, p.precio, p.moneda, p.province,
			p.contact_number, p.image_url, p.credits_spent, p.boost_credits,
			p.boosted_at, p.status, p.expires_at, p.created_at
		FROM descubre_posts p
		LEFT JOIN users u ON u.id = p.user_id
		ORDER BY p.created_at DESC
		LIMIT $1
		`,
		[limit],
	);
	return rows.map((row) => ({
		...toDescubrePostOutput(row),
		status: row.status,
		expiresAt: row.expires_at,
	}));
};

export const deleteDescubrePost = async (postId: string): Promise<boolean> => {
	const { rowCount } = await pool.query(
		"DELETE FROM descubre_posts WHERE id = $1",
		[postId],
	);
	return (rowCount ?? 0) > 0;
};