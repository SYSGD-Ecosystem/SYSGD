import { pool } from "../db";

export interface ContLedgerRecord {
	userId: string;
	registro: unknown;
	updatedAt: string;
}

export const getContLedgerByUser = async (
	userId: string,
): Promise<ContLedgerRecord | null> => {
	const { rows } = await pool.query<{
		user_id: string;
		registro: unknown;
		updated_at: string;
	}>(
		`SELECT user_id, registro, updated_at
		 FROM cont_ledger_records
		 WHERE user_id = $1`,
		[userId],
	);

	if (rows.length === 0) {
		return null;
	}

	return {
		userId: rows[0].user_id,
		registro: rows[0].registro,
		updatedAt: rows[0].updated_at,
	};
};

export const upsertContLedgerByUser = async (
	userId: string,
	registro: unknown,
): Promise<ContLedgerRecord> => {
	const { rows } = await pool.query<{
		user_id: string;
		registro: unknown;
		updated_at: string;
	}>(
		`INSERT INTO cont_ledger_records (user_id, registro)
		 VALUES ($1, $2::jsonb)
		 ON CONFLICT (user_id)
		 DO UPDATE SET registro = EXCLUDED.registro, updated_at = NOW()
		 RETURNING user_id, registro, updated_at`,
		[userId, JSON.stringify(registro)],
	);

	return {
		userId: rows[0].user_id,
		registro: rows[0].registro,
		updatedAt: rows[0].updated_at,
	};
};
