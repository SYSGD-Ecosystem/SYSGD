// src/routes/members.ts
import express, { type Request, type Response } from "express";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData } from "../controllers/users";
import { InvitationController } from "../controllers/invitationControler";
const router = express.Router();

router.get("/status", (_req, res) => {
	res.json({ status: "ok", message: "status members ok" });
});

// GET /api/projects/:projectId/members
router.get("/:projectId", isAuthenticated, async (req, res) => {
	const { projectId } = req.params;
	try {
		// Obtener miembros activos (ya aceptados)
		const membersResult = await pool.query(
			`SELECT u.id, u.name, u.email, ra.role, 'active' as status
       FROM resource_access ra
       JOIN users u ON ra.user_id = u.id
       WHERE ra.resource_type = 'project' AND ra.resource_id = $1`,
			[projectId],
		);

		// Obtener invitaciones pendientes con receiver_id válido
		const invitationsResult = await pool.query(
			`SELECT i.id, i.receiver_id, i.receiver_email, i.role, i.created_at, 'invited' as status,
				us.name as sender_name, us.email as sender_email
       FROM invitations i
       LEFT JOIN users us ON i.sender_id = us.id
       WHERE i.resource_type = 'project' AND i.resource_id = $1 AND i.status = 'pending' AND i.receiver_id IS NOT NULL`,
			[projectId],
		);

		// Combinar ambos resultados
		const combinedResults = [
			...membersResult.rows.map(member => ({
				id: member.id,
				name: member.name,
				email: member.email,
				role: member.role,
				status: member.status,
				tareasAsignadas: 0,
				tareasCompletadas: 0
			})),
			...invitationsResult.rows.map(invitation => ({
				id: invitation.receiver_id,
				name: invitation.receiver_email,
				email: invitation.receiver_email,
				role: invitation.role,
				status: invitation.status,
				sender_name: invitation.sender_name,
				sender_email: invitation.sender_email,
				created_at: invitation.created_at,
				tareasAsignadas: 0,
				tareasCompletadas: 0
			}))
		];

		res.json(combinedResults);
	} catch (error) {
		console.error("Error fetching project members:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// POST /api/projects/:projectId/invite
router.post("/invite/:projectId", isAuthenticated, async (req, res) => {
	const { projectId } = req.params;
	const { email, role } = req.body;
	const user = getCurrentUserData(req);
	const senderId = user?.id;

	try {
		// Verificar si el usuario ya existe
		const userResult = await pool.query(
			"SELECT id, status FROM users WHERE email = $1",
			[email],
		);
		
		let receiverId = userResult.rows[0]?.id || null;
		let userExists = !!receiverId;
		
		// Si el usuario no existe, crearlo primero
		if (!userExists) {
			const newUserResult = await pool.query(
				`INSERT INTO users (email, status, privileges) 
				 VALUES ($1, 'invited', 'user') 
				 RETURNING id`,
				[email]
			);
			receiverId = newUserResult.rows[0].id;
		}

		// Ahora crear la invitación con el receiver_id válido
		await pool.query(
			`INSERT INTO invitations (id, sender_id, receiver_id, receiver_email, resource_type, resource_id, role)
       VALUES (gen_random_uuid(), $1, $2, $3, 'project', $4, $5)`,
			[senderId, receiverId, email, projectId, role || "member"],
		);

		// CAMBIO IMPORTANTE: Llamar al controlador SIN enviar respuesta todavía
		// El controlador ahora manejará la respuesta
		await InvitationController.sendProjectInvitation(req, res);
		
		// NO enviamos respuesta aquí porque InvitationController.sendProjectInvitation ya lo hace
		
	} catch (error) {
		console.error("Error creando la invitación:", error);
		// Solo enviar respuesta de error si no se ha enviado ya
		if (!res.headersSent) {
			res.status(500).json({ error: "Error al invitar al usuario" });
		}
	}
});

// POST /api/invitations/:invitationId/accept
router.post(
	"/accept-invite/:invitationId",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { invitationId } = req.params;
		const user = getCurrentUserData(req);
		const userId = user?.id;

		try {
			const result = await pool.query(
				`UPDATE invitations
       SET status = 'accepted', receiver_id = $1
       WHERE id = $2 AND (receiver_id IS NULL OR receiver_id = $1)
       RETURNING resource_type, resource_id, role`,
				[userId, invitationId],
			);

			const invitation = result.rows[0];

			if (!invitation) {
				res.status(404).json({ error: "Invitación no válida o ya aceptada" });
				return;
			}

			// Si el usuario estaba en estado 'invited', actualizarlo a 'active'
			await pool.query(
				`UPDATE users 
				 SET status = 'active' 
				 WHERE id = $1 AND status = 'invited'`,
				[userId]
			);

			await pool.query(
				`INSERT INTO resource_access (user_id, resource_type, resource_id, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, resource_type, resource_id) DO NOTHING`,
				[
					userId,
					invitation.resource_type,
					invitation.resource_id,
					invitation.role,
				],
			);

			res.json({ 
				message: "Invitación aceptada",
				userStatus: 'active'
			});
			return;
		} catch (error) {
			console.error("Error aceptando la invitación:", error);
			res.status(500).json({ error: "Error interno" });
			return;
		}
	},
);

export default router;