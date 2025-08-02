import { Router, type Request, type Response } from "express";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData } from "../controllers/users";

const router = Router();

router.post("/:projectId", isAuthenticated, async (req, res) => {
	const { projectId } = req.params;
	const { title, description, category, priority, implementability, impact } =
		req.body;
		const user = getCurrentUserData(req)
	const userId = user?.id;

	if (
		!title ||
		!projectId ||
		!description ||
		!category ||
		!priority ||
		!implementability ||
		!impact
	) {
		res.status(400).json({ error: "Missing required fields" });
		return;
	}

	const numberRes = await pool.query(
		"SELECT COALESCE(MAX(idea_number), 0) + 1 AS next FROM ideas WHERE project_id = $1",
		[projectId],
	);
	const ideaNumber = numberRes.rows[0].next;

	const result = await pool.query(
		`
    INSERT INTO ideas (
      title, description, category, priority, implementability, impact,
      project_id, user_id, idea_number
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `,
		[
			title,
			description,
			category,
			priority,
			implementability,
			impact,
			projectId,
			userId,
			ideaNumber,
		],
	);

	res.status(201).json(result.rows[0]);
});

router.get("/:projectId", isAuthenticated, async (req, res) => {
	const { projectId } = req.params;
	const result = await pool.query(
		`
		SELECT
			ideas.*,
			users.name AS user_name
		FROM ideas
		LEFT JOIN users ON ideas.user_id = users.id
		WHERE ideas.project_id = $1
		ORDER BY ideas.created_at DESC
		`,
		[projectId],
	);
	res.json(result.rows);
});

// --- MODIFICAR ---
router.put("/:ideaId", isAuthenticated, async (req: Request, res: Response) => {
	const { ideaId } = req.params;
	const { title, description, category, priority, implementability, impact } =
		req.body;

	if (!title) {
		res.status(400).json({ error: "El título es obligatorio" });
		return;
	}

	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		// 1. Actualizar los datos principales de la tarea
		const updateTaskQuery = `
            UPDATE ideas
            SET title = $1, description = $2, category = $3, priority = $4, implementability = $5, impact = $6
            WHERE id = $7
            RETURNING *;
        `;
		const updatedTaskResult = await client.query(updateTaskQuery, [
			title,
			description,
			category,
			priority,
			implementability,
			impact,
			ideaId,
		]);

		if (updatedTaskResult.rowCount === 0) {
			await client.query("ROLLBACK");
			res.status(404).json({ error: "Tarea no encontrada" });
			return;
		}

		await client.query("COMMIT");

		res.status(200).json(updatedTaskResult.rows[0]);
	} catch (err) {
		await client.query("ROLLBACK");
		console.error("Error updating task:", err);
		res.status(500).json({ error: "Error al actualizar la tarea" });
	} finally {
		client.release();
	}
});

router.delete(
	"/:ideaId",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { ideaId } = req.params;
		// TODO: Aqui no hay nada que verifique si el usuario tiene permiso de eliminar el recurso seleccionado
		// Alto riego de hack por acceso lateral
		// Implementar una tabla de asignacion de recuros para los usuarios, solo usuarios con acceso a este recurso pueden eliminarlo o modificarlo.

		try {
			// Gracias a "ON DELETE CASCADE" en la tabla task_assignees,
			// al eliminar una tarea, sus asignaciones también se eliminarán automáticamente.
			const result = await pool.query("DELETE FROM ideas WHERE id = $1", [
				ideaId,
			]);

			if (result.rowCount === 0) {
				res.status(404).json({ error: "Idea no encontrada" });
				return;
			}

			res.status(200).json({ message: "Idea eliminada correctamente" });
		} catch (err) {
			console.error("Error deleting idea:", err);
			res.status(500).json({ error: "Error al eliminar idea" });
		}
	},
);
export default router;
