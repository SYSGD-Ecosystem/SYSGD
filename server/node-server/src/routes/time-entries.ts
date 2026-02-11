import { Router, type Request, type Response } from "express";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData } from "../controllers/users";

const router = Router();

const secondsBetween = (start: Date, end: Date) => {
	const diffMs = end.getTime() - start.getTime();
	return Math.max(0, Math.floor(diffMs / 1000));
};

router.post("/start", isAuthenticated, async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	const { project_id, task_id, description } = req.body as {
		project_id?: string | null;
		task_id?: string | null;
		description?: string | null;
	};

	try {
		const running = await pool.query(
			"SELECT id FROM time_entries WHERE user_id = $1 AND status = 'running' LIMIT 1",
			[user.id],
		);

		if (running.rows.length > 0) {
			res.status(409).json({
				error: "Ya existe un cronómetro en ejecución",
				active_entry_id: running.rows[0].id,
			});
			return;
		}

		let resolvedProjectId = project_id ?? null;

		if (task_id) {
			const taskResult = await pool.query(
				"SELECT project_id FROM tasks WHERE id = $1",
				[task_id],
			);

			if (taskResult.rows.length === 0) {
				res.status(404).json({ error: "Tarea no encontrada" });
				return;
			}

			const taskProjectId = taskResult.rows[0].project_id as string;

			if (resolvedProjectId && resolvedProjectId !== taskProjectId) {
				res.status(400).json({
					error: "El proyecto no coincide con la tarea seleccionada",
				});
				return;
			}

			resolvedProjectId = taskProjectId;
		}

		const now = new Date();

		const result = await pool.query(
			`INSERT INTO time_entries (user_id, project_id, task_id, start_time, status, description, duration_seconds, last_started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
			[
				user.id,
				resolvedProjectId,
				task_id ?? null,
				now,
				"running",
				description ?? null,
				0,
				now,
			],
		);

		res.status(201).json(result.rows[0]);
	} catch (error) {
		console.error("Error al iniciar registro de tiempo:", error);
		res.status(500).json({ error: "Error al iniciar registro de tiempo" });
	}
});

router.put("/:id/pause", isAuthenticated, async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	const { id } = req.params;

	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	try {
		const entryResult = await pool.query(
			"SELECT * FROM time_entries WHERE id = $1 AND user_id = $2",
			[id, user.id],
		);

		if (entryResult.rows.length === 0) {
			res.status(404).json({ error: "Registro no encontrado" });
			return;
		}

		const entry = entryResult.rows[0];

		if (entry.status !== "running") {
			res.status(400).json({ error: "El cronómetro no está en ejecución" });
			return;
		}

		const now = new Date();
		const lastStartedAt = new Date(entry.last_started_at || entry.start_time);
		const additionalSeconds = secondsBetween(lastStartedAt, now);
		const durationSeconds = (entry.duration_seconds || 0) + additionalSeconds;

		const updateResult = await pool.query(
			`UPDATE time_entries
       SET status = 'paused',
           duration_seconds = $1,
           last_started_at = NULL,
           updated_at = $2
       WHERE id = $3
       RETURNING *`,
			[durationSeconds, now, id],
		);

		res.json(updateResult.rows[0]);
	} catch (error) {
		console.error("Error al pausar registro de tiempo:", error);
		res.status(500).json({ error: "Error al pausar registro de tiempo" });
	}
});

router.put(
	"/:id/resume",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const user = getCurrentUserData(req);
		const { id } = req.params;

		if (!user?.id) {
			res.status(401).json({ error: "Usuario no autenticado" });
			return;
		}

		try {
			const entryResult = await pool.query(
				"SELECT * FROM time_entries WHERE id = $1 AND user_id = $2",
				[id, user.id],
			);

			if (entryResult.rows.length === 0) {
				res.status(404).json({ error: "Registro no encontrado" });
				return;
			}

			const entry = entryResult.rows[0];

			if (entry.status !== "paused") {
				res.status(400).json({ error: "El cronómetro no está pausado" });
				return;
			}

			const running = await pool.query(
				"SELECT id FROM time_entries WHERE user_id = $1 AND status = 'running' AND id <> $2 LIMIT 1",
				[user.id, id],
			);

			if (running.rows.length > 0) {
				res.status(409).json({
					error: "Ya existe un cronómetro en ejecución",
					active_entry_id: running.rows[0].id,
				});
				return;
			}

			const now = new Date();
			const updateResult = await pool.query(
				`UPDATE time_entries
       SET status = 'running',
           last_started_at = $1,
           updated_at = $1
       WHERE id = $2
       RETURNING *`,
				[now, id],
			);

			res.json(updateResult.rows[0]);
		} catch (error) {
			console.error("Error al reanudar registro de tiempo:", error);
			res.status(500).json({ error: "Error al reanudar registro de tiempo" });
		}
	},
);

router.put(
	"/:id/stop",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const user = getCurrentUserData(req);
		const { id } = req.params;

		if (!user?.id) {
			res.status(401).json({ error: "Usuario no autenticado" });
			return;
		}

		try {
			const entryResult = await pool.query(
				"SELECT * FROM time_entries WHERE id = $1 AND user_id = $2",
				[id, user.id],
			);

			if (entryResult.rows.length === 0) {
				res.status(404).json({ error: "Registro no encontrado" });
				return;
			}

			const entry = entryResult.rows[0];

			if (entry.status === "completed") {
				res.status(400).json({ error: "El cronómetro ya está finalizado" });
				return;
			}

			const now = new Date();
			const lastStartedAt = new Date(entry.last_started_at || entry.start_time);
			const additionalSeconds =
				entry.status === "running" ? secondsBetween(lastStartedAt, now) : 0;
			const durationSeconds =
				(entry.duration_seconds || 0) + additionalSeconds;

			const updateResult = await pool.query(
				`UPDATE time_entries
       SET status = 'completed',
           duration_seconds = $1,
           end_time = $2,
           last_started_at = NULL,
           updated_at = $2
       WHERE id = $3
       RETURNING *`,
				[durationSeconds, now, id],
			);

			res.json(updateResult.rows[0]);
		} catch (error) {
			console.error("Error al finalizar registro de tiempo:", error);
			res.status(500).json({ error: "Error al finalizar registro de tiempo" });
		}
	},
);

router.get("/", isAuthenticated, async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);

	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	const { project_id, task_id, status, active } = req.query as {
		project_id?: string;
		task_id?: string;
		status?: string;
		active?: string;
	};

	try {
		const conditions = ["te.user_id = $1"];
		const values: Array<string> = [user.id];

		if (project_id) {
			values.push(project_id);
			conditions.push(`te.project_id = $${values.length}`);
		}

		if (task_id) {
			values.push(task_id);
			conditions.push(`te.task_id = $${values.length}`);
		}

		if (status) {
			values.push(status);
			conditions.push(`te.status = $${values.length}`);
		}

		if (active === "true") {
			conditions.push("te.status IN ('running', 'paused')");
		}

		const query = `
      SELECT
        te.*,
        p.name AS project_name,
        t.title AS task_title,
        t.project_task_number AS task_number
      FROM time_entries te
      LEFT JOIN projects p ON te.project_id = p.id
      LEFT JOIN tasks t ON te.task_id = t.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY te.start_time DESC
    `;

		const result = await pool.query(query, values);
		res.json(result.rows);
	} catch (error) {
		console.error("Error al obtener registros de tiempo:", error);
		res.status(500).json({ error: "Error al obtener registros de tiempo" });
	}
});

export default router;
