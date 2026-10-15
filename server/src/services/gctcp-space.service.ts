import { pool } from "../db";
import { LedgerEncryptionService, type EncryptedData } from "./ledger-encryption.service";

export interface GctcpSpaceSummary {
  space_id: string;
  updated_at: string;
}

export interface GctcpSpaceData {
  data: unknown;
  updatedAt: string;
}

export const listGctcpSpaces = async (userId: string): Promise<GctcpSpaceSummary[]> => {
  const { rows } = await pool.query<GctcpSpaceSummary>(
    `SELECT space_id, updated_at FROM gctcp_spaces WHERE user_id = $1`,
    [userId]
  );
  return rows;
};

export const getGctcpSpace = async (userId: string, spaceId: string): Promise<GctcpSpaceData | null> => {
  const { rows } = await pool.query<{ data: unknown; updated_at: string }>(
    `SELECT data, updated_at FROM gctcp_spaces WHERE space_id = $1 AND user_id = $2`,
    [spaceId, userId]
  );

  if (rows.length === 0) return null;

  let decrypted = rows[0].data;
  if (LedgerEncryptionService.isEncryptedData(decrypted)) {
    decrypted = LedgerEncryptionService.decryptLedger(decrypted as EncryptedData);
  }

  return { data: decrypted, updatedAt: rows[0].updated_at };
};

export const updateGctcpSpace = async (
  userId: string,
  spaceId: string,
  data: unknown
): Promise<{ updatedAt: string }> => {
  const encrypted = LedgerEncryptionService.encryptLedger(data);
  const { rows } = await pool.query<{ updated_at: string }>(
    `UPDATE gctcp_spaces
     SET data = $1::jsonb, updated_at = NOW()
     WHERE space_id = $2 AND user_id = $3
     RETURNING updated_at`,
    [JSON.stringify(encrypted), spaceId, userId]
  );

  if (rows.length === 0) throw new Error("Space no encontrado");
  return { updatedAt: rows[0].updated_at };
};

export const createGctcpSpace = async (
  userId: string,
  spaceId: string,
  data: unknown
): Promise<{ spaceId: string; updatedAt: string }> => {
  const encrypted = LedgerEncryptionService.encryptLedger(data);
  const { rows } = await pool.query<{ space_id: string; updated_at: string }>(
    `INSERT INTO gctcp_spaces (user_id, space_id, data)
     VALUES ($1, $2, $3::jsonb)
     RETURNING space_id, updated_at`,
    [userId, spaceId, JSON.stringify(encrypted)]
  );

  return { spaceId: rows[0].space_id, updatedAt: rows[0].updated_at };
};

export const deleteGctcpSpace = async (userId: string, spaceId: string): Promise<void> => {
  const { rows } = await pool.query(
    `DELETE FROM gctcp_spaces WHERE space_id = $1 AND user_id = $2 RETURNING space_id`,
    [spaceId, userId]
  );

  if (rows.length === 0) throw new Error("Space no encontrado");
};
