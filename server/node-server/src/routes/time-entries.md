```ts
import { Router, type Request, type Response } from "express";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData } from "../controllers/users";

const router = Router();

type TimeEntryStatus = "running" | "paused" | "completed";

const VALID_STATUSES: TimeEntryStatus[] = ["running", "paused", "completed"];

const secondsBetween = (start: Date, end: Date) => {
 const diffMs = end.getTime() - start.getTime();
 return Math.max(0, Math.floor(diffMs / 1000));
};

const toDate = (value?: string | Date | null) => {
 if (!value) {
  return null;
 }
 const parsed = value instanceof Date ? value : new Date(value);
 if (Number.isNaN(parsed.getTime())) {
  return null;
 }
 return parsed;
};

const ensureTaskProjectConsistency = async (
 taskId: string | null,
 projectId: string | null,
): Promise<
 | { projectId: string | null }
 | { error: string; status: number }
> => {
 if (!taskId) {
  return { projectId };
 }

 const taskResult = await pool.query(
  "SELECT project_id FROM tasks WHERE id = $1",
  [taskId],
 );

 if (taskResult.rows.length === 0) {
  return { error: "Tarea no encontrada", status: 404 };
 }

 const taskProjectId = taskResult.rows[0].project_id as string;
 if (projectId && projectId !== taskProjectId) {
  return {
   error: "El proyecto no coincide con la tarea seleccionada",
   status: 400,
  };
 }

 return { projectId: taskProjectId };
};

const ensureNoOtherRunningEntry = async (userId: string, currentId?: string) => {
 const values: string[] = [userId];
 let query =
  "SELECT id FROM time_entries WHERE user_id = $1 AND status = 'running'";

 if (currentId) {
  values.push(currentId);
  query += ` AND id <> $${values.length}`;
 }

 query += " LIMIT 1";
 const running = await pool.query(query, values);
 return running.rows[0]?.id as string | undefined;
};

router.post("/", isAuthenticated, async (req: Request, res: Response) => {
 const user = getCurrentUserData(req);
 if (!user?.id) {
  res.status(401).json({ error: "Usuario no autenticado" });
  return;
 }

 const userId = String(user.id);


 const {
  project_id,
  task_id,
  description,
  start_time,
  end_time,
  duration_seconds,
  status,
 } = req.body as {
  project_id?: string | null;
  task_id?: string | null;
  description?: string | null;
  start_time?: string;
  end_time?: string | null;
  duration_seconds?: number | null;
  status?: TimeEntryStatus;
 };

 const normalizedStatus: TimeEntryStatus = status ?? "completed";
 if (!VALID_STATUSES.includes(normalizedStatus)) {
  res.status(400).json({ error: "Estado inválido" });
  return;
 }

 const startDate = toDate(start_time);
 if (!startDate) {
  res.status(400).json({ error: "start_time es requerido y debe ser válido" });
  return;
 }

 const endDate = toDate(end_time ?? null);
 if (end_time && !endDate) {
  res.status(400).json({ error: "end_time debe ser una fecha válida" });
  return;
 }

 if (endDate && endDate < startDate) {
  res
   .status(400)
   .json({ error: "end_time no puede ser anterior a start_time" });
  return;
 }

 if (
  duration_seconds !== undefined &&
  duration_seconds !== null &&
  (!Number.isInteger(duration_seconds) || duration_seconds < 0)
 ) {
  res.status(400).json({ error: "duration_seconds debe ser entero >= 0" });
  return;
 }

 const consistency = await ensureTaskProjectConsistency(
  task_id ?? null,
  project_id ?? null,
 );
 if ("error" in consistency) {
  res.status(consistency.status).json({ error: consistency.error });
  return;
 }

 if (normalizedStatus === "running") {
  const runningId = await ensureNoOtherRunningEntry(userId);
  if (runningId) {
   res.status(409).json({
    error: "Ya existe un cronómetro en ejecución",
    active_entry_id: runningId,
   });
   return;
  }
 }

 const computedDuration =
  duration_seconds ?? (endDate ? secondsBetween(startDate, endDate) : 0);

 if (normalizedStatus === "completed" && !endDate && duration_seconds == null) {
  res.status(400).json({
   error:
    "Para estado completed debes enviar end_time o duration_seconds",
  });
  return;
 }

 if (normalizedStatus !== "completed" && endDate) {
  res
   .status(400)
   .json({ error: "Solo registros completed pueden tener end_time" });
  return;
 }

 const now = new Date();
 const lastStartedAt = normalizedStatus === "running" ? now : null;

 try {
  const result = await pool.query(
   `INSERT INTO time_entries (
          user_id,
          project_id,
          task_id,
          start_time,
          end_time,
          duration_seconds,
          status,
          description,
          last_started_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
   [
    userId,
    consistency.projectId ?? null,
    task_id ?? null,
    startDate,
    normalizedStatus === "completed" ? endDate : null,
    computedDuration,
    normalizedStatus,
    description ?? null,
    lastStartedAt,
    now,
   ],
  );

  res.status(201).json(result.rows[0]);
 } catch (error) {
  console.error("Error al crear registro manual de tiempo:", error);
  res.status(500).json({ error: "Error al crear registro manual de tiempo" });
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
   res.status(400).json({ error: "Solo se pueden pausar entradas en ejecución" });
   return;
  }

  const now = new Date();
  const startTime = new Date(entry.start_time);
  const lastStartedAt = entry.last_started_at ? new Date(entry.last_started_at) : startTime;
  const additionalSeconds = secondsBetween(lastStartedAt, now);
  const totalDuration = (entry.duration_seconds || 0) + additionalSeconds;

  const result = await pool.query(
   `UPDATE time_entries 
       SET status = 'paused', duration_seconds = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
   [totalDuration, now, id],
  );

  res.json(result.rows[0]);
 } catch (error) {
  console.error("Error al pausar registro de tiempo:", error);
  res.status(500).json({ error: "Error al pausar registro de tiempo" });
 }
});

router.put("/:id/resume", isAuthenticated, async (req: Request, res: Response) => {
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
   res.status(400).json({ error: "Solo se pueden reanudar entradas pausadas" });
   return;
  }

  const now = new Date();

  const result = await pool.query(
   `UPDATE time_entries 
       SET status = 'running', last_started_at = $1, updated_at = $1
       WHERE id = $2
       RETURNING *`,
   [now, id],
  );

  res.json(result.rows[0]);
 } catch (error) {
  console.error("Error al reanudar registro de tiempo:", error);
  res.status(500).json({ error: "Error al reanudar registro de tiempo" });
 }
});

router.put("/:id/stop", isAuthenticated, async (req: Request, res: Response) => {
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
   res.status(400).json({ error: "La entrada ya está finalizada" });
   return;
  }

  const now = new Date();
  let totalDuration = entry.duration_seconds || 0;

  if (entry.status === "running" && entry.last_started_at) {
   const lastStartedAt = new Date(entry.last_started_at);
   const additionalSeconds = secondsBetween(lastStartedAt, now);
   totalDuration += additionalSeconds;
  }

  const result = await pool.query(
   `UPDATE time_entries 
       SET status = 'completed', 
           end_time = $1, 
           duration_seconds = $2, 
           last_started_at = NULL,
           updated_at = $1
       WHERE id = $3
       RETURNING *`,
   [now, totalDuration, id],
  );

  res.json(result.rows[0]);
 } catch (error) {
  console.error("Error al detener registro de tiempo:", error);
  res.status(500).json({ error: "Error al detener registro de tiempo" });
 }
});

router.delete("/:id", isAuthenticated, async (req: Request, res: Response) => {
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

  await pool.query("DELETE FROM time_entries WHERE id = $1", [id]);

  res.json({ message: "Registro eliminado" });
 } catch (error) {
  console.error("Error al eliminar registro de tiempo:", error);
  res.status(500).json({ error: "Error al eliminar registro de tiempo" });
 }
});

router.get("/", isAuthenticated, async (req: Request, res: Response) => {
 const user = getCurrentUserData(req);

 if (!user?.id) {
  res.status(401).json({ error: "Usuario no autenticado" });
  return;
 }

 const { project_id, task_id, status, active, include_team } = req.query as {
  project_id?: string;
  task_id?: string;
  status?: string;
  active?: string;
  include_team?: string;
 };

 try {
  const includeTeamEntries = include_team === "true";
  const values: Array<string> = [];
  const conditions: string[] = [];

  if (includeTeamEntries && project_id) {
   const accessResult = await pool.query(
    `SELECT 1
         FROM projects p
         LEFT JOIN resource_access ra
           ON ra.resource_type = 'project'
          AND ra.resource_id = p.id
          AND ra.user_id = $2
         WHERE p.id = $1
           AND (p.created_by = $2 OR ra.user_id IS NOT NULL)
         LIMIT 1`,
    [project_id, user.id],
   );

   if (accessResult.rows.length === 0) {
    res.status(403).json({
     error: "No tienes permisos para ver registros del proyecto",
    });
    return;
   }

   values.push(project_id);
   conditions.push(`te.project_id = $${values.length}`);
  } else {
   values.push(user.id);
   conditions.push(`te.user_id = $${values.length}`);
  }

  if (project_id && !(includeTeamEntries && project_id)) {
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
        t.project_task_number AS task_number,
        u.name AS worker_name,
        u.email AS worker_email
      FROM time_entries te
      LEFT JOIN projects p ON te.project_id = p.id
      LEFT JOIN tasks t ON te.task_id = t.id
      LEFT JOIN users u ON te.user_id = u.id
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
```
