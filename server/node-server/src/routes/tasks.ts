import { Router, type Request, type Response } from "express";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData } from "../controllers/users";
import {
	checkAICredits,
	checkTaskLimit,
	consumeAICredits,
} from "../middlewares/usageLimits.middleware";
import { geminiAgent } from "../geminiAgent";
import { openRouterAgent } from "../openRouterAgent";
//import { isAuthenticated } from "../middlewares/authjwt";

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
                        SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email))
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
router.post(
	"/",
	isAuthenticated,
	checkTaskLimit,
	async (req: Request, res: Response) => {
		const {
			title,
			project_id,
			description,
			priority,
			type,
			assignees = [],
			status,
		} = req.body;
		const user = getCurrentUserData(req);
		const created_by = user?.id;

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
					[newTask.id, typeof userId === "object" ? userId.id : userId],
				);
			}

			await client.query("COMMIT");

			const createdTaskResult = await client.query(
				`SELECT
       t.*,
       COALESCE(
         (
           SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email))
           FROM task_assignees ta
           JOIN users u ON ta.user_id = u.id
           WHERE ta.task_id = t.id
         ),
         '[]'::json
       ) AS assignees
     FROM tasks t
     WHERE t.id = $1`,
				[newTask.id],
			);

			res.status(201).json(createdTaskResult.rows[0] ?? newTask);
		} catch (err) {
			await client.query("ROLLBACK");
			console.error("Error creating task:", err);
			res.status(500).json({ error: "Error creating task" });
		} finally {
			client.release();
		}
	},
);

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
			// Validar que userId no sea null o undefined
			if (!userId) {
				console.warn("Skipping null/undefined userId in assignees");
				continue;
			}

			const actualUserId = typeof userId === "object" ? userId.id : userId;

			// Validar que actualUserId no sea null
			if (!actualUserId) {
				console.warn("Skipping null actualUserId");
				continue;
			}

			await client.query(
				"INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)",
				[taskId, actualUserId],
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

router.post("/generate", isAuthenticated, checkAICredits, async (req, res) => {
	console.log("🔄 Nueva petición a Task Agent:", req.body);

	const { prompt, provider, model } = req.body;

	if (!prompt) {
		res.status(400).json({ error: "Falta el prompt" });
		return;
	}

	try {
		// Obtener el token custom si está usando token custom
		const useCustomToken = (req as any).useCustomToken;
		const customToken = (req as any).customToken;

		const systemPrompt = `Eres un asistente inteligente especializado en ayudar a mejorar títulos y descripciones de tareas para equipos de desarrollo de software. Tu objetivo es clarificar, profesionalizar y optimizar la redacción para que sea fácilmente entendible por todos los miembros del equipo.`;

		// Usar el nuevo agente inteligente
		const result =
			provider === "gemini"
				? await geminiAgent({
						prompt,
						image: undefined,
						audio: undefined,
						video: undefined,
						file: undefined,
						model: model || "gemini-2.5-flash",
						customToken: useCustomToken ? customToken : undefined,
						forse_text_response: true,
					})
				: await openRouterAgent({
						prompt,
						model,
						customToken,
						systemPrompt,
						force_text_response: true,
					});

		console.log("✅ Respuesta generada exitosamente");
		

		// Si la operación fue exitosa, consumir créditos
		if (!useCustomToken) {
			await consumeAICredits(req, res, () => {
				res.json({
					...result,
					billing: {
						used_custom_token: false,
						credits_consumed: 1,
					},
				});
			});
		} else {
			res.json({
				...result,
				billing: {
					used_custom_token: true,
					credits_consumed: 0,
				},
			});
		}
	} catch (err) {
		console.error("❌ Error en Task Agent:", err);
		res.status(500).json({
			error: "Error interno del agente",
			details: err instanceof Error ? err.message : "Error desconocido",
		});
	}
});

// router.post("/improve", isAuthenticated, async (req: Request, res: Response) => {
//   const {
//     title,
//     description,
//     projectContext, // opcional: { name: string, description: string }
//     provider = "gemini", // 'gemini' | 'openrouter'
//     model,               // opcional, ej: "xiaomi/mimo-v2-flash:free"
//   } = req.body;

//   if (!title && !description) {
//     return res.status(400).json({ error: "Debe proporcionar título o descripción" });
//   }

//   try {
//     // Construir el prompt que el usuario vería
//     let userPrompt = "";
//     if (projectContext) {
//       userPrompt += `Contexto del Proyecto:\n- Nombre: ${projectContext.name}\n- Descripción: ${projectContext.description}\n\n`;
//     }
//     userPrompt += `Mejora el siguiente título y descripción de una tarea:\n\nTítulo actual: ${title || "(sin título)"}\nDescripción actual: ${description || "(sin descripción)"}`;

//     // Llamar al taskAgent (importa desde donde lo tengas)
//     const result = await taskAgent({
//       prompt: userPrompt,
//       provider,
//       model,
//     });

//     // Intentar parsear el JSON que devuelve el agente especializado
//     let improved;
//     try {
//       improved = JSON.parse(result.respuesta);
//       if (!improved.title || !improved.description) {
//         throw new Error("Faltan campos title/description");
//       }
//     } catch (parseErr) {
//       console.warn("IA no devolvió JSON válido, devolviendo como texto plano");
//       improved = {
//         title: title || "Tarea mejorada",
//         description: result.respuesta,
//       };
//     }

//     res.status(200).json({
//       improvedTitle: improved.title,
//       improvedDescription: improved.description,
//       rawResponse: result.respuesta,
//       metadata: result.metadata,
//     });
//   } catch (err) {
//     console.error("Error mejorando tarea con IA:", err);
//     res.status(500).json({
//       error: "Error al mejorar la tarea con IA",
//       details: err instanceof Error ? err.message : "Error desconocido"
//     });
//   }
// });

export default router;
