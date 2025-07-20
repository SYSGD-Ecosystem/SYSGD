import { Router, type Request, type Response } from "express";
import { pool } from "../index";
import { isAuthenticated } from "../middlewares/auth";

const router = Router();

router.get(
	"/:project_id",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { project_id } = req.params;

		if (!project_id) {
			res.status(400).json({ error: "Missing project_id" });
			return;
		}

		try {
			const query = `
            SELECT
                t.*,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'username', u.username))
                        FROM task_assignees ta
                        JOIN users u ON ta.user_id = u.id
                        WHERE ta.task_id = t.id
                    ),
                    '[]'::json
                ) AS assignees
            FROM tasks t
            WHERE t.project_id = $1
            ORDER BY t.project_task_number ASC;
        `;

			const result = await pool.query(query, [project_id]);
			res.status(200).json(result.rows);
		} catch (err) {
			console.error("Error getting tasks:", err);
			res.status(500).json({ error: "Error getting tasks" });
		}
	},
);

// crea tareas
router.post("/", isAuthenticated, async (req: Request, res: Response) => {
	const {
		title,
		project_id,
		description,
		priority,
		type,
		assignees = [],
		status,
	} = req.body;
	console.log(req.body);
	const created_by = req.session.user?.id;

	if (!title || !project_id || !created_by) {
		res.status(400).json({ error: "Missing required fields" });
		return;
	}

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		// Obtener el siguiente número de tarea dentro del proyecto
		const nextNumberResult = await client.query(
			`SELECT COALESCE(MAX(project_task_number), 0) + 1 AS next_number
       FROM tasks
       WHERE project_id = $1`,
			[project_id],
		);

		const nextTaskNumber = nextNumberResult.rows[0].next_number;

		// Insertar la tarea con el número asignado
		const insertTaskQuery = `
      INSERT INTO tasks (title, project_id, description, priority, type, created_by, status, project_task_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

		const taskResult = await client.query(insertTaskQuery, [
			title,
			project_id,
			description,
			priority,
			type,
			created_by,
			status || "active",
			nextTaskNumber,
		]);

		const newTask = taskResult.rows[0];

		// Asignar usuarios (si los hay)
		for (const userId of assignees) {
			await client.query(
				"INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)",
				[newTask.id, userId],
			);
		}

		await client.query("COMMIT");

		res.status(201).json(newTask);
	} catch (err) {
		await client.query("ROLLBACK");
		console.error("Error creating task:", err);
		res.status(500).json({ error: "Error creating task" });
	} finally {
		client.release();
	}
});

// optiene las tareas de un proyecto
// router.get("/:project_id", isAuthenticated, async (req: Request, res: Response) => {

//   const { project_id } = req.params;

//   if (!project_id) {
//     res.status(400).json({ error: "Missing project_id" });
//     return;
//   }

//   try {
//     const result = await pool.query(
//       "SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at",
//       [project_id]
//     );

//     res.status(200).json(result.rows);
//   } catch (err) {
//     console.error("Error getting tasks:", err);
//     res.status(500).json({ error: "Error getting tasks" });
//   }
// });

// --- NUEVO: MODIFICAR UNA TAREA ---
router.put("/:taskId", isAuthenticated, async (req: Request, res: Response) => {
	const { taskId } = req.params;
	const {
		title,
		description,
		priority,
		type,
		status,
		assignees = [],
	} = req.body;

	if (!title) {
		res.status(400).json({ error: "El título es obligatorio" });
		return;
	}

	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		// 1. Actualizar los datos principales de la tarea
		const updateTaskQuery = `
            UPDATE tasks
            SET title = $1, description = $2, priority = $3, type = $4, status = $5
            WHERE id = $6
            RETURNING *;
        `;
		const updatedTaskResult = await client.query(updateTaskQuery, [
			title,
			description,
			priority,
			type,
			status,
			taskId,
		]);

		if (updatedTaskResult.rowCount === 0) {
			await client.query("ROLLBACK");
			res.status(404).json({ error: "Tarea no encontrada" });
			return;
		}

		// 2. Actualizar los asignados: eliminamos los antiguos y añadimos los nuevos
		await client.query("DELETE FROM task_assignees WHERE task_id = $1", [
			taskId,
		]);

		for (const userId of assignees) {
			await client.query(
				"INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)",
				[taskId, userId.id],
			);
		}

		await client.query("COMMIT");

		// Devolvemos la tarea actualizada (podríamos volver a consultarla para tener los 'assignees' pero por ahora esto es suficiente)
		res.status(200).json(updatedTaskResult.rows[0]);
	} catch (err) {
		await client.query("ROLLBACK");
		console.error("Error updating task:", err);
		res.status(500).json({ error: "Error al actualizar la tarea" });
	} finally {
		client.release();
	}
});

// --- ELIMINAR UNA TAREA ---
router.delete(
	"/:taskId",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { taskId } = req.params;
		// TODO: Aqui no hay nada que verifique si el usuario tiene permiso de eliminar el recurso seleccionado
		// Alto riego de hack por acceso lateral
		// Implementar una tabla de asignacion de recuros para los usuarios, solo usuarios con acceso a este recurso pueden eliminarlo o modificarlo.

		try {
			// Gracias a "ON DELETE CASCADE" en la tabla task_assignees,
			// al eliminar una tarea, sus asignaciones también se eliminarán automáticamente.
			const result = await pool.query("DELETE FROM tasks WHERE id = $1", [
				taskId,
			]);

			if (result.rowCount === 0) {
				res.status(404).json({ error: "Tarea no encontrada" });
				return;
			}

			res.status(200).json({ message: "Tarea eliminada correctamente" });
		} catch (err) {
			console.error("Error deleting task:", err);
			res.status(500).json({ error: "Error al eliminar la tarea" });
		}
	},
);

export default router;
