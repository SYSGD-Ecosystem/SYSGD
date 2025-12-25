import { Request, Response } from "express";
import { pool } from "../db";

export const getTaskConfig = async (req: Request, res: Response) => {
	try {
		const { projectId } = req.params;

		const result = await pool.query(
			"SELECT task_config FROM projects_config WHERE project_id = $1",
			[projectId],
		);

		if (result.rows.length === 0) {
			res.status(404).json({ error: "Proyecto no encontrado" });
			return;
		}

		res.json(result.rows[0].task_config);
	} catch (error) {
		console.error("Error al obtener configuración de tareas:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

export const updateTaskConfig = async (req: Request, res: Response) => {
	try {
		const { projectId } = req.params;
		const { task_config } = req.body;

		// Validar estructura básica
		if (!task_config.types || !task_config.priorities || !task_config.states) {
			res.status(400).json({
				error: "La configuración debe contener types, priorities, y states",
			});
			return;
		}

		const result = await pool.query(
			"UPDATE projects_config SET task_config = $1 WHERE project_id = $2 RETURNING task_config",
			[JSON.stringify(task_config), projectId],
		);

		if (result.rows.length === 0) {
			res.status(404).json({ error: "Proyecto no encontrado" });
			return;
		}

		res.json(result.rows[0].task_config);
	} catch (error) {
		console.error("Error al actualizar configuración de tareas:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

export const addTaskType = async (req: Request, res: Response) => {
	try {
		const { projectId } = req.params;
		const { name, color } = req.body;

		if (!name || !color) {
			res.status(400).json({ error: "Nombre y color son requeridos" });
			return;
		}

		const result = await pool.query(
			`UPDATE projects_config 
       SET task_config = jsonb_set(
         task_config, 
         '{types}', 
         (task_config->'types') || $1::jsonb
       )
       WHERE project_id = $2
       RETURNING task_config`,
			[JSON.stringify({ name, color }), projectId],
		);

		if (result.rows.length === 0) {
			res.status(404).json({ error: "Proyecto no encontrado" });
			return;
		}

		res.json(result.rows[0].task_config);
	} catch (error) {
		console.error("Error al agregar tipo de tarea:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

export const removeTaskType = async (req: Request, res: Response) => {
	try {
		const { projectId, typeName } = req.params;

		const result = await pool.query(
			`UPDATE projects_config 
       SET task_config = jsonb_set(
         task_config, 
         '{types}', 
         (
           SELECT jsonb_agg(elem) 
           FROM jsonb_array_elements(task_config->'types') elem 
           WHERE elem->>'name' != $1
         )
       )
       WHERE project_id = $2
       RETURNING task_config`,
			[typeName, projectId],
		);

		if (result.rows.length === 0) {
			res.status(404).json({ error: "Proyecto no encontrado" });
			return;
		}

		res.json(result.rows[0].task_config);
	} catch (error) {
		console.error("Error al eliminar tipo de tarea:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

export const addTaskState = async (req: Request, res: Response) => {
	try {
		const { projectId } = req.params;
		const { name, color, requires_context = false } = req.body;

		if (!name || !color) {
			res.status(400).json({ error: "Nombre y color son requeridos" });
			return;
		}

		const result = await pool.query(
			`UPDATE projects_config 
       SET task_config = jsonb_set(
         task_config, 
         '{states}', 
         (task_config->'states') || $1::jsonb
       )
       WHERE project_id = $2
       RETURNING task_config`,
			[JSON.stringify({ name, color, requires_context }), projectId],
		);

		if (result.rows.length === 0) {
			res.status(404).json({ error: "Proyecto no encontrado" });
			return;
		}

		res.json(result.rows[0].task_config);
	} catch (error) {
		console.error("Error al agregar estado de tarea:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

export const removeTaskState = async (req: Request, res: Response) => {
	try {
		const { projectId, stateName } = req.params;

		const result = await pool.query(
			`UPDATE projects_config 
       SET task_config = jsonb_set(
         task_config, 
         '{states}', 
         (
           SELECT jsonb_agg(elem) 
           FROM jsonb_array_elements(task_config->'states') elem 
           WHERE elem->>'name' != $1
         )
       )
       WHERE project_id = $2
       RETURNING task_config`,
			[stateName, projectId],
		);

		if (result.rows.length === 0) {
			res.status(404).json({ error: "Proyecto no encontrado" });
			return;
		}

		res.json(result.rows[0].task_config);
	} catch (error) {
		console.error("Error al eliminar estado de tarea:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

export const addTaskPriority = async (req: Request, res: Response) => {
	try {
		const { projectId } = req.params;
		const { name, level, color } = req.body;

		if (!name || level === undefined || !color) {
			res.status(400).json({ error: "Nombre, nivel y color son requeridos" });
			return;
		}

		const result = await pool.query(
			`UPDATE projects_config 
       SET task_config = jsonb_set(
         task_config, 
         '{priorities}', 
         (task_config->'priorities') || $1::jsonb
       )
       WHERE project_id = $2
       RETURNING task_config`,
			[JSON.stringify({ name, level, color }), projectId],
		);

		if (result.rows.length === 0) {
			res.status(404).json({ error: "Proyecto no encontrado" });
			return;
		}

		res.json(result.rows[0].task_config);
	} catch (error) {
		console.error("Error al agregar prioridad de tarea:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
};

export const removeTaskPriority = async (req: Request, res: Response) => {
	try {
		const { projectId, priorityName } = req.params;

		const result = await pool.query(
			`UPDATE projects_config 
       SET task_config = jsonb_set(
         task_config, 
         '{priorities}', 
         (
           SELECT jsonb_agg(elem) 
           FROM jsonb_array_elements(task_config->'priorities') elem 
           WHERE elem->>'name' != $1
         )
       )
       WHERE project_id = $2
       RETURNING task_config`,
			[priorityName, projectId],
		);

		if (result.rows.length === 0) {
			res.status(404).json({ error: "Proyecto no encontrado" });
			return;
		}

		res.json(result.rows[0].task_config);
	} catch (error) {
		console.error("Error al eliminar prioridad de tarea:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
};
