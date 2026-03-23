import { pool } from "../db";
import { LedgerEncryptionService, type EncryptedData } from "./ledger-encryption.service";

export interface ContLedgerRecord {
	userId: string;
	registro: unknown;
	inventarioRegistro: unknown;
	updatedAt: string;
}

export const getContLedgerByUser = async (
	userId: string,
): Promise<ContLedgerRecord | null> => {
	const { rows } = await pool.query<{
		user_id: string;
		registro: unknown;
		inventario_registro: unknown;
		updated_at: string;
	}>(
		`SELECT user_id, registro, inventario_registro, updated_at
		 FROM cont_ledger_records
		 WHERE user_id = $1`,
		[userId],
	);

	if (rows.length === 0) {
		return null;
	}

	const rawRegistro = rows[0].registro;
	const rawInventarioRegistro = rows[0].inventario_registro;
	let decryptedRegistro: unknown = null;
	let decryptedInventarioRegistro: unknown = null;

	if (LedgerEncryptionService.isEncryptedData(rawRegistro)) {
		try {
			decryptedRegistro = LedgerEncryptionService.decryptLedger(rawRegistro as EncryptedData);
		} catch (error) {
			console.error('Error decrypting ledger:', error);
			decryptedRegistro = null;
		}
	} else {
		decryptedRegistro = rawRegistro;
	}

	if (LedgerEncryptionService.isEncryptedData(rawInventarioRegistro)) {
		try {
			decryptedInventarioRegistro = LedgerEncryptionService.decryptLedger(rawInventarioRegistro as EncryptedData);
		} catch (error) {
			console.error('Error decrypting inventory ledger:', error);
			decryptedInventarioRegistro = null;
		}
	} else {
		decryptedInventarioRegistro = rawInventarioRegistro;
	}

	return {
		userId: rows[0].user_id,
		registro: decryptedRegistro,
		inventarioRegistro: decryptedInventarioRegistro,
		updatedAt: rows[0].updated_at,
	};
};

export const upsertContLedgerByUser = async (
	userId: string,
	registro: unknown,
	inventarioRegistro?: unknown,
): Promise<ContLedgerRecord> => {
	const encryptedData = LedgerEncryptionService.encryptLedger(registro);
	const encryptedInventarioData =
		typeof inventarioRegistro === "undefined"
			? undefined
			: LedgerEncryptionService.encryptLedger(inventarioRegistro);

	const { rows } = await pool.query<{
		user_id: string;
		registro: unknown;
		inventario_registro: unknown;
		updated_at: string;
	}>(
		`INSERT INTO cont_ledger_records (user_id, registro, inventario_registro)
		 VALUES ($1, $2::jsonb, $3::jsonb)
		 ON CONFLICT (user_id)
		 DO UPDATE SET
			registro = EXCLUDED.registro,
			inventario_registro = COALESCE(EXCLUDED.inventario_registro, cont_ledger_records.inventario_registro),
			updated_at = NOW()
		 RETURNING user_id, registro, inventario_registro, updated_at`,
		[userId, JSON.stringify(encryptedData), encryptedInventarioData ? JSON.stringify(encryptedInventarioData) : null],
	);

	return {
		userId: rows[0].user_id,
		registro: rows[0].registro,
		inventarioRegistro: rows[0].inventario_registro,
		updatedAt: rows[0].updated_at,
	};
};
