import { Router, type Request, type Response } from "express";
import { pool } from "../index";
import { isAuthenticated } from "../middlewares/auth";

const router = Router();

// Crear nuevo proyecto
router.post("/", isAuthenticated, async (req: Request, res: Response) => {
	const { name, description, visibility } = req.body;
	const created_by = req.session.user?.id;

	if (!name || !description) {
        res.status(400).json({ error: "Faltan campos obligatorios" });
		return;
	}

	try {
		const result = await pool.query(
			`INSERT INTO projects (name, description, created_by, visibility)
       VALUES ($1, $2, $3, $4) RETURNING *`,
			[name, description, created_by, visibility || "privado"]
		);
		res.status(201).json(result.rows[0]);
	} catch (err) {
		console.error("Error al crear proyecto:", err);
		res.status(500).json({ error: "Error al crear proyecto" });
	}
});

// Obtener todos los proyectos del usuario autenticado
router.get("/", isAuthenticated, async (req: Request, res: Response) => {
	const user_id = req.session.user?.id;
	const isAdmin = req.session.user?.privileges === "admin";

	try {
		// biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
		let result;
		if (isAdmin) {
			result = await pool.query("SELECT * FROM projects");
		} else {
			result = await pool.query(
				"SELECT * FROM projects WHERE created_by = $1",
				[user_id]
			);
		}
		res.json(result.rows);
	} catch (err) {
		console.error("Error al obtener proyectos:", err);
		res.status(500).json({ error: "Error al obtener proyectos" });
	}
});

// Obtener proyecto individual
router.get("/:id", isAuthenticated, async (req: Request, res: Response) => {
	const { id } = req.params;
	const user_id = req.session.user?.id;

	try {
		const result = await pool.query(
			"SELECT * FROM projects WHERE id = $1 AND created_by = $2",
			[id, user_id]
		);
		if (result.rows.length === 0) {
            res.status(404).json({ error: "Proyecto no encontrado" });
			return;
		}
		res.json(result.rows[0]);
	} catch (err) {
		console.error("Error al obtener proyecto:", err);
		res.status(500).json({ error: "Error al obtener proyecto" });
	}
});

export default router;
