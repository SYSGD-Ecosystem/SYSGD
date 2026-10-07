import { pool } from "../db";
import { EmailService } from "./emailService";
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

const ROLES_VALIDOS = ["admin", "member", "viewer", "vendedor"];

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
): Promise<{ registro: unknown; sections: Record<string, string>; version: string } | null> => {
	const { rows } = await pool.query(
		`SELECT registro, sections, updated_at FROM cont_workspaces WHERE id = $1`,
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

	return { registro, sections: rows[0].sections ?? {}, version: rows[0].updated_at };
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
	sections?: Record<string, string>,
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
			 SET registro = $2::jsonb,
			     sections = $3::jsonb,
			     updated_at = NOW()
			 WHERE id = $1
			 RETURNING updated_at`,
			[workspaceId, JSON.stringify(encrypted), JSON.stringify(sections ?? {})],
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

	// El vendedor solo se entera de que lo invitaron si recibe un correo:
	// sin esto, la invitación es invisible hasta que abre la app y entra a
	// Espacios en la nube. El fallo de email NO deshace la invitación.
	await notificarInvitacionWorkspace({ workspaceId, senderId, email, rol: rolFinal });
};

/**
 * Envía el correo de invitación a un espacio de trabajo y lo registra en
 * `email_notifications`. Nunca lanza: la invitación ya está creada y un
 * fallo de Resend no debe devolverle un 500 al dueño.
 */
const notificarInvitacionWorkspace = async (params: {
	workspaceId: string;
	senderId: string;
	email: string;
	rol: string;
}): Promise<void> => {
	const { workspaceId, senderId, email, rol } = params;
	try {
		const datos = await pool.query<{
			ws_name: string;
			sender_name: string | null;
		}>(
			`SELECT w.name AS ws_name, u.name AS sender_name
			 FROM cont_workspaces w
			 LEFT JOIN users u ON u.id = w.owner_id
			 WHERE w.id = $1`,
			[workspaceId],
		);
		const wsName = datos.rows[0]?.ws_name ?? "un espacio de trabajo";
		const senderName = datos.rows[0]?.sender_name ?? "Un usuario de SYSGD";
		const etiquetaRol = rol === "vendedor" ? "vendedor" : "miembro";
		const appUrl = process.env.APP_URL || "https://www.ecosysgd.com";
		const subject = `${senderName} te invitó a colaborar como ${etiquetaRol} en ${wsName}`;
		const html = `
			<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">
				<h2 style="margin:0 0 12px">Invitación a ${wsName}</h2>
				<p style="margin:0 0 8px"><strong>${senderName}</strong> te invitó a participar
				como <strong>${etiquetaRol}</strong> en el espacio de trabajo
				<strong>${wsName}</strong> de SYSGD Ecosystem.</p>
				<p style="margin:0 0 20px;color:#6b7280">Abre la app SYSGD Cont y entra a
				<strong>Espacios en la nube</strong> para aceptar la invitación.</p>
				<p style="margin:0"><a href="${appUrl}/apps"
					style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Abrir SYSGD</a></p>
				<p style="margin:20px 0 0;color:#9ca3af;font-size:12px">Si no esperabas esta invitación, ignora este mensaje.</p>
			</div>`;

		const sent = await EmailService.sendEmail({ to: email, subject, html });
		await pool.query(
			`INSERT INTO email_notifications (user_id, recipient_email, subject, type, status, sent_at)
			 VALUES ($1, $2, $3, 'workspace_invitation', $4, NOW())`,
			[null, email, subject, sent ? "sent" : "failed"],
		);
		if (!sent) console.error("Invitación de workspace: email no enviado a", email);
	} catch (error) {
		console.error("Error enviando invitación de workspace:", error);
	}
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

/**
 * Cambia el rol de un miembro del workspace (p.ej. miembro -> vendedor).
 * Si el usuario aún tiene una invitación pendiente (no ha aceptado), se
 * actualiza el rol de la invitación; en caso contrario se actualiza (o crea
 * si faltara) su fila de resource_access. Valida el rol contra ROLES_VALIDOS.
 */
export const setWorkspaceMemberRole = async (
	workspaceId: string,
	memberUserId: string,
	role: string,
): Promise<void> => {
	if (!ROLES_VALIDOS.includes(role)) {
		const err = new Error(`Rol inválido: ${role}`) as Error & { statusCode?: number };
		err.statusCode = 400;
		throw err;
	}

	const access = await pool.query(
		`UPDATE resource_access
		 SET role = $3
		 WHERE resource_type = 'workspace' AND resource_id = $1 AND user_id = $2`,
		[workspaceId, memberUserId, role],
	);
	if ((access.rowCount ?? 0) > 0) return;

	const invitation = await pool.query(
		`UPDATE invitations
		 SET role = $3
		 WHERE resource_type = 'workspace' AND resource_id = $1
		   AND receiver_id = $2 AND status = 'pending'`,
		[workspaceId, memberUserId, role],
	);
	if ((invitation.rowCount ?? 0) > 0) return;

	const err = new Error("El usuario no es miembro de este espacio") as Error & { statusCode?: number };
	err.statusCode = 404;
	throw err;
};

// ── Vínculo vendedor local <-> miembro ──────────────────────────

export interface WorkspaceVendedorLink {
	vendedorId: string;
	memberUserId: string;
	memberEmail: string;
	memberName: string;
	almacenId: string | null;
	role: string;
	createdAt: string;
}

export const listWorkspaceVendedorLinks = async (
	workspaceId: string,
): Promise<WorkspaceVendedorLink[]> => {
	const { rows } = await pool.query(
		`SELECT l.vendedor_id, l.member_user_id, u.email, u.name, l.almacen_id,
		        COALESCE(ra.role, 'vendedor') AS role, l.created_at::text AS created_at
		 FROM cont_workspace_vendedor_links l
		 JOIN users u ON u.id = l.member_user_id
		 LEFT JOIN resource_access ra
		   ON ra.resource_type = 'workspace' AND ra.resource_id = l.workspace_id
		   AND ra.user_id = l.member_user_id
		 WHERE l.workspace_id = $1
		 ORDER BY u.name`,
		[workspaceId],
	);
	return rows.map((r) => ({
		vendedorId: r.vendedor_id,
		memberUserId: r.member_user_id,
		memberEmail: r.email,
		memberName: r.name,
		almacenId: r.almacen_id,
		role: r.role,
		createdAt: r.created_at,
	}));
};

/** Miembro activo o invitación pendiente del workspace. */
const esMiembroDelWorkspace = async (workspaceId: string, userId: string): Promise<boolean> => {
	const { rows } = await pool.query(
		`SELECT 1 FROM cont_workspaces WHERE id = $1 AND owner_id = $2
		 UNION
		 SELECT 1 FROM resource_access
		 WHERE resource_type = 'workspace' AND resource_id = $1 AND user_id = $2
		 UNION
		 SELECT 1 FROM invitations
		 WHERE resource_type = 'workspace' AND resource_id = $1
		   AND receiver_id = $2 AND status = 'pending'`,
		[workspaceId, userId],
	);
	return rows.length > 0;
};

/**
 * Vincula el vendedor local (UUID generado por el dispositivo) con un miembro
 * del workspace. Al vincular fija el rol 'vendedor' del miembro — idempotente,
 * no baja el rol si el miembro ya era admin/member. Un miembro solo puede tener
 * un vendedor; si ya estaba vinculado a otro, se reasigna.
 */
export const linkWorkspaceVendedor = async (
	workspaceId: string,
	vendedorId: string,
	memberUserId: string,
	almacenId?: string | null,
): Promise<void> => {
	if (!(await esMiembroDelWorkspace(workspaceId, memberUserId))) {
		const err = new Error("El miembro no pertenece a este espacio") as Error & { statusCode?: number };
		err.statusCode = 404;
		throw err;
	}

	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		// Un miembro -> un solo vendedor vinculado.
		await client.query(
			`DELETE FROM cont_workspace_vendedor_links
			 WHERE workspace_id = $1 AND member_user_id = $3 AND vendedor_id <> $2`,
			[workspaceId, vendedorId, memberUserId],
		);
		await client.query(
			`INSERT INTO cont_workspace_vendedor_links (workspace_id, vendedor_id, member_user_id, almacen_id)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (workspace_id, vendedor_id)
			 DO UPDATE SET member_user_id = EXCLUDED.member_user_id,
			               almacen_id = COALESCE(EXCLUDED.almacen_id, cont_workspace_vendedor_links.almacen_id)`,
			[workspaceId, vendedorId, memberUserId, almacenId ?? null],
		);
		// Rol 'vendedor': activo como miembro o vía invitación pendiente.
		await client.query(
			`UPDATE resource_access
			 SET role = 'vendedor'
			 WHERE resource_type = 'workspace' AND resource_id = $1 AND user_id = $2`,
			[workspaceId, memberUserId],
		);
		await client.query(
			`UPDATE invitations
			 SET role = 'vendedor'
			 WHERE resource_type = 'workspace' AND resource_id = $1
			   AND receiver_id = $2 AND status = 'pending'`,
			[workspaceId, memberUserId],
		);
		await client.query("COMMIT");
	} catch (error) {
		try { await client.query("ROLLBACK"); } catch { /* ya en rollback */ }
		throw error;
	} finally {
		client.release();
	}
};

export const unlinkWorkspaceVendedor = async (
	workspaceId: string,
	vendedorId: string,
): Promise<void> => {
	await pool.query(
		`DELETE FROM cont_workspace_vendedor_links
		 WHERE workspace_id = $1 AND vendedor_id = $2`,
		[workspaceId, vendedorId],
	);
};
