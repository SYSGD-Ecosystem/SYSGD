import { pool } from "../db";
import { decryptField, encryptField } from "./field-encryption.service";

/** Tarea con título/descripción descifrados para la respuesta. */
const decryptTaskRow = <T extends { title?: unknown; description?: unknown }>(
	row: T,
): T => ({
	...row,
	title: typeof row.title === "string" ? decryptField(row.title) : row.title,
	description:
		typeof row.description === "string"
			? decryptField(row.description)
			: row.description,
});

type AssigneeInput = string | { id?: string | null } | null;

interface TaskRow {
	id: string;
	project_id: string;
	created_by: string;
	project_task_number: number;
	visibility: string;
}

interface ProjectMembership {
	isMember: boolean;
	isOwner: boolean;
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
	/** 'public' (defecto) | 'private'. */
	visibility?: string;
	/** Acceso explícito (solo con private): ids de miembros del proyecto. */
	visible_to?: string[];
}

export interface UpdateTaskInput {
	title?: string;
	description?: string;
	priority?: string;
	type?: string;
	status?: string;
	assignees?: AssigneeInput[];
	visibility?: string;
	visible_to?: string[];
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

const visibleToAgg = `COALESCE(
          (
            SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email))
            FROM task_visible_to tv
            JOIN users u ON u.id = tv.user_id
            WHERE tv.task_id = t.id
          ),
          '[]'::json
        ) AS visible_to`;

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
       ) AS assignees,
       ${visibleToAgg}
     FROM tasks t
     WHERE t.id = $1`,
		[taskId],
	);

	const row = createdTaskResult.rows[0] ?? null;
	return row ? decryptTaskRow(row) : null;
};

/** Membresía del usuario en el proyecto (null si el proyecto no existe). */
const getProjectMembership = async (
	projectId: string,
	userId: string,
): Promise<ProjectMembership | null> => {
	const { rows } = await pool.query<{ created_by: string }>(
		"SELECT created_by FROM projects WHERE id = $1",
		[projectId],
	);
	if (rows.length === 0) return null;
	if (rows[0].created_by === userId) return { isMember: true, isOwner: true };
	const member = await pool.query(
		`SELECT 1 FROM resource_access
		  WHERE resource_type = 'project' AND resource_id = $1 AND user_id = $2`,
		[projectId, userId],
	);
	return { isMember: (member.rowCount ?? 0) > 0, isOwner: false };
};

const isProjectMemberId = async (
	client: { query: typeof pool.query },
	projectId: string,
	userId: string,
): Promise<boolean> => {
	const { rows } = await client.query<{ created_by: string }>(
		"SELECT created_by FROM projects WHERE id = $1",
		[projectId],
	);
	if (rows.length === 0) return false;
	if (rows[0].created_by === userId) return true;
	const member = await client.query(
		`SELECT 1 FROM resource_access
		  WHERE resource_type = 'project' AND resource_id = $1 AND user_id = $2`,
		[projectId, userId],
	);
	return (member.rowCount ?? 0) > 0;
};

/**
 * ¿Puede U ver la tarea? Admin y dueño siempre. Si no: creador, pública de su
 * proyecto, o privada con acceso explícito/asignación.
 */
const canSeeTask = async (
	taskId: string,
	userId: string,
	isAdmin: boolean,
): Promise<{ visible: boolean; isOwner: boolean; isCreator: boolean }> => {
	const { rows } = await pool.query<{
		visibility: string;
		created_by: string;
		project_created_by: string;
		project_id: string;
	}>(
		`SELECT t.visibility, t.created_by, p.created_by AS project_created_by, t.project_id
		   FROM tasks t JOIN projects p ON p.id = t.project_id
		  WHERE t.id = $1`,
		[taskId],
	);
	if (rows.length === 0) return { visible: false, isOwner: false, isCreator: false };
	const task = rows[0];
	const isOwner = task.project_created_by === userId;
	const isCreator = task.created_by === userId;
	if (isAdmin || isOwner || isCreator) {
		return { visible: true, isOwner, isCreator };
	}
	const membership = await getProjectMembership(task.project_id, userId);
	if (!membership?.isMember) return { visible: false, isOwner, isCreator };
	if ((task.visibility ?? "public") === "public") {
		return { visible: true, isOwner, isCreator };
	}
	const granted = await pool.query(
		`SELECT 1 FROM task_visible_to WHERE task_id = $1 AND user_id = $2
		  UNION
		 SELECT 1 FROM task_assignees WHERE task_id = $1 AND user_id = $2
		  LIMIT 1`,
		[taskId, userId],
	);
	return { visible: (granted.rowCount ?? 0) > 0, isOwner, isCreator };
};

const normalizeVisibility = (value: unknown): "public" | "private" => {
	if (value === "private") return "private";
	if (value === undefined || value === null || value === "public") return "public";
	throw new TasksServiceError(400, { error: "visibility debe ser public o private" });
};

export class TasksService {
	public static async getTasksByProject(
		projectId: string,
		userId: string,
		isAdmin = false,
	) {
		if (!projectId) {
			throw new TasksServiceError(400, { error: "Missing project_id" });
		}
		if (!userId) {
			throw new TasksServiceError(401, { error: "Usuario no autenticado" });
		}

		const assigneesAgg = `COALESCE(
          (
            SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email))
            FROM task_assignees ta
            JOIN users u ON ta.user_id = u.id
            WHERE ta.task_id = t.id
          ),
          '[]'::json
        ) AS assignees`;

		if (isAdmin) {
			const result = await pool.query(
				`SELECT t.*, ${assigneesAgg}, ${visibleToAgg} FROM tasks t
				  WHERE t.project_id = $1 ORDER BY t.project_task_number ASC`,
				[projectId],
			);
			return result.rows.map(decryptTaskRow);
		}

		const membership = await getProjectMembership(projectId, userId);
		// Sin membresía no hay tareas (cierra lectura cruzada entre proyectos).
		if (!membership?.isMember) return [];

		if (membership.isOwner) {
			const result = await pool.query(
				`SELECT t.*, ${assigneesAgg}, ${visibleToAgg} FROM tasks t
				  WHERE t.project_id = $1 ORDER BY t.project_task_number ASC`,
				[projectId],
			);
			return result.rows.map(decryptTaskRow);
		}

		const result = await pool.query(
			`SELECT t.*, ${assigneesAgg}, ${visibleToAgg} FROM tasks t
			  WHERE t.project_id = $1
			    AND (
			      t.created_by = $2
			      OR COALESCE(t.visibility, 'public') = 'public'
			      OR EXISTS (
			        SELECT 1 FROM task_visible_to tv
			        WHERE tv.task_id = t.id AND tv.user_id = $2
			      )
			      OR EXISTS (
			        SELECT 1 FROM task_assignees ta
			        WHERE ta.task_id = t.id AND ta.user_id = $2
			      )
			    )
			  ORDER BY t.project_task_number ASC`,
			[projectId, userId],
		);
		return result.rows.map(decryptTaskRow);
	}

	public static async createTask(
		userId: string,
		input: CreateTaskInput,
		isAdmin = false,
	) {
		const {
			title,
			project_id,
			description,
			priority,
			type,
			assignees = [],
			status,
			visible_to = [],
		} = input;

		if (!title || !project_id || !userId) {
			throw new TasksServiceError(400, { error: "Missing required fields" });
		}

		const visibility = normalizeVisibility(input.visibility);

		const client = await pool.connect();
		try {
			await client.query("BEGIN");

		 const membership = await getProjectMembership(project_id, userId);
			if (!membership?.isMember && !isAdmin) {
				await client.query("ROLLBACK");
				throw new TasksServiceError(403, {
					error: "No perteneces a este proyecto",
				});
			}

			if (visibility === "private") {
				for (const rawId of visible_to) {
					const memberId = typeof rawId === "string" ? rawId : toAssigneeId(rawId as AssigneeInput);
					if (!memberId) continue;
					const ok = await isProjectMemberId(client, project_id, memberId);
					if (!ok) {
						await client.query("ROLLBACK");
						throw new TasksServiceError(400, {
							error: "Solo miembros del proyecto pueden tener acceso a una tarea privada",
						});
					}
				}
			}

			const nextNumberResult = await client.query<{ next_number: number }>(
				`SELECT COALESCE(MAX(project_task_number), 0) + 1 AS next_number
         FROM tasks
         WHERE project_id = $1`,
				[project_id],
			);

			const nextTaskNumber = nextNumberResult.rows[0].next_number;

			const taskResult = await client.query<TaskRow>(
				`INSERT INTO tasks (title, project_id, description, priority, type, created_by, status, project_task_number, visibility)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *;`,
				[
					encryptField(title),
					project_id,
					encryptField(description),
					priority,
					type,
					userId,
					status || "active",
					nextTaskNumber,
					visibility,
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

			if (visibility === "private") {
				for (const rawId of visible_to) {
					const memberId = typeof rawId === "string" ? rawId : toAssigneeId(rawId as AssigneeInput);
					if (!memberId) continue;
					await client.query(
						`INSERT INTO task_visible_to (task_id, user_id) VALUES ($1, $2)
						 ON CONFLICT DO NOTHING`,
						[newTask.id, memberId],
					);
				}
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

	public static async updateTask(
		taskId: string,
		input: UpdateTaskInput,
		userId: string,
		isAdmin = false,
	) {
		if (!userId) {
			throw new TasksServiceError(401, { error: "Usuario no autenticado" });
		}

		// 404 si no existe O no es visible (no se revela existencia por ID).
		const gate = await canSeeTask(taskId, userId, isAdmin);
		if (!gate.visible) {
			throw new TasksServiceError(404, { error: "Tarea no encontrada" });
		}

		const wantsVisibilityChange =
			input.visibility !== undefined || input.visible_to !== undefined;
		if (wantsVisibilityChange && !isAdmin && !gate.isOwner && !gate.isCreator) {
			throw new TasksServiceError(403, {
				error: "Solo el dueño, el creador o un admin cambian la confidencialidad",
			});
		}

		const campos: string[] = [];
		const valores: unknown[] = [];

		const agregar = (columna: string, valor: unknown) => {
			if (valor === undefined) return;
			valores.push(valor);
			campos.push(`${columna} = $${valores.length}`);
		};

		if (input.title !== undefined && !input.title) {
			throw new TasksServiceError(400, { error: "El título no puede quedar vacío" });
		}

		agregar(
			"title",
			input.title === undefined ? undefined : encryptField(input.title),
		);
		agregar(
			"description",
			input.description === undefined ? undefined : encryptField(input.description),
		);
		agregar("priority", input.priority);
		agregar("type", input.type);
		agregar("status", input.status);
		if (input.visibility !== undefined) {
			agregar("visibility", normalizeVisibility(input.visibility));
		}

		const { assignees, visible_to } = input;

		if (campos.length === 0 && !Array.isArray(assignees) && !Array.isArray(visible_to)) {
			throw new TasksServiceError(400, {
				error: "No se envió ningún campo para actualizar",
			});
		}

		valores.push(taskId);

		const client = await pool.connect();
		try {
			await client.query("BEGIN");

			if (campos.length > 0) {
				const updatedTaskResult = await client.query(
					`UPDATE tasks
           SET ${campos.join(", ")}
           WHERE id = $${valores.length}
           RETURNING *;`,
					valores,
				);

				if (updatedTaskResult.rowCount === 0) {
					await client.query("ROLLBACK");
					throw new TasksServiceError(404, { error: "Tarea no encontrada" });
				}
			}

			if (Array.isArray(assignees)) {
				await client.query("DELETE FROM task_assignees WHERE task_id = $1", [
					taskId,
				]);

				for (const assignee of assignees) {
					const assigneeId = toAssigneeId(assignee);
					if (!assigneeId) continue;

					await client.query(
						"INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)",
						[taskId, assigneeId],
					);
				}
			}

			if (Array.isArray(visible_to)) {
				const taskProject = await client.query<{ project_id: string }>(
					"SELECT project_id FROM tasks WHERE id = $1",
					[taskId],
				);
				const projectId = taskProject.rows[0]?.project_id ?? "";
				for (const rawId of visible_to) {
					const memberId = typeof rawId === "string" ? rawId : toAssigneeId(rawId as AssigneeInput);
					if (!memberId) continue;
					const ok = await isProjectMemberId(client, projectId, memberId);
					if (!ok) {
						await client.query("ROLLBACK");
						throw new TasksServiceError(400, {
							error: "Solo miembros del proyecto pueden tener acceso a una tarea privada",
						});
					}
				}
				await client.query("DELETE FROM task_visible_to WHERE task_id = $1", [
					taskId,
				]);
				for (const rawId of visible_to) {
					const memberId = typeof rawId === "string" ? rawId : toAssigneeId(rawId as AssigneeInput);
					if (!memberId) continue;
					await client.query(
						`INSERT INTO task_visible_to (task_id, user_id) VALUES ($1, $2)
						 ON CONFLICT DO NOTHING`,
						[taskId, memberId],
					);
				}
			}

			await client.query("COMMIT");
			return loadTaskWithAssignees(taskId);
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

		// Privada e invisible: 404 (no se revela existencia por ID).
		if (!isAdmin) {
			const gate = await canSeeTask(taskId, userId, false);
			if (!gate.visible) {
				throw new TasksServiceError(404, { error: "Tarea no encontrada" });
			}
		}

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
