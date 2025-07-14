// routes/invitations.ts
import { Router, type Request, type Response } from "express";
import { pool } from "../index";
import { isAuthenticated } from "../middlewares/auth";

const router = Router();


// Ver invitaciones recibidas
router.get("/", isAuthenticated, async (req: Request, res: Response) => {
	const user_id = req.session.user?.id;
	try {
		const result = await pool.query(
			`SELECT i.id, i.resource_id, i.resource_type, i.role, i.receiver_email,
                i.created_at, u.name as sender_name, u.username as sender_email
         FROM invitations i
         JOIN users u ON i.sender_id = u.id
         WHERE i.receiver_id = $1 AND i.status = 'pending'`,
			[user_id],
		);
		res.json(result.rows);
	} catch (err) {
		console.log(err)
		res.status(500).json({ error: "Error obteniendo invitaciones" });
	}
});


export default router;
