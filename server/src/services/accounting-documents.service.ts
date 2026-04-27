import { pool } from "../db";
import { createDefaultUserData } from "../utils/billing";
import {
	consumeCreditsByPriority,
	maybeRenewPlanCredits,
	normalizeBillingState,
} from "./billing-credits.service";

export type AccountingDocumentPayload = Record<string, unknown>;

export interface AccountingDocumentRecord {
	id: string;
	userId: string;
	name: string;
	documentType: "tcp_income_expense";
	payload: AccountingDocumentPayload;
	createdAt: string;
	updatedAt: string;
}

const PREMIUM_TIERS = new Set(["pro", "vip"]);

export const canUseAccountingDocuments = (tier?: string): boolean => {
	if (!tier) return false;
	return PREMIUM_TIERS.has(tier);
};


export const getUserBillingTier = async (userId: string): Promise<string | null> => {
	const { rows } = await pool.query<{ user_data: { billing?: { tier?: string } } | null }>(
		"SELECT user_data FROM users WHERE id = $1",
		[userId],
	);
	if (rows.length === 0) return null;
	const tier = rows[0].user_data?.billing?.tier;
	return typeof tier === "string" ? tier : null;
};

export const userHasAccountingAccess = async (userId: string): Promise<boolean> => {
	try {
		const tier = await getUserBillingTier(userId);
		return canUseAccountingDocuments(tier ?? undefined);
	} catch (error) {
		console.error("Error validando acceso contable:", error);
		return false;
	}
};

export const listAccountingDocumentsByUser = async (
	userId: string,
): Promise<AccountingDocumentRecord[]> => {
	const { rows } = await pool.query<{
		id: string;
		user_id: string;
		name: string;
		document_type: "tcp_income_expense";
		payload: AccountingDocumentPayload;
		created_at: string;
		updated_at: string;
	}>(
		`SELECT id, user_id, name, document_type, payload, created_at, updated_at
		 FROM accounting_documents
		 WHERE user_id = $1
		 ORDER BY created_at DESC`,
		[userId],
	);

	return rows.map((row) => ({
		id: row.id,
		userId: row.user_id,
		name: row.name,
		documentType: row.document_type,
		payload: row.payload,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	}));
};

export const createAccountingDocument = async (
	userId: string,
	name: string,
	payload: AccountingDocumentPayload = {},
): Promise<AccountingDocumentRecord> => {
	const { rows } = await pool.query<{
		id: string;
		user_id: string;
		name: string;
		document_type: "tcp_income_expense";
		payload: AccountingDocumentPayload;
		created_at: string;
		updated_at: string;
	}>(
		`INSERT INTO accounting_documents (user_id, name, document_type, payload)
		 VALUES ($1, $2, 'tcp_income_expense', $3::jsonb)
		 RETURNING id, user_id, name, document_type, payload, created_at, updated_at`,
		[userId, name, JSON.stringify(payload)],
	);

	const row = rows[0];
	return {
		id: row.id,
		userId: row.user_id,
		name: row.name,
		documentType: row.document_type,
		payload: row.payload,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
};

export const getAccountingDocumentById = async (
	userId: string,
	documentId: string,
): Promise<AccountingDocumentRecord | null> => {
	const { rows } = await pool.query<{
		id: string;
		user_id: string;
		name: string;
		document_type: "tcp_income_expense";
		payload: AccountingDocumentPayload;
		created_at: string;
		updated_at: string;
	}>(
		`SELECT id, user_id, name, document_type, payload, created_at, updated_at
		 FROM accounting_documents
		 WHERE id = $1 AND user_id = $2`,
		[documentId, userId],
	);

	if (rows.length === 0) return null;
	const row = rows[0];
	return {
		id: row.id,
		userId: row.user_id,
		name: row.name,
		documentType: row.document_type,
		payload: row.payload,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
};

export const updateAccountingDocumentPayload = async (
	userId: string,
	documentId: string,
	payload: AccountingDocumentPayload,
): Promise<AccountingDocumentRecord | null> => {
	const { rows } = await pool.query<{
		id: string;
		user_id: string;
		name: string;
		document_type: "tcp_income_expense";
		payload: AccountingDocumentPayload;
		created_at: string;
		updated_at: string;
	}>(
		`UPDATE accounting_documents
		 SET payload = $1::jsonb, updated_at = NOW()
		 WHERE id = $2 AND user_id = $3
		 RETURNING id, user_id, name, document_type, payload, created_at, updated_at`,
		[JSON.stringify(payload), documentId, userId],
	);

	if (rows.length === 0) return null;
	const row = rows[0];
	return {
		id: row.id,
		userId: row.user_id,
		name: row.name,
		documentType: row.document_type,
		payload: row.payload,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
};

export const getUserAvailableCredits = async (userId: string): Promise<number> => {
	const { rows } = await pool.query<{ user_data: { billing?: unknown } | null }>(
		"SELECT user_data FROM users WHERE id = $1",
		[userId],
	);

	if (rows.length === 0) return 0;

	const billing = maybeRenewPlanCredits(
		normalizeBillingState(rows[0].user_data?.billing ?? createDefaultUserData().billing),
	);

	return billing.ai_task_credits;
};

export const consumePdfGenerationCredit = async (
	userId: string,
): Promise<{ consumed: boolean; remainingCredits: number }> => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");
		const { rows } = await client.query<{ user_data: { billing?: unknown } | null }>(
			"SELECT user_data FROM users WHERE id = $1 FOR UPDATE",
			[userId],
		);

		if (rows.length === 0) {
			await client.query("ROLLBACK");
			return { consumed: false, remainingCredits: 0 };
		}

		const currentBilling = maybeRenewPlanCredits(
			normalizeBillingState(rows[0].user_data?.billing ?? createDefaultUserData().billing),
		);
		const consumedBilling = consumeCreditsByPriority(currentBilling, 1);

		if (!consumedBilling) {
			await client.query("ROLLBACK");
			return {
				consumed: false,
				remainingCredits: currentBilling.ai_task_credits,
			};
		}

		await client.query(
			`UPDATE users
			 SET user_data = jsonb_set(
			   COALESCE(user_data, '{}'::jsonb),
			   '{billing}',
			   $1::jsonb
			 )
			 WHERE id = $2`,
			[JSON.stringify(consumedBilling), userId],
		);
		await client.query("COMMIT");

		return {
			consumed: true,
			remainingCredits: consumedBilling.ai_task_credits,
		};
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};
