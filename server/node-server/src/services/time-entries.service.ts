import { pool } from "../db";

export type TimeEntryStatus = "running" | "paused" | "completed";

const VALID_STATUSES: TimeEntryStatus[] = ["running", "paused", "completed"];

type TaskProjectConsistencyResult =
	| { projectId: string | null }
	| { error: string; status: number };

export class TimeEntriesServiceError extends Error {
	public readonly status: number;
	public readonly payload: Record<string, unknown>;

	constructor(status: number, payload: Record<string, unknown>) {
		super(String(payload.error ?? "Error"));
		this.status = status;
		this.payload = payload;
	}
}

interface TimeEntryRow {
	id: string;
	user_id: string;
	project_id: string | null;
	task_id: string | null;
	start_time: Date | string;
	end_time: Date | string | null;
	duration_seconds: number | null;
	status: TimeEntryStatus;
	description: string | null;
	last_started_at: Date | string | null;
	updated_at: Date | string;
}

export interface CreateTimeEntryInput {
	project_id?: string | null;
	task_id?: string | null;
	description?: string | null;
	start_time?: string;
	end_time?: string | null;
	duration_seconds?: number | null;
	status?: TimeEntryStatus;
}

export interface StartTimeEntryInput {
	project_id?: string | null;
	task_id?: string | null;
	description?: string | null;
}

export interface UpdateTimeEntryInput {
	project_id?: string | null;
	task_id?: string | null;
	description?: string | null;
	start_time?: string;
	end_time?: string | null;
	duration_seconds?: number | null;
	status?: TimeEntryStatus;
}

export interface ListTimeEntriesInput {
	project_id?: string;
	task_id?: string;
	status?: string;
	active?: string;
	include_team?: string;
}

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
): Promise<TaskProjectConsistencyResult> => {
	if (!taskId) {
		return { projectId };
	}

	const taskResult = await pool.query<{ project_id: string }>(
		"SELECT project_id FROM tasks WHERE id = $1",
		[taskId],
	);

	if (taskResult.rows.length === 0) {
		return { error: "Tarea no encontrada", status: 404 };
	}

	const taskProjectId = taskResult.rows[0].project_id;
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
	const running = await pool.query<{ id: string }>(query, values);
	return running.rows[0]?.id;
};

export class TimeEntriesService {
	public static async create(
		userId: string,
		input: CreateTimeEntryInput,
	): Promise<TimeEntryRow> {
		const {
			project_id,
			task_id,
			description,
			start_time,
			end_time,
			duration_seconds,
			status,
		} = input;

		const normalizedStatus: TimeEntryStatus = status ?? "completed";
		if (!VALID_STATUSES.includes(normalizedStatus)) {
			throw new TimeEntriesServiceError(400, { error: "Estado inválido" });
		}

		const startDate = toDate(start_time);
		if (!startDate) {
			throw new TimeEntriesServiceError(400, {
				error: "start_time es requerido y debe ser válido",
			});
		}

		const endDate = toDate(end_time ?? null);
		if (end_time && !endDate) {
			throw new TimeEntriesServiceError(400, {
				error: "end_time debe ser una fecha válida",
			});
		}

		if (endDate && endDate < startDate) {
			throw new TimeEntriesServiceError(400, {
				error: "end_time no puede ser anterior a start_time",
			});
		}

		if (
			duration_seconds !== undefined &&
			duration_seconds !== null &&
			(!Number.isInteger(duration_seconds) || duration_seconds < 0)
		) {
			throw new TimeEntriesServiceError(400, {
				error: "duration_seconds debe ser entero >= 0",
			});
		}

		const consistency = await ensureTaskProjectConsistency(
			task_id ?? null,
			project_id ?? null,
		);
		if ("error" in consistency) {
			throw new TimeEntriesServiceError(consistency.status, {
				error: consistency.error,
			});
		}

		if (normalizedStatus === "running") {
			const runningId = await ensureNoOtherRunningEntry(userId);
			if (runningId) {
				throw new TimeEntriesServiceError(409, {
					error: "Ya existe un cronómetro en ejecución",
					active_entry_id: runningId,
				});
			}
		}

		const computedDuration =
			duration_seconds ?? (endDate ? secondsBetween(startDate, endDate) : 0);

		if (normalizedStatus === "completed" && !endDate && duration_seconds == null) {
			throw new TimeEntriesServiceError(400, {
				error: "Para estado completed debes enviar end_time o duration_seconds",
			});
		}

		if (normalizedStatus !== "completed" && endDate) {
			throw new TimeEntriesServiceError(400, {
				error: "Solo registros completed pueden tener end_time",
			});
		}

		const now = new Date();
		const lastStartedAt = normalizedStatus === "running" ? now : null;

		const result = await pool.query<TimeEntryRow>(
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

		return result.rows[0];
	}

	public static async start(
		userId: string,
		input: StartTimeEntryInput,
	): Promise<TimeEntryRow> {
		const { project_id, task_id, description } = input;

		const runningId = await ensureNoOtherRunningEntry(userId);
		if (runningId) {
			throw new TimeEntriesServiceError(409, {
				error: "Ya existe un cronómetro en ejecución",
				active_entry_id: runningId,
			});
		}

		const consistency = await ensureTaskProjectConsistency(
			task_id ?? null,
			project_id ?? null,
		);
		if ("error" in consistency) {
			throw new TimeEntriesServiceError(consistency.status, {
				error: consistency.error,
			});
		}

		const now = new Date();
		const result = await pool.query<TimeEntryRow>(
			`INSERT INTO time_entries (user_id, project_id, task_id, start_time, status, description, duration_seconds, last_started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
			[
				userId,
				consistency.projectId ?? null,
				task_id ?? null,
				now,
				"running",
				description ?? null,
				0,
				now,
			],
		);

		return result.rows[0];
	}

	public static async update(
		userId: string,
		entryId: string,
		input: UpdateTimeEntryInput,
	): Promise<TimeEntryRow> {
		const {
			project_id,
			task_id,
			description,
			start_time,
			end_time,
			duration_seconds,
			status,
		} = input;

		if (status && !VALID_STATUSES.includes(status)) {
			throw new TimeEntriesServiceError(400, { error: "Estado inválido" });
		}

		const currentResult = await pool.query<TimeEntryRow>(
			"SELECT * FROM time_entries WHERE id = $1 AND user_id = $2",
			[entryId, userId],
		);

		if (currentResult.rows.length === 0) {
			throw new TimeEntriesServiceError(404, { error: "Registro no encontrado" });
		}

		const current = currentResult.rows[0];
		const nextStatus: TimeEntryStatus = status ?? current.status;
		const nextStartDate = toDate(start_time ?? current.start_time);
		const nextEndDate = toDate(
			end_time === undefined ? current.end_time : end_time,
		);

		if (!nextStartDate) {
			throw new TimeEntriesServiceError(400, { error: "start_time inválido" });
		}

		if (end_time && !nextEndDate) {
			throw new TimeEntriesServiceError(400, { error: "end_time inválido" });
		}

		if (nextEndDate && nextEndDate < nextStartDate) {
			throw new TimeEntriesServiceError(400, {
				error: "end_time no puede ser anterior a start_time",
			});
		}

		if (
			duration_seconds !== undefined &&
			duration_seconds !== null &&
			(!Number.isInteger(duration_seconds) || duration_seconds < 0)
		) {
			throw new TimeEntriesServiceError(400, {
				error: "duration_seconds debe ser entero >= 0",
			});
		}

		const nextTaskId = task_id === undefined ? current.task_id : task_id;
		const requestedProjectId =
			project_id === undefined ? current.project_id : project_id;
		const consistency = await ensureTaskProjectConsistency(
			nextTaskId,
			requestedProjectId,
		);
		if ("error" in consistency) {
			throw new TimeEntriesServiceError(consistency.status, {
				error: consistency.error,
			});
		}

		if (nextStatus === "running") {
			const runningId = await ensureNoOtherRunningEntry(userId, entryId);
			if (runningId) {
				throw new TimeEntriesServiceError(409, {
					error: "Ya existe un cronómetro en ejecución",
					active_entry_id: runningId,
				});
			}
		}

		if (nextStatus !== "completed" && nextEndDate) {
			throw new TimeEntriesServiceError(400, {
				error: "Solo registros completed pueden tener end_time",
			});
		}

		const nextDuration =
			duration_seconds ??
			(nextEndDate
				? secondsBetween(nextStartDate, nextEndDate)
				: current.duration_seconds ?? 0);

		const now = new Date();
		const updateResult = await pool.query<TimeEntryRow>(
			`UPDATE time_entries
        SET project_id = $1,
            task_id = $2,
            start_time = $3,
            end_time = $4,
            duration_seconds = $5,
            status = $6,
            description = $7,
            last_started_at = $8,
            updated_at = $9
        WHERE id = $10
        RETURNING *`,
			[
				consistency.projectId ?? null,
				nextTaskId,
				nextStartDate,
				nextStatus === "completed" ? nextEndDate : null,
				nextDuration,
				nextStatus,
				description === undefined ? current.description : description,
				nextStatus === "running" ? now : null,
				now,
				entryId,
			],
		);

		return updateResult.rows[0];
	}

	public static async pause(userId: string, entryId: string): Promise<TimeEntryRow> {
		const entryResult = await pool.query<TimeEntryRow>(
			"SELECT * FROM time_entries WHERE id = $1 AND user_id = $2",
			[entryId, userId],
		);

		if (entryResult.rows.length === 0) {
			throw new TimeEntriesServiceError(404, { error: "Registro no encontrado" });
		}

		const entry = entryResult.rows[0];
		if (entry.status !== "running") {
			throw new TimeEntriesServiceError(400, {
				error: "El cronómetro no está en ejecución",
			});
		}

		const now = new Date();
		const lastStartedAt = new Date(entry.last_started_at || entry.start_time);
		const additionalSeconds = secondsBetween(lastStartedAt, now);
		const durationSeconds = (entry.duration_seconds || 0) + additionalSeconds;

		const updateResult = await pool.query<TimeEntryRow>(
			`UPDATE time_entries
       SET status = 'paused',
           duration_seconds = $1,
           last_started_at = NULL,
           updated_at = $2
       WHERE id = $3
       RETURNING *`,
			[durationSeconds, now, entryId],
		);

		return updateResult.rows[0];
	}

	public static async resume(
		userId: string,
		entryId: string,
	): Promise<TimeEntryRow> {
		const entryResult = await pool.query<TimeEntryRow>(
			"SELECT * FROM time_entries WHERE id = $1 AND user_id = $2",
			[entryId, userId],
		);

		if (entryResult.rows.length === 0) {
			throw new TimeEntriesServiceError(404, { error: "Registro no encontrado" });
		}

		const entry = entryResult.rows[0];
		if (entry.status !== "paused") {
			throw new TimeEntriesServiceError(400, {
				error: "El cronómetro no está pausado",
			});
		}

		const runningId = await ensureNoOtherRunningEntry(userId, entryId);
		if (runningId) {
			throw new TimeEntriesServiceError(409, {
				error: "Ya existe un cronómetro en ejecución",
				active_entry_id: runningId,
			});
		}

		const now = new Date();
		const updateResult = await pool.query<TimeEntryRow>(
			`UPDATE time_entries
       SET status = 'running',
           last_started_at = $1,
           updated_at = $1
       WHERE id = $2
       RETURNING *`,
			[now, entryId],
		);

		return updateResult.rows[0];
	}

	public static async stop(userId: string, entryId: string): Promise<TimeEntryRow> {
		const entryResult = await pool.query<TimeEntryRow>(
			"SELECT * FROM time_entries WHERE id = $1 AND user_id = $2",
			[entryId, userId],
		);

		if (entryResult.rows.length === 0) {
			throw new TimeEntriesServiceError(404, { error: "Registro no encontrado" });
		}

		const entry = entryResult.rows[0];
		if (entry.status === "completed") {
			throw new TimeEntriesServiceError(400, {
				error: "El cronómetro ya está finalizado",
			});
		}

		const now = new Date();
		const lastStartedAt = new Date(entry.last_started_at || entry.start_time);
		const additionalSeconds =
			entry.status === "running" ? secondsBetween(lastStartedAt, now) : 0;
		const durationSeconds = (entry.duration_seconds || 0) + additionalSeconds;

		const updateResult = await pool.query<TimeEntryRow>(
			`UPDATE time_entries
       SET status = 'completed',
           duration_seconds = $1,
           end_time = $2,
           last_started_at = NULL,
           updated_at = $2
       WHERE id = $3
       RETURNING *`,
			[durationSeconds, now, entryId],
		);

		return updateResult.rows[0];
	}

	public static async list(userId: string, input: ListTimeEntriesInput) {
		const { project_id, task_id, status, active, include_team } = input;

		const includeTeamEntries = include_team === "true";
		const values: string[] = [];
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
				[project_id, userId],
			);

			if (accessResult.rows.length === 0) {
				throw new TimeEntriesServiceError(403, {
					error: "No tienes permisos para ver registros del proyecto",
				});
			}

			values.push(project_id);
			conditions.push(`te.project_id = $${values.length}`);
		} else {
			values.push(userId);
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
		return result.rows;
	}

	public static async remove(userId: string, entryId: string): Promise<void> {
		const entryResult = await pool.query<TimeEntryRow>(
			"SELECT * FROM time_entries WHERE id = $1 AND user_id = $2",
			[entryId, userId],
		);

		if (entryResult.rows.length === 0) {
			throw new TimeEntriesServiceError(404, { error: "Registro no encontrado" });
		}

		await pool.query("DELETE FROM time_entries WHERE id = $1", [entryId]);
	}
}
