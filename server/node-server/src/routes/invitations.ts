// routes/invitations.ts
import { Router, type Request, type Response } from "express";
import { pool } from "../index";
import { isAuthenticated } from "../middlewares/auth";

const router = Router();

// Enviar invitación
router.post("/", isAuthenticated, async (req: Request, res: Response) => {
	const { email, resource_id, resource_type, role } = req.body;
	const from_user_id = req.session.user?.id;

	try {
		const userResult = await pool.query(
			"SELECT id FROM users WHERE username = $1",
			[email],
		);
		if (userResult.rows.length === 0) {
			res.status(404).json({ error: "Usuario no encontrado" });
			return;
		}

		const to_user_id = userResult.rows[0].id;

		const existing = await pool.query(
			"SELECT * FROM invitations WHERE to_user_id = $1 AND resource_id = $2 AND resource_type = $3",
			[to_user_id, resource_id, resource_type],
		);
		if (existing.rows.length > 0) {
			res.status(400).json({ error: "Invitación ya enviada" });
			return;
		}

		const insert = await pool.query(
			`INSERT INTO invitations (from_user_id, to_user_id, resource_id, resource_type, role, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
			[from_user_id, to_user_id, resource_id, resource_type, role],
		);

		res.status(201).json(insert.rows[0]);
	} catch (err) {
		console.error("Error enviando invitación:", err);
		res.status(500).json({ error: "Error del servidor" });
	}
});

// Ver invitaciones recibidas
router.get("/", isAuthenticated, async (req: Request, res: Response) => {
	const user_id = req.session.user?.id;
	try {
		const result = await pool.query(
			`SELECT invitations.*, users.name AS from_name FROM invitations
       JOIN users ON users.id = invitations.from_user_id
       WHERE to_user_id = $1`,
			[user_id],
		);
		res.json(result.rows);
	} catch (err) {
		res.status(500).json({ error: "Error obteniendo invitaciones" });
	}
});

// Responder a invitación
router.post(
	"/:id/respond",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const { response } = req.body;
		const user_id = req.session.user?.id;

		if (!["accepted", "rejected"].includes(response)) {
			res.status(400).json({ error: "Respuesta inválida" });
			return;
		}

		try {
			const invite = await pool.query(
				"SELECT * FROM invitations WHERE id = $1 AND to_user_id = $2",
				[id, user_id],
			);
			if (invite.rows.length === 0) {
				res.status(404).json({ error: "Invitación no encontrada" });
				return;
			}

			await pool.query("UPDATE invitations SET status = $1 WHERE id = $2", [
				response,
				id,
			]);

			if (response === "accepted") {
				await pool.query(
					`INSERT INTO access (user_id, resource_id, resource_type, role)
         VALUES ($1, $2, $3, $4)`,
					[
						user_id,
						invite.rows[0].resource_id,
						invite.rows[0].resource_type,
						invite.rows[0].role,
					],
				);
			}

			res.json({ message: "Respuesta guardada" });
		} catch (err) {
			res.status(500).json({ error: "Error procesando invitación" });
		}
	},
);

export default router;
