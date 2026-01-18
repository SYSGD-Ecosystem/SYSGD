import { Router, type Request, type Response } from "express";

import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { isAdmin } from "../middlewares/auth";
import { getCurrentUserData } from "../controllers/users";

const router = Router();

type UpdateCategory =
	| "Nueva Funcionalidad"
	| "Mejora"
	| "Anuncio"
	| "Documentación"
	| "Seguridad";

function normalizeCategory(category: unknown): UpdateCategory | null {
	if (typeof category !== "string") return null;
	const allowed: UpdateCategory[] = [
		"Nueva Funcionalidad",
		"Mejora",
		"Anuncio",
		"Documentación",
		"Seguridad",
	];
	return (allowed as string[]).includes(category) ? (category as UpdateCategory) : null;
}

function parseDateOnly(value: unknown): string | null {
	if (typeof value !== "string") return null;
	// Expect YYYY-MM-DD
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	return value;
}

// ==========================
// PUBLIC
// ==========================

// GET /api/updates
router.get("/updates", async (_req: Request, res: Response) => {
	try {
		const result = await pool.query(
			`
			SELECT id, title, description, category, publish_date AS date
			FROM updates
			ORDER BY publish_date DESC, created_at DESC
			LIMIT 200
			`,
		);
		res.json(result.rows);
	} catch (err) {
		console.error("Error fetching updates:", err);
		res.status(500).json({ message: "Error al obtener updates" });
	}
});

// GET /api/updates/:id
router.get("/updates/:id", async (req: Request, res: Response) => {
	const { id } = req.params;
	try {
		const result = await pool.query(
			`SELECT id, title, description, category, publish_date AS date FROM updates WHERE id = $1`,
			[id],
		);
		if (result.rows.length === 0) {
			res.status(404).json({ message: "Update no encontrada" });
			return;
		}
		res.json(result.rows[0]);
	} catch (err) {
		console.error("Error fetching update by id:", err);
		res.status(500).json({ message: "Error al obtener update" });
	}
});

// ==========================
// ADMIN ONLY
// ==========================

// POST /api/updates
router.post("/updates", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
	const { title, description, category, date } = req.body;
	const normalizedCategory = normalizeCategory(category);
	const publishDate = parseDateOnly(date);
	const user = getCurrentUserData(req);

	if (!title || typeof title !== "string") {
		res.status(400).json({ message: "title requerido" });
		return;
	}
	if (!description || typeof description !== "string") {
		res.status(400).json({ message: "description requerido" });
		return;
	}
	if (!normalizedCategory) {
		res.status(400).json({ message: "category inválida" });
		return;
	}
	if (!publishDate) {
		res.status(400).json({ message: "date inválida (YYYY-MM-DD)" });
		return;
	}

	try {
		const result = await pool.query(
			`
			INSERT INTO updates (title, description, category, publish_date, created_by)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id, title, description, category, publish_date AS date
			`,
			[title, description, normalizedCategory, publishDate, user?.id || null],
		);
		res.status(201).json(result.rows[0]);
	} catch (err) {
		console.error("Error creating update:", err);
		res.status(500).json({ message: "Error al crear update" });
	}
});

// PUT /api/updates/:id
router.put(
	"/updates/:id",
	isAuthenticated,
	isAdmin,
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const { title, description, category, date } = req.body;

		const fields: string[] = [];
		const values: any[] = [];
		let idx = 1;

		if (title !== undefined) {
			if (typeof title !== "string" || !title.trim()) {
				res.status(400).json({ message: "title inválido" });
				return;
			}
			fields.push(`title = $${idx++}`);
			values.push(title);
		}
		if (description !== undefined) {
			if (typeof description !== "string" || !description.trim()) {
				res.status(400).json({ message: "description inválido" });
				return;
			}
			fields.push(`description = $${idx++}`);
			values.push(description);
		}
		if (category !== undefined) {
			const normalized = normalizeCategory(category);
			if (!normalized) {
				res.status(400).json({ message: "category inválida" });
				return;
			}
			fields.push(`category = $${idx++}`);
			values.push(normalized);
		}
		if (date !== undefined) {
			const publishDate = parseDateOnly(date);
			if (!publishDate) {
				res.status(400).json({ message: "date inválida (YYYY-MM-DD)" });
				return;
			}
			fields.push(`publish_date = $${idx++}`);
			values.push(publishDate);
		}

		if (fields.length === 0) {
			res.status(400).json({ message: "No hay datos para actualizar" });
			return;
		}

		fields.push(`updated_at = NOW()`);
		values.push(id);

		try {
			const result = await pool.query(
				`
				UPDATE updates
				SET ${fields.join(", ")}
				WHERE id = $${idx}
				RETURNING id, title, description, category, publish_date AS date
				`,
				values,
			);

			if (result.rows.length === 0) {
				res.status(404).json({ message: "Update no encontrada" });
				return;
			}

			res.json(result.rows[0]);
		} catch (err) {
			console.error("Error updating update:", err);
			res.status(500).json({ message: "Error al actualizar update" });
		}
	},
);

// DELETE /api/updates/:id
router.delete(
	"/updates/:id",
	isAuthenticated,
	isAdmin,
	async (req: Request, res: Response) => {
		const { id } = req.params;
		try {
			const result = await pool.query("DELETE FROM updates WHERE id = $1", [id]);
			if (result.rowCount === 0) {
				res.status(404).json({ message: "Update no encontrada" });
				return;
			}
			res.sendStatus(204);
		} catch (err) {
			console.error("Error deleting update:", err);
			res.status(500).json({ message: "Error al eliminar update" });
		}
	},
);

export default router;
