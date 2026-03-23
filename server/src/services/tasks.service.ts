import { pool } from "../db";

type AssigneeInput = string | { id?: string | null } | null;

interface TaskRow {
	id: string;
	project_id: string;
	created_by: string;
	project_task_number: number;
}

interface AccessRow {
	task_id: string;
	project_created_by: string;
	task_created_by: string;
	has_access: boolean;
}

export interface CreateTaskInput {
	title?: string;
	project_id?: string;
	description?: string;
	priority?: string;
	type?: string;
	assignees?: AssigneeInput[];
	status?: string;
}

export interface UpdateTaskInput {
	title?: string;
	description?: string;
	priority?: string;
	type?: string;
	status?: string;
	assignees?: AssigneeInput[];
}

export interface GenerateTaskInput {
	prompt?: string;
	provider?: string;
	model?: string;
}

export class TasksServiceError extends Error {
	public readonly status: number;
	public readonly payload: Record<string, unknown>;

	constructor(status: number, payload: Record<string, unknown>) {
		super(String(payload.error ?? "Error"));
		this.status = status;
		this.payload = payload;
	}
}

const toAssigneeId = (value: AssigneeInput): string | null => {
	if (!value) return null;
	if (typeof value === "string") return value;
	return value.id ?? null;
};

const loadTaskWithAssignees = async (taskId: string) => {
	const createdTaskResult = await pool.query(
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
		[taskId],
	);

	return createdTaskResult.rows[0] ?? null;
};

export class TasksService {
	public static async getTasksByProject(projectId: string) {
		if (!projectId) {
			throw new TasksServiceError(400, { error: "Missing project_id" });
		}

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

		const result = await pool.query(query, [projectId]);
		return result.rows;
	}

	public static async createTask(userId: string, input: CreateTaskInput) {
		const {
			title,
			project_id,
			description,
			priority,
			type,
			assignees = [],
			status,
		} = input;

		if (!title || !project_id || !userId) {
			throw new TasksServiceError(400, { error: "Missing required fields" });
		}

		const client = await pool.connect();
		try {
			await client.query("BEGIN");

			const nextNumberResult = await client.query<{ next_number: number }>(
				`SELECT COALESCE(MAX(project_task_number), 0) + 1 AS next_number
         FROM tasks
         WHERE project_id = $1`,
				[project_id],
			);

			const nextTaskNumber = nextNumberResult.rows[0].next_number;

			const taskResult = await client.query<TaskRow>(
				`INSERT INTO tasks (title, project_id, description, priority, type, created_by, status, project_task_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *;`,
				[
					title,
					project_id,
					description,
					priority,
					type,
					userId,
					status || "active",
					nextTaskNumber,
				],
			);

			const newTask = taskResult.rows[0];

			for (const assignee of assignees) {
				const assigneeId = toAssigneeId(assignee);
				if (!assigneeId) continue;

				await client.query(
					"INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)",
					[newTask.id, assigneeId],
				);
			}

			await client.query("COMMIT");

			const createdTask = await loadTaskWithAssignees(newTask.id);
			return createdTask ?? newTask;
		} catch (err) {
			await client.query("ROLLBACK");
			throw err;
		} finally {
			client.release();
		}
	}

	public static async updateTask(taskId: string, input: UpdateTaskInput) {
		const {
			title,
			description,
			priority,
			type,
			status,
			assignees = [],
		} = input;

		if (!title) {
			throw new TasksServiceError(400, { error: "El título es obligatorio" });
		}

		const client = await pool.connect();
		try {
			await client.query("BEGIN");

			const updatedTaskResult = await client.query(
				`UPDATE tasks
         SET title = $1, description = $2, priority = $3, type = $4, status = $5
         WHERE id = $6
         RETURNING *;`,
				[title, description, priority, type, status, taskId],
			);

			if (updatedTaskResult.rowCount === 0) {
				await client.query("ROLLBACK");
				throw new TasksServiceError(404, { error: "Tarea no encontrada" });
			}

			await client.query("DELETE FROM task_assignees WHERE task_id = $1", [taskId]);

			for (const assignee of assignees) {
				const assigneeId = toAssigneeId(assignee);
				if (!assigneeId) continue;

				await client.query(
					"INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)",
					[taskId, assigneeId],
				);
			}

			await client.query("COMMIT");
			return updatedTaskResult.rows[0];
		} catch (err) {
			await client.query("ROLLBACK");
			throw err;
		} finally {
			client.release();
		}
	}

	public static async deleteTask(
		taskId: string,
		userId: string,
		userPrivileges?: string | null,
	) {
		const accessResult = await pool.query<AccessRow>(
			`SELECT
         t.id AS task_id,
         p.created_by AS project_created_by,
         t.created_by AS task_created_by,
         EXISTS(
           SELECT 1
           FROM resource_access ra
           WHERE ra.resource_type = 'project'
             AND ra.resource_id = p.id
             AND ra.user_id = $2
         ) AS has_access
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1`,
			[taskId, userId],
		);

		if (accessResult.rowCount === 0) {
			throw new TasksServiceError(404, { error: "Tarea no encontrada" });
		}

		const access = accessResult.rows[0];
		const isAdmin = userPrivileges === "admin";
		const canDelete =
			isAdmin ||
			access.project_created_by === userId ||
			access.task_created_by === userId ||
			access.has_access;

		if (!canDelete) {
			throw new TasksServiceError(403, {
				error: "No tienes permisos para eliminar esta tarea",
			});
		}

		await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
	}
}
