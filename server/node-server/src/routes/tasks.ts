import { Router, type Request, type Response } from "express";
import { pool } from "../index";
import { isAuthenticated } from "../middlewares/auth";

const router = Router();

router.post("/", isAuthenticated, async (req: Request, res: Response) => {
  const { title, project_id, description, priority, type, assignees = [], status } = req.body;
  console.log(req.body)
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
      [project_id]
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
        [newTask.id, userId]
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

router.get("/:project_id", isAuthenticated, async (req: Request, res: Response) => {

  const { project_id } = req.params;

  if (!project_id) {
    res.status(400).json({ error: "Missing project_id" });
    return;
  }

  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at",
      [project_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error getting tasks:", err);
    res.status(500).json({ error: "Error getting tasks" });
  }
});

export default router;
