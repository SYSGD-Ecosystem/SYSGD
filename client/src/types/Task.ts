export type Assignee = {
	id: string;
	name: string;
	email: string;
};

export type Task = {
	id: string;
	created_at: string;
	type: string;
	priority: string;
	title: string;
	description?: string;
	status: string;
	assignees: Assignee[];
	project_id: string;
	project_task_number?: number;
	created_by?: string;
	/** public (defecto) | private. Las privadas solo las ven dueño, creador, asignados y visible_to. */
	visibility?: "public" | "private";
	/** Acceso explícito a la tarea privada. */
	visible_to?: Assignee[];
};
