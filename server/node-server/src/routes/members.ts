// src/routes/members.ts
import express, { type Request, type Response } from "express";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData } from "../controllers/users";
const router = express.Router();

router.get("/status", (_req, res) => {
	res.json({ status: "ok", message: "status members ok" });
});

// GET /api/projects/:projectId/members
router.get("/:projectId", isAuthenticated, async (req, res) => {
	const { projectId } = req.params;
	try {
		const result = await pool.query(
			`SELECT u.id, u.name, u.username, ra.role
       FROM resource_access ra
       JOIN users u ON ra.user_id = u.id
       WHERE ra.resource_type = 'project' AND ra.resource_id = $1`,
			[projectId],
		);
		res.json(result.rows);
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
		const userResult = await pool.query(
			"SELECT id FROM users WHERE username = $1",
			[email],
		);
		const receiverId = userResult.rows[0]?.id || null;

		await pool.query(
			`INSERT INTO invitations (id, sender_id, receiver_id, receiver_email, resource_type, resource_id, role)
       VALUES (gen_random_uuid(), $1, $2, $3, 'project', $4, $5)`,
			[senderId, receiverId, email, projectId, role || "member"],
		);

		// Aquí puedes llamar a una función para enviar el correo si receiverId es null

		res.json({ message: "Invitación enviada" });
	} catch (error) {
		console.error("Error creando la invitación:", error);
		res.status(500).json({ error: "Error al invitar al usuario" });
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

			res.json({ message: "Invitación aceptada" });
			return;
		} catch (error) {
			console.error("Error aceptando la invitación:", error);
			res.status(500).json({ error: "Error interno" });
			return;
		}
	},
);

export default router;
