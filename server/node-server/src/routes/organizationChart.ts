import { Router } from "express";
import { pool } from "../index";
import { isAuthenticated } from "../middlewares/auth";

const router = Router();

// All routes require auth
router.use(isAuthenticated);

// GET /api/organization?id=FILEID
router.get("/", async (req, res) => {
	const { id } = req.query;
	if (!id) {
		res.status(400).json({ error: "Falta id" });
		return;
	}
	try {
		const { rows } = await pool.query(
			"SELECT data FROM organization_chart WHERE file_id = $1",
			[id],
		);
		if (rows.length === 0) {
			res.json(null);
			return;
		}
		res.json(rows[0].data);
	} catch {
		res.status(500).json({ error: "Error al obtener organigrama" });
	}
});

// POST /api/organization {id,data}
router.post("/", async (req, res) => {
	const { id, data } = req.body;
	if (!id || !data) {
		res.status(400).json({ error: "Faltan datos" });
		return;
	}

	const userId = req.session.user?.id;
	try {
		const owner = await pool.query(
			"SELECT user_id FROM document_management_file WHERE id = $1",
			[id],
		);
		if (owner.rows.length === 0) {
			res.status(404).json({ error: "Archivo no encontrado" });
			return;
		}

		if (
			owner.rows[0].user_id !== userId &&
			req.session.user?.privileges !== "admin"
		) {
			res.status(403).json({ error: "Sin permisos" });
			return;
		}

		await pool.query(
			"INSERT INTO organization_chart(file_id,data) VALUES ($1,$2) ON CONFLICT (file_id) DO UPDATE SET data = EXCLUDED.data",
			[id, data],
		);
		res.status(201).send("201");
	} catch {
		res.status(500).json({ error: "Error al guardar" });
	}
});

export default router;
