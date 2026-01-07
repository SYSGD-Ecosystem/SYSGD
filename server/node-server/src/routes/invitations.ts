// src/routes/invitations.ts
import { Router, type Request, type Response } from "express";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData } from "../controllers/users";

const router = Router();

// Ver invitaciones recibidas (requiere autenticación)
router.get("/", isAuthenticated, async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	const user_id = user?.id;
	try {
		const result = await pool.query(
			`SELECT i.id, i.resource_id, i.resource_type, i.role, i.receiver_email,
                i.created_at, u.name as sender_name, u.email as sender_email,
                p.name as project_name
         FROM invitations i
         JOIN users u ON i.sender_id = u.id
         LEFT JOIN projects p ON i.resource_id = p.id AND i.resource_type = 'project'
         WHERE i.receiver_id = $1 AND i.status = 'pending'`,
			[user_id],
		);
		res.json(result.rows);
	} catch (err) {
		console.log(err);
		res.status(500).json({ error: "Error obteniendo invitaciones" });
	}
});

// Verificar token de invitación (sin autenticación)
// Esto es para que el frontend verifique si el token es válido antes de pedir login/registro
router.get("/verify-token", async (req: Request, res: Response) => {
	const { token } = req.query;

	if (!token || typeof token !== 'string') {
		res.status(400).json({ error: 'Token requerido', valid: false });
		return;
	}

	try {
		// Buscar token
		const { rows: tokenRows } = await pool.query(
			`SELECT id, user_id, expires_at, used 
			 FROM email_verification_tokens 
			 WHERE token = $1 AND type = 'invitation'`,
			[token]
		);

		if (tokenRows.length === 0) {
			res.json({ valid: false, error: 'Token inválido' });
			return;
		}

		const tokenData = tokenRows[0];

		if (tokenData.used) {
			res.json({ valid: false, error: 'Esta invitación ya fue usada' });
			return;
		}

		if (new Date(tokenData.expires_at) < new Date()) {
			res.json({ valid: false, error: 'La invitación ha expirado' });
			return;
		}

		// Buscar invitación
		const { rows: invitationRows } = await pool.query(
			`SELECT i.id, i.receiver_email, i.resource_type, i.resource_id, i.role,
			        p.name as project_name, u.name as sender_name
			 FROM invitations i
			 LEFT JOIN projects p ON i.resource_id = p.id AND i.resource_type = 'project'
			 LEFT JOIN users u ON i.sender_id = u.id
			 WHERE i.receiver_id = $1 AND i.status = 'pending'
			 ORDER BY i.created_at DESC
			 LIMIT 1`,
			[tokenData.user_id]
		);

		if (invitationRows.length === 0) {
			res.json({ valid: false, error: 'Invitación no encontrada' });
			return;
		}

		const invitation = invitationRows[0];

		res.json({
			valid: true,
			invitation: {
				email: invitation.receiver_email,
				projectName: invitation.project_name,
				senderName: invitation.sender_name,
				resourceType: invitation.resource_type,
				resourceId: invitation.resource_id
			}
		});
	} catch (error) {
		console.error('Error verifying token:', error);
		res.status(500).json({ valid: false, error: 'Error al verificar token' });
	}
});

// Aceptar invitación (requiere autenticación)
router.post(
	"/accept",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const user = getCurrentUserData(req);
		const userId = user?.id;
		const { token } = req.body;

		if (!userId || !token) {
			res.status(400).json({ error: 'Token requerido' });
			return;
		}

		try {
			await pool.query('BEGIN');

			// Buscar token
			const { rows: tokenRows } = await pool.query(
				`SELECT id, user_id, expires_at, used 
				 FROM email_verification_tokens 
				 WHERE token = $1 AND type = 'invitation'`,
				[token]
			);

			if (tokenRows.length === 0) {
				await pool.query('ROLLBACK');
				res.status(400).json({ error: 'Token inválido' });
				return;
			}

			const tokenData = tokenRows[0];

			if (tokenData.used) {
				await pool.query('ROLLBACK');
				res.status(400).json({ error: 'Esta invitación ya fue usada' });
				return;
			}

			if (new Date(tokenData.expires_at) < new Date()) {
				await pool.query('ROLLBACK');
				res.status(400).json({ error: 'La invitación ha expirado' });
				return;
			}

			// Buscar invitación pendiente
			const { rows: invitationRows } = await pool.query(
				`SELECT id, resource_type, resource_id, role, receiver_email
				 FROM invitations
				 WHERE receiver_id = $1 AND status = 'pending'
				 ORDER BY created_at DESC
				 LIMIT 1`,
				[tokenData.user_id]
			);

			if (invitationRows.length === 0) {
				await pool.query('ROLLBACK');
				res.status(404).json({ error: 'Invitación no encontrada' });
				return;
			}

			const invitation = invitationRows[0];

			// Verificar que el usuario actual es el destinatario
			const { rows: userRows } = await pool.query(
				'SELECT email FROM users WHERE id = $1',
				[userId]
			);

			if (userRows.length === 0 || userRows[0].email !== invitation.receiver_email) {
				await pool.query('ROLLBACK');
				res.status(403).json({ error: 'Esta invitación no es para ti' });
				return;
			}

			// Marcar invitación como aceptada
			await pool.query(
				`UPDATE invitations 
				 SET status = 'accepted', receiver_id = $1
				 WHERE id = $2`,
				[userId, invitation.id]
			);

			// Agregar acceso al recurso
			await pool.query(
				`INSERT INTO resource_access (user_id, resource_type, resource_id, role)
				 VALUES ($1, $2, $3, $4)
				 ON CONFLICT (user_id, resource_type, resource_id) 
				 DO UPDATE SET role = $4`,
				[userId, invitation.resource_type, invitation.resource_id, invitation.role]
			);

			// Marcar token como usado
			await pool.query(
				`UPDATE email_verification_tokens 
				 SET used = true, used_at = NOW()
				 WHERE id = $1`,
				[tokenData.id]
			);

			// Si el usuario estaba en estado 'invited', actualizarlo a 'active'
			await pool.query(
				`UPDATE users 
				 SET status = 'active' 
				 WHERE id = $1 AND status = 'invited'`,
				[userId]
			);

			await pool.query('COMMIT');

			res.json({
				message: 'Invitación aceptada correctamente',
				resourceType: invitation.resource_type,
				resourceId: invitation.resource_id
			});
		} catch (error) {
			await pool.query('ROLLBACK');
			console.error('Error accepting invitation:', error);
			res.status(500).json({ error: 'Error al aceptar invitación' });
		}
	}
);

export default router;