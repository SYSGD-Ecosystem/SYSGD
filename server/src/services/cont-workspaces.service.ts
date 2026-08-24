import { pool } from "../db";
import { LedgerEncryptionService, type EncryptedData } from "./ledger-encryption.service";

export interface ContWorkspaceMeta {
	id: string;
	name: string;
	ownerId: string;
	role: string;
	conversationId: string | null;
	createdAt: string;
	updatedAt: string;
}

export class WorkspaceConflictError extends Error {
	serverVersion: string;
	constructor(serverVersion: string) {
		super("version_conflict");
		this.serverVersion = serverVersion;
	}
}

const ROLES_VALIDOS = ["admin", "member", "viewer"];

/**
 * Espacios propios (owner) + compartidos vía resource_access.
 * El rol del dueño se devuelve virtualmente como 'owner'.
 */
export const listWorkspacesForUser = async (
	userId: string,
): Promise<ContWorkspaceMeta[]> => {
	const { rows } = await pool.query(
		`SELECT w.id, w.name, w.owner_id, w.conversation_id, w.created_at, w.updated_at,
			CASE WHEN w.owner_id = $1 THEN 'owner' ELSE COALESCE(ra.role, 'viewer') END AS role
		 FROM cont_workspaces w
		 LEFT JOIN resource_access ra
			ON ra.resource_type = 'workspace'
			AND ra.resource_id = w.id
			AND ra.user_id = $1
		 WHERE w.owner_id = $1 OR ra.user_id = $1
		 ORDER BY w.updated_at DESC`,
		[userId],
	);

	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		ownerId: r.owner_id,
		role: r.role,
		conversationId: r.conversation_id,
		createdAt: r.created_at,
		updatedAt: r.updated_at,
	}));
};

export const getWorkspaceForUser = async (
	workspaceId: string,
	userId: string,
): Promise<ContWorkspaceMeta | null> => {
	const { rows } = await pool.query(
		`SELECT w.id, w.name, w.owner_id, w.conversation_id, w.created_at, w.updated_at,
			CASE WHEN w.owner_id = $2 THEN 'owner' ELSE COALESCE(ra.role, 'viewer') END AS role
		 FROM cont_workspaces w
		 LEFT JOIN resource_access ra
			ON ra.resource_type = 'workspace'
			AND ra.resource_id = w.id
			AND ra.user_id = $2
		 WHERE w.id = $1 AND (w.owner_id = $2 OR ra.user_id = $2)`,
		[workspaceId, userId],
	);

	if (rows.length === 0) return null;

	const r = rows[0];
	return {
		id: r.id,
		name: r.name,
		ownerId: r.owner_id,
		role: r.role,
		conversationId: r.conversation_id,
		createdAt: r.created_at,
		updatedAt: r.updated_at,
	};
};

export const createWorkspace = async (
	userId: string,
	name: string,
): Promise<ContWorkspaceMeta> => {
	const { rows } = await pool.query(
		`INSERT INTO cont_workspaces (owner_id, name)
		 VALUES ($1, $2)
		 RETURNING id, name, owner_id, conversation_id, created_at, updated_at`,
		[userId, name],
	);
	const r = rows[0];
	return {
		id: r.id,
		name: r.name,
		ownerId: r.owner_id,
		role: "owner",
		conversationId: r.conversation_id,
		createdAt: r.created_at,
		updatedAt: r.updated_at,
	};
};

export const renameWorkspace = async (
	workspaceId: string,
	name: string,
): Promise<void> => {
	await pool.query(
		`UPDATE cont_workspaces SET name = $2, updated_at = NOW() WHERE id = $1`,
		[workspaceId, name],
	);
};

/** Borra el workspace y sus filas de ACL/invitaciones en una transacción. */
export const deleteWorkspace = async (workspaceId: string): Promise<void> => {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		await client.query(
			`DELETE FROM invitations WHERE resource_type = 'workspace' AND resource_id = $1`,
			[workspaceId],
		);
		await client.query(
			`DELETE FROM resource_access WHERE resource_type = 'workspace' AND resource_id = $1`,
			[workspaceId],
		);
		await client.query(`DELETE FROM cont_workspaces WHERE id = $1`, [workspaceId]);
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

export const getWorkspaceLedger = async (
	workspaceId: string,
): Promise<{ registro: unknown; version: string } | null> => {
	const { rows } = await pool.query(
		`SELECT registro, updated_at FROM cont_workspaces WHERE id = $1`,
		[workspaceId],
	);
	if (rows.length === 0) return null;

	const raw = rows[0].registro;
	let registro: unknown = null;
	if (LedgerEncryptionService.isEncryptedData(raw)) {
		try {
			registro = LedgerEncryptionService.decryptLedger(raw as EncryptedData);
		} catch (error) {
			console.error("Error descifrando workspace ledger:", error);
			registro = null;
		}
	} else {
		registro = raw;
	}

	return { registro, version: rows[0].updated_at };
};

/**
 * Escritura con control de versión optimista en servidor:
 * si expectedVersion no coincide con updated_at actual, lanza conflicto
 * sin modificar nada. Así un push del dependiente nunca pisa en silencio
 * el cambio del dueño.
 */
export const saveWorkspaceLedger = async (
	workspaceId: string,
	registro: unknown,
	expectedVersion?: string,
): Promise<{ version: string }> => {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const current = await client.query<{ updated_at: string }>(
			`SELECT updated_at FROM cont_workspaces WHERE id = $1 FOR UPDATE`,
			[workspaceId],
		);
		if (current.rows.length === 0) {
			await client.query("ROLLBACK");
			const err = new Error("workspace_not_found") as Error & { statusCode?: number };
			err.statusCode = 404;
			throw err;
		}

		const serverVersion = current.rows[0].updated_at;
		if (expectedVersion && new Date(serverVersion).getTime() !== new Date(expectedVersion).getTime()) {
			await client.query("ROLLBACK");
			throw new WorkspaceConflictError(serverVersion);
		}

		const encrypted = LedgerEncryptionService.encryptLedger(registro);
		const updated = await client.query<{ updated_at: string }>(
			`UPDATE cont_workspaces
			 SET registro = $2::jsonb, updated_at = NOW()
			 WHERE id = $1
			 RETURNING updated_at`,
			[workspaceId, JSON.stringify(encrypted)],
		);

		await client.query("COMMIT");
		return { version: updated.rows[0].updated_at };
	} catch (error) {
		try { await client.query("ROLLBACK"); } catch { /* ya en rollback */ }
		throw error;
	} finally {
		client.release();
	}
};

// ── Miembros ────────────────────────────────────────────────

export const listWorkspaceMembers = async (workspaceId: string) => {
	const membersResult = await pool.query(
		`WITH active_members AS (
			SELECT w.owner_id AS user_id, 'owner'::text AS role
			FROM cont_workspaces w WHERE w.id = $1

			UNION

			SELECT ra.user_id, COALESCE(ra.role, 'member') AS role
			FROM resource_access ra
			WHERE ra.resource_type = 'workspace' AND ra.resource_id = $1
		)
		SELECT u.id, u.name, u.email, am.role, 'active' as status
		FROM active_members am
		JOIN users u ON am.user_id = u.id`,
		[workspaceId],
	);

	const pendingResult = await pool.query(
		`SELECT i.id, i.receiver_email, i.role, i.created_at, us.name as sender_name
		 FROM invitations i
		 LEFT JOIN users us ON i.sender_id = us.id
		 WHERE i.resource_type = 'workspace' AND i.resource_id = $1 AND i.status = 'pending'`,
		[workspaceId],
	);

	return [
		...membersResult.rows.map((m) => ({
			id: m.id,
			name: m.name,
			email: m.email,
			role: m.role,
			status: m.status,
		})),
		...pendingResult.rows.map((p) => ({
			id: p.id,
			receiverEmail: p.receiver_email,
			name: p.receiver_email,
			email: p.receiver_email,
			role: p.role,
			status: "invited",
			senderName: p.sender_name,
			createdAt: p.created_at,
		})),
	];
};

/** Crea la invitación; la aceptación la resuelve el endpoint genérico existente. */
export const inviteWorkspaceMember = async (
	workspaceId: string,
	senderId: string,
	email: string,
	role?: string,
): Promise<void> => {
	const rolFinal = role && ROLES_VALIDOS.includes(role) ? role : "member";

	const userResult = await pool.query<{ id: string }>(
		`SELECT id FROM users WHERE email = $1`,
		[email],
	);
	let receiverId = userResult.rows[0]?.id ?? null;

	if (!receiverId) {
		const { createDefaultUserData } = await import("../utils/billing");
		const newUser = await pool.query<{ id: string }>(
			`INSERT INTO users (email, status, privileges, user_data)
			 VALUES ($1, 'invited', 'user', $2)
			 RETURNING id`,
			[email, JSON.stringify(createDefaultUserData())],
		);
		receiverId = newUser.rows[0].id;
	}

	await pool.query(
		`INSERT INTO invitations (sender_id, receiver_id, receiver_email, resource_type, resource_id, role)
		 VALUES ($1, $2, $3, 'workspace', $4, $5)`,
		[senderId, receiverId, email, workspaceId, rolFinal],
	);
};

export const removeWorkspaceMember = async (
	workspaceId: string,
	memberUserId: string,
): Promise<void> => {
	await pool.query(
		`DELETE FROM resource_access
		 WHERE resource_type = 'workspace' AND resource_id = $1 AND user_id = $2`,
		[workspaceId, memberUserId],
	);
};
