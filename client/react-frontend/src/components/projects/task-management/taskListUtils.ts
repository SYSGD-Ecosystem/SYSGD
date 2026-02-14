import type { Task } from "@/types/Task";
import type { TaskConfig } from "./hooks/useTaskConfig";

export type SortField = "status" | "created_at" | "due_date" | "name";
export type SortDirection = "asc" | "desc";
export type GroupBy = "none" | "type" | "category" | "assignee";

export type TaskListPreferences = {
	searchTerm: string;
	assignee: string;
	type: string;
	priority: string;
	status: string;
	hiddenStatuses: string[];
	sortField: SortField;
	sortDirection: SortDirection;
	groupBy: GroupBy;
	collapsedGroups: string[];
};

const DEFAULT_PREFERENCES: TaskListPreferences = {
	searchTerm: "",
	assignee: "todos",
	type: "todos",
	priority: "todos",
	status: "todos",
	hiddenStatuses: [],
	sortField: "status",
	sortDirection: "asc",
	groupBy: "none",
	collapsedGroups: [],
};

export const getDefaultTaskPreferences = (): TaskListPreferences => ({
	...DEFAULT_PREFERENCES,
	hiddenStatuses: [],
	collapsedGroups: [],
});

type TaskWithExtras = Task & { due_date?: string; category?: string };

const normalizeDate = (value?: string) => {
	if (!value) return Number.POSITIVE_INFINITY;
	const time = new Date(value).getTime();
	return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
};

const compareText = (a: string, b: string) =>
	a.localeCompare(b, "es", { sensitivity: "base" });

const getTaskAssigneeText = (task: Task) =>
	task.assignees?.map((assignee) => assignee.name).join(", ") || "Sin asignar";

const getGroupValue = (task: TaskWithExtras, groupBy: GroupBy) => {
	switch (groupBy) {
		case "type":
			return task.type || "Sin tipo";
		case "category":
			return task.category || "Sin categoría";
		case "assignee":
			return getTaskAssigneeText(task);
		default:
			return "Todas las tareas";
	}
};

const buildStatusIndex = (config?: TaskConfig | null) => {
	const statusOrder = config?.states?.map((state) => state.name) || [];
	return new Map(statusOrder.map((status, index) => [status, index]));
};

export const filterTasks = (tasks: Task[], preferences: TaskListPreferences) => {
	return tasks.filter((task) => {
		const lowerSearch = preferences.searchTerm.trim().toLowerCase();
		const matchesSearch =
			!lowerSearch || task.title.toLowerCase().includes(lowerSearch);
		const matchesAssignee =
			preferences.assignee === "todos" ||
			(task.assignees || []).some((a) => a.name === preferences.assignee);
		const matchesType =
			preferences.type === "todos" || task.type === preferences.type;
		const matchesPriority =
			preferences.priority === "todos" || task.priority === preferences.priority;
		const matchesStatus =
			preferences.status === "todos" || task.status === preferences.status;
		const isVisibleStatus = !preferences.hiddenStatuses.includes(task.status);

		return (
			matchesSearch &&
			matchesAssignee &&
			matchesType &&
			matchesPriority &&
			matchesStatus &&
			isVisibleStatus
		);
	});
};

export const sortTasks = (
	tasks: Task[],
	preferences: TaskListPreferences,
	config?: TaskConfig | null,
) => {
	const sorted = [...tasks];
	const statusIndex = buildStatusIndex(config);

	sorted.sort((leftTask, rightTask) => {
		const left = leftTask as TaskWithExtras;
		const right = rightTask as TaskWithExtras;

		let result = 0;

		switch (preferences.sortField) {
			case "status": {
				const leftIndex = statusIndex.get(left.status) ?? Number.MAX_SAFE_INTEGER;
				const rightIndex = statusIndex.get(right.status) ?? Number.MAX_SAFE_INTEGER;
				result = leftIndex - rightIndex;
				if (result === 0) {
					result = compareText(left.title, right.title);
				}
				break;
			}
			case "created_at":
				result = normalizeDate(left.created_at) - normalizeDate(right.created_at);
				break;
			case "due_date":
				result = normalizeDate(left.due_date) - normalizeDate(right.due_date);
				break;
			case "name":
				result = compareText(left.title, right.title);
				break;
			default:
				result = 0;
		}

		if (result === 0) {
			result = normalizeDate(left.created_at) - normalizeDate(right.created_at);
		}

		return preferences.sortDirection === "asc" ? result : -result;
	});

	return sorted;
};

export type TaskGroup = {
	key: string;
	label: string;
	tasks: Task[];
	isCollapsed: boolean;
};

export const groupTasks = (
	tasks: Task[],
	preferences: TaskListPreferences,
): TaskGroup[] => {
	if (preferences.groupBy === "none") {
		return [
			{
				key: "all",
				label: "Todas las tareas",
				tasks,
				isCollapsed: false,
			},
		];
	}

	const grouped = new Map<string, Task[]>();

	for (const task of tasks) {
		const taskWithExtras = task as TaskWithExtras;
		const label = getGroupValue(taskWithExtras, preferences.groupBy);
		if (!grouped.has(label)) {
			grouped.set(label, []);
		}
		grouped.get(label)?.push(task);
	}

	return [...grouped.entries()]
		.sort(([a], [b]) => compareText(a, b))
		.map(([label, groupTasks]) => ({
			key: label,
			label,
			tasks: groupTasks,
			isCollapsed: preferences.collapsedGroups.includes(label),
		}));
};

export const TASK_LIST_STORAGE_KEY = "task-management-preferences";

export const loadTaskPreferences = (
	projectId: string,
): TaskListPreferences => {
	if (typeof window === "undefined") return getDefaultTaskPreferences();

	try {
		const raw = localStorage.getItem(`${TASK_LIST_STORAGE_KEY}:${projectId}`);
		if (!raw) return getDefaultTaskPreferences();
		const parsed = JSON.parse(raw) as Partial<TaskListPreferences>;
		return {
			...getDefaultTaskPreferences(),
			...parsed,
			hiddenStatuses: parsed.hiddenStatuses || [],
			collapsedGroups: parsed.collapsedGroups || [],
		};
	} catch {
		return getDefaultTaskPreferences();
	}
};

export const saveTaskPreferences = (
	projectId: string,
	preferences: TaskListPreferences,
) => {
	if (typeof window === "undefined") return;

	localStorage.setItem(
		`${TASK_LIST_STORAGE_KEY}:${projectId}`,
		JSON.stringify(preferences),
	);
};
